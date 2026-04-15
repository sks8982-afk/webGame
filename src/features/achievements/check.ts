// Achievement evaluation — run after stage clear / kills etc.

import { usePlayerStore } from "@/stores/playerStore";

interface AchievementDef {
  readonly id: string;
  readonly condition: { type: string; value: number };
  readonly reward: { sp: number; gems: number };
}

let cachedAchievements: AchievementDef[] | null = null;

async function loadAchievements(): Promise<AchievementDef[]> {
  if (cachedAchievements) return cachedAchievements;
  try {
    const res = await fetch("/data/achievements.json");
    const data = await res.json() as Record<string, AchievementDef>;
    cachedAchievements = Object.values(data);
    return cachedAchievements;
  } catch {
    return [];
  }
}

export async function checkAchievements(): Promise<string[]> {
  const defs = await loadAchievements();
  const state = usePlayerStore.getState();
  const unlocked: string[] = [];

  for (const def of defs) {
    if (state.hasAchievement(def.id)) continue;

    let met = false;
    const v = def.condition.value;

    switch (def.condition.type) {
      case "kills":
        met = state.stats.totalKills >= v;
        break;
      case "stage_clear":
        met = state.stageProgress.some((p) => p.stageId === v && p.cleared);
        break;
      case "three_star_count":
        met = state.stageProgress.filter((p) => (p.bestStars ?? 0) >= 3).length >= v;
        break;
      case "boss_clears": {
        const bossStages = [5, 10, 15, 20, 25];
        met = state.stageProgress.filter((p) => bossStages.includes(p.stageId) && p.cleared).length >= v;
        break;
      }
      case "weapons_owned":
        met = state.weapons.length >= v;
        break;
      case "max_enhance":
        met = state.weapons.some((w) => w.enhanceLevel >= v);
        break;
      case "skills_learned":
        met = state.skills.filter((s) => s.level > 0).length >= v;
        break;
      case "sp_reached":
        met = state.stats.totalSpEarned >= v || state.starPoints >= v;
        break;
      case "endless_wave":
        met = state.stats.highestEndlessWave >= v;
        break;
    }

    if (met) {
      state.unlockAchievement(def.id);
      if (def.reward.sp > 0) state.addStarPoints(def.reward.sp);
      if (def.reward.gems > 0) state.addGems(def.reward.gems);
      unlocked.push(def.id);
    }
  }

  return unlocked;
}
