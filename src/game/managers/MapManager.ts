// Design Ref: §4 — Grid-based free placement map system

import type { Position } from "@/types/common";
import { GAME_WIDTH, GAME_HEIGHT } from "@/lib/constants";

export const GRID_SIZE = 40;
export const GRID_COLS = Math.floor(GAME_WIDTH / GRID_SIZE);
export const GRID_ROWS = Math.floor(GAME_HEIGHT / GRID_SIZE);

export type CellType = "grass" | "path" | "tower" | "blocked";

export class MapManager {
  private path: Position[] = [];
  private grid: CellType[][] = [];

  loadMap(path: readonly Position[]): void {
    this.path = [...path];

    // Initialize grid as all grass
    this.grid = [];
    for (let row = 0; row < GRID_ROWS; row++) {
      this.grid[row] = [];
      for (let col = 0; col < GRID_COLS; col++) {
        this.grid[row][col] = "grass";
      }
    }

    // Mark path cells as blocked
    this.markPathCells();

    // Block top 1 row (HUD area) and bottom 2 rows (tower panel area)
    for (let col = 0; col < GRID_COLS; col++) {
      this.grid[0][col] = "blocked";
      if (GRID_ROWS - 1 >= 0) this.grid[GRID_ROWS - 1][col] = "blocked";
      if (GRID_ROWS - 2 >= 0) this.grid[GRID_ROWS - 2][col] = "blocked";
    }
  }

  private markPathCells(): void {
    // Walk along path and only mark cells the path actually passes through.
    // Use fine sampling + path width (18px half-width) to detect crossings.
    const pathHalfWidth = 18;

    for (let i = 0; i < this.path.length - 1; i++) {
      const from = this.path[i];
      const to = this.path[i + 1];
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const steps = Math.ceil(length / 4); // very fine sampling

      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const px = from.x + dx * t;
        const py = from.y + dy * t;

        // Check cells within pathHalfWidth of this point
        const minCol = Math.floor((px - pathHalfWidth) / GRID_SIZE);
        const maxCol = Math.floor((px + pathHalfWidth) / GRID_SIZE);
        const minRow = Math.floor((py - pathHalfWidth) / GRID_SIZE);
        const maxRow = Math.floor((py + pathHalfWidth) / GRID_SIZE);

        for (let r = minRow; r <= maxRow; r++) {
          for (let c = minCol; c <= maxCol; c++) {
            if (r < 0 || r >= GRID_ROWS || c < 0 || c >= GRID_COLS) continue;

            // Distance from cell center to path point
            const cellCenterX = c * GRID_SIZE + GRID_SIZE / 2;
            const cellCenterY = r * GRID_SIZE + GRID_SIZE / 2;
            const ddx = cellCenterX - px;
            const ddy = cellCenterY - py;
            const dist = Math.sqrt(ddx * ddx + ddy * ddy);

            // Only block cells whose center is within (pathHalfWidth + cell radius)
            if (dist < pathHalfWidth + GRID_SIZE * 0.3) {
              this.grid[r][c] = "path";
            }
          }
        }
      }
    }
  }

  getPath(): readonly Position[] {
    return this.path;
  }

  getCellType(col: number, row: number): CellType {
    if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) return "blocked";
    return this.grid[row][col];
  }

  canPlaceTower(col: number, row: number): boolean {
    return this.getCellType(col, row) === "grass";
  }

  placeTower(col: number, row: number): boolean {
    if (!this.canPlaceTower(col, row)) return false;
    this.grid[row][col] = "tower";
    return true;
  }

  removeTower(col: number, row: number): void {
    if (row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS) {
      if (this.grid[row][col] === "tower") {
        this.grid[row][col] = "grass";
      }
    }
  }

  /** Convert grid cell to world center position */
  cellToWorld(col: number, row: number): Position {
    return {
      x: col * GRID_SIZE + GRID_SIZE / 2,
      y: row * GRID_SIZE + GRID_SIZE / 2,
    };
  }

  /** Convert world position to grid cell */
  worldToCell(x: number, y: number): { col: number; row: number } {
    return {
      col: Math.floor(x / GRID_SIZE),
      row: Math.floor(y / GRID_SIZE),
    };
  }

  getPathLength(): number {
    let length = 0;
    for (let i = 1; i < this.path.length; i++) {
      const dx = this.path[i].x - this.path[i - 1].x;
      const dy = this.path[i].y - this.path[i - 1].y;
      length += Math.sqrt(dx * dx + dy * dy);
    }
    return length;
  }

  getPositionAtDistance(distance: number): Position {
    if (this.path.length === 0) return { x: 0, y: 0 };
    if (distance <= 0) return this.path[0];

    let remaining = distance;
    for (let i = 1; i < this.path.length; i++) {
      const dx = this.path[i].x - this.path[i - 1].x;
      const dy = this.path[i].y - this.path[i - 1].y;
      const segmentLength = Math.sqrt(dx * dx + dy * dy);

      if (remaining <= segmentLength) {
        const t = remaining / segmentLength;
        return {
          x: this.path[i - 1].x + dx * t,
          y: this.path[i - 1].y + dy * t,
        };
      }
      remaining -= segmentLength;
    }

    return this.path[this.path.length - 1];
  }

  /** Check if grid cell is a path or adjacent to path (for visual grid overlay) */
  isPathCell(col: number, row: number): boolean {
    return this.getCellType(col, row) === "path";
  }

  destroy(): void {
    this.path = [];
    this.grid = [];
  }
}
