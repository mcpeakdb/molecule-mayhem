import type Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../constants';
import type { TouchInputState } from '../types';

// Layout (in the 960×540 design space — the HUD camera never scrolls, so these are screen coords).
const STICK_RADIUS = 58; // max knob travel from the touch origin
const STICK_DEADZONE = 0.16; // ignore tiny drifts so a still thumb reads as idle
const MOVE_ZONE_W = GAME_WIDTH * 0.55; // left portion that summons the floating stick
const JUMP = { x: GAME_WIDTH - 84, y: GAME_HEIGHT - 84, r: 50 };
const PAUSE = { x: GAME_WIDTH - 84, y: GAME_HEIGHT - 190, r: 26 };
const DEPTH = 240;

/**
 * On-screen controls for touch devices: a floating thumbstick on the left half for movement,
 * a jump button and a pause button on the right. Weapon-slot taps are fed in from the HUD chips
 * via {@link queueSlot}. State is polled once per frame by GameScene and merged into the player's
 * keyboard input, so the rest of the game stays input-source agnostic.
 */
export default class TouchControls {
  moveX = 0;
  moveY = 0;
  onPause?: () => void;

  private readonly scene: Phaser.Scene;
  private enabled = true;

  private jumpQueued = false;
  private slotQueue: number[] = [];

  // Floating stick — tracks whichever pointer first lands in the movement zone.
  private stickPointerId: number | null = null;
  private stickOriginX = 0;
  private stickOriginY = 0;
  private readonly stickBase: Phaser.GameObjects.Arc;
  private readonly stickKnob: Phaser.GameObjects.Arc;
  private readonly stickRing: Phaser.GameObjects.Arc;

  private readonly buttons: (Phaser.GameObjects.Arc | Phaser.GameObjects.Text)[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    // Allow several simultaneous touches (move + jump + a slot tap) — the default is one pointer.
    scene.input.addPointer(2);

    // Movement zone: the lower-left region summons the stick wherever the thumb lands.
    const zone = scene.add
      .zone(0, 0, MOVE_ZONE_W, GAME_HEIGHT)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(100)
      .setInteractive();
    zone.on('pointerdown', (pointer: Phaser.Input.Pointer) => this._claimStick(pointer));
    scene.input.on('pointermove', this._onPointerMove, this);
    scene.input.on('pointerup', this._onPointerUp, this);

    // Stick visuals (hidden until a thumb is down).
    this.stickRing = scene.add
      .circle(0, 0, STICK_RADIUS, 0x000000, 0.18)
      .setStrokeStyle(3, 0x88ddff, 0.45)
      .setScrollFactor(0)
      .setDepth(DEPTH)
      .setVisible(false);
    this.stickBase = scene.add
      .circle(0, 0, STICK_RADIUS - 6, 0x0a1620, 0.0)
      .setScrollFactor(0)
      .setDepth(DEPTH)
      .setVisible(false);
    this.stickKnob = scene.add
      .circle(0, 0, 30, 0x88ddff, 0.55)
      .setStrokeStyle(2, 0xccf2ff, 0.9)
      .setScrollFactor(0)
      .setDepth(DEPTH + 1)
      .setVisible(false);

    this._makeButton(JUMP.x, JUMP.y, JUMP.r, 0x2a5a2a, 0x88ffaa, '⤒', () => {
      this.jumpQueued = true;
    });
    this._makeButton(PAUSE.x, PAUSE.y, PAUSE.r, 0x33405a, 0xaaccff, '❚❚', () => this.onPause?.());
  }

  /** Build a round, semi-transparent action button with a glyph and a quick press-flash. */
  private _makeButton(
    x: number,
    y: number,
    r: number,
    fill: number,
    stroke: number,
    glyph: string,
    action: () => void,
  ): void {
    const circle = this.scene.add
      .circle(x, y, r, fill, 0.4)
      .setStrokeStyle(3, stroke, 0.8)
      .setScrollFactor(0)
      .setDepth(DEPTH)
      .setInteractive({ useHandCursor: true });
    const label = this.scene.add
      .text(x, y, glyph, { fontSize: `${Math.round(r * 0.9)}px`, color: '#ffffff', fontFamily: 'monospace' })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH + 1);
    circle.on(
      'pointerdown',
      (_p: Phaser.Input.Pointer, _lx: number, _ly: number, ev?: Phaser.Types.Input.EventData) => {
        if (!this.enabled) return;
        ev?.stopPropagation();
        action();
        this.scene.tweens.add({ targets: [circle, label], scale: 0.85, duration: 70, yoyo: true });
      },
    );
    this.buttons.push(circle, label);
  }

  private _claimStick(pointer: Phaser.Input.Pointer): void {
    if (!this.enabled || this.stickPointerId !== null) return;
    this.stickPointerId = pointer.id;
    this.stickOriginX = pointer.x;
    this.stickOriginY = pointer.y;
    this.stickRing.setPosition(pointer.x, pointer.y).setVisible(true);
    this.stickBase.setPosition(pointer.x, pointer.y).setVisible(true);
    this.stickKnob.setPosition(pointer.x, pointer.y).setVisible(true);
  }

  private _onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (pointer.id !== this.stickPointerId) return;
    const dx = pointer.x - this.stickOriginX;
    const dy = pointer.y - this.stickOriginY;
    const dist = Math.hypot(dx, dy);
    const clamped = Math.min(dist, STICK_RADIUS);
    const nx = dist > 0 ? dx / dist : 0;
    const ny = dist > 0 ? dy / dist : 0;
    this.stickKnob.setPosition(this.stickOriginX + nx * clamped, this.stickOriginY + ny * clamped);

    const mag = clamped / STICK_RADIUS;
    if (mag < STICK_DEADZONE) {
      this.moveX = 0;
      this.moveY = 0;
    } else {
      this.moveX = nx * mag;
      this.moveY = ny * mag;
    }
  }

  private _onPointerUp(pointer: Phaser.Input.Pointer): void {
    if (pointer.id !== this.stickPointerId) return;
    this._releaseStick();
  }

  private _releaseStick(): void {
    this.stickPointerId = null;
    this.moveX = 0;
    this.moveY = 0;
    this.stickRing.setVisible(false);
    this.stickBase.setVisible(false);
    this.stickKnob.setVisible(false);
  }

  /** Queue a weapon-slot fire (called by the HUD when a chip is tapped). */
  queueSlot(index: number): void {
    if (this.enabled) this.slotQueue.push(index);
  }

  /** True once if jump was tapped since the last poll. */
  consumeJump(): boolean {
    const j = this.jumpQueued;
    this.jumpQueued = false;
    return j;
  }

  /** Slot indices tapped since the last poll (cleared by this call). */
  private _drainSlots(): number[] {
    if (this.slotQueue.length === 0) return [];
    const out = this.slotQueue;
    this.slotQueue = [];
    return out;
  }

  /** A snapshot of this frame's input for {@link Player.update}. */
  snapshot(): TouchInputState {
    return { moveX: this.moveX, moveY: this.moveY, jump: this.consumeJump(), slots: this._drainSlots() };
  }

  /** Show/hide and (when disabling) reset all input — used to silence controls during pause/intros. */
  setEnabled(on: boolean): void {
    if (this.enabled === on) return;
    this.enabled = on;
    for (const b of this.buttons) b.setVisible(on);
    if (!on) {
      this._releaseStick();
      this.jumpQueued = false;
      this.slotQueue = [];
    }
  }
}
