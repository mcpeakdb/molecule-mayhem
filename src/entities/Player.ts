import Phaser from 'phaser';
import {
  ELEMENT_COLORS,
  ELEMENTS,
  FLOOR_MAX_Y,
  FLOOR_MIN_Y,
  GAME_HEIGHT,
  GAME_WIDTH,
  PLAYER_ATTACK_COOLDOWN,
  PLAYER_DOUBLE_JUMP_VELOCITY,
  PLAYER_INVINCIBILITY_MS,
  PLAYER_JUMP_GRAVITY,
  PLAYER_JUMP_VELOCITY,
  PLAYER_MAX_HP,
  PLAYER_MAX_JUMPS,
  PLAYER_MELEE_DAMAGE,
  PLAYER_MELEE_RANGE,
  PLAYER_SPECIAL_COOLDOWN,
  PLAYER_SPEED,
} from '../constants';
import type GameScene from '../scenes/GameScene';
import ElementSystem from '../systems/ElementSystem';
import SoundSystem from '../systems/SoundSystem';
import type { EnemySprite, InputKeys } from '../types';

export default class Player {
  scene: GameScene;
  hp: number = PLAYER_MAX_HP;
  alive: boolean = true;
  facingRight: boolean = true;
  elementSystem: ElementSystem = new ElementSystem();
  sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

  comboCount = 0;
  comboMultiplier = 1;

  invincibilityMs = PLAYER_INVINCIBILITY_MS;

  private attackCooldown = 0;
  private specialCooldown = 0;
  private invincibleTimer = 0;
  private _hitFlash = false;
  private jumpOffset = 0;
  private isJumping = false;
  private jumpCount = 0;
  private _jumpVelY = 0;
  private _isRolling = false;
  private _rollTween: Phaser.Tweens.Tween | null = null;
  private _groundY = 0;
  private _jumpShadow!: Phaser.GameObjects.Graphics;
  private _jumpKey!: Phaser.Input.Keyboard.Key;
  private _speedBoost = 1.0;
  private _speedBoostTimer = 0;
  private _speedBoostAura: Phaser.GameObjects.Graphics | null = null;
  private _armsGraphic!: Phaser.GameObjects.Graphics;
  private _isPunching = false;
  private _punchArmGraphic: Phaser.GameObjects.Graphics | null = null;
  private _punchArmDir = 1;

  constructor(scene: GameScene, x: number, y: number) {
    this.scene = scene;
    this._groundY = y;
    this.sprite = scene.physics.add.sprite(x, y, 'player_0') as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    this.sprite.setDepth(y);
    this.sprite.body.setSize(28, 44);
    this.sprite.body.setOffset(6, 8);
    this.sprite.body.setCollideWorldBounds(true);
    this.sprite.play('player_idle');
    this._jumpShadow = scene.add.graphics().setDepth(y);
    this._armsGraphic = scene.add.graphics();
    this._jumpKey = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE) as Phaser.Input.Keyboard.Key;
    scene.events.on('postupdate', this._updateArms, this);
  }

  /** Airborne high enough to clear an enemy's body — lets a well-timed jump leap clean over contact attacks (projectiles still hit). */
  get isClearingEnemy(): boolean {
    return this.isJumping && this.jumpOffset > 30;
  }

  update(time: number, delta: number, keys: InputKeys): void {
    if (!this.alive) return;

    this.attackCooldown = Math.max(0, this.attackCooldown - delta);
    this.specialCooldown = Math.max(0, this.specialCooldown - delta);
    this.invincibleTimer = Math.max(0, this.invincibleTimer - delta);

    const flickerAlpha = this.invincibleTimer > 0 && Math.floor(time / 80) % 2 === 0 ? 0.3 : 1;
    this.sprite.setAlpha(flickerAlpha);
    this._armsGraphic.setAlpha(flickerAlpha);

    const { cursors, wasd, attackKey, specialKey } = keys;
    const left = cursors.left.isDown || wasd.A.isDown;
    const right = cursors.right.isDown || wasd.D.isDown;
    const up = cursors.up.isDown || wasd.W.isDown;
    const down = cursors.down.isDown || wasd.S.isDown;

    if (this._speedBoostTimer > 0) {
      this._speedBoostTimer -= delta;
      if (this._speedBoostTimer <= 0) {
        this._speedBoost = 1.0;
        if (this._speedBoostAura) {
          this._speedBoostAura.destroy();
          this._speedBoostAura = null;
        }
      }
    }

    const spd = PLAYER_SPEED * this._speedBoost;
    let vx = 0,
      vy = 0;
    if (left) {
      vx = -spd;
      this.facingRight = false;
    }
    if (right) {
      vx = spd;
      this.facingRight = true;
    }
    if (up) vy = -spd * 0.65;
    if (down) vy = spd * 0.65;
    if (vx !== 0 && vy !== 0) {
      vx *= Math.SQRT1_2;
      vy *= Math.SQRT1_2;
    }

    // X via physics; Y integrated manually so jumpOffset can offset the visual independently
    this.sprite.body.setVelocityX(vx);
    this.sprite.body.setVelocityY(0);
    this._groundY = Phaser.Math.Clamp(this._groundY + vy * (delta / 1000), FLOOR_MIN_Y, FLOOR_MAX_Y);

    // Vertical jump arc — integrate velocity under gravity, land when back on the ground
    if (this.isJumping) {
      const dt = delta / 1000;
      this._jumpVelY -= PLAYER_JUMP_GRAVITY * dt;
      this.jumpOffset += this._jumpVelY * dt;
      if (this.jumpOffset <= 0) this._land();
    }

    this.sprite.y = this._groundY - this.jumpOffset;
    this.sprite.setDepth(this._groundY);
    this.sprite.setFlipX(!this.facingRight);

    // Walk/idle on the ground; the jump pose is held by _doJump while airborne
    if (!this.isJumping) {
      const isMoving = vx !== 0 || vy !== 0;
      const currentAnim = this.sprite.anims.currentAnim?.key;
      if (isMoving && currentAnim !== 'player_walk') this.sprite.play('player_walk');
      else if (!isMoving && currentAnim !== 'player_idle') this.sprite.play('player_idle');
    }

    // Ground shadow that stays at floor level while the player is airborne
    if (this.jumpOffset > 0) {
      const t = Math.min(1, this.jumpOffset / 160);
      this._jumpShadow.setPosition(this.sprite.x, this._groundY + 4).setDepth(this._groundY - 1);
      this._jumpShadow.clear();
      this._jumpShadow.fillStyle(0x000000, 0.4 * (1 - t * 0.7));
      this._jumpShadow.fillEllipse(0, 0, 32 * (1 - t * 0.3), 10 * (1 - t * 0.3));
    } else {
      this._jumpShadow.clear();
    }

    if (this._hitFlash) {
      this.sprite.setTint(0xdd2222);
    } else if (this.elementSystem.type !== ELEMENTS.NONE) {
      const col = ELEMENT_COLORS[this.elementSystem.type];
      this.sprite.setTint(Phaser.Display.Color.IntegerToColor(col).lighten(40).color);
    } else {
      this.sprite.clearTint();
    }

    if (this._speedBoostAura) {
      this._speedBoostAura.setPosition(this.sprite.x, this._groundY).setDepth(this._groundY - 2);
    }

    if (Phaser.Input.Keyboard.JustDown(this._jumpKey)) this._doJump();
    if (Phaser.Input.Keyboard.JustDown(attackKey) && this.attackCooldown === 0) this._doMeleeAttack();
    if (Phaser.Input.Keyboard.JustDown(specialKey) && this.specialCooldown === 0) this._doSpecialAttack();
  }

  private _doJump(): void {
    if (!this.alive || this.jumpCount >= PLAYER_MAX_JUMPS) return;

    if (this.jumpCount === 0) {
      // First jump — simple hop with a takeoff stretch
      this.isJumping = true;
      this._jumpVelY = PLAYER_JUMP_VELOCITY;
      this.sprite.play('player_jump');
      this.scene.tweens.add({
        targets: this.sprite,
        scaleY: 1.15,
        scaleX: 0.9,
        duration: 110,
        yoyo: true,
      });
    } else {
      // Second jump — re-boost upward and do a front roll in the air
      this._jumpVelY = PLAYER_DOUBLE_JUMP_VELOCITY;
      this._startRoll();
    }

    this.jumpCount++;
  }

  private _startRoll(): void {
    this._isRolling = true;
    this._rollTween?.remove();
    // Forward roll in the direction the player faces
    const dir = this.facingRight ? 1 : -1;
    this.sprite.setRotation(0);
    this._rollTween = this.scene.tweens.add({
      targets: this.sprite,
      rotation: dir * Math.PI * 2,
      duration: 420,
      ease: 'Linear',
      onComplete: () => this._endRoll(),
    });
  }

  private _endRoll(): void {
    if (!this._isRolling) return;
    this._isRolling = false;
    this._rollTween?.remove();
    this._rollTween = null;
    this.sprite.setRotation(0);
  }

  private _land(): void {
    this.jumpOffset = 0;
    this._jumpVelY = 0;
    this.isJumping = false;
    this.jumpCount = 0;
    this._endRoll();
    // Landing squash
    this.sprite.setScale(1.2, 0.8);
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 1,
      scaleY: 1,
      duration: 120,
      ease: 'Quad.Out',
    });
  }

  private _doMeleeAttack(): void {
    this.attackCooldown = PLAYER_ATTACK_COOLDOWN;
    SoundSystem.play(this.scene.audioCtx, 'punch');
    const dir = this.facingRight ? 1 : -1;
    const cx = this.sprite.x + dir * 50;
    const cy = this.sprite.y;

    this._spawnPunchArm(dir);
    this.scene.cameras.main.shake(80, 0.003);

    let hitSomething = false;
    this.scene.enemyGroup.getChildren().forEach((go) => {
      const s = go as EnemySprite;
      if (!s.active || !s.enemyRef) return;
      const dx = s.x - cx,
        dy = s.y - cy;
      if (Math.abs(dx) < PLAYER_MELEE_RANGE && Math.abs(dy) < 55) {
        s.enemyRef.takeDamage(Math.round(PLAYER_MELEE_DAMAGE * this.comboMultiplier), dir);
        hitSomething = true;
      }
    });

    if (hitSomething) this._registerHit();
  }

  private _registerHit(): void {
    this.comboCount++;
    this.comboMultiplier = 1 + Math.floor(this.comboCount / 5) * 0.5;
    this.scene.events.emit('combo-update', this.comboCount, this.comboMultiplier);
  }

  private _updateArms(): void {
    if (!this.alive) return;
    // Arms are drawn upright; during a front roll they'd detach from the spinning body, so hide them
    if (this._isRolling) {
      this._armsGraphic.clear();
      return;
    }
    if (this._punchArmGraphic) {
      this._punchArmGraphic
        .setPosition(this.sprite.x + this._punchArmDir * 11, this.sprite.y - 7)
        .setDepth(this.sprite.depth + 1);
    }
    this._armsGraphic
      .setPosition(this.sprite.x, this.sprite.y)
      .setDepth(this.sprite.depth + 1)
      .clear();
    const punchDir = this._isPunching ? (this.facingRight ? 1 : -1) : 0;
    // Left arm (world-left side of character, local x = -16 to -11)
    if (punchDir !== -1) {
      this._armsGraphic.fillStyle(0xe8e8f2);
      this._armsGraphic.fillRect(-16, -7, 5, 15);
      this._armsGraphic.fillStyle(0x88ccdd);
      this._armsGraphic.fillRect(-16, 6, 5, 5);
    }
    // Right arm (world-right side, local x = +11 to +16)
    if (punchDir !== 1) {
      this._armsGraphic.fillStyle(0xe8e8f2);
      this._armsGraphic.fillRect(11, -7, 5, 15);
      this._armsGraphic.fillStyle(0x88ccdd);
      this._armsGraphic.fillRect(11, 6, 5, 5);
    }
  }

  private _spawnPunchArm(
    dir: number,
    opts: {
      sleeveColor?: number;
      fistColor?: number;
      fistRadius?: number;
      sleeveLen?: number;
      sleeveH?: number;
      glow?: number;
    } = {},
  ): void {
    const sleeveColor = opts.sleeveColor ?? 0xf0f0f5;
    const fistColor = opts.fistColor ?? 0x88ccdd;
    const fistRadius = opts.fistRadius ?? 8;
    const sleeveLen = opts.sleeveLen ?? 44;
    const sleeveH = opts.sleeveH ?? 9;
    const fistX = sleeveLen + fistRadius - 2;

    this._isPunching = true;
    this._punchArmDir = dir;
    const arm = this.scene.add.graphics();
    const s = dir > 0 ? 1 : -1;
    // Optional glow halo behind the fist (used by element-charged punches)
    if (opts.glow !== undefined) {
      arm.fillStyle(opts.glow, 0.4);
      arm.fillCircle(s * fistX, 0, fistRadius + 5);
    }
    arm.fillStyle(sleeveColor);
    arm.fillRect(s > 0 ? 0 : -sleeveLen, -sleeveH / 2, sleeveLen, sleeveH);
    arm.fillStyle(fistColor);
    arm.fillCircle(s * fistX, 0, fistRadius);
    if (opts.glow !== undefined) {
      arm.fillStyle(0xffffff, 0.5);
      arm.fillCircle(s * fistX - s * 3, -3, Math.max(2, fistRadius * 0.3));
    }
    this._punchArmGraphic = arm;
    this.scene.tweens.add({
      targets: arm,
      alpha: 0,
      duration: 180,
      delay: 50,
      onComplete: () => {
        arm.destroy();
        this._punchArmGraphic = null;
        this._isPunching = false;
      },
    });
  }

  private _doSpecialAttack(): void {
    const { type, level } = this.elementSystem;
    if (type === ELEMENTS.NONE || level === 0) return;
    this.specialCooldown = PLAYER_SPECIAL_COOLDOWN;
    const dir = this.facingRight ? 1 : -1;
    if (type === ELEMENTS.HYDROGEN) this._specialHydrogen(level, dir);
    else if (type === ELEMENTS.OXYGEN) this._specialOxygen(level, dir);
    else if (type === ELEMENTS.WATER) this._specialWater(level, dir);
    else if (type === ELEMENTS.CARBON) this._specialCarbon(level, dir);
    else if (type === ELEMENTS.NITROGEN) this._specialNitrogen(level, dir);
    else if (type === ELEMENTS.AMMONIA) this._specialAmmonia(level, dir);
    else if (type === ELEMENTS.CARBON_DIOXIDE) this._specialCarbonDioxide(level, dir);
    else if (type === ELEMENTS.METHANE) this._specialMethane(level, dir);
    else if (type === ELEMENTS.NITRIC_OXIDE) this._specialNitricOxide(level, dir);
    else if (type === ELEMENTS.CARBONIC_ACID) this._specialCarbonicAcid(level, dir);
  }

  private _specialHydrogen(level: number, dir: number): void {
    const x = this.sprite.x,
      y = this.sprite.y;
    if (level === 1) {
      // Proton Punch — a bigger, harder version of the basic punch, charged hydrogen-blue
      SoundSystem.play(this.scene.audioCtx, 'punch');
      this._spawnPunchArm(dir, { fistColor: 0x3366ee, glow: 0x88aaff, fistRadius: 13, sleeveLen: 50, sleeveH: 11 });
      this.scene.spawnHitFlash(x + dir * 62, y, 0x4499ff, 55);
      this.scene.cameras.main.shake(120, 0.006);
      if (this._damageArc(x + dir * 50, y, 130, 70, PLAYER_MELEE_DAMAGE * 2, dir, false, 4)) this._registerHit();
    } else if (level === 2) {
      // Plasma Arc — crackling hydrogen-blue energy bolt
      SoundSystem.play(this.scene.audioCtx, 'punch');
      this.scene.spawnHitFlash(x + dir * 40, y, 0xaaddff, 40);
      this.scene.cameras.main.shake(80, 0.004);
      this.scene.spawnPlasmaBolt(x + dir * 30, y, dir, PLAYER_MELEE_DAMAGE * 3);
    } else {
      this.scene.spawnHitFlash(x, y, 0xff4400, 120);
      this.scene.cameras.main.shake(250, 0.01);
      if (this._damageRadius(x, y, 180, PLAYER_MELEE_DAMAGE * 4)) this._registerHit();
    }
  }

  private _specialOxygen(level: number, dir: number): void {
    const x = this.sprite.x,
      y = this.sprite.y;
    if (level === 1) {
      this.scene.spawnHitFlash(x + dir * 60, y, 0x44ff88, 45);
      if (this._damageArc(x + dir * 40, y, 110, 65, PLAYER_MELEE_DAMAGE * 1.5, dir, true)) this._registerHit();
    } else if (level === 2) {
      this.scene.spawnHitFlash(x, y, 0x00cc66, 90);
      if (this._damageRadius(x, y, 150, PLAYER_MELEE_DAMAGE * 2, true)) this._registerHit();
    } else {
      this.scene.spawnHitFlash(x, y, 0x00ff88, 200);
      this.scene.cameras.main.shake(300, 0.012);
      if (this._damageRadius(x, y, 280, PLAYER_MELEE_DAMAGE * 3.5, true)) this._registerHit();
    }
  }

  private _specialWater(level: number, dir: number): void {
    const x = this.sprite.x,
      y = this.sprite.y;
    if (level === 1) {
      this.scene.spawnProjectile(x, y, dir, 0x22ccff, PLAYER_MELEE_DAMAGE * 2, 700, 3);
    } else if (level === 2) {
      this.scene.spawnHitFlash(x + dir * 80, y, 0x22ccff, 100);
      this.scene.cameras.main.shake(180, 0.007);
      if (this._damageArc(x + dir * 80, y, 220, 120, PLAYER_MELEE_DAMAGE * 2.5, dir, false, 5)) this._registerHit();
    } else {
      this.scene.cameras.main.shake(500, 0.015);
      this.scene.spawnTidalWave(x, y, dir);
    }
  }

  private _specialCarbon(level: number, dir: number): void {
    const x = this.sprite.x,
      y = this.sprite.y;
    if (level === 1) {
      this.scene.spawnHitFlash(x + dir * 60, y, 0x888888, 45);
      const hit = this._damageArc(x + dir * 40, y, 110, 60, PLAYER_MELEE_DAMAGE * 1.8, dir);
      if (hit) {
        this._registerHit();
        this.scene.enemyGroup.getChildren().forEach((go) => {
          const s = go as EnemySprite;
          if (!s.active || !s.enemyRef) return;
          if (Math.abs(s.x - (x + dir * 40)) < 110 && Math.abs(s.y - y) < 60) s.enemyRef.applyBleed(3, 2400);
        });
      }
    } else if (level === 2) {
      this.scene.spawnPiercingProjectile(x, y, dir, 0xaaddff, PLAYER_MELEE_DAMAGE * 3, 650);
    } else {
      // Graphene Shockwave — expanding crack
      this.scene.cameras.main.shake(300, 0.012);
      this.scene.spawnHitFlash(x, y, 0x777777, 100);
      const crack = this.scene.add.graphics().setDepth(90);
      let t = 0;
      this.scene.time.addEvent({
        delay: 16,
        repeat: 30,
        callback: () => {
          t++;
          crack.clear();
          crack.fillStyle(0x999999, 0.6 - t * 0.018);
          crack.fillRect(x - t * 12, y + 16, t * 24, 8);
          if (t === 15) {
            if (this._damageRadius(x, y, t * 12, PLAYER_MELEE_DAMAGE * 5)) this._registerHit();
          }
          if (t >= 30) crack.destroy();
        },
      });
    }
  }

  private _specialNitrogen(level: number, dir: number): void {
    const x = this.sprite.x,
      y = this.sprite.y;
    if (level === 1) {
      this.scene.spawnHitFlash(x + dir * 60, y, 0x88eeff, 45);
      if (this._damageArc(x + dir * 40, y, 110, 60, PLAYER_MELEE_DAMAGE * 1.5, dir, true)) this._registerHit();
    } else if (level === 2) {
      this.scene.spawnHitFlash(x, y, 0x44ccff, 80);
      this.scene.cameras.main.shake(150, 0.006);
      if (this._damageRadius(x, y, 160, PLAYER_MELEE_DAMAGE * 2.5, true)) this._registerHit();
    } else {
      this.scene.cameras.main.shake(500, 0.015);
      this.scene.spawnHitFlash(x, y, 0x88ffff, 200);
      let hit = false;
      this.scene.enemyGroup.getChildren().forEach((go) => {
        const s = go as EnemySprite;
        if (!s.active || !s.enemyRef) return;
        s.enemyRef.takeDamage(PLAYER_MELEE_DAMAGE * 5, 0, true);
        hit = true;
      });
      if (hit) this._registerHit();
    }
  }

  private _specialAmmonia(level: number, _dir: number): void {
    const x = this.sprite.x,
      y = this.sprite.y;
    const radii = [90, 150, 0];
    const dmgs = [PLAYER_MELEE_DAMAGE * 1.5, PLAYER_MELEE_DAMAGE * 2, PLAYER_MELEE_DAMAGE * 1.5];
    this.scene.spawnHitFlash(x, y, 0xaadd44, level === 1 ? 50 : level === 2 ? 80 : 100);
    if (level < 3) {
      const hit = this._damageRadius(x, y, radii[level - 1], dmgs[level - 1], level === 2);
      if (hit) {
        this._registerHit();
        this.scene.enemyGroup.getChildren().forEach((go) => {
          const s = go as EnemySprite;
          if (!s.active || !s.enemyRef) return;
          if (Phaser.Math.Distance.Between(x, y, s.x, s.y) < radii[level - 1]) s.enemyRef.applyBleed(2, 3000);
        });
      }
    } else {
      let hit = false;
      this.scene.enemyGroup.getChildren().forEach((go) => {
        const s = go as EnemySprite;
        if (!s.active || !s.enemyRef) return;
        s.enemyRef.takeDamage(PLAYER_MELEE_DAMAGE * 1.5, 0);
        s.enemyRef.applyBleed(3, 4000);
        hit = true;
      });
      if (hit) this._registerHit();
    }
  }

  private _specialCarbonDioxide(level: number, _dir: number): void {
    const x = this.sprite.x,
      y = this.sprite.y;
    const radii = [100, 180, 0];
    this.scene.spawnHitFlash(x, y, 0x99bbcc, level < 3 ? 60 : 120);
    const fogAlpha = level === 1 ? 0.25 : level === 2 ? 0.35 : 0.5;
    const fogDur = level === 1 ? 1000 : level === 2 ? 1800 : 2800;
    const fog = this.scene.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x445555, 0)
      .setScrollFactor(0)
      .setDepth(350);
    this.scene.tweens.add({
      targets: fog,
      alpha: fogAlpha,
      duration: 300,
      yoyo: true,
      hold: fogDur - 600,
      onComplete: () => fog.destroy(),
    });
    if (level < 3) {
      if (this._damageRadius(x, y, radii[level - 1], PLAYER_MELEE_DAMAGE * 2)) this._registerHit();
    } else {
      this.scene.cameras.main.shake(400, 0.012);
      let hit = false;
      this.scene.enemyGroup.getChildren().forEach((go) => {
        const s = go as EnemySprite;
        if (!s.active || !s.enemyRef) return;
        s.enemyRef.takeDamage(PLAYER_MELEE_DAMAGE * 3, 0);
        hit = true;
      });
      if (hit) this._registerHit();
    }
  }

  private _specialMethane(level: number, dir: number): void {
    const x = this.sprite.x,
      y = this.sprite.y;
    const proj = this.scene.physics.add.sprite(x, y, 'projectile') as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    proj.setTint(0xff9922).setDepth(80).setScale(1.8);
    proj.body.setAllowGravity(false);
    proj.body.setVelocity(dir * 220, 0);

    const detonate = () => {
      if (!proj.active) return;
      const ex = proj.x,
        ey = proj.y;
      proj.destroy();
      this.scene.spawnHitFlash(ex, ey, 0xff6600, 80);
      this.scene.cameras.main.shake(200, 0.008);
      const r = level === 1 ? 100 : level === 2 ? 140 : 220;
      const dmg =
        level === 1 ? PLAYER_MELEE_DAMAGE * 3 : level === 2 ? PLAYER_MELEE_DAMAGE * 3.5 : PLAYER_MELEE_DAMAGE * 6;
      if (this._damageRadius(ex, ey, r, dmg)) this._registerHit();
      if (level >= 2) {
        this.scene.enemyGroup.getChildren().forEach((go) => {
          const s = go as EnemySprite;
          if (!s.active || !s.enemyRef) return;
          if (Phaser.Math.Distance.Between(ex, ey, s.x, s.y) < r + 40) {
            this.scene.time.delayedCall(150, () => this.scene.spawnHitFlash(s.x, s.y, 0xff4400, 40));
          }
        });
      }
    };

    this.scene.time.delayedCall(650, detonate);
    this.scene.physics.add.overlap(proj, this.scene.enemyGroup, () => detonate());
  }

  private _specialNitricOxide(level: number, _dir: number): void {
    const boosts = [1.5, 1.8, 2.0];
    const durations = [3000, 5000, 8000];
    this._speedBoost = boosts[level - 1];
    this._speedBoostTimer = durations[level - 1];

    if (this._speedBoostAura) this._speedBoostAura.destroy();
    this._speedBoostAura = this.scene.add.graphics().setDepth(this.sprite.depth - 1);
    const auraR = level === 1 ? 40 : level === 2 ? 60 : 80;
    this._speedBoostAura.lineStyle(2, 0xdd44aa, 0.7);
    this._speedBoostAura.strokeCircle(0, 0, auraR);

    this.scene.tweens.add({
      targets: this._speedBoostAura,
      alpha: 0.3,
      duration: 400,
      yoyo: true,
      repeat: -1,
    });

    // Aura damage tick
    this.scene.time.addEvent({
      delay: 500,
      repeat: Math.floor(durations[level - 1] / 500) - 1,
      callback: () => {
        if (!this.alive) return;
        this._damageRadius(this.sprite.x, this._groundY, auraR, PLAYER_MELEE_DAMAGE * 0.5);
      },
    });
  }

  private _specialCarbonicAcid(level: number, dir: number): void {
    const count = level === 1 ? 5 : level === 2 ? 9 : 0;
    const spreadX = level === 1 ? 120 : 200;

    if (level < 3) {
      for (let i = 0; i < count; i++) {
        const tx = this.sprite.x + dir * Phaser.Math.FloatBetween(30, spreadX);
        const ty = this._groundY - Phaser.Math.FloatBetween(80, 160);
        const delay = i * 80;
        this.scene.time.delayedCall(delay, () => {
          if (!this.alive) return;
          const drop = this.scene.add.graphics().setDepth(88);
          drop.fillStyle(0x33aadd, 0.9);
          drop.fillCircle(tx, ty, 5);
          this.scene.tweens.add({
            targets: drop,
            y: `+=${Phaser.Math.FloatBetween(80, 160)}`,
            duration: 300,
            ease: 'Quad.In',
            onComplete: () => {
              this.scene.spawnHitFlash(tx, this._groundY, 0x33aadd, 20);
              this._damageRadius(tx, this._groundY, 35, PLAYER_MELEE_DAMAGE * 1.2);
              if (level === 2) {
                this.scene.enemyGroup.getChildren().forEach((go) => {
                  const s = go as EnemySprite;
                  if (s.active && s.enemyRef && Phaser.Math.Distance.Between(tx, this._groundY, s.x, s.y) < 35)
                    s.enemyRef.applyBleed(2, 1500);
                });
              }
              drop.destroy();
            },
          });
        });
      }
      this._registerHit();
    } else {
      // Acid Rain — one drop per enemy
      this.scene.cameras.main.shake(300, 0.01);
      this.scene.enemyGroup.getChildren().forEach((go, i) => {
        const s = go as EnemySprite;
        if (!s.active || !s.enemyRef) return;
        this.scene.time.delayedCall(i * 100, () => {
          const drop = this.scene.add.graphics().setDepth(88);
          drop.fillStyle(0x33aadd, 0.9);
          drop.fillCircle(s.x, s.y - 140, 6);
          this.scene.tweens.add({
            targets: drop,
            y: '+=140',
            duration: 280,
            ease: 'Quad.In',
            onComplete: () => {
              this.scene.spawnHitFlash(s.x, s.y, 0x33aadd, 24);
              if (s.enemyRef) {
                s.enemyRef.takeDamage(PLAYER_MELEE_DAMAGE * 2, 0);
                s.enemyRef.applyBleed(3, 2000);
              }
              drop.destroy();
            },
          });
        });
      });
      this._registerHit();
    }
  }

  private _damageArc(
    cx: number,
    cy: number,
    rangeX: number,
    rangeY: number,
    dmg: number,
    dir: number,
    slow = false,
    knockback = 2,
  ): boolean {
    let hit = false;
    this.scene.enemyGroup.getChildren().forEach((go) => {
      const s = go as EnemySprite;
      if (!s.active || !s.enemyRef) return;
      const dx = s.x - cx,
        dy = s.y - cy;
      if (Math.abs(dx) < rangeX && Math.abs(dy) < rangeY) {
        s.enemyRef.takeDamage(dmg, dir * knockback, slow);
        hit = true;
      }
    });
    return hit;
  }

  private _damageRadius(cx: number, cy: number, radius: number, dmg: number, slow = false): boolean {
    let hit = false;
    this.scene.enemyGroup.getChildren().forEach((go) => {
      const s = go as EnemySprite;
      if (!s.active || !s.enemyRef) return;
      const dist = Phaser.Math.Distance.Between(cx, cy, s.x, s.y);
      if (dist < radius) {
        s.enemyRef.takeDamage(dmg, (s.x < cx ? -1 : 1) * 3, slow);
        hit = true;
      }
    });
    return hit;
  }

  takeDamage(amount: number): void {
    if (!this.alive || this.invincibleTimer > 0) return;
    this.comboCount = 0;
    this.comboMultiplier = 1;
    this.scene.events.emit('combo-update', 0, 1);
    this.hp = Math.max(0, Math.round(this.hp - amount));
    this.invincibleTimer = this.invincibilityMs;
    this._hitFlash = true;
    this.scene.time.delayedCall(160, () => {
      this._hitFlash = false;
    });
    if (this.hp === 0) this._die();
  }

  private _die(): void {
    this.alive = false;
    this._endRoll();
    this.sprite.setScale(1, 1);
    this._jumpShadow.clear();
    this._armsGraphic.clear();
    SoundSystem.play(this.scene.audioCtx, 'player_death');
    this.sprite.setTint(0x888888);
    this.sprite.body.setVelocity(0, 0);
    this.scene.time.delayedCall(1500, () => this.scene.onPlayerDeath());
  }
}
