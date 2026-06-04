# Patch Notes

## v0.5.0 — 2026-06-03

### Fixes

- **Stuck level after killing the boss offscreen** — screen-wide specials (Absolute Zero, Ammonia/CO₂ Lv3, Acid Rain, etc.) iterate the whole enemy group, so they could damage and kill the Super Bacterium while it was still offscreen and unactivated, leaving the stage in a broken state. Damage is now gated at the source: the boss is immune until it activates (comes on screen), and regular enemies are immune until they've scrolled into the camera view. This covers every attack path (melee, AOE, projectiles, splash, bleed)

### Jump Overhaul & Double Jump

- Jump reworked from a fixed tween to a velocity-based arc (gravity-integrated each frame)
- **Double jump** — press Space again while airborne for a second mid-air leap
- **First jump** plays a dedicated tucked `player_jump` pose with a takeoff stretch and landing squash
- **Second jump** sends the player into a **front roll** — the sprite spins a full rotation in the direction it faces (arms hidden during the spin so they don't detach)
- **Leap over enemies** — a jump that clears an enemy's body (airborne above a clearance height) dodges its contact attack and the boss charge; projectiles and other hits still connect, so it's a timing dodge rather than blanket airborne immunity
- Ground shadow scaling fixed for the taller double-jump apex

### Hydrogen Refinements

- **Proton Punch** (Hydrogen Lv1) reworked to read as a stronger basic punch: reuses the punch animation but with a bigger fist colored hydrogen-blue (`0x3366ee`) with a glow halo and specular, longer reach, harder knockback, a hydrogen-blue impact flash, and the punch SFX (was an orange flash with no fist)
- `_spawnPunchArm()` now takes color/size options so element-charged punches can restyle the fist while sharing the same animation
- **Plasma Arc** (Hydrogen Lv2) rebuilt as a proper energy bolt: a glowing hydrogen-blue core with a white-hot center, randomized crackling electric arcs, and a fading motion trail; faster and harder-hitting (×3 damage, knockback 5) with an impact flash, expanding shock ring, and splash damage to nearby enemies (was a plain orange projectile). New `GameScene.spawnPlasmaBolt()`

### Water Refinements

- **Tidal Force** (Water Lv3) rebuilt as a towering, curling wave instead of a flat translucent rectangle: three parallax depth layers (dark back → bright front), a curling crest with churning foam, spray droplets that arc up and fall under gravity, a bright specular down the front face, a wet floor trail, and a brief blue screen wash + camera shake on cast. Sweeps the full screen width and shoves enemies along with stronger knockback

## v0.4.0 — 2026-05-31

### Phase 5 — Content & QOL (begun)

**Pause Menu**

- Press ESC or Enter during gameplay to pause
- New `PauseScene`: RESUME / RESTART SECTOR / QUIT TO SECTOR 1, clinical monospace styling
- Arrow keys navigate, Z or Enter confirms, ESC resumes
- Quit returns to the difficulty selector

**Difficulty Modes**

- New `DifficultyScene` shown before Stage 1 — EASY / NORMAL / HARD cards with stat breakdowns
- Scales enemy HP, enemy speed, and player invincibility window per difficulty
  - Easy ×0.70 HP / ×0.75 speed / 1.4s i-frames
  - Normal ×1.00 / ×1.00 / 0.8s
  - Hard ×1.40 / ×1.25 / 0.5s
- Choice persists across sectors and retries via the scene registry
- Boot flow now `BootScene → DifficultyScene → GameScene`; completing Sector 3 returns to difficulty select

### Enemy Animation

- Bacterium: cytoplasm pulse (vertical scale, per-instance phase offset)
- Virus: continuous spin
- Pollen: slow tumble
- Dust bunny: squash/stretch breathing while resting between hops
- Boss: slow inhale/exhale breathing pulse
- Virus & pollen shadows removed from textures (were rotating with the sprite)

### UI Readability

- Bumped font sizes across every scene (HUD, pause, difficulty, element choice, intro, death/clear screens, boss label)
- Brightened hard-to-read text colors throughout
- Controls hint given a black stroke so it reads over the game world
- Element panel enlarged to fit larger labels

### Combat Feel

- Hit feedback changed from a full-screen red flash to a brief red tint on the player sprite

## v0.3.0 — 2026-05-31

### Art Direction — Clinical/Microscope Overhaul

**Enemies**

- Bacterium redrawn as Gram-stain positive: deep violet body (`0x5533aa`), translucent capsule halo, dark nucleoid oval, ribosome granules, two wispy flagella, wet-glass specular
- Virus redrawn as fluorescent antibody stain: teal-cyan (`0x00ccbb`), 12 thin sharp spikes (was 8 fat), no cartoon eyes, protein coat dots between spikes, dark inner core
- Dust bunny redrawn as unstained cellular debris: blue-gray aggregate (`0x8899a8`), semi-transparent blobs, trapped organelle blobs replacing cute eyes, faint membrane boundary
- Pollen redrawn with autofluorescence amber: 6 surface aperture pits instead of outer bumps, exine radial lines, bright inner glow
- Boss redrawn as pathogenic strain: dark purple (`0x3a2266`), three distinct nucleoid ovals, double membrane/capsule ring, five flagella of varying weight

**Player**

- White lab coat replacing navy uniform, with lapel folds and collar V
- Wide clinical goggles covering the eye area — pale teal lenses neutral for element tinting
- Dark clinical trousers and white lab shoes
- Pen clipped to breast pocket
- Arms are now live graphics objects (not baked into texture) — correct position tracked via `postupdate` event
- Melee punch spawns an extending sleeve+gloved fist graphic; the punching arm disappears during the animation; no hit flash on melee

**HUD**

- HP bar redesigned as graduated pipette: dark track with tick marks at 25/50/75%, fill shifts green → yellow → red, label centered inside bar
- All text in monospace — lab readout aesthetic
- Element panel: `ELEMENT  {name}` / `SPECIAL  {name}` format, thin clinical-green border
- Score: `SCORE` label above monospace digits in clinical green
- Combo display: muted green monospace, less saturated
- Boss warning: `! PATHOGEN DETECTED !` fades out after 2s instead of persisting

**Background & Environment**

- Ground tiles darkened and desaturated across all sectors; wet-glass sheen (two-layer lighter band at top edge)
- Background tiles near-black with faint `strokeCircle` cell membrane debris rings replacing block texture
- World background particles: 1 in 3 are now hollow cell-debris rings, rest are smaller granules

---

## v0.2.1 — 2026-05-30

### Stages

- Added **Sector 2** (blood agar — red/pink) and **Sector 3** (MacConkey agar — blue/purple)
- Stage progression: defeating the boss advances to the next sector; Sector 3 ends with "Experiment Complete" and loops back to Sector 1
- Dying retries the current sector (no longer resets to Sector 1)
- Boss scales per sector — S2: 750 HP / speed 160; S3: 1100 HP / speed 180 / damage 30
- Atom counts reduced (7 → 4 per sector); S3 atoms are all mystery boxes
- Enemy Y positions are now randomized within the walkable band each run

### Enemies

- **Viruses** now hover up and down continuously (sine-wave Y movement, random start phase)
- **Dust bunnies** now hop — takeoff squish, airborne arc, landing squish, random pause between hops
- Enemies no longer drop atoms on death

### Visuals

- Each sector has unique tile textures: nutrient agar (S1), blood agar (S2), MacConkey agar (S3)
- Background tiles include faint petri dish grid lines
- Sector-themed floor line, shadow band, and floating particle colors
- Measurement tick marks along the agar surface boundary

### Fixed

- HP fractional values — `Math.round()` applied at every damage site across `Enemy`, `Boss`, and `Player`

---

## v0.2.0 — Phase 2 Complete

### New Elements

- **Carbon (C)** — Carbon Claw (bleed DOT), Diamond Shard (piercing bolt), Graphene Shockwave (AOE ground crack)
- **Nitrogen (N)** — Nitrogen Frost (freeze melee), Cryo Burst (freeze AOE), Absolute Zero (freeze all on screen)

### New Combos

- **Ammonia (NH₃)** — Caustic Spray / Acid Cloud / Toxic Deluge (DOT + slow)
- **Carbon Dioxide (CO₂)** — Smog Pulse / Suffocation Field / Blackout (camera fog + AOE)
- **Methane (CH₄)** — Gas Ignite / Chain Blast / Fireball (detonating projectile with chain explosions at lv2)
- **Nitric Oxide (NO)** — Radical Rush / Reactive Aura / Overclock (speed boost ×1.5–2.0 with pulsing aura damage)
- **Carbonic Acid (H₂CO₃)** — Acid Drop / Corrosive Spray / Acid Rain (targeted falling drops + bleed)

### Systems

- Bleed DOT system on `Enemy` — ticks every 400 ms, red flash, extends duration on reapply
- Piercing projectile support — `piercing` flag on `ProjectileSprite`, passes through all enemies
- `ElementChoiceScene` updated with descriptions and symbol lookup for all 10 elements
- Carbon and Nitrogen atom textures (procedural)

---

## v0.1.0 — Phase 1 Complete

### Core Game

- Stage 1: Petri Dish Sector — bacterium, virus, dustbunny, pollen enemies
- Boss: Super Bacterium (3-phase, flagella projectiles)
- 5 base elements: H, O, Water, C, N — 5 initial combos

### Features Added

- Procedural sound effects (Web Audio API) — punch, atom collect, element upgrade fanfare, boss roar, player death
- Particle bursts on atom collection (element-colored, 22 particles)
- Player walk animation (3-frame procedural cycle, idle/walk states)
- Enemy hit stagger — scale squish tween + velocity freeze + delayed knockback
- Boss hit stagger — proportional squish targets for larger sprite
- Combo counter with damage multiplier — every 5 hits adds ×0.5; shown in HUD
- Stage intro letterbox sequence (bars + title card, 2-second hold)
- Death screen — "YOU DIED" overlay with final score and retry prompt
- Score tracker — per-enemy kill values (bacterium 100, virus 80, dustbunny 150, pollen 60, boss 1000)
- Player jumping — Space key, arc physics with ground shadow, invulnerable while airborne
