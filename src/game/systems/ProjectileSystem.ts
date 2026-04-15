// Design Ref: §4.3 — Projectile movement, hit detection, and effect delivery

import type { Game, GameSystem } from '@/game/core/Game';
import type { DamageType, Position } from '@/types/common';
import type { StatusEffect } from '@/types/enemy';
import { PROJECTILE_SPEED } from '@/lib/constants';
import type { EnemySystem } from './EnemySystem';
import type { CombatSystem } from './CombatSystem';

type Projectile = {
  readonly id: string;
  readonly targetEnemyId: string;
  readonly damage: number;
  readonly damageType: DamageType;
  readonly splashRadius: number;
  readonly effects: readonly StatusEffect[];
  readonly chainCount: number;
  x: number;
  y: number;
};

export class ProjectileSystem implements GameSystem {
  readonly name = 'ProjectileSystem';

  private game: Game | null = null;
  private projectiles: Projectile[] = [];

  init(game: Game): void {
    this.game = game;
    this.projectiles = [];
  }

  createProjectile(
    source: Position,
    targetEnemyId: string,
    damage: number,
    damageType: DamageType,
    splashRadius: number,
    effects: readonly StatusEffect[] = [],
    chainCount: number = 0,
  ): void {
    this.projectiles.push({
      id: crypto.randomUUID(),
      targetEnemyId,
      damage,
      damageType,
      splashRadius,
      effects,
      chainCount,
      x: source.x,
      y: source.y,
    });
  }

  update(deltaTime: number): void {
    const enemySystem = this.getEnemySystem();
    const combatSystem = this.getCombatSystem();
    if (!enemySystem || !combatSystem) return;

    const toRemove: string[] = [];

    for (const proj of this.projectiles) {
      if (!enemySystem.isAlive(proj.targetEnemyId)) {
        toRemove.push(proj.id);
        continue;
      }

      const targetPos = enemySystem.getEnemyPosition(proj.targetEnemyId);
      if (!targetPos) { toRemove.push(proj.id); continue; }

      const dx = targetPos.x - proj.x;
      const dy = targetPos.y - proj.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const moveDistance = PROJECTILE_SPEED * deltaTime;

      if (moveDistance >= distance) {
        proj.x = targetPos.x;
        proj.y = targetPos.y;

        const enemy = enemySystem.findEnemy(proj.targetEnemyId);
        if (enemy) {
          combatSystem.dealDamage(
            enemy,
            proj.damage,
            proj.damageType,
            proj.splashRadius > 0 ? proj.splashRadius : undefined,
          );

          // Apply status effects
          if (proj.effects.length > 0) {
            combatSystem.applyEffects(proj.targetEnemyId, proj.effects);
          }

          // Chain lightning: find next target
          if (proj.chainCount > 0) {
            const nextTarget = this.findChainTarget(
              enemySystem, targetPos, proj.targetEnemyId
            );
            if (nextTarget) {
              this.createProjectile(
                targetPos,
                nextTarget,
                Math.floor(proj.damage * 0.85),
                proj.damageType,
                0,
                proj.effects,
                proj.chainCount - 1,
              );
            }
          }
        }

        toRemove.push(proj.id);
      } else {
        const ratio = moveDistance / distance;
        proj.x += dx * ratio;
        proj.y += dy * ratio;
      }
    }

    if (toRemove.length > 0) {
      const removeSet = new Set(toRemove);
      this.projectiles = this.projectiles.filter((p) => !removeSet.has(p.id));
    }
  }

  private findChainTarget(
    enemySystem: EnemySystem, fromPos: Position, excludeId: string
  ): string | null {
    const enemies = enemySystem.getEnemies();
    let closest: { id: string; dist: number } | null = null;

    for (const e of enemies) {
      if (e.id === excludeId) continue;
      const pos = enemySystem.getEnemyPosition(e.id);
      if (!pos) continue;
      const dx = pos.x - fromPos.x;
      const dy = pos.y - fromPos.y;
      const dist = dx * dx + dy * dy;
      if (dist < 200 * 200 && (!closest || dist < closest.dist)) {
        closest = { id: e.id, dist };
      }
    }
    return closest?.id ?? null;
  }

  getProjectiles(): readonly { readonly id: string; readonly x: number; readonly y: number }[] {
    return this.projectiles.map((p) => ({ id: p.id, x: p.x, y: p.y }));
  }

  getProjectileCount(): number {
    return this.projectiles.length;
  }

  private getEnemySystem(): EnemySystem | undefined {
    return this.game?.getSystem<EnemySystem>('EnemySystem');
  }

  private getCombatSystem(): CombatSystem | undefined {
    return this.game?.getSystem<CombatSystem>('CombatSystem');
  }

  destroy(): void {
    this.game = null;
    this.projectiles = [];
  }
}
