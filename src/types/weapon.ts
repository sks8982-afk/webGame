import type { DamageType, Rarity } from "./common";
import type { TowerId } from "./tower";

export type WeaponId = string;

export type WeaponDefinition = {
  readonly id: WeaponId;
  readonly name: string;
  readonly description: string;
  readonly rarity: Rarity;
  readonly equipableOn: readonly TowerId[] | "all";
  readonly damageType: DamageType;
  readonly attackBonus: number;
  readonly speedBonus: number;
  readonly specialEffect: string;
  readonly maxEnhanceLevel: number;
  readonly cost: number;
  readonly icon: string;
};

export type WeaponInstance = {
  readonly weaponId: WeaponId;
  readonly enhanceLevel: number;
  readonly equippedOnTowerId: string | null;
};

export type EnhanceResult = {
  readonly success: boolean;
  readonly newLevel: number;
  readonly destroyed: boolean;
};

export const ENHANCE_SUCCESS_RATES: readonly number[] = [
  0.95, // +1 → +2
  0.90, // +2 → +3
  0.80, // +3 → +4
  0.70, // +4 → +5
  0.60, // +5 → +6
  0.50, // +6 → +7
  0.40, // +7 → +8
  0.30, // +8 → +9
  0.20, // +9 → +10
];

export const ENHANCE_COSTS: readonly number[] = [
  10, 20, 40, 80, 150, 300, 500, 800, 1500,
];
