import { Container, Graphics } from 'pixi.js';
import type { Position, DamageType } from '@/types/common';
import type { StatusEffect } from '@/types/enemy';

export interface ProjectileConfig {
  readonly damage: number;
  readonly damageType: DamageType;
  readonly speed?: number;
  readonly splashRadius?: number;
  readonly effects?: readonly StatusEffect[];
}

const DEFAULT_SPEED = 300;
const PROJECTILE_RADIUS = 4;
const REACH_THRESHOLD = 4;

export class Projectile {
  readonly id: string;
  readonly sourceId: string;
  readonly targetId: string;
  readonly container: Container;

  private readonly _speed: number;
  private readonly _damage: number;
  private readonly _damageType: DamageType;
  private readonly _splashRadius: number;
  private readonly _effects: readonly StatusEffect[];

  private _x: number;
  private _y: number;

  constructor(
    id: string,
    sourceId: string,
    targetId: string,
    startPosition: Position,
    config: ProjectileConfig,
  ) {
    this.id = id;
    this.sourceId = sourceId;
    this.targetId = targetId;

    this._speed = config.speed ?? DEFAULT_SPEED;
    this._damage = config.damage;
    this._damageType = config.damageType;
    this._splashRadius = config.splashRadius ?? 0;
    this._effects = config.effects ?? [];

    this._x = startPosition.x;
    this._y = startPosition.y;

    this.container = new Container();
    this.container.position.set(this._x, this._y);

    const graphics = new Graphics();
    graphics.circle(0, 0, PROJECTILE_RADIUS);
    graphics.fill({ color: 0xffffff });

    this.container.addChild(graphics);
  }

  get speed(): number {
    return this._speed;
  }

  get damage(): number {
    return this._damage;
  }

  get damageType(): DamageType {
    return this._damageType;
  }

  get splashRadius(): number {
    return this._splashRadius;
  }

  get effects(): readonly StatusEffect[] {
    return this._effects;
  }

  get x(): number {
    return this._x;
  }

  get y(): number {
    return this._y;
  }

  /**
   * Move toward the target position. Returns true if the projectile has reached the target.
   */
  moveTo(targetPos: Position, dt: number): boolean {
    const dx = targetPos.x - this._x;
    const dy = targetPos.y - this._y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= REACH_THRESHOLD) {
      this._x = targetPos.x;
      this._y = targetPos.y;
      this.container.position.set(this._x, this._y);
      return true;
    }

    const moveDistance = this._speed * dt;

    if (moveDistance >= distance) {
      this._x = targetPos.x;
      this._y = targetPos.y;
      this.container.position.set(this._x, this._y);
      return true;
    }

    const dirX = dx / distance;
    const dirY = dy / distance;

    this._x += dirX * moveDistance;
    this._y += dirY * moveDistance;
    this.container.position.set(this._x, this._y);

    return false;
  }

  getPosition(): Position {
    return {
      x: this._x,
      y: this._y,
    };
  }
}
