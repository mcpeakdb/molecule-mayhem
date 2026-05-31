# Patch Notes

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
