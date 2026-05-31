import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../constants';

const MONO = 'monospace';
const OPTIONS = ['RESUME', 'RESTART SECTOR', 'QUIT TO SECTOR 1'] as const;

export default class PauseScene extends Phaser.Scene {
  private cursor = 0;
  private stage = 1;
  private optionTexts: Phaser.GameObjects.Text[] = [];
  private cursorText!: Phaser.GameObjects.Text;
  private upKey!: Phaser.Input.Keyboard.Key;
  private downKey!: Phaser.Input.Keyboard.Key;
  private confirmKey!: Phaser.Input.Keyboard.Key;
  private confirmKey2!: Phaser.Input.Keyboard.Key;
  private escKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super('PauseScene');
  }

  init(data: { stage?: number }): void {
    this.stage = data.stage ?? 1;
    this.cursor = 0;
  }

  create(): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // Overlay
    this.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.78)
      .setScrollFactor(0).setDepth(500);

    // Title
    this.add.text(cx, cy - 72, 'PAUSED', {
      fontSize: '30px', color: '#88cc88', fontFamily: MONO, fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(501);

    // Separator lines
    const g = this.add.graphics().setScrollFactor(0).setDepth(501);
    g.lineStyle(1, 0x1a3a1a, 0.7);
    g.lineBetween(cx - 130, cy - 48, cx + 130, cy - 48);
    g.lineBetween(cx - 130, cy + 58, cx + 130, cy + 58);

    // Cursor marker
    this.cursorText = this.add.text(cx - 108, cy - 20, '›', {
      fontSize: '20px', color: '#aaffaa', fontFamily: MONO,
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(502);

    // Menu options
    this.optionTexts = OPTIONS.map((label, i) =>
      this.add.text(cx - 88, cy - 20 + i * 34, label, {
        fontSize: '18px', color: '#669966', fontFamily: MONO,
      }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(502),
    );

    this._refreshCursor();

    // biome-ignore lint/style/noNonNullAssertion: keyboard always present
    const kb = this.input.keyboard!;
    this.upKey      = kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.downKey    = kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    this.confirmKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.confirmKey2 = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.escKey     = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
  }

  update(): void {
    if (Phaser.Input.Keyboard.JustDown(this.upKey))   this._moveCursor(-1);
    if (Phaser.Input.Keyboard.JustDown(this.downKey)) this._moveCursor(1);
    if (Phaser.Input.Keyboard.JustDown(this.confirmKey) || Phaser.Input.Keyboard.JustDown(this.confirmKey2)) this._confirm();
    if (Phaser.Input.Keyboard.JustDown(this.escKey))  this._resume();
  }

  private _moveCursor(dir: number): void {
    this.cursor = (this.cursor + dir + OPTIONS.length) % OPTIONS.length;
    this._refreshCursor();
  }

  private _refreshCursor(): void {
    const cy = GAME_HEIGHT / 2;
    this.cursorText.setY(cy - 20 + this.cursor * 34);
    this.optionTexts.forEach((t, i) => {
      t.setStyle({ color: i === this.cursor ? '#ccffcc' : '#669966', fontFamily: MONO });
    });
  }

  private _confirm(): void {
    switch (this.cursor) {
      case 0: this._resume(); break;
      case 1:
        this.scene.stop('HUDScene');
        this.scene.stop('PauseScene');
        this.scene.start('GameScene', { stage: this.stage });
        break;
      case 2:
        this.scene.stop('HUDScene');
        this.scene.stop('PauseScene');
        this.scene.start('DifficultyScene');
        break;
    }
  }

  private _resume(): void {
    this.scene.get('GameScene').events.emit('pause-resume');
    this.scene.stop();
  }
}
