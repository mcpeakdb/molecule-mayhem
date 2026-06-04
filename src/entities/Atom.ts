import type Phaser from 'phaser';
import type { BaseAtom } from '../constants';
import type { AtomSprite } from '../types';

/**
 * An atom pickup. Every atom is a *choice node* (Phase 6): collecting it opens a
 * 2–3 way choice of base atoms, growing the player's molecular tree.
 */
export default class Atom {
  scene: Phaser.Scene;
  choices: BaseAtom[];
  collected = false;
  sprite: AtomSprite;

  constructor(scene: Phaser.Scene, x: number, y: number, choices: BaseAtom[]) {
    this.scene = scene;
    this.choices = choices;

    const base = scene.physics.add.sprite(x, y, 'atom_node');
    base.body.setAllowGravity(false);
    base.setDepth(50);
    this.sprite = base as AtomSprite;
    this.sprite.atomRef = this;

    scene.tweens.add({
      targets: this.sprite,
      y: y - 14,
      duration: 900 + Math.random() * 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
    scene.tweens.add({
      targets: this.sprite,
      angle: 360,
      duration: 2200,
      repeat: -1,
      ease: 'Linear',
    });
  }
}
