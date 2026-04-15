// Design Ref: §2.2 — Game loop system execution order and core constants

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const TILE_SIZE = 32;

export const BASE_HEALTH = 20;
export const STARTING_GOLD = 200;
export const TOWER_SELL_REFUND_RATE = 0.5;

export const MAX_GAME_SPEED = 3;
export const TARGET_FPS = 60;

export const PROJECTILE_SPEED = 300;

export const DROP_RATES = {
  common: 0.6,
  uncommon: 0.25,
  rare: 0.1,
  epic: 0.04,
  legendary: 0.01,
} as const;
