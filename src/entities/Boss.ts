import Phaser from 'phaser';
import { FLOOR_MIN_Y, FLOOR_MAX_Y } from '../constants';
import type { EnemySprite } from '../types';
import type GameScene from '../scenes/GameScene';

const PHASES = {
  IDLE: 'idle', CHARGE: 'charge', HURT: 'hurt', DEAD: 'dead',
} as const;
type BossPhase = typeof PHASES[keyof typeof PHASES];

export default class Boss {
  scene:       GameScene;
  maxHp        = 500;
  hp           = 500;
  damage       = 22;
  speed        = 140;
  alive        = true;
  isBoss       = true;

  sprite:      EnemySprite;
  phase:       BossPhase = PHASES.IDLE;
  hurtTimer    = 0;
  actionTimer  = 0;
  activated    = false;

  private hpBarBg: Phaser.GameObjects.Rectangle;
  private hpBar:   Phaser.GameObjects.Rectangle;
  private hpLabel: Phaser.GameObjects.Text;

  constructor(scene: GameScene, x: number, y: number) {
    this.scene = scene;

    const base = scene.physics.add.sprite(x, y, 'boss_bacterium') as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    base.setScale(1.5);
    base.setDepth(y + 10);
    base.body.setSize(60, 90);
    base.body.setOffset(18, 10);
    base.body.setCollideWorldBounds(true);
    this.sprite = base as EnemySprite;
    this.sprite.enemyRef = this;

    this.hpBarBg = scene.add.rectangle(0, 0, 300, 18, 0x330000).setDepth(200).setVisible(false);
    this.hpBar   = scene.add.rectangle(0, 0, 300, 18, 0xff2222).setDepth(201).setVisible(false);
    this.hpLabel = scene.add.text(0, 0, 'SUPER BACTERIUM', {
      fontSize: '12px', color: '#ffaaaa', fontStyle: 'bold',
    }).setDepth(202).setScrollFactor(0).setVisible(false);
  }

  activate(): void {
    this.activated = true;
    this.hpBarBg.setVisible(true);
    this.hpBar.setVisible(true);
    this.hpLabel.setVisible(true);
    this.scene.cameras.main.shake(600, 0.018);
    this.sprite.setTint(0xff0000);
    this.scene.time.delayedCall(500, () => this.sprite.clearTint());
    this.scene.events.emit('boss-activated');
  }

  update(_time: number, delta: number, playerSprite: Phaser.Physics.Arcade.Sprite): void {
    if (!this.alive || !this.sprite.active) return;

    if (!this.activated) {
      const dist = Phaser.Math.Distance.Between(
        playerSprite.x, playerSprite.y, this.sprite.x, this.sprite.y,
      );
      if (dist < 500) this.activate();
      return;
    }

    this.hurtTimer   = Math.max(0, this.hurtTimer   - delta);
    this.actionTimer = Math.max(0, this.actionTimer - delta);

    if (this.phase === PHASES.HURT) {
      if (this.hurtTimer <= 0) this.phase = PHASES.IDLE;
      this.sprite.body.setVelocityX(this.sprite.body.velocity.x * 0.9);
      this._updateHPBar();
      return;
    }
    if (this.phase === PHASES.DEAD) return;

    if (this.actionTimer <= 0) this._chooseNextAction();

    const dx   = playerSprite.x - this.sprite.x;
    const dy   = playerSprite.y - this.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (this.phase === PHASES.IDLE) {
      this.sprite.body.setVelocity(0, 0);
    } else if (this.phase === PHASES.CHARGE) {
      if (dist > 1) {
        this.sprite.body.setVelocity((dx / dist) * this.speed * 1.6, (dy / dist) * this.speed * 0.6);
      }
      if (dist < 70) {
        this.scene.player.takeDamage(this.damage);
        this.phase = PHASES.IDLE;
        this.actionTimer = 800;
        this.sprite.body.setVelocity(-(dx / dist) * 150, 0);
      }
    }

    this.sprite.setFlipX(dx < 0);
    this.sprite.setDepth(this.sprite.y + 10);
    this.sprite.y = Phaser.Math.Clamp(this.sprite.y, FLOOR_MIN_Y + 20, FLOOR_MAX_Y);
    this._updateHPBar();
  }

  private _chooseNextAction(): void {
    const hpPct = this.hp / this.maxHp;
    if (hpPct > 0.6) {
      this.phase = PHASES.CHARGE; this.actionTimer = 2200;
    } else if (hpPct > 0.3) {
      if (Math.random() < 0.5) { this.phase = PHASES.CHARGE; this.actionTimer = 1800; }
      else                      { this._fireFlagella(); this.phase = PHASES.IDLE; this.actionTimer = 1000; }
    } else {
      if (Math.random() < 0.4) { this._fireFlagella(); this.phase = PHASES.IDLE; this.actionTimer = 700; }
      else                     { this.phase = PHASES.CHARGE; this.actionTimer = 1200; }
    }
  }

  private _fireFlagella(): void {
    const player = this.scene.player.sprite;
    const baseAngle = Phaser.Math.Angle.Between(
      this.sprite.x, this.sprite.y, player.x, player.y,
    );
    for (let i = -1; i <= 1; i++) {
      this.scene.spawnEnemyProjectile(this.sprite.x, this.sprite.y, baseAngle + i * 0.3, this.damage * 0.6);
    }
    this.sprite.setTint(0xff8800);
    this.scene.time.delayedCall(200, () => this.sprite.clearTint());
  }

  private _updateHPBar(): void {
    const pct = Math.max(0, this.hp / this.maxHp);
    const cx  = (this.scene.game.config.width as number) / 2;
    this.hpBarBg.setScrollFactor(0).setPosition(cx, 50);
    this.hpBar.setScrollFactor(0).setPosition(cx - 150 + 150 * pct, 50);
    this.hpBar.width = 300 * pct;
    this.hpLabel.setScrollFactor(0).setPosition(cx - 80, 32);
  }

  takeDamage(amount: number, knockbackDir = 1): void {
    if (!this.alive || this.phase === PHASES.DEAD) return;
    this.hp -= amount;

    this.sprite.setTint(0xffffff);
    this.scene.time.delayedCall(120, () => { if (this.sprite.active) this.sprite.clearTint(); });
    this.sprite.body.setVelocity(knockbackDir * 80, 0);
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
      alpha: 0, scaleX: 3, scaleY: 3,
      duration: 1400,
      onComplete: () => { this.sprite.destroy(); this.scene.onBossDefeated(); },
    });
  }
}
