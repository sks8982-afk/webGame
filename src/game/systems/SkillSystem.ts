// Active skill casting — meteor, thunder, berserk, guardian, earthquake, timewarp, armageddon

import type { Game, GameSystem } from "@/game/core/Game";
import type { EnemySystem } from "./EnemySystem";
import type { TowerSystem } from "./TowerSystem";
import type { CombatSystem } from "./CombatSystem";
import { useGameStore } from "@/stores/gameStore";
import { sfx } from "@/features/audio/sfxManager";

export class SkillSystem implements GameSystem {
  readonly name = "SkillSystem";
  private game: Game | null = null;
  private berserkTimer = 0;
  private guardianTimer = 0;

  init(game: Game): void {
    this.game = game;
    this.berserkTimer = 0;
    this.guardianTimer = 0;
  }

  update(deltaTime: number): void {
    useGameStore.getState().tickSkillCooldowns(deltaTime);
    if (this.berserkTimer > 0) this.berserkTimer = Math.max(0, this.berserkTimer - deltaTime);
    if (this.guardianTimer > 0) this.guardianTimer = Math.max(0, this.guardianTimer - deltaTime);
  }

  isBerserk(): boolean { return this.berserkTimer > 0; }
  isGuardian(): boolean { return this.guardianTimer > 0; }

  /**
   * Cast an active skill by ID. Returns true if successful.
   */
  cast(skillId: string, cooldown: number): boolean {
    const store = useGameStore.getState();
    if ((store.skillCooldowns[skillId] ?? 0) > 0) return false;

    const combat = this.game?.getSystem<CombatSystem>("CombatSystem");
    const enemies = this.game?.getSystem<EnemySystem>("EnemySystem");
    if (!combat || !enemies) return false;

    switch (skillId) {
      case "meteor_strike": {
        // Big fire damage in center of screen
        combat.applySplashDamage({ x: 640, y: 360 }, 250, 200, "fire");
        break;
      }
      case "thunder_storm": {
        // Damage ALL enemies
        for (const e of enemies.getEnemies()) {
          combat.dealDamage(e, 120, "lightning");
        }
        break;
      }
      case "berserk_mode": {
        this.berserkTimer = 15;
        break;
      }
      case "guardian_angel": {
        this.guardianTimer = 10;
        break;
      }
      case "earthquake": {
        for (const e of enemies.getEnemies()) {
          combat.dealDamage(e, 80, "physical");
          combat.applyEffects(e.id, [{ type: "stun", duration: 3, strength: 1 }]);
        }
        break;
      }
      case "time_warp": {
        for (const e of enemies.getEnemies()) {
          combat.applyEffects(e.id, [{ type: "slow", duration: 10, strength: 0.8 }]);
        }
        break;
      }
      case "armageddon": {
        for (const e of enemies.getEnemies()) {
          combat.dealDamage(e, e.currentHealth * 0.5 + 1, "magic");
        }
        break;
      }
      default:
        return false;
    }

    sfx.play("skill_cast");
    store.setSkillCooldown(skillId, cooldown);
    return true;
  }

  destroy(): void {
    this.game = null;
  }
}
