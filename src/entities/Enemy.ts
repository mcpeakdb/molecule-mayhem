import Phaser from 'phaser';
import { FLOOR_MAX_Y, FLOOR_MIN_Y } from '../constants';
import type GameScene from '../scenes/GameScene';
import type { EnemySprite } from '../types';

const STATES = {
  PATROL: 'patrol',
  CHASE: 'chase',
  ATTACK: 'attack',
  HURT: 'hurt',
  DEAD: 'dead',
} as const;
type EnemyState = (typeof STATES)[keyof typeof STATES];

export type EnemyType = 'bacterium' | 'virus' | 'dustbunny' | 'pollen';

interface EnemyConfig {
  hp: number;
  speed: number;
  damage: number;
  attackRate: number;
  texture: string;
  scale: number;
}

const CONFIGS: Record<EnemyType, EnemyConfig> = {
  bacterium: { hp: 35, speed: 90, damage: 10, attackRate: 1600, texture: 'bacterium', scale: 1.0 },
  virus: { hp: 22, speed: 130, damage: 8, attackRate: 1200, texture: 'virus', scale: 1.0 },
  dustbunny: { hp: 50, speed: 60, damage: 14, attackRate: 2000, texture: 'dustbunny', scale: 1.0 },
  pollen: { hp: 18, speed: 160, damage: 6, attackRate: 900, texture: 'pollen', scale: 1.0 },
};

const DETECT_RANGE = 320;
const ATTACK_RANGE = 58;

export default class Enemy {
  scene: GameScene;
  type: EnemyType;
  maxHp: number;
  hp: number;
  speed: number;
  damage: number;
  attackRate: number;
  isBoss = false;

  sprite: EnemySprite;
  state: EnemyState = STATES.PATROL;
  patrolDir: number = Math.random() < 0.5 ? 1 : -1;
  patrolTimer = 0;
  attackTimer = 0;
  hurtTimer = 0;
  slowTimer = 0;

  constructor(scene: GameScene, x: number, y: number, type: EnemyType = 'bacterium') {
    this.scene = scene;
    this.type = type;

    const cfg = CONFIGS[type] ?? CONFIGS.bacterium;
    this.maxHp = cfg.hp;
    this.hp = cfg.hp;
    this.speed = cfg.speed;
    this.damage = cfg.damage;
    this.attackRate = cfg.attackRate;

    const base = scene.physics.add.sprite(x, y, cfg.texture) as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    base.setScale(cfg.scale);
    base.setDepth(y);
    base.body.setSize(30, 40);
    base.body.setCollideWorldBounds(true);
    this.sprite = base as EnemySprite;
    this.sprite.enemyRef = this;
  }

  update(_time: number, delta: number, playerSprite: Phaser.Physics.Arcade.Sprite): void {
    if (!this.sprite.active || this.state === STATES.DEAD) return;

    this.hurtTimer = Math.max(0, this.hurtTimer - delta);
    this.attackTimer = Math.max(0, this.attackTimer - delta);
    this.slowTimer = Math.max(0, this.slowTimer - delta);
    this.patrolTimer = Math.max(0, this.patrolTimer - delta);

    const speed = this.slowTimer > 0 ? this.speed * 0.3 : this.speed;

    if (this.state === STATES.HURT) {
      if (this.hurtTimer <= 0) this.state = STATES.PATROL;
      return;
    }

    const dx = playerSprite.x - this.sprite.x;
    const dy = playerSprite.y - this.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < DETECT_RANGE && this.state === STATES.PATROL) this.state = STATES.CHASE;
    if (dist >= DETECT_RANGE && this.state === STATES.CHASE) this.state = STATES.PATROL;

    switch (this.state) {
      case STATES.PATROL:
        this._patrol(speed);
        break;
      case STATES.CHASE:
        this._chase(dx, dy, dist, speed);
        break;
      case STATES.ATTACK:
        this._tryAttack(playerSprite);
        break;
    }

    if (this.state === STATES.CHASE && dist < ATTACK_RANGE) this.state = STATES.ATTACK;
    if (this.state === STATES.ATTACK && dist > ATTACK_RANGE * 1.4) this.state = STATES.CHASE;

    this.sprite.setFlipX(this.sprite.body.velocity.x < 0);
    this.sprite.setDepth(this.sprite.y);
    this.sprite.y = Phaser.Math.Clamp(this.sprite.y, FLOOR_MIN_Y, FLOOR_MAX_Y);
    this.sprite.setTint(this.slowTimer > 0 ? 0x44ffaa : 0xffffff);
    if (this.slowTimer <= 0) this.sprite.clearTint();
  }

  private _patrol(speed: number): void {
    if (this.patrolTimer <= 0) {
      this.patrolDir = Math.random() < 0.5 ? 1 : -1;
      this.patrolTimer = Phaser.Math.Between(1200, 2800);
    }
    this.sprite.body.setVelocity(this.patrolDir * speed * 0.4, 0);
  }

  private _chase(dx: number, dy: number, dist: number, speed: number): void {
    if (dist < 1) return;
    this.sprite.body.setVelocity((dx / dist) * speed, (dy / dist) * speed * 0.5);
  }

  private _tryAttack(_playerSprite: Phaser.Physics.Arcade.Sprite): void {
    this.sprite.body.setVelocity(0, 0);
    if (this.attackTimer <= 0) {
      this.attackTimer = this.attackRate;
      this.scene.player.takeDamage(this.damage);
      this.sprite.setTint(0xff6666);
      this.scene.time.delayedCall(150, () => this.sprite.clearTint());
    }
  }

  takeDamage(amount: number, knockbackDir = 1, slow = false): void {
    if (this.state === STATES.DEAD) return;
    this.hp -= amount;

    // Freeze, squish, then launch after a brief stagger window
    this.sprite.body.setVelocity(0, 0);
    this.scene.time.delayedCall(80, () => {
      if (this.sprite.active) this.sprite.body.setVelocity(knockbackDir * 200, -50);
    });

    this.scene.tweens.killTweensOf(this.sprite);
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 1.4,
      scaleY: 0.65,
      duration: 60,
      ease: 'Power2',
      yoyo: true,
      onComplete: () => {
        if (this.sprite.active) this.sprite.setScale(1);
      },
    });

    this.sprite.setTint(0xffffff);
    this.scene.time.delayedCall(120, () => {
      if (this.sprite.active) this.sprite.clearTint();
    });

    if (slow) this.slowTimer = 2000;
    this.state = STATES.HURT;
    this.hurtTimer = 300;

    if (this.hp <= 0) this._die();
  }

  private _die(): void {
    this.state = STATES.DEAD;
    this.sprite.body.setVelocity(0, 0);
    this.scene.onEnemyDeath(this);
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      y: this.sprite.y - 20,
      duration: 400,
      onComplete: () => this.sprite.destroy(),
    });
  }
}
