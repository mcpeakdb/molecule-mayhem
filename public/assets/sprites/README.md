# Hand-drawn sprite assets

Drop hand-drawn PNGs here to replace the procedural textures. See
[`docs/GRAPHIC_MIGRATION_PLAN.md`](../../../docs/GRAPHIC_MIGRATION_PLAN.md) for the full plan.

## How a swap works

1. Export a PNG at the asset's **canonical size** (the `w`/`h` in `ASSET_SPECS` inside
   [`src/scenes/BootScene.ts`](../../../src/scenes/BootScene.ts)) into the right folder below.
2. Flip that asset's `migrated` flag to `true` in `ASSET_SPECS`.
3. Done — `preload()` loads the PNG and the procedural fallback for that key is skipped. No other
   game code changes (everything references textures by key).

If a flagged PNG is missing, the loader logs a warning and falls back to procedural art, so the game
never breaks mid-migration.

## Generating placeholders (Strategy A — pixel-identical to current art)

With every `migrated` flag still `false`, run the dev server and load:

```
http://localhost:5173/?exportTextures
```

The Boot scene generates the procedural art as usual, then downloads each in-scope texture as
`<key>.png` (you may need to allow multiple downloads). Move each file into the matching folder:

| Folder | Keys |
|--------|------|
| `player/`  | `player_0` `player_1` `player_2` `player_jump` |
| `npc/`     | `meg` |
| `enemies/` | `bacterium` `virus` `dustbunny` `pollen` `amoeba` `spore` `mite` |
| `bosses/`  | `boss_bacterium` `boss_amoeba` `boss_phage` |
| `atoms/`   | `atom_hydrogen` `atom_oxygen` `atom_carbon` `atom_nitrogen` `atom_mystery` `atom_node` `atom_gold` |
| `fx/`      | `fx_hit` `projectile` `particle` |

Then flip the relevant `migrated` flags. The game looks identical, but now loads from PNG — ready to
swap in real hand-drawn art one slot at a time.
