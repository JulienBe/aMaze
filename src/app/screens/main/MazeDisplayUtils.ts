import { MazeCell } from "./MazeCell";
import { MazeRevealer, fillRevealQueueRandomPattern } from "./MazeRevealPatterns";
import { CELL_TRANSITIONS, pickCellTransition } from "./CellTransitions";
import { COLOR_SHADES } from "../../utils/ColorPalette";
import { generateMaze } from "../../utils/MazeGenerator";
import { engine } from "../../getEngine";

export function generateAndDisplayMaze(
  mainScreen: any, // MainScreen instance
  width: number,
  height: number
) {
  mainScreen.mainContainer.removeChildren();
  mainScreen.cellGroups = [];
  mainScreen.groupCounter = 1;
  mainScreen.groupShades.clear();

  mainScreen.mazeData = generateMaze(width, height);

  mainScreen.mazePixelWidth = mainScreen.mazeData[0].length * 32;
  mainScreen.mazePixelHeight = mainScreen.mazeData.length * 32;

  mainScreen.resize(engine().renderer.width, engine().renderer.height);

  for (let y = 0; y < mainScreen.mazeData.length; y++) {
    mainScreen.cellGroups[y] = [];
    for (let x = 0; x < mainScreen.mazeData[0].length; x++) {
      mainScreen.cellGroups[y][x] = null as any;
    }
  }

  // Pick a random transition for this maze
  mainScreen.cellTransitionKey = pickCellTransition();

  // Use the MazeRevealer utility
  if (mainScreen.mazeRevealer) mainScreen.mazeRevealer.stop();
  mainScreen.mazeRevealer = new MazeRevealer(
    mainScreen.mazeData,
    fillRevealQueueRandomPattern,
    (x: number, y: number) => {
      const type = mainScreen.mazeData[y][x];
      const colorShades = type === "wall" ? COLOR_SHADES.DARK_GRAY : COLOR_SHADES.YELLOW_GREEN;
      const shadeIndex = 0;
      const cell = new MazeCell(
        colorShades,
        shadeIndex,
        32,
        x * 32,
        y * 32
      );
      cell.interactive = type !== "wall";
      if (type !== "wall") {
        mainScreen.setupCellInteractions(cell, x, y);
      }
      mainScreen.mainContainer.addChild(cell);
      mainScreen.cellGroups[y][x] = cell;
      CELL_TRANSITIONS[mainScreen.cellTransitionKey](cell);
    }
  );
  mainScreen.mazeRevealer.start();
}