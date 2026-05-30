import type Phaser from 'phaser';
import type { ElementType } from '../constants';
import type { AtomSprite } from '../types';

export type AtomType = ElementType | 'mystery';

export default class Atom {
  scene: Phaser.Scene;
  type: AtomType;
  choices: ElementType[] | null;
  collected: boolean = false;
  sprite: AtomSprite;

  constructor(scene: Phaser.Scene, x: number, y: number, type: AtomType, choices: ElementType[] | null = null) {
    this.scene = scene;
    this.type = type;
    this.choices = choices;

    const base = scene.physics.add.sprite(x, y, `atom_${type}`);
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

    if (type === 'mystery') {
      scene.tweens.add({
        targets: this.sprite,
        angle: 360,
        duration: 2200,
        repeat: -1,
        ease: 'Linear',
      });
    }
  }
}
