import {
  ATTACK_ORDER,
  ATTACKS,
  type AttackId,
  BASE_ATOMS,
  type BaseAtom,
  ELEMENTS,
  type ElementType,
  MAX_ELEMENT_LEVEL,
} from '../constants';
import type { AttackSlot, ElementState } from '../types';

/**
 * Tracks the multiset of base atoms the player has collected and derives the
 * set of attacks that are available *simultaneously* from them (Phase 6).
 *
 * - A base attack (H/O/C/N) is available once its atom is owned; level = min(count, 3).
 * - A compound attack is available once all its constituent atoms are owned;
 *   level = min(sum of constituent counts, 3).
 */
export default class ElementSystem {
  private counts: Record<BaseAtom, number> = { hydrogen: 0, oxygen: 0, carbon: 0, nitrogen: 0 };
  /** Easiest difficulty: collapse the arsenal to the single strongest attack on key 1. */
  private simplified = false;

  /** Toggle the simplified (one-strongest-weapon) arsenal — set from the difficulty. */
  setSimplified(on: boolean): void {
    this.simplified = on;
  }

  /** Increment an atom's count. Returns true if this unlocked a new attack or raised a level. */
  collectAtom(atom: BaseAtom): boolean {
    const before = this._signature();
    this.counts[atom]++;
    return this._signature() !== before;
  }

  getCounts(): Record<BaseAtom, number> {
    return { ...this.counts };
  }

  /** Available attacks in fixed priority order, numbered for the numpad (1..9, then 0 for the 10th).
   *  In simplified mode only the single most-advanced attack is wielded, bound to key 1. */
  getAvailableAttacks(): AttackSlot[] {
    const all = ElementSystem.attacksFor(this.counts);
    if (this.simplified && all.length > 0) {
      return [{ ...all[all.length - 1], key: 1 }];
    }
    return all;
  }

  getAttackLevel(id: AttackId): number {
    return ElementSystem.levelFor(id, this.counts);
  }

  /**
   * Pure: the attack level a given counts map yields (0 = unavailable).
   * Level = how many complete copies of the molecule's recipe the atoms can assemble, capped at 3.
   * e.g. Water needs 2H+1O: 2H/1O → Lv1, 4H/2O → Lv2, 6H/3O → Lv3.
   */
  static levelFor(id: AttackId, counts: Record<BaseAtom, number>): number {
    const recipe = ATTACKS[id].recipe;
    let copies = MAX_ELEMENT_LEVEL;
    for (const atom of Object.keys(recipe) as BaseAtom[]) {
      const need = recipe[atom] ?? 0;
      copies = Math.min(copies, Math.floor(counts[atom] / need));
    }
    return Math.min(copies, MAX_ELEMENT_LEVEL);
  }

  /** Pure: available attacks for an arbitrary counts map (used to preview a pick). */
  static attacksFor(counts: Record<BaseAtom, number>): AttackSlot[] {
    const slots: { id: AttackId; level: number }[] = [];
    for (const id of ATTACK_ORDER) {
      const level = ElementSystem.levelFor(id, counts);
      if (level > 0) slots.push({ id, level });
    }
    return slots.map((s, i) => ({ ...s, key: i < 9 ? i + 1 : 0 }));
  }

  isUnlocked(id: AttackId): boolean {
    return this.getAttackLevel(id) > 0;
  }

  /** Most-advanced available attack (highest slot) — used for the player tint. */
  getPrimary(): AttackId | null {
    const available = this.getAvailableAttacks();
    return available.length ? available[available.length - 1].id : null;
  }

  getSpecialName(id: AttackId, level: number): string {
    return ATTACKS[id].tierNames[Math.max(0, level - 1)] ?? '—';
  }

  // ── Backward-compatible accessors (player tint, etc.) ──────────────────────
  get type(): ElementType {
    return this.getPrimary() ?? ELEMENTS.NONE;
  }

  get level(): number {
    const p = this.getPrimary();
    return p ? this.getAttackLevel(p) : 0;
  }

  getState(): ElementState {
    return { type: this.type, level: this.level };
  }

  private _signature(): string {
    // Changes whenever an attack unlocks or a level rises (until everything is capped).
    return BASE_ATOMS.map((a) => Math.min(this.counts[a], MAX_ELEMENT_LEVEL)).join(',');
  }
}
