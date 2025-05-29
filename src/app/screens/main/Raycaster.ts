import { Container, Graphics } from "pixi.js";
import type { MazeCellType } from "../../utils/MazeGenerator";
import { COLOR_SHADES } from "../../utils/ColorPalette";
import { MazeCell } from "./MazeCell";

// Map MazeCellType to color key for COLOR_SHADES
const MAZE_CELL_TYPE_TO_COLOR_KEY: Record<
  MazeCellType,
  keyof typeof COLOR_SHADES
> = {
  path: "YELLOW_GREEN",
  wall: "DARK_GRAY",
  // Add more mappings if you have more types (e.g. entry, exit, etc.)
};

/**
 * Minimal Raycaster for a grid maze.
 * Renders a simple pseudo-3D view from the maze's entry point.
 */
export class Raycaster extends Container {
  private maze: MazeCellType[][];
  private cellGroups?: MazeCell[][];
  private graphics: Graphics;
  private player = { x: 1.5, y: 1, angle: 0 };
  private moveSpeed = 0.035;
  private rotSpeed = 0.015;
  private keys: Record<string, boolean> = {};
  private ticker?: any;
  private viewWidth: number;
  private viewHeight: number;

  constructor(
    maze: MazeCellType[][],
    _cellSize = 32,
    width = 640,
    height = 400,
    cellGroups?: MazeCell[][],
  ) {
    super();
    this.maze = maze;
    this.cellGroups = cellGroups;
    this.viewWidth = width;
    this.viewHeight = height;
    this.graphics = new Graphics();
    this.addChild(this.graphics);
    this.setupControls();
    this.startTicker();
    this.renderRaycastView();
  }

  public setSize(width: number, height: number) {
    this.viewWidth = width;
    this.viewHeight = height;
    this.renderRaycastView();
  }

  private setupControls() {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    this.keys[e.key.toLowerCase()] = true;
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys[e.key.toLowerCase()] = false;
  };

  private startTicker() {
    this.ticker = () => {
      let moved = false;
      // Forward (W or ArrowUp)
      if (this.keys["w"] || this.keys["arrowup"]) {
        moved =
          this.tryMove(
            Math.cos(this.player.angle) * this.moveSpeed,
            Math.sin(this.player.angle) * this.moveSpeed,
          ) || moved;
      }
      // Backward (S or ArrowDown)
      if (this.keys["s"] || this.keys["arrowdown"]) {
        moved =
          this.tryMove(
            -Math.cos(this.player.angle) * this.moveSpeed,
            -Math.sin(this.player.angle) * this.moveSpeed,
          ) || moved;
      }
      // Left (A or ArrowLeft)
      if (this.keys["a"] || this.keys["arrowleft"]) {
        this.player.angle -= this.rotSpeed;
        moved = true;
      }
      // Right (D or ArrowRight)
      if (this.keys["d"] || this.keys["arrowright"]) {
        this.player.angle += this.rotSpeed;
        moved = true;
      }
      if (moved) this.renderRaycastView();
      requestAnimationFrame(this.ticker);
    };
    requestAnimationFrame(this.ticker);
  }

  private tryMove(dx: number, dy: number): boolean {
    const nx = this.player.x + dx;
    const ny = this.player.y + dy;
    if (
      nx > 0 &&
      ny > 0 &&
      ny < this.maze.length &&
      nx < this.maze[0].length &&
      this.maze[Math.floor(ny)][Math.floor(nx)] !== "wall"
    ) {
      this.player.x = nx;
      this.player.y = ny;
      return true;
    }
    return false;
  }

  renderRaycastView() {
    this.graphics.clear();
    let width = this.viewWidth;
    let height = this.viewHeight;
    width = Math.max(width, 320);
    height = Math.max(height, 200);

    this.graphics.beginFill(0x222233);
    this.graphics.drawRect(0, 0, width, height / 2); // sky
    this.graphics.endFill();
    this.graphics.beginFill(0x222211);
    this.graphics.drawRect(0, height / 2, width, height / 2); // floor
    this.graphics.endFill();
    const numRays = Math.floor(width / 2); // More rays for wider screens
    const fov = Math.PI / 3;
    const player = this.player;
    const maxDepth = 8;
    for (let i = 0; i < numRays; i++) {
      const rayScreenX = i / numRays - 0.5;
      const rayAngle = player.angle + rayScreenX * fov;
      let dist = 0;
      let hit = false;
      let hitX = player.x;
      let hitY = player.y;
      let lastPathX = Math.floor(player.x);
      let lastPathY = Math.floor(player.y);
      while (!hit && dist < maxDepth) {
        dist += 0.02;
        hitX = player.x + Math.cos(rayAngle) * dist;
        hitY = player.y + Math.sin(rayAngle) * dist;
        const mx = Math.floor(hitX);
        const my = Math.floor(hitY);
        if (
          mx < 0 ||
          my < 0 ||
          my >= this.maze.length ||
          mx >= this.maze[0].length
        ) {
          hit = true;
        } else if (this.maze[my][mx] === "wall") {
          hit = true;
        } else {
          lastPathX = mx;
          lastPathY = my;
        }
      }
      // Fisheye correction
      const correctedDist = dist * Math.cos(rayAngle - player.angle);
      const sliceHeight = Math.max(10, (height * 1.5) / (correctedDist + 0.1));
      // Determine color for the last path cell using cellGroups if available
      let wallColor: number = COLOR_SHADES.YELLOW_GREEN[0];
      if (
        this.cellGroups &&
        this.cellGroups[lastPathY] &&
        this.cellGroups[lastPathY][lastPathX] &&
        this.maze[lastPathY][lastPathX] !== "wall"
      ) {
        const cell = this.cellGroups[lastPathY][lastPathX];
        // Use the cell's current shade
        wallColor = cell.shades[cell.shadeIndex] ?? COLOR_SHADES.YELLOW_GREEN[0];
      } else {
        // fallback to MazeCellType color
        let colorKey: keyof typeof COLOR_SHADES = "YELLOW_GREEN";
        if (
          this.maze[lastPathY] &&
          this.maze[lastPathY][lastPathX] &&
          this.maze[lastPathY][lastPathX] !== "wall"
        ) {
          const cellType = this.maze[lastPathY][lastPathX] as MazeCellType;
          colorKey = MAZE_CELL_TYPE_TO_COLOR_KEY[cellType] || "YELLOW_GREEN";
        }
        const shadeSteps = COLOR_SHADES[colorKey].length;
        const shadeIndex = Math.min(
          shadeSteps - 1,
          Math.floor((correctedDist / maxDepth) * shadeSteps),
        );
        wallColor = COLOR_SHADES[colorKey][shadeIndex];
      }
      this.graphics.beginFill(wallColor);
      this.graphics.drawRect(
        (i * width) / numRays,
        height / 2 - sliceHeight / 2,
        width / numRays + 1,
        sliceHeight,
      );
      this.graphics.endFill();
    }
  }

  public destroy(options?: any) {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    super.destroy(options);
  }
}
