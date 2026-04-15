// Design Ref: §4.2 — Enemy spawning, path movement, status effects

import type { Game, GameSystem } from '@/game/core/Game';
import type { Position } from '@/types/common';
import type { EnemyId, EnemyInstance, StatusEffect } from '@/types/enemy';
import { AssetLoader } from '@/game/core/AssetLoader';
import { MapManager } from '@/game/managers/MapManager';
import { useGameStore } from '@/stores/gameStore';

type MutableEnemyInstance = {
  readonly id: string;
  readonly enemyId: EnemyId;
  currentHealth: number;
  readonly maxHealth: number;
  pathProgress: number;
  effects: StatusEffect[];
};

export class EnemySystem implements GameSystem {
  readonly name = 'EnemySystem';

  private game: Game | null = null;
  private enemies: MutableEnemyInstance[] = [];
  private mapManager: MapManager | null = null;

  init(game: Game): void {
    this.game = game;
    this.enemies = [];
    this.mapManager = null;
  }

  /**
   * Set the map manager so enemies can follow the path.
   */
  setMapManager(mapManager: MapManager): void {
    this.mapManager = mapManager;
  }

  /**
   * Spawn a new enemy at the start of the path.
   */
  spawnEnemy(enemyId: EnemyId): void {
    const definition = AssetLoader.getEnemyData(enemyId);
    if (definition === undefined) {
      return;
    }

    // Scale HP by current wave + endless accumulated + difficulty
    const gameStore = useGameStore.getState();
    const wave = gameStore.currentWave + gameStore.endlessWave;
    const waveBonus = Math.max(0, wave - 1) * 0.18;
    const tierBonus = Math.floor(wave / 5) * 0.15;
    let scale = definition.isBoss ? 1 + Math.floor(wave / 20) * 0.5 : 1 + waveBonus + tierBonus;

    // Difficulty multiplier
    import("@/stores/playerStore").then(({ usePlayerStore }) => {
      // Just a no-op here since we already captured scale
    });
    const difficulty = (globalThis as unknown as { __TD_DIFFICULTY?: string }).__TD_DIFFICULTY ?? "normal";
    const diffMultiplier = difficulty === "easy" ? 0.75 : difficulty === "hard" ? 1.4 : 1.0;
    scale *= diffMultiplier;

    const scaledHealth = Math.round(definition.baseHealth * scale);

    const instance: MutableEnemyInstance = {
      id: crypto.randomUUID(),
      enemyId,
      currentHealth: scaledHealth,
      maxHealth: scaledHealth,
      pathProgress: 0,
      effects: [],
    };

    this.enemies.push(instance);
  }

  update(deltaTime: number): void {
    const enemiesToRemove: string[] = [];

    for (const enemy of this.enemies) {
      // Update status effects
      this.updateEffects(enemy, deltaTime);

      // Calculate effective speed (may be modified by effects)
      const definition = AssetLoader.getEnemyData(enemy.enemyId);
      if (definition === undefined) {
        continue;
      }

      let speed = definition.speed;

      // Apply slow effects
      for (const effect of enemy.effects) {
        if (effect.type === 'slow') {
          speed = speed * (1 - effect.strength);
        }
        if (effect.type === 'stun' || effect.type === 'freeze') {
          speed = 0;
        }
      }

      // Apply poison/burn damage — award gold on kill
      for (const effect of enemy.effects) {
        if (effect.type === 'poison' || effect.type === 'burn') {
          enemy.currentHealth = enemy.currentHealth - effect.strength * deltaTime;
          if (enemy.currentHealth <= 0) {
            // Award gold via economy + count kill
            const def = AssetLoader.getEnemyData(enemy.enemyId);
            if (def) {
              const econ = this.game?.getSystem<import('./EconomySystem').EconomySystem>('EconomySystem');
              const wave = useGameStore.getState().currentWave;
              const waveBonus = 1 + Math.max(0, wave - 1) * 0.08;
              econ?.addGold(Math.round(def.goldReward * waveBonus));
            }
            useGameStore.getState().incrementEnemiesKilled();
            enemiesToRemove.push(enemy.id);
            break;
          }
        }
      }

      // Move along path
      if (speed > 0 && this.mapManager !== null) {
        enemy.pathProgress = enemy.pathProgress + speed * deltaTime;

        const pathLength = this.mapManager.getPathLength();
        if (enemy.pathProgress >= pathLength) {
          enemiesToRemove.push(enemy.id);
          const skill = this.game?.getSystem<import("./SkillSystem").SkillSystem>("SkillSystem");
          if (!skill?.isGuardian()) {
            const store = useGameStore.getState();
            store.damageBase(1);
            store.incrementLivesLost();
            import("@/features/audio/sfxManager").then(({ sfx }) => sfx.play("base_damage"));
          }
        }
      }
    }

    // Healer aura: heal nearby enemies
    this.applyHealerAuras(deltaTime);

    // Remove enemies that reached the base or died from effects
    for (const id of enemiesToRemove) {
      this.removeEnemy(id);
    }
  }

  /**
   * Healer enemies heal nearby allies within 100px radius by 8 HP/s.
   */
  private applyHealerAuras(deltaTime: number): void {
    if (!this.mapManager) return;

    for (const healer of this.enemies) {
      const def = AssetLoader.getEnemyData(healer.enemyId);
      if (!def || def.specialAbility !== 'heal_aura') continue;

      const healerPos = this.mapManager.getPositionAtDistance(healer.pathProgress);
      const healAmount = 8 * deltaTime;
      const radiusSq = 100 * 100;

      for (const target of this.enemies) {
        if (target.id === healer.id) continue;
        const targetPos = this.mapManager.getPositionAtDistance(target.pathProgress);
        const dx = targetPos.x - healerPos.x;
        const dy = targetPos.y - healerPos.y;
        if (dx * dx + dy * dy > radiusSq) continue;

        target.currentHealth = Math.min(target.maxHealth, target.currentHealth + healAmount);
      }
    }
  }

  /**
   * Update status effects: decrement durations and remove expired effects.
   */
  private updateEffects(enemy: MutableEnemyInstance, deltaTime: number): void {
    const updatedEffects: StatusEffect[] = [];

    for (const effect of enemy.effects) {
      const remaining = effect.duration - deltaTime;
      if (remaining > 0) {
        updatedEffects.push({
          type: effect.type,
          duration: remaining,
          strength: effect.strength,
        });
      }
    }

    enemy.effects = updatedEffects;
  }

  /**
   * Spawn an enemy at a specific path progress (for split/revive mechanics).
   */
  spawnEnemyAtProgress(enemyId: EnemyId, progress: number): void {
    const definition = AssetLoader.getEnemyData(enemyId);
    if (definition === undefined) return;

    const instance: MutableEnemyInstance = {
      id: crypto.randomUUID(),
      enemyId,
      currentHealth: definition.baseHealth,
      maxHealth: definition.baseHealth,
      pathProgress: progress,
      effects: [],
    };
    this.enemies.push(instance);
  }

  /**
   * Get all alive enemies as readonly instances.
   */
  getEnemies(): readonly EnemyInstance[] {
    return this.enemies.map((e) => ({
      id: e.id,
      enemyId: e.enemyId,
      currentHealth: e.currentHealth,
      maxHealth: e.maxHealth,
      pathProgress: e.pathProgress,
      effects: [...e.effects],
    }));
  }

  /**
   * Get enemy count (useful for wave completion checks).
   */
  getEnemyCount(): number {
    return this.enemies.length;
  }

  /**
   * Find an enemy by ID.
   */
  findEnemy(id: string): EnemyInstance | undefined {
    const enemy = this.enemies.find((e) => e.id === id);
    if (enemy === undefined) {
      return undefined;
    }
    return {
      id: enemy.id,
      enemyId: enemy.enemyId,
      currentHealth: enemy.currentHealth,
      maxHealth: enemy.maxHealth,
      pathProgress: enemy.pathProgress,
      effects: [...enemy.effects],
    };
  }

  /**
   * Get the world position of an enemy along the path.
   */
  getEnemyPosition(enemyId: string): Position | undefined {
    const enemy = this.enemies.find((e) => e.id === enemyId);
    if (enemy === undefined || this.mapManager === null) {
      return undefined;
    }
    return this.mapManager.getPositionAtDistance(enemy.pathProgress);
  }

  /**
   * Update an enemy's mutable fields (used by CombatSystem).
   */
  updateEnemy(enemyId: string, updates: Partial<Pick<MutableEnemyInstance, 'currentHealth' | 'effects'>>): void {
    const enemy = this.enemies.find((e) => e.id === enemyId);
    if (enemy === undefined) {
      return;
    }

    if (updates.currentHealth !== undefined) {
      enemy.currentHealth = updates.currentHealth;
    }
    if (updates.effects !== undefined) {
      enemy.effects = [...updates.effects];
    }
  }

  /**
   * Remove an enemy by ID.
   */
  removeEnemy(enemyId: string): void {
    this.enemies = this.enemies.filter((e) => e.id !== enemyId);
  }

  /**
   * Check if an enemy is alive (exists in the system).
   */
  isAlive(enemyId: string): boolean {
    return this.enemies.some((e) => e.id === enemyId);
  }

  destroy(): void {
    this.game = null;
    this.enemies = [];
    this.mapManager = null;
  }
}
