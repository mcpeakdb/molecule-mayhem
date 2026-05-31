# Molecule Mayhem — CLAUDE.md

## Project Overview

A molecular-scale beat 'em up browser game built with **Phaser 4.1.0** and **TypeScript**. The player is a mad scientist fighting through microscopic environments. All graphics and audio are procedural — no external asset files.

## Tech Stack

| Tool | Purpose |
|------|---------|
| Phaser 4.1.0 | Game framework |
| TypeScript 6 | Language |
| Vite 5 | Dev server & bundler |
| Biome | Linting + formatting |
| Husky | Pre-commit hooks |

## Dev Commands

```bash
npm run dev        # start Vite dev server (localhost:5173)
npm run build      # production build → dist/
npm run preview    # preview the dist build
npm run lint       # biome check (read-only)
npm run lint:fix   # biome check --write (auto-fix)
npm run typecheck  # tsc --noEmit
```

Pre-commit hook runs `biome check --fix` and `tsc --noEmit` automatically on every commit.

## Source Layout

```
src/
  main.ts                  # Phaser game config + scene list
  constants.ts             # ELEMENTS, colors, names, damage values, game constants
  types.ts                 # Shared TypeScript types
  entities/
    Player.ts              # Player movement, attack, specials, combo, death
    Enemy.ts               # Enemy AI, takeDamage, bleed DOT, death
    Boss.ts                # Boss phases, flagella projectiles, activation
    Atom.ts                # Collectible atom sprite
  scenes/
    BootScene.ts           # Procedural texture generation for all sprites
    GameScene.ts           # Main game loop, spawning, physics, overlaps
    HUDScene.ts            # Score, HP, element, combo UI (runs in parallel)
    ElementChoiceScene.ts  # Level-up choice overlay
  systems/
    ElementSystem.ts       # Element combo resolution, level tracking
    SoundSystem.ts         # Procedural Web Audio sound effects
docs/
  PLAN.md                  # Living design doc — phases, architecture notes
  PATCH_NOTES.md           # Version history (must stay current)
  tasks/
    PHASE1_TASKS.md        # Detailed task list for Phase 1 (complete)
    PHASE2_TASKS.md        # Detailed task list for Phase 2 (complete)
```

## After Making Changes

After completing any meaningful change or feature:

1. **Update [docs/PLAN.md](docs/PLAN.md)** — mark completed items, update the current state section if the phase changed.
2. **Update the relevant task file** in [docs/tasks/](docs/tasks/) — check off completed tasks.
3. **If the version in [package.json](package.json) changed**, update [docs/PATCH_NOTES.md](docs/PATCH_NOTES.md) with a new entry for that version describing what changed.

## Versioning

Version lives in `package.json` → `"version"`. Use semantic versioning:

- **patch** (0.2.1 → 0.2.2) — bug fixes, minor tweaks
- **minor** (0.2.x → 0.3.0) — new gameplay features, new elements, new stages
- **major** (0.x → 1.0.0) — content-complete, shippable milestone

Whenever the version is bumped, add a new entry to [docs/PATCH_NOTES.md](docs/PATCH_NOTES.md) before committing.

## Architecture Reference

### Adding a new element

1. Add to `ELEMENTS` and `ELEMENT_COLORS` / `ELEMENT_NAMES` in [src/constants.ts](src/constants.ts)
2. Extend `ElementSystem._resolve()` combo table in [src/systems/ElementSystem.ts](src/systems/ElementSystem.ts)
3. Add `_specialXxx()` methods in [src/entities/Player.ts](src/entities/Player.ts)
4. Add atom texture in [src/scenes/BootScene.ts](src/scenes/BootScene.ts) `_makeAtoms()`
5. Add power descriptions to [src/scenes/ElementChoiceScene.ts](src/scenes/ElementChoiceScene.ts) `CHOICE_DESCRIPTIONS`

### Adding a new enemy

1. Add config entry in `CONFIGS` in [src/entities/Enemy.ts](src/entities/Enemy.ts)
2. Add texture generation in [src/scenes/BootScene.ts](src/scenes/BootScene.ts) `_makeEnemyTextures()`
3. Add to `GameScene._spawnStage()` `enemyDefs` array in [src/scenes/GameScene.ts](src/scenes/GameScene.ts)

### Adding a new stage

- Copy `GameScene._spawnStage()` pattern into a `StageData` config file (array of stages)
- `GameScene` reads the active stage index and loads the appropriate config
