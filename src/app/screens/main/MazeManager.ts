import { MazeCell } from "./MazeCell";
import { COLOR_SHADES } from "../../utils/ColorPalette";

export class MazeManager {
  private groupCounter = 1;
  private groupShades: Map<number, number[]> = new Map();

  private paletteShades: number[][] = [
    COLOR_SHADES.YELLOW,
    COLOR_SHADES.DARK_GREEN,
    COLOR_SHADES.BLUE,
    COLOR_SHADES.PINK,
    COLOR_SHADES.ORANGE,
    COLOR_SHADES.LAVENDER,
    COLOR_SHADES.RED,
    COLOR_SHADES.PALE_BLUE,
    COLOR_SHADES.VIVID_PINK,
  ];

  public cellGroups: MazeCell[][] = [];

  constructor(cellGroups: MazeCell[][]) {
    this.cellGroups = cellGroups;
  }

  private getNextShades(): number[] {
    const idx = (this.groupCounter - 1) % this.paletteShades.length;
    return this.paletteShades[idx];
  }

  public handleCellClick(
    cell: MazeCell,
    x: number,
    y: number,
    onEntryExitConnected: (entry: MazeCell, exit: MazeCell) => void,
  ) {
    if (cell.groupId !== null) return; // Already colored

    // Find adjacent groups
    const adjacent = [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1],
    ]
      .filter(
        ([nx, ny]) =>
          nx >= 0 &&
          ny >= 0 &&
          nx < this.cellGroups[0].length &&
          ny < this.cellGroups.length,
      )
      .map(([nx, ny]) => this.cellGroups[ny][nx])
      .filter((c) => c.groupId !== null);

    const uniqueGroups = Array.from(new Set(adjacent.map((c) => c.groupId)));

    let groupId: number;
    let shades: number[];
    if (uniqueGroups.length === 0) {
      groupId = this.groupCounter++;
      shades = this.getNextShades();
      this.groupShades.set(groupId, shades);
    } else if (uniqueGroups.length === 1) {
      groupId = uniqueGroups[0]!;
      shades = this.groupShades.get(groupId)!;
    } else {
      groupId = uniqueGroups[0]!;
      shades = this.groupShades.get(groupId)!;
      for (let row of this.cellGroups) {
        for (let c of row) {
          if (c.groupId && uniqueGroups.includes(c.groupId)) {
            c.groupId = groupId;
            c.setColorKey(shades);
          }
        }
      }
      uniqueGroups.slice(1).forEach((gid) => this.groupShades.delete(gid!));
    }

    cell.groupId = groupId;
    cell.setColorKey(shades);

    this.checkEntryExitConnection(onEntryExitConnected);
  }

  public setupCellInteractions(
    cell: MazeCell,
    x: number,
    y: number,
    isMouseDown: () => boolean,
    onEntryExitConnected: (entry: MazeCell, exit: MazeCell) => void,
  ) {
    cell.on("pointertap", () =>
      this.handleCellClick(cell, x, y, onEntryExitConnected),
    );
    cell.on("pointerdown", () =>
      this.handleCellClick(cell, x, y, onEntryExitConnected),
    );
    cell.on("pointerover", () => {
      if (isMouseDown()) this.handleCellClick(cell, x, y, onEntryExitConnected);
    });
  }

  private checkEntryExitConnection(
    onEntryExitConnected: (entry: MazeCell, exit: MazeCell) => void,
  ) {
    const entryCell = this.cellGroups[1][0];
    const exitCell =
      this.cellGroups[this.cellGroups.length - 2][
        this.cellGroups[0].length - 1
      ];

    if (entryCell.groupId !== null && entryCell.groupId === exitCell.groupId) {
      onEntryExitConnected(entryCell, exitCell);
    }
  }
}
