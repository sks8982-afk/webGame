// Design Ref: §3.3 — JSON data + texture loading

import { Assets, Texture } from "pixi.js";
import type { TowerDefinition, TowerId } from "@/types/tower";
import type { EnemyDefinition } from "@/types/enemy";
import type { StageDefinition } from "@/types/stage";
import type { WeaponDefinition } from "@/types/weapon";

const towerDataMap = new Map<TowerId, TowerDefinition>();
const enemyDataMap = new Map<string, EnemyDefinition>();
const stageDataMap = new Map<number, StageDefinition>();
const weaponDataMap = new Map<string, WeaponDefinition>();
const textureMap = new Map<string, Texture>();

let loaded = false;

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load asset: ${path} (${response.status})`);
  }
  return response.json() as Promise<T>;
}

const SPRITE_MANIFEST: Record<string, string> = {
  // Towers
  "tower_archer": "/sprites/towers/archer.jpg",
  "tower_mage": "/sprites/towers/mage.jpg",
  "tower_cannon": "/sprites/towers/cannon.jpg",
  "tower_frost": "/sprites/towers/frost.jpg",
  "tower_poison": "/sprites/towers/poison.jpg",
  "tower_tesla": "/sprites/towers/tesla.jpg",
  "tower_bomb": "/sprites/towers/bomb.jpg",
  "tower_support": "/sprites/towers/support.jpg",
  // Enemies
  "enemy_goblin": "/sprites/enemies/goblin.jpg",
  "enemy_wolf": "/sprites/enemies/wolf.jpg",
  "enemy_orc_warrior": "/sprites/enemies/orc_warrior.jpg",
  "enemy_bat": "/sprites/enemies/bat.jpg",
  "enemy_dark_mage": "/sprites/enemies/dark_mage.png",
  "enemy_ghost": "/sprites/enemies/ghost.png",
  "enemy_slime": "/sprites/enemies/slime.png",
  "enemy_healer": "/sprites/enemies/healer.png",
  "enemy_shield_bearer": "/sprites/enemies/shield_bearer.png",
  "enemy_rogue": "/sprites/enemies/rogue.png",
  "enemy_golem": "/sprites/enemies/golem.png",
  "enemy_dragon_whelp": "/sprites/enemies/dragon_whelp.png",
  "enemy_necromancer": "/sprites/enemies/necromancer.png",
  "enemy_berserker": "/sprites/enemies/berserker.png",
  "enemy_mimic": "/sprites/enemies/mimic.png",
  "enemy_boss_orc_chief": "/sprites/enemies/boss_orc_chief.jpg",
  "enemy_boss_red_dragon": "/sprites/enemies/boss_red_dragon.png",
  "enemy_boss_lich_king": "/sprites/enemies/boss_lich_king.png",
  "enemy_boss_demon_lord": "/sprites/enemies/boss_demon_lord.png",
  "enemy_boss_chaos_emperor": "/sprites/enemies/boss_chaos_emperor.png",
  // Tiles
  "tile_grass": "/sprites/tiles/grass.jpg",
  "tile_path": "/sprites/tiles/path.jpg",
  // Projectiles
  "proj_arrow": "/sprites/effects/arrow.jpg",
  "proj_fireball": "/sprites/effects/fireball.jpg",
  "proj_cannonball": "/sprites/effects/cannonball.jpg",
  // Skill icons
  "skill_meteor": "/sprites/effects/skill_meteor.png",
  "skill_thunder": "/sprites/effects/skill_thunder.png",
  "skill_berserk": "/sprites/effects/skill_berserk.png",
  "skill_guardian": "/sprites/effects/skill_guardian.png",
  "skill_earthquake": "/sprites/effects/skill_earthquake.png",
  "skill_timewarp": "/sprites/effects/skill_timewarp.png",
  "skill_armageddon": "/sprites/effects/skill_armageddon.png",
};

export class AssetLoader {
  static async loadAll(): Promise<void> {
    if (loaded) return;

    // Load JSON data
    const [towersObj, enemiesObj, stagesObj, weaponsObj] = await Promise.all([
      fetchJson<Record<string, TowerDefinition>>("/data/towers.json"),
      fetchJson<Record<string, EnemyDefinition>>("/data/enemies.json"),
      fetchJson<Record<string, StageDefinition>>("/data/stages.json"),
      fetchJson<Record<string, WeaponDefinition>>("/data/weapons.json"),
    ]);

    towerDataMap.clear();
    for (const tower of Object.values(towersObj)) {
      towerDataMap.set(tower.id, tower);
    }
    enemyDataMap.clear();
    for (const enemy of Object.values(enemiesObj)) {
      enemyDataMap.set(enemy.id, enemy);
    }
    stageDataMap.clear();
    for (const stage of Object.values(stagesObj)) {
      stageDataMap.set(stage.id, stage);
    }
    weaponDataMap.clear();
    for (const weapon of Object.values(weaponsObj)) {
      weaponDataMap.set(weapon.id, weapon);
    }

    // Load textures
    for (const [key, path] of Object.entries(SPRITE_MANIFEST)) {
      try {
        const texture = await Assets.load(path);
        textureMap.set(key, texture);
      } catch {
        // Texture not found — will fallback to Graphics
      }
    }

    loaded = true;
  }

  static getTowerData(id: TowerId): TowerDefinition | undefined {
    return towerDataMap.get(id);
  }

  static getEnemyData(id: string): EnemyDefinition | undefined {
    return enemyDataMap.get(id);
  }

  static getStageData(id: number): StageDefinition | undefined {
    return stageDataMap.get(id);
  }

  static getWeaponData(id: string): WeaponDefinition | undefined {
    return weaponDataMap.get(id);
  }

  static getAllWeapons(): readonly WeaponDefinition[] {
    return Array.from(weaponDataMap.values());
  }

  static getTexture(key: string): Texture | undefined {
    return textureMap.get(key);
  }

  static isLoaded(): boolean {
    return loaded;
  }
}
