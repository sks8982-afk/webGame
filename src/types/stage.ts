import type { EnemyId } from "./enemy";
import type { Position, StarRating } from "./common";

export type StageId = number;

export type StageDefinition = {
  readonly id: StageId;
  readonly name: string;
  readonly description: string;
  readonly mapFile: string;
  readonly path: readonly Position[];
  readonly towerSlots: readonly Position[];
  readonly waves: readonly WaveDefinition[];
  readonly baseHealth: number;
  readonly startingGold: number;
  readonly starCriteria: StarCriteria;
  readonly isBossStage: boolean;
  readonly rewards: StageRewards;
};

export type WaveDefinition = {
  readonly waveNumber: number;
  readonly groups: readonly EnemyGroup[];
  readonly delayBeforeWave: number;
};

export type EnemyGroup = {
  readonly enemyId: EnemyId;
  readonly count: number;
  readonly spawnInterval: number;
  readonly delayBeforeGroup: number;
};

export type StarCriteria = {
  readonly oneStar: { readonly maxLivesLost: number };
  readonly twoStar: { readonly maxLivesLost: number };
  readonly threeStar: { readonly maxLivesLost: number };
};

export type StageRewards = {
  readonly starPoints: number;
  readonly gems: number;
  readonly firstClearBonus: number;
};

export type StageProgress = {
  readonly stageId: StageId;
  readonly cleared: boolean;
  readonly bestStars: StarRating | null;
  readonly attempts: number;
};
