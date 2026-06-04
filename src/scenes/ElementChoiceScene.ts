import Phaser from 'phaser';
import {
  ATTACK_ORDER,
  ATTACKS,
  type AttackId,
  type BaseAtom,
  ELEMENT_COLORS,
  ELEMENT_NAMES,
  type ElementType,
  GAME_HEIGHT,
  GAME_WIDTH,
} from '../constants';
import ElementSystem from '../systems/ElementSystem';

const ELEMENT_SYMBOLS: Partial<Record<ElementType, string>> = {
  hydrogen: 'H',
  oxygen: 'O',
  water: 'H₂O',
  carbon: 'C',
  nitrogen: 'N',
  ammonia: 'NH₃',
  carbon_dioxide: 'CO₂',
  methane: 'CH₄',
  nitric_oxide: 'NO',
  carbonic_acid: 'H₂CO₃',
};

interface Card {
  bg: Phaser.GameObjects.Rectangle;
  border: Phaser.GameObjects.Rectangle;
  element: BaseAtom;
}

interface ChoiceData {
  choices: BaseAtom[];
  counts?: Record<BaseAtom, number>;
  callback: (chosen: BaseAtom) => void;
}

export default class ElementChoiceScene extends Phaser.Scene {
  private choices!: BaseAtom[];
  private counts!: Record<BaseAtom, number>;
  private callback!: (chosen: BaseAtom) => void;
  private selected = 0;
  private cards!: Card[];

  constructor() {
    super('ElementChoiceScene');
  }

  init(data: ChoiceData): void {
    this.choices = data.choices;
    this.counts = data.counts ?? { hydrogen: 0, oxygen: 0, carbon: 0, nitrogen: 0 };
    this.callback = data.callback;
    this.selected = 0;
  }

  /** Attacks that picking `element` would unlock or level, given the current molecule. */
  private _changes(element: BaseAtom): { id: AttackId; level: number; isNew: boolean }[] {
    const after = { ...this.counts, [element]: this.counts[element] + 1 };
    const out: { id: AttackId; level: number; isNew: boolean }[] = [];
    for (const id of ATTACK_ORDER) {
      const before = ElementSystem.levelFor(id, this.counts);
      const level = ElementSystem.levelFor(id, after);
      if (level > before) out.push({ id, level, isNew: before === 0 });
    }
    return out;
  }

  create(): void {
    const w = GAME_WIDTH,
      h = GAME_HEIGHT;

    this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.72).setDepth(0);
    this.add
      .text(w / 2, 78, '⚛  ADD AN ATOM  ⚛', {
        fontSize: '32px',
        color: '#cc88ff',
        fontStyle: 'bold',
        stroke: '#440066',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(2);
    this.add
      .text(w / 2, 122, 'Grow your molecule — each pick unlocks & levels attacks:', {
        fontSize: '18px',
        color: '#aaaacc',
      })
      .setOrigin(0.5)
      .setDepth(2);

    this.cards = this.choices.map((el, i) => this._buildCard(el, i));

    this.add
      .text(w / 2, h - 48, '← → to choose   Z to confirm', {
        fontSize: '17px',
        color: '#9999aa',
      })
      .setOrigin(0.5)
      .setDepth(2);

    this._highlight(0);

    this.input.keyboard?.on('keydown-LEFT', () => this._move(-1));
    this.input.keyboard?.on('keydown-RIGHT', () => this._move(1));
    this.input.keyboard?.on('keydown-A', () => this._move(-1));
    this.input.keyboard?.on('keydown-D', () => this._move(1));
    this.input.keyboard?.on('keydown-Z', () => this._confirm());
    this.input.keyboard?.on('keydown-ENTER', () => this._confirm());
  }

  private _buildCard(element: BaseAtom, index: number): Card {
    const col = ELEMENT_COLORS[element];
    const hex = `#${col.toString(16).padStart(6, '0')}`;
    const cardW = 240,
      cardH = 286;
    const totalW = this.choices.length * (cardW + 28) - 28;
    const startX = (GAME_WIDTH - totalW) / 2 + index * (cardW + 28) + cardW / 2;
    const cardY = GAME_HEIGHT / 2 + 28;

    const bg = this.add
      .rectangle(startX, cardY, cardW, cardH, Phaser.Display.Color.IntegerToColor(col).darken(65).color, 0.95)
      .setDepth(1);
    const border = this.add
      .rectangle(startX, cardY, cardW, cardH)
      .setStrokeStyle(3, col)
      .setDepth(2)
      .setFillStyle(0x000000, 0);

    // Title: "+1  Hydrogen"
    this.add
      .text(startX, cardY - 112, `+1  ${ELEMENT_NAMES[element]}`, {
        fontSize: '22px',
        color: hex,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(3);

    // Big atom symbol watermark
    this.add
      .text(startX, cardY - 74, ELEMENT_SYMBOLS[element] ?? '?', { fontSize: '40px', color: hex, fontStyle: 'bold' })
      .setOrigin(0.5)
      .setDepth(3)
      .setAlpha(0.55);

    this.add
      .text(startX, cardY - 38, 'UNLOCKS / LEVELS', { fontSize: '11px', color: '#8899aa', fontStyle: 'bold' })
      .setOrigin(0.5)
      .setDepth(3);

    const changes = this._changes(element);
    if (changes.length === 0) {
      this.add
        .text(startX, cardY + 10, 'All maxed', { fontSize: '14px', color: '#888899' })
        .setOrigin(0.5)
        .setDepth(3);
    } else {
      changes.forEach((c, li) => {
        const cHex = `#${ATTACKS[c.id].color.toString(16).padStart(6, '0')}`;
        const marker = c.isNew ? '★ NEW' : `▲ Lv${c.level}`;
        const sym = ELEMENT_SYMBOLS[c.id] ?? '?';
        this.add
          .text(startX, cardY - 16 + li * 26, `${marker}  ${sym}  ${ATTACKS[c.id].tierNames[c.level - 1]}`, {
            fontSize: '13px',
            color: cHex,
            fontStyle: c.isNew ? 'bold' : 'normal',
            wordWrap: { width: cardW - 18 },
          })
          .setOrigin(0.5, 0)
          .setDepth(3);
      });
    }

    return { bg, border, element };
  }

  private _highlight(index: number): void {
    this.cards.forEach((card, i) => {
      const active = i === index;
      card.bg.setAlpha(active ? 1 : 0.55);
      card.border.setAlpha(active ? 1 : 0.35);
      this.tweens.add({
        targets: card.bg,
        scaleX: active ? 1.04 : 1.0,
        scaleY: active ? 1.04 : 1.0,
        duration: 120,
        ease: 'Power2',
      });
    });
  }

  private _move(dir: number): void {
    this.selected = Phaser.Math.Clamp(this.selected + dir, 0, this.choices.length - 1);
    this._highlight(this.selected);
  }

  private _confirm(): void {
    const chosen = this.choices[this.selected];
    const card = this.cards[this.selected];
    this.tweens.add({
      targets: card.bg,
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      duration: 350,
      ease: 'Power3',
      onComplete: () => this.callback(chosen),
    });
  }
}
