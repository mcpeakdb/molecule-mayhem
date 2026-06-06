import Phaser from 'phaser';
import { type Difficulty, GAME_HEIGHT, GAME_WIDTH } from '../constants';
import SaveSystem from '../systems/SaveSystem';
import { attachTap } from '../systems/touchMenu';

const MONO = 'monospace';
const DIFFS: Difficulty[] = ['normal', 'hard', 'extreme'];
const DIFF_COLOR: Record<Difficulty, string> = { normal: '#44cc66', hard: '#88bb44', extreme: '#cc4422' };

export default class LeaderboardScene extends Phaser.Scene {
  private diffIndex = 0; // default Normal
  private from = 'TitleScene';
  private tabTexts: Phaser.GameObjects.Text[] = [];
  private listText!: Phaser.GameObjects.Text;

  private leftKey!: Phaser.Input.Keyboard.Key;
  private rightKey!: Phaser.Input.Keyboard.Key;
  private escKey!: Phaser.Input.Keyboard.Key;
  private confirmKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super('LeaderboardScene');
  }

  init(data: { from?: string; difficulty?: Difficulty }): void {
    this.from = data.from ?? 'TitleScene';
    this.diffIndex = data.difficulty ? DIFFS.indexOf(data.difficulty) : 0;
    if (this.diffIndex < 0) this.diffIndex = 0;
    this.tabTexts = [];
  }

  create(): void {
    const cx = GAME_WIDTH / 2;
    this.add.rectangle(cx, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x060e06).setScrollFactor(0);

    this.add
      .text(cx, 48, 'LEADERBOARD', { fontSize: '30px', color: '#88cc88', fontFamily: MONO, fontStyle: 'bold' })
      .setOrigin(0.5);

    // Difficulty tabs
    const tabW = 150;
    this.tabTexts = DIFFS.map((d, i) => {
      const t = this.add
        .text(cx + (i - 1) * tabW, 96, d.toUpperCase(), { fontSize: '16px', color: '#557755', fontFamily: MONO })
        .setOrigin(0.5);
      attachTap(t, () => {
        this.diffIndex = i;
        this._refresh();
      });
      return t;
    });

    const g = this.add.graphics();
    g.lineStyle(1, 0x1a3a1a, 0.7);
    g.lineBetween(cx - 380, 120, cx + 380, 120);

    this.listText = this.add
      .text(cx, 150, '', { fontSize: '16px', color: '#cfe0cf', fontFamily: MONO, align: 'left', lineSpacing: 10 })
      .setOrigin(0.5, 0);

    this.add
      .text(cx, GAME_HEIGHT - 28, '← → switch difficulty    ESC / Z back', {
        fontSize: '13px',
        color: '#668866',
        fontFamily: MONO,
      })
      .setOrigin(0.5);

    const back = this.add
      .text(20, 30, '‹ BACK', { fontSize: '15px', color: '#88bb88', fontFamily: MONO })
      .setOrigin(0, 0.5);
    attachTap(
      back,
      () => this.scene.start(this.from),
      () => back.setColor('#ccffcc'),
    );
    back.on('pointerout', () => back.setColor('#88bb88'));

    this._refresh();

    // biome-ignore lint/style/noNonNullAssertion: keyboard always present
    const kb = this.input.keyboard!;
    this.leftKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this.rightKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    this.escKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.confirmKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
  }

  update(): void {
    if (Phaser.Input.Keyboard.JustDown(this.leftKey)) this._switch(-1);
    if (Phaser.Input.Keyboard.JustDown(this.rightKey)) this._switch(1);
    if (Phaser.Input.Keyboard.JustDown(this.escKey) || Phaser.Input.Keyboard.JustDown(this.confirmKey)) {
      this.scene.start(this.from);
    }
  }

  private _switch(dir: number): void {
    this.diffIndex = (this.diffIndex + dir + DIFFS.length) % DIFFS.length;
    this._refresh();
  }

  private _refresh(): void {
    const diff = DIFFS[this.diffIndex];
    this.tabTexts.forEach((t, i) => {
      const active = i === this.diffIndex;
      t.setColor(active ? DIFF_COLOR[DIFFS[i]] : '#557755');
      t.setFontStyle(active ? 'bold' : 'normal');
    });

    const runs = SaveSystem.getLeaderboard(diff);
    if (runs.length === 0) {
      this.listText.setText('\n   No runs recorded yet.\n   Clear a stage to set a score!');
      this.listText.setColor('#779977');
      return;
    }

    this.listText.setColor('#cfe0cf');
    const lines = runs.map((r, i) => {
      const date = new Date(r.date);
      const d = `${date.toLocaleString('en', { month: 'short' })} ${date.getDate()}`;
      const score = r.score.toLocaleString().padStart(9);
      const a = r.atoms;
      const atoms = `H${a.hydrogen} O${a.oxygen} C${a.carbon} N${a.nitrogen}`;
      return `#${i + 1}  ${score}   Stage ${r.stageReached}   ${atoms.padEnd(16)} ${d}`;
    });
    this.listText.setText(lines.join('\n\n'));
  }
}
