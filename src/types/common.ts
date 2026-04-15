export type Position = {
  readonly x: number;
  readonly y: number;
};

export type Size = {
  readonly width: number;
  readonly height: number;
};

export type DamageType = "physical" | "magic" | "fire" | "ice" | "lightning" | "poison";

export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export type GameSpeed = 1 | 2 | 3 | 4 | 5;

export type GameState = "menu" | "playing" | "paused" | "wave_complete" | "stage_clear" | "game_over";

export type StarRating = 1 | 2 | 3;

export type { TowerId } from "./tower";
