import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../constants';

const MONO = 'monospace';

const ENTRIES: [string, string][] = [
  ['Move', 'WASD  or  Arrow Keys'],
  ['Jump', 'Space  (press again in the air to double-jump)'],
  ['Attack', 'Keys 1, 2, 3  (number row or numpad)'],
  ['', 'Slot 1 is a punch until you arm a compound'],
  ['Collect', 'Walk into a glowing atom, then pick an element'],
  ['Loadout', 'Pause → COMPOUND SELECTION to bind your weapons'],
  ['Pause', 'ESC  or  Enter'],
  ['Watch out', 'Chasms hurt — jump across them, do not walk in'],
];

export default class HelpScene extends Phaser.Scene {
  private from = 'TitleScene';
  private escKey!: Phaser.Input.Keyboard.Key;
  private confirmKey!: Phaser.Input.Keyboard.Key;
  private confirmKey2!: Phaser.Input.Keyboard.Key;

  constructor() {
    super('HelpScene');
  }

  init(data: { from?: string }): void {
    this.from = data.from ?? 'TitleScene';
  }

  create(): void {
    const cx = GAME_WIDTH / 2;
    this.add.rectangle(cx, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x060e06).setScrollFactor(0);

    this.add
      .text(cx, 56, 'CONTROLS', { fontSize: '30px', color: '#88cc88', fontFamily: MONO, fontStyle: 'bold' })
      .setOrigin(0.5);

    const g = this.add.graphics();
    g.lineStyle(1, 0x1a3a1a, 0.7);
    g.lineBetween(cx - 320, 92, cx + 320, 92);

    const leftX = cx - 300;
    const valueX = cx - 110;
    let y = 130;
    for (const [label, value] of ENTRIES) {
      if (label) {
        this.add.text(leftX, y, label, { fontSize: '17px', color: '#aadd88', fontFamily: MONO, fontStyle: 'bold' });
      }
      this.add.text(valueX, y, value, { fontSize: '16px', color: '#cfe0cf', fontFamily: MONO });
      y += label ? 44 : 26;
    }

    this.add
      .text(cx, GAME_HEIGHT - 34, 'ESC / Z to go back', { fontSize: '14px', color: '#668866', fontFamily: MONO })
      .setOrigin(0.5);

    // biome-ignore lint/style/noNonNullAssertion: keyboard always present
    const kb = this.input.keyboard!;
    this.escKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.confirmKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.confirmKey2 = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
  }

  update(): void {
    if (
      Phaser.Input.Keyboard.JustDown(this.escKey) ||
      Phaser.Input.Keyboard.JustDown(this.confirmKey) ||
      Phaser.Input.Keyboard.JustDown(this.confirmKey2)
    ) {
      this.scene.start(this.from);
    }
  }
}
