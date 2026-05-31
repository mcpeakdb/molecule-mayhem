import Phaser from 'phaser';
import type { Difficulty, ElementType } from '../constants';
import { BOSS_X, DIFFICULTY_SCALE, FLOOR_CENTER_Y, FLOOR_MAX_Y, FLOOR_MIN_Y, GAME_HEIGHT, GAME_WIDTH, WORLD_WIDTH } from '../constants';
import Atom, { type AtomType } from '../entities/Atom';
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
  private attackKey!: Phaser.Input.Keyboard.Key;
  private specialKey!: Phaser.Input.Keyboard.Key;
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
    this.difficulty = data?.difficulty
      ?? (this.registry.get('difficulty') as Difficulty | undefined)
      ?? 'normal';
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

    const atomDefs: { x: number; type: AtomType; choices?: ElementType[] }[] =
      this.currentStage === 1
        ? [
            { x: 380, type: 'hydrogen' },
            { x: 1350, type: 'mystery', choices: ['hydrogen', 'carbon'] },
            { x: 2500, type: 'oxygen' },
            { x: 3600, type: 'mystery', choices: ['nitrogen', 'oxygen'] },
          ]
        : this.currentStage === 2
          ? [
              { x: 450, type: 'oxygen' },
              { x: 1400, type: 'mystery', choices: ['carbon', 'nitrogen'] },
              { x: 2600, type: 'hydrogen' },
              { x: 3700, type: 'mystery', choices: ['oxygen', 'carbon'] },
            ]
          : [
              { x: 700, type: 'mystery', choices: ['nitrogen', 'carbon'] },
              { x: 2200, type: 'mystery', choices: ['hydrogen', 'oxygen'] },
              { x: 3800, type: 'mystery', choices: ['carbon', 'nitrogen'] },
            ];

    atomDefs.forEach((def) => {
      const atom = new Atom(this, def.x, FLOOR_CENTER_Y - 80, def.type, def.choices ?? null);
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
      e.hp    = Math.round(e.hp    * scale.enemyHp);
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
    this.boss.hp    = Math.round(this.boss.hp    * scale.enemyHp);
    this.boss.maxHp = Math.round(this.boss.maxHp * scale.enemyHp);
    this.boss.speed *= scale.enemySpeed;
    this.enemyGroup.add(this.boss.sprite);
  }

  private _setupInput(): void {
    // biome-ignore lint/style/noNonNullAssertion: Phaser always initialises keyboard when InputPlugin is active
    const kb = this.input.keyboard!;
    this.cursors = kb.createCursorKeys();
    this.wasd = kb.addKeys('W,A,S,D') as WasdKeys;
    this.attackKey   = kb.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.specialKey  = kb.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.pauseKey    = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
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
      attackKey: this.attackKey,
      specialKey: this.specialKey,
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

  spawnProjectile(x: number, y: number, dir: number, color: number, damage: number, speed = 600, knockback = 2): void {
    const p = this.projectileGroup.create(x, y, 'projectile') as ProjectileSprite;
    p.setTint(color).setDepth(80);
    p.damage = damage;
    p.knockback = knockback;
    p.piercing = false;
    p.body.setAllowGravity(false);
    p.body.setVelocity(dir * speed, 0);
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

  spawnTidalWave(x: number, _y: number, dir: number): void {
    const damage = 60;
    const wave = this.add.graphics().setDepth(90);
    let waveX = x;
    let step = 0;

    this.time.addEvent({
      delay: 16,
      repeat: 60,
      callback: () => {
        step++;
        waveX += dir * 8;
        wave.clear();
        wave.fillStyle(0x22ccff, 0.5);
        wave.fillRect(waveX - 60, FLOOR_MIN_Y, 120, FLOOR_MAX_Y - FLOOR_MIN_Y);
        wave.lineStyle(3, 0x88eeff);
        wave.strokeRect(waveX - 60, FLOOR_MIN_Y, 120, FLOOR_MAX_Y - FLOOR_MIN_Y);

        this.enemyGroup.getChildren().forEach((go) => {
          const s = go as EnemySprite;
          if (s.active && s.enemyRef && Math.abs(s.x - waveX) < 80) {
            s.enemyRef.takeDamage(damage / 10, dir * 4);
          }
        });

        if (step >= 60) wave.destroy();
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

    const colorMap: Partial<Record<AtomType, number>> = {
      hydrogen: 0x4499ff,
      oxygen: 0xff5533,
      mystery: 0xaa44ff,
    };
    const burstColor = colorMap[atom.type] ?? 0xffffff;
    this.spawnHitFlash(x, y, burstColor, 28);
    this.spawnAtomBurst(x, y, burstColor);
    this.cameras.main.shake(120, 0.004);
    SoundSystem.play(this.audioCtx, 'atom_collect');

    if (atom.type === 'mystery') {
      this._showElementChoice(atom.choices ?? ['hydrogen', 'oxygen']);
    } else {
      const upgraded = this.player.elementSystem.collectAtom(atom.type as ElementType);
      if (upgraded) SoundSystem.play(this.audioCtx, 'element_upgrade');
      this.events.emit('element-changed', this.player.elementSystem.getState());
    }
  }

  private _showElementChoice(choices: ElementType[]): void {
    this.isPaused = true;
    this.physics.pause();
    this.scene.launch('ElementChoiceScene', {
      choices,
      callback: (chosen: ElementType) => {
        this.isPaused = false;
        this.physics.resume();
        const upgraded = this.player.elementSystem.collectAtom(chosen);
        if (upgraded) SoundSystem.play(this.audioCtx, 'element_upgrade');
        this.events.emit('element-changed', this.player.elementSystem.getState());
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
