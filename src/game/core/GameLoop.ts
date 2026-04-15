export type GameSpeed = 1 | 2 | 3 | 4 | 5;

export type GameLoopOptions = {
  readonly onUpdate: (deltaTime: number) => void;
};

const MAX_DELTA_TIME = 0.1;

export class GameLoop {
  private readonly onUpdate: (deltaTime: number) => void;
  private animationFrameId: number | null = null;
  private lastTimestamp: number = 0;
  private running: boolean = false;
  private paused: boolean = false;
  private speed: GameSpeed = 1;

  constructor(options: GameLoopOptions) {
    this.onUpdate = options.onUpdate;
  }

  start(): void {
    if (this.running) {
      return;
    }
    this.running = true;
    this.paused = false;
    this.lastTimestamp = 0;
    this.scheduleFrame();
  }

  stop(): void {
    this.running = false;
    this.paused = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  pause(): void {
    if (!this.running || this.paused) {
      return;
    }
    this.paused = true;
  }

  resume(): void {
    if (!this.running || !this.paused) {
      return;
    }
    this.paused = false;
    this.lastTimestamp = 0;
    this.scheduleFrame();
  }

  setSpeed(speed: GameSpeed): void {
    this.speed = speed;
  }

  getSpeed(): GameSpeed {
    return this.speed;
  }

  isRunning(): boolean {
    return this.running;
  }

  isPaused(): boolean {
    return this.paused;
  }

  private scheduleFrame(): void {
    this.animationFrameId = requestAnimationFrame((timestamp) =>
      this.tick(timestamp)
    );
  }

  private tick(timestamp: number): void {
    if (!this.running || this.paused) {
      return;
    }

    if (this.lastTimestamp === 0) {
      this.lastTimestamp = timestamp;
      this.scheduleFrame();
      return;
    }

    const rawDelta = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;

    const clampedDelta = Math.min(rawDelta, MAX_DELTA_TIME);
    const scaledDelta = clampedDelta * this.speed;

    this.onUpdate(scaledDelta);

    this.scheduleFrame();
  }
}
