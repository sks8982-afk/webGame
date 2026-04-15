// Design Ref: §2.1 — Main game class, manages PixiJS app + systems

import { Application, Container } from "pixi.js";
import { GameLoop } from "./GameLoop";
import { MapManager } from "@/game/managers/MapManager";
import type { StageDefinition } from "@/types/stage";
import type { GameSpeed } from "@/types/common";

export interface GameSystem {
  readonly name: string;
  init(game: Game): void;
  update(deltaTime: number): void;
  destroy(): void;
}

export class Game {
  readonly gameLoop: GameLoop;
  readonly mapManager: MapManager;
  private app: Application | null = null;
  private systems: GameSystem[] = [];
  private initialized = false;

  constructor() {
    this.gameLoop = new GameLoop({
      onUpdate: (dt) => this.update(dt),
    });
    this.mapManager = new MapManager();
  }

  async init(
    container: HTMLDivElement,
    width: number,
    height: number
  ): Promise<void> {
    if (this.initialized) return;

    this.app = new Application();
    await this.app.init({
      width,
      height,
      backgroundColor: 0x1a1a2e,
      antialias: false,
    });

    container.appendChild(this.app.canvas as HTMLCanvasElement);
    this.initialized = true;

    for (const system of this.systems) {
      system.init(this);
    }
  }

  getApp(): Application {
    if (!this.app) throw new Error("Game not initialized");
    return this.app;
  }

  getStage(): Container {
    return this.getApp().stage;
  }

  addSystem(system: GameSystem): void {
    if (this.systems.some((s) => s.name === system.name)) {
      throw new Error(`System "${system.name}" already exists.`);
    }
    this.systems.push(system);
    if (this.initialized) {
      system.init(this);
    }
  }

  removeSystem(name: string): void {
    const idx = this.systems.findIndex((s) => s.name === name);
    if (idx === -1) return;
    this.systems[idx].destroy();
    this.systems.splice(idx, 1);
  }

  getSystem<T extends GameSystem>(name: string): T | undefined {
    return this.systems.find((s) => s.name === name) as T | undefined;
  }

  loadStage(stageData: StageDefinition): void {
    this.mapManager.loadMap(stageData.path);
  }

  start(): void {
    this.gameLoop.start();
  }

  stop(): void {
    this.gameLoop.stop();
  }

  setSpeed(speed: GameSpeed): void {
    this.gameLoop.setSpeed(speed);
  }

  private update(deltaTime: number): void {
    for (const system of this.systems) {
      system.update(deltaTime);
    }
  }

  destroy(): void {
    this.gameLoop.stop();
    for (const system of [...this.systems].reverse()) {
      system.destroy();
    }
    this.systems = [];
    this.mapManager.destroy();
    if (this.app) {
      this.app.destroy(true);
      this.app = null;
    }
    this.initialized = false;
  }
}
