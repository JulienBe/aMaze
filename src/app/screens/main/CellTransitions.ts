import { animate } from "motion";
import type { MazeCell } from "./MazeCell";

export type MazeCellTransition = (cell: MazeCell) => void;

export const CELL_TRANSITIONS: Record<string, MazeCellTransition> = {
  shade: (cell: MazeCell) => {
    let idx = cell.shades.length - 1;
    const target = cell.shadeIndex;
    cell.setShadeIndex(idx);
    const interval = setInterval(() => {
      idx--;
      if (idx >= target) {
        cell.setShadeIndex(idx);
      }
      if (idx <= target) {
        clearInterval(interval);
        cell.setShadeIndex(target);
      }
    }, 30);
  },
  scale: (cell: MazeCell) => {
    cell.scale.set(0, 0);
    animate(
      cell.scale,
      { x: 1, y: 1 },
      { duration: 0.25, ease: "backOut" }
    );
  },
  flyIn: (cell: MazeCell) => {
    // Get maze/container dimensions and cell size
    const parent = cell.parent;
    const mazeWidth = parent?.width ?? 0;
    const mazeHeight = parent?.height ?? 0;
    const cellSize = cell.width; // assuming square cells

    // Find closest border
    const distances = [
      { dir: "left",   dist: cell.x }, // distance to left
      { dir: "right",  dist: mazeWidth - cell.x - cellSize }, // to right
      { dir: "top",    dist: cell.y }, // to top
      { dir: "bottom", dist: mazeHeight - cell.y - cellSize }, // to bottom
    ];
    const closest = distances.reduce((a, b) => (a.dist < b.dist ? a : b));

    // Save original position
    const origX = cell.x;
    const origY = cell.y;

    // Move cell just outside the closest border
    switch (closest.dir) {
      case "left":
        cell.x = -cellSize;
        break;
      case "right":
        cell.x = mazeWidth + cellSize;
        break;
      case "top":
        cell.y = -cellSize;
        break;
      case "bottom":
        cell.y = mazeHeight + cellSize;
        break;
    }

    animate(
      cell,
      { x: origX, y: origY },
      { duration: 0.45, ease: "backOut" }
    );
  },
  // Add more transitions here!
};

export function pickCellTransition(): string {
  const keys = Object.keys(CELL_TRANSITIONS);
  return keys[Math.floor(Math.random() * keys.length)];
}