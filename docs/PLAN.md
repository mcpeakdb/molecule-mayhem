# Molecular Meltdown — Development Plan

## Current State (v0.11 — Phase 5 Content & QOL)

- **Front-end & QOL** (Phase 5): boots to a `TitleScene` main menu (Start / Stage Select /
  Leaderboard / Controls / Settings); `SettingsScene` + `Settings` system persist volume, mute, SFX,
  and screen-shake to `localStorage` (sound routes through a master gain, shakes honor the toggle);
  `LeaderboardScene` browses top-5 runs per difficulty; `HelpScene` shows controls. Procedural art
  pass adds per-sector decorative scenery, parallax props, and a vignette (still no external assets).
  Renamed **Molecule Mayhem → Molecular Meltdown**.


- **9 stages across 3 sectors** (Petri Dish / Blood Agar / MacConkey), 3 stages each, plus the
  tutorial. Sector = `ceil(stage/3)` drives biome/theme; all level content is data-driven in
  [../src/stages.ts](../src/stages.ts) (`STAGES[9]`), consumed by `GameScene`.
- **Progression & meta** (Phase 4): `StageSelectScene` with per-stage sequential unlocks + best
  scores; `SaveSystem` persists unlocks / best scores / a top-5 leaderboard to `localStorage`, keyed
  per difficulty. Score is a **cumulative run total** (carried across stages, reset on death) with
  **time** + **no-hit** clear bonuses; death and completion show a run summary. Atom model is
  **arcade** (tree resets each stage).
- **Sector finales** (stages 3/6/9) are boss fights; the other six clear by reaching an **exit
  portal** that opens once all enemies are defeated. Banners: STAGE / SECTOR / EXPERIMENT COMPLETE.
- **7 enemy types**: bacterium, virus, dustbunny, pollen + new amoeba (tank), spore (fast hover),
  mite (crawler). **3 bosses**: Super Bacterium, Amoeba Titan, Phage Lord — one per sector.
- **Gaps are a damage hazard**: stepping into a chasm on the ground (walking in or landing short)
  deals fall damage and bounces you back to the nearer lip; jumping clear is safe (`_updateGaps()`)
- **10 attacks** — H, O, C, N + 6 molecules, each restyled to its atom color
- **Molecular tree**: every atom pickup is a branching choice; compounds use real stoichiometry
  (H₂O = 2H+1O, etc.); level = complete recipe copies. Sectors ramp the atom supply (4 → 6 → 9)
- **Numpad arsenal**: owned atoms unlock multiple simultaneous attacks on `1–9`/`0` (number-row
  mirrors), each with its own cooldown; slot `1` is the basic punch until you unlock an attack;
  HUD shows atom badges + a numpad attack bar
- All graphics procedural (no external assets) · **Phaser 4.1.0**
- **Tutorial**: M.E.G.-guided training sector on boot — story setup (you've been shrunk), one element,
  one bad guy, one gap, with proximity tips; ESC to skip
- **Jump**: velocity-based arc with double jump (front-roll on the second leap); a clean leap over an enemy dodges its contact attack (timing dodge, not blanket airborne immunity)

See [PLAN_PHASE6.md](PLAN_PHASE6.md) and [tasks/PHASE6_TASKS.md](tasks/PHASE6_TASKS.md) for details.

### Added in Phase 1

- Procedural sound effects (Web Audio API) — punch, collect, upgrade fanfare, boss roar, death
- Particle bursts on atom collection (element-colored)
- Player walk animation (3-frame procedural cycle)
- Enemy & boss hit stagger (freeze + scale squish + delayed knockback)
- Combo counter with damage multiplier (every 5 hits = +×0.5, shown in HUD)
- Stage intro letterbox sequence
- Death screen with score display and retry
- Score tracker (per-enemy kill values, live HUD display)
- **Player jumping** (Space — arc with ground shadow, natural invulnerability while airborne)

### Added in Phase 2

- **Carbon (C)** — Carbon Claw (bleed DOT), Diamond Shard (piercing bolt), Graphene Shockwave (ground crack AOE)
- **Nitrogen (N)** — Nitrogen Frost (freeze melee), Cryo Burst (freeze AOE), Absolute Zero (freeze all on screen)
- **Ammonia (NH₃)** combo — Caustic Spray / Acid Cloud / Toxic Deluge (DOT + slow chains)
- **Carbon Dioxide (CO₂)** combo — Smog Pulse / Suffocation Field / Blackout (camera fog + AOE)
- **Methane (CH₄)** combo — Gas Ignite / Chain Blast / Fireball (detonating projectile, chain explosions at lv2)
- **Nitric Oxide (NO)** combo — Radical Rush / Reactive Aura / Overclock (speed boost ×1.5–2.0, pulsing aura damage)
- **Carbonic Acid (H₂CO₃)** combo — Acid Drop / Corrosive Spray / Acid Rain (targeted falling drops + bleed)
- Bleed DOT system on Enemy (`applyBleed()`, ticks every 400 ms, red flash)
- Piercing projectile (`piercing` flag on `ProjectileSprite`, `spawnPiercingProjectile()`)
- Carbon and Nitrogen atom textures (procedural, added to `_makeAtoms()`)
- Mystery atom choices updated to offer C and N in Stage 1
- `ElementChoiceScene` updated with descriptions + `ELEMENT_SYMBOLS` lookup for all 10 elements
- HP always rounded to whole numbers across all entities

---

## Phase 3 — Distinct Sector Content

Three sectors already ship (Sector 1 nutrient agar, Sector 2 blood agar, Sector 3 MacConkey agar),
but they currently **reskin the same four enemies** (bacterium / virus / dustbunny / pollen) and a
per-sector scaled **Super Bacterium** boss. This phase gives each sector its own identity: unique
enemies, unique bosses, and a stage mechanic.

> Atom availability per sector is now handled by the Phase 6 molecular tree (authored atom-choice
> nodes in `_spawnStage()`), not by "introducing" one specific atom per stage.

### Sector 2 — Blood Agar

- New enemies:
  - **Red Blood Cell** — slow, high HP, rams the player
  - **White Blood Cell** — aggressive chaser, calls for backup (spawns smaller enemies)
  - **Platelet** — fast, low HP, sticks to the player and slows movement
- Boss: **Giant White Blood Cell** — summons minion waves between phases
- Mechanic: a current pushes the player back slowly (must keep advancing right)

### Sector 3 — MacConkey / Lung Cavity

- New enemies:
  - **Pollen Cluster** — splits into 3 smaller pollens on death
  - **Allergen Spore** — explodes on death dealing AOE damage
  - **Mold Filament** — long thin enemy that whips
- Boss: **Mega Allergen** — periodic screen-wide sneeze spray
- Mechanic: air pockets that briefly boost jump height / speed (jump + double-jump now exist)

### Sector 4 — Cell Nucleus (new, final)

- Highest difficulty; all prior enemy types + upgraded variants (bigger, faster, more HP)
- Boss: **DNA Strand Guardian** — two-phase: strand form (dodge attack gaps) + core form (radial attacks)
- Wire a 4th sector into the `currentStage` flow, themes, and `_spawnStage()` configs

---

## Phase 4 — Progression & Meta ✅ COMPLETE (v0.10.0)

Shipped 2026-06-06. Decisions: **arcade** atom model, **per-stage** unlocks, records **per
difficulty**. Work breakdown in [tasks/PHASE4_TASKS.md](tasks/PHASE4_TASKS.md).

- [x] **Stage select screen** (`StageSelectScene`) — 9 stages grouped by sector, sequential per-stage
      unlocks, best score per stage shown
- [x] **Atom persistence** — resolved as **arcade** (tree resets each stage); no carry. Closes the
      Phase 6 deferred follow-up.
- [x] **Score system** — per-enemy kills + combo (Phase 1) now plus a cumulative run score with
      **time bonus** and **no-hit bonus** on clear
- [x] **Leaderboard** (local) — `SaveSystem` stores top 5 runs per difficulty with the atom/molecule
      path (`localStorage` `mm.save.v1`)
- [x] **Run summary** — death + EXPERIMENT COMPLETE show molecules assembled, atom path, stage
      reached, score, and leaderboard placement

---

## Phase 5 — Content & QOL ✅ COMPLETE (v0.11.0)

Front-end & QOL pass, shipped 2026-06-06. Work breakdown in [tasks/PHASE5_TASKS.md](tasks/PHASE5_TASKS.md).

- [x] **Difficulty modes** — Easy / Normal / Hard (`DifficultyScene`, scales enemy HP/speed + i-frames) — v0.4.0
- [x] **Pause menu** — in-game pause (ESC/Enter) with resume / restart / quit (`PauseScene`) — v0.4.0
- [x] **Title screen + menu** (`TitleScene`) — Start / Stage Select / Leaderboard / Controls / Settings
- [x] **Settings** (`SettingsScene` + `Settings`) — volume, mute, SFX, screen-shake, persisted
- [x] **Leaderboard viewer** (`LeaderboardScene`) + **Controls screen** (`HelpScene`)
- [x] **Procedural art pass** — per-sector decorative scenery, parallax props, vignette (no external assets)
- [ ] **Mobile/gamepad support** — deferred (Phaser gamepad API, on-screen buttons)
- [~] **Sprite art pass / Tilemap stages** — the external-asset items; reinterpreted as the procedural
      art/terrain pass to keep the no-external-assets rule. Literal external-asset versions not pursued.

---

## Phase 6 — Molecular Tree & Numpad Arsenal ✅ COMPLETE (v0.6.0)

Combat/progression overhaul, shipped 2026-06-04: every atom pickup is a branching choice (a molecular
*tree*), owning atoms unlocks **multiple simultaneous attacks** bound to the numpad (up to 10, with
real stoichiometry — H₂O = 2H+1O, etc.), each special restyled to its atom color, plus a numpad/HUD
arsenal and choice-overlay tree feedback. Full design in [PLAN_PHASE6.md](PLAN_PHASE6.md); work
breakdown in [tasks/PHASE6_TASKS.md](tasks/PHASE6_TASKS.md).

Deferred follow-ups (also folded into Phase 4): atom persistence across sectors; choice-overlay
progress hints toward locked compounds.

---

## Phase 7 — Difficulty Rework, Gold Wildcard & Element Facts ✅ COMPLETE (v0.12.0)

Shipped 2026-06-06. A QOL + content pass with four independent features. Work breakdown in
[tasks/PHASE7_TASKS.md](tasks/PHASE7_TASKS.md).

### 1. Element facts on the choice screen

Each card in `ElementChoiceScene` shows one randomly-chosen fact about its element at the bottom of
the button. Facts come from a new authored pool keyed by element.

- New `ELEMENT_FACTS: Partial<Record<ElementType, string[]>>` data (in `src/constants.ts` or a new
  `src/facts.ts`); several facts per base atom **and** per compound, plus Gold.
- `ElementChoiceScene._buildCard()` picks one fact at random and renders it in a dedicated footer
  zone (small, dim, word-wrapped). Card height / internal layout adjusted so the fact never collides
  with the "UNLOCKS / LEVELS" list.
- Picked per card build (i.e. fresh each time the overlay opens), not per frame.

### 2. Easy-mode simplification — single strongest weapon

On the easiest tier the player no longer carries the whole numpad arsenal. Instead they wield **only
the single most-advanced available attack**, bound to key `1`. This keeps the easiest mode a
one-button experience.

- Drive it from data, not a hardcoded difficulty string: add `simplifiedArsenal: boolean` to the
  `DIFFICULTY_SCALE` entries (true only on the easiest tier).
- `ElementSystem.getAvailableAttacks()` (or a new `getSimplifiedArsenal()`) returns just
  `[getPrimary()]` numbered as key `1` when the flag is set. `Player._fireSlot` / HUD already render
  whatever the arsenal reports, so the numpad bar collapses to one slot automatically.
- The molecular tree still grows normally underneath (atom counts accumulate); only what's *bound and
  shown* is reduced to the strongest attack.

### 3. Difficulty rename — Normal / Hard / Extreme

Drop the "Easy" label. The three existing tiers shift up one notch: the current Easy tuning becomes
**Normal** (and gains the single-weapon simplification above), current Normal becomes **Hard**, and
current Hard becomes **Extreme**.

- Rename the `Difficulty` union to `'normal' | 'hard' | 'extreme'` and re-key `DIFFICULTY_SCALE`,
  carrying the existing numbers forward: normal = old easy (×0.70 / ×0.75 / 1.4s, `simplifiedArsenal`),
  hard = old normal (×1.00 / ×1.00 / 0.8s), extreme = old hard (×1.40 / ×1.25 / 0.5s).
- Update every consumer: `DifficultyScene` (labels/colors/descriptions), `SaveSystem`
  (`DIFFICULTIES`, `emptySave`), `LeaderboardScene` (`DIFFS`, `DIFF_COLOR`), `StageSelectScene`,
  `TitleScene` default, `GameScene` tutorial default (`'easy'` → `'normal'`).
- **Save migration:** records are keyed by difficulty string in `localStorage` (`mm.save.v1`). Bump
  to `mm.save.v2` and migrate old `easy/normal/hard` slots into `normal/hard/extreme` on load (best
  effort; tolerate absence), so existing unlocks/leaderboards survive the relabel.

### 4. Gold — the 1% wildcard atom

A new rare collectible. Gold is **not** an attack and not a base atom; it's a wildcard that lets the
player pick any base element and grants it **+2** (worth two level-ups toward that element).

- Add `GOLD` to `ELEMENTS`, `ELEMENT_COLORS` (`0xffd700`), `ELEMENT_NAMES`. It stays out of `ATTACKS`
  / `BaseAtom` / `ATTACK_ORDER` (it has no special of its own).
- Spawn: when `GameScene._spawnStage()` creates an atom node, a **1% roll** makes it a Gold node
  instead. `Atom` gains a `gold` flag; `BootScene` gets a distinct shimmering gold `atom_gold` texture.
- Collect: opens a Gold variant of the choice overlay — pick one of the four base atoms; on confirm,
  `ElementSystem.collectAtom(chosen)` is applied **twice** (+2 count). Distinct fanfare + gold
  particle burst.
- The Gold overlay shows the +2 framing and each base atom's fact; reuse `ElementChoiceScene` with a
  `gold: true` / `grant: 2` mode rather than a second scene.

> **Locked decisions:**
> - **Gold scope:** the player chooses among the **four base atoms** and receives **+2** to that
>   atom's count. Compounds are excluded (their levels are derived from atom counts, so a base-atom
>   +2 is the clean, representable fit).
> - **Difficulty:** rename the internal `Difficulty` keys to `normal/hard/extreme` and migrate the
>   save (`mm.save.v1` → `mm.save.v2`), rather than keeping the old keys and only relabeling the UI.

---

## Architecture Notes for Future Work

**Adding a new enemy type:**

1. Add config entry in `Enemy.ts` `CONFIGS` object
2. Add texture generation in `BootScene._makeEnemyTextures()` (or new method)
3. Add to `GameScene._spawnStage()` `enemyDefs` array

**Adding a new element / molecule** (see [CLAUDE.md](../CLAUDE.md) for the full version):

1. Add to `ELEMENTS` / `ELEMENT_COLORS` / `ELEMENT_NAMES` in `constants.ts`
2. Add an `ATTACKS` registry entry (`recipe`, `slot`, `color`, `tierNames`, `cooldownMs`) in `constants.ts`
3. Add a `_specialXxx()` method + a `_dispatchAttack()` branch in `Player.ts`
4. Add the symbol to `ATTACK_SYMBOL` (HUD) and `ELEMENT_SYMBOLS` (`ElementChoiceScene`)
5. For a new base atom: extend `BaseAtom`/`BASE_ATOMS`, add its texture, and author it into `_spawnStage()` choices

**Adding a new stage:**

- Copy `GameScene._spawnStage()` pattern into a `StageData` config file (array of stages)
- `GameScene` reads the active stage index and loads the appropriate config
