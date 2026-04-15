// Design Ref: §9.3 — Permanent upgrade definitions (SP sink for late game)

import type { TowerId } from "@/types/tower";

export type UpgradeCategory = "global" | "tower";

export interface PermanentUpgrade {
  readonly id: string;
  readonly category: UpgradeCategory;
  readonly name: string;
  readonly description: string;
  readonly maxLevel: number;
  readonly costPerLevel: readonly number[];
  readonly valuePerLevel: readonly number[];
  readonly towerId?: TowerId;
  readonly unit?: string; // "%", "", etc.
}

export const GLOBAL_UPGRADES: readonly PermanentUpgrade[] = [
  {
    id: "starting_gold",
    category: "global",
    name: "초기 자금",
    description: "스테이지 시작 시 골드 추가",
    maxLevel: 5,
    costPerLevel: [100, 250, 500, 1000, 2000],
    valuePerLevel: [50, 100, 200, 350, 500],
    unit: "골드",
  },
  {
    id: "base_health",
    category: "global",
    name: "기지 강화",
    description: "기지 최대 체력 증가",
    maxLevel: 5,
    costPerLevel: [100, 250, 500, 1000, 2000],
    valuePerLevel: [5, 10, 15, 20, 25],
    unit: "HP",
  },
  {
    id: "gold_reward_bonus",
    category: "global",
    name: "골드 획득 증가",
    description: "적 처치 시 골드 보상 증가",
    maxLevel: 5,
    costPerLevel: [150, 300, 600, 1200, 2400],
    valuePerLevel: [5, 10, 15, 20, 30],
    unit: "%",
  },
  {
    id: "sell_refund",
    category: "global",
    name: "재활용 숙련",
    description: "타워 판매 환불률 증가 (기본 50%)",
    maxLevel: 4,
    costPerLevel: [100, 200, 400, 800],
    valuePerLevel: [10, 20, 30, 40],
    unit: "%",
  },
  {
    id: "global_damage",
    category: "global",
    name: "전 타워 공격력",
    description: "모든 타워 공격력 증가",
    maxLevel: 10,
    costPerLevel: [200, 400, 600, 800, 1200, 1600, 2000, 2500, 3000, 4000],
    valuePerLevel: [3, 6, 9, 12, 15, 18, 22, 26, 30, 35],
    unit: "%",
  },
  {
    id: "global_range",
    category: "global",
    name: "전 타워 사거리",
    description: "모든 타워 사거리 증가",
    maxLevel: 5,
    costPerLevel: [150, 300, 600, 1200, 2500],
    valuePerLevel: [5, 10, 15, 20, 25],
    unit: "%",
  },
  {
    id: "global_attack_speed",
    category: "global",
    name: "전 타워 공속",
    description: "모든 타워 공격 속도 증가",
    maxLevel: 5,
    costPerLevel: [200, 400, 800, 1600, 3200],
    valuePerLevel: [5, 10, 15, 20, 25],
    unit: "%",
  },
];

const TOWER_NAMES: Record<TowerId, string> = {
  archer: "궁수", mage: "마법사", cannon: "대포", frost: "냉기",
  poison: "독", tesla: "테슬라", bomb: "폭탄", support: "지원",
};

function makeTowerUpgrade(towerId: TowerId, stat: "damage" | "range"): PermanentUpgrade {
  const label = stat === "damage" ? "공격력" : "사거리";
  return {
    id: `tower_${towerId}_${stat}`,
    category: "tower",
    towerId,
    name: `${TOWER_NAMES[towerId]} ${label}`,
    description: `${TOWER_NAMES[towerId]} 타워의 ${label} 증가`,
    maxLevel: 5,
    costPerLevel: [80, 160, 320, 640, 1280],
    valuePerLevel: stat === "damage"
      ? [5, 10, 15, 22, 30]
      : [5, 10, 15, 20, 25],
    unit: "%",
  };
}

export const TOWER_UPGRADES: readonly PermanentUpgrade[] = [
  ...(Object.keys(TOWER_NAMES) as TowerId[]).flatMap((id) => [
    makeTowerUpgrade(id, "damage"),
    makeTowerUpgrade(id, "range"),
  ]),
];

export const ALL_UPGRADES = [...GLOBAL_UPGRADES, ...TOWER_UPGRADES];

export function getUpgradeById(id: string): PermanentUpgrade | undefined {
  return ALL_UPGRADES.find((u) => u.id === id);
}

/** Get the current cumulative value of an upgrade at a specific level. */
export function getUpgradeValue(id: string, level: number): number {
  const def = getUpgradeById(id);
  if (!def || level <= 0) return 0;
  return def.valuePerLevel[Math.min(level - 1, def.valuePerLevel.length - 1)];
}
