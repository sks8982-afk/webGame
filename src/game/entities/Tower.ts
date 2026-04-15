import { Container, Graphics } from 'pixi.js';
import type { TowerId, UpgradePath } from '@/types/tower';
import type { Position, DamageType } from '@/types/common';

export interface TowerStats {
  readonly attack: number;
  readonly attackSpeed: number;
  readonly range: number;
  readonly splashRadius: number;
  readonly damageType: DamageType;
}

const TOWER_COLORS: Readonly<Record<string, number>> = {
  archer: 0x22c55e,
  mage: 0x3b82f6,
  cannon: 0xef4444,
  frost: 0x06b6d4,
  poison: 0x8b5cf6,
  tesla: 0xeab308,
  bomb: 0xf97316,
  support: 0xd946ef,
} as const;

const TOWER_RADIUS = 16;

export class Tower {
  readonly id: string;
  readonly towerId: TowerId;
  readonly position: Position;
  readonly container: Container;

  private readonly stats: TowerStats;
  private _upgradePath: UpgradePath | null;
  private _upgradeLevel: number;
  private _equippedWeaponId: string | null;
  private _attackCooldown: number;
  private _currentTargetId: string | null;

  constructor(
    id: string,
    towerId: TowerId,
    position: Position,
    stats: TowerStats,
  ) {
    this.id = id;
    this.towerId = towerId;
    this.position = position;
    this.stats = stats;

    this._upgradePath = null;
    this._upgradeLevel = 0;
    this._equippedWeaponId = null;
    this._attackCooldown = 0;
    this._currentTargetId = null;

    this.container = new Container();
    this.container.position.set(position.x, position.y);

    const graphics = new Graphics();
    const color = TOWER_COLORS[towerId] ?? 0xffffff;
    graphics.circle(0, 0, TOWER_RADIUS);
    graphics.fill({ color });

    this.container.addChild(graphics);
  }

  get attack(): number {
    return this.stats.attack;
  }

  get attackSpeed(): number {
    return this.stats.attackSpeed;
  }

  get range(): number {
    return this.stats.range;
  }

  get splashRadius(): number {
    return this.stats.splashRadius;
  }

  get damageType(): DamageType {
    return this.stats.damageType;
  }

  get upgradePath(): UpgradePath | null {
    return this._upgradePath;
  }

  get upgradeLevel(): number {
    return this._upgradeLevel;
  }

  get equippedWeaponId(): string | null {
    return this._equippedWeaponId;
  }

  get attackCooldown(): number {
    return this._attackCooldown;
  }

  get currentTargetId(): string | null {
    return this._currentTargetId;
  }

  setUpgradePath(path: UpgradePath): Tower {
    const tower = this.clone();
    tower._upgradePath = path;
    return tower;
  }

  setUpgradeLevel(level: number): Tower {
    const tower = this.clone();
    tower._upgradeLevel = level;
    return tower;
  }

  setEquippedWeaponId(weaponId: string | null): Tower {
    const tower = this.clone();
    tower._equippedWeaponId = weaponId;
    return tower;
  }

  setCurrentTargetId(targetId: string | null): Tower {
    const tower = this.clone();
    tower._currentTargetId = targetId;
    return tower;
  }

  updateCooldown(dt: number): void {
    this._attackCooldown = Math.max(0, this._attackCooldown - dt);
  }

  canAttack(): boolean {
    return this._attackCooldown <= 0;
  }

  resetCooldown(): void {
    this._attackCooldown = 1 / this.stats.attackSpeed;
  }

  getRange(): number {
    return this.stats.range;
  }

  private clone(): Tower {
    const tower = new Tower(this.id, this.towerId, this.position, this.stats);
    tower._upgradePath = this._upgradePath;
    tower._upgradeLevel = this._upgradeLevel;
    tower._equippedWeaponId = this._equippedWeaponId;
    tower._attackCooldown = this._attackCooldown;
    tower._currentTargetId = this._currentTargetId;
    return tower;
  }
}
