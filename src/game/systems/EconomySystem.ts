// Design Ref: §3.1 — Economy tracking during gameplay

import type { Game, GameSystem } from '@/game/core/Game';
import { useGameStore } from '@/stores/gameStore';

export class EconomySystem implements GameSystem {
  readonly name = 'EconomySystem';

  private game: Game | null = null;
  private gold: number = 0;

  init(game: Game): void {
    this.game = game;
    this.gold = 0;
  }

  update(_deltaTime: number): void {
    // Sync gold to store for UI reactivity
    useGameStore.getState().setGold(this.gold);
  }

  /**
   * Set initial gold amount (e.g., from stage starting gold).
   */
  setInitialGold(amount: number): void {
    this.gold = amount;
  }

  /**
   * Add gold to the player's balance.
   */
  addGold(amount: number): void {
    if (amount <= 0) {
      return;
    }
    this.gold = this.gold + amount;
  }

  /**
   * Remove gold from the player's balance.
   * Returns false if insufficient gold (no deduction occurs).
   */
  removeGold(amount: number): boolean {
    if (amount <= 0) {
      return true;
    }
    if (this.gold < amount) {
      return false;
    }
    this.gold = this.gold - amount;
    return true;
  }

  /**
   * Get current gold balance.
   */
  getGold(): number {
    return this.gold;
  }

  /**
   * Check if the player can afford a given cost.
   */
  canAfford(cost: number): boolean {
    return this.gold >= cost;
  }

  /**
   * Award bonus gold at the end of a wave.
   * Formula: base 10 + 5 per wave number.
   */
  awardWaveClearBonus(waveNumber: number): void {
    const bonus = 25 + waveNumber * 10;
    this.addGold(bonus);
  }

  destroy(): void {
    this.game = null;
    this.gold = 0;
  }
}
