import type Phaser from 'phaser';
import type { AttackId, BaseAtom, ElementType } from './constants';
import type Atom from './entities/Atom';
import type Boss from './entities/Boss';
import type Enemy from './entities/Enemy';

// physics.add.sprite() always creates a dynamic body, but Phaser's type is
// Body | StaticBody | null.  Narrowing to SpriteWithDynamicBody gives us typed
// access to setVelocity / setSize / etc. without casts at every call site.
export type EnemySprite = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody & { enemyRef: Enemy | Boss };
export type AtomSprite = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody & { atomRef: Atom };

export type WasdKeys = {
  W: Phaser.Input.Keyboard.Key;
  A: Phaser.Input.Keyboard.Key;
  S: Phaser.Input.Keyboard.Key;
  D: Phaser.Input.Keyboard.Key;
};

export type InputKeys = {
  cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  wasd: WasdKeys;
  /** Basic punch — numpad `.` (and main-keyboard `.` mirror). Any key down fires. */
  punchKeys: Phaser.Input.Keyboard.Key[];
  /** Attack slots: index 0 = slot "1" … index 8 = "9", index 9 = "0". Each slot lists its
   *  equivalent keys (numpad + number-row mirror) — any of them fires that slot. */
  slotKeys: Phaser.Input.Keyboard.Key[][];
};

export type ElementState = { type: ElementType; level: number };

/** One available attack, as derived from the owned atoms. */
export type AttackSlot = {
  id: AttackId;
  /** 1..3 */
  level: number;
  /** Numpad label: 1..9 for the first nine, 0 for the tenth. */
  key: number;
};

/** HUD payload: an available attack plus its live cooldown state. */
export type ArsenalEntry = AttackSlot & {
  name: string;
  color: number;
  cooldownRemaining: number;
  cooldownMs: number;
};

/** Full HUD arsenal snapshot: available attacks + owned-atom counts (the molecular tree). */
export type ArsenalUpdate = {
  attacks: ArsenalEntry[];
  counts: Record<BaseAtom, number>;
};
