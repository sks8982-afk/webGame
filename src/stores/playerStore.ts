// Design Ref: §3.1 — Player persistent state (survives between stages)

import { create } from "zustand";
import type { StageProgress } from "@/types/stage";

interface PlayerSkillState {
  readonly skillId: string;
  readonly level: number;
}

interface WeaponState {
  readonly weaponId: string;
  readonly enhanceLevel: number;
  readonly equippedOnTowerId: string | null;
}

interface PlayerStoreState {
  readonly starPoints: number;
  readonly gems: number;
  readonly skills: readonly PlayerSkillState[];
  readonly weapons: readonly WeaponState[];
  readonly stageProgress: readonly StageProgress[];
  readonly permanentUpgrades: Record<string, number>;
  readonly unlockedAchievements: readonly string[];
  readonly stats: { totalKills: number; totalGold: number; highestEndlessWave: number; totalSpEarned: number };
  readonly difficulty: "easy" | "normal" | "hard";

  addStarPoints: (amount: number) => void;
  removeStarPoints: (amount: number) => boolean;
  addGems: (amount: number) => void;
  removeGems: (amount: number) => boolean;

  learnSkill: (skillId: string) => void;
  upgradeSkill: (skillId: string) => void;
  getSkillLevel: (skillId: string) => number;

  addWeapon: (weaponId: string) => void;
  enhanceWeapon: (weaponId: string, newLevel: number) => void;
  removeWeapon: (weaponId: string) => void;
  hasWeapon: (weaponId: string) => boolean;

  updateStageProgress: (stageId: number, stars: 1 | 2 | 3) => void;
  getStageStars: (stageId: number) => number;

  upgradePermanent: (upgradeId: string) => void;
  getPermanentLevel: (upgradeId: string) => number;

  unlockAchievement: (id: string) => void;
  hasAchievement: (id: string) => boolean;

  incrementStat: (key: "totalKills" | "totalGold" | "totalSpEarned", amount: number) => void;
  updateHighestEndlessWave: (wave: number) => void;
  setDifficulty: (d: "easy" | "normal" | "hard") => void;

  loadFromSave: (data: Partial<PlayerStoreState>) => void;
}

/** Enhance multiplier: each enhance level adds 15% */
export function getWeaponPowerMultiplier(enhanceLevel: number): number {
  return 1 + enhanceLevel * 0.15;
}

export const usePlayerStore = create<PlayerStoreState>((set, get) => ({
  starPoints: 0,
  gems: 0,
  skills: [],
  weapons: [],
  stageProgress: [],
  permanentUpgrades: {},
  unlockedAchievements: [],
  stats: { totalKills: 0, totalGold: 0, highestEndlessWave: 0, totalSpEarned: 0 },
  difficulty: "normal",

  addStarPoints: (amount) => set((s) => ({ starPoints: s.starPoints + amount })),
  removeStarPoints: (amount) => {
    if (get().starPoints < amount) return false;
    set((s) => ({ starPoints: s.starPoints - amount }));
    return true;
  },
  addGems: (amount) => set((s) => ({ gems: s.gems + amount })),
  removeGems: (amount) => {
    if (get().gems < amount) return false;
    set((s) => ({ gems: s.gems - amount }));
    return true;
  },

  learnSkill: (skillId) =>
    set((s) => ({
      skills: s.skills.some((sk) => sk.skillId === skillId)
        ? s.skills
        : [...s.skills, { skillId, level: 1 }],
    })),
  upgradeSkill: (skillId) =>
    set((s) => ({
      skills: s.skills.map((sk) =>
        sk.skillId === skillId ? { ...sk, level: sk.level + 1 } : sk
      ),
    })),
  getSkillLevel: (skillId) => {
    const skill = get().skills.find((s) => s.skillId === skillId);
    return skill?.level ?? 0;
  },

  addWeapon: (weaponId) =>
    set((s) => ({
      weapons: [...s.weapons, { weaponId, enhanceLevel: 0, equippedOnTowerId: null }],
    })),
  enhanceWeapon: (weaponId, newLevel) =>
    set((s) => ({
      weapons: s.weapons.map((w) =>
        w.weaponId === weaponId ? { ...w, enhanceLevel: newLevel } : w
      ),
    })),
  removeWeapon: (weaponId) =>
    set((s) => ({ weapons: s.weapons.filter((w) => w.weaponId !== weaponId) })),
  hasWeapon: (weaponId) => get().weapons.some((w) => w.weaponId === weaponId),

  updateStageProgress: (stageId, stars) =>
    set((s) => {
      const existing = s.stageProgress.find((p) => p.stageId === stageId);
      if (existing) {
        return {
          stageProgress: s.stageProgress.map((p) =>
            p.stageId === stageId
              ? {
                  ...p,
                  cleared: true,
                  bestStars: Math.max(p.bestStars ?? 0, stars) as 1 | 2 | 3,
                  attempts: p.attempts + 1,
                }
              : p
          ),
        };
      }
      return {
        stageProgress: [
          ...s.stageProgress,
          { stageId, cleared: true, bestStars: stars, attempts: 1 },
        ],
      };
    }),
  getStageStars: (stageId) => {
    const progress = get().stageProgress.find((p) => p.stageId === stageId);
    return progress?.bestStars ?? 0;
  },

  upgradePermanent: (upgradeId) =>
    set((s) => ({
      permanentUpgrades: {
        ...s.permanentUpgrades,
        [upgradeId]: (s.permanentUpgrades[upgradeId] ?? 0) + 1,
      },
    })),
  getPermanentLevel: (upgradeId) => get().permanentUpgrades[upgradeId] ?? 0,

  unlockAchievement: (id) =>
    set((s) =>
      s.unlockedAchievements.includes(id)
        ? s
        : { unlockedAchievements: [...s.unlockedAchievements, id] }
    ),
  hasAchievement: (id) => get().unlockedAchievements.includes(id),

  incrementStat: (key, amount) =>
    set((s) => ({ stats: { ...s.stats, [key]: s.stats[key] + amount } })),
  updateHighestEndlessWave: (wave) =>
    set((s) => ({ stats: { ...s.stats, highestEndlessWave: Math.max(s.stats.highestEndlessWave, wave) } })),
  setDifficulty: (d) => set({ difficulty: d }),

  loadFromSave: (data) => set(data),
}));
