# Phase 1 — Detailed Task Breakdown

---

## 1. Sound Effects

**Goal:** Every key game moment has audio feedback using Web Audio API (no external asset files — keep it fully procedural).

### Implementation approach

Use Phaser's built-in `WebAudioSoundManager` via `this.sound.add(key)` with generated `AudioBuffer`s, or call the Web Audio API directly from a helper in `src/systems/SoundSystem.ts`.

### Tasks

- [x] **Create `src/systems/SoundSystem.ts`**
  - Expose a static `play(ctx, type)` method that accepts a `BaseAudioContext` and a sound key.
  - Generate each sound procedurally with `ctx.createOscillator()` / `ctx.createGain()` / `ctx.createBuffer()`.
  - Sound definitions to implement:
    - `punch` — short noise burst + pitch drop (50 ms, square wave 180 Hz → 80 Hz)
    - `atom_collect` — ascending two-tone chime (sine, 440 Hz → 660 Hz, 120 ms)
    - `element_upgrade` — three-note fanfare (C4 → E4 → G4, sine, 80 ms each)
    - `boss_roar` — low rumble + sawtooth sweep (80 Hz → 40 Hz, 400 ms)
    - `player_death` — descending chromatic noise fade (300 ms)

- [x] **Wire `punch` into `Player._doMeleeAttack()`** (`src/entities/Player.ts`)
  - Call `SoundSystem.play(ctx, 'punch')` at the top of `_doMeleeAttack()`.

- [x] **Wire `atom_collect` into `GameScene._onAtomCollect()`** (`src/scenes/GameScene.ts`)
  - Call after `atomSprite.destroy()`, before the element choice branch.

- [x] **Wire `element_upgrade` into `ElementSystem.collectAtom()`**
  - `collectAtom` now returns `boolean`; callers in GameScene play the sound when `true`.

- [x] **Wire `boss_roar` into `Boss.activate()`** (`src/entities/Boss.ts`)
  - Plays on first activation when the player enters detection range.

- [x] **Wire `player_death` into `Player._die()`** (`src/entities/Player.ts`)
  - Play at the top of `_die()`.

- [x] **Expose `AudioContext` via `GameScene`** so entities can reach it without importing a singleton.
  - Added `audioCtx: AudioContext` as a public field, initialized from Phaser's `WebAudioSoundManager.context` in `create()`.

---

## 2. Particle Bursts on Atom Collection

**Goal:** When the player picks up an atom, a color-matched particle burst erupts at the collection point.

### Key location

`GameScene._onAtomCollect()` — `src/scenes/GameScene.ts:253`

### Tasks

- [x] **Generate a 6×6 white square particle texture in `BootScene.create()`**
  - Added `this._makeParticle()` call and method that writes a `'particle'` key.

- [x] **Add `spawnAtomBurst(x, y, color)` method to `GameScene`**
  - Uses `this.add.particles(x, y, 'particle', config)` (Phaser 3.90 API).
  - 22 particles, `lifespan: 600`, `speed: { min: 60, max: 180 }`, `scale: { start: 1.2, end: 0 }`, `alpha: { start: 1, end: 0 }`, `tint: color`. Emitter auto-destroyed after 700 ms.

- [x] **Call `spawnAtomBurst` in `_onAtomCollect`** after `atomSprite.destroy()`.
  - Reuses the same `burstColor` already passed to `spawnHitFlash`. Both effects fire together.

- [x] **Also burst on mystery atom collect** — burst fires before `_showElementChoice` for all atom types including mystery.

---

## 3. Player Walk Animation

**Goal:** The player sprite cycles through 2–3 procedural frames while moving, and holds a neutral frame while idle.

### Key locations

- Texture generation: `BootScene._makePlayer()` — `src/scenes/BootScene.ts:39`
- Animation playback: `Player.update()` — `src/entities/Player.ts:35`

### Tasks

- [x] **Generate 3 player frames in `BootScene._makePlayer()`**
  - Frame 0 (`player_0`): current drawing, legs neutral — left leg rect at y=46, right leg rect at y=46.
  - Frame 1 (`player_1`): left leg forward — left leg rect shifted to y=42, right leg shifted to y=50.
  - Frame 2 (`player_2`): right leg forward — left leg rect shifted to y=50, right leg shifted to y=42.
  - Keep all other body parts identical across frames.
  - Output keys `'player_0'`, `'player_1'`, `'player_2'` instead of `'player'`.

- [x] **Create Phaser animations in `BootScene._makePlayer()`** after generating frames
  - Walk anim: key `'player_walk'`, frames `['player_0','player_1','player_2','player_1']`, `frameRate: 8`, `repeat: -1`.
  - Idle anim: key `'player_idle'`, frames `['player_0']`, `frameRate: 1`, `repeat: -1`.

- [x] **Update `Player` constructor** (`src/entities/Player.ts:27`)
  - Change `scene.physics.add.sprite(x, y, 'player')` → `scene.physics.add.sprite(x, y, 'player_0')`.
  - After construction, call `this.sprite.play('player_idle')`.

- [x] **Switch animations in `Player.update()`** based on `vx`/`vy` (`src/entities/Player.ts:52`)
  - After computing `vx` and `vy`: if moving (`vx !== 0 || vy !== 0`) and current anim is not `'player_walk'` → `this.sprite.play('player_walk')`.
  - If stopped and current anim is not `'player_idle'` → `this.sprite.play('player_idle')`.

---

## 4. Enemy Hit Stagger

**Goal:** When an enemy takes damage, it briefly freezes and plays a squish tween for clear hit confirmation.

### Key location

`Enemy.takeDamage()` — `src/entities/Enemy.ts:124`

### Tasks

- [x] **Scale squish tween in `Enemy.takeDamage()`**
  - `scaleX: 1.4, scaleY: 0.65`, 60 ms, Power2, yoyo. `killTweensOf` before adding so rapid hits don't stack. `onComplete` resets scale with `sprite.active` guard.

- [x] **Velocity freeze + delayed knockback**
  - Velocity zeroed immediately on hit; `delayedCall(80)` applies the `knockbackDir * 200, -50` launch after the stagger window.

- [x] **Propagated to `Boss.takeDamage()`**
  - Same pattern with proportional scale targets (`scaleX: 2.1, scaleY: 0.975`) to match the boss's 1.5 base scale. `onComplete` resets to `setScale(1.5)`.

---

## 5. Combo Counter HUD

**Goal:** Track consecutive hits without being hit and show a multiplier on the HUD. Reset on damage taken.

### Key locations

- Hit tracking: `Player._doMeleeAttack()` / `_doSpecialAttack()` — `src/entities/Player.ts:75, 94`
- Damage reset: `Player.takeDamage()` — `src/entities/Player.ts:166`
- Display: `HUDScene` — `src/scenes/HUDScene.ts`

### Tasks

- [x] **Added `comboCount` and `comboMultiplier` public fields to `Player`**

- [x] **Increment combo in `Player._doMeleeAttack()`**
  - Tracks whether any enemy was in range; only increments if at least one was hit.
  - `comboMultiplier = 1 + Math.floor(comboCount / 5) * 0.5` (×1.5 at 5 hits, ×2.0 at 10, etc.).
  - Melee damage = `Math.round(PLAYER_MELEE_DAMAGE * comboMultiplier)`.
  - Emits `'combo-update', count, multiplier`.

- [x] **Reset combo in `Player.takeDamage()`** — resets after the invincibility guard so iframes don't clear the streak.

- [x] **Combo display in `HUDScene`** (top-right, below score)
  - `comboText`: count ("8 HITS"), large white, scale-punch tween on each update.
  - `comboSub`: "COMBO" or "×1.5 COMBO" in yellow when multiplier kicks in.
  - Both fade to alpha 0 when count drops below 2.

---

## 6. Stage Intro Sequence

**Goal:** When the stage loads, a 2-second letterbox + title card animates in and out before gameplay begins.

### Key location

`GameScene.create()` — `src/scenes/GameScene.ts:34` (specifically after all setup, before `isPaused = false` at line 79)

### Tasks

- [x] **Set `this.isPaused = true` and `this.physics.pause()` at end of `create()`**
  - Physics and update loop both frozen until the intro completes.

- [x] **Created `_playStageIntro(onComplete)` in `GameScene`**
  - Two black 60 px letterbox bars slide in from top/bottom (300 ms, Power2).
  - `'Stage 1'` sub-title + `'PETRI DISH SECTOR 1'` main title fade in after bars land (300 ms).
  - Hold 1200 ms, then bars retract and text fades simultaneously (300 ms).
  - `onComplete` fires after retract: sets `isPaused = false` and `physics.resume()`.

- [x] **Call `_playStageIntro` at the end of `create()`**

---

## 7. Death Screen

**Goal:** Replace the instant fade-restart on player death with a "YOU DIED" overlay showing the final score and a retry prompt.

### Key locations

- Death trigger: `Player._die()` — `src/entities/Player.ts:174`
- Handler: `GameScene.onPlayerDeath()` — `src/scenes/GameScene.ts:298`

### Tasks

- [x] **Add a score tracker to `GameScene`**
  - `score = 0` public field. `onEnemyDeath()` increments by type (bacterium: 100, virus: 80, dustbunny: 150, pollen: 60, boss: 1000) and emits `'score-update'`.

- [x] **Add `score` display to `HUDScene`**
  - `scoreText` right-aligned at top-right, updates on `'score-update'` event.

- [x] **Rewrite `GameScene.onPlayerDeath()`**
  - Now just calls `_showDeathScreen()`. Camera fade removed.

- [x] **Create `_showDeathScreen()` in `GameScene`**
  - Black overlay fades to 0.8 alpha over 400 ms.
  - `'YOU DIED'` scales from 2.5 → 1 with `Back.Out` ease over 400 ms.
  - Final score displayed below title.
  - `'Press Z to retry'` blinks (alpha 1 → 0.3, Sine.InOut, repeat -1).
  - `keyboard.once('keydown-Z')` stops HUDScene and restarts GameScene.
