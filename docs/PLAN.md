# Molecule Mayhem — Development Plan

## Current State (v0.6 — Phase 6 Molecular Tree & Numpad Arsenal)

- Three sectors (petri dish / blood agar / MacConkey); Boss: Super Bacterium (3-phase, flagella)
- **10 attacks** — H, O, C, N + 6 molecules, each restyled to its atom color
- **Molecular tree**: every atom pickup is a branching choice; compounds use real stoichiometry
  (H₂O = 2H+1O, etc.); level = complete recipe copies. Sectors ramp the atom supply (4 → 6 → 9)
- **Numpad arsenal**: owned atoms unlock multiple simultaneous attacks; `.` punch, `1–9`/`0` slots
  (number-row mirrors), each with its own cooldown; HUD shows atom badges + a numpad attack bar
- All graphics procedural (no external assets) · **Phaser 4.1.0**
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

## Phase 3 — More Stages

### Stage 2: Bloodstream Corridor

- Environment: red/dark-red, slow-scroll "blood cell" background parallax
- New enemies:
  - **Red Blood Cell** — slow, high HP, rams player
  - **White Blood Cell** — chases aggressively, calls for backup (spawns smaller enemies)
  - **Platelet** — fast, low HP, sticks to player slowing movement
- Atoms: introduce Carbon atoms
- Boss: **Giant White Blood Cell** — summons minion waves between phases
- Stage mechanic: current pushes player backward slowly (must keep moving right)

### Stage 3: Lung Cavity

- Environment: pink/white, rhythmic camera pulse (breathing)
- New enemies:
  - **Pollen Cluster** — splits into 3 smaller pollens on death
  - **Allergen Spore** — explodes on death dealing AOE damage
  - **Mold Filament** — long thin enemy that whips
- Atoms: introduce Nitrogen atoms
- Boss: **Mega Allergen** — periodic screen-wide sneeze attack (projectile spray)
- Stage mechanic: air pockets that briefly boost player jump height / speed

### Stage 4: Cell Nucleus

- Final stage, highest difficulty
- All previous enemy types + upgraded variants (bigger, faster, more HP)
- Atoms: all elements available, mystery atoms offer 3-way choices
- Boss: **DNA Strand Guardian** — two-phase: strand form (dodging attack gaps) + core form (radial attacks)

---

## Phase 6 — Molecular Tree & Numpad Arsenal ✅ (v0.6.0)

Combat/progression overhaul: every atom pickup is a branching choice (a molecular *tree*),
owning atoms unlocks **multiple simultaneous attacks** bound to the numpad (up to 10, real
stoichiometry), and every special is restyled to its atom color. Full design in
[PLAN_PHASE6.md](PLAN_PHASE6.md); work breakdown in [tasks/PHASE6_TASKS.md](tasks/PHASE6_TASKS.md).

Deferred follow-ups: atom persistence across sectors; choice-overlay progress hints toward
locked compounds.

---

## Phase 4 — Progression & Meta

- [ ] **Stage select screen** — unlock stages sequentially; show high score per stage
- [ ] **Persistent power choices** — player keeps element level between stages (roguelite run)
  - Alternative: hard reset each stage (arcade style) — decide which fits better
- [ ] **Score system** — points per enemy kill, combo multiplier, time bonus, no-hit bonus
- [ ] **Leaderboard** (local) — store top 5 runs with element path taken
- [ ] **Element loadout memory** — remember which branch a player chose last run and hint it

---

## Phase 5 — Content & QOL

- [ ] **Mobile/gamepad support** — Phaser gamepad API, on-screen buttons for mobile
- [ ] **Difficulty modes** — Easy (more HP drops, slower enemies), Hard (aggressive AI, less invincibility)
- [ ] **Sprite art pass** — replace procedural graphics with hand-drawn pixel art (keep BootScene as fallback)
- [ ] **Tilemap stages** — replace flat ground with Tiled JSON tilemaps for varied terrain
- [ ] **Pause menu** — in-game pause (ESC) with resume / restart / quit

---

## Architecture Notes for Future Work

**Adding a new enemy type:**

1. Add config entry in `Enemy.ts` `CONFIGS` object
2. Add texture generation in `BootScene._makeEnemyTextures()` (or new method)
3. Add to `GameScene._spawnStage()` `enemyDefs` array

**Adding a new element:**

1. Add to `ELEMENTS` and `ELEMENT_COLORS` / `ELEMENT_NAMES` in `constants.ts`
2. Extend `ElementSystem._resolve()` combo table
3. Add `_specialXxx()` methods in `Player.ts`
4. Add atom texture in `BootScene._makeAtoms()`
5. Add power descriptions to `ElementChoiceScene` `CHOICE_DESCRIPTIONS`

**Adding a new stage:**

- Copy `GameScene._spawnStage()` pattern into a `StageData` config file (array of stages)
- `GameScene` reads the active stage index and loads the appropriate config
