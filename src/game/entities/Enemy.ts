import { Container, Graphics } from 'pixi.js';
import type { EnemyId } from '@/types/enemy';
import type { Position } from '@/types/common';
import type { StatusEffect } from '@/types/enemy';

export interface EnemyStats {
  readonly maxHealth: number;
  readonly speed: number;
  readonly armor: number;
  readonly magicResist: number;
  readonly goldReward: number;
  readonly isFlying: boolean;
  readonly isBoss: boolean;
}

const NORMAL_SIZE = 24;
const BOSS_SIZE = 40;
const HEALTH_BAR_HEIGHT = 4;
const HEALTH_BAR_OFFSET_Y = -4;

function lerpColor(from: number, to: number, t: number): number {
  const fromR = (from >> 16) & 0xff;
  const fromG = (from >> 8) & 0xff;
  const fromB = from & 0xff;
  const toR = (to >> 16) & 0xff;
  const toG = (to >> 8) & 0xff;
  const toB = to & 0xff;

  const r = Math.round(fromR + (toR - fromR) * t);
  const g = Math.round(fromG + (toG - fromG) * t);
  const b = Math.round(fromB + (toB - fromB) * t);

  return (r << 16) | (g << 8) | b;
}

export class Enemy {
  readonly id: string;
  readonly enemyId: EnemyId;
  readonly container: Container;

  private readonly _maxHealth: number;
  private readonly _speed: number;
  private readonly _armor: number;
  private readonly _magicResist: number;
  private readonly _goldReward: number;
  private readonly _isFlying: boolean;
  private readonly _isBoss: boolean;

  private _currentHealth: number;
  private _pathIndex: number;
  private _pathProgress: number;
  private _effects: StatusEffect[];
  private _bossPhase: number;

  private readonly healthBarGraphics: Graphics;
  private readonly bodySize: number;

  constructor(
    id: string,
    enemyId: EnemyId,
    stats: EnemyStats,
  ) {
    this.id = id;
    this.enemyId = enemyId;

    this._maxHealth = stats.maxHealth;
    this._currentHealth = stats.maxHealth;
    this._speed = stats.speed;
    this._armor = stats.armor;
    this._magicResist = stats.magicResist;
    this._goldReward = stats.goldReward;
    this._isFlying = stats.isFlying;
    this._isBoss = stats.isBoss;

    this._pathIndex = 0;
    this._pathProgress = 0;
    this._effects = [];
    this._bossPhase = 0;

    this.bodySize = stats.isBoss ? BOSS_SIZE : NORMAL_SIZE;

    this.container = new Container();

    const body = new Graphics();
    const bodyColor = stats.isBoss ? 0x8b0000 : 0xf97316;
    const half = this.bodySize / 2;
    body.rect(-half, -half, this.bodySize, this.bodySize);
    body.fill({ color: bodyColor });

    this.healthBarGraphics = new Graphics();
    this.drawHealthBar();

    this.container.addChild(body);
    this.container.addChild(this.healthBarGraphics);
  }

  get maxHealth(): number {
    return this._maxHealth;
  }

  get currentHealth(): number {
    return this._currentHealth;
  }

  get speed(): number {
    return this._speed;
  }

  get armor(): number {
    return this._armor;
  }

  get magicResist(): number {
    return this._magicResist;
  }

  get goldReward(): number {
    return this._goldReward;
  }

  get isFlying(): boolean {
    return this._isFlying;
  }

  get isBoss(): boolean {
    return this._isBoss;
  }

  get pathIndex(): number {
    return this._pathIndex;
  }

  get pathProgress(): number {
    return this._pathProgress;
  }

  get effects(): readonly StatusEffect[] {
    return this._effects;
  }

  get bossPhase(): number {
    return this._bossPhase;
  }

  setPathIndex(index: number): void {
    this._pathIndex = index;
  }

  setPathProgress(progress: number): void {
    this._pathProgress = progress;
  }

  setBossPhase(phase: number): void {
    this._bossPhase = phase;
  }

  takeDamage(amount: number): void {
    this._currentHealth = Math.max(0, this._currentHealth - amount);
    this.drawHealthBar();
  }

  isDead(): boolean {
    return this._currentHealth <= 0;
  }

  addEffect(effect: StatusEffect): void {
    this._effects = [...this._effects, effect];
  }

  updateEffects(dt: number): void {
    this._effects = this._effects
      .map((effect): StatusEffect => ({
        ...effect,
        duration: effect.duration - dt,
      }))
      .filter((effect) => effect.duration > 0);
  }

  getPosition(): Position {
    return {
      x: this.container.position.x,
      y: this.container.position.y,
    };
  }

  private drawHealthBar(): void {
    this.healthBarGraphics.clear();

    const healthPercent = this._currentHealth / this._maxHealth;
    const barWidth = this.bodySize;
    const half = barWidth / 2;
    const barY = -(this.bodySize / 2) + HEALTH_BAR_OFFSET_Y;

    // Background (dark gray)
    this.healthBarGraphics.rect(-half, barY, barWidth, HEALTH_BAR_HEIGHT);
    this.healthBarGraphics.fill({ color: 0x333333 });

    // Health fill: green (0x22c55e) to red (0xef4444) based on health percentage
    if (healthPercent > 0) {
      const fillColor = lerpColor(0xef4444, 0x22c55e, healthPercent);
      const fillWidth = barWidth * healthPercent;
      this.healthBarGraphics.rect(-half, barY, fillWidth, HEALTH_BAR_HEIGHT);
      this.healthBarGraphics.fill({ color: fillColor });
    }
  }
}
