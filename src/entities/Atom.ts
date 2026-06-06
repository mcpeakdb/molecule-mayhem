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
  /** Rare wildcard pickup (Phase 7): lets the player pick any base atom and grants it +2. */
  gold: boolean;
  collected = false;
  sprite: AtomSprite;

  constructor(scene: Phaser.Scene, x: number, y: number, choices: BaseAtom[], gold = false) {
    this.scene = scene;
    this.choices = choices;
    this.gold = gold;

    const base = scene.physics.add.sprite(x, y, gold ? 'atom_gold' : 'atom_node');
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
