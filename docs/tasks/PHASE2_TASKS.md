# Phase 2 — More Elements: Task Breakdown

**Status: Complete**

---

## 1. Constants (`src/constants.ts`) ✓

- [x] Added `CARBON`, `NITROGEN`, `AMMONIA`, `CARBON_DIOXIDE`, `METHANE`, `NITRIC_OXIDE`, `CARBONIC_ACID` to `ELEMENTS`
- [x] Added colors for all 7 new types (charcoal grey, cold teal, yellow-green, pale blue-grey, combustion orange, reactive pink, acid blue)
- [x] Added display names for all 7 new types (full chemical notation — NH₃, CO₂, etc.)

---

## 2. ElementSystem (`src/systems/ElementSystem.ts`) ✓

- [x] Added `_cCount` and `_nCount` private fields
- [x] Extended `collectAtom()` to handle carbon and nitrogen
- [x] Rewrote `_resolve()` with priority chain:
  1. Carbonic Acid (C + H + O) — highest priority
  2. Methane (C + H, no O/N)
  3. Ammonia (N + H, no C/O)
  4. Carbon Dioxide (C + O, no H/N)
  5. Nitric Oxide (N + O, no C/H)
  6. Water (H + O)
  7. Pure fallbacks: H → O → C → N → None
- [x] Extended `getSpecialName()` with all 7 new element name arrays

---

## 3. Atom Textures (`src/scenes/BootScene.ts`) ✓

- [x] `atom_carbon` — charcoal glow, 2 orbital rings, grey electron dot, dark nucleus with highlight
- [x] `atom_nitrogen` — teal glow, 3 orbital rings, 2 electron dots, teal nucleus
- [x] Both added as blocks inside `_makeAtoms()` after the Mystery block

---

## 4. Atom Spawning (`src/scenes/GameScene.ts`) ✓

- [x] Mystery atom at x=820 now offers `['hydrogen', 'carbon']`
- [x] Mystery atom at x=1900 now offers `['nitrogen', 'oxygen']`
- [x] Pure H and O drops retained early in the stage for players following Water combo path

---

## 5. ElementChoiceScene (`src/scenes/ElementChoiceScene.ts`) ✓

- [x] Added `CHOICE_DESCRIPTIONS` entries for all 7 new types (carbon, nitrogen, ammonia, carbon_dioxide, methane, nitric_oxide, carbonic_acid)
- [x] Replaced hardcoded `'hydrogen' ? 'H' : 'oxygen' ? 'O' : '~'` with `ELEMENT_SYMBOLS` lookup map covering all 10 elements

---

## 6. Bleed DOT System (`src/entities/Enemy.ts`) ✓

- [x] Added `bleedTimer`, `bleedDamage`, `bleedTickTimer` fields to `Enemy`
- [x] Bleed ticks every 400 ms in `update()` — deals damage, flashes red, calls `_die()` if HP ≤ 0
- [x] `applyBleed(damage, duration)` public helper — extends duration rather than resetting
- [x] `Boss.applyBleed()` added as a no-op (boss immune to bleed, satisfies `Enemy | Boss` union type)

---

## 7. Piercing Projectile (`src/scenes/GameScene.ts`) ✓

- [x] Added `piercing: boolean` to `ProjectileSprite` type
- [x] Modified projectile-enemy overlap to skip `destroy()` when `p.piercing === true`
- [x] Added `spawnPiercingProjectile()` — larger scale (1.4×), diamond tint `0xaaddff`, sets `piercing = true`
- [x] Standard `spawnProjectile()` now explicitly sets `p.piercing = false`

---

## 8. Player Specials (`src/entities/Player.ts`) ✓

- [x] Updated `_doSpecialAttack()` dispatch for all 7 new element types
- [x] Added `_speedBoost`, `_speedBoostTimer`, `_speedBoostAura` fields; speed multiplied through vx/vy each frame; aura position synced in `update()`

### Carbon

- [x] **Lv1 Carbon Claw** — melee arc + bleed loop applies `applyBleed(3, 2400)` to hit enemies
- [x] **Lv2 Diamond Shard** — `spawnPiercingProjectile()`, passes through all enemies in a line
- [x] **Lv3 Graphene Shockwave** — expanding `Graphics` crack, damages within Y range at midpoint via `_damageRadius()`

### Nitrogen

- [x] **Lv1 Nitrogen Frost** — `_damageArc()` with `slow=true`, icy blue flash
- [x] **Lv2 Cryo Burst** — `_damageRadius()` with `slow=true`, higher damage
- [x] **Lv3 Absolute Zero** — all on-screen enemies: max damage + slow, 500ms shake, fullscreen flash

### Ammonia

- [x] **Lv1** — small radius + bleed on all hit enemies
- [x] **Lv2** — larger radius + bleed + slow
- [x] **Lv3** — all on-screen: damage + bleed on every enemy

### Carbon Dioxide

- [x] **Lv1** — AOE push + brief camera fog overlay (semi-transparent grey rect, scrollFactor 0)
- [x] **Lv2** — larger radius + longer fog
- [x] **Lv3** — full-screen fog + damage all on-screen enemies

### Methane

- [x] **Lv1–3** — slow projectile (220 px/s) that detonates on enemy contact or after 650 ms; lv2 spawns chain flash at nearby enemies; lv3 uses large blast radius + heavy shake

### Nitric Oxide

- [x] **Lv1** — `_speedBoost = 1.5`, 3 s, 40 px aura, 0.5× aura damage tick every 500 ms
- [x] **Lv2** — `_speedBoost = 1.8`, 5 s, 60 px aura
- [x] **Lv3** — `_speedBoost = 2.0`, 8 s, 80 px aura

### Carbonic Acid

- [x] **Lv1** — 5 staggered acid drops fall to ground, each deals damage radius on land
- [x] **Lv2** — 9 drops in wider arc; each applies `applyBleed()` on land
- [x] **Lv3** — one drop per enemy aimed directly down, damage + bleed on each

---

## 9. HP Rounding ✓

- [x] `Math.round()` applied at every HP subtraction site: `Enemy.takeDamage()`, `Enemy` bleed tick, `Boss.takeDamage()`, `Player.takeDamage()` — eliminates fractional HP from multipliers like `* 1.8`
