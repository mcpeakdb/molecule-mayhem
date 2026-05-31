# Patch Notes

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
