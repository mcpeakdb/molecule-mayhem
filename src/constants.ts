export type Difficulty = 'easy' | 'normal' | 'hard';
export const DIFFICULTY_SCALE: Record<Difficulty, { enemyHp: number; enemySpeed: number; invincMs: number }> = {
  easy: { enemyHp: 0.7, enemySpeed: 0.75, invincMs: 1400 },
  normal: { enemyHp: 1.0, enemySpeed: 1.0, invincMs: 800 },
  hard: { enemyHp: 1.4, enemySpeed: 1.25, invincMs: 500 },
};

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;
export const WORLD_WIDTH = 5500;

// Walkable band — characters move freely within this Y range
export const FLOOR_MIN_Y = 310;
export const FLOOR_MAX_Y = 460;
export const FLOOR_CENTER_Y = 400;

export const ELEMENTS = {
  NONE: 'none',
  HYDROGEN: 'hydrogen',
  OXYGEN: 'oxygen',
  WATER: 'water',
  CARBON: 'carbon',
  NITROGEN: 'nitrogen',
  AMMONIA: 'ammonia',
  CARBON_DIOXIDE: 'carbon_dioxide',
  METHANE: 'methane',
  NITRIC_OXIDE: 'nitric_oxide',
  CARBONIC_ACID: 'carbonic_acid',
} as const;

export type ElementType = (typeof ELEMENTS)[keyof typeof ELEMENTS];

export const ELEMENT_COLORS: Record<ElementType, number> = {
  [ELEMENTS.NONE]: 0x888888,
  [ELEMENTS.HYDROGEN]: 0x4499ff,
  [ELEMENTS.OXYGEN]: 0xff5533,
  [ELEMENTS.WATER]: 0x22ccff,
  [ELEMENTS.CARBON]: 0x888888,
  [ELEMENTS.NITROGEN]: 0x44ddcc,
  [ELEMENTS.AMMONIA]: 0xaadd44,
  [ELEMENTS.CARBON_DIOXIDE]: 0x99bbcc,
  [ELEMENTS.METHANE]: 0xff9922,
  [ELEMENTS.NITRIC_OXIDE]: 0xdd44aa,
  [ELEMENTS.CARBONIC_ACID]: 0x33aadd,
};

export const ELEMENT_NAMES: Record<ElementType, string> = {
  [ELEMENTS.NONE]: 'None',
  [ELEMENTS.HYDROGEN]: 'Hydrogen',
  [ELEMENTS.OXYGEN]: 'Oxygen',
  [ELEMENTS.WATER]: 'Water (H₂O)',
  [ELEMENTS.CARBON]: 'Carbon',
  [ELEMENTS.NITROGEN]: 'Nitrogen',
  [ELEMENTS.AMMONIA]: 'Ammonia (NH₃)',
  [ELEMENTS.CARBON_DIOXIDE]: 'Carbon Dioxide (CO₂)',
  [ELEMENTS.METHANE]: 'Methane (CH₄)',
  [ELEMENTS.NITRIC_OXIDE]: 'Nitric Oxide (NO)',
  [ELEMENTS.CARBONIC_ACID]: 'Carbonic Acid (H₂CO₃)',
};

export const PLAYER_MAX_HP = 100;
export const PLAYER_SPEED = 220;
export const PLAYER_MELEE_RANGE = 85;
export const PLAYER_MELEE_DAMAGE = 12;
export const PLAYER_ATTACK_COOLDOWN = 400; // ms
export const PLAYER_SPECIAL_COOLDOWN = 1200; // ms
export const PLAYER_INVINCIBILITY_MS = 800;

// Jump — manual vertical integration (jumpOffset lifts the sprite visually above its ground Y)
export const PLAYER_JUMP_VELOCITY = 540; // px/s initial upward velocity (peak ≈ 90px)
export const PLAYER_DOUBLE_JUMP_VELOCITY = 470; // px/s for the airborne second jump
export const PLAYER_JUMP_GRAVITY = 1600; // px/s²
export const PLAYER_MAX_JUMPS = 2;

export const MAX_ELEMENT_LEVEL = 3;

// Stage layout
export const BOSS_X = 4600;
export const STAGE_END_X = 5200;

// ── Attack registry (Phase 6: molecular tree + numpad arsenal) ──────────────
// The four collectable base atoms.
export type BaseAtom = 'hydrogen' | 'oxygen' | 'carbon' | 'nitrogen';
export const BASE_ATOMS: BaseAtom[] = ['hydrogen', 'oxygen', 'carbon', 'nitrogen'];

// Every attack maps 1:1 to an element/compound (i.e. every ElementType except NONE).
export type AttackId = Exclude<ElementType, typeof ELEMENTS.NONE>;

export interface AttackDef {
  id: AttackId;
  /** Stoichiometric recipe — exact atom counts needed to assemble one copy of the molecule. */
  recipe: Partial<Record<BaseAtom, number>>;
  /** Fixed priority used to order the numpad slots (lower = earlier key). */
  slot: number;
  /** Effect/HUD color — tuned to match the atom or compound. */
  color: number;
  /** Per-tier special names (Lv1, Lv2, Lv3). */
  tierNames: [string, string, string];
  /** Independent cooldown for this attack, in ms. */
  cooldownMs: number;
}

export const ATTACKS: Record<AttackId, AttackDef> = {
  [ELEMENTS.HYDROGEN]: {
    id: ELEMENTS.HYDROGEN,
    recipe: { hydrogen: 1 },
    slot: 1,
    color: 0x4499ff,
    tierNames: ['Proton Punch', 'Plasma Arc', 'Fusion Burst'],
    cooldownMs: 700,
  },
  [ELEMENTS.OXYGEN]: {
    id: ELEMENTS.OXYGEN,
    recipe: { oxygen: 1 },
    slot: 2,
    color: 0xff5533,
    tierNames: ['Oxidize', 'Reactive Cloud', 'Oxidation Nova'],
    cooldownMs: 800,
  },
  [ELEMENTS.CARBON]: {
    id: ELEMENTS.CARBON,
    recipe: { carbon: 1 },
    slot: 3,
    color: 0x888888,
    tierNames: ['Carbon Claw', 'Diamond Shard', 'Graphene Shockwave'],
    cooldownMs: 800,
  },
  [ELEMENTS.NITROGEN]: {
    id: ELEMENTS.NITROGEN,
    recipe: { nitrogen: 1 },
    slot: 4,
    color: 0x44ddcc,
    tierNames: ['Nitrogen Frost', 'Cryo Burst', 'Absolute Zero'],
    cooldownMs: 900,
  },
  [ELEMENTS.WATER]: {
    id: ELEMENTS.WATER,
    recipe: { hydrogen: 2, oxygen: 1 },
    slot: 5,
    color: 0x22ccff,
    tierNames: ['Water Jet', 'Hydro Wave', 'Tidal Force'],
    cooldownMs: 1200,
  },
  [ELEMENTS.AMMONIA]: {
    id: ELEMENTS.AMMONIA,
    recipe: { nitrogen: 1, hydrogen: 3 },
    slot: 6,
    color: 0xaadd44,
    tierNames: ['Caustic Spray', 'Acid Cloud', 'Toxic Deluge'],
    cooldownMs: 1300,
  },
  [ELEMENTS.CARBON_DIOXIDE]: {
    id: ELEMENTS.CARBON_DIOXIDE,
    recipe: { carbon: 1, oxygen: 2 },
    slot: 7,
    color: 0x99bbcc,
    tierNames: ['Smog Pulse', 'Suffocation Field', 'Blackout'],
    cooldownMs: 1300,
  },
  [ELEMENTS.METHANE]: {
    id: ELEMENTS.METHANE,
    recipe: { carbon: 1, hydrogen: 4 },
    slot: 8,
    color: 0xff9922,
    tierNames: ['Gas Ignite', 'Chain Blast', 'Fireball'],
    cooldownMs: 1100,
  },
  [ELEMENTS.NITRIC_OXIDE]: {
    id: ELEMENTS.NITRIC_OXIDE,
    recipe: { nitrogen: 1, oxygen: 1 },
    slot: 9,
    color: 0xdd44aa,
    tierNames: ['Radical Rush', 'Reactive Aura', 'Overclock'],
    cooldownMs: 1400,
  },
  [ELEMENTS.CARBONIC_ACID]: {
    id: ELEMENTS.CARBONIC_ACID,
    recipe: { hydrogen: 2, carbon: 1, oxygen: 3 },
    slot: 10,
    color: 0x33aadd,
    tierNames: ['Acid Drop', 'Corrosive Spray', 'Acid Rain'],
    cooldownMs: 1800,
  },
};

/** Attack ids in fixed slot/priority order. */
export const ATTACK_ORDER: AttackId[] = Object.values(ATTACKS)
  .sort((a, b) => a.slot - b.slot)
  .map((a) => a.id);
