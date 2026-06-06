import Phaser from 'phaser';
import { type Difficulty, GAME_HEIGHT, GAME_WIDTH } from '../constants';
import Settings from '../systems/Settings';

const MONO = 'monospace';
const ITEMS = ['START', 'STAGE SELECT', 'LEADERBOARD', 'CONTROLS', 'SETTINGS'] as const;

export default class TitleScene extends Phaser.Scene {
  private cursor = 0;
  private itemTexts: Phaser.GameObjects.Text[] = [];
  private cursorText!: Phaser.GameObjects.Text;
  private electrons: Phaser.GameObjects.Arc[] = [];

  private upKey!: Phaser.Input.Keyboard.Key;
  private downKey!: Phaser.Input.Keyboard.Key;
  private confirmKey!: Phaser.Input.Keyboard.Key;
  private confirmKey2!: Phaser.Input.Keyboard.Key;

  constructor() {
    super('TitleScene');
  }

  create(): void {
    const cx = GAME_WIDTH / 2;
    this.cursor = 0;
    this.itemTexts = [];
    this.electrons = [];

    this.add.rectangle(cx, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x05090f).setScrollFactor(0);

    // Decorative orbiting atom behind the title
    const atomY = 132;
    this.add.circle(cx, atomY, 16, 0x44bbf0).setAlpha(0.9);
    this.add.circle(cx, atomY, 9, 0x88ddff);
    for (let i = 0; i < 3; i++) {
      const ring = this.add.graphics().setPosition(cx, atomY);
      ring.lineStyle(1.5, 0x4488cc, 0.5);
      ring.strokeEllipse(0, 0, 120, 44);
      ring.setRotation((i * Math.PI) / 3);
      const e = this.add.circle(cx + 60, atomY, 4, 0xaaf0ff);
      this.electrons.push(e);
      this.tweens.add({
        targets: { t: 0 },
        t: Math.PI * 2,
        duration: 2600 + i * 700,
        repeat: -1,
        onUpdate: (_tw, tgt: { t: number }) => {
          const a = (tgt as { t: number }).t;
          const rot = (i * Math.PI) / 3;
          const ex = Math.cos(a) * 60;
          const ey = Math.sin(a) * 22;
          e.setPosition(cx + ex * Math.cos(rot) - ey * Math.sin(rot), atomY + ex * Math.sin(rot) + ey * Math.cos(rot));
        },
      });
    }

    this.add
      .text(cx, 224, 'MOLECULAR MELTDOWN', {
        fontSize: '46px',
        color: '#aaf0ff',
        fontFamily: MONO,
        fontStyle: 'bold',
        stroke: '#04212e',
        strokeThickness: 6,
      })
      .setOrigin(0.5);
    this.add
      .text(cx, 262, 'a molecular-scale beat ’em up', {
        fontSize: '15px',
        color: '#6699aa',
        fontFamily: MONO,
        fontStyle: 'italic',
      })
      .setOrigin(0.5);

    this.cursorText = this.add
      .text(cx - 130, 320, '›', { fontSize: '20px', color: '#aaffaa', fontFamily: MONO })
      .setOrigin(0, 0.5);

    this.itemTexts = ITEMS.map((label, i) =>
      this.add
        .text(cx - 104, 320 + i * 34, label, { fontSize: '19px', color: '#88bb88', fontFamily: MONO })
        .setOrigin(0, 0.5),
    );

    this.add
      .text(cx, GAME_HEIGHT - 24, '↑↓ select    Z / Enter confirm', {
        fontSize: '13px',
        color: '#557755',
        fontFamily: MONO,
      })
      .setOrigin(0.5);

    this._refresh();

    // biome-ignore lint/style/noNonNullAssertion: keyboard always present
    const kb = this.input.keyboard!;
    this.upKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.downKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    this.confirmKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.confirmKey2 = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
  }

  update(): void {
    if (Phaser.Input.Keyboard.JustDown(this.upKey)) this._move(-1);
    if (Phaser.Input.Keyboard.JustDown(this.downKey)) this._move(1);
    if (Phaser.Input.Keyboard.JustDown(this.confirmKey) || Phaser.Input.Keyboard.JustDown(this.confirmKey2)) {
      this._confirm();
    }
  }

  private _move(dir: number): void {
    this.cursor = (this.cursor + dir + ITEMS.length) % ITEMS.length;
    this._refresh();
  }

  private _refresh(): void {
    this.itemTexts.forEach((t, i) => {
      t.setColor(i === this.cursor ? '#ccffcc' : '#88bb88');
    });
    this.cursorText.setY(320 + this.cursor * 34);
  }

  private _confirm(): void {
    switch (this.cursor) {
      case 0: // START
        if (Settings.get().tutorialDone) this.scene.start('DifficultyScene');
        else this.scene.start('GameScene', { tutorial: true });
        break;
      case 1: // STAGE SELECT
        // StageSelect reads difficulty from the registry; seed a default if none chosen yet.
        if (!this.registry.get('difficulty')) this.registry.set('difficulty', 'normal' as Difficulty);
        this.scene.start('StageSelectScene');
        break;
      case 2: // LEADERBOARD
        this.scene.start('LeaderboardScene', { from: 'TitleScene' });
        break;
      case 3: // CONTROLS
        this.scene.start('HelpScene', { from: 'TitleScene' });
        break;
      case 4: // SETTINGS
        this.scene.start('SettingsScene', { from: 'TitleScene' });
        break;
    }
  }
}
