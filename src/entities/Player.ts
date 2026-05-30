import Phaser from 'phaser';
import {
  PLAYER_MAX_HP, PLAYER_SPEED,
  PLAYER_MELEE_RANGE, PLAYER_MELEE_DAMAGE,
  PLAYER_ATTACK_COOLDOWN, PLAYER_SPECIAL_COOLDOWN,
  PLAYER_INVINCIBILITY_MS,
  FLOOR_MIN_Y, FLOOR_MAX_Y,
  ELEMENTS, ELEMENT_COLORS,
} from '../constants';
import ElementSystem from '../systems/ElementSystem';
import type { InputKeys, EnemySprite } from '../types';
import type GameScene from '../scenes/GameScene';

export default class Player {
  scene:           GameScene;
  hp:              number = PLAYER_MAX_HP;
  alive:           boolean = true;
  facingRight:     boolean = true;
  elementSystem:   ElementSystem = new ElementSystem();
  sprite:          Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

  private attackCooldown  = 0;
  private specialCooldown = 0;
  private invincibleTimer = 0;

  constructor(scene: GameScene, x: number, y: number) {
    this.scene  = scene;
    this.sprite = scene.physics.add.sprite(x, y, 'player') as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    this.sprite.setDepth(y);
    this.sprite.body.setSize(28, 44);
    this.sprite.body.setOffset(6, 8);
    this.sprite.body.setCollideWorldBounds(true);
  }

  update(time: number, delta: number, keys: InputKeys): void {
    if (!this.alive) return;

    this.attackCooldown  = Math.max(0, this.attackCooldown  - delta);
    this.specialCooldown = Math.max(0, this.specialCooldown - delta);
    this.invincibleTimer = Math.max(0, this.invincibleTimer - delta);

    this.sprite.setAlpha(
      this.invincibleTimer > 0 && Math.floor(time / 80) % 2 === 0 ? 0.3 : 1,
    );

    const { cursors, wasd, attackKey, specialKey } = keys;
    const left  = cursors.left.isDown  || wasd.A.isDown;
    const right = cursors.right.isDown || wasd.D.isDown;
    const up    = cursors.up.isDown    || wasd.W.isDown;
    const down  = cursors.down.isDown  || wasd.S.isDown;

    let vx = 0, vy = 0;
    if (left)  { vx = -PLAYER_SPEED; this.facingRight = false; }
    if (right) { vx =  PLAYER_SPEED; this.facingRight = true;  }
    if (up)    vy = -PLAYER_SPEED * 0.65;
    if (down)  vy =  PLAYER_SPEED * 0.65;
    if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }

    this.sprite.body.setVelocity(vx, vy);
    this.sprite.setFlipX(!this.facingRight);
    this.sprite.y = Phaser.Math.Clamp(this.sprite.y, FLOOR_MIN_Y, FLOOR_MAX_Y);
    this.sprite.setDepth(this.sprite.y);

    if (this.elementSystem.type !== ELEMENTS.NONE) {
      const col = ELEMENT_COLORS[this.elementSystem.type];
      this.sprite.setTint(Phaser.Display.Color.IntegerToColor(col).lighten(40).color);
    } else {
      this.sprite.clearTint();
    }

    if (Phaser.Input.Keyboard.JustDown(attackKey)  && this.attackCooldown  === 0) this._doMeleeAttack();
    if (Phaser.Input.Keyboard.JustDown(specialKey) && this.specialCooldown === 0) this._doSpecialAttack();
  }

  private _doMeleeAttack(): void {
    this.attackCooldown = PLAYER_ATTACK_COOLDOWN;
    const dir = this.facingRight ? 1 : -1;
    const cx  = this.sprite.x + dir * 50;
    const cy  = this.sprite.y;

    this.scene.spawnHitFlash(cx, cy, 0xffff44);
    this.scene.cameras.main.shake(80, 0.003);

    this.scene.enemyGroup.getChildren().forEach(go => {
      const s = go as EnemySprite;
      if (!s.active || !s.enemyRef) return;
      const dx = s.x - cx, dy = s.y - cy;
      if (Math.abs(dx) < PLAYER_MELEE_RANGE && Math.abs(dy) < 55) {
        s.enemyRef.takeDamage(PLAYER_MELEE_DAMAGE, dir);
      }
    });
  }

  private _doSpecialAttack(): void {
    const { type, level } = this.elementSystem;
    if (type === ELEMENTS.NONE || level === 0) return;
    this.specialCooldown = PLAYER_SPECIAL_COOLDOWN;
    const dir = this.facingRight ? 1 : -1;
    if      (type === ELEMENTS.HYDROGEN) this._specialHydrogen(level, dir);
    else if (type === ELEMENTS.OXYGEN)   this._specialOxygen(level, dir);
    else if (type === ELEMENTS.WATER)    this._specialWater(level, dir);
  }

  private _specialHydrogen(level: number, dir: number): void {
    const x = this.sprite.x, y = this.sprite.y;
    if (level === 1) {
      this.scene.spawnHitFlash(x + dir * 80, y, 0xff8800, 50);
      this.scene.cameras.main.shake(120, 0.005);
      this._damageArc(x + dir * 50, y, 130, 70, PLAYER_MELEE_DAMAGE * 2, dir);
    } else if (level === 2) {
      this.scene.spawnProjectile(x, y, dir, 0xff8800, PLAYER_MELEE_DAMAGE * 2.5, 600);
    } else {
      this.scene.spawnHitFlash(x, y, 0xff4400, 120);
      this.scene.cameras.main.shake(250, 0.01);
      this._damageRadius(x, y, 180, PLAYER_MELEE_DAMAGE * 4);
    }
  }

  private _specialOxygen(level: number, dir: number): void {
    const x = this.sprite.x, y = this.sprite.y;
    if (level === 1) {
      this.scene.spawnHitFlash(x + dir * 60, y, 0x44ff88, 45);
      this._damageArc(x + dir * 40, y, 110, 65, PLAYER_MELEE_DAMAGE * 1.5, dir, true);
    } else if (level === 2) {
      this.scene.spawnHitFlash(x, y, 0x00cc66, 90);
      this._damageRadius(x, y, 150, PLAYER_MELEE_DAMAGE * 2, true);
    } else {
      this.scene.spawnHitFlash(x, y, 0x00ff88, 200);
      this.scene.cameras.main.shake(300, 0.012);
      this._damageRadius(x, y, 280, PLAYER_MELEE_DAMAGE * 3.5, true);
    }
  }

  private _specialWater(level: number, dir: number): void {
    const x = this.sprite.x, y = this.sprite.y;
    if (level === 1) {
      this.scene.spawnProjectile(x, y, dir, 0x22ccff, PLAYER_MELEE_DAMAGE * 2, 700, 3);
    } else if (level === 2) {
      this.scene.spawnHitFlash(x + dir * 80, y, 0x22ccff, 100);
      this.scene.cameras.main.shake(180, 0.007);
      this._damageArc(x + dir * 80, y, 220, 120, PLAYER_MELEE_DAMAGE * 2.5, dir, false, 5);
    } else {
      this.scene.cameras.main.shake(500, 0.015);
      this.scene.spawnTidalWave(x, y, dir);
    }
  }

  private _damageArc(cx: number, cy: number, rangeX: number, rangeY: number, dmg: number, dir: number, slow = false, knockback = 2): void {
    this.scene.enemyGroup.getChildren().forEach(go => {
      const s = go as EnemySprite;
      if (!s.active || !s.enemyRef) return;
      const dx = s.x - cx, dy = s.y - cy;
      if (Math.abs(dx) < rangeX && Math.abs(dy) < rangeY) s.enemyRef.takeDamage(dmg, dir * knockback, slow);
    });
  }

  private _damageRadius(cx: number, cy: number, radius: number, dmg: number, slow = false): void {
    this.scene.enemyGroup.getChildren().forEach(go => {
      const s = go as EnemySprite;
      if (!s.active || !s.enemyRef) return;
      const dist = Phaser.Math.Distance.Between(cx, cy, s.x, s.y);
      if (dist < radius) s.enemyRef.takeDamage(dmg, (s.x < cx ? -1 : 1) * 3, slow);
    });
  }

  takeDamage(amount: number): void {
    if (!this.alive || this.invincibleTimer > 0) return;
    this.hp = Math.max(0, this.hp - amount);
    this.invincibleTimer = PLAYER_INVINCIBILITY_MS;
    this.scene.cameras.main.flash(200, 255, 50, 50);
    if (this.hp === 0) this._die();
  }

  private _die(): void {
    this.alive = false;
    this.sprite.setTint(0x888888);
    this.sprite.body.setVelocity(0, 0);
    this.scene.time.delayedCall(1500, () => this.scene.onPlayerDeath());
  }
}
