import { ELEMENTS, type ElementType, MAX_ELEMENT_LEVEL } from '../constants';
import type { ElementState } from '../types';

export default class ElementSystem {
  type: ElementType = ELEMENTS.NONE;
  level: number = 0;
  private _hCount = 0;
  private _oCount = 0;
  private _cCount = 0;
  private _nCount = 0;

  getState(): ElementState {
    return { type: this.type, level: this.level };
  }

  collectAtom(element: ElementType): boolean {
    const prevLevel = this.level;
    if (element === ELEMENTS.HYDROGEN) this._hCount++;
    else if (element === ELEMENTS.OXYGEN) this._oCount++;
    else if (element === ELEMENTS.CARBON) this._cCount++;
    else if (element === ELEMENTS.NITROGEN) this._nCount++;
    this._resolve();
    return this.level > prevLevel;
  }

  private _resolve(): void {
    const h = this._hCount,
      o = this._oCount,
      c = this._cCount,
      n = this._nCount;

    if (c >= 1 && h >= 1 && o >= 1) {
      this.type = ELEMENTS.CARBONIC_ACID;
      this.level = Math.min(c + h + o, MAX_ELEMENT_LEVEL);
    } else if (c >= 1 && h >= 1 && o === 0 && n === 0) {
      this.type = ELEMENTS.METHANE;
      this.level = Math.min(c + h, MAX_ELEMENT_LEVEL);
    } else if (n >= 1 && h >= 1 && c === 0 && o === 0) {
      this.type = ELEMENTS.AMMONIA;
      this.level = Math.min(n + h, MAX_ELEMENT_LEVEL);
    } else if (c >= 1 && o >= 1 && h === 0 && n === 0) {
      this.type = ELEMENTS.CARBON_DIOXIDE;
      this.level = Math.min(c + o, MAX_ELEMENT_LEVEL);
    } else if (n >= 1 && o >= 1 && c === 0 && h === 0) {
      this.type = ELEMENTS.NITRIC_OXIDE;
      this.level = Math.min(n + o, MAX_ELEMENT_LEVEL);
    } else if (h > 0 && o > 0) {
      this.type = ELEMENTS.WATER;
      this.level = Math.min(h + o, MAX_ELEMENT_LEVEL);
    } else if (h > 0) {
      this.type = ELEMENTS.HYDROGEN;
      this.level = Math.min(h, MAX_ELEMENT_LEVEL);
    } else if (o > 0) {
      this.type = ELEMENTS.OXYGEN;
      this.level = Math.min(o, MAX_ELEMENT_LEVEL);
    } else if (c > 0) {
      this.type = ELEMENTS.CARBON;
      this.level = Math.min(c, MAX_ELEMENT_LEVEL);
    } else if (n > 0) {
      this.type = ELEMENTS.NITROGEN;
      this.level = Math.min(n, MAX_ELEMENT_LEVEL);
    } else {
      this.type = ELEMENTS.NONE;
      this.level = 0;
    }
  }

  getSpecialName(): string {
    const { type, level } = this;
    const NAMES: Partial<Record<ElementType, string[]>> = {
      [ELEMENTS.HYDROGEN]: ['Proton Punch', 'Plasma Arc', 'Fusion Burst'],
      [ELEMENTS.OXYGEN]: ['Oxidize', 'Reactive Cloud', 'Oxidation Nova'],
      [ELEMENTS.WATER]: ['Water Jet', 'Hydro Wave', 'Tidal Force'],
      [ELEMENTS.CARBON]: ['Carbon Claw', 'Diamond Shard', 'Graphene Shockwave'],
      [ELEMENTS.NITROGEN]: ['Nitrogen Frost', 'Cryo Burst', 'Absolute Zero'],
      [ELEMENTS.AMMONIA]: ['Caustic Spray', 'Acid Cloud', 'Toxic Deluge'],
      [ELEMENTS.CARBON_DIOXIDE]: ['Smog Pulse', 'Suffocation Field', 'Blackout'],
      [ELEMENTS.METHANE]: ['Gas Ignite', 'Chain Blast', 'Fireball'],
      [ELEMENTS.NITRIC_OXIDE]: ['Radical Rush', 'Reactive Aura', 'Overclock'],
      [ELEMENTS.CARBONIC_ACID]: ['Acid Drop', 'Corrosive Spray', 'Acid Rain'],
    };
    if (type === ELEMENTS.NONE || level === 0) return 'No Power';
    return NAMES[type]?.[level - 1] ?? 'No Power';
  }

  isMaxLevel(): boolean {
    return this.level >= MAX_ELEMENT_LEVEL;
  }
}
