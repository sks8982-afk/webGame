export type SkillCategory = "attack" | "economy" | "defense" | "hidden";

export type SkillType = "passive" | "active";

export type SkillId = string;

export type SkillDefinition = {
  readonly id: SkillId;
  readonly name: string;
  readonly description: string;
  readonly category: SkillCategory;
  readonly type: SkillType;
  readonly maxLevel: number;
  readonly costPerLevel: readonly number[];
  readonly effects: readonly SkillEffect[];
  readonly cooldown: number | null; // null for passive skills, seconds for active
  readonly unlockCondition: UnlockCondition | null;
  readonly icon: string;
};

export type SkillEffect = {
  readonly stat: string;
  readonly valuePerLevel: readonly number[];
  readonly isPercentage: boolean;
};

export type UnlockCondition = {
  readonly type: "boss_clear" | "gold_threshold" | "stage_clear" | "skill_prerequisite";
  readonly value: string | number;
};

export type PlayerSkill = {
  readonly skillId: SkillId;
  readonly level: number;
  readonly cooldownRemaining: number;
};
