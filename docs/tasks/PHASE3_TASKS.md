# Phase 3 — Sector Content (9 stages across 3 sectors): Task Breakdown

**Status: complete** (shipped in v0.9.0 — 2026-06-06)

Goal: turn the old 3-sector / 3-stage game (where sector == stage) into **9 stages grouped into
3 sectors of 3 stages each**, plus the tutorial. A *sector* is the biome/theme; a *stage* is one
level within it. The 3rd stage of each sector is a boss finale; the other six clear by reaching an
exit. Adds new enemies and a distinct boss per sector.

---

## 1. Sector/stage model (`src/constants.ts`) ✓

- [x] Added `STAGE_COUNT = 9` and `SectorId = 1 | 2 | 3`
- [x] Added `sectorOf(stage)` = `ceil(stage/3)`, `substageOf(stage)` (1–3), `isFinaleStage(stage)`
      (substage 3)
- [x] Added `SECTORS` map (1 → PETRI DISH, 2 → BLOOD AGAR, 3 → MACCONKEY)
- [x] Annotated `WORLD_WIDTH` as the default/widest span (stages may be shorter)
- [x] Removed now-dead `BOSS_X` / `STAGE_END_X` (positions live in the stage config)

---

## 2. Stage config data file (`src/stages.ts`) ✓

- [x] New `StageDef` interface: `name`, `width`, `atoms[]`, `enemies[]`, `gaps[]`, and either
      `boss { variant, x }` (finale) or `exitX` (reach-the-exit clear)
- [x] `spread()` helper to lay enemy types evenly across an x-range
- [x] Authored all **9 stages** with distinct length, atom ramp, enemy mix, gaps, and flavor name:
  - Sector 1 — Petri Dish: *Inoculation Zone*, *The Agar Flats*, *Colony Core* (boss: bacterium)
  - Sector 2 — Blood Agar: *Hemolytic Fields*, *Plasma Currents*, *The Beating Heart* (boss: amoeba)
  - Sector 3 — MacConkey: *Lactose Marshes*, *Bile Salt Barrens*, *Crystal Violet Throne* (boss: phage)

---

## 3. New enemies (`src/entities/Enemy.ts` + `src/scenes/BootScene.ts`) ✓

- [x] Extended `EnemyType` with `amoeba`, `spore`, `mite`
- [x] `CONFIGS` entries: amoeba (slow tank, hp 80), spore (fast, hp 14), mite (erratic crawler, hp 30)
- [x] Movement flair: spore hovers (like virus), mite hops (like dustbunny), amoeba gelatinous wobble
- [x] Idle-anim cases for all three in `_applyIdleAnim()`
- [x] Procedural textures `_makeAmoeba()`, `_makeSpore()`, `_makeMite()` registered in `BootScene.create()`
- [x] Score values added in `GameScene.onEnemyDeath()` (amoeba 200 / mite 120 / spore 70)

---

## 4. Boss variants (`src/entities/Boss.ts` + `src/scenes/BootScene.ts`) ✓

- [x] Added `BossVariant = 'bacterium' | 'amoeba' | 'phage'` and a `VARIANTS` config (texture, name,
      hp/speed/damage, scale, body size/offset, projectile count/spread, tints)
- [x] Constructor takes a `variant` param; all hardcoded `1.5` scale / `0xff0000` tint references
      replaced with per-variant values
- [x] `_fireFlagella()` generalised to a symmetric N-shot volley (3 / 5 / 7 per variant)
- [x] Procedural textures `_makeBossAmoeba()` (Amoeba Titan) and `_makeBossPhage()` (Phage Lord)

---

## 5. GameScene made data-driven (`src/scenes/GameScene.ts`) ✓

- [x] `init()` clamps stage to 1–9, sets `stageDef = STAGES[stage-1]` and per-stage `worldWidth`
- [x] Added `get sector()`; theme + `bg_tile_${sector}` / `ground_tile_${sector}` now keyed by sector
- [x] Replaced all `WORLD_WIDTH` usages (bounds, tiling, floor line, particles, player clamp,
      projectile cull) with `this.worldWidth`
- [x] Rewrote `_spawnStage()` to consume `stageDef` (atoms, gaps, enemies); spawns the boss variant
      on finale stages or the exit portal otherwise
- [x] In-world label + stage intro now read `SECTOR · Stage N of 9` + the stage's flavor name

---

## 6. Exit-portal clear mechanic (`src/scenes/GameScene.ts`) ✓

- [x] `_spawnExitPortal()` draws a membrane gateway at `exitX` with a "SEALED — clear the area" hint
- [x] `_drawExitPortal(open)` toggles sealed (red) ↔ open (green) visuals
- [x] `_updateExit()` opens the portal once `enemyGroup.countActive() === 0`, then clears the stage
      when the player reaches it; `_openExit()` plays a cue + flash and flips the hint to "EXIT OPEN →"

---

## 7. Stage clear / advance flow (`src/scenes/GameScene.ts`) ✓

- [x] Shared `_showClearBanner()`: STAGE CLEAR (substage 1/2) · SECTOR CLEAR (finales) ·
      EXPERIMENT COMPLETE (stage 9), with a next-sector-aware prompt
- [x] `_completeStage()` (non-boss) and `onBossDefeated()` (finale) both funnel into it
- [x] Advance = `currentStage + 1` up to 9, then back to difficulty select; difficulty persists via
      the registry across all transitions

---

## 8. Pause / labels polish ✓

- [x] Renamed pause option `RESTART SECTOR` → `RESTART STAGE` (restarts the current stage)
- [x] Verified death-screen retry restarts the current stage

---

## 9. Docs & verification ✓

- [x] Version bump 0.8.0 → **0.9.0** (`package.json`)
- [x] PATCH_NOTES entry for v0.9.0
- [x] PLAN.md current-state updated to v0.9 / Phase 3
- [x] CLAUDE.md updated: source layout (`stages.ts`), "Adding a new enemy/boss/stage", sector model
- [x] `npm run typecheck`, `npm run lint`, and `npm run build` all green
