# Phase 5 — Content & QOL: Task Breakdown

---

## 1. Pause Menu ✓

**Goal:** Press ESC at any time during gameplay to pause and access Resume / Restart / Quit options.

### Key locations

- Input setup: `GameScene._setupInput()` — `src/scenes/GameScene.ts`
- New scene: `src/scenes/PauseScene.ts`
- Scene registration: `src/main.ts`

### Tasks

- [ ] **Create `src/scenes/PauseScene.ts`**
  - Semi-transparent dark overlay covering full screen.
  - Three menu options stacked vertically: `RESUME`, `RESTART SECTOR`, `QUIT TO SECTOR 1`.
  - Monospace font to match clinical HUD aesthetic.
  - Keyboard navigation: arrow keys move cursor, Z/Enter confirms, ESC resumes.
  - On RESUME: emit `'pause-resume'` event to GameScene, close self.
  - On RESTART SECTOR: stop HUDScene + PauseScene, `scene.start('GameScene', { stage: currentStage })`.
  - On QUIT: stop HUDScene + PauseScene, `scene.start('GameScene', { stage: 1 })`.

- [ ] **Register `PauseScene` in `src/main.ts`**
  - Add to scene array after `HUDScene`.

- [ ] **Add ESC key and pause logic to `GameScene`**
  - Register ESC in `_setupInput()` as `this.pauseKey`.
  - In `update()`: if ESC just pressed and not already paused → `isPaused = true`, `physics.pause()`, `scene.launch('PauseScene', { stage: currentStage })`.
  - Listen for `'pause-resume'` from PauseScene → `isPaused = false`, `physics.resume()`.
  - Guard against pausing during stage intro (check `stageCleared` or intro flag).

---

## 2. Difficulty Modes

**Goal:** Three difficulty settings (Easy / Normal / Hard) that scale enemy stats and player resilience. Selected once at the start of a run and persisted across sectors.

### Key locations

- Constants: `src/constants.ts`
- Difficulty selection UI: new `src/scenes/DifficultyScene.ts`
- Enemy scaling: `src/entities/Enemy.ts`, `src/entities/Boss.ts`
- Player scaling: `src/entities/Player.ts`
- Stage launch: `src/scenes/GameScene.ts`

### Tasks

- [ ] **Add difficulty constants to `src/constants.ts`**

  ```ts
  export type Difficulty = 'easy' | 'normal' | 'hard';
  export const DIFFICULTY_SCALE = {
    easy:   { enemyHp: 0.7, enemySpeed: 0.75, invincMs: 1200, atomBonus: 1 },
    normal: { enemyHp: 1.0, enemySpeed: 1.0,  invincMs: 800,  atomBonus: 0 },
    hard:   { enemyHp: 1.4, enemySpeed: 1.25, invincMs: 500,  atomBonus: -1 },
  };
  ```

- [ ] **Create `src/scenes/DifficultyScene.ts`**
  - Shown before Stage 1 only (not between sectors).
  - Three cards: EASY / NORMAL / HARD with brief descriptor text.
  - Selection stored in `this.registry.set('difficulty', chosen)` so it persists across scene restarts.
  - On confirm: `scene.start('GameScene', { stage: 1, difficulty: chosen })`.

- [ ] **Pass difficulty into `GameScene.init()`**
  - Add `difficulty: Difficulty` to `init()` data param, default `'normal'`.
  - Store as `this.difficulty`. Re-read from registry if not in data (sector advance won't pass it directly).

- [ ] **Apply enemy scaling in `GameScene._spawnStage()`**
  - After constructing each `Enemy`, multiply `e.maxHp`, `e.hp`, `e.speed` by the scale factors.
  - Scale boss HP/speed the same way (after the existing per-sector overrides).

- [ ] **Apply player scaling in `Player` constructor or `GameScene`**
  - Pass difficulty into Player, or set `PLAYER_INVINCIBILITY_MS` override on the instance.

- [ ] **Trigger `DifficultyScene` from `BootScene`**
  - Change `BootScene.create()` final call from `scene.start('GameScene')` → `scene.start('DifficultyScene')`.

---

## 3. Gamepad & Mobile Controls

**Goal:** Full gamepad support via Phaser's built-in API; on-screen touch buttons for mobile browsers.

### Key locations

- Input types: `src/types.ts`
- Input consumption: `Player.update()` — `src/entities/Player.ts`
- Input setup: `GameScene._setupInput()` — `src/scenes/GameScene.ts`
- New scene: `src/scenes/MobileControlsScene.ts`

### Tasks

- [ ] **Enable gamepad plugin in `src/main.ts`**

  ```ts
  input: { gamepad: true }
  ```

- [ ] **Extend `InputKeys` in `src/types.ts`** to include an optional `gamepad` field.

- [ ] **Poll gamepad in `GameScene.update()`**
  - Check `this.input.gamepad.getPad(0)` each frame.
  - Map left stick / D-pad → movement; A/Cross → jump; X/Square → attack; Y/Triangle → special; Start → pause.
  - Merge into the `InputKeys` object passed to `player.update()`.

- [ ] **Update `Player.update()` to read gamepad axes**
  - Left stick x/y replace keyboard left/right/up/down when gamepad active.
  - Dead-zone threshold of 0.2 to avoid drift.

- [ ] **Create `src/scenes/MobileControlsScene.ts`**
  - Launched alongside HUDScene only when `this.sys.game.device.input.touch` is true.
  - Virtual D-pad (four arrow zones) in bottom-left, rendered as semi-transparent circles.
  - Jump, Attack, Special buttons in bottom-right.
  - Each button emits events (`'mobile-jump'`, `'mobile-attack'`, `'mobile-special'`) that GameScene relays into the player input.
  - Buttons scale to 20% of screen width, positioned inside the oval game area.

---

## 4. Tilemap Stages

**Goal:** Replace the flat `TileSprite` ground with Tiled JSON tilemaps, enabling varied terrain (raised platforms, gaps, elevation changes) per sector.

### Key locations

- Asset loading: `src/scenes/BootScene.ts` (or a new `LoadScene`)
- World building: `GameScene._buildWorld()` — `src/scenes/GameScene.ts`
- New assets: `assets/tilemaps/sector1.json`, `sector2.json`, `sector3.json`
- New asset: `assets/tilesets/agar_tiles.png`

### Tasks

- [ ] **Create tileset PNG `assets/tilesets/agar_tiles.png`**
  - 64×64 tiles. At minimum: solid agar (ground), empty (transparent), decorative surface variants.
  - One tileset covers all three sectors; sector colour differences applied via tint in code.

- [ ] **Create Tiled JSON maps for each sector**
  - Sector 1 (`sector1.json`): mostly flat with 2–3 raised platforms mid-stage.
  - Sector 2 (`sector2.json`): more uneven, a dip or two in the middle.
  - Sector 3 (`sector3.json`): most complex — platforms at varying heights, narrow passages.
  - All maps: same world width as current (`WORLD_WIDTH = 5500`), height `GAME_HEIGHT = 540`.
  - Collision layer separate from visual layer.

- [ ] **Add a `LoadScene` before `BootScene`** (or extend `BootScene.preload()`)
  - `this.load.tilemapTiledJSON('map_1', 'assets/tilemaps/sector1.json')` etc.
  - `this.load.image('agar_tiles', 'assets/tilesets/agar_tiles.png')`

- [ ] **Rewrite `GameScene._buildWorld()` to use tilemap**
  - `const map = this.make.tilemap({ key: 'map_' + this.currentStage })`.
  - Add tileset: `map.addTilesetImage('agar_tiles', 'agar_tiles')`.
  - Create layers: visual ground layer, collision layer.
  - `this.physics.add.collider(this.player.sprite, collisionLayer)` + same for enemy group.
  - Remove the `tileSprite` ground call; keep the parallax `bg_tile` background.
  - Apply sector tint to the ground layer via `layer.setTint(...)`.

- [ ] **Update entity Y clamping**
  - Remove manual `sprite.y = Phaser.Math.Clamp(...)` in `Enemy.update()` and `Player.update()` — tilemap collision handles floor bounds.
  - Keep ceiling clamp to prevent jumping out of the oval.

- [ ] **Update `GameScene` world bounds**
  - Derive `WORLD_WIDTH` from `map.widthInPixels` instead of the constant, or keep constant and verify maps match.

---

## 5. External Sprite Assets (Art Pass Continuation)

**Goal:** Replace procedural `BootScene` texture generation with loaded PNG sprite sheets for characters and enemies. The procedural code stays as a fallback.

> **Note:** The clinical/microscope procedural art overhaul in v0.3.0 satisfies the visual direction. This task is for teams wanting production-quality hand-drawn or AI-generated pixel art instead.

### Key locations

- Texture generation: `src/scenes/BootScene.ts`
- New assets: `assets/sprites/*.png`
- New scene (if needed): `src/scenes/LoadScene.ts`

### Tasks

- [ ] **Create sprite sheets for each character**
  - Player: 3-frame walk cycle + idle (40×74 px frames, or upscaled).
  - Enemies: single frame each (bacterium, virus, dustbunny, pollen) + boss.
  - Atoms: hydrogen, oxygen, mystery, carbon, nitrogen.

- [ ] **Add `LoadScene` that preloads all PNG assets**
  - `this.load.spritesheet('player', 'assets/sprites/player.png', { frameWidth: 40, frameHeight: 74 })`
  - `this.load.image('bacterium', 'assets/sprites/bacterium.png')` etc.
  - On complete: `this.scene.start('BootScene')`.

- [ ] **Gate texture generation in `BootScene`**
  - Check `this.textures.exists('bacterium')` before each `_make*()` call.
  - If the PNG is already loaded, skip procedural generation and just define animations.

- [ ] **Register `LoadScene` first in `src/main.ts`** scene array.
