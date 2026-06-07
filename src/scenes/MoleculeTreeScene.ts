import Phaser from 'phaser';
import {
  ATTACK_ORDER,
  ATTACKS,
  type AttackId,
  BASE_ATOMS,
  type BaseAtom,
  ELEMENT_COLORS,
  ELEMENT_NAMES,
  GAME_HEIGHT,
  GAME_WIDTH,
} from '../constants';
import { attachTap } from '../systems/touchMenu';

const MONO = 'monospace';

const ATOM_SYMBOL: Record<BaseAtom, string> = {
  hydrogen: 'H',
  oxygen: 'O',
  carbon: 'C',
  nitrogen: 'N',
};

const COMPOUND_SYMBOL: Partial<Record<AttackId, string>> = {
  water: 'H₂O',
  ammonia: 'NH₃',
  carbon_dioxide: 'CO₂',
  methane: 'CH₄',
  nitric_oxide: 'NO',
  carbonic_acid: 'H₂CO₃',
};

const hex = (col: number): string => `#${col.toString(16).padStart(6, '0')}`;
const isBaseAtom = (id: AttackId): id is BaseAtom => (BASE_ATOMS as string[]).includes(id);

/**
 * A static reference screen: the molecular tree. Shows the four collectable base atoms across the
 * top and the compounds they assemble into below, with connector lines tracing each recipe and the
 * three tier attack names every element unlocks. Data-driven from ATTACKS, so it stays in sync as
 * elements are added. Reachable from the Title menu.
 */
export default class MoleculeTreeScene extends Phaser.Scene {
  private from = 'TitleScene';
  private escKey!: Phaser.Input.Keyboard.Key;
  private confirmKey!: Phaser.Input.Keyboard.Key;
  private confirmKey2!: Phaser.Input.Keyboard.Key;

  constructor() {
    super('MoleculeTreeScene');
  }

  init(data: { from?: string }): void {
    this.from = data.from ?? 'TitleScene';
  }

  create(): void {
    const cx = GAME_WIDTH / 2;
    const bg = this.add.rectangle(cx, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x05090f).setScrollFactor(0);
    // Touch: tap the backdrop to go back (mirrors ESC / Z).
    attachTap(bg, () => this.scene.start(this.from));

    this.add
      .text(cx, 38, 'MOLECULE TREE', { fontSize: '30px', color: '#aaf0ff', fontFamily: MONO, fontStyle: 'bold' })
      .setOrigin(0.5);
    this.add
      .text(cx, 68, 'Collect atoms to arm attacks — combine them into compounds for stronger ones', {
        fontSize: '13px',
        color: '#6699aa',
        fontFamily: MONO,
      })
      .setOrigin(0.5);

    // ── Base atoms across the top ────────────────────────────────────────────
    const atomY = 132;
    const atomXs: Record<BaseAtom, number> = {} as Record<BaseAtom, number>;
    BASE_ATOMS.forEach((atom, i) => {
      const x = cx + (i - (BASE_ATOMS.length - 1) / 2) * 210;
      atomXs[atom] = x;
      this._drawAtom(atom, x, atomY);
    });

    // ── Compounds in a grid below ────────────────────────────────────────────
    const compounds = ATTACK_ORDER.filter((id) => !isBaseAtom(id));
    const cols = 3;
    const colXs = [cx - 310, cx, cx + 310];
    const rowYs = [292, 438];
    const cardCenters: { id: AttackId; x: number; y: number }[] = compounds.map((id, i) => ({
      id,
      x: colXs[i % cols],
      y: rowYs[Math.floor(i / cols)],
    }));

    // Connector lines (drawn first, behind the cards): one per atom→compound dependency.
    const lines = this.add.graphics().setDepth(0);
    for (const { id, x, y } of cardCenters) {
      for (const atom of Object.keys(ATTACKS[id].recipe) as BaseAtom[]) {
        lines.lineStyle(1.5, ELEMENT_COLORS[atom], 0.28);
        lines.lineBetween(atomXs[atom], atomY + 30, x, y - 64);
      }
    }

    for (const { id, x, y } of cardCenters) this._drawCompound(id, x, y);

    this.add
      .text(cx, GAME_HEIGHT - 22, 'ESC / Z  or tap  to go back', {
        fontSize: '13px',
        color: '#557766',
        fontFamily: MONO,
      })
      .setOrigin(0.5);

    // biome-ignore lint/style/noNonNullAssertion: keyboard always present
    const kb = this.input.keyboard!;
    this.escKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.confirmKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.confirmKey2 = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
  }

  /** A base-atom badge: coloured circle with its symbol, name and Lv1 attack below. */
  private _drawAtom(atom: BaseAtom, x: number, y: number): void {
    const col = ELEMENT_COLORS[atom];
    this.add.circle(x, y, 24, Phaser.Display.Color.IntegerToColor(col).darken(55).color).setDepth(1);
    this.add.circle(x, y, 24).setStrokeStyle(2.5, col).setDepth(2);
    this.add
      .text(x, y, ATOM_SYMBOL[atom], { fontSize: '22px', color: hex(col), fontFamily: MONO, fontStyle: 'bold' })
      .setOrigin(0.5)
      .setDepth(2);
    this.add
      .text(x, y + 38, ELEMENT_NAMES[atom], { fontSize: '13px', color: '#cfe0e8', fontFamily: MONO, fontStyle: 'bold' })
      .setOrigin(0.5);
    this.add
      .text(x, y + 54, ATTACKS[atom].tierNames[0], { fontSize: '11px', color: '#7d93a0', fontFamily: MONO })
      .setOrigin(0.5);
  }

  /** A compound card: recipe, name/symbol and its three tier attack names. */
  private _drawCompound(id: AttackId, x: number, y: number): void {
    const def = ATTACKS[id];
    const col = def.color;
    const cardW = 286;
    const cardH = 128;

    this.add.rectangle(x, y, cardW, cardH, Phaser.Display.Color.IntegerToColor(col).darken(72).color, 0.95).setDepth(1);
    this.add.rectangle(x, y, cardW, cardH).setStrokeStyle(2, col).setFillStyle(0x000000, 0).setDepth(2);

    // Recipe, e.g. "2 H + 1 O", ordered by BASE_ATOMS.
    const recipe = BASE_ATOMS.filter((a) => def.recipe[a])
      .map((a) => `${def.recipe[a]} ${ATOM_SYMBOL[a]}`)
      .join('  +  ');
    this.add
      .text(x, y - 48, recipe, { fontSize: '13px', color: '#aebcc6', fontFamily: MONO })
      .setOrigin(0.5)
      .setDepth(3);

    const symbol = COMPOUND_SYMBOL[id];
    this.add
      .text(x, y - 26, symbol ? `${ELEMENT_NAMES[id].replace(/\s*\(.*\)/, '')}  ${symbol}` : ELEMENT_NAMES[id], {
        fontSize: '16px',
        color: hex(col),
        fontFamily: MONO,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(3);

    def.tierNames.forEach((name, i) => {
      this.add
        .text(x, y - 2 + i * 18, `Lv${i + 1}  ${name}`, { fontSize: '12px', color: '#c4d2da', fontFamily: MONO })
        .setOrigin(0.5)
        .setDepth(3);
    });
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
