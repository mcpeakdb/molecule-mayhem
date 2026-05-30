import Phaser from 'phaser';
import {
  GAME_WIDTH, PLAYER_MAX_HP,
  ELEMENT_COLORS, ELEMENT_NAMES, MAX_ELEMENT_LEVEL,
} from '../constants';
import type ElementSystem from '../systems/ElementSystem';

const PAD = 14;

export default class HUDScene extends Phaser.Scene {
  private hpBarFill!:   Phaser.GameObjects.Rectangle;
  private hpText!:      Phaser.GameObjects.Text;
  private elementBg!:   Phaser.GameObjects.Rectangle;
  private elementLabel!: Phaser.GameObjects.Text;
  private specialLabel!: Phaser.GameObjects.Text;
  private atomPips!:    Phaser.GameObjects.Arc[];

  constructor() { super('HUDScene'); }

  create(): void {
    this.add.rectangle(PAD + 102, PAD + 10, 206, 22, 0x220000)
      .setScrollFactor(0).setDepth(200).setOrigin(0.5, 0.5);
    this.hpBarFill = this.add.rectangle(PAD + 1, PAD + 10, 200, 16, 0xff2233)
      .setScrollFactor(0).setDepth(201).setOrigin(0, 0.5);
    this.hpText = this.add.text(PAD + 4, PAD + 2, 'HP', {
      fontSize: '11px', color: '#ffaaaa', fontStyle: 'bold',
    }).setScrollFactor(0).setDepth(202);

    this.elementBg = this.add.rectangle(PAD + 102, PAD + 44, 206, 32, 0x111133)
      .setScrollFactor(0).setDepth(200).setOrigin(0.5, 0.5);
    this.elementLabel = this.add.text(PAD + 4, PAD + 32, 'Element: None', {
      fontSize: '12px', color: '#aaaacc',
    }).setScrollFactor(0).setDepth(201);
    this.specialLabel = this.add.text(PAD + 4, PAD + 48, 'X: —', {
      fontSize: '10px', color: '#8888aa',
    }).setScrollFactor(0).setDepth(201);

    this.atomPips = [];
    for (let i = 0; i < MAX_ELEMENT_LEVEL; i++) {
      const pip = this.add.circle(PAD + 172 + i * 18, PAD + 44, 6, 0x333355)
        .setScrollFactor(0).setDepth(202);
      this.atomPips.push(pip);
    }

    this.add.text(GAME_WIDTH / 2, (this.game.config.height as number) - 16,
      'WASD/Arrows: Move   Z: Punch   X: Special Power', {
        fontSize: '10px', color: '#666688',
      }).setScrollFactor(0).setDepth(200).setOrigin(0.5, 1);

    const gameScene = this.scene.get('GameScene');
    gameScene.events.on('hud-update', this._onUpdate, this);
    gameScene.events.on('boss-activated', () => {
      this.add.text(GAME_WIDTH / 2, 100, '⚠ BOSS APPEARED ⚠', {
        fontSize: '26px', color: '#ff3333', fontStyle: 'bold',
        stroke: '#440000', strokeThickness: 4,
      }).setScrollFactor(0).setDepth(250).setOrigin(0.5);
    }, this);
  }

  private _onUpdate({ hp, element }: { hp: number; element: ElementSystem }): void {
    const pct = hp / PLAYER_MAX_HP;
    this.hpBarFill.width    = Math.max(0, 200 * pct);
    this.hpBarFill.fillColor = pct > 0.5 ? 0xff2233 : pct > 0.25 ? 0xff8800 : 0xff0000;
    this.hpText.setText(`HP  ${hp}`);
    this._refreshElement(element);
  }

  private _refreshElement(es: ElementSystem): void {
    const { type, level } = es;
    const name = ELEMENT_NAMES[type];
    const col  = ELEMENT_COLORS[type];
    const hex  = '#' + col.toString(16).padStart(6, '0');

    this.elementLabel.setText(`${name}  Lv.${level}`).setStyle({ color: hex });
    this.elementBg.fillColor = Phaser.Display.Color.IntegerToColor(col).darken(70).color;
    this.specialLabel.setText(`X: ${es.getSpecialName()}`);
    this.atomPips.forEach((pip, i) => { pip.fillColor = i < level ? col : 0x222244; });
  }
}
