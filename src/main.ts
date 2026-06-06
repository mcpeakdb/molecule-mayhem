import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from './constants.js';
import BootScene from './scenes/BootScene.js';
import DifficultyScene from './scenes/DifficultyScene.js';
import ElementChoiceScene from './scenes/ElementChoiceScene.js';
import GameScene from './scenes/GameScene.js';
import HUDScene from './scenes/HUDScene.js';
import PauseScene from './scenes/PauseScene.js';
import StageSelectScene from './scenes/StageSelectScene.js';

new Phaser.Game({
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#0d1420',
  physics: {
    default: 'arcade',
    arcade: { debug: false, gravity: { x: 0, y: 0 } },
  },
  scene: [BootScene, DifficultyScene, StageSelectScene, GameScene, HUDScene, ElementChoiceScene, PauseScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
});
