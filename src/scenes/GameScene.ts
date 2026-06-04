import Phaser from 'phaser';
import type { BaseAtom, Difficulty } from '../constants';
import {
  BOSS_X,
  DIFFICULTY_SCALE,
  FLOOR_CENTER_Y,
  FLOOR_MAX_Y,
  FLOOR_MIN_Y,
  GAME_HEIGHT,
  GAME_WIDTH,
  WORLD_WIDTH,
} from '../constants';
import Atom from '../entities/Atom';
import Boss from '../entities/Boss';
import Enemy, { type EnemyType } from '../entities/Enemy';
import Player from '../entities/Player';
import SoundSystem from '../systems/SoundSystem';
import type { AtomSprite, EnemySprite, WasdKeys } from '../types';

type ProjectileSprite = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody & {
  damage: number;
  knockback: number;
  piercing: boolean;
};

const SECTOR_THEMES: Record<
  number,
  {
    floorLine: number;
    shadow: number;
    label: string;
    tick: number;
    particles: number[];
    flashR: number;
    flashG: number;
    flashB: number;
    clearColor: string;
  }
> = {
  1: {
    floorLine: 0x7a9040,
    shadow: 0x081408,
    label: '#88bb60',
    tick: 0x6a8030,
    particles: [0xc8a040, 0x4aaa60, 0x80c8a0, 0xb8c870],
    flashR: 255,
    flashG: 230,
    flashB: 100,
    clearColor: '#ffee44',
  },
  2: {
    floorLine: 0xa04030,
    shadow: 0x180808,
    label: '#dd7744',
    tick: 0x803020,
    particles: [0xcc5030, 0xee7050, 0xff8860, 0xbb3820],
    flashR: 255,
    flashG: 110,
    flashB: 80,
    clearColor: '#ff9944',
  },
  3: {
    floorLine: 0x5050c0,
    shadow: 0x080812,
    label: '#7788ee',
    tick: 0x4040a0,
    particles: [0x7070cc, 0x5060cc, 0x9090ff, 0x5048cc],
    flashR: 120,
    flashG: 150,
    flashB: 255,
    clearColor: '#aaccff',
  },
};

export default class GameScene extends Phaser.Scene {
  // Declared here so entities can reference them via `import type GameScene`
  player!: Player;
  boss!: Boss;
  audioCtx!: AudioContext;
  score = 0;
  enemyGroup!: Phaser.Physics.Arcade.Group;
  atomGroup!: Phaser.Physics.Arcade.Group;
  projectileGroup!: Phaser.Physics.Arcade.Group;
  enemyProjectileGroup!: Phaser.Physics.Arcade.Group;

  currentStage = 1;
  difficulty: Difficulty = 'normal';

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: WasdKeys;
  private punchKeys!: Phaser.Input.Keyboard.Key[];
  private slotKeys!: Phaser.Input.Keyboard.Key[][];
  private pauseKey!: Phaser.Input.Keyboard.Key;
  private pauseKeyAlt!: Phaser.Input.Keyboard.Key;
  private isPaused = false;
  private stageCleared = false;

  constructor() {
    super('GameScene');
  }

  init(data?: { stage?: number; difficulty?: Difficulty }): void {
    this.currentStage = data?.stage ?? 1;
    this.score = 0;
    this.difficulty = data?.difficulty ?? (this.registry.get('difficulty') as Difficulty | undefined) ?? 'normal';
  }

  create(): void {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, GAME_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, GAME_HEIGHT);
    this.audioCtx = (this.sound as Phaser.Sound.WebAudioSoundManager).context;

    this._buildWorld();

    this.enemyGroup = this.physics.add.group();
    this.atomGroup = this.physics.add.group({ allowGravity: false });
    this.projectileGroup = this.physics.add.group({ allowGravity: false });
    this.enemyProjectileGroup = this.physics.add.group({ allowGravity: false });

    this._spawnStage();

    this.player = new Player(this, 120, FLOOR_CENTER_Y);
    this.player.invincibilityMs = DIFFICULTY_SCALE[this.difficulty].invincMs;
    this.cameras.main.startFollow(this.player.sprite, true, 0.08, 0.08);

    this.physics.add.overlap(this.player.sprite, this.atomGroup, (_p, atomSprite) =>
      this._onAtomCollect(atomSprite as AtomSprite),
    );

    this.physics.add.overlap(this.player.sprite, this.enemyProjectileGroup, (_p, proj) => {
      const p = proj as ProjectileSprite;
      if (!p.active) return;
      this.player.takeDamage(p.damage || 8);
      p.destroy();
    });

    this.physics.add.overlap(this.projectileGroup, this.enemyGroup, (proj, enemy) => {
      const p = proj as ProjectileSprite;
      const s = enemy as EnemySprite;
      if (!p.active || !s.active || !s.enemyRef) return;
      const dir = (p.body?.velocity.x ?? 0) > 0 ? 1 : -1;
      s.enemyRef.takeDamage(p.damage || 20, dir * (p.knockback || 2));
      if (!p.piercing) p.destroy();
    });

    this._setupInput();
    this.events.on('pause-resume', () => {
      this.isPaused = false;
      this.physics.resume();
    });
    this.scene.launch('HUDScene');
    this.isPaused = true;
    this.physics.pause();
    this.stageCleared = false;
    this._playStageIntro(() => {
      this.isPaused = false;
      this.physics.resume();
    });
  }

  private _playStageIntro(onComplete: () => void): void {
    const w = GAME_WIDTH;
    const h = GAME_HEIGHT;

    const dishMask = this.add.graphics().setScrollFactor(0).setDepth(-999);
    dishMask.fillStyle(0xffffff);
    dishMask.fillEllipse(w / 2, h / 2, w - 4, h - 4);
    this.cameras.main.setMask(dishMask.createGeometryMask());

    this.time.delayedCall(0, () => this.events.emit('intro-start'));

    const topBar = this.add.rectangle(0, -30, w, 60, 0x000000).setOrigin(0, 0.5).setScrollFactor(0).setDepth(400);
    const botBar = this.add
      .rectangle(0, h + 30, w, 60, 0x000000)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(400);

    const subText = this.add
      .text(w / 2, h / 2 - 38, `Stage ${this.currentStage}`, {
        fontSize: '22px',
        color: '#aaaacc',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(401)
      .setAlpha(0);

    const titleText = this.add
      .text(w / 2, h / 2 + 5, `PETRI DISH SECTOR ${this.currentStage}`, {
        fontSize: '42px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(401)
      .setAlpha(0);

    // Slide bars in
    this.tweens.add({ targets: topBar, y: 30, duration: 300, ease: 'Power2' });
    this.tweens.add({
      targets: botBar,
      y: h - 30,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        // Fade title in
        this.tweens.add({
          targets: [subText, titleText],
          alpha: 1,
          duration: 300,
          onComplete: () => {
            // Hold, then retract
            this.time.delayedCall(1200, () => {
              this.events.emit('intro-end');
              this.tweens.add({ targets: [subText, titleText], alpha: 0, duration: 300 });
              this.tweens.add({ targets: topBar, y: -30, duration: 300, ease: 'Power2' });
              this.tweens.add({
                targets: botBar,
                y: h + 30,
                duration: 300,
                ease: 'Power2',
                onComplete: () => {
                  topBar.destroy();
                  botBar.destroy();
                  subText.destroy();
                  titleText.destroy();
                  onComplete();
                },
              });
            });
          },
        });
      },
    });
  }

  private _buildWorld(): void {
    const theme = SECTOR_THEMES[this.currentStage];

    this.add
      .tileSprite(0, 0, WORLD_WIDTH, GAME_HEIGHT, `bg_tile_${this.currentStage}`)
      .setOrigin(0, 0)
      .setScrollFactor(0.3)
      .setDepth(-10);
    this.add
      .tileSprite(0, FLOOR_MIN_Y, WORLD_WIDTH, GAME_HEIGHT - FLOOR_MIN_Y, `ground_tile_${this.currentStage}`)
      .setOrigin(0, 0)
      .setDepth(-5);

    const gLine = this.add.graphics().setDepth(-4);
    gLine.lineStyle(3, theme.floorLine, 0.65);
    gLine.lineBetween(0, FLOOR_MIN_Y, WORLD_WIDTH, FLOOR_MIN_Y);
    gLine.lineStyle(1, theme.tick, 0.5);
    for (let tx = 0; tx <= WORLD_WIDTH; tx += 100) {
      gLine.lineBetween(tx, FLOOR_MIN_Y, tx, FLOOR_MIN_Y - (tx % 500 === 0 ? 14 : 7));
    }

    this.add.rectangle(WORLD_WIDTH / 2, FLOOR_MIN_Y - 30, WORLD_WIDTH, 60, theme.shadow, 0.9).setDepth(-6);

    for (let i = 0; i < 80; i++) {
      const g = this.add.graphics().setDepth(-3);
      const color = theme.particles[i % theme.particles.length];
      const x = Phaser.Math.Between(0, WORLD_WIDTH);
      const y = Phaser.Math.Between(50, FLOOR_MIN_Y - 20);
      if (i % 3 === 0) {
        // Cell debris ring
        g.lineStyle(0.8, color, Phaser.Math.FloatBetween(0.08, 0.2));
        g.strokeCircle(x, y, Phaser.Math.FloatBetween(3, 7));
      } else {
        // Granule
        g.fillStyle(color, Phaser.Math.FloatBetween(0.06, 0.2));
        g.fillCircle(x, y, Phaser.Math.FloatBetween(1, 2.5));
      }
    }

    this.add
      .text(300, FLOOR_MIN_Y - 50, `— PETRI DISH SECTOR ${this.currentStage} —`, {
        fontSize: '18px',
        color: theme.label,
        fontStyle: 'italic',
      })
      .setDepth(5)
      .setAlpha(0.65);
  }

  private _spawnStage(): void {
    const rY = () => Phaser.Math.Between(FLOOR_MIN_Y + 40, FLOOR_MAX_Y - 15);

    // Every atom is a choice node. With real stoichiometry, compounds cost several atoms
    // (e.g. CH₄ = 1C+4H), so sectors ramp up: Sector 1 is small and simple (base attacks /
    // Water at most), later sectors add nodes and richer choices for complex molecules.
    const atomDefs: { x: number; choices: BaseAtom[] }[] =
      this.currentStage === 1
        ? [
            // Sector 1 — only 4 atoms, just H/O/C. Enough for a base attack or a little Water.
            { x: 700, choices: ['hydrogen', 'oxygen'] },
            { x: 1700, choices: ['hydrogen', 'oxygen'] },
            { x: 2700, choices: ['hydrogen', 'carbon'] },
            { x: 3700, choices: ['oxygen', 'hydrogen'] },
          ]
        : this.currentStage === 2
          ? [
              // Sector 2 — 6 atoms, introduces Nitrogen (CO₂, Nitric Oxide, Ammonia, Water)
              { x: 500, choices: ['oxygen', 'carbon'] },
              { x: 1100, choices: ['hydrogen', 'nitrogen'] },
              { x: 1700, choices: ['oxygen', 'carbon'] },
              { x: 2400, choices: ['carbon', 'nitrogen'] },
              { x: 3100, choices: ['hydrogen', 'oxygen'] },
              { x: 3800, choices: ['oxygen', 'carbon', 'nitrogen'] },
            ]
          : [
              // Sector 3 — 9 atoms, all four; enough to assemble Methane / Carbonic Acid
              { x: 360, choices: ['nitrogen', 'carbon'] },
              { x: 760, choices: ['hydrogen', 'oxygen'] },
              { x: 1150, choices: ['oxygen', 'carbon'] },
              { x: 1600, choices: ['hydrogen', 'oxygen'] },
              { x: 2050, choices: ['oxygen', 'nitrogen'] },
              { x: 2500, choices: ['hydrogen', 'carbon'] },
              { x: 2950, choices: ['oxygen', 'hydrogen'] },
              { x: 3450, choices: ['carbon', 'oxygen'] },
              { x: 3950, choices: ['hydrogen', 'oxygen', 'nitrogen'] },
            ];

    atomDefs.forEach((def) => {
      const atom = new Atom(this, def.x, FLOOR_CENTER_Y - 80, def.choices);
      this.atomGroup.add(atom.sprite);
    });

    const enemyDefs: { x: number; y: number; type: EnemyType }[] =
      this.currentStage === 1
        ? [
            { x: 600, y: rY(), type: 'bacterium' },
            { x: 720, y: rY(), type: 'virus' },
            { x: 1100, y: rY(), type: 'bacterium' },
            { x: 1180, y: rY(), type: 'bacterium' },
            { x: 1600, y: rY(), type: 'virus' },
            { x: 1680, y: rY(), type: 'dustbunny' },
            { x: 2100, y: rY(), type: 'bacterium' },
            { x: 2200, y: rY(), type: 'pollen' },
            { x: 2300, y: rY(), type: 'virus' },
            { x: 2700, y: rY(), type: 'dustbunny' },
            { x: 2800, y: rY(), type: 'pollen' },
            { x: 2900, y: rY(), type: 'virus' },
            { x: 3300, y: rY(), type: 'bacterium' },
            { x: 3400, y: rY(), type: 'virus' },
            { x: 3500, y: rY(), type: 'bacterium' },
            { x: 4200, y: rY(), type: 'virus' },
            { x: 4280, y: rY(), type: 'pollen' },
            { x: 4350, y: rY(), type: 'dustbunny' },
          ]
        : this.currentStage === 2
          ? [
              { x: 500, y: rY(), type: 'virus' },
              { x: 620, y: rY(), type: 'bacterium' },
              { x: 740, y: rY(), type: 'virus' },
              { x: 1000, y: rY(), type: 'dustbunny' },
              { x: 1120, y: rY(), type: 'pollen' },
              { x: 1260, y: rY(), type: 'virus' },
              { x: 1380, y: rY(), type: 'bacterium' },
              { x: 1600, y: rY(), type: 'virus' },
              { x: 1720, y: rY(), type: 'dustbunny' },
              { x: 1840, y: rY(), type: 'pollen' },
              { x: 2100, y: rY(), type: 'bacterium' },
              { x: 2220, y: rY(), type: 'virus' },
              { x: 2340, y: rY(), type: 'virus' },
              { x: 2480, y: rY(), type: 'pollen' },
              { x: 2700, y: rY(), type: 'dustbunny' },
              { x: 2820, y: rY(), type: 'virus' },
              { x: 2940, y: rY(), type: 'bacterium' },
              { x: 3080, y: rY(), type: 'virus' },
              { x: 3300, y: rY(), type: 'pollen' },
              { x: 3420, y: rY(), type: 'dustbunny' },
              { x: 3540, y: rY(), type: 'virus' },
              { x: 3660, y: rY(), type: 'bacterium' },
              { x: 3900, y: rY(), type: 'virus' },
              { x: 4020, y: rY(), type: 'dustbunny' },
              { x: 4140, y: rY(), type: 'pollen' },
              { x: 4280, y: rY(), type: 'virus' },
            ]
          : [
              { x: 420, y: rY(), type: 'virus' },
              { x: 530, y: rY(), type: 'bacterium' },
              { x: 640, y: rY(), type: 'virus' },
              { x: 760, y: rY(), type: 'pollen' },
              { x: 880, y: rY(), type: 'dustbunny' },
              { x: 1000, y: rY(), type: 'virus' },
              { x: 1120, y: rY(), type: 'bacterium' },
              { x: 1240, y: rY(), type: 'virus' },
              { x: 1360, y: rY(), type: 'dustbunny' },
              { x: 1480, y: rY(), type: 'pollen' },
              { x: 1600, y: rY(), type: 'virus' },
              { x: 1720, y: rY(), type: 'bacterium' },
              { x: 1840, y: rY(), type: 'virus' },
              { x: 1960, y: rY(), type: 'pollen' },
              { x: 2080, y: rY(), type: 'dustbunny' },
              { x: 2200, y: rY(), type: 'bacterium' },
              { x: 2320, y: rY(), type: 'virus' },
              { x: 2440, y: rY(), type: 'virus' },
              { x: 2560, y: rY(), type: 'dustbunny' },
              { x: 2680, y: rY(), type: 'pollen' },
              { x: 2800, y: rY(), type: 'bacterium' },
              { x: 2920, y: rY(), type: 'virus' },
              { x: 3050, y: rY(), type: 'virus' },
              { x: 3170, y: rY(), type: 'pollen' },
              { x: 3290, y: rY(), type: 'dustbunny' },
              { x: 3410, y: rY(), type: 'bacterium' },
              { x: 3530, y: rY(), type: 'virus' },
              { x: 3660, y: rY(), type: 'virus' },
              { x: 3780, y: rY(), type: 'pollen' },
              { x: 3900, y: rY(), type: 'dustbunny' },
              { x: 4080, y: rY(), type: 'bacterium' },
              { x: 4220, y: rY(), type: 'virus' },
              { x: 4360, y: rY(), type: 'virus' },
            ];

    const scale = DIFFICULTY_SCALE[this.difficulty];

    enemyDefs.forEach((def) => {
      const e = new Enemy(this, def.x, def.y, def.type);
      e.hp = Math.round(e.hp * scale.enemyHp);
      e.maxHp = Math.round(e.maxHp * scale.enemyHp);
      e.speed *= scale.enemySpeed;
      this.enemyGroup.add(e.sprite);
    });

    this.boss = new Boss(this, BOSS_X, FLOOR_CENTER_Y);
    if (this.currentStage === 2) {
      this.boss.maxHp = 750;
      this.boss.hp = 750;
      this.boss.speed = 160;
    } else if (this.currentStage === 3) {
      this.boss.maxHp = 1100;
      this.boss.hp = 1100;
      this.boss.speed = 180;
      this.boss.damage = 30;
    }
    this.boss.hp = Math.round(this.boss.hp * scale.enemyHp);
    this.boss.maxHp = Math.round(this.boss.maxHp * scale.enemyHp);
    this.boss.speed *= scale.enemySpeed;
    this.enemyGroup.add(this.boss.sprite);
  }

  private _setupInput(): void {
    // biome-ignore lint/style/noNonNullAssertion: Phaser always initialises keyboard when InputPlugin is active
    const kb = this.input.keyboard!;
    this.cursors = kb.createCursorKeys();
    this.wasd = kb.addKeys('W,A,S,D') as WasdKeys;
    // All offense on the numpad: `.` = punch, 1-9 then 0 = attack slots.
    // Number-row digits + main-keyboard `.` are mirrored as a laptop fallback.
    const KC = Phaser.Input.Keyboard.KeyCodes;
    this.punchKeys = [kb.addKey(110), kb.addKey(KC.PERIOD)]; // numpad decimal + main `.`
    const numpad = [
      KC.NUMPAD_ONE,
      KC.NUMPAD_TWO,
      KC.NUMPAD_THREE,
      KC.NUMPAD_FOUR,
      KC.NUMPAD_FIVE,
      KC.NUMPAD_SIX,
      KC.NUMPAD_SEVEN,
      KC.NUMPAD_EIGHT,
      KC.NUMPAD_NINE,
      KC.NUMPAD_ZERO, // 10th slot
    ];
    const numRow = [KC.ONE, KC.TWO, KC.THREE, KC.FOUR, KC.FIVE, KC.SIX, KC.SEVEN, KC.EIGHT, KC.NINE, KC.ZERO];
    this.slotKeys = numpad.map((np, i) => [kb.addKey(np), kb.addKey(numRow[i])]);
    this.pauseKey = kb.addKey(KC.ESC);
    this.pauseKeyAlt = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
  }

  update(_time: number, delta: number): void {
    if (
      (Phaser.Input.Keyboard.JustDown(this.pauseKey) || Phaser.Input.Keyboard.JustDown(this.pauseKeyAlt)) &&
      !this.stageCleared
    ) {
      if (!this.isPaused) {
        this.isPaused = true;
        this.physics.pause();
        this.scene.launch('PauseScene', { stage: this.currentStage });
      }
    }

    if (this.isPaused || this.stageCleared) return;

    this.player.update(_time, delta, {
      cursors: this.cursors,
      wasd: this.wasd,
      punchKeys: this.punchKeys,
      slotKeys: this.slotKeys,
    });

    this.player.sprite.x = Phaser.Math.Clamp(this.player.sprite.x, 40, WORLD_WIDTH - 40);

    this.enemyGroup.getChildren().forEach((go) => {
      const s = go as EnemySprite;
      if (s.active && s.enemyRef) {
        s.enemyRef.update(_time, delta, this.player.sprite);
        s.setDepth(s.y);
      }
    });

    this.projectileGroup.getChildren().forEach((go) => {
      const p = go as Phaser.Physics.Arcade.Sprite;
      if (p.active && (p.x < 0 || p.x > WORLD_WIDTH)) p.destroy();
    });
    this.enemyProjectileGroup.getChildren().forEach((go) => {
      const p = go as Phaser.Physics.Arcade.Sprite;
      if (p.active && (p.x < 0 || p.x > WORLD_WIDTH || p.y < 0 || p.y > GAME_HEIGHT)) p.destroy();
    });

    this.events.emit('hud-update', { hp: this.player.hp, element: this.player.elementSystem });
  }

  // ── Helpers called by entities ──────────────────────────────────────────────

  spawnHitFlash(x: number, y: number, color = 0xffffff, size = 32): void {
    const g = this.add.graphics();
    g.fillStyle(color, 0.85);
    g.fillCircle(x, y, size * 0.6);
    g.setDepth(100);
    this.tweens.add({
      targets: g,
      alpha: 0,
      scaleX: 2.5,
      scaleY: 2.5,
      duration: 300,
      ease: 'Power2',
      onComplete: () => g.destroy(),
    });
  }

  spawnAtomBurst(x: number, y: number, color: number): void {
    const emitter = this.add.particles(x, y, 'particle', {
      lifespan: 600,
      speed: { min: 60, max: 180 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.2, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: color,
      emitting: false,
    });
    emitter.setDepth(95);
    emitter.explode(22);
    this.time.delayedCall(700, () => emitter.destroy());
  }

  // ── Reusable juice helpers (color-parameterized; visual only) ────────────────

  /** Radial particle burst — sparks, droplets, ice shards, debris, etc. */
  spawnBurst(
    x: number,
    y: number,
    color: number,
    opts: {
      count?: number;
      speed?: [number, number];
      angle?: [number, number];
      lifespan?: number;
      scale?: number;
    } = {},
  ): void {
    const [sMin, sMax] = opts.speed ?? [60, 180];
    const [aMin, aMax] = opts.angle ?? [0, 360];
    const lifespan = opts.lifespan ?? 500;
    const emitter = this.add.particles(x, y, 'particle', {
      lifespan,
      speed: { min: sMin, max: sMax },
      angle: { min: aMin, max: aMax },
      scale: { start: opts.scale ?? 1.0, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: color,
      emitting: false,
    });
    emitter.setDepth(95);
    emitter.explode(opts.count ?? 16);
    this.time.delayedCall(lifespan + 100, () => emitter.destroy());
  }

  /** Expanding ring shockwave (one or more concentric rings, optional soft fill). */
  spawnNova(
    x: number,
    y: number,
    color: number,
    maxR: number,
    opts: { rings?: number; life?: number; lineWidth?: number; fill?: boolean } = {},
  ): void {
    const rings = opts.rings ?? 2;
    const life = opts.life ?? 26;
    const g = this.add.graphics().setDepth(96);
    let t = 0;
    this.time.addEvent({
      delay: 16,
      repeat: life,
      callback: () => {
        t++;
        const f = t / life;
        g.clear();
        if (opts.fill) {
          g.fillStyle(color, 0.22 * (1 - f));
          g.fillCircle(x, y, maxR * f);
        }
        for (let i = 0; i < rings; i++) {
          const rf = Phaser.Math.Clamp(f - i * 0.18, 0, 1);
          if (rf <= 0) continue;
          g.lineStyle(opts.lineWidth ?? 3, color, 0.85 * (1 - rf));
          g.strokeCircle(x, y, maxR * rf);
        }
        if (t >= life) g.destroy();
      },
    });
  }

  /** A crescent slash that sweeps out in front and fades — for melee specials. */
  spawnSlashArc(x: number, y: number, dir: number, color: number, range = 110, height = 80): void {
    const g = this.add.graphics().setDepth(96);
    g.lineStyle(7, color, 0.95);
    g.beginPath();
    const steps = 12;
    for (let i = 0; i <= steps; i++) {
      const tt = i / steps;
      const ang = (tt - 0.5) * Math.PI * 0.9;
      const px = dir * Math.cos(ang) * range;
      const py = Math.sin(ang) * height;
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.strokePath();
    g.setPosition(x + dir * 25, y).setScale(0.6);
    this.tweens.add({
      targets: g,
      scaleX: 1.15,
      scaleY: 1.1,
      alpha: 0,
      duration: 220,
      ease: 'Quad.Out',
      onComplete: () => g.destroy(),
    });
  }

  /** A lingering, drifting cloud of translucent blobs — gas, fog, smog, acid mist. */
  spawnCloud(
    x: number,
    y: number,
    r: number,
    color: number,
    durationMs: number,
    opts: { blobs?: number; depth?: number; alpha?: number } = {},
  ): void {
    const blobs = opts.blobs ?? 9;
    const g = this.add.graphics().setDepth(opts.depth ?? 86);
    const seeds = Array.from({ length: blobs }, () => ({
      ang: Math.random() * Math.PI * 2,
      dist: Math.random() * r,
      rad: r * 0.3 + Math.random() * r * 0.35,
      ph: Math.random() * Math.PI * 2,
    }));
    const steps = Math.max(1, Math.floor(durationMs / 32));
    const peak = opts.alpha ?? 0.2;
    let t = 0;
    this.time.addEvent({
      delay: 32,
      repeat: steps,
      callback: () => {
        t++;
        const f = t / steps;
        const env = Math.min(1, f * 4) * (1 - Math.max(0, (f - 0.7) / 0.3));
        g.clear();
        for (const s of seeds) {
          const bx = x + Math.cos(s.ang) * s.dist;
          const by = y + Math.sin(s.ang) * s.dist * 0.6 - Math.sin(t * 0.05 + s.ph) * 6;
          const br = s.rad * (0.85 + 0.15 * Math.sin(t * 0.06 + s.ph));
          g.fillStyle(color, peak * env);
          g.fillCircle(bx, by, br);
        }
        if (t >= steps) g.destroy();
      },
    });
  }

  spawnProjectile(x: number, y: number, dir: number, color: number, damage: number, speed = 600, knockback = 2): void {
    const p = this.projectileGroup.create(x, y, 'projectile') as ProjectileSprite;
    p.setTint(color).setDepth(80);
    p.damage = damage;
    p.knockback = knockback;
    p.piercing = false;
    p.body.setAllowGravity(false);
    p.body.setVelocity(dir * speed, 0);
  }

  // Hydrogen Lv2 "Plasma Arc" — a glowing, crackling energy bolt with a trail and an impact burst
  spawnPlasmaBolt(x: number, y: number, dir: number, damage: number): void {
    const p = this.projectileGroup.create(x, y, 'projectile') as ProjectileSprite;
    p.setTint(0x4499ff).setDepth(80).setScale(1.8).setAlpha(0); // base sprite hidden; the plasma graphic is the visual
    p.damage = damage;
    p.knockback = 5;
    p.piercing = false;
    p.body.setAllowGravity(false);
    p.body.setVelocity(dir * 720, 0);

    const gfx = this.add.graphics().setDepth(81);
    const trail: { x: number; y: number }[] = [];
    let t = 0;

    const ev = this.time.addEvent({
      delay: 16,
      repeat: 220,
      callback: () => {
        t++;

        // Destroyed by the projectile↔enemy overlap → it hit something: burst + splash
        if (!p.active) {
          const last = trail[trail.length - 1] ?? { x, y };
          this.spawnHitFlash(last.x, last.y, 0x66bbff, 60);
          this.cameras.main.shake(120, 0.006);
          const ring = this.add.graphics().setDepth(82);
          let rt = 0;
          this.time.addEvent({
            delay: 16,
            repeat: 12,
            callback: () => {
              rt++;
              ring.clear();
              ring.lineStyle(3, 0xaaddff, 0.8 - rt * 0.06);
              ring.strokeCircle(last.x, last.y, rt * 6);
              if (rt >= 12) ring.destroy();
            },
          });
          // Splash damage to nearby enemies
          this.enemyGroup.getChildren().forEach((go) => {
            const s = go as EnemySprite;
            if (!s.active || !s.enemyRef) return;
            if (Phaser.Math.Distance.Between(last.x, last.y, s.x, s.y) < 70) {
              s.enemyRef.takeDamage(Math.round(damage * 0.5), dir * 3);
            }
          });
          gfx.destroy();
          ev.remove();
          return;
        }

        trail.push({ x: p.x, y: p.y });
        if (trail.length > 9) trail.shift();

        gfx.clear();
        // Fading trail
        for (let i = 0; i < trail.length; i++) {
          const f = i / trail.length;
          gfx.fillStyle(0x88ccff, f * 0.45);
          gfx.fillCircle(trail[i].x, trail[i].y, 3 + f * 8);
        }
        // Outer glow → core → white-hot center
        gfx.fillStyle(0x4499ff, 0.35);
        gfx.fillCircle(p.x, p.y, 18);
        gfx.fillStyle(0xaaddff, 0.9);
        gfx.fillCircle(p.x, p.y, 9);
        gfx.fillStyle(0xffffff, 0.95);
        gfx.fillCircle(p.x, p.y, 4);
        // Crackling electric arcs radiating from the core
        gfx.lineStyle(2, 0xcceeff, 0.85);
        for (let k = 0; k < 3; k++) {
          const ang = Math.random() * Math.PI * 2;
          const len = 13 + Math.random() * 11;
          const sx = p.x + Math.cos(ang) * 7;
          const sy = p.y + Math.sin(ang) * 7;
          const mx = p.x + Math.cos(ang) * len * 0.5 + (Math.random() - 0.5) * 9;
          const my = p.y + Math.sin(ang) * len * 0.5 + (Math.random() - 0.5) * 9;
          const ex = p.x + Math.cos(ang) * len;
          const ey = p.y + Math.sin(ang) * len;
          gfx.beginPath();
          gfx.moveTo(sx, sy);
          gfx.lineTo(mx, my);
          gfx.lineTo(ex, ey);
          gfx.strokePath();
        }

        // Flew off without hitting — clean up silently
        if (t >= 220) {
          gfx.destroy();
          ev.remove();
          p.destroy();
        }
      },
    });
  }

  spawnPiercingProjectile(x: number, y: number, dir: number, color: number, damage: number, speed = 650): void {
    const p = this.projectileGroup.create(x, y, 'projectile') as ProjectileSprite;
    p.setTint(color).setDepth(80).setScale(1.4);
    p.damage = damage;
    p.knockback = 1;
    p.piercing = true;
    p.body.setAllowGravity(false);
    p.body.setVelocity(dir * speed, 0);
  }

  spawnEnemyProjectile(x: number, y: number, angle: number, damage: number): void {
    const speed = 280;
    const p = this.enemyProjectileGroup.create(x, y, 'projectile') as ProjectileSprite;
    p.setTint(0xff6600).setDepth(80);
    p.damage = damage;
    p.knockback = 0;
    p.body.setAllowGravity(false);
    p.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
  }

  // Water Lv3 "Tidal Force" — a towering curling wave that sweeps the screen
  spawnTidalWave(x: number, _y: number, dir: number): void {
    const d = dir;
    const baseY = FLOOR_MAX_Y + 26; // wave foot, just below the walkable band
    const crestY = FLOOR_MIN_Y - 150; // wave peak, towering above
    const STEPS = 80;

    // Behind the entity band (player/enemy depth = their y ≥ FLOOR_MIN_Y) so the wave passes behind the caster
    const body = this.add.graphics().setDepth(FLOOR_MIN_Y - 20);
    const foam = this.add.graphics().setDepth(FLOOR_MIN_Y - 19);
    let waveX = x - d * 70;
    let step = 0;

    this.cameras.main.shake(500, 0.009);
    // A brief blue wash over the screen as it casts
    const wash = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x2299ee, 0)
      .setScrollFactor(0)
      .setDepth(FLOOR_MAX_Y + 40);
    this.tweens.add({
      targets: wash,
      alpha: 0.18,
      duration: 200,
      yoyo: true,
      hold: 200,
      onComplete: () => wash.destroy(),
    });

    this.time.addEvent({
      delay: 16,
      repeat: STEPS,
      callback: () => {
        step++;
        waveX += d * 13;
        const wob = Math.sin(step * 0.5) * 10;
        const cY = crestY + wob;
        const fade = step > STEPS * 0.8 ? Math.max(0, 1 - (step - STEPS * 0.8) / (STEPS * 0.2)) : 1;
        body.setAlpha(fade);
        foam.setAlpha(fade);

        // Wave silhouette — local x runs along the travel direction; concave curl handled by earcut
        const pt = (sx: number, sy: number) => ({ x: waveX + d * sx, y: sy });
        const outline = [
          pt(-90, baseY),
          pt(-88, baseY - 55),
          pt(-45, (baseY + cY) / 2),
          pt(-12, cY + 26),
          pt(12, cY), // crest peak
          pt(48, cY + 16), // curl lip overhanging forward
          pt(30, cY + 52), // hollow under the curl
          pt(54, baseY - 60), // front face
          pt(62, baseY), // front foot
        ];

        body.clear();
        // Wet trail dragging behind the wave along the floor
        const trailBack = waveX - d * 240;
        body.fillStyle(0x9fe8ff, 0.12 * fade);
        body.fillRect(Math.min(waveX, trailBack), FLOOR_MAX_Y + 8, 240, 14);

        // Depth layers: dark back → mid → bright front, offset for parallax volume
        const layers = [
          { col: 0x0d4f8a, a: 0.6, ox: -12 },
          { col: 0x1d8ec4, a: 0.62, ox: 0 },
          { col: 0x4fd0f5, a: 0.5, ox: 10 },
        ];
        for (const L of layers) {
          body.fillStyle(L.col, L.a);
          body.fillPoints(
            outline.map((p) => ({ x: p.x + d * L.ox, y: p.y })) as unknown as Phaser.Math.Vector2[],
            true,
          );
        }

        // Bright specular running down the front face
        body.lineStyle(3, 0xbff4ff, 0.7);
        body.beginPath();
        body.moveTo(pt(12, cY).x, pt(12, cY).y);
        body.lineTo(pt(48, cY + 16).x, pt(48, cY + 16).y);
        body.lineTo(pt(54, baseY - 60).x, pt(54, baseY - 60).y);
        body.strokePath();

        // Churning foam along the crest and curl
        foam.clear();
        for (let i = 0; i < 11; i++) {
          const ph = step * 0.3 + i * 1.7;
          const fx = waveX + d * (i * 5 - 22 + Math.sin(ph) * 26);
          const fy = cY + 10 + Math.cos(ph * 1.3) * 11;
          const r = 6 + (Math.sin(ph) * 0.5 + 0.5) * 7;
          foam.fillStyle(0xffffff, 0.55);
          foam.fillCircle(fx, fy, r);
          foam.fillStyle(0xddf6ff, 0.4);
          foam.fillCircle(fx, fy, r * 0.6);
        }
        // Spray droplets arcing off the crest (rise then fall under gravity)
        for (let i = 0; i < 9; i++) {
          const prog = ((step * 0.5 + i * 2.3) % 13) / 13;
          const dx = d * (10 + prog * 80) + d * Math.sin(i * 3) * 6;
          const dy = -prog * 130 + prog * prog * 95;
          const r = 3 * (1 - prog) + 1;
          foam.fillStyle(0xeaffff, 0.75 * (1 - prog));
          foam.fillCircle(waveX + dx, cY + 12 + dy, r);
        }

        // Damage and shove anything caught in the wave front
        this.enemyGroup.getChildren().forEach((go) => {
          const s = go as EnemySprite;
          if (s.active && s.enemyRef && Math.abs(s.x - waveX) < 95) {
            s.enemyRef.takeDamage(6, d * 6);
          }
        });

        if (step >= STEPS) {
          body.destroy();
          foam.destroy();
        }
      },
    });
  }

  // ── Atom Collection ─────────────────────────────────────────────────────────

  private _onAtomCollect(atomSprite: AtomSprite): void {
    const atom = atomSprite.atomRef;
    if (!atom || atom.collected) return;
    atom.collected = true;

    const { x, y } = atomSprite;
    atomSprite.destroy();

    this.spawnHitFlash(x, y, 0xaa44ff, 28);
    this.spawnAtomBurst(x, y, 0xaa44ff);
    this.cameras.main.shake(120, 0.004);
    SoundSystem.play(this.audioCtx, 'atom_collect');

    // Every atom is now a choice node — pick a base atom to grow the molecular tree
    this._showElementChoice(atom.choices ?? ['hydrogen', 'oxygen']);
  }

  private _showElementChoice(choices: BaseAtom[]): void {
    this.isPaused = true;
    this.physics.pause();
    this.scene.launch('ElementChoiceScene', {
      choices,
      counts: this.player.elementSystem.getCounts(),
      callback: (chosen: BaseAtom) => {
        this.isPaused = false;
        this.physics.resume();
        const upgraded = this.player.elementSystem.collectAtom(chosen);
        if (upgraded) SoundSystem.play(this.audioCtx, 'element_upgrade');
        this.events.emit('arsenal-update', this.player.getArsenalUpdate());
        this.scene.stop('ElementChoiceScene');
      },
    });
  }

  // ── Stage Events ─────────────────────────────────────────────────────────────

  onEnemyDeath(enemy: Enemy | Boss): void {
    const SCORES: Partial<Record<string, number>> = {
      bacterium: 100,
      virus: 80,
      dustbunny: 150,
      pollen: 60,
    };
    this.score += enemy.isBoss ? 1000 : (SCORES[(enemy as Enemy).type] ?? 100);
    this.events.emit('score-update', this.score);
  }

  onPlayerDeath(): void {
    this._showDeathScreen();
  }

  private _showDeathScreen(): void {
    this.isPaused = true;
    const w = GAME_WIDTH,
      h = GAME_HEIGHT;

    const overlay = this.add
      .rectangle(w / 2, h / 2, w, h, 0x000000)
      .setScrollFactor(0)
      .setDepth(500)
      .setAlpha(0);
    this.tweens.add({ targets: overlay, alpha: 0.8, duration: 400 });

    const diedText = this.add
      .text(w / 2, h / 2 - 60, 'YOU DIED', {
        fontSize: '72px',
        color: '#cc1111',
        fontStyle: 'bold',
        stroke: '#330000',
        strokeThickness: 8,
      })
      .setScrollFactor(0)
      .setOrigin(0.5)
      .setDepth(501)
      .setScale(2.5);
    this.tweens.add({ targets: diedText, scale: 1, duration: 400, ease: 'Back.Out' });

    this.add
      .text(w / 2, h / 2 + 20, `Score: ${this.score}`, {
        fontSize: '32px',
        color: '#ffffff',
      })
      .setScrollFactor(0)
      .setOrigin(0.5)
      .setDepth(501);

    const retryText = this.add
      .text(w / 2, h / 2 + 80, 'Press Z to retry', {
        fontSize: '26px',
        color: '#ffeeaa',
      })
      .setScrollFactor(0)
      .setOrigin(0.5)
      .setDepth(501);
    this.tweens.add({
      targets: retryText,
      alpha: 0.3,
      duration: 600,
      ease: 'Sine.InOut',
      yoyo: true,
      repeat: -1,
    });

    this.input.keyboard?.once('keydown-Z', () => {
      this.scene.stop('HUDScene');
      this.scene.start('GameScene', { stage: this.currentStage });
    });
  }

  onBossDefeated(): void {
    this.stageCleared = true;
    const theme = SECTOR_THEMES[this.currentStage];
    this.cameras.main.flash(600, theme.flashR, theme.flashG, theme.flashB);
    this.time.delayedCall(700, () => {
      const w = GAME_WIDTH,
        h = GAME_HEIGHT;
      this.add
        .rectangle(w / 2, h / 2, w, h, 0x000000, 0.55)
        .setScrollFactor(0)
        .setDepth(300);

      const isLast = this.currentStage >= 3;
      this.add
        .text(w / 2, h / 2 - 40, isLast ? 'EXPERIMENT COMPLETE!' : 'SECTOR CLEAR!', {
          fontSize: isLast ? '40px' : '48px',
          color: theme.clearColor,
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 6,
        })
        .setScrollFactor(0)
        .setOrigin(0.5)
        .setDepth(301);

      if (isLast) {
        this.add
          .text(w / 2, h / 2 + 10, `Final Score: ${this.score.toLocaleString()}`, {
            fontSize: '26px',
            color: '#ffffff',
          })
          .setScrollFactor(0)
          .setOrigin(0.5)
          .setDepth(301);
      }

      const prompt = this.add
        .text(
          w / 2,
          h / 2 + (isLast ? 55 : 30),
          isLast ? 'Press Z to play again' : `Press Z to enter Sector ${this.currentStage + 1}`,
          {
            fontSize: '26px',
            color: '#ffeeaa',
          },
        )
        .setScrollFactor(0)
        .setOrigin(0.5)
        .setDepth(301);
      this.tweens.add({ targets: prompt, alpha: 0.3, duration: 600, ease: 'Sine.InOut', yoyo: true, repeat: -1 });

      this.input.keyboard?.once('keydown-Z', () => {
        this.scene.stop('HUDScene');
        if (isLast) {
          this.scene.start('DifficultyScene');
        } else {
          this.scene.start('GameScene', { stage: this.currentStage + 1 });
        }
      });
    });
  }
}
