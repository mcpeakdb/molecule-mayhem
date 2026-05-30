import { ELEMENTS, MAX_ELEMENT_LEVEL, type ElementType } from '../constants';
import type { ElementState } from '../types';

export default class ElementSystem {
  type:          ElementType = ELEMENTS.NONE;
  level:         number      = 0;
  private _hCount            = 0;
  private _oCount            = 0;

  getState(): ElementState {
    return { type: this.type, level: this.level };
  }

  collectAtom(element: ElementType): void {
    if (element === ELEMENTS.HYDROGEN) this._hCount++;
    else if (element === ELEMENTS.OXYGEN) this._oCount++;
    this._resolve();
  }

  private _resolve(): void {
    const h = this._hCount;
    const o = this._oCount;
    if (h > 0 && o > 0) {
      this.type  = ELEMENTS.WATER;
      this.level = Math.min(h + o, MAX_ELEMENT_LEVEL);
    } else if (h > 0) {
      this.type  = ELEMENTS.HYDROGEN;
      this.level = Math.min(h, MAX_ELEMENT_LEVEL);
    } else if (o > 0) {
      this.type  = ELEMENTS.OXYGEN;
      this.level = Math.min(o, MAX_ELEMENT_LEVEL);
    } else {
      this.type  = ELEMENTS.NONE;
      this.level = 0;
    }
  }

  getSpecialName(): string {
    const { type, level } = this;
    const NAMES: Partial<Record<ElementType, string[]>> = {
      [ELEMENTS.HYDROGEN]: ['Proton Punch',   'Plasma Arc',     'Fusion Burst'],
      [ELEMENTS.OXYGEN]:   ['Oxidize',        'Reactive Cloud', 'Oxidation Nova'],
      [ELEMENTS.WATER]:    ['Water Jet',      'Hydro Wave',     'Tidal Force'],
    };
    if (type === ELEMENTS.NONE || level === 0) return 'No Power';
    return NAMES[type]?.[level - 1] ?? 'No Power';
  }

  isMaxLevel(): boolean {
    return this.level >= MAX_ELEMENT_LEVEL;
  }
}
