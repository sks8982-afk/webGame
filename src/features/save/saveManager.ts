// Design Ref: §3 — LocalStorage save/load

import { usePlayerStore } from "@/stores/playerStore";

const SAVE_KEY = "tower-defense-save";

export function saveGame(): void {
  const s = usePlayerStore.getState();
  const saveData = {
    starPoints: s.starPoints,
    gems: s.gems,
    skills: s.skills,
    weapons: s.weapons,
    stageProgress: s.stageProgress,
    permanentUpgrades: s.permanentUpgrades,
    unlockedAchievements: s.unlockedAchievements,
    stats: s.stats,
    difficulty: s.difficulty,
    savedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
  } catch {}
}

export function loadGame(): boolean {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    usePlayerStore.getState().loadFromSave({
      starPoints: data.starPoints ?? 0,
      gems: data.gems ?? 0,
      skills: data.skills ?? [],
      weapons: data.weapons ?? [],
      stageProgress: data.stageProgress ?? [],
      permanentUpgrades: data.permanentUpgrades ?? {},
      unlockedAchievements: data.unlockedAchievements ?? [],
      stats: data.stats ?? { totalKills: 0, totalGold: 0, highestEndlessWave: 0, totalSpEarned: 0 },
      difficulty: data.difficulty ?? "normal",
    });
    return true;
  } catch {
    return false;
  }
}

export function hasSave(): boolean {
  return typeof window !== "undefined" && localStorage.getItem(SAVE_KEY) !== null;
}

export function deleteSave(): void {
  localStorage.removeItem(SAVE_KEY);
}
