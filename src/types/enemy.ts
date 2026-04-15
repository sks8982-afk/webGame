import type { DamageType } from "./common";

export type EnemyId =
  | "goblin"
  | "wolf"
  | "orc_warrior"
  | "dark_mage"
  | "bat"
  | "ghost"
  | "slime"
  | "healer"
  | "shield_bearer"
  | "rogue"
  | "golem"
  | "dragon_whelp"
  | "necromancer"
  | "berserker"
  | "mimic"
  | "boss_orc_chief"
  | "boss_red_dragon"
  | "boss_lich_king"
  | "boss_demon_lord"
  | "boss_chaos_emperor";

export type EnemyDefinition = {
  readonly id: EnemyId;
  readonly name: string;
  readonly baseHealth: number;
  readonly speed: number;
  readonly armor: number;
  readonly magicResist: number;
  readonly goldReward: number;
  readonly isBoss: boolean;
  readonly isFlying: boolean;
  readonly isStealth: boolean;
  readonly resistances: Partial<Record<DamageType, number>>;
  readonly specialAbility: string;
  readonly dropChance: number;
};

export type EnemyInstance = {
  readonly id: string;
  readonly enemyId: EnemyId;
  readonly currentHealth: number;
  readonly maxHealth: number;
  readonly pathProgress: number;
  readonly effects: readonly StatusEffect[];
};

export type StatusEffect = {
  readonly type: "slow" | "poison" | "burn" | "stun" | "freeze";
  readonly duration: number;
  readonly strength: number;
};
