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
} as const;

export type ElementType = (typeof ELEMENTS)[keyof typeof ELEMENTS];

export const ELEMENT_COLORS: Record<ElementType, number> = {
  [ELEMENTS.NONE]: 0x888888,
  [ELEMENTS.HYDROGEN]: 0x4499ff,
  [ELEMENTS.OXYGEN]: 0xff5533,
  [ELEMENTS.WATER]: 0x22ccff,
};

export const ELEMENT_NAMES: Record<ElementType, string> = {
  [ELEMENTS.NONE]: 'None',
  [ELEMENTS.HYDROGEN]: 'Hydrogen',
  [ELEMENTS.OXYGEN]: 'Oxygen',
  [ELEMENTS.WATER]: 'Water (H₂O)',
};

export const PLAYER_MAX_HP = 100;
export const PLAYER_SPEED = 220;
export const PLAYER_MELEE_RANGE = 85;
export const PLAYER_MELEE_DAMAGE = 12;
export const PLAYER_ATTACK_COOLDOWN = 400; // ms
export const PLAYER_SPECIAL_COOLDOWN = 1200; // ms
export const PLAYER_INVINCIBILITY_MS = 800;

export const MAX_ELEMENT_LEVEL = 3;

// Stage layout
export const BOSS_X = 4600;
export const STAGE_END_X = 5200;
