import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../constants';
import Settings from '../systems/Settings';
import SoundSystem from '../systems/SoundSystem';

const MONO = 'monospace';
const ROWS = ['Volume', 'Mute', 'Sound FX', 'Screen Shake', 'BACK'] as const;

export default class SettingsScene extends Phaser.Scene {
  private cursor = 0;
  private rowTexts: Phaser.GameObjects.Text[] = [];
  private cursorText!: Phaser.GameObjects.Text;
  /** Where to return on ESC/BACK — defaults to the title. */
  private from = 'TitleScene';

  private upKey!: Phaser.Input.Keyboard.Key;
  private downKey!: Phaser.Input.Keyboard.Key;
  private leftKey!: Phaser.Input.Keyboard.Key;
  private rightKey!: Phaser.Input.Keyboard.Key;
  private confirmKey!: Phaser.Input.Keyboard.Key;
  private confirmKey2!: Phaser.Input.Keyboard.Key;
  private escKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super('SettingsScene');
  }

  init(data: { from?: string }): void {
    this.from = data.from ?? 'TitleScene';
    this.cursor = 0;
    this.rowTexts = [];
  }

  create(): void {
    const cx = GAME_WIDTH / 2;
    this.add.rectangle(cx, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x060e06).setScrollFactor(0);

    this.add
      .text(cx, 70, 'SETTINGS', { fontSize: '30px', color: '#88cc88', fontFamily: MONO, fontStyle: 'bold' })
      .setOrigin(0.5);

    const g = this.add.graphics();
    g.lineStyle(1, 0x1a3a1a, 0.7);
    g.lineBetween(cx - 220, 110, cx + 220, 110);
    g.lineBetween(cx - 220, 410, cx + 220, 410);

    this.cursorText = this.add
      .text(cx - 200, 160, '›', { fontSize: '22px', color: '#aaffaa', fontFamily: MONO })
      .setOrigin(0, 0.5);

    this.rowTexts = ROWS.map((_, i) =>
      this.add
        .text(cx - 174, 160 + i * 48, '', { fontSize: '18px', color: '#88bb88', fontFamily: MONO })
        .setOrigin(0, 0.5),
    );

    this.add
      .text(cx, GAME_HEIGHT - 30, '↑↓ select    ←→ adjust    Z/Enter toggle    ESC back', {
        fontSize: '13px',
        color: '#668866',
        fontFamily: MONO,
      })
      .setOrigin(0.5);

    this._refresh();

    // biome-ignore lint/style/noNonNullAssertion: keyboard always present
    const kb = this.input.keyboard!;
    this.upKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.downKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    this.leftKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this.rightKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    this.confirmKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.confirmKey2 = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.escKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
  }

  update(): void {
    if (Phaser.Input.Keyboard.JustDown(this.upKey)) this._moveCursor(-1);
    if (Phaser.Input.Keyboard.JustDown(this.downKey)) this._moveCursor(1);
    if (Phaser.Input.Keyboard.JustDown(this.leftKey)) this._adjust(-1);
    if (Phaser.Input.Keyboard.JustDown(this.rightKey)) this._adjust(1);
    if (Phaser.Input.Keyboard.JustDown(this.confirmKey) || Phaser.Input.Keyboard.JustDown(this.confirmKey2)) {
      this._confirm();
    }
    if (Phaser.Input.Keyboard.JustDown(this.escKey)) this._back();
  }

  private _moveCursor(dir: number): void {
    this.cursor = (this.cursor + dir + ROWS.length) % ROWS.length;
    this._refresh();
  }

  private _adjust(dir: number): void {
    const s = Settings.get();
    switch (this.cursor) {
      case 0: {
        const volume = Math.max(0, Math.min(1, Math.round((s.volume + dir * 0.1) * 10) / 10));
        Settings.set({ volume });
        this._previewBlip();
        break;
      }
      case 1:
        Settings.set({ muted: dir > 0 });
        if (!Settings.get().muted) this._previewBlip();
        break;
      case 2:
        Settings.set({ sfx: dir > 0 });
        if (Settings.get().sfx) this._previewBlip();
        break;
      case 3:
        Settings.set({ screenShake: dir > 0 });
        break;
    }
    this._refresh();
  }

  private _confirm(): void {
    if (this.cursor === ROWS.length - 1) {
      this._back();
      return;
    }
    // On a setting row, Z toggles booleans / nudges volume up (wrapping at max).
    const s = Settings.get();
    switch (this.cursor) {
      case 0:
        Settings.set({ volume: s.volume >= 1 ? 0 : Math.round((s.volume + 0.1) * 10) / 10 });
        this._previewBlip();
        break;
      case 1:
        Settings.set({ muted: !s.muted });
        if (!Settings.get().muted) this._previewBlip();
        break;
      case 2:
        Settings.set({ sfx: !s.sfx });
        if (Settings.get().sfx) this._previewBlip();
        break;
      case 3:
        Settings.set({ screenShake: !s.screenShake });
        break;
    }
    this._refresh();
  }

  private _previewBlip(): void {
    const ctx = (this.sound as Phaser.Sound.WebAudioSoundManager).context;
    SoundSystem.play(ctx, 'atom_collect');
  }

  private _back(): void {
    this.scene.start(this.from);
  }

  private _refresh(): void {
    const s = Settings.get();
    const bars = Math.round(s.volume * 10);
    const onOff = (v: boolean) => (v ? 'ON' : 'OFF');
    const values = [
      `Volume        [${'█'.repeat(bars)}${'░'.repeat(10 - bars)}] ${Math.round(s.volume * 100)}%`,
      `Mute          ${onOff(s.muted)}`,
      `Sound FX      ${onOff(s.sfx)}`,
      `Screen Shake  ${onOff(s.screenShake)}`,
      'BACK',
    ];
    this.rowTexts.forEach((t, i) => {
      const selected = i === this.cursor;
      t.setText(values[i]);
      t.setColor(selected ? '#ccffcc' : '#88bb88');
    });
    this.cursorText.setY(160 + this.cursor * 48);
  }
}
