// Design Ref: §3.1 — Game session state managed via Zustand

import { create } from "zustand";
import type { GameSpeed, GameState } from "@/types/common";

interface GameStoreState {
  // Game session
  readonly stageId: number;
  readonly gameState: GameState;
  readonly gameSpeed: GameSpeed;

  // Economy
  readonly gold: number;
  readonly baseHealth: number;
  readonly maxBaseHealth: number;

  // Wave
  readonly currentWave: number;
  readonly totalWaves: number;

  // Score
  readonly enemiesKilled: number;
  readonly livesLost: number;

  // Endless mode
  readonly isEndless: boolean;
  readonly endlessWave: number;

  // Active skill cooldowns (in seconds)
  readonly skillCooldowns: Record<string, number>;

  // Actions
  setStageId: (id: number) => void;
  setGameState: (state: GameState) => void;
  setGameSpeed: (speed: GameSpeed) => void;
  setGold: (gold: number) => void;
  addGold: (amount: number) => void;
  removeGold: (amount: number) => boolean;
  setBaseHealth: (health: number) => void;
  damageBase: (amount: number) => void;
  setWaveInfo: (current: number, total: number) => void;
  incrementEnemiesKilled: () => void;
  incrementLivesLost: () => void;
  resetGame: (startingGold: number, baseHealth: number) => void;

  setEndless: (endless: boolean) => void;
  setEndlessWave: (wave: number) => void;
  setSkillCooldown: (skillId: string, seconds: number) => void;
  tickSkillCooldowns: (dt: number) => void;
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  stageId: 0,
  gameState: "menu",
  gameSpeed: 1,
  gold: 0,
  baseHealth: 20,
  maxBaseHealth: 20,
  currentWave: 0,
  totalWaves: 0,
  enemiesKilled: 0,
  livesLost: 0,
  isEndless: false,
  endlessWave: 0,
  skillCooldowns: {},

  setStageId: (id) => set({ stageId: id }),
  setGameState: (state) => set({ gameState: state }),
  setGameSpeed: (speed) => set({ gameSpeed: speed }),
  setGold: (gold) => set({ gold }),
  addGold: (amount) => set((s) => ({ gold: s.gold + amount })),
  removeGold: (amount) => {
    const state = get();
    if (state.gold < amount) return false;
    set({ gold: state.gold - amount });
    return true;
  },
  setBaseHealth: (health) => set({ baseHealth: health }),
  damageBase: (amount) => {
    const state = get();
    const newHealth = Math.max(0, state.baseHealth - amount);
    set({
      baseHealth: newHealth,
      gameState: newHealth <= 0 ? "game_over" : state.gameState,
    });
  },
  setWaveInfo: (current, total) =>
    set({ currentWave: current, totalWaves: total }),
  incrementEnemiesKilled: () =>
    set((s) => ({ enemiesKilled: s.enemiesKilled + 1 })),
  incrementLivesLost: () => set((s) => ({ livesLost: s.livesLost + 1 })),
  resetGame: (startingGold, baseHealth) =>
    set({
      gold: startingGold,
      baseHealth: baseHealth,
      maxBaseHealth: baseHealth,
      currentWave: 0,
      totalWaves: 0,
      enemiesKilled: 0,
      livesLost: 0,
      gameState: "playing",
      gameSpeed: 1,
      endlessWave: 0,
      skillCooldowns: {},
    }),

  setEndless: (endless) => set({ isEndless: endless }),
  setEndlessWave: (wave) => set({ endlessWave: wave }),
  setSkillCooldown: (skillId, seconds) =>
    set((s) => ({ skillCooldowns: { ...s.skillCooldowns, [skillId]: seconds } })),
  tickSkillCooldowns: (dt) =>
    set((s) => {
      const next: Record<string, number> = {};
      for (const [k, v] of Object.entries(s.skillCooldowns)) {
        const nv = Math.max(0, v - dt);
        if (nv > 0) next[k] = nv;
      }
      return { skillCooldowns: next };
    }),
}));
