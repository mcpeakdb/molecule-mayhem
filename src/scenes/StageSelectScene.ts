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
import SaveSystem from '../systems/SaveSystem';

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

  constructor() {
    super('StageSelectScene');
  }

  create(): void {
    this.difficulty = (this.registry.get('difficulty') as Difficulty | undefined) ?? 'normal';
    this.unlocked = SaveSystem.getUnlockedStage(this.difficulty);
    this.cards = [];
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
      .text(cx, GAME_HEIGHT - 24, '← → ↑ ↓ navigate    Z/Enter play    L leaderboard    ESC back', {
        fontSize: '13px',
        color: '#668866',
        fontFamily: MONO,
      })
      .setOrigin(0.5);

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
  }

  update(): void {
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
}
