# Molecule Mayhem — Development Plan

## Current State (v0.2 — Phase 1 Complete)

- Stage 1: Petri Dish Sector — bacterium, virus, dustbunny, pollen enemies
- Elements: Hydrogen, Oxygen, Water (H₂O combo)
- Boss: Super Bacterium (3-phase, flagella projectiles)
- All graphics procedural (no external assets)
- **Phaser 4.1.0**

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

---

## Phase 2 — More Elements

Extend the atom system with two new base elements and their combos.

### Carbon (C)

- Lv1: Carbon Claw — melee with bleed DOT
- Lv2: Diamond Shard — piercing projectile that hits all enemies in a line
- Lv3: Graphene Shockwave — ground-crack AOE, massive knockback

### Nitrogen (N)

- Lv1: Nitrogen Frost — melee that freezes enemies briefly
- Lv2: Cryo Burst — area freeze + shatter damage
- Lv3: Absolute Zero — freeze + massive damage all on screen

### New Combos

| Combo | Formula | Power Theme |
|---|---|---|
| Ammonia | N + H (× 3) | Corrosive gas cloud |
| Carbon Dioxide | C + O₂ | Suffocating fog, vision obscure |
| Methane | C + H₄ | Explosive, fire-chain attacks |
| Nitric Oxide | N + O | Reactive radical — buffs player speed |
| Carbonic Acid | CO₂ + H₂O | Multi-hit acid splash |

**ElementSystem changes needed:**

- Track counts per element (already done for H/O — extend to C, N)
- Add combo resolution table in `ElementSystem._resolve()` keyed by sorted element pair
- Add mystery atom `choices` that include C and N options

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
