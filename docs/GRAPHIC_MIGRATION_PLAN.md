# Graphic Migration Plan — Procedural → Hand-Drawn

Living plan for replacing every procedurally-generated **sprite** texture with a hand-drawn asset,
one at a time, with zero gameplay-code churn. Stage maps (backgrounds/ground tiles) stay procedural.

## Goal & Scope

Today, all sprite art is drawn at runtime in [`src/scenes/BootScene.ts`](../src/scenes/BootScene.ts)
via `Phaser.GameObjects.Graphics` and baked into named textures with `generateTexture(key, w, h)`.
Game code references those textures **only by key** (e.g. `this.add.sprite(x, y, 'player_0')`,
`this.physics.add.sprite(x, y, 'amoeba')`). That indirection is what makes this migration cheap: if
we load a PNG under the **same key and same dimensions**, every sprite, body, animation, and tween
keeps working untouched.

**In scope (replace with hand-drawn):** player frames, M.E.G., all enemies, all bosses, all atoms,
hit/projectile/particle effects.

**Out of scope (stays procedural):**
- **Stage maps** — `bg_tile_1..3`, `ground_tile_1..3` (the parallax background + ground tiles in
  `_makeBackground`). Explicitly excluded per the brief.
- **The vignette** — `vignette` is a screen-space radial gradient, not art.
- **Runtime vector FX** — the many `this.add.graphics()` effects drawn live in
  [`Player.ts`](../src/entities/Player.ts) and [`GameScene.ts`](../src/scenes/GameScene.ts) (player
  arms, speed-boost aura, death cracks, slashes, splash, attack rings, HUD bars, scene UI panels).
  These are animated vector overlays, not static textures, and aren't part of this pass. Revisit
  separately if desired (see "Later: vector FX").

## File Format Decision

**Use PNG (32-bit RGBA, straight alpha).** Rationale:

| Option | Verdict |
|--------|---------|
| **PNG** | ✅ Chosen. Lossless, per-pixel alpha (every sprite needs a soft transparent edge), universal browser + Phaser support, trivial drop-in via `this.load.image`. |
| WebP | Smaller files, but lossy alpha artifacts on soft edges and no upside at these tiny asset sizes. Not worth it. |
| SVG | Phaser rasterizes on load; great for crisp UI vectors but a poor fit for organic, painterly hand-drawn creatures. |
| Sprite atlas (PNG + JSON) | The right *destination* once art stabilizes (one HTTP request, packed). Premature now — start as individual PNGs, pack later with zero code change (atlas frame names == current keys). |

### Authoring resolution (important)

The current textures are tiny (e.g. `player_0` is 40×74, `spore` is 36×36). Hand-drawn art wants more
pixels. To stay a **pure drop-in with no code changes**, the shipped PNG for each key must match the
**canonical dimensions** in the inventory below exactly — Phaser places sprites by origin and sizes
arcade bodies from texture dimensions, so a same-size PNG swaps in invisibly.

Recommended pipeline:
1. **Author at 4× supersample** (e.g. paint `player_0` on a 160×296 canvas) for clean linework.
2. **Export down to the canonical size** as the shipped `@1x` PNG. This is the drop-in.
3. Keep the 4× master in `art-src/` (not bundled) so we can re-export if we later do an HD pass.

> **Optional future HD pass (not part of this migration):** to actually *show* more detail we'd bump
> the render footprint — either raise `GAME_WIDTH`/`GAME_HEIGHT` or ship `@2x` PNGs and apply a global
> `setScale(0.5)`. That touches call sites and is deferred. For now: exact-size PNGs, looks identical
> in footprint, just hand-painted instead of procedural.

## Directory Layout

Vite serves [`public/`](../public) at the site root, so `public/assets/...` loads from `/assets/...`
with no bundler config. Create:

```
public/
  assets/
    sprites/
      player/        player_0.png player_1.png player_2.png player_jump.png
      npc/           meg.png
      enemies/       bacterium.png virus.png dustbunny.png pollen.png amoeba.png spore.png mite.png
      bosses/        boss_bacterium.png boss_amoeba.png boss_phage.png
      atoms/         atom_hydrogen.png atom_oxygen.png atom_carbon.png atom_nitrogen.png
                     atom_mystery.png atom_node.png atom_gold.png
      fx/            fx_hit.png projectile.png particle.png
art-src/             # 4× master files, NOT shipped (gitignored or kept out of public/)
```

## Migration Mechanics (per asset)

**The pipeline is built (Phase 1).** Swapping an asset is now a two-line change:

1. Drop the PNG into the right `public/assets/sprites/...` folder at the **canonical size**.
2. Flip that key's `migrated: false` → `true` in the `ASSET_SPECS` manifest at the top of
   [`src/scenes/BootScene.ts`](../src/scenes/BootScene.ts).

That's it. `preload()` loads every `migrated` PNG; the procedural `_makeXxx()` for that key then
**no-ops** because `_g()._done` skips `generateTexture` when the texture already exists. Keys and
sizes are preserved, so **no edits are needed** anywhere else — `Player.ts`, `Enemy.ts`, `Boss.ts`,
`Atom.ts`, `GameScene.ts`, `HUDScene.ts` all reference textures by key and keep working.

**Why this is safe:**
- **Animations untouched.** `player_walk`/`player_idle`/`player_jump` are built in `create()` from the
  frame keys `player_0..2`/`player_jump`; whether those come from PNG or procedural art is invisible
  to `anims.create(...)`.
- **Graceful fallback.** If a flagged PNG is missing/404s, the loader logs a warning and the
  procedural texture is generated instead — the game never breaks mid-migration.
- **Easy rollback.** Flip the flag back to `false`. Keep the `_makeXxx()` methods until a whole group
  is confirmed, then delete them in the Phase-8 cleanup.

Verify in-game (run the dev server, eyeball the sprite + its hitbox), then commit that one asset.

## Asset Inventory & Checklist

Canonical dimensions are the `generateTexture(key, w, h)` values in `BootScene` today. Replace top to
bottom (most-visible first). Check off as each PNG lands.

### Player (multi-frame + animations)
- [ ] `player_0` — 40×74 — idle / walk frame A
- [ ] `player_1` — 40×74 — walk frame B
- [ ] `player_2` — 40×74 — walk frame C
- [ ] `player_jump` — 40×74 — jump pose
  - Frames feed `player_walk` (0,1,2,1 @ 8fps), `player_idle` (0), `player_jump`. Keep all four the
    same canvas size and origin so the walk cycle doesn't jitter.

### NPC
- [ ] `meg` — 50×54 — M.E.G. tutorial guide (also tweened/bobbing at runtime; static texture only)

### Enemies
- [ ] `bacterium` — 40×82
- [ ] `virus` — 44×54
- [ ] `dustbunny` — 48×62
- [ ] `pollen` — 44×58
- [ ] `amoeba` — 56×64
- [ ] `spore` — 36×36
- [ ] `mite` — 48×46

### Bosses
- [ ] `boss_bacterium` — 96×160
- [ ] `boss_amoeba` — 96×160
- [ ] `boss_phage` — 96×160

### Atoms (40×40 each — keep a consistent visual system across the set)
- [ ] `atom_hydrogen`
- [ ] `atom_oxygen`
- [ ] `atom_carbon`
- [ ] `atom_nitrogen`
- [ ] `atom_mystery`
- [ ] `atom_node` — generic "choice" node
- [ ] `atom_gold` — rare wildcard

### Effects
- [ ] `fx_hit` — 40×40 — hit-flash star
- [ ] `projectile` — 16×16 — used for player + enemy projectiles (tinted at runtime, so the art should
  be near-white/neutral to tint cleanly)
- [ ] `particle` — 6×6 — generic particle quad (tinted at runtime; keep it a soft white dot/square)

### Excluded (do **not** replace)
- `bg_tile_1..3`, `ground_tile_1..3` — stage maps (procedural, by design).
- `vignette` — screen effect.

## Placeholders

Until final art exists, ship a placeholder PNG **at the canonical size** for each key so the loading
path is exercised end-to-end and the migration can proceed asset-by-asset without waiting on art.

**Strategy A — "snapshot" placeholders (implemented).** A dev-only exporter lives in `BootScene`,
triggered by the `?exportTextures` query param. It generates the procedural art as usual, then for
each in-scope key draws `this.textures.get(key).getSourceImage()` to a canvas and downloads it as
`<key>.png`. Run it once with an empty manifest to capture pixel-identical placeholders, sort them
into `public/assets/sprites/...`, and flip the `migrated` flags.

To generate them:

```
npm run dev      # then open:
http://localhost:5173/?exportTextures
```

(See [`public/assets/sprites/README.md`](../public/assets/sprites/README.md) for the key→folder map.)
Because the loader falls back to procedural art for any un-migrated/missing key, populating
placeholders is optional — the pipeline is already live and the game looks identical until real art
lands.

## Phased Execution Order

1. **Plumbing + placeholders.** ✅ **DONE.** Created `public/assets/sprites/...` tree; added the
   `ASSET_SPECS` manifest + `preload()` PNG loading + procedural fallback (`_done` skips already-loaded
   keys) + the `?exportTextures` snapshot exporter in `BootScene`. Manifest starts empty, so the game
   is visually identical. Typecheck/lint/build green. *(Optional follow-up: run `?exportTextures` to
   populate Strategy-A placeholders and flip the flags.)*
2. **Player** (4 frames) — most-visible, validates the multi-frame/animation path.
3. **Enemies** (7) — highest on-screen volume.
4. **Bosses** (3) — biggest, highest-impact set pieces.
5. **Atoms** (7) — design as a cohesive set so element identity stays readable.
6. **M.E.G.** (1).
7. **Effects** (3) — mind runtime tinting on `projectile`/`particle`.
8. **Cleanup.** Delete the now-unused `_makeXxx()` methods from `BootScene`; keep only the stage-map,
   vignette, and any FX generators. Consider packing PNGs into a single atlas (keys unchanged).

## Verification per asset

- Run `npm run dev`, reach the relevant scene, confirm the sprite renders, is centered/aligned like
  before, and its hitbox still feels right (arcade body derives from texture size — same size = same
  body).
- `npm run typecheck` + `npm run lint` stay green (the swap is mostly deletions in `BootScene`).
- For `projectile`/`particle`, confirm runtime tints still read correctly.

## Later: vector FX (optional, not this migration)

If we eventually want the live `add.graphics()` effects (player arms, auras, slashes, death cracks,
splash, attack rings) to be hand-drawn too, each becomes either an animated sprite sheet or a small
PNG drawn/tweened in place. That's a larger, per-effect redesign and is intentionally deferred.

## Housekeeping when this lands

- Per [CLAUDE.md](../CLAUDE.md): update [PLAN.md](PLAN.md), bump `package.json` version (this is a new
  feature → **minor**), and add a [PATCH_NOTES.md](PATCH_NOTES.md) entry as assets ship.
