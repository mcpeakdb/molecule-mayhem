import type Phaser from 'phaser';
import type { ElementType } from './constants';
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
  attackKey: Phaser.Input.Keyboard.Key;
  specialKey: Phaser.Input.Keyboard.Key;
};

export type ElementState = { type: ElementType; level: number };
