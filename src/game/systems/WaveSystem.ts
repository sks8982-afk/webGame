// Design Ref: §4.5 — Wave progression, enemy spawning, and wave completion

import type { Game, GameSystem } from '@/game/core/Game';
import type { StageDefinition, WaveDefinition, EnemyGroup } from '@/types/stage';
import type { EnemyId } from '@/types/enemy';
import type { EnemySystem } from './EnemySystem';
import type { EconomySystem } from './EconomySystem';
import { useGameStore } from '@/stores/gameStore';
import { sfx } from '@/features/audio/sfxManager';

type SpawnQueueEntry = {
  readonly enemyId: EnemyId;
  delayRemaining: number;
};

export class WaveSystem implements GameSystem {
  readonly name = 'WaveSystem';

  private game: Game | null = null;
  private waves: readonly WaveDefinition[] = [];
  private currentWave: number = 0;
  private totalWaves: number = 0;
  private waveActive: boolean = false;
  private spawnQueue: SpawnQueueEntry[] = [];
  private spawnTimer: number = 0;
  private waveDelayTimer: number = 0;
  private waitingForWaveDelay: boolean = false;

  init(game: Game): void {
    this.game = game;
    this.resetState();
  }

  /**
   * Load waves from a stage definition and prepare for the first wave.
   */
  startStage(stageData: StageDefinition): void {
    this.resetState();
    this.waves = stageData.waves;
    this.totalWaves = stageData.waves.length;
    this.currentWave = 0;

    const store = useGameStore.getState();
    store.setWaveInfo(this.currentWave, this.totalWaves);
  }

  /**
   * Start the next wave. Returns false if all waves are complete.
   */
  startNextWave(): boolean {
    if (this.currentWave >= this.totalWaves) {
      return false;
    }

    const wave = this.waves[this.currentWave];
    this.waveActive = true;

    // Build spawn queue from wave groups
    this.spawnQueue = this.buildSpawnQueue(wave.groups);
    this.spawnTimer = 0;

    // Handle delay before wave starts
    if (wave.delayBeforeWave > 0) {
      this.waveDelayTimer = wave.delayBeforeWave;
      this.waitingForWaveDelay = true;
    } else {
      this.waitingForWaveDelay = false;
    }

    this.currentWave = this.currentWave + 1;

    const store = useGameStore.getState();
    store.setWaveInfo(this.currentWave, this.totalWaves);

    sfx.play("wave_start");
    return true;
  }

  update(deltaTime: number): void {
    if (!this.waveActive) {
      return;
    }

    // Handle pre-wave delay
    if (this.waitingForWaveDelay) {
      this.waveDelayTimer = this.waveDelayTimer - deltaTime;
      if (this.waveDelayTimer <= 0) {
        this.waitingForWaveDelay = false;
      }
      return;
    }

    // Process spawn queue
    if (this.spawnQueue.length > 0) {
      this.spawnTimer = this.spawnTimer + deltaTime;

      while (this.spawnQueue.length > 0) {
        const next = this.spawnQueue[0];

        if (this.spawnTimer >= next.delayRemaining) {
          this.spawnTimer = this.spawnTimer - next.delayRemaining;
          this.spawnQueue = this.spawnQueue.slice(1);
          this.spawnEnemy(next.enemyId);
        } else {
          // Update remaining delay for the head entry
          next.delayRemaining = next.delayRemaining - this.spawnTimer;
          this.spawnTimer = 0;
          break;
        }
      }
    }

    // Check wave completion: spawn queue empty AND no enemies alive
    if (this.spawnQueue.length === 0) {
      const enemySystem = this.getEnemySystem();
      if (enemySystem !== undefined && enemySystem.getEnemyCount() === 0) {
        this.onWaveComplete();
      }
    }
  }

  /**
   * Build a flat spawn queue from wave groups.
   * Each group has a delay before it starts, then enemies spawn at intervals.
   */
  private buildSpawnQueue(groups: readonly EnemyGroup[]): SpawnQueueEntry[] {
    const queue: SpawnQueueEntry[] = [];

    for (const group of groups) {
      for (let i = 0; i < group.count; i++) {
        const delay = i === 0 ? group.delayBeforeGroup : group.spawnInterval;
        queue.push({
          enemyId: group.enemyId,
          delayRemaining: delay,
        });
      }
    }

    return queue;
  }

  private spawnEnemy(enemyId: EnemyId): void {
    const enemySystem = this.getEnemySystem();
    if (enemySystem !== undefined) {
      enemySystem.spawnEnemy(enemyId);
    }
  }

  private onWaveComplete(): void {
    this.waveActive = false;

    const economySystem = this.getEconomySystem();
    economySystem?.awardWaveClearBonus(this.currentWave);

    const store = useGameStore.getState();

    if (this.currentWave >= this.totalWaves) {
      if (store.isEndless) {
        // Endless mode: record wave, reset & loop with harder scaling
        store.setEndlessWave(store.endlessWave + this.totalWaves);
        this.currentWave = 0;
        store.setWaveInfo(0, this.totalWaves);
        store.setGameState('wave_complete');
      } else {
        store.setGameState('stage_clear');
      }
    } else {
      store.setGameState('wave_complete');
    }
  }

  /**
   * Get current wave number (1-indexed).
   */
  getCurrentWave(): number {
    return this.currentWave;
  }

  /**
   * Get total number of waves.
   */
  getTotalWaves(): number {
    return this.totalWaves;
  }

  /**
   * Check if a wave is currently active.
   */
  isWaveActive(): boolean {
    return this.waveActive;
  }

  /**
   * Check if all waves have been completed.
   */
  isStageComplete(): boolean {
    return this.currentWave >= this.totalWaves && !this.waveActive;
  }

  /**
   * Skip the current pre-wave delay and start spawning immediately.
   * Returns bonus gold amount (proportional to seconds saved).
   */
  skipWaveDelay(): number {
    if (!this.waitingForWaveDelay) return 0;
    const saved = this.waveDelayTimer;
    this.waveDelayTimer = 0;
    this.waitingForWaveDelay = false;
    const bonus = Math.max(10, Math.floor(saved * 10));
    this.getEconomySystem()?.addGold(bonus);
    return bonus;
  }

  /**
   * Force-start the next wave (when between waves)
   */
  forceStartNextWave(): number {
    if (this.waveActive) return 0;
    const bonus = 50 + this.currentWave * 5;
    this.getEconomySystem()?.addGold(bonus);
    this.startNextWave();
    return bonus;
  }

  /**
   * Is currently waiting before a wave (for skip button display)
   */
  isWaitingForWave(): boolean {
    return this.waitingForWaveDelay;
  }

  getWaveDelayTimer(): number {
    return this.waveDelayTimer;
  }

  private resetState(): void {
    this.waves = [];
    this.currentWave = 0;
    this.totalWaves = 0;
    this.waveActive = false;
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.waveDelayTimer = 0;
    this.waitingForWaveDelay = false;
  }

  private getEnemySystem(): EnemySystem | undefined {
    return this.game?.getSystem<EnemySystem>('EnemySystem');
  }

  private getEconomySystem(): EconomySystem | undefined {
    return this.game?.getSystem<EconomySystem>('EconomySystem');
  }

  destroy(): void {
    this.game = null;
    this.resetState();
  }
}
