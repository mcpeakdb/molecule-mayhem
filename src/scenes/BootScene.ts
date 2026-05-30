import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create(): void {
    this._makePlayer();
    this._makeBacterium();
    this._makeVirus();
    this._makeDustBunny();
    this._makePollen();
    this._makeBossBacterium();
    this._makeAtoms();
    this._makeEffects();
    this._makeParticle();
    this._makeBackground();
    this.scene.start('GameScene');
  }

  // Phaser's Graphics doesn't expose bezierCurveTo — we attach _done as a helper
  private _g(): Phaser.GameObjects.Graphics & { _done(key: string, w: number, h: number): void } {
    const g = this.add.graphics() as Phaser.GameObjects.Graphics & { _done(key: string, w: number, h: number): void };
    g._done = (key, w, h) => {
      g.generateTexture(key, w, h);
      g.destroy();
    };
    return g;
  }

  // Phaser Graphics has no bezierCurveTo — approximate with lineTo segments
  private _cubicBezier(
    g: Phaser.GameObjects.Graphics,
    x0: number,
    y0: number,
    cx1: number,
    cy1: number,
    cx2: number,
    cy2: number,
    x1: number,
    y1: number,
    steps = 10,
  ): void {
    g.beginPath();
    g.moveTo(x0, y0);
    for (let i = 1; i <= steps; i++) {
      const t = i / steps,
        mt = 1 - t;
      const x = mt * mt * mt * x0 + 3 * mt * mt * t * cx1 + 3 * mt * t * t * cx2 + t * t * t * x1;
      const y = mt * mt * mt * y0 + 3 * mt * mt * t * cy1 + 3 * mt * t * t * cy2 + t * t * t * y1;
      g.lineTo(x, y);
    }
    g.strokePath();
  }

  private _makePlayer(): void {
    this._makePlayerFrame('player_0', 46, 46);
    this._makePlayerFrame('player_1', 42, 50);
    this._makePlayerFrame('player_2', 50, 42);

    this.anims.create({
      key: 'player_walk',
      frames: [{ key: 'player_0' }, { key: 'player_1' }, { key: 'player_2' }, { key: 'player_1' }],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: 'player_idle',
      frames: [{ key: 'player_0' }],
      frameRate: 1,
      repeat: -1,
    });
  }

  private _makePlayerFrame(key: string, leftLegY: number, rightLegY: number): void {
    const g = this._g();
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(20, 60, 34, 10);
    g.fillStyle(0x223355);
    g.fillRect(11, leftLegY, 8, 14);
    g.fillRect(20, rightLegY, 8, 14);
    g.fillStyle(0xeeeeff);
    g.fillRect(9, 24, 22, 24);
    g.fillStyle(0xffffff);
    g.fillTriangle(14, 24, 20, 28, 9, 34);
    g.fillTriangle(26, 24, 20, 28, 31, 34);
    g.fillStyle(0xccccdd);
    g.fillRect(12, 36, 6, 6);
    g.fillStyle(0xffcc99);
    g.fillCircle(20, 18, 12);
    g.fillStyle(0x553311);
    g.fillRect(10, 8, 20, 8);
    g.fillCircle(10, 12, 5);
    g.fillCircle(30, 12, 5);
    g.fillStyle(0x444444);
    g.fillRect(10, 14, 9, 7);
    g.fillRect(21, 14, 9, 7);
    g.fillStyle(0x88ccff, 0.7);
    g.fillRect(11, 15, 7, 5);
    g.fillRect(22, 15, 7, 5);
    g.fillStyle(0x222222);
    g.fillRect(19, 16, 2, 3);
    g._done(key, 40, 74);
  }

  private _makeBacterium(): void {
    const g = this._g();
    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(20, 50, 28, 8);
    // Body
    g.fillStyle(0x33bb44);
    g.fillEllipse(20, 28, 30, 46);
    // Membrane ring
    g.lineStyle(2, 0x228833);
    g.strokeEllipse(20, 28, 30, 46);
    // Nucleus
    g.fillStyle(0x116622);
    g.fillCircle(20, 26, 8);
    g.fillStyle(0x33dd55, 0.6);
    g.fillCircle(18, 24, 4);
    // Flagellum
    g.lineStyle(2, 0x44cc55);
    this._cubicBezier(g, 20, 50, 28, 58, 12, 66, 20, 74);
    g._done('bacterium', 40, 78);
  }

  private _makeVirus(): void {
    const g = this._g();
    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(20, 48, 26, 8);
    // Spikes (back)
    g.fillStyle(0xcc2222);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const bx = 20 + Math.cos(a) * 14;
      const by = 24 + Math.sin(a) * 14;
      const tip = { x: 20 + Math.cos(a) * 24, y: 24 + Math.sin(a) * 24 };
      g.fillTriangle(bx, by, tip.x, tip.y, bx + Math.cos(a + 1.5) * 5, by + Math.sin(a + 1.5) * 5);
    }
    // Core body
    g.fillStyle(0xee3333);
    g.fillCircle(20, 24, 14);
    g.lineStyle(2, 0xaa1111);
    g.strokeCircle(20, 24, 14);
    // Eyes
    g.fillStyle(0xffee00);
    g.fillCircle(16, 20, 4);
    g.fillCircle(24, 20, 4);
    g.fillStyle(0x111111);
    g.fillCircle(16, 20, 2);
    g.fillCircle(24, 20, 2);
    // Shine
    g.fillStyle(0xffffff, 0.4);
    g.fillCircle(15, 19, 1);
    g.fillCircle(23, 19, 1);
    g._done('virus', 40, 52);
  }

  private _makeDustBunny(): void {
    const g = this._g();
    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(24, 54, 34, 10);
    const fluffs = [
      [24, 28, 16],
      [15, 32, 12],
      [33, 32, 12],
      [20, 22, 10],
      [28, 22, 10],
      [13, 26, 9],
      [35, 26, 9],
      [18, 38, 8],
      [30, 38, 8],
    ];
    g.fillStyle(0xbbbbcc);
    fluffs.forEach(([x, y, r]) => {
      g.fillCircle(x, y, r);
    });
    // Inner lighter fluffs
    g.fillStyle(0xddddee, 0.5);
    fluffs.slice(0, 4).forEach(([x, y, r]) => {
      g.fillCircle(x, y, r * 0.6);
    });
    // Eyes
    g.fillStyle(0x222244);
    g.fillCircle(20, 26, 3);
    g.fillCircle(28, 26, 3);
    g.fillStyle(0xffffff);
    g.fillCircle(21, 25, 1);
    g.fillCircle(29, 25, 1);
    g._done('dustbunny', 48, 60);
  }

  private _makePollen(): void {
    const g = this._g();
    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(22, 50, 28, 8);
    // Outer bumps
    g.fillStyle(0xdd9900);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      g.fillCircle(22 + Math.cos(a) * 13, 26 + Math.sin(a) * 13, 5);
    }
    // Core
    g.fillStyle(0xffcc00);
    g.fillCircle(22, 26, 12);
    g.fillStyle(0xffee66, 0.5);
    g.fillCircle(19, 23, 6);
    g._done('pollen', 44, 56);
  }

  private _makeBossBacterium(): void {
    const g = this._g();
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(48, 104, 72, 16);
    // Body
    g.fillStyle(0x228833);
    g.fillEllipse(48, 56, 80, 100);
    // Membrane
    g.lineStyle(3, 0x116622);
    g.strokeEllipse(48, 56, 80, 100);
    // Multiple nuclei
    g.fillStyle(0x115522);
    g.fillCircle(40, 48, 16);
    g.fillCircle(58, 62, 12);
    g.fillCircle(44, 70, 10);
    g.fillStyle(0x33ee66, 0.4);
    g.fillCircle(38, 46, 8);
    g.fillCircle(56, 60, 6);
    // Flagella
    g.lineStyle(3, 0x44cc55);
    for (let i = 0; i < 3; i++) {
      const sx = 30 + i * 18;
      const sy = 104;
      this._cubicBezier(g, sx, sy, sx + 12, 118, sx - 8, 132, sx + 6, 144);
    }
    g._done('boss_bacterium', 96, 148);
  }

  private _makeAtoms(): void {
    // Hydrogen (H)
    {
      const g = this._g();
      g.fillStyle(0x2255dd, 0.15);
      g.fillCircle(20, 20, 20);
      g.lineStyle(1.5, 0x88aaff, 0.7);
      g.strokeEllipse(20, 20, 36, 14);
      g.lineStyle(1.5, 0x88aaff, 0.4);
      g.strokeEllipse(20, 20, 14, 36);
      // Electron dot
      g.fillStyle(0xaaccff);
      g.fillCircle(38, 20, 3);
      // Nucleus
      g.fillStyle(0x3366ee);
      g.fillCircle(20, 20, 9);
      g.fillStyle(0x88aaff);
      g.fillCircle(18, 18, 4);
      g.fillStyle(0xffffff, 0.6);
      g.fillCircle(17, 17, 2);
      g._done('atom_hydrogen', 40, 40);
    }
    // Oxygen (O)
    {
      const g = this._g();
      g.fillStyle(0xcc2222, 0.15);
      g.fillCircle(20, 20, 20);
      g.lineStyle(1.5, 0xff8888, 0.7);
      g.strokeEllipse(20, 20, 36, 14);
      g.lineStyle(1.5, 0xff8888, 0.5);
      g.strokeEllipse(20, 20, 14, 36);
      g.lineStyle(1.5, 0xff8888, 0.3);
      g.strokeEllipse(20, 20, 36, 28);
      g.fillStyle(0xff8888);
      g.fillCircle(38, 20, 3);
      g.fillCircle(20, 2, 3);
      g.fillStyle(0xdd2222);
      g.fillCircle(20, 20, 9);
      g.fillStyle(0xff6666);
      g.fillCircle(18, 18, 4);
      g.fillStyle(0xffffff, 0.6);
      g.fillCircle(17, 17, 2);
      g._done('atom_oxygen', 40, 40);
    }
    // Mystery (?)
    {
      const g = this._g();
      g.fillStyle(0x8822dd, 0.2);
      g.fillCircle(20, 20, 20);
      g.lineStyle(1.5, 0xcc88ff, 0.7);
      g.strokeEllipse(20, 20, 36, 14);
      g.lineStyle(1.5, 0xcc88ff, 0.5);
      g.strokeEllipse(20, 20, 14, 36);
      g.fillStyle(0xcc88ff);
      g.fillCircle(38, 20, 3);
      g.fillCircle(2, 20, 3);
      g.fillStyle(0x9933cc);
      g.fillCircle(20, 20, 9);
      g.fillStyle(0xdd99ff);
      g.fillCircle(18, 18, 4);
      g.fillStyle(0xffffff, 0.6);
      g.fillCircle(17, 17, 2);
      g._done('atom_mystery', 40, 40);
    }
  }

  private _makeEffects(): void {
    // Hit flash star
    {
      const g = this._g();
      g.lineStyle(3, 0xffff44);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const r = i % 2 === 0 ? 18 : 9;
        g.beginPath();
        g.moveTo(20, 20);
        g.lineTo(20 + Math.cos(a) * r, 20 + Math.sin(a) * r);
        g.strokePath();
      }
      g._done('fx_hit', 40, 40);
    }
    // Projectile (circle)
    {
      const g = this._g();
      g.fillStyle(0xffffff, 0.9);
      g.fillCircle(8, 8, 8);
      g.fillStyle(0xffffff);
      g.fillCircle(8, 8, 4);
      g._done('projectile', 16, 16);
    }
  }

  private _makeParticle(): void {
    const g = this._g();
    g.fillStyle(0xffffff);
    g.fillRect(0, 0, 6, 6);
    g._done('particle', 6, 6);
  }

  private _makeBackground(): void {
    // Ground tile — agar plate / lab bench aesthetic
    {
      const g = this._g();
      g.fillStyle(0xb8956a);
      g.fillRect(0, 0, 64, 64);
      g.lineStyle(1, 0x9a7a52, 0.4);
      g.strokeRect(0, 0, 64, 64);
      g.fillStyle(0xd4ae88, 0.4);
      g.fillRect(4, 4, 20, 20);
      g.fillRect(40, 38, 18, 18);
      g.fillStyle(0xa07850, 0.3);
      g.fillCircle(48, 16, 10);
      g.fillCircle(16, 48, 8);
      g._done('ground_tile', 64, 64);
    }
    // Sky/wall — deep biological purple
    {
      const g = this._g();
      g.fillStyle(0x1a0a2e);
      g.fillRect(0, 0, 64, 64);
      g.fillStyle(0x2a1545, 0.5);
      g.fillRect(8, 8, 20, 20);
      g.fillRect(40, 36, 16, 20);
      g.fillStyle(0x3d2260, 0.2);
      g.fillCircle(32, 32, 20);
      g._done('bg_tile', 64, 64);
    }
  }
}
