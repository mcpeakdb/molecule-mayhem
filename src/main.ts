import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from './constants.js';
import BootScene from './scenes/BootScene.js';
import ElementChoiceScene from './scenes/ElementChoiceScene.js';
import GameScene from './scenes/GameScene.js';
import HUDScene from './scenes/HUDScene.js';

new Phaser.Game({
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#0a0010',
  physics: {
    default: 'arcade',
    arcade: { debug: false, gravity: { x: 0, y: 0 } },
  },
  scene: [BootScene, GameScene, HUDScene, ElementChoiceScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
});
