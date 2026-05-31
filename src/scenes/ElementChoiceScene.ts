import Phaser from 'phaser';
import { ELEMENT_COLORS, ELEMENT_NAMES, type ElementType, GAME_HEIGHT, GAME_WIDTH } from '../constants';

const CHOICE_DESCRIPTIONS: Partial<Record<ElementType, string[]>> = {
  hydrogen: ['Proton Punch  → fast melee', 'Plasma Arc  → energy bolt', 'Fusion Burst  → area explosion'],
  oxygen: ['Oxidize  → corrosive slash', 'Reactive Cloud  → slow + dmg', 'Oxidation Nova  → massive AOE'],
  water: ['Water Jet  → knockback bolt', 'Hydro Wave  → forward surge', 'Tidal Force  → screen wipe'],
  carbon: ['Carbon Claw  → bleed DOT', 'Diamond Shard  → piercing shot', 'Shockwave  → ground AOE'],
  nitrogen: ['N. Frost  → freeze melee', 'Cryo Burst  → freeze + shatter', 'Absolute Zero  → freeze all'],
  ammonia: ['Caustic Spray  → nearby DOT', 'Acid Cloud  → DOT + slow', 'Toxic Deluge  → full-screen DOT'],
  carbon_dioxide: ['Smog Pulse  → fog burst', 'Suffocation  → vision + dmg', 'Blackout  → screen-wide'],
  methane: ['Gas Ignite  → contact blast', 'Chain Blast  → chain explosion', 'Fireball  → massive AOE'],
  nitric_oxide: ['Radical Rush  → speed + aura', 'Reactive Aura  → extended buff', 'Overclock  → 2× speed+dmg'],
  carbonic_acid: ['Acid Drop  → multi-hit drops', 'Corrosive Spray  → cone drops', 'Acid Rain  → all on screen'],
};

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
  element: ElementType;
}

interface ChoiceData {
  choices: ElementType[];
  callback: (chosen: ElementType) => void;
}

export default class ElementChoiceScene extends Phaser.Scene {
  private choices!: ElementType[];
  private callback!: (chosen: ElementType) => void;
  private selected = 0;
  private cards!: Card[];

  constructor() {
    super('ElementChoiceScene');
  }

  init(data: ChoiceData): void {
    this.choices = data.choices;
    this.callback = data.callback;
    this.selected = 0;
  }

  create(): void {
    const w = GAME_WIDTH,
      h = GAME_HEIGHT;

    this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.72).setDepth(0);
    this.add
      .text(w / 2, 78, '⚛  MYSTERY ATOM  ⚛', {
        fontSize: '32px',
        color: '#cc88ff',
        fontStyle: 'bold',
        stroke: '#440066',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(2);
    this.add
      .text(w / 2, 122, 'Choose your element path:', {
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

  private _buildCard(element: ElementType, index: number): Card {
    const col = ELEMENT_COLORS[element];
    const hex = `#${col.toString(16).padStart(6, '0')}`;
    const cardW = 220,
      cardH = 260;
    const totalW = this.choices.length * (cardW + 30) - 30;
    const startX = (GAME_WIDTH - totalW) / 2 + index * (cardW + 30) + cardW / 2;
    const cardY = GAME_HEIGHT / 2 + 20;

    const bg = this.add
      .rectangle(startX, cardY, cardW, cardH, Phaser.Display.Color.IntegerToColor(col).darken(65).color, 0.95)
      .setDepth(1);
    const border = this.add
      .rectangle(startX, cardY, cardW, cardH)
      .setStrokeStyle(3, col)
      .setDepth(2)
      .setFillStyle(0x000000, 0);

    this.add
      .text(startX, cardY - 90, ELEMENT_NAMES[element], {
        fontSize: '23px',
        color: hex,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(3);

    this.add
      .text(startX, cardY - 50, ELEMENT_SYMBOLS[element] ?? '?', {
        fontSize: '44px',
        color: hex,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(3)
      .setAlpha(0.6);

    (CHOICE_DESCRIPTIONS[element] ?? []).forEach((d, li) => {
      this.add
        .text(startX, cardY + 20 + li * 32, `Lv.${li + 1}  ${d}`, {
          fontSize: '13px',
          color: '#ccccdd',
          wordWrap: { width: cardW - 20 },
        })
        .setOrigin(0.5)
        .setDepth(3);
    });

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
