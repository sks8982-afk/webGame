// Design Ref: §4.4 — Damage calculation, splash damage, enemy death handling

import type { Game, GameSystem } from '@/game/core/Game';
import type { DamageType, Position } from '@/types/common';
import type { EnemyInstance, StatusEffect } from '@/types/enemy';
import { useGameStore } from '@/stores/gameStore';
import type { EnemySystem } from './EnemySystem';
import type { EconomySystem } from './EconomySystem';
import { AssetLoader } from '@/game/core/AssetLoader';
import { sfx } from '@/features/audio/sfxManager';

export class CombatSystem implements GameSystem {
  readonly name = 'CombatSystem';

  private game: Game | null = null;

  init(game: Game): void {
    this.game = game;
  }

  update(_deltaTime: number): void {
    // CombatSystem is event-driven; no per-frame work needed.
  }

  /**
   * Deal damage to a single enemy.
   * Damage formula: finalDamage = max(1, rawDamage - armor).
   * If damageType matches a resistance, multiply by (1 - resistance).
   * Returns the final damage dealt.
   */
  dealDamage(
    enemy: EnemyInstance,
    rawDamage: number,
    damageType: DamageType,
    splashRadius?: number,
  ): number {
    const enemyDef = AssetLoader.getEnemyData(enemy.enemyId);
    if (enemyDef === undefined) {
      return 0;
    }

    // Base damage after armor reduction
    let finalDamage = Math.max(1, rawDamage - enemyDef.armor);

    // Apply resistance if the enemy has one for this damage type
    const resistance = enemyDef.resistances[damageType];
    if (resistance !== undefined && resistance > 0) {
      finalDamage = finalDamage * (1 - resistance);
    }

    finalDamage = Math.max(1, Math.round(finalDamage));

    // Apply damage to enemy (immutable update via EnemySystem)
    const enemySystem = this.getEnemySystem();
    if (enemySystem === undefined) {
      return finalDamage;
    }

    const newHealth = enemy.currentHealth - finalDamage;

    if (newHealth <= 0) {
      this.handleEnemyDeath(enemy);
      sfx.play("enemy_death");
    } else {
      enemySystem.updateEnemy(enemy.id, { currentHealth: newHealth });
      sfx.play("enemy_hit");
    }

    // Handle splash damage if applicable
    if (splashRadius !== undefined && splashRadius > 0) {
      const enemyPosition = enemySystem.getEnemyPosition(enemy.id);
      if (enemyPosition !== undefined) {
        this.applySplashDamage(enemyPosition, splashRadius, rawDamage, damageType, enemy.id);
      }
    }

    return finalDamage;
  }

  /**
   * Apply splash damage to all enemies within a radius of a position.
   * Excludes the primary target (already damaged).
   */
  applySplashDamage(
    position: Position,
    radius: number,
    damage: number,
    damageType: DamageType,
    excludeEnemyId?: string,
  ): void {
    const enemySystem = this.getEnemySystem();
    if (enemySystem === undefined) {
      return;
    }

    const enemies = enemySystem.getEnemies();
    for (const enemy of enemies) {
      if (excludeEnemyId !== undefined && enemy.id === excludeEnemyId) {
        continue;
      }

      const enemyPos = enemySystem.getEnemyPosition(enemy.id);
      if (enemyPos === undefined) {
        continue;
      }

      const dx = enemyPos.x - position.x;
      const dy = enemyPos.y - position.y;
      const distanceSq = dx * dx + dy * dy;

      if (distanceSq <= radius * radius) {
        // Splash targets receive damage independently calculated
        this.dealDamage(enemy, damage, damageType);
      }
    }
  }

  /**
   * Apply status effects to an enemy (slow, poison, burn, freeze, stun).
   */
  applyEffects(enemyId: string, effects: readonly StatusEffect[]): void {
    const enemySystem = this.getEnemySystem();
    if (!enemySystem) return;

    const enemy = enemySystem.findEnemy(enemyId);
    if (!enemy) return;

    const currentEffects = [...enemy.effects];
    for (const eff of effects) {
      // Replace existing effect of same type if new one is stronger/longer
      const existingIdx = currentEffects.findIndex((e) => e.type === eff.type);
      if (existingIdx >= 0) {
        const existing = currentEffects[existingIdx];
        if (eff.duration > existing.duration || eff.strength > existing.strength) {
          currentEffects[existingIdx] = eff;
        }
      } else {
        currentEffects.push(eff);
      }
    }
    enemySystem.updateEnemy(enemyId, { effects: currentEffects });
  }

  private handleEnemyDeath(enemy: EnemyInstance): void {
    const enemyDef = AssetLoader.getEnemyData(enemy.enemyId);
    const enemySystem = this.getEnemySystem();
    const economySystem = this.getEconomySystem();

    if (enemyDef !== undefined && economySystem !== undefined) {
      const wave = useGameStore.getState().currentWave;
      const waveBonus = 1 + Math.max(0, wave - 1) * 0.08;

      // Permanent gold bonus
      import("@/stores/playerStore").then(({ usePlayerStore }) => {
        const lvl = usePlayerStore.getState().permanentUpgrades["gold_reward_bonus"] ?? 0;
        const permBonus = [0, 5, 10, 15, 20, 30][lvl] ?? 0;
        const total = Math.round(enemyDef.goldReward * waveBonus * (1 + permBonus / 100));
        economySystem.addGold(total);
      });
    }

    if (enemySystem !== undefined) {
      // Slime split: spawn 2 smaller slimes at same position
      if (enemyDef?.specialAbility === "split") {
        enemySystem.spawnEnemyAtProgress("goblin", enemy.pathProgress);
        enemySystem.spawnEnemyAtProgress("goblin", enemy.pathProgress);
      }

      enemySystem.removeEnemy(enemy.id);
    }

    useGameStore.getState().incrementEnemiesKilled();
    // Stat tracking
    import("@/stores/playerStore").then(({ usePlayerStore }) => {
      usePlayerStore.getState().incrementStat("totalKills", 1);
      if (enemyDef) usePlayerStore.getState().incrementStat("totalGold", enemyDef.goldReward);
    });
  }

  private getEnemySystem(): EnemySystem | undefined {
    return this.game?.getSystem<EnemySystem>('EnemySystem');
  }

  private getEconomySystem(): EconomySystem | undefined {
    return this.game?.getSystem<EconomySystem>('EconomySystem');
  }

  destroy(): void {
    this.game = null;
  }
}
