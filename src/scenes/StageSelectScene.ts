import Phaser from 'phaser';
import {
  type Difficulty,
  GAME_HEIGHT,
  GAME_WIDTH,
  isFinaleStage,
  SECTORS,
  type SectorId,
  STAGE_COUNT,
  sectorOf,
} from '../constants';
import { STAGES } from '../stages';
import { passcodeFor, resolvePasscode } from '../systems/Passcode';
import SaveSystem from '../systems/SaveSystem';
import { attachTap } from '../systems/touchMenu';

const MONO = 'monospace';
const COL_X = [200, 480, 760] as const; // one column per sector
const ROW_Y = [150, 268, 386] as const; // three stages per sector
const CARD_W = 250;
const CARD_H = 104;

const SECTOR_COLOR: Record<SectorId, number> = {
  1: 0x88bb55,
  2: 0xdd6644,
  3: 0x6677ee,
};

export default class StageSelectScene extends Phaser.Scene {
  private difficulty: Difficulty = 'normal';
  private unlocked = 1;
  private cursor = 0; // 0..STAGE_COUNT-1  (stage = cursor + 1)
  private cards: Phaser.GameObjects.Graphics[] = [];

  private leftKey!: Phaser.Input.Keyboard.Key;
  private rightKey!: Phaser.Input.Keyboard.Key;
  private upKey!: Phaser.Input.Keyboard.Key;
  private downKey!: Phaser.Input.Keyboard.Key;
  private confirmKey!: Phaser.Input.Keyboard.Key;
  private confirmKey2!: Phaser.Input.Keyboard.Key;
  private backKey!: Phaser.Input.Keyboard.Key;
  private boardKey!: Phaser.Input.Keyboard.Key;
  private codeKey!: Phaser.Input.Keyboard.Key;

  // Passcode entry modal state. While `entering` is true the card navigation is frozen and
  // keystrokes are routed to the code buffer instead.
  private entering = false;
  private codeBuf = '';
  private overlay: Phaser.GameObjects.Container | null = null;
  private digitsText: Phaser.GameObjects.Text | null = null;
  private statusText: Phaser.GameObjects.Text | null = null;

  constructor() {
    super('StageSelectScene');
  }

  create(): void {
    this.difficulty = (this.registry.get('difficulty') as Difficulty | undefined) ?? 'normal';
    this.unlocked = SaveSystem.getUnlockedStage(this.difficulty);
    this.cards = [];
    // The scene instance is reused across restarts — clear any stale modal state.
    this.entering = false;
    this.overlay = null;
    this.digitsText = null;
    this.statusText = null;
    // Start the cursor on the furthest unlocked stage so you resume where you left off.
    this.cursor = Phaser.Math.Clamp(this.unlocked - 1, 0, STAGE_COUNT - 1);

    const cx = GAME_WIDTH / 2;
    this.add.rectangle(cx, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x060e06).setScrollFactor(0);

    this.add
      .text(cx, 36, 'SELECT STAGE', { fontSize: '26px', color: '#88cc88', fontFamily: MONO, fontStyle: 'bold' })
      .setOrigin(0.5);
    this.add
      .text(cx, 64, `Difficulty: ${this.difficulty.toUpperCase()}`, {
        fontSize: '13px',
        color: '#669966',
        fontFamily: MONO,
      })
      .setOrigin(0.5);

    // Sector column headers
    for (let s = 0; s < 3; s++) {
      const sector = (s + 1) as SectorId;
      this.add
        .text(COL_X[s], 96, SECTORS[sector].name, {
          fontSize: '15px',
          color: `#${SECTOR_COLOR[sector].toString(16).padStart(6, '0')}`,
          fontFamily: MONO,
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
    }

    // Stage cards
    for (let stage = 1; stage <= STAGE_COUNT; stage++) {
      this._buildCard(stage);
    }

    this.add
      .text(cx, GAME_HEIGHT - 24, '← → ↑ ↓ navigate   Z/Enter play   P code   L leaderboard   ESC back', {
        fontSize: '13px',
        color: '#668866',
        fontFamily: MONO,
      })
      .setOrigin(0.5);

    // Tappable corner buttons (mirror the ESC / L keyboard shortcuts) for touch.
    const back = this.add
      .text(20, 30, '‹ BACK', { fontSize: '15px', color: '#88bb88', fontFamily: MONO })
      .setOrigin(0, 0.5);
    attachTap(
      back,
      () => this.scene.start('DifficultyScene'),
      () => back.setColor('#ccffcc'),
    );
    back.on('pointerout', () => back.setColor('#88bb88'));

    const board = this.add
      .text(GAME_WIDTH - 20, 30, 'LEADERBOARD ›', { fontSize: '15px', color: '#88bb88', fontFamily: MONO })
      .setOrigin(1, 0.5);
    attachTap(
      board,
      () => this.scene.start('LeaderboardScene', { from: 'StageSelectScene', difficulty: this.difficulty }),
      () => board.setColor('#ccffcc'),
    );
    board.on('pointerout', () => board.setColor('#88bb88'));

    // Tappable passcode entry (mirrors the P shortcut).
    const code = this.add
      .text(GAME_WIDTH - 20, GAME_HEIGHT - 52, '⌨ ENTER CODE', { fontSize: '15px', color: '#88bb88', fontFamily: MONO })
      .setOrigin(1, 0.5);
    attachTap(
      code,
      () => this._openCodeEntry(),
      () => code.setColor('#ccffcc'),
    );
    code.on('pointerout', () => code.setColor('#88bb88'));

    this._refresh();

    // biome-ignore lint/style/noNonNullAssertion: keyboard always present
    const kb = this.input.keyboard!;
    this.leftKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this.rightKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    this.upKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.downKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    this.confirmKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.confirmKey2 = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.backKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.boardKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.L);
    this.codeKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.P);
  }

  private _cardPos(stage: number): { x: number; y: number } {
    const col = sectorOf(stage) - 1; // 0..2
    const row = (stage - 1) % 3; // 0..2
    return { x: COL_X[col], y: ROW_Y[row] };
  }

  private _buildCard(stage: number): void {
    const { x, y } = this._cardPos(stage);
    const def = STAGES[stage - 1];
    const locked = stage > this.unlocked;
    const sector = sectorOf(stage);
    const accent = SECTOR_COLOR[sector];
    const top = y - CARD_H / 2;

    const border = this.add.graphics();
    this.cards.push(border); // index = stage - 1

    // Touch: a transparent hit zone over the card. Tap to select; tap the selected card to play.
    const zone = this.add.rectangle(x, y, CARD_W, CARD_H, 0x000000, 0).setOrigin(0.5);
    attachTap(zone, () => {
      if (this.cursor === stage - 1) this._confirm();
      else {
        this.cursor = stage - 1;
        this._refresh();
      }
    });

    const titleColor = locked ? '#555f55' : `#${accent.toString(16).padStart(6, '0')}`;
    this.add
      .text(x - CARD_W / 2 + 14, top + 12, `Stage ${stage}${isFinaleStage(stage) ? '  ☣ BOSS' : ''}`, {
        fontSize: '14px',
        color: titleColor,
        fontFamily: MONO,
        fontStyle: 'bold',
      })
      .setOrigin(0, 0);

    this.add
      .text(x - CARD_W / 2 + 14, top + 38, locked ? '🔒 LOCKED' : def.name, {
        fontSize: '13px',
        color: locked ? '#556055' : '#cfe6cf',
        fontFamily: MONO,
        wordWrap: { width: CARD_W - 28 },
      })
      .setOrigin(0, 0);

    const best = SaveSystem.getBestScore(this.difficulty, stage);
    this.add
      .text(x - CARD_W / 2 + 14, top + CARD_H - 22, locked ? '' : `Best: ${best > 0 ? best.toLocaleString() : '—'}`, {
        fontSize: '12px',
        color: '#7f9a7f',
        fontFamily: MONO,
      })
      .setOrigin(0, 0);

    // Earned passcode: shown on the bottom-right of every unlocked stage past the first
    // (stage 1 has no code). Lets the player jot it down to resume on a fresh device.
    if (!locked && stage > 1) {
      this.add
        .text(x + CARD_W / 2 - 14, top + CARD_H - 22, `Code ${passcodeFor(stage, this.difficulty)}`, {
          fontSize: '12px',
          color: '#6f8a6f',
          fontFamily: MONO,
        })
        .setOrigin(1, 0);
    }
  }

  update(): void {
    // While the passcode modal is open, navigation is frozen — entry keys are handled by
    // the scoped keydown listener attached in _openCodeEntry.
    if (this.entering) return;
    if (Phaser.Input.Keyboard.JustDown(this.leftKey)) this._move(-3);
    if (Phaser.Input.Keyboard.JustDown(this.rightKey)) this._move(3);
    if (Phaser.Input.Keyboard.JustDown(this.upKey)) this._move(-1);
    if (Phaser.Input.Keyboard.JustDown(this.downKey)) this._move(1);
    if (Phaser.Input.Keyboard.JustDown(this.confirmKey) || Phaser.Input.Keyboard.JustDown(this.confirmKey2)) {
      this._confirm();
    }
    if (Phaser.Input.Keyboard.JustDown(this.backKey)) this.scene.start('DifficultyScene');
    if (Phaser.Input.Keyboard.JustDown(this.boardKey)) {
      this.scene.start('LeaderboardScene', { from: 'StageSelectScene', difficulty: this.difficulty });
    }
    if (Phaser.Input.Keyboard.JustDown(this.codeKey)) this._openCodeEntry();
  }

  private _move(delta: number): void {
    // ±1 moves within a sector column (row); ±3 jumps between sector columns.
    if (Math.abs(delta) === 1) {
      const col = Math.floor(this.cursor / 3);
      const row = Phaser.Math.Clamp((this.cursor % 3) + delta, 0, 2);
      this.cursor = col * 3 + row;
    } else {
      this.cursor = Phaser.Math.Clamp(this.cursor + delta, 0, STAGE_COUNT - 1);
    }
    this._refresh();
  }

  private _refresh(): void {
    for (let stage = 1; stage <= STAGE_COUNT; stage++) {
      const { x, y } = this._cardPos(stage);
      const selected = stage - 1 === this.cursor;
      const locked = stage > this.unlocked;
      const accent = SECTOR_COLOR[sectorOf(stage)];
      const g = this.cards[stage - 1];
      g.clear();
      g.fillStyle(accent, selected ? 0.16 : 0.05);
      g.fillRect(x - CARD_W / 2, y - CARD_H / 2, CARD_W, CARD_H);
      g.lineStyle(selected ? 2 : 1, locked ? 0x445544 : accent, selected ? 0.95 : 0.3);
      g.strokeRect(x - CARD_W / 2, y - CARD_H / 2, CARD_W, CARD_H);
    }
  }

  private _confirm(): void {
    const stage = this.cursor + 1;
    if (stage > this.unlocked) {
      // Locked — quick red flash on the card to signal it's not available yet.
      const { x, y } = this._cardPos(stage);
      const g = this.cards[stage - 1];
      g.lineStyle(2, 0xff4444, 0.9);
      g.strokeRect(x - CARD_W / 2, y - CARD_H / 2, CARD_W, CARD_H);
      this.cameras.main.shake(120, 0.004);
      return;
    }
    this.registry.set('runScore', 0); // a freshly selected stage begins a new run
    this.scene.start('GameScene', { stage, difficulty: this.difficulty });
  }

  // ── Passcode entry modal ──────────────────────────────────────────────────────

  private _openCodeEntry(): void {
    if (this.entering) return;
    this.entering = true;
    this.codeBuf = '';

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const PANEL_W = 300;
    const PANEL_H = 360;

    const container = this.add.container(0, 0).setDepth(100);
    this.overlay = container;

    // Full-screen dimmer; tapping it (outside the panel) cancels.
    const dim = this.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6);
    attachTap(dim, () => this._closeCodeEntry());
    container.add(dim);

    const panel = this.add.graphics();
    panel.fillStyle(0x0c160c, 0.98);
    panel.fillRoundedRect(cx - PANEL_W / 2, cy - PANEL_H / 2, PANEL_W, PANEL_H, 8);
    panel.lineStyle(2, 0x4a8a4a, 0.9);
    panel.strokeRoundedRect(cx - PANEL_W / 2, cy - PANEL_H / 2, PANEL_W, PANEL_H, 8);
    // Swallow taps on the panel body so they don't fall through to the dimmer's cancel.
    const panelZone = this.add.rectangle(cx, cy, PANEL_W, PANEL_H, 0x000000, 0);
    attachTap(panelZone, () => {});
    container.add([panel, panelZone]);

    const top = cy - PANEL_H / 2;
    container.add(
      this.add
        .text(cx, top + 26, 'ENTER PASSCODE', {
          fontSize: '18px',
          color: '#88cc88',
          fontFamily: MONO,
          fontStyle: 'bold',
        })
        .setOrigin(0.5),
    );
    container.add(
      this.add
        .text(cx, top + 48, `Difficulty: ${this.difficulty.toUpperCase()}`, {
          fontSize: '12px',
          color: '#669966',
          fontFamily: MONO,
        })
        .setOrigin(0.5),
    );

    this.digitsText = this.add
      .text(cx, top + 84, '', { fontSize: '28px', color: '#cfe6cf', fontFamily: MONO, fontStyle: 'bold' })
      .setOrigin(0.5);
    container.add(this.digitsText);

    // Numpad: 1-9 grid, then DEL / 0 / OK.
    const keyW = 64;
    const keyH = 44;
    const gap = 10;
    const gridW = keyW * 3 + gap * 2;
    const gx = cx - gridW / 2;
    const gy = top + 116;
    const layout: { label: string; col: number; row: number; onTap: () => void }[] = [];
    for (let i = 1; i <= 9; i++) {
      layout.push({
        label: String(i),
        col: (i - 1) % 3,
        row: Math.floor((i - 1) / 3),
        onTap: () => this._pushDigit(String(i)),
      });
    }
    layout.push({ label: 'DEL', col: 0, row: 3, onTap: () => this._popDigit() });
    layout.push({ label: '0', col: 1, row: 3, onTap: () => this._pushDigit('0') });
    layout.push({ label: 'OK', col: 2, row: 3, onTap: () => this._submitCode() });

    for (const k of layout) {
      const kx = gx + k.col * (keyW + gap) + keyW / 2;
      const ky = gy + k.row * (keyH + gap) + keyH / 2;
      const accent = k.label === 'OK' ? 0x44cc66 : k.label === 'DEL' ? 0xcc6644 : 0x4a8a4a;
      const bg = this.add.rectangle(kx, ky, keyW, keyH, accent, 0.12).setStrokeStyle(1, accent, 0.6);
      const label = this.add
        .text(kx, ky, k.label, { fontSize: '18px', color: '#cfe6cf', fontFamily: MONO })
        .setOrigin(0.5);
      attachTap(bg, k.onTap, () => bg.setFillStyle(accent, 0.28));
      bg.on('pointerout', () => bg.setFillStyle(accent, 0.12));
      container.add([bg, label]);
    }

    this.statusText = this.add
      .text(cx, cy + PANEL_H / 2 - 26, 'type code · Enter=OK · Esc=cancel', {
        fontSize: '11px',
        color: '#668866',
        fontFamily: MONO,
      })
      .setOrigin(0.5);
    container.add(this.statusText);

    this._refreshDigits();

    // biome-ignore lint/style/noNonNullAssertion: keyboard always present
    this.input.keyboard!.on('keydown', this._onCodeKey, this);
  }

  private _onCodeKey = (ev: KeyboardEvent): void => {
    if (!this.entering) return;
    if (ev.key >= '0' && ev.key <= '9') this._pushDigit(ev.key);
    else if (ev.key === 'Backspace') this._popDigit();
    else if (ev.key === 'Enter') this._submitCode();
    else if (ev.key === 'Escape') this._closeCodeEntry();
  };

  private _pushDigit(d: string): void {
    if (this.codeBuf.length >= 6) return;
    this.codeBuf += d;
    this._refreshDigits();
  }

  private _popDigit(): void {
    if (!this.codeBuf) return;
    this.codeBuf = this.codeBuf.slice(0, -1);
    this._refreshDigits();
  }

  private _refreshDigits(): void {
    if (!this.digitsText) return;
    const slots: string[] = [];
    for (let i = 0; i < 6; i++) slots.push(this.codeBuf[i] ?? '_');
    this.digitsText.setText(slots.join(' '));
  }

  private _submitCode(): void {
    const stage = resolvePasscode(this.codeBuf, this.difficulty);
    if (stage === null) {
      this.codeBuf = '';
      this._refreshDigits();
      this.statusText?.setText('INVALID CODE').setColor('#ff6655');
      this.cameras.main.shake(120, 0.004);
      return;
    }
    SaveSystem.unlockUpToStage(this.difficulty, stage);
    this._closeCodeEntry();
    // Rebuild every card against the new unlock state; create() re-reads the save and
    // snaps the cursor to the furthest unlocked stage.
    this.scene.restart();
  }

  private _closeCodeEntry(): void {
    this.input.keyboard?.off('keydown', this._onCodeKey, this);
    this.overlay?.destroy(true);
    this.overlay = null;
    this.digitsText = null;
    this.statusText = null;
    this.entering = false;
  }
}
