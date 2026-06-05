# Molecule Mayhem — Development Plan

## Current State (v0.6 — Phase 6 Molecular Tree & Numpad Arsenal)

- Three sectors (petri dish / blood agar / MacConkey); Boss: Super Bacterium (3-phase, flagella)
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

## Phase 4 — Progression & Meta

- [ ] **Sector select screen** — unlock sectors sequentially; show high score per sector
- [ ] **Atom persistence across sectors** — carry the molecular tree over a run (reset on death) so
      complex molecules gate on progression. This is the Phase 6 deferred follow-up; decide
      roguelite (persist) vs arcade (reset each sector). Atoms currently reset per sector.
- [~] **Score system** — per-enemy kill values + combo multiplier already exist; still want a
      time bonus and a no-hit bonus
- [ ] **Leaderboard** (local) — store top 5 runs with the molecule/atom path taken
- [ ] **Run summary** — at sector clear / death, show the molecules assembled and the atom path chosen

---

## Phase 5 — Content & QOL

- [x] **Difficulty modes** — Easy / Normal / Hard (`DifficultyScene`, scales enemy HP/speed + i-frames) — v0.4.0
- [x] **Pause menu** — in-game pause (ESC/Enter) with resume / restart / quit (`PauseScene`) — v0.4.0
- [ ] **Mobile/gamepad support** — Phaser gamepad API, on-screen buttons for mobile (also covers numpad-less play)
- [ ] **Sprite art pass** — replace procedural graphics with hand-drawn pixel art (keep BootScene as fallback)
- [ ] **Tilemap stages** — replace flat ground with Tiled JSON tilemaps for varied terrain

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
