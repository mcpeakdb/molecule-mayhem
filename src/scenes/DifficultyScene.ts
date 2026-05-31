import Phaser from 'phaser';
import { type Difficulty, GAME_HEIGHT, GAME_WIDTH } from '../constants';

const MONO = 'monospace';

const OPTIONS: { key: Difficulty; label: string; color: number; desc: string; stats: string }[] = [
  {
    key: 'easy',
    label: 'EASY',
    color: 0x44cc66,
    desc: 'REDUCED PATHOGEN\nRESISTANCE',
    stats: 'ENEMY HP     ×0.70\nENEMY SPEED  ×0.75\nINVINCIBILITY 1.4s',
  },
  {
    key: 'normal',
    label: 'NORMAL',
    color: 0x88bb44,
    desc: 'STANDARD CULTURE\nCONDITIONS',
    stats: 'ENEMY HP     ×1.00\nENEMY SPEED  ×1.00\nINVINCIBILITY 0.8s',
  },
  {
    key: 'hard',
    label: 'HARD',
    color: 0xcc4422,
    desc: 'AGGRESSIVE STRAIN\nCONDITIONS',
    stats: 'ENEMY HP     ×1.40\nENEMY SPEED  ×1.25\nINVINCIBILITY 0.5s',
  },
];

const CARD_CX = [200, 480, 760] as const;
const CARD_W = 240;
const CARD_H = 270;
const CARD_CY = 278;

export default class DifficultyScene extends Phaser.Scene {
  private cursor = 1; // default Normal
  private cardBgs: Phaser.GameObjects.Rectangle[] = [];
  private cardBorders: Phaser.GameObjects.Graphics[] = [];
  private leftKey!: Phaser.Input.Keyboard.Key;
  private rightKey!: Phaser.Input.Keyboard.Key;
  private confirmKey!: Phaser.Input.Keyboard.Key;
  private confirmKey2!: Phaser.Input.Keyboard.Key;

  constructor() {
    super('DifficultyScene');
  }

  create(): void {
    const cx = GAME_WIDTH / 2;

    // Background
    this.add.rectangle(cx, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x060e06)
      .setScrollFactor(0);

    // Title
    this.add.text(cx, 50, 'SELECT DIFFICULTY', {
      fontSize: '26px', color: '#88cc88', fontFamily: MONO, fontStyle: 'bold',
    }).setOrigin(0.5);

    // Separator
    const g = this.add.graphics();
    g.lineStyle(1, 0x1a3a1a, 0.7);
    g.lineBetween(cx - 360, 72, cx + 360, 72);
    g.lineBetween(cx - 360, 456, cx + 360, 456);

    // Cards
    OPTIONS.forEach((opt, i) => {
      const x = CARD_CX[i];
      const top = CARD_CY - CARD_H / 2;

      // Background
      const bg = this.add.rectangle(x, CARD_CY, CARD_W, CARD_H, opt.color, 0.06)
        .setOrigin(0.5);
      this.cardBgs.push(bg);

      // Border (separate Graphics per card so we can redraw individually)
      const border = this.add.graphics();
      this.cardBorders.push(border);

      // Difficulty label
      this.add.text(x, top + 30, opt.label, {
        fontSize: '24px', color: `#${opt.color.toString(16).padStart(6, '0')}`,
        fontFamily: MONO, fontStyle: 'bold',
      }).setOrigin(0.5);

      // Thin rule below label
      const rule = this.add.graphics();
      rule.lineStyle(1, opt.color, 0.25);
      rule.lineBetween(x - 90, top + 50, x + 90, top + 50);

      // Description
      this.add.text(x, top + 78, opt.desc, {
        fontSize: '13px', color: '#99bb99', fontFamily: MONO, align: 'center',
      }).setOrigin(0.5, 0);

      // Stats
      this.add.text(x, top + 150, opt.stats, {
        fontSize: '12px', color: '#779977', fontFamily: MONO, lineSpacing: 4,
      }).setOrigin(0.5, 0);
    });

    // Instructions
    this.add.text(cx, 474, '← → to navigate     Z or Enter to confirm', {
      fontSize: '13px', color: '#668866', fontFamily: MONO,
    }).setOrigin(0.5);

    this._refreshCards();

    // biome-ignore lint/style/noNonNullAssertion: keyboard always present
    const kb = this.input.keyboard!;
    this.leftKey    = kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this.rightKey   = kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    this.confirmKey  = kb.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.confirmKey2 = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
  }

  update(): void {
    if (Phaser.Input.Keyboard.JustDown(this.leftKey))  this._move(-1);
    if (Phaser.Input.Keyboard.JustDown(this.rightKey)) this._move(1);
    if (Phaser.Input.Keyboard.JustDown(this.confirmKey) || Phaser.Input.Keyboard.JustDown(this.confirmKey2)) {
      this._confirm();
    }
  }

  private _move(dir: number): void {
    this.cursor = (this.cursor + dir + OPTIONS.length) % OPTIONS.length;
    this._refreshCards();
  }

  private _refreshCards(): void {
    OPTIONS.forEach((opt, i) => {
      const selected = i === this.cursor;
      const col = opt.color;

      this.cardBgs[i].setFillStyle(col, selected ? 0.12 : 0.04);

      const border = this.cardBorders[i];
      border.clear();
      border.lineStyle(selected ? 2 : 1, col, selected ? 0.9 : 0.25);
      border.strokeRect(
        CARD_CX[i] - CARD_W / 2,
        CARD_CY - CARD_H / 2,
        CARD_W,
        CARD_H,
      );
    });
  }

  private _confirm(): void {
    const chosen = OPTIONS[this.cursor];
    this.registry.set('difficulty', chosen.key);
    this.scene.start('GameScene', { stage: 1, difficulty: chosen.key });
  }
}
