import type Phaser from 'phaser';

/**
 * Make a game object respond to mouse/touch input so the keyboard-driven menus are also tappable.
 * `onTap` fires on press; the optional `onHover` mirrors keyboard cursor movement on pointer-over.
 * Propagation is stopped so a tap doesn't also reach an underlying control (e.g. the touch stick).
 */
export function attachTap(target: Phaser.GameObjects.GameObject, onTap: () => void, onHover?: () => void): void {
  target.setInteractive({ useHandCursor: true });
  if (onHover) target.on('pointerover', onHover);
  target.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, ev?: Phaser.Types.Input.EventData) => {
    ev?.stopPropagation();
    onTap();
  });
}
