import Phaser from 'phaser';
import { FLOOR_MAX_Y, FLOOR_MIN_Y } from '../constants';
import type GameScene from '../scenes/GameScene';
import SoundSystem from '../systems/SoundSystem';
import type { EnemySprite } from '../types';

const PHASES = {
  IDLE: 'idle',
  CHARGE: 'charge',
  HURT: 'hurt',
  DEAD: 'dead',
} as const;
type BossPhase = (typeof PHASES)[keyof typeof PHASES];

export type BossVariant = 'bacterium' | 'amoeba' | 'phage';

interface BossVariantCfg {
  texture: string;
  name: string;
  hp: number;
  speed: number;
  damage: number;
  scale: number;
  bodySize: [number, number];
  bodyOffset: [number, number];
  projectileCount: number; // shots per ranged volley
  projectileSpread: number; // radians between adjacent shots
  labelColor: string;
  activateTint: number;
  fireTint: number;
}

const VARIANTS: Record<BossVariant, BossVariantCfg> = {
  // Sector 1 — the original Super Bacterium: balanced charger with a 3-shot flagella volley
  bacterium: {
    texture: 'boss_bacterium',
    name: 'SUPER BACTERIUM',
    hp: 500,
    speed: 140,
    damage: 22,
    scale: 1.5,
    bodySize: [60, 90],
    bodyOffset: [18, 10],
    projectileCount: 3,
    projectileSpread: 0.3,
    labelColor: '#ffaaaa',
    activateTint: 0xff0000,
    fireTint: 0xff8800,
  },
  // Sector 2 — Amoeba Titan: slower and beefier, lobs a wide 5-shot pseudopod spray
  amoeba: {
    texture: 'boss_amoeba',
    name: 'AMOEBA TITAN',
    hp: 850,
    speed: 120,
    damage: 26,
    scale: 1.7,
    bodySize: [64, 88],
    bodyOffset: [16, 16],
    projectileCount: 5,
    projectileSpread: 0.26,
    labelColor: '#aaffcc',
    activateTint: 0x33ff88,
    fireTint: 0x66ffaa,
  },
  // Sector 3 — Phage Lord: fast, hard-hitting finale boss with a dense 7-shot radial burst
  phage: {
    texture: 'boss_phage',
    name: 'PHAGE LORD',
    hp: 1300,
    speed: 175,
    damage: 32,
    scale: 1.6,
    bodySize: [50, 100],
    bodyOffset: [23, 6],
    projectileCount: 7,
    projectileSpread: 0.22,
    labelColor: '#aaddff',
    activateTint: 0x44aaff,
    fireTint: 0x88ccff,
  },
};

export default class Boss {
  scene: GameScene;
  variant: BossVariant;
  maxHp: number;
  hp: number;
  damage: number;
  speed: number;
  alive = true;
  isBoss = true;

  private readonly scale: number;
  private readonly projectileCount: number;
  private readonly projectileSpread: number;
  private readonly fireTint: number;
  private readonly activateTint: number;

  sprite: EnemySprite;
  phase: BossPhase = PHASES.IDLE;
  hurtTimer = 0;
  actionTimer = 0;
  activated = false;

  private hpBarBg: Phaser.GameObjects.Rectangle;
  private hpBar: Phaser.GameObjects.Rectangle;
  private hpLabel: Phaser.GameObjects.Text;

  constructor(scene: GameScene, x: number, y: number, variant: BossVariant = 'bacterium') {
    this.scene = scene;
    this.variant = variant;
    const cfg = VARIANTS[variant];
    this.maxHp = cfg.hp;
    this.hp = cfg.hp;
    this.damage = cfg.damage;
    this.speed = cfg.speed;
    this.scale = cfg.scale;
    this.projectileCount = cfg.projectileCount;
    this.projectileSpread = cfg.projectileSpread;
    this.fireTint = cfg.fireTint;
    this.activateTint = cfg.activateTint;

    const base = scene.physics.add.sprite(x, y, cfg.texture) as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    base.setScale(cfg.scale);
    base.setDepth(y + 10);
    base.body.setSize(cfg.bodySize[0], cfg.bodySize[1]);
    base.body.setOffset(cfg.bodyOffset[0], cfg.bodyOffset[1]);
    base.body.setCollideWorldBounds(true);
    this.sprite = base as EnemySprite;
    this.sprite.enemyRef = this;

    this.hpBarBg = scene.add.rectangle(0, 0, 300, 18, 0x330000).setDepth(200).setVisible(false);
    this.hpBar = scene.add.rectangle(0, 0, 300, 18, 0xff2222).setDepth(201).setVisible(false);
    this.hpLabel = scene.add
      .text(0, 0, cfg.name, {
        fontSize: '15px',
        color: cfg.labelColor,
        fontStyle: 'bold',
      })
      .setDepth(202)
      .setScrollFactor(0)
      .setVisible(false);
  }

  activate(): void {
    this.activated = true;
    this.hpBarBg.setVisible(true);
    this.hpBar.setVisible(true);
    this.hpLabel.setVisible(true);
    SoundSystem.play(this.scene.audioCtx, 'boss_roar');
    this.scene.cameras.main.shake(600, 0.018);
    this.sprite.setTint(this.activateTint);
    this.scene.time.delayedCall(500, () => this.sprite.clearTint());
    this.scene.events.emit('boss-activated');
  }

  update(time: number, delta: number, playerSprite: Phaser.Physics.Arcade.Sprite): void {
    if (!this.alive || !this.sprite.active) return;

    if (!this.activated) {
      const dist = Phaser.Math.Distance.Between(playerSprite.x, playerSprite.y, this.sprite.x, this.sprite.y);
      if (dist < 500) this.activate();
      return;
    }

    this.hurtTimer = Math.max(0, this.hurtTimer - delta);
    this.actionTimer = Math.max(0, this.actionTimer - delta);

    if (this.phase === PHASES.HURT) {
      if (this.hurtTimer <= 0) this.phase = PHASES.IDLE;
      this.sprite.body.setVelocityX(this.sprite.body.velocity.x * 0.9);
      this._updateHPBar();
      return;
    }
    if (this.phase === PHASES.DEAD) return;

    if (this.actionTimer <= 0) this._chooseNextAction();

    const dx = playerSprite.x - this.sprite.x;
    const dy = playerSprite.y - this.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (this.phase === PHASES.IDLE) {
      this.sprite.body.setVelocity(0, 0);
    } else if (this.phase === PHASES.CHARGE) {
      if (dist > 1) {
        this.sprite.body.setVelocity((dx / dist) * this.speed * 1.6, (dy / dist) * this.speed * 0.6);
      }
      if (dist < 70) {
        // A clean leap over the boss dodges the charge impact
        if (!this.scene.player.isClearingEnemy) this.scene.player.takeDamage(this.damage);
        this.phase = PHASES.IDLE;
        this.actionTimer = 800;
        this.sprite.body.setVelocity(-(dx / dist) * 150, 0);
      }
    }

    // Slow breathing pulse centred on the variant's base scale
    this.sprite.setScale(this.scale + Math.sin(time * 0.0007) * 0.05);

    this.sprite.setFlipX(dx < 0);
    this.sprite.setDepth(this.sprite.y + 10);
    this.sprite.y = Phaser.Math.Clamp(this.sprite.y, FLOOR_MIN_Y + 20, FLOOR_MAX_Y);
    this._updateHPBar();
  }

  private _chooseNextAction(): void {
    const hpPct = this.hp / this.maxHp;
    if (hpPct > 0.6) {
      this.phase = PHASES.CHARGE;
      this.actionTimer = 2200;
    } else if (hpPct > 0.3) {
      if (Math.random() < 0.5) {
        this.phase = PHASES.CHARGE;
        this.actionTimer = 1800;
      } else {
        this._fireFlagella();
        this.phase = PHASES.IDLE;
        this.actionTimer = 1000;
      }
    } else {
      if (Math.random() < 0.4) {
        this._fireFlagella();
        this.phase = PHASES.IDLE;
        this.actionTimer = 700;
      } else {
        this.phase = PHASES.CHARGE;
        this.actionTimer = 1200;
      }
    }
  }

  private _fireFlagella(): void {
    const player = this.scene.player.sprite;
    const baseAngle = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y, player.x, player.y);
    // Symmetric volley centred on the player; count/spread vary per boss variant.
    const half = (this.projectileCount - 1) / 2;
    for (let i = 0; i < this.projectileCount; i++) {
      const angle = baseAngle + (i - half) * this.projectileSpread;
      this.scene.spawnEnemyProjectile(this.sprite.x, this.sprite.y, angle, this.damage * 0.6);
    }
    this.sprite.setTint(this.fireTint);
    this.scene.time.delayedCall(200, () => this.sprite.clearTint());
  }

  private _updateHPBar(): void {
    const pct = Math.max(0, this.hp / this.maxHp);
    const cx = (this.scene.game.config.width as number) / 2;
    this.hpBarBg.setScrollFactor(0).setPosition(cx, 50);
    this.hpBar.setScrollFactor(0).setPosition(cx - 150 + 150 * pct, 50);
    this.hpBar.width = 300 * pct;
    this.hpLabel.setScrollFactor(0).setPosition(cx - 80, 32);
  }

  applyBleed(_damage: number, _duration: number): void {
    /* boss is immune to bleed */
  }

  takeDamage(amount: number, knockbackDir = 1): void {
    // Not on screen yet — screen-wide specials must not reach the boss before it activates,
    // otherwise it can be killed offscreen and the stage gets stuck in a degenerate state.
    if (!this.activated) return;
    if (!this.alive || this.phase === PHASES.DEAD) return;
    this.hp = Math.round(this.hp - amount);

    this.sprite.body.setVelocity(0, 0);
    this.scene.time.delayedCall(80, () => {
      if (this.sprite.active) this.sprite.body.setVelocity(knockbackDir * 80, 0);
    });

    this.scene.tweens.killTweensOf(this.sprite);
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: this.scale * 1.4,
      scaleY: this.scale * 0.65,
      duration: 80,
      ease: 'Power2',
      yoyo: true,
      onComplete: () => {
        if (this.sprite.active) this.sprite.setScale(this.scale);
      },
    });

    this.sprite.setTint(0xffffff);
    this.scene.time.delayedCall(120, () => {
      if (this.sprite.active) this.sprite.clearTint();
    });
    this.phase = PHASES.HURT;
    this.hurtTimer = 200;

    if (this.hp <= 0) this._die();
  }

  private _die(): void {
    this.alive = false;
    this.phase = PHASES.DEAD;
    this.sprite.body.setVelocity(0, 0);
    this.hpBarBg.destroy();
    this.hpBar.destroy();
    this.hpLabel.destroy();
    this.scene.cameras.main.shake(800, 0.02);

    for (let i = 0; i < 8; i++) {
      this.scene.time.delayedCall(i * 180, () => {
        const ox = Phaser.Math.Between(-40, 40);
        const oy = Phaser.Math.Between(-40, 40);
        this.scene.spawnHitFlash(this.sprite.x + ox, this.sprite.y + oy, 0xff8800, 60);
      });
    }

    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      scaleX: 3,
      scaleY: 3,
      duration: 1400,
      onComplete: () => {
        this.sprite.destroy();
        this.scene.onBossDefeated();
      },
    });
  }
}
