// Design Ref: §4.1 — Tower placement, selling, targeting, and attack logic

import type { Game, GameSystem } from '@/game/core/Game';
import type { Position } from '@/types/common';
import type { TowerId, TowerInstance, TowerDefinition } from '@/types/tower';
import type { StatusEffect } from '@/types/enemy';
import { AssetLoader } from '@/game/core/AssetLoader';
import { TOWER_SELL_REFUND_RATE } from '@/lib/constants';
import { usePlayerStore, getWeaponPowerMultiplier } from '@/stores/playerStore';
import { sfx } from '@/features/audio/sfxManager';
import type { EnemySystem } from './EnemySystem';
import type { ProjectileSystem } from './ProjectileSystem';
import type { EconomySystem } from './EconomySystem';

export type TargetingMode = "first" | "last" | "strongest" | "weakest";

type MutableTowerInstance = TowerInstance & { upgradePath: "path1" | "path2" | "path3" | null; upgradeLevel: number };

type TowerRuntimeState = {
  instance: MutableTowerInstance;
  readonly definition: TowerDefinition;
  attackCooldown: number;
  supportBuff: number;
  targetingMode: TargetingMode;
};

export class TowerSystem implements GameSystem {
  readonly name = 'TowerSystem';

  private game: Game | null = null;
  private towers: TowerRuntimeState[] = [];

  init(game: Game): void {
    this.game = game;
    this.towers = [];
  }

  /**
   * Place a tower at the given position.
   * Deducts gold via EconomySystem. Returns the tower instance ID, or null if placement fails.
   */
  placeTower(towerId: TowerId, position: Position): string | null {
    const definition = AssetLoader.getTowerData(towerId);
    if (definition === undefined) {
      return null;
    }

    const economySystem = this.getEconomySystem();
    if (economySystem === undefined || !economySystem.canAfford(definition.baseCost)) {
      return null;
    }

    const success = economySystem.removeGold(definition.baseCost);
    if (!success) {
      return null;
    }

    const instance: MutableTowerInstance = {
      id: crypto.randomUUID(),
      towerId,
      position,
      level: 1,
      upgradePath: null,
      upgradeLevel: 0,
      equippedWeaponId: null,
    };

    this.towers.push({
      instance,
      definition,
      attackCooldown: 0,
      supportBuff: 0,
      targetingMode: "first",
    });

    sfx.play("tower_place");
    return instance.id;
  }

  /**
   * Sell a tower by its instance ID.
   * Refunds 50% of the base cost + 50% of upgrade costs spent.
   */
  sellTower(towerInstanceId: string): boolean {
    const index = this.towers.findIndex((t) => t.instance.id === towerInstanceId);
    if (index === -1) return false;

    const tower = this.towers[index];
    const sellUpgrade = usePlayerStore.getState().permanentUpgrades["sell_refund"] ?? 0;
    const sellBonus = [0, 10, 20, 30, 40][sellUpgrade] ?? 0;
    const refundRate = TOWER_SELL_REFUND_RATE + sellBonus / 100;

    let refund = Math.floor(tower.definition.baseCost * refundRate);
    if (tower.instance.upgradePath) {
      const path = tower.definition.upgrades[tower.instance.upgradePath];
      for (let i = 0; i < tower.instance.upgradeLevel; i++) {
        refund += Math.floor(path[i].cost * refundRate);
      }
    }

    const economySystem = this.getEconomySystem();
    economySystem?.addGold(refund);

    this.towers.splice(index, 1);
    sfx.play("tower_sell");
    return true;
  }

  /**
   * Upgrade a tower along a specific path.
   */
  upgradeTower(towerInstanceId: string, path: "path1" | "path2" | "path3"): boolean {
    const tower = this.towers.find((t) => t.instance.id === towerInstanceId);
    if (!tower) return false;

    // Must be same path or no path yet
    if (tower.instance.upgradePath && tower.instance.upgradePath !== path) return false;
    if (tower.instance.upgradeLevel >= 3) return false;

    const upgradeDef = tower.definition.upgrades[path][tower.instance.upgradeLevel];
    if (!upgradeDef) return false;

    const economy = this.getEconomySystem();
    if (!economy || !economy.removeGold(upgradeDef.cost)) return false;

    tower.instance.upgradePath = path;
    tower.instance.upgradeLevel += 1;
    return true;
  }

  /**
   * Set the targeting mode for a specific tower.
   */
  setTargetingMode(towerInstanceId: string, mode: TargetingMode): void {
    const tower = this.towers.find((t) => t.instance.id === towerInstanceId);
    if (tower) tower.targetingMode = mode;
  }

  update(deltaTime: number): void {
    const enemySystem = this.getEnemySystem();
    const projectileSystem = this.getProjectileSystem();

    if (enemySystem === undefined || projectileSystem === undefined) {
      return;
    }

    // Recalculate support buffs every frame — persistent aura
    this.updateSupportBuffs();

    for (const tower of this.towers) {
      // Reduce cooldown
      if (tower.attackCooldown > 0) {
        tower.attackCooldown = Math.max(0, tower.attackCooldown - deltaTime);
      }

      // Try to attack if cooldown is ready
      if (tower.attackCooldown <= 0) {
        // Support tower: no direct attack — buffs are handled in updateSupportBuffs
        if (tower.definition.id === "support") {
          tower.attackCooldown = 999; // skip this tower entirely
          continue;
        }

        const attackSpeed = this.getEffectiveAttackSpeed(tower);
        const attack = this.getEffectiveAttack(tower);
        const range = this.getEffectiveRange(tower);
        const effects = this.getTowerEffects(tower);

        // Frost & Poison: area effect — hit ALL enemies in range
        if (tower.definition.id === "frost" || tower.definition.id === "poison") {
          const enemiesInRange = this.findAllEnemiesInRange(tower, enemySystem);
          if (enemiesInRange.length > 0) {
            sfx.play(tower.definition.id === "frost" ? "tower_frost" : "tower_poison");
            const combatSystem = this.game?.getSystem<import('./CombatSystem').CombatSystem>('CombatSystem');
            for (const target of enemiesInRange) {
              if (combatSystem) {
                const enemy = enemySystem.findEnemy(target.enemyId);
                if (enemy) {
                  combatSystem.dealDamage(enemy, attack, tower.definition.damageType);
                  combatSystem.applyEffects(target.enemyId, effects);
                }
              }
            }
            tower.attackCooldown = 1 / attackSpeed;
          }
        } else {
          // Normal tower: single target projectile
          const target = this.findTarget(tower, enemySystem);
          if (target !== null) {
            const chainCount = this.getChainCount(tower);

            projectileSystem.createProjectile(
              tower.instance.position,
              target.enemyId,
              attack,
              tower.definition.damageType,
              tower.definition.splashRadius,
              effects,
              chainCount,
            );

            // Play tower-specific attack sound
            const sfxMap: Record<string, string> = {
              archer: "tower_archer", mage: "tower_mage", cannon: "tower_cannon",
              tesla: "tower_tesla", bomb: "tower_bomb",
            };
            const sfxId = sfxMap[tower.definition.id];
            if (sfxId) sfx.play(sfxId as Parameters<typeof sfx.play>[0]);

            tower.attackCooldown = 1 / attackSpeed;
          }
        }
      }
    }
  }

  /**
   * Find the best target: the enemy closest to the end of the path within range.
   * Priority: first enemy on path (highest pathProgress).
   */
  private findTarget(
    tower: TowerRuntimeState,
    enemySystem: EnemySystem,
  ): { enemyId: string; pathProgress: number } | null {
    const range = this.getEffectiveRange(tower);
    const enemies = enemySystem.getEnemies();
    const mode = tower.targetingMode;

    const candidates: { id: string; pathProgress: number; health: number }[] = [];
    for (const enemy of enemies) {
      const p = enemySystem.getEnemyPosition(enemy.id);
      if (!p) continue;
      const dx = p.x - tower.instance.position.x;
      const dy = p.y - tower.instance.position.y;
      if (dx * dx + dy * dy > range * range) continue;
      candidates.push({ id: enemy.id, pathProgress: enemy.pathProgress, health: enemy.currentHealth });
    }
    if (candidates.length === 0) return null;

    let chosen: { id: string; pathProgress: number; health: number };
    switch (mode) {
      case "first":
        chosen = candidates.reduce((a, b) => (b.pathProgress > a.pathProgress ? b : a));
        break;
      case "last":
        chosen = candidates.reduce((a, b) => (b.pathProgress < a.pathProgress ? b : a));
        break;
      case "strongest":
        chosen = candidates.reduce((a, b) => (b.health > a.health ? b : a));
        break;
      case "weakest":
        chosen = candidates.reduce((a, b) => (b.health < a.health ? b : a));
        break;
    }

    return { enemyId: chosen.id, pathProgress: chosen.pathProgress };
  }

  /**
   * Get effective attack value including upgrade + weapon bonuses.
   */
  private getEffectiveAttack(tower: TowerRuntimeState): number {
    let attack = tower.definition.baseAttack;

    if (tower.instance.upgradePath !== null) {
      const upgrades = tower.definition.upgrades[tower.instance.upgradePath];
      for (let i = 0; i < tower.instance.upgradeLevel; i++) {
        attack = attack + upgrades[i].attackBonus;
      }
    }

    // Permanent upgrades — global + per-tower
    const player = usePlayerStore.getState();
    const globalDmg = player.permanentUpgrades["global_damage"] ?? 0;
    const towerDmg = player.permanentUpgrades[`tower_${tower.instance.towerId}_damage`] ?? 0;
    const globalBonus = [0, 3, 6, 9, 12, 15, 18, 22, 26, 30, 35][globalDmg] ?? 0;
    const towerBonus = [0, 5, 10, 15, 22, 30][towerDmg] ?? 0;
    attack *= 1 + globalBonus / 100 + towerBonus / 100;

    // Best compatible weapon
    attack += this.getBestWeaponBonus(tower.instance.towerId);

    // Berserk mode active: x2 damage
    const skill = this.game?.getSystem<import("./SkillSystem").SkillSystem>("SkillSystem");
    if (skill?.isBerserk()) attack *= 2;

    return attack;
  }

  /** Find highest-value compatible weapon owned, returning effective bonus (base * enhance). */
  private getBestWeaponBonus(towerId: TowerId): number {
    const weapons = usePlayerStore.getState().weapons;
    let best = 0;

    for (const owned of weapons) {
      const def = AssetLoader.getWeaponData(owned.weaponId);
      if (!def) continue;

      const compatible =
        def.equipableOn === "all" ||
        (Array.isArray(def.equipableOn) && def.equipableOn.includes(towerId));
      if (!compatible) continue;

      const effective = def.attackBonus * getWeaponPowerMultiplier(owned.enhanceLevel);
      if (effective > best) best = effective;
    }
    return Math.round(best);
  }

  /**
   * Get effective attack speed including upgrade bonuses.
   */
  private getEffectiveAttackSpeed(tower: TowerRuntimeState): number {
    let speed = tower.definition.baseAttackSpeed;

    if (tower.instance.upgradePath !== null) {
      const upgrades = tower.definition.upgrades[tower.instance.upgradePath];
      for (let i = 0; i < tower.instance.upgradeLevel; i++) {
        speed = speed + upgrades[i].speedBonus;
      }
    }

    // Apply support tower buff (+30% per support in range, max +100%)
    speed = speed * (1 + tower.supportBuff);

    // Permanent global attack speed
    const player = usePlayerStore.getState();
    const globalSpd = player.permanentUpgrades["global_attack_speed"] ?? 0;
    const globalBonus = [0, 5, 10, 15, 20, 25][globalSpd] ?? 0;
    speed *= 1 + globalBonus / 100;

    // Berserk mode
    const skill = this.game?.getSystem<import("./SkillSystem").SkillSystem>("SkillSystem");
    if (skill?.isBerserk()) speed *= 2;

    return Math.max(0.1, speed);
  }

  /**
   * Get effective range including upgrade bonuses.
   */
  private getEffectiveRange(tower: TowerRuntimeState): number {
    let range = tower.definition.baseRange;

    if (tower.instance.upgradePath !== null) {
      const upgrades = tower.definition.upgrades[tower.instance.upgradePath];
      for (let i = 0; i < tower.instance.upgradeLevel; i++) {
        range = range + upgrades[i].rangeBonus;
      }
    }

    const player = usePlayerStore.getState();
    const globalRng = player.permanentUpgrades["global_range"] ?? 0;
    const towerRng = player.permanentUpgrades[`tower_${tower.instance.towerId}_range`] ?? 0;
    const globalBonus = [0, 5, 10, 15, 20, 25][globalRng] ?? 0;
    const towerBonus = [0, 5, 10, 15, 20, 25][towerRng] ?? 0;
    range *= 1 + globalBonus / 100 + towerBonus / 100;

    return range;
  }

  /**
   * Find ALL enemies within range (for area-effect towers like frost/poison).
   */
  private findAllEnemiesInRange(
    tower: TowerRuntimeState,
    enemySystem: EnemySystem,
  ): { enemyId: string }[] {
    const range = this.getEffectiveRange(tower);
    const enemies = enemySystem.getEnemies();
    const result: { enemyId: string }[] = [];

    for (const enemy of enemies) {
      const pos = enemySystem.getEnemyPosition(enemy.id);
      if (!pos) continue;

      const dx = pos.x - tower.instance.position.x;
      const dy = pos.y - tower.instance.position.y;
      if (dx * dx + dy * dy <= range * range) {
        result.push({ enemyId: enemy.id });
      }
    }
    return result;
  }

  /**
   * Get tower-specific status effects based on tower type.
   */
  private getTowerEffects(tower: TowerRuntimeState): StatusEffect[] {
    const effects: StatusEffect[] = [];

    switch (tower.definition.id) {
      case "frost":
        // Area slow — applied to all enemies in range
        effects.push({ type: "slow", duration: 3.0, strength: 0.35 });
        break;
      case "poison":
        // Area poison cloud — DOT to all enemies in range
        effects.push({ type: "poison", duration: 5.0, strength: 4 });
        break;
      case "tesla":
        // Chain lightning stun
        effects.push({ type: "stun", duration: 0.4, strength: 1 });
        break;
      case "mage":
        if (Math.random() < 0.25) {
          effects.push({ type: "burn", duration: 3.5, strength: 6 });
        }
        break;
      case "bomb":
        effects.push({ type: "stun", duration: 0.6, strength: 1 });
        break;
    }

    return effects;
  }

  /**
   * Tesla: chain 5 targets, wider search range, less damage decay
   */
  private getChainCount(tower: TowerRuntimeState): number {
    if (tower.definition.id === "tesla") return 5;
    return 0;
  }

  /**
   * Support tower aura: +30% attack speed for all towers in range.
   * Multiple supports stack additively up to +100%.
   */
  private updateSupportBuffs(): void {
    // Reset all buffs
    for (const tower of this.towers) {
      tower.supportBuff = 0;
    }

    // Apply support auras
    for (const support of this.towers) {
      if (support.definition.id !== "support") continue;
      const range = this.getEffectiveRange(support);
      const rangeSq = range * range;

      for (const target of this.towers) {
        if (target.instance.id === support.instance.id) continue;
        if (target.definition.id === "support") continue;

        const dx = target.instance.position.x - support.instance.position.x;
        const dy = target.instance.position.y - support.instance.position.y;
        if (dx * dx + dy * dy <= rangeSq) {
          target.supportBuff = Math.min(1.0, target.supportBuff + 0.3);
        }
      }
    }
  }

  /**
   * Check if tower has active support buff (for rendering indicator).
   */
  hasSupportBuff(towerId: string): boolean {
    const tower = this.towers.find((t) => t.instance.id === towerId);
    return (tower?.supportBuff ?? 0) > 0;
  }

  /**
   * Get all placed towers as readonly instances.
   */
  getTowers(): readonly TowerInstance[] {
    return this.towers.map((t) => t.instance);
  }

  /**
   * Find a tower by its instance ID.
   */
  findTower(id: string): TowerInstance | undefined {
    const tower = this.towers.find((t) => t.instance.id === id);
    return tower?.instance;
  }

  private getEnemySystem(): EnemySystem | undefined {
    return this.game?.getSystem<EnemySystem>('EnemySystem');
  }

  private getProjectileSystem(): ProjectileSystem | undefined {
    return this.game?.getSystem<ProjectileSystem>('ProjectileSystem');
  }

  private getEconomySystem(): EconomySystem | undefined {
    return this.game?.getSystem<EconomySystem>('EconomySystem');
  }

  destroy(): void {
    this.game = null;
    this.towers = [];
  }
}
