import type { DamageType, Position } from "./common";

export type TowerId =
  | "archer"
  | "mage"
  | "cannon"
  | "frost"
  | "poison"
  | "tesla"
  | "bomb"
  | "support";

export type UpgradePath = "path1" | "path2" | "path3";

export type TowerDefinition = {
  readonly id: TowerId;
  readonly name: string;
  readonly description: string;
  readonly baseCost: number;
  readonly damageType: DamageType;
  readonly baseAttack: number;
  readonly baseAttackSpeed: number;
  readonly baseRange: number;
  readonly splashRadius: number;
  readonly specialEffect: string;
  readonly upgrades: Record<UpgradePath, readonly UpgradeLevel[]>;
};

export type UpgradeLevel = {
  readonly name: string;
  readonly cost: number;
  readonly attackBonus: number;
  readonly speedBonus: number;
  readonly rangeBonus: number;
  readonly specialEffect: string;
};

export type TowerInstance = {
  readonly id: string;
  readonly towerId: TowerId;
  readonly position: Position;
  readonly level: number;
  readonly upgradePath: UpgradePath | null;
  readonly upgradeLevel: number;
  readonly equippedWeaponId: string | null;
};
