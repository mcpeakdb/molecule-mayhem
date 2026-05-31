import Phaser from 'phaser';
import { ELEMENT_COLORS, ELEMENT_NAMES, GAME_WIDTH, MAX_ELEMENT_LEVEL, PLAYER_MAX_HP } from '../constants';
import type ElementSystem from '../systems/ElementSystem';

const PAD = 14;
const MONO = 'monospace';

export default class HUDScene extends Phaser.Scene {
  private hpBarFill!: Phaser.GameObjects.Rectangle;
  private hpText!: Phaser.GameObjects.Text;
  private elementBg!: Phaser.GameObjects.Rectangle;
  private elementLabel!: Phaser.GameObjects.Text;
  private specialLabel!: Phaser.GameObjects.Text;
  private atomPips!: Phaser.GameObjects.Arc[];
  private scoreText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private comboSub!: Phaser.GameObjects.Text;

  constructor() {
    super('HUDScene');
  }

  create(): void {
    // ── HP BAR ──────────────────────────────────────────────────────────────
    // Track
    const hpTrack = this.add.graphics().setScrollFactor(0).setDepth(200);
    hpTrack.fillStyle(0x061008);
    hpTrack.fillRect(PAD, PAD + 4, 206, 16);
    hpTrack.lineStyle(1, 0x1a3a1a, 0.8);
    hpTrack.strokeRect(PAD, PAD + 4, 206, 16);

    // Fill bar
    this.hpBarFill = this.add
      .rectangle(PAD + 1, PAD + 5, 204, 14, 0x44cc66)
      .setScrollFactor(0)
      .setDepth(201)
      .setOrigin(0, 0);

    // Tick marks at 25 / 50 / 75 %
    const hpTicks = this.add.graphics().setScrollFactor(0).setDepth(203);
    hpTicks.lineStyle(1, 0xffffff, 0.18);
    [51, 102, 153].forEach((x) => { hpTicks.lineBetween(PAD + 1 + x, PAD + 5, PAD + 1 + x, PAD + 19) });

    // HP label — centered inside the bar
    this.hpText = this.add
      .text(PAD + 4, PAD + 12, 'HP  100', { fontSize: '10px', color: '#ccffcc', fontFamily: MONO })
      .setScrollFactor(0)
      .setDepth(204)
      .setOrigin(0, 0.5);

    // ── ELEMENT PANEL ────────────────────────────────────────────────────────
    this.elementBg = this.add
      .rectangle(PAD + 103, PAD + 47, 206, 38, 0x050e05)
      .setScrollFactor(0)
      .setDepth(200)
      .setOrigin(0.5, 0.5);

    const panelBorder = this.add.graphics().setScrollFactor(0).setDepth(201);
    panelBorder.lineStyle(1, 0x1a3a1a, 0.7);
    panelBorder.strokeRect(PAD, PAD + 28, 206, 38);

    this.elementLabel = this.add
      .text(PAD + 4, PAD + 30, 'ELEMENT  none', { fontSize: '11px', color: '#446644', fontFamily: MONO })
      .setScrollFactor(0)
      .setDepth(202);

    this.specialLabel = this.add
      .text(PAD + 4, PAD + 45, 'SPECIAL  —', { fontSize: '10px', color: '#2a4a2a', fontFamily: MONO })
      .setScrollFactor(0)
      .setDepth(202);

    // Level pips
    this.atomPips = [];
    for (let i = 0; i < MAX_ELEMENT_LEVEL; i++) {
      const pip = this.add
        .circle(PAD + 168 + i * 14, PAD + 47, 5, 0x0d1a0d)
        .setScrollFactor(0)
        .setDepth(202);
      this.atomPips.push(pip);
    }

    // ── SCORE ────────────────────────────────────────────────────────────────
    this.add
      .text(GAME_WIDTH - PAD, PAD, 'SCORE', { fontSize: '9px', color: '#2a4a2a', fontFamily: MONO })
      .setScrollFactor(0)
      .setDepth(202)
      .setOrigin(1, 0);

    this.scoreText = this.add
      .text(GAME_WIDTH - PAD, PAD + 12, '0', { fontSize: '16px', color: '#77bb77', fontFamily: MONO })
      .setScrollFactor(0)
      .setDepth(202)
      .setOrigin(1, 0);

    // ── COMBO ────────────────────────────────────────────────────────────────
    this.comboText = this.add
      .text(GAME_WIDTH - PAD, PAD + 34, '', {
        fontSize: '22px',
        color: '#aaddaa',
        fontFamily: MONO,
        fontStyle: 'bold',
      })
      .setScrollFactor(0)
      .setDepth(202)
      .setOrigin(1, 0)
      .setAlpha(0);

    this.comboSub = this.add
      .text(GAME_WIDTH - PAD, PAD + 60, '', { fontSize: '10px', color: '#558855', fontFamily: MONO })
      .setScrollFactor(0)
      .setDepth(202)
      .setOrigin(1, 0)
      .setAlpha(0);

    // ── CONTROLS HINT ────────────────────────────────────────────────────────
    this.add
      .text(
        GAME_WIDTH / 2,
        (this.game.config.height as number) - 14,
        'WASD/Arrows: Move   Space: Jump   Z: Punch   X: Special',
        { fontSize: '9px', color: '#1a2e1a', fontFamily: MONO },
      )
      .setScrollFactor(0)
      .setDepth(200)
      .setOrigin(0.5, 1);

    // ── EVENTS ───────────────────────────────────────────────────────────────
    const gameScene = this.scene.get('GameScene');
    gameScene.events.on('hud-update', this._onUpdate, this);
    gameScene.events.on(
      'score-update',
      (score: number) => {
        this.scoreText.setText(score.toLocaleString());
      },
      this,
    );
    gameScene.events.on(
      'combo-update',
      (count: number, mult: number) => {
        if (count < 2) {
          this.tweens.add({ targets: [this.comboText, this.comboSub], alpha: 0, duration: 200 });
        } else {
          this.comboText.setText(`${count} HITS`).setAlpha(1);
          this.comboSub.setText(mult > 1 ? `×${mult.toFixed(1)} COMBO` : 'COMBO').setAlpha(1);
          this.tweens.killTweensOf(this.comboText);
          this.tweens.add({
            targets: this.comboText,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 80,
            ease: 'Power2',
            yoyo: true,
          });
        }
      },
      this,
    );
    gameScene.events.on(
      'boss-activated',
      () => {
        const warn = this.add
          .text(GAME_WIDTH / 2, 96, '! PATHOGEN DETECTED !', {
            fontSize: '20px',
            color: '#cc3322',
            fontFamily: MONO,
            fontStyle: 'bold',
            stroke: '#110000',
            strokeThickness: 3,
          })
          .setScrollFactor(0)
          .setDepth(250)
          .setOrigin(0.5);
        this.tweens.add({ targets: warn, alpha: 0, duration: 2000, delay: 2000, onComplete: () => warn.destroy() });
      },
      this,
    );
  }

  private _onUpdate({ hp, element }: { hp: number; element: ElementSystem }): void {
    const pct = hp / PLAYER_MAX_HP;
    this.hpBarFill.width = Math.max(0, 204 * pct);
    this.hpBarFill.fillColor = pct > 0.5 ? 0x44cc66 : pct > 0.25 ? 0xaacc22 : 0xcc4422;
    this.hpText.setText(`HP  ${hp}`);
    this._refreshElement(element);
  }

  private _refreshElement(es: ElementSystem): void {
    const { type, level } = es;
    const col = ELEMENT_COLORS[type];
    const hex = `#${col.toString(16).padStart(6, '0')}`;

    this.elementLabel.setText(`ELEMENT  ${ELEMENT_NAMES[type]}`).setStyle({ color: hex, fontFamily: MONO });
    this.elementBg.fillColor = Phaser.Display.Color.IntegerToColor(col).darken(78).color;
    this.specialLabel.setText(`SPECIAL  ${es.getSpecialName()}`);
    this.atomPips.forEach((pip, i) => {
      pip.fillColor = i < level ? col : 0x0d1a0d;
    });
  }
}
