// Design Ref: §2.2 — RenderSystem: renders game entities using sprite images

import { Container, Graphics, Sprite, Text } from "pixi.js";
import type { Game, GameSystem } from "@/game/core/Game";
import type { EnemySystem } from "./EnemySystem";
import type { TowerSystem } from "./TowerSystem";
import type { ProjectileSystem } from "./ProjectileSystem";
import { AssetLoader } from "@/game/core/AssetLoader";
import { useUIStore } from "@/stores/uiStore";
import { GAME_WIDTH, GAME_HEIGHT } from "@/lib/constants";

const TOWER_COLORS: Record<string, number> = {
  archer: 0x44cc44, mage: 0x4488ff, cannon: 0xcc4444, frost: 0x66ccff,
  poison: 0x88cc00, tesla: 0xffff44, bomb: 0xff6600, support: 0xffaaff,
};

const PROJ_TEXTURE_MAP: Record<string, string> = {
  physical: "proj_arrow", magic: "proj_fireball", fire: "proj_fireball",
  ice: "proj_arrow", lightning: "proj_arrow", poison: "proj_arrow",
};

export class RenderSystem implements GameSystem {
  readonly name = "RenderSystem";

  private game: Game | null = null;
  private enemyContainer: Container = new Container();
  private towerContainer: Container = new Container();
  private projectileContainer: Container = new Container();
  private damageTextContainer: Container = new Container();
  private rangeIndicator: Graphics = new Graphics();

  private enemySprites: Map<string, { sprite: Sprite | Graphics; hpBar: Graphics; hpBg: Graphics }> = new Map();
  private towerSprites: Map<string, Sprite | Graphics> = new Map();
  private projectileSprites: Map<string, Sprite | Graphics> = new Map();

  init(game: Game): void {
    this.game = game;
    const stage = game.getStage();

    // No background here — MapRenderer handles background + path
    stage.addChild(this.rangeIndicator);
    stage.addChild(this.towerContainer);
    stage.addChild(this.enemyContainer);
    stage.addChild(this.projectileContainer);
    stage.addChild(this.damageTextContainer);
  }

  update(deltaTime: number): void {
    this.renderEnemies();
    this.renderTowers();
    this.renderProjectiles();
    this.renderRangeIndicator();
    this.updateDamageTexts(deltaTime);
  }

  showDamage(x: number, y: number, amount: number, isCrit: boolean): void {
    const text = new Text({
      text: Math.round(amount).toString(),
      style: {
        fontSize: isCrit ? 18 : 14,
        fill: isCrit ? 0xff4444 : 0xffffff,
        fontWeight: "bold",
        stroke: { color: 0x000000, width: 2 },
      },
    });
    text.position.set(x - 10, y - 20);
    text.alpha = 1;
    (text as unknown as Record<string, number>)._lifetime = 0;
    this.damageTextContainer.addChild(text);
  }

  private updateDamageTexts(dt: number): void {
    const toRemove: Text[] = [];
    for (const child of this.damageTextContainer.children) {
      const t = child as Text & { _lifetime: number };
      t._lifetime = (t._lifetime || 0) + dt;
      t.y -= 30 * dt;
      t.alpha = Math.max(0, 1 - t._lifetime / 0.8);
      if (t._lifetime > 0.8) toRemove.push(t);
    }
    for (const t of toRemove) {
      this.damageTextContainer.removeChild(t);
      t.destroy();
    }
  }

  private renderRangeIndicator(): void {
    this.rangeIndicator.clear();
    const towerSystem = this.game?.getSystem<TowerSystem>("TowerSystem");
    if (!towerSystem) return;

    const uiState = useUIStore.getState();

    if (uiState.selectedTowerId) {
      const towerDef = AssetLoader.getTowerData(uiState.selectedTowerId);
      if (towerDef && uiState.hoveredSlot) {
        const color = TOWER_COLORS[uiState.selectedTowerId] ?? 0xaaaaaa;
        this.rangeIndicator.circle(uiState.hoveredSlot.x, uiState.hoveredSlot.y, towerDef.baseRange);
        this.rangeIndicator.fill({ color, alpha: 0.08 });
        this.rangeIndicator.circle(uiState.hoveredSlot.x, uiState.hoveredSlot.y, towerDef.baseRange);
        this.rangeIndicator.stroke({ width: 1.5, color, alpha: 0.4 });
      }
    }

    if (uiState.selectedPlacedTowerId) {
      const tower = towerSystem.findTower(uiState.selectedPlacedTowerId);
      if (tower) {
        const towerDef = AssetLoader.getTowerData(tower.towerId);
        if (towerDef) {
          const color = TOWER_COLORS[tower.towerId] ?? 0xaaaaaa;
          this.rangeIndicator.circle(tower.position.x, tower.position.y, towerDef.baseRange);
          this.rangeIndicator.fill({ color, alpha: 0.1 });
          this.rangeIndicator.circle(tower.position.x, tower.position.y, towerDef.baseRange);
          this.rangeIndicator.stroke({ width: 1.5, color, alpha: 0.5 });
        }
      }
    }
  }

  private createSpriteOrFallback(textureKey: string, fallbackColor: number, size: number): Sprite | Graphics {
    const tex = AssetLoader.getTexture(textureKey);
    if (tex) {
      const sprite = new Sprite(tex);
      sprite.width = size;
      sprite.height = size;
      sprite.anchor.set(0.5);
      return sprite;
    }
    const g = new Graphics();
    g.roundRect(-size / 2, -size / 2, size, size, 3);
    g.fill({ color: fallbackColor });
    return g;
  }

  private renderEnemies(): void {
    const enemySystem = this.game?.getSystem<EnemySystem>("EnemySystem");
    if (!enemySystem) return;

    const enemies = enemySystem.getEnemies();
    const aliveIds = new Set(enemies.map((e) => e.id));

    for (const [id, sprites] of this.enemySprites) {
      if (!aliveIds.has(id)) {
        this.enemyContainer.removeChild(sprites.sprite);
        this.enemyContainer.removeChild(sprites.hpBg);
        this.enemyContainer.removeChild(sprites.hpBar);
        sprites.sprite.destroy();
        sprites.hpBg.destroy();
        sprites.hpBar.destroy();
        this.enemySprites.delete(id);
      }
    }

    for (const enemy of enemies) {
      const pos = enemySystem.getEnemyPosition(enemy.id);
      if (!pos) continue;

      const def = AssetLoader.getEnemyData(enemy.enemyId);
      const isBoss = def?.isBoss ?? false;
      const size = isBoss ? 64 : 42;

      let sprites = this.enemySprites.get(enemy.id);
      if (!sprites) {
        const textureKey = `enemy_${enemy.enemyId}`;
        const sprite = this.createSpriteOrFallback(textureKey, isBoss ? 0x990000 : 0xdd8833, size);

        const hpBg = new Graphics();
        hpBg.rect(-size / 2, -size / 2 - 8, size, 4);
        hpBg.fill({ color: 0x333333 });

        const hpBar = new Graphics();

        this.enemyContainer.addChild(sprite);
        this.enemyContainer.addChild(hpBg);
        this.enemyContainer.addChild(hpBar);

        sprites = { sprite, hpBg, hpBar };
        this.enemySprites.set(enemy.id, sprites);
      }

      sprites.sprite.position.set(pos.x, pos.y);
      sprites.hpBg.position.set(pos.x, pos.y);

      const hpRatio = enemy.currentHealth / enemy.maxHealth;
      const barColor = hpRatio > 0.5 ? 0x44cc44 : hpRatio > 0.25 ? 0xcccc44 : 0xcc4444;
      sprites.hpBar.clear();
      sprites.hpBar.rect(-size / 2, -size / 2 - 8, size * hpRatio, 4);
      sprites.hpBar.fill({ color: barColor });
      sprites.hpBar.position.set(pos.x, pos.y);

      // Status effect tint
      let tint = 0xffffff;
      for (const eff of enemy.effects) {
        if (eff.type === "freeze" || eff.type === "slow") tint = 0x88ccff;
        else if (eff.type === "burn") tint = 0xff6600;
        else if (eff.type === "poison") tint = 0x88ff00;
      }
      if (sprites.sprite instanceof Sprite) {
        sprites.sprite.tint = tint;
      }
    }
  }

  private renderTowers(): void {
    const towerSystem = this.game?.getSystem<TowerSystem>("TowerSystem");
    if (!towerSystem) return;

    const towers = towerSystem.getTowers();
    const aliveIds = new Set(towers.map((t) => t.id));

    for (const [id, sprite] of this.towerSprites) {
      if (!aliveIds.has(id)) {
        this.towerContainer.removeChild(sprite);
        sprite.destroy();
        this.towerSprites.delete(id);
      }
    }

    for (const tower of towers) {
      if (!this.towerSprites.has(tower.id)) {
        const textureKey = `tower_${tower.towerId}`;
        const sprite = this.createSpriteOrFallback(textureKey, TOWER_COLORS[tower.towerId] ?? 0xaaaaaa, 52);

        sprite.position.set(tower.position.x, tower.position.y);
        sprite.eventMode = "static";
        sprite.cursor = "pointer";
        if (sprite instanceof Sprite) {
          sprite.on("pointerdown", () => {
            const ui = useUIStore.getState();
            ui.selectPlacedTower(ui.selectedPlacedTowerId === tower.id ? null : tower.id);
          });
        }

        this.towerContainer.addChild(sprite);
        this.towerSprites.set(tower.id, sprite);
      }

      // Visual buff indicator
      const hasBuff = towerSystem.hasSupportBuff(tower.id);
      const spr = this.towerSprites.get(tower.id);
      if (spr) {
        if (hasBuff && spr instanceof Sprite) {
          spr.tint = 0xffccff; // pink glow for buffed towers
        } else if (spr instanceof Sprite) {
          spr.tint = 0xffffff;
        }
      }
    }
  }

  private renderProjectiles(): void {
    const projSystem = this.game?.getSystem<ProjectileSystem>("ProjectileSystem");
    if (!projSystem) return;

    const projectiles = projSystem.getProjectiles();
    const aliveIds = new Set(projectiles.map((p) => p.id));

    for (const [id, sprite] of this.projectileSprites) {
      if (!aliveIds.has(id)) {
        this.projectileContainer.removeChild(sprite);
        sprite.destroy();
        this.projectileSprites.delete(id);
      }
    }

    for (const proj of projectiles) {
      let sprite = this.projectileSprites.get(proj.id);
      if (!sprite) {
        // Try to use projectile texture based on damage type
        const texKey = PROJ_TEXTURE_MAP["physical"] ?? "proj_arrow";
        sprite = this.createSpriteOrFallback(texKey, 0xffffcc, 16);
        this.projectileContainer.addChild(sprite);
        this.projectileSprites.set(proj.id, sprite);
      }
      sprite.position.set(proj.x, proj.y);
    }
  }

  destroy(): void {
    for (const [, s] of this.enemySprites) {
      s.sprite.destroy(); s.hpBg.destroy(); s.hpBar.destroy();
    }
    this.enemySprites.clear();
    for (const [, s] of this.towerSprites) s.destroy();
    this.towerSprites.clear();
    for (const [, s] of this.projectileSprites) s.destroy();
    this.projectileSprites.clear();

    this.rangeIndicator.destroy();
    this.enemyContainer.destroy();
    this.towerContainer.destroy();
    this.projectileContainer.destroy();
    this.damageTextContainer.destroy();
    this.game = null;
  }
}
