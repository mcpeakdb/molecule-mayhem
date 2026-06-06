import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create(): void {
    this._makePlayer();
    this._makeMeg();
    this._makeBacterium();
    this._makeVirus();
    this._makeDustBunny();
    this._makePollen();
    this._makeAmoeba();
    this._makeSpore();
    this._makeMite();
    this._makeBossBacterium();
    this._makeBossAmoeba();
    this._makeBossPhage();
    this._makeAtoms();
    this._makeEffects();
    this._makeParticle();
    this._makeBackground();
    this._makeVignette();
    this.scene.start('TitleScene');
  }

  // M.E.G. — Main Element Guide: a friendly glowing atom-bot that narrates the tutorial
  private _makeMeg(): void {
    const g = this._g();
    g.fillStyle(0x66ddff, 0.18);
    g.fillCircle(24, 27, 23);
    g.fillStyle(0x2299dd);
    g.fillCircle(24, 27, 16);
    g.fillStyle(0x44bbf0);
    g.fillCircle(24, 25, 13);
    // orbital ring + electron
    g.lineStyle(2, 0xaaf0ff, 0.85);
    g.strokeEllipse(24, 27, 42, 16);
    g.fillStyle(0xffffff);
    g.fillCircle(45, 27, 3);
    // antenna
    g.lineStyle(2, 0xaaf0ff, 0.9);
    g.lineBetween(24, 12, 24, 4);
    g.fillStyle(0xffee66);
    g.fillCircle(24, 4, 3.5);
    // big friendly eyes
    g.fillStyle(0xffffff);
    g.fillCircle(19, 25, 5);
    g.fillCircle(29, 25, 5);
    g.fillStyle(0x113355);
    g.fillCircle(20, 26, 2.6);
    g.fillCircle(30, 26, 2.6);
    // smile
    g.lineStyle(2, 0x113355, 0.9);
    g.beginPath();
    g.arc(24, 31, 5, 0.15 * Math.PI, 0.85 * Math.PI);
    g.strokePath();
    g._done('meg', 50, 54);
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
    // Jump pose — both legs tucked up
    this._makePlayerFrame('player_jump', 40, 40);

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
    this.anims.create({
      key: 'player_jump',
      frames: [{ key: 'player_jump' }],
      frameRate: 1,
      repeat: -1,
    });
  }

  private _makePlayerFrame(key: string, leftLegY: number, rightLegY: number): void {
    const g = this._g();

    // Shadow
    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(20, 66, 26, 7);

    // Legs — dark clinical trousers
    g.fillStyle(0x2e3044);
    g.fillRect(11, leftLegY, 8, 14);
    g.fillRect(21, rightLegY, 8, 14);

    // Shoes — pale, slightly wider than legs
    g.fillStyle(0xdde0ec);
    g.fillRect(10, leftLegY + 11, 9, 4);
    g.fillRect(20, rightLegY + 11, 9, 4);

    // Lab coat — clinical white
    g.fillStyle(0xf0f0f5);
    g.fillRect(9, 26, 22, 26);

    // Lapel folds along coat edges (white, brighter than coat body)
    g.fillStyle(0xffffff);
    g.fillTriangle(9, 26, 14, 26, 9, 36);
    g.fillTriangle(31, 26, 26, 26, 31, 36);

    // Collar V — skin visible between lapels
    g.fillStyle(0xecd5aa);
    g.fillTriangle(14, 26, 20, 33, 26, 26);

    // Coat buttons along center seam
    g.fillStyle(0xc8c8d8, 0.65);
    g.fillCircle(20, 39, 1.5);
    g.fillCircle(20, 45, 1.5);

    // Breast pocket
    g.fillStyle(0xe2e2ec);
    g.fillRect(11, 33, 6, 5);
    g.lineStyle(1, 0xb8b8cc, 0.5);
    g.strokeRect(11, 33, 6, 5);

    // Pen clipped to pocket — top sticking up above pocket line
    g.fillStyle(0x4488cc);
    g.fillRect(13, 29, 2, 7);
    g.fillStyle(0xeef4ff, 0.7);
    g.fillRect(13, 29, 2, 2);

    // Face
    g.fillStyle(0xecd5aa);
    g.fillCircle(20, 16, 10);

    // Hair — dark, neat
    g.fillStyle(0x3a2810);
    g.fillRect(11, 6, 18, 8);
    g.fillCircle(11, 10, 4.5);
    g.fillCircle(29, 10, 4.5);

    // Goggle outer frame — covering eye area
    g.fillStyle(0x333344);
    g.fillRect(10, 13, 20, 9);

    // Goggle lenses — pale teal glass (neutral so element tinting reads clearly)
    g.fillStyle(0xb8dde8, 0.88);
    g.fillRect(11, 14, 8, 6);
    g.fillRect(21, 14, 8, 6);

    // Goggle bridge
    g.fillStyle(0x3a3a50);
    g.fillRect(18, 15, 4, 4);

    // Lens speculars
    g.fillStyle(0xffffff, 0.55);
    g.fillRect(12, 14, 2, 2);
    g.fillRect(22, 14, 2, 2);

    // Side straps
    g.fillStyle(0x2a2a40);
    g.fillRect(8, 15, 3, 3);
    g.fillRect(29, 15, 3, 3);

    g._done(key, 40, 74);
  }

  private _makeBacterium(): void {
    const g = this._g();
    // Shadow
    g.fillStyle(0x000000, 0.18);
    g.fillEllipse(20, 54, 26, 7);
    // Outer capsule halo
    g.fillStyle(0x9966cc, 0.12);
    g.fillEllipse(20, 28, 34, 50);
    // Cell body — deep Gram-stain violet, layered for translucency
    g.fillStyle(0x5533aa, 0.88);
    g.fillEllipse(20, 28, 30, 46);
    // Lighter upper cytoplasm zone
    g.fillStyle(0x7755bb, 0.32);
    g.fillEllipse(20, 22, 20, 26);
    // Cell membrane ring
    g.lineStyle(1.5, 0xaa88ee, 0.75);
    g.strokeEllipse(20, 28, 30, 46);
    // Nucleoid region — dense dark oval
    g.fillStyle(0x221144, 0.92);
    g.fillEllipse(20, 30, 14, 18);
    // Nucleoid inner lighter zone
    g.fillStyle(0x4422aa, 0.42);
    g.fillEllipse(18, 28, 7, 9);
    // Ribosomes — scattered granules
    g.fillStyle(0x9977cc, 0.48);
    g.fillCircle(14, 20, 2);
    g.fillCircle(26, 36, 1.5);
    g.fillCircle(13, 34, 1.5);
    g.fillCircle(27, 20, 1.5);
    // Specular highlight — wet glass
    g.fillStyle(0xffffff, 0.22);
    g.fillEllipse(15, 16, 10, 5);
    // Flagella — thin and wispy, two poles
    g.lineStyle(1.5, 0x9966cc, 0.65);
    this._cubicBezier(g, 20, 50, 30, 62, 12, 70, 22, 80);
    g.lineStyle(1, 0x9966cc, 0.35);
    this._cubicBezier(g, 18, 50, 8, 60, 28, 68, 16, 80);
    g._done('bacterium', 40, 82);
  }

  private _makeVirus(): void {
    const g = this._g();
    // Spikes — 12, thin and sharp, fluorescent teal
    g.fillStyle(0x00ddcc);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const tipX = 22 + Math.cos(a) * 22;
      const tipY = 26 + Math.sin(a) * 22;
      const b1x = 22 + Math.cos(a - 0.22) * 11;
      const b1y = 26 + Math.sin(a - 0.22) * 11;
      const b2x = 22 + Math.cos(a + 0.22) * 11;
      const b2y = 26 + Math.sin(a + 0.22) * 11;
      g.fillTriangle(b1x, b1y, tipX, tipY, b2x, b2y);
    }
    // Outer glow ring
    g.fillStyle(0x00ccbb, 0.18);
    g.fillCircle(22, 26, 14);
    // Outer shell
    g.fillStyle(0x009988);
    g.fillCircle(22, 26, 12);
    // Inner translucent body
    g.fillStyle(0x00ccbb, 0.72);
    g.fillCircle(22, 26, 10);
    // Surface protein coat — dots between spikes
    g.fillStyle(0x00ffee, 0.55);
    for (let i = 0; i < 12; i++) {
      const a = ((i + 0.5) / 12) * Math.PI * 2;
      g.fillCircle(22 + Math.cos(a) * 14, 26 + Math.sin(a) * 14, 1.5);
    }
    // Dark inner core
    g.fillStyle(0x004433, 0.85);
    g.fillCircle(22, 26, 5);
    // Specular highlight
    g.fillStyle(0xffffff, 0.6);
    g.fillCircle(18, 22, 2.5);
    g.fillStyle(0xffffff, 0.25);
    g.fillCircle(17, 21, 1);
    g._done('virus', 44, 54);
  }

  private _makeDustBunny(): void {
    const g = this._g();
    // Shadow
    g.fillStyle(0x000000, 0.14);
    g.fillEllipse(24, 57, 34, 8);
    // Outer translucent aggregate halo
    g.fillStyle(0x99aab8, 0.18);
    g.fillEllipse(24, 30, 42, 36);
    // Main aggregate body — irregular overlapping blobs (cellular debris)
    const blobs: [number, number, number][] = [
      [24, 30, 15],
      [15, 33, 11],
      [33, 33, 11],
      [20, 23, 9],
      [28, 23, 9],
      [12, 28, 8],
      [36, 28, 8],
      [19, 40, 7],
      [29, 40, 7],
    ];
    g.fillStyle(0x8899a8, 0.72);
    blobs.forEach(([x, y, r]) => {
      g.fillCircle(x, y, r);
    });
    // Secondary lighter layer
    g.fillStyle(0xaabbcc, 0.28);
    blobs.slice(0, 5).forEach(([x, y, r]) => {
      g.fillCircle(x, y, r * 0.65);
    });
    // Membrane-like boundary
    g.lineStyle(1, 0xbbc9d8, 0.28);
    g.strokeEllipse(24, 30, 38, 34);
    // Trapped organelle blobs — denser spots, not cute eyes
    g.fillStyle(0x556677, 0.82);
    g.fillCircle(19, 29, 4);
    g.fillCircle(29, 29, 4);
    g.fillStyle(0x7788aa, 0.38);
    g.fillCircle(19, 29, 2);
    g.fillCircle(29, 29, 2);
    // Upper wet-glass highlight
    g.fillStyle(0xffffff, 0.16);
    g.fillEllipse(20, 21, 14, 6);
    g._done('dustbunny', 48, 62);
  }

  private _makePollen(): void {
    const g = this._g();
    // Outer exine wall
    g.fillStyle(0xbb8822);
    g.fillCircle(22, 26, 16);
    // Main body — autofluorescence amber
    g.fillStyle(0xddaa44);
    g.fillCircle(22, 26, 14);
    // Inner glow — brighter core
    g.fillStyle(0xffcc55, 0.65);
    g.fillCircle(22, 26, 9);
    // Apertures — surface pits (inverted bumps, darker)
    g.fillStyle(0x774400, 0.75);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      g.fillCircle(22 + Math.cos(a) * 11, 26 + Math.sin(a) * 11, 2.5);
    }
    // Exine texture — fine radial lines toward apertures
    g.lineStyle(0.8, 0x997722, 0.38);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      g.lineBetween(22, 26, 22 + Math.cos(a) * 10, 26 + Math.sin(a) * 10);
    }
    // Specular highlight
    g.fillStyle(0xffffff, 0.42);
    g.fillEllipse(17, 21, 8, 5);
    g._done('pollen', 44, 58);
  }

  // Amoeba — a big, slow gelatinous blob with pseudopod lobes and a dark nucleus
  private _makeAmoeba(): void {
    const g = this._g();
    // Shadow
    g.fillStyle(0x000000, 0.16);
    g.fillEllipse(28, 56, 42, 9);
    // Outer translucent halo
    g.fillStyle(0x55cc88, 0.14);
    g.fillEllipse(28, 30, 52, 46);
    // Pseudopod lobes — irregular bulges around a core
    const lobes: [number, number, number][] = [
      [28, 30, 20],
      [13, 26, 11],
      [44, 28, 12],
      [20, 44, 10],
      [38, 44, 9],
      [30, 13, 10],
    ];
    g.fillStyle(0x3fae6e, 0.8);
    lobes.forEach(([x, y, r]) => {
      g.fillCircle(x, y, r);
    });
    // Lighter cytoplasm sheen
    g.fillStyle(0x7fe0a8, 0.3);
    g.fillEllipse(24, 24, 26, 22);
    // Membrane outline
    g.lineStyle(1.5, 0x9ff0c0, 0.5);
    g.strokeCircle(28, 30, 20);
    // Vacuoles — small bubbles
    g.fillStyle(0xbff5d5, 0.4);
    g.fillCircle(18, 34, 3.5);
    g.fillCircle(37, 22, 2.5);
    g.fillCircle(34, 38, 2);
    // Nucleus — dense dark core
    g.fillStyle(0x14502f, 0.92);
    g.fillCircle(28, 31, 8);
    g.fillStyle(0x2f8a55, 0.5);
    g.fillCircle(26, 29, 4);
    // Specular highlight
    g.fillStyle(0xffffff, 0.22);
    g.fillEllipse(20, 18, 11, 5);
    g._done('amoeba', 56, 64);
  }

  // Spore — small fast capsule with a spiky coat and a bright core
  private _makeSpore(): void {
    const g = this._g();
    // Spiky coat — short barbs all around
    g.fillStyle(0xcc66dd);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const tipX = 18 + Math.cos(a) * 17;
      const tipY = 18 + Math.sin(a) * 17;
      const b1x = 18 + Math.cos(a - 0.25) * 9;
      const b1y = 18 + Math.sin(a - 0.25) * 9;
      const b2x = 18 + Math.cos(a + 0.25) * 9;
      const b2y = 18 + Math.sin(a + 0.25) * 9;
      g.fillTriangle(b1x, b1y, tipX, tipY, b2x, b2y);
    }
    // Outer glow
    g.fillStyle(0xdd88ee, 0.2);
    g.fillCircle(18, 18, 11);
    // Shell
    g.fillStyle(0x9933bb);
    g.fillCircle(18, 18, 9);
    // Inner translucent body
    g.fillStyle(0xcc66dd, 0.7);
    g.fillCircle(18, 18, 7);
    // Bright core
    g.fillStyle(0xffccff, 0.85);
    g.fillCircle(18, 18, 3.5);
    // Specular
    g.fillStyle(0xffffff, 0.6);
    g.fillCircle(15, 15, 1.8);
    g._done('spore', 36, 36);
  }

  // Mite — a squat armored crawler with legs and beady eyes
  private _makeMite(): void {
    const g = this._g();
    // Shadow
    g.fillStyle(0x000000, 0.18);
    g.fillEllipse(22, 40, 28, 7);
    // Legs — four per side, dark chitin
    g.lineStyle(2, 0x6b4a2a, 0.9);
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        const hx = 22 + side * 8;
        const hy = 22 + i * 6 - 4;
        g.lineBetween(hx, hy, hx + side * 12, hy + 5);
      }
    }
    // Body — rounded carapace
    g.fillStyle(0x8a5a2c);
    g.fillEllipse(22, 22, 30, 26);
    // Carapace sheen
    g.fillStyle(0xb37d44, 0.55);
    g.fillEllipse(20, 18, 18, 13);
    // Segmentation ridges
    g.lineStyle(1, 0x5f3d1c, 0.6);
    g.strokeEllipse(22, 22, 30, 26);
    g.lineBetween(10, 22, 34, 22);
    // Beady eyes
    g.fillStyle(0x1a0e04);
    g.fillCircle(17, 17, 2.4);
    g.fillCircle(27, 17, 2.4);
    g.fillStyle(0xffffff, 0.7);
    g.fillCircle(16, 16, 0.9);
    g.fillCircle(26, 16, 0.9);
    g._done('mite', 48, 46);
  }

  private _makeBossBacterium(): void {
    const g = this._g();
    // Shadow
    g.fillStyle(0x000000, 0.22);
    g.fillEllipse(48, 110, 80, 18);
    // Outer capsule halo
    g.fillStyle(0x553388, 0.18);
    g.fillEllipse(48, 56, 92, 114);
    // Cell body — dark pathogenic purple
    g.fillStyle(0x3a2266, 0.93);
    g.fillEllipse(48, 56, 80, 100);
    // Lighter inner cytoplasm zone
    g.fillStyle(0x6644aa, 0.28);
    g.fillEllipse(48, 44, 54, 62);
    // Outer capsule ring
    g.lineStyle(2.5, 0x9966cc, 0.42);
    g.strokeEllipse(48, 56, 86, 106);
    // Cell membrane
    g.lineStyle(1.5, 0xaa88ee, 0.72);
    g.strokeEllipse(48, 56, 80, 100);
    // Nucleoid regions — three dense, irregular ovals
    g.fillStyle(0x180d33, 0.92);
    g.fillEllipse(40, 46, 22, 28);
    g.fillEllipse(58, 62, 16, 20);
    g.fillEllipse(42, 74, 14, 18);
    // Nucleoid inner lighter hints
    g.fillStyle(0x5533aa, 0.38);
    g.fillCircle(38, 44, 7);
    g.fillCircle(57, 60, 5);
    // Scattered ribosomes / granules
    g.fillStyle(0x9977cc, 0.42);
    g.fillCircle(62, 42, 3);
    g.fillCircle(30, 36, 2.5);
    g.fillCircle(66, 72, 2.5);
    g.fillCircle(28, 68, 2);
    g.fillCircle(58, 84, 2);
    // Specular highlight — large, diffuse
    g.fillStyle(0xffffff, 0.18);
    g.fillEllipse(36, 30, 28, 12);
    // Flagella — 5 total, varying thickness
    g.lineStyle(2.5, 0x9966cc, 0.6);
    this._cubicBezier(g, 36, 106, 18, 126, 50, 140, 28, 156);
    this._cubicBezier(g, 48, 108, 62, 126, 38, 138, 52, 154);
    this._cubicBezier(g, 60, 106, 78, 122, 52, 136, 68, 154);
    g.lineStyle(1.5, 0x9966cc, 0.35);
    this._cubicBezier(g, 42, 108, 22, 120, 56, 130, 38, 152);
    this._cubicBezier(g, 54, 108, 74, 118, 46, 132, 62, 150);
    g._done('boss_bacterium', 96, 160);
  }

  // Sector 2 finale — Amoeba Titan: a colossal sloshing blob with many nuclei and oozing tendrils
  private _makeBossAmoeba(): void {
    const g = this._g();
    // Shadow
    g.fillStyle(0x000000, 0.22);
    g.fillEllipse(48, 118, 86, 18);
    // Outer translucent halo
    g.fillStyle(0x3fae6e, 0.16);
    g.fillCircle(48, 58, 50);
    // Pseudopod lobes — many overlapping bulges
    const lobes: [number, number, number][] = [
      [48, 58, 40],
      [18, 50, 20],
      [78, 54, 22],
      [30, 86, 18],
      [66, 86, 17],
      [50, 22, 20],
      [22, 26, 13],
      [74, 28, 13],
    ];
    g.fillStyle(0x2f9a5e, 0.85);
    lobes.forEach(([x, y, r]) => {
      g.fillCircle(x, y, r);
    });
    // Lighter cytoplasm sheen
    g.fillStyle(0x7fe0a8, 0.28);
    g.fillEllipse(40, 44, 50, 42);
    // Membrane outline
    g.lineStyle(2.5, 0x9ff0c0, 0.45);
    g.strokeCircle(48, 58, 40);
    // Vacuole bubbles
    g.fillStyle(0xbff5d5, 0.4);
    g.fillCircle(30, 66, 6);
    g.fillCircle(68, 44, 4.5);
    g.fillCircle(58, 78, 3.5);
    // Multiple dark nuclei
    const nuclei: [number, number, number][] = [
      [44, 56, 13],
      [66, 64, 8],
      [32, 40, 7],
    ];
    nuclei.forEach(([x, y, r]) => {
      g.fillStyle(0x12482a, 0.92);
      g.fillCircle(x, y, r);
      g.fillStyle(0x2f8a55, 0.5);
      g.fillCircle(x - r * 0.3, y - r * 0.3, r * 0.45);
    });
    // Specular highlight
    g.fillStyle(0xffffff, 0.2);
    g.fillEllipse(32, 30, 22, 9);
    // Oozing tendrils dripping below
    g.lineStyle(3, 0x2f9a5e, 0.6);
    this._cubicBezier(g, 34, 96, 24, 116, 40, 132, 30, 150);
    this._cubicBezier(g, 50, 100, 58, 120, 44, 134, 52, 152);
    this._cubicBezier(g, 64, 96, 74, 114, 58, 130, 68, 148);
    g._done('boss_amoeba', 96, 160);
  }

  // Sector 3 finale — Phage Lord: a bacteriophage with an icosahedral head, tail sheath, and leg fibers
  private _makeBossPhage(): void {
    const g = this._g();
    const cx = 48;
    // Shadow
    g.fillStyle(0x000000, 0.22);
    g.fillEllipse(cx, 150, 70, 14);
    // Tail fibers splaying onto the ground
    g.lineStyle(2.5, 0x88aacc, 0.7);
    for (const off of [-22, -11, 0, 11, 22]) {
      g.lineBetween(cx, 112, cx + off, 132);
      g.lineBetween(cx + off, 132, cx + off * 1.4, 146);
    }
    // Tail sheath — segmented column
    g.fillStyle(0x3a4a66);
    g.fillRect(cx - 9, 60, 18, 54);
    g.lineStyle(1.5, 0x223047, 0.8);
    for (let yy = 66; yy < 114; yy += 9) g.lineBetween(cx - 9, yy, cx + 9, yy);
    // Inner tail core (DNA tube)
    g.fillStyle(0x6fd0e0, 0.5);
    g.fillRect(cx - 3, 60, 6, 54);
    // Baseplate
    g.fillStyle(0x2a3850);
    g.fillRect(cx - 16, 110, 32, 8);
    g.fillStyle(0x4a5e80);
    g.fillRect(cx - 16, 110, 32, 3);
    // Collar
    g.fillStyle(0x4a5e80);
    g.fillRect(cx - 13, 54, 26, 8);
    // Icosahedral head — hexagon outline with facet shading
    const R = 34;
    const hx: number[] = [];
    const hy: number[] = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
      hx.push(cx + Math.cos(a) * R);
      hy.push(34 + Math.sin(a) * R);
    }
    // Halo
    g.fillStyle(0x6fd0e0, 0.16);
    g.fillCircle(cx, 34, R + 6);
    // Head fill
    g.fillStyle(0x2d6e7a);
    g.beginPath();
    g.moveTo(hx[0], hy[0]);
    for (let i = 1; i < 6; i++) g.lineTo(hx[i], hy[i]);
    g.closePath();
    g.fillPath();
    // Facets — triangles from center to each edge, alternating shade
    for (let i = 0; i < 6; i++) {
      const j = (i + 1) % 6;
      g.fillStyle(i % 2 === 0 ? 0x3d8b98 : 0x255b66, 0.9);
      g.fillTriangle(cx, 34, hx[i], hy[i], hx[j], hy[j]);
    }
    // Capsid edge
    g.lineStyle(2.5, 0x8fe6f4, 0.7);
    g.beginPath();
    g.moveTo(hx[0], hy[0]);
    for (let i = 1; i < 6; i++) g.lineTo(hx[i], hy[i]);
    g.closePath();
    g.strokePath();
    // Glowing DNA core inside head
    g.fillStyle(0xaff0ff, 0.35);
    g.fillCircle(cx, 32, 12);
    g.fillStyle(0xe6ffff, 0.7);
    g.fillCircle(cx - 4, 28, 4);
    // Menacing red eye-glints on the head
    g.fillStyle(0xff3344, 0.9);
    g.fillCircle(cx - 10, 38, 3);
    g.fillCircle(cx + 10, 38, 3);
    g.fillStyle(0xffaaaa, 0.8);
    g.fillCircle(cx - 11, 37, 1);
    g.fillCircle(cx + 9, 37, 1);
    g._done('boss_phage', 96, 160);
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
    // Choice node (every atom is a fork in the molecular tree)
    {
      const g = this._g();
      g.fillStyle(0x6633cc, 0.22);
      g.fillCircle(20, 20, 20);
      // crossed orbital rings
      g.lineStyle(1.5, 0x66ddff, 0.7);
      g.strokeEllipse(20, 20, 36, 14);
      g.lineStyle(1.5, 0xcc88ff, 0.7);
      g.strokeEllipse(20, 20, 14, 36);
      // electron dots on each ring
      g.fillStyle(0x99eeff);
      g.fillCircle(38, 20, 3);
      g.fillStyle(0xddaaff);
      g.fillCircle(20, 38, 3);
      // bright unresolved nucleus
      g.fillStyle(0x3344aa);
      g.fillCircle(20, 20, 9);
      g.fillStyle(0x88bbff);
      g.fillCircle(18, 18, 4);
      g.fillStyle(0xffffff, 0.7);
      g.fillCircle(17, 17, 2);
      g._done('atom_node', 40, 40);
    }
    // Gold wildcard node (Phase 7) — a rare shimmering golden atom
    {
      const g = this._g();
      g.fillStyle(0xffd700, 0.28);
      g.fillCircle(20, 20, 20);
      g.fillStyle(0xffcc33, 0.18);
      g.fillCircle(20, 20, 15);
      // golden orbital rings
      g.lineStyle(1.5, 0xffe680, 0.85);
      g.strokeEllipse(20, 20, 36, 14);
      g.lineStyle(1.5, 0xffd700, 0.85);
      g.strokeEllipse(20, 20, 14, 36);
      // bright electron dots
      g.fillStyle(0xfff4b0);
      g.fillCircle(38, 20, 3);
      g.fillCircle(2, 20, 3);
      g.fillCircle(20, 38, 3);
      g.fillCircle(20, 2, 3);
      // molten gold nucleus
      g.fillStyle(0xe6a800);
      g.fillCircle(20, 20, 9);
      g.fillStyle(0xffd700);
      g.fillCircle(18, 18, 5);
      g.fillStyle(0xffffff, 0.85);
      g.fillCircle(17, 17, 2.5);
      g._done('atom_gold', 40, 40);
    }
    // Carbon (C)
    {
      const g = this._g();
      g.fillStyle(0x333333, 0.2);
      g.fillCircle(20, 20, 20);
      g.lineStyle(1.5, 0x888888, 0.6);
      g.strokeEllipse(20, 20, 36, 14);
      g.lineStyle(1.5, 0x888888, 0.4);
      g.strokeEllipse(20, 20, 14, 36);
      g.fillStyle(0xaaaaaa);
      g.fillCircle(38, 20, 3);
      g.fillStyle(0x555555);
      g.fillCircle(20, 20, 9);
      g.fillStyle(0x999999);
      g.fillCircle(18, 18, 4);
      g.fillStyle(0xffffff, 0.6);
      g.fillCircle(17, 17, 2);
      g._done('atom_carbon', 40, 40);
    }
    // Nitrogen (N)
    {
      const g = this._g();
      g.fillStyle(0x44ddcc, 0.15);
      g.fillCircle(20, 20, 20);
      g.lineStyle(1.5, 0x66eedd, 0.7);
      g.strokeEllipse(20, 20, 36, 14);
      g.lineStyle(1.5, 0x66eedd, 0.5);
      g.strokeEllipse(20, 20, 14, 36);
      g.lineStyle(1.5, 0x66eedd, 0.3);
      g.strokeEllipse(20, 20, 32, 32);
      g.fillStyle(0x77eedd);
      g.fillCircle(38, 20, 3);
      g.fillCircle(2, 20, 3);
      g.fillStyle(0x33bbaa);
      g.fillCircle(20, 20, 9);
      g.fillStyle(0x77eedd);
      g.fillCircle(18, 18, 4);
      g.fillStyle(0xffffff, 0.6);
      g.fillCircle(17, 17, 2);
      g._done('atom_nitrogen', 40, 40);
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

  // Radial vignette overlay — a screen-fixed darkening of the edges for depth/mood.
  private _makeVignette(): void {
    const w = 960;
    const h = 540;
    const tex = this.textures.createCanvas('vignette', w, h);
    if (!tex) return;
    const ctx = tex.getContext();
    const grad = ctx.createRadialGradient(w / 2, h / 2, h * 0.42, w / 2, h / 2, h * 0.95);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    tex.refresh();
  }

  private _makeBackground(): void {
    // === Sector 1 — nutrient agar (muted olive-green) ===
    {
      const g = this._g();
      g.fillStyle(0x7a9050);
      g.fillRect(0, 0, 64, 64);
      // Wet-glass sheen — lighter bands fading down from the surface
      g.fillStyle(0xaabb68, 0.22);
      g.fillRect(0, 0, 64, 14);
      g.fillStyle(0xbbcc78, 0.12);
      g.fillRect(0, 0, 64, 5);
      // Grid (dish markings visible through agar)
      g.lineStyle(1, 0x587038, 0.4);
      g.lineBetween(0, 32, 64, 32);
      g.lineBetween(32, 0, 32, 64);
      // Surface texture — irregular agar patches
      g.fillStyle(0x8a9e58, 0.28);
      g.fillCircle(16, 44, 9);
      g.fillCircle(50, 22, 7);
      g.fillStyle(0x506030, 0.2);
      g.fillCircle(44, 54, 6);
      g._done('ground_tile_1', 64, 64);
    }
    {
      const g = this._g();
      g.fillStyle(0x060c05);
      g.fillRect(0, 0, 64, 64);
      // Grid lines — barely visible in dark medium
      g.lineStyle(1, 0x0c1808, 1.0);
      g.lineBetween(0, 32, 64, 32);
      g.lineBetween(32, 0, 32, 64);
      // Cell debris — faint membrane rings
      g.lineStyle(1, 0x142010, 0.55);
      g.strokeCircle(20, 18, 8);
      g.lineStyle(0.8, 0x0e1a0c, 0.4);
      g.strokeCircle(48, 46, 5);
      g.lineStyle(0.8, 0x142010, 0.35);
      g.strokeCircle(36, 10, 3);
      // Granular spots
      g.fillStyle(0x0c1a0a, 0.5);
      g.fillCircle(10, 42, 2.5);
      g.fillCircle(54, 28, 1.5);
      g.fillCircle(30, 56, 2);
      g._done('bg_tile_1', 64, 64);
    }
    // === Sector 2 — blood agar (muted terracotta) ===
    {
      const g = this._g();
      g.fillStyle(0x986858);
      g.fillRect(0, 0, 64, 64);
      // Wet-glass sheen
      g.fillStyle(0xbb8870, 0.22);
      g.fillRect(0, 0, 64, 14);
      g.fillStyle(0xcc9980, 0.12);
      g.fillRect(0, 0, 64, 5);
      // Grid
      g.lineStyle(1, 0x785040, 0.4);
      g.lineBetween(0, 32, 64, 32);
      g.lineBetween(32, 0, 32, 64);
      // Surface texture
      g.fillStyle(0xaa7868, 0.28);
      g.fillCircle(16, 44, 9);
      g.fillCircle(50, 22, 7);
      g.fillStyle(0x663838, 0.2);
      g.fillCircle(44, 54, 6);
      g._done('ground_tile_2', 64, 64);
    }
    {
      const g = this._g();
      g.fillStyle(0x0c0505);
      g.fillRect(0, 0, 64, 64);
      g.lineStyle(1, 0x160808, 1.0);
      g.lineBetween(0, 32, 64, 32);
      g.lineBetween(32, 0, 32, 64);
      g.lineStyle(1, 0x1e0c0a, 0.55);
      g.strokeCircle(20, 18, 8);
      g.lineStyle(0.8, 0x180a0a, 0.4);
      g.strokeCircle(48, 46, 5);
      g.lineStyle(0.8, 0x1e0c0a, 0.35);
      g.strokeCircle(36, 10, 3);
      g.fillStyle(0x180808, 0.5);
      g.fillCircle(10, 42, 2.5);
      g.fillCircle(54, 28, 1.5);
      g.fillCircle(30, 56, 2);
      g._done('bg_tile_2', 64, 64);
    }
    // === Sector 3 — deep agar (muted slate-purple) ===
    {
      const g = this._g();
      g.fillStyle(0x585080);
      g.fillRect(0, 0, 64, 64);
      // Wet-glass sheen
      g.fillStyle(0x7870a0, 0.22);
      g.fillRect(0, 0, 64, 14);
      g.fillStyle(0x8880b0, 0.12);
      g.fillRect(0, 0, 64, 5);
      // Grid
      g.lineStyle(1, 0x403860, 0.4);
      g.lineBetween(0, 32, 64, 32);
      g.lineBetween(32, 0, 32, 64);
      // Surface texture
      g.fillStyle(0x686090, 0.28);
      g.fillCircle(16, 44, 9);
      g.fillCircle(50, 22, 7);
      g.fillStyle(0x303050, 0.2);
      g.fillCircle(44, 54, 6);
      g._done('ground_tile_3', 64, 64);
    }
    {
      const g = this._g();
      g.fillStyle(0x05050e);
      g.fillRect(0, 0, 64, 64);
      g.lineStyle(1, 0x0a0a18, 1.0);
      g.lineBetween(0, 32, 64, 32);
      g.lineBetween(32, 0, 32, 64);
      g.lineStyle(1, 0x0e0e22, 0.55);
      g.strokeCircle(20, 18, 8);
      g.lineStyle(0.8, 0x0a0a1e, 0.4);
      g.strokeCircle(48, 46, 5);
      g.lineStyle(0.8, 0x0e0e22, 0.35);
      g.strokeCircle(36, 10, 3);
      g.fillStyle(0x080818, 0.5);
      g.fillCircle(10, 42, 2.5);
      g.fillCircle(54, 28, 1.5);
      g.fillCircle(30, 56, 2);
      g._done('bg_tile_3', 64, 64);
    }
  }
}
