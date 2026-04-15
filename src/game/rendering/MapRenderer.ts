// Design Ref: §2.1 — Grid-based map rendering with free tower placement

import { Container, Graphics, TilingSprite } from "pixi.js";
import type { Position } from "@/types/common";
import { AssetLoader } from "@/game/core/AssetLoader";
import { GAME_WIDTH, GAME_HEIGHT } from "@/lib/constants";
import { MapManager, GRID_SIZE, GRID_COLS, GRID_ROWS } from "@/game/managers/MapManager";

const PATH_WIDTH = 36;

export class MapRenderer {
  readonly container: Container;
  private bgContainer: Container;
  private pathContainer: Container;
  private gridOverlay: Graphics;
  private hoverGraphics: Graphics;
  private mapManager: MapManager | null = null;
  private onCellClick: ((col: number, row: number) => void) | null = null;

  constructor() {
    this.container = new Container();
    this.bgContainer = new Container();
    this.pathContainer = new Container();
    this.gridOverlay = new Graphics();
    this.hoverGraphics = new Graphics();

    this.container.addChild(this.bgContainer);
    this.container.addChild(this.pathContainer);
    this.container.addChild(this.gridOverlay);
    this.container.addChild(this.hoverGraphics);
  }

  drawMap(
    path: readonly Position[],
    mapManager: MapManager,
    onCellClick: (col: number, row: number) => void
  ): void {
    this.mapManager = mapManager;
    this.onCellClick = onCellClick;

    this.drawBackground();
    this.drawPath(path);
    this.drawGridOverlay();
    this.setupInteraction();
  }

  private drawBackground(): void {
    const grassTex = AssetLoader.getTexture("tile_grass");
    if (grassTex) {
      const bg = new TilingSprite({ texture: grassTex, width: GAME_WIDTH, height: GAME_HEIGHT });
      this.bgContainer.addChild(bg);
    } else {
      const bg = new Graphics();
      bg.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      bg.fill({ color: 0x2d5a1e });
      this.bgContainer.addChild(bg);
    }
  }

  private drawPath(path: readonly Position[]): void {
    if (path.length < 2) return;

    const pathTex = AssetLoader.getTexture("tile_path");

    for (let i = 0; i < path.length - 1; i++) {
      const from = path[i];
      const to = path[i + 1];
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);

      if (pathTex) {
        const segment = new TilingSprite({
          texture: pathTex,
          width: length + PATH_WIDTH,
          height: PATH_WIDTH,
        });
        segment.anchor.set(0, 0.5);
        segment.position.set(from.x, from.y);
        segment.rotation = angle;
        this.pathContainer.addChild(segment);
      } else {
        const g = new Graphics();
        g.rect(0, -PATH_WIDTH / 2, length + 4, PATH_WIDTH);
        g.fill({ color: 0x8B6914 });
        g.position.set(from.x, from.y);
        g.rotation = angle;
        this.pathContainer.addChild(g);
      }
    }

    // Path border
    const borderG = new Graphics();
    for (let i = 0; i < path.length - 1; i++) {
      borderG.moveTo(path[i].x, path[i].y);
      borderG.lineTo(path[i + 1].x, path[i + 1].y);
    }
    borderG.stroke({ width: PATH_WIDTH + 4, color: 0x5a4a1e, alpha: 0.4 });
    this.pathContainer.addChildAt(borderG, 0);

    // Start (green)
    const start = path[0];
    const startG = new Graphics();
    startG.circle(0, 0, 14);
    startG.fill({ color: 0x44ff44, alpha: 0.7 });
    startG.position.set(start.x, start.y);
    this.pathContainer.addChild(startG);

    // End (red base)
    const end = path[path.length - 1];
    const endG = new Graphics();
    endG.roundRect(-16, -16, 32, 32, 4);
    endG.fill({ color: 0xcc2222, alpha: 0.8 });
    endG.roundRect(-12, -12, 24, 24, 3);
    endG.fill({ color: 0xff4444, alpha: 0.6 });
    endG.position.set(end.x, end.y);
    this.pathContainer.addChild(endG);
  }

  private drawGridOverlay(): void {
    // Subtle grid lines to show placement areas
    this.gridOverlay.clear();
    for (let col = 0; col <= GRID_COLS; col++) {
      this.gridOverlay.moveTo(col * GRID_SIZE, 0);
      this.gridOverlay.lineTo(col * GRID_SIZE, GAME_HEIGHT);
    }
    for (let row = 0; row <= GRID_ROWS; row++) {
      this.gridOverlay.moveTo(0, row * GRID_SIZE);
      this.gridOverlay.lineTo(GAME_WIDTH, row * GRID_SIZE);
    }
    this.gridOverlay.stroke({ width: 0.5, color: 0xffffff, alpha: 0.07 });
  }

  private setupInteraction(): void {
    // Full-canvas hit area for grid interaction
    const hitArea = new Graphics();
    hitArea.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    hitArea.fill({ color: 0x000000, alpha: 0.001 });
    hitArea.eventMode = "static";
    hitArea.cursor = "default";

    hitArea.on("pointermove", (e) => {
      const pos = e.global;
      const col = Math.floor(pos.x / GRID_SIZE);
      const row = Math.floor(pos.y / GRID_SIZE);
      this.drawHover(col, row);
    });

    hitArea.on("pointerleave", () => {
      this.hoverGraphics.clear();
    });

    hitArea.on("pointerdown", (e) => {
      const pos = e.global;
      const col = Math.floor(pos.x / GRID_SIZE);
      const row = Math.floor(pos.y / GRID_SIZE);
      if (this.onCellClick) this.onCellClick(col, row);
    });

    this.container.addChild(hitArea);
  }

  private drawHover(col: number, row: number): void {
    this.hoverGraphics.clear();
    if (!this.mapManager) return;

    const canPlace = this.mapManager.canPlaceTower(col, row);
    const x = col * GRID_SIZE;
    const y = row * GRID_SIZE;

    // Hover highlight
    this.hoverGraphics.rect(x, y, GRID_SIZE, GRID_SIZE);
    this.hoverGraphics.fill({
      color: canPlace ? 0x44ff44 : 0xff4444,
      alpha: canPlace ? 0.25 : 0.15,
    });
    this.hoverGraphics.rect(x, y, GRID_SIZE, GRID_SIZE);
    this.hoverGraphics.stroke({
      width: 2,
      color: canPlace ? 0x44ff44 : 0xff4444,
      alpha: 0.6,
    });
  }

  destroy(): void {
    this.bgContainer.destroy({ children: true });
    this.pathContainer.destroy({ children: true });
    this.gridOverlay.destroy();
    this.hoverGraphics.destroy();
    this.container.destroy();
  }
}
