import Phaser from 'phaser';
import {
  GAME_WIDTH, GAME_HEIGHT, WORLD_WIDTH,
  FLOOR_MIN_Y, FLOOR_MAX_Y, FLOOR_CENTER_Y,
  BOSS_X,
} from '../constants';
import Player from '../entities/Player';
import Enemy, { type EnemyType } from '../entities/Enemy';
import Boss from '../entities/Boss';
import Atom, { type AtomType } from '../entities/Atom';
import type { EnemySprite, AtomSprite, WasdKeys } from '../types';
import type { ElementType } from '../constants';

type ProjectileSprite = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody & { damage: number; knockback: number };

export default class GameScene extends Phaser.Scene {
  // Declared here so entities can reference them via `import type GameScene`
  player!:              Player;
  boss!:                Boss;
  enemyGroup!:          Phaser.Physics.Arcade.Group;
  atomGroup!:           Phaser.Physics.Arcade.Group;
  projectileGroup!:     Phaser.Physics.Arcade.Group;
  enemyProjectileGroup!: Phaser.Physics.Arcade.Group;

  private cursors!:    Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!:       WasdKeys;
  private attackKey!:  Phaser.Input.Keyboard.Key;
  private specialKey!: Phaser.Input.Keyboard.Key;
  private isPaused     = false;
  private stageCleared = false;

  constructor() { super('GameScene'); }

  create(): void {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, GAME_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, GAME_HEIGHT);

    this._buildWorld();

    this.enemyGroup          = this.physics.add.group();
    this.atomGroup           = this.physics.add.group({ allowGravity: false });
    this.projectileGroup     = this.physics.add.group({ allowGravity: false });
    this.enemyProjectileGroup = this.physics.add.group({ allowGravity: false });

    this._spawnStage();

    this.player = new Player(this, 120, FLOOR_CENTER_Y);
    this.cameras.main.startFollow(this.player.sprite, true, 0.08, 0.08);

    this.physics.add.overlap(
      this.player.sprite, this.atomGroup,
      (_p, atomSprite) => this._onAtomCollect(atomSprite as AtomSprite),
    );

    this.physics.add.overlap(
      this.player.sprite, this.enemyProjectileGroup,
      (_p, proj) => {
        const p = proj as ProjectileSprite;
        if (!p.active) return;
        this.player.takeDamage(p.damage || 8);
        p.destroy();
      },
    );

    this.physics.add.overlap(
      this.projectileGroup, this.enemyGroup,
      (proj, enemy) => {
        const p = proj as ProjectileSprite;
        const s = enemy as EnemySprite;
        if (!p.active || !s.active || !s.enemyRef) return;
        const dir = p.body?.velocity.x ?? 0 > 0 ? 1 : -1;
        s.enemyRef.takeDamage(p.damage || 20, dir * (p.knockback || 2));
        p.destroy();
      },
    );

    this._setupInput();
    this.scene.launch('HUDScene');
    this.isPaused    = false;
    this.stageCleared = false;
  }

  private _buildWorld(): void {
    this.add.tileSprite(0, 0, WORLD_WIDTH, GAME_HEIGHT, 'bg_tile')
      .setOrigin(0, 0).setScrollFactor(0.3).setDepth(-10);

    this.add.tileSprite(0, FLOOR_MAX_Y, WORLD_WIDTH, 160, 'ground_tile')
      .setOrigin(0, 0).setDepth(-5);

    const gLine = this.add.graphics().setDepth(-4);
    gLine.lineStyle(3, 0x6a4a28, 0.6);
    gLine.lineBetween(0, FLOOR_MAX_Y, WORLD_WIDTH, FLOOR_MAX_Y);

    this.add.rectangle(WORLD_WIDTH / 2, FLOOR_MIN_Y - 30, WORLD_WIDTH, 60, 0x110820, 0.85).setDepth(-6);

    for (let i = 0; i < 80; i++) {
      const g = this.add.graphics().setDepth(-3);
      g.fillStyle(0xaa88ff, Phaser.Math.FloatBetween(0.05, 0.25));
      g.fillCircle(Phaser.Math.Between(0, WORLD_WIDTH), Phaser.Math.Between(50, FLOOR_MIN_Y - 20), Phaser.Math.FloatBetween(1.5, 4));
    }

    this.add.text(300, FLOOR_MIN_Y - 50, '— PETRI DISH SECTOR 1 —', {
      fontSize: '14px', color: '#cc99ff', fontStyle: 'italic',
    }).setDepth(5).setAlpha(0.7);
  }

  private _spawnStage(): void {
    const atomDefs: { x: number; type: AtomType; choices?: ElementType[] }[] = [
      { x: 380,  type: 'hydrogen' },
      { x: 820,  type: 'mystery', choices: ['hydrogen', 'oxygen'] },
      { x: 1350, type: 'oxygen' },
      { x: 1900, type: 'mystery', choices: ['hydrogen', 'oxygen'] },
      { x: 2500, type: 'hydrogen' },
      { x: 3200, type: 'mystery', choices: ['hydrogen', 'oxygen'] },
      { x: 3900, type: 'oxygen' },
    ];
    atomDefs.forEach(def => {
      const atom = new Atom(this, def.x, FLOOR_CENTER_Y - 80, def.type, def.choices ?? null);
      this.atomGroup.add(atom.sprite);
    });

    const enemyDefs: { x: number; y: number; type: EnemyType }[] = [
      { x: 600,  y: FLOOR_CENTER_Y,      type: 'bacterium' },
      { x: 720,  y: FLOOR_CENTER_Y - 50, type: 'virus'     },
      { x: 1100, y: FLOOR_CENTER_Y,      type: 'bacterium' },
      { x: 1180, y: FLOOR_CENTER_Y - 40, type: 'bacterium' },
      { x: 1600, y: FLOOR_CENTER_Y,      type: 'virus'     },
      { x: 1680, y: FLOOR_CENTER_Y - 30, type: 'dustbunny' },
      { x: 2100, y: FLOOR_CENTER_Y,      type: 'bacterium' },
      { x: 2200, y: FLOOR_CENTER_Y - 55, type: 'pollen'    },
      { x: 2300, y: FLOOR_CENTER_Y,      type: 'virus'     },
      { x: 2700, y: FLOOR_CENTER_Y,      type: 'dustbunny' },
      { x: 2800, y: FLOOR_CENTER_Y - 40, type: 'pollen'    },
      { x: 2900, y: FLOOR_CENTER_Y,      type: 'virus'     },
      { x: 3300, y: FLOOR_CENTER_Y,      type: 'bacterium' },
      { x: 3400, y: FLOOR_CENTER_Y - 60, type: 'virus'     },
      { x: 3500, y: FLOOR_CENTER_Y,      type: 'bacterium' },
      { x: 4200, y: FLOOR_CENTER_Y,      type: 'virus'     },
      { x: 4280, y: FLOOR_CENTER_Y - 45, type: 'pollen'    },
      { x: 4350, y: FLOOR_CENTER_Y,      type: 'dustbunny' },
    ];
    enemyDefs.forEach(def => {
      const e = new Enemy(this, def.x, def.y, def.type);
      this.enemyGroup.add(e.sprite);
    });

    this.boss = new Boss(this, BOSS_X, FLOOR_CENTER_Y);
    this.enemyGroup.add(this.boss.sprite);
  }

  private _setupInput(): void {
    this.cursors    = this.input.keyboard!.createCursorKeys();
    this.wasd       = this.input.keyboard!.addKeys('W,A,S,D') as WasdKeys;
    this.attackKey  = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.specialKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.X);
  }

  update(_time: number, delta: number): void {
    if (this.isPaused || this.stageCleared) return;

    this.player.update(_time, delta, {
      cursors: this.cursors, wasd: this.wasd,
      attackKey: this.attackKey, specialKey: this.specialKey,
    });

    this.player.sprite.x = Phaser.Math.Clamp(this.player.sprite.x, 40, WORLD_WIDTH - 40);
    this.player.sprite.y = Phaser.Math.Clamp(this.player.sprite.y, FLOOR_MIN_Y, FLOOR_MAX_Y);

    this.enemyGroup.getChildren().forEach(go => {
      const s = go as EnemySprite;
      if (s.active && s.enemyRef) {
        s.enemyRef.update(_time, delta, this.player.sprite);
        s.setDepth(s.y);
      }
    });

    this.projectileGroup.getChildren().forEach(go => {
      const p = go as Phaser.Physics.Arcade.Sprite;
      if (p.active && (p.x < 0 || p.x > WORLD_WIDTH)) p.destroy();
    });
    this.enemyProjectileGroup.getChildren().forEach(go => {
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
      targets: g, alpha: 0, scaleX: 2.5, scaleY: 2.5, duration: 300, ease: 'Power2',
      onComplete: () => g.destroy(),
    });
  }

  spawnProjectile(x: number, y: number, dir: number, color: number, damage: number, speed = 600, knockback = 2): void {
    const p = this.projectileGroup.create(x, y, 'projectile') as ProjectileSprite;
    p.setTint(color).setDepth(80);
    p.damage    = damage;
    p.knockback = knockback;
    p.body.setAllowGravity(false);
    p.body.setVelocity(dir * speed, 0);
  }

  spawnEnemyProjectile(x: number, y: number, angle: number, damage: number): void {
    const speed = 280;
    const p = this.enemyProjectileGroup.create(x, y, 'projectile') as ProjectileSprite;
    p.setTint(0xff6600).setDepth(80);
    p.damage    = damage;
    p.knockback = 0;
    p.body.setAllowGravity(false);
    p.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
  }

  spawnTidalWave(x: number, y: number, dir: number): void {
    const damage = 60;
    const wave   = this.add.graphics().setDepth(90);
    let waveX    = x;
    let step     = 0;

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

        this.enemyGroup.getChildren().forEach(go => {
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
      hydrogen: 0x4499ff, oxygen: 0xff5533, mystery: 0xaa44ff,
    };
    this.spawnHitFlash(x, y, colorMap[atom.type] ?? 0xffffff, 28);
    this.cameras.main.shake(120, 0.004);

    if (atom.type === 'mystery') {
      this._showElementChoice(atom.choices ?? ['hydrogen', 'oxygen']);
    } else {
      this.player.elementSystem.collectAtom(atom.type as ElementType);
      this.events.emit('element-changed', this.player.elementSystem.getState());
    }
  }

  private _showElementChoice(choices: ElementType[]): void {
    this.isPaused = true;
    this.scene.launch('ElementChoiceScene', {
      choices,
      callback: (chosen: ElementType) => {
        this.isPaused = false;
        this.player.elementSystem.collectAtom(chosen);
        this.events.emit('element-changed', this.player.elementSystem.getState());
        this.scene.stop('ElementChoiceScene');
      },
    });
  }

  // ── Stage Events ─────────────────────────────────────────────────────────────

  onEnemyDeath(enemy: Enemy | Boss): void {
    if (!enemy.isBoss && Math.random() < 0.15) {
      const dropType: ElementType = Math.random() < 0.5 ? 'hydrogen' : 'oxygen';
      const a = new Atom(this, enemy.sprite.x, enemy.sprite.y - 30, dropType);
      this.atomGroup.add(a.sprite);
    }
  }

  onPlayerDeath(): void {
    this.cameras.main.fade(800, 0, 0, 0);
    this.time.delayedCall(900, () => {
      this.scene.stop('HUDScene');
      this.scene.restart();
    });
  }

  onBossDefeated(): void {
    this.stageCleared = true;
    this.cameras.main.flash(600, 255, 230, 100);
    this.time.delayedCall(700, () => {
      const w = GAME_WIDTH, h = GAME_HEIGHT;
      this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.5).setScrollFactor(0).setDepth(300);
      this.add.text(w / 2, h / 2 - 40, 'STAGE CLEAR!', {
        fontSize: '48px', color: '#ffee44', fontStyle: 'bold', stroke: '#884400', strokeThickness: 6,
      }).setScrollFactor(0).setOrigin(0.5).setDepth(301);
      this.add.text(w / 2, h / 2 + 30, 'Press Z to continue', {
        fontSize: '20px', color: '#ffffff',
      }).setScrollFactor(0).setOrigin(0.5).setDepth(301);

      this.input.keyboard!.once('keydown-Z', () => {
        this.scene.stop('HUDScene');
        this.scene.restart();
      });
    });
  }
}
