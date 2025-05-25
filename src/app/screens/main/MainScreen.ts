import { FancyButton } from "@pixi/ui";
import { animate } from "motion";
import type { AnimationPlaybackControls } from "motion/react";
import type { Ticker } from "pixi.js";
import { Container } from "pixi.js";

import { engine } from "../../getEngine";
import { PausePopup } from "../../popups/PausePopup";
import { SettingsPopup } from "../../popups/SettingsPopup";
import { generateMaze } from "../../utils/MazeGenerator";
import { COLOR_SHADES } from "../../utils/ColorPalette";

import { MazeCell } from "./MazeCell";

/** The screen that holds the app */
export class MainScreen extends Container {
  /** Assets bundles required by this screen */
  public static assetBundles = ["main"];

  public mainContainer: Container;
  private settingsButton: FancyButton;
  private paused = false;
  private mazePixelWidth = 0;
  private mazePixelHeight = 0;

  private groupCounter = 1;
  private cellGroups: MazeCell[][] = [];

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

  private getNextShades(): number[] {
    const idx = (this.groupCounter - 1) % this.paletteShades.length;
    return this.paletteShades[idx];
  }

  private handleCellClick = (cell: MazeCell, x: number, y: number) => {
    if (cell.groupId !== null) return; // Already colored

    // Find adjacent groups
    const adjacent = [
      [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]
    ].filter(([nx, ny]) =>
      nx >= 0 && ny >= 0 &&
      nx < this.cellGroups[0].length && ny < this.cellGroups.length
    ).map(([nx, ny]) => this.cellGroups[ny][nx])
     .filter(c => c.groupId !== null);

    const uniqueGroups = Array.from(new Set(adjacent.map(c => c.groupId)));

    let groupId: number;
    let shades: number[];
    if (uniqueGroups.length === 0) {
      // New group
      groupId = this.groupCounter++;
      shades = this.getNextShades();
      this.groupShades.set(groupId, shades);
    } else if (uniqueGroups.length === 1) {
      // Join existing group
      groupId = uniqueGroups[0]!;
      shades = this.groupShades.get(groupId)!;
    } else {
      // Merge groups
      groupId = uniqueGroups[0]!;
      shades = this.groupShades.get(groupId)!;
      // Update all cells in merged groups
      for (let row of this.cellGroups) {
        for (let c of row) {
          if (c.groupId && uniqueGroups.includes(c.groupId)) {
            c.groupId = groupId;
            c.setColorKey(shades);
          }
        }
      }
      // Remove merged group shades
      uniqueGroups.slice(1).forEach(gid => this.groupShades.delete(gid!));
    }

    cell.groupId = groupId;
    cell.setColorKey(shades);

    // --- SPECIAL: Check if entry and exit are connected ---
    const entryCell = this.cellGroups[1][0];
    const exitCell = this.cellGroups[this.cellGroups.length - 2][this.cellGroups[0].length - 1];
    if (
      entryCell.groupId !== null &&
      entryCell.groupId === exitCell.groupId
    ) {
      this.onPathConnected(entryCell.groupId, shades);
    }
  };

  private onPathConnected(groupId: number, shades: number[]) {
    // Example: Animate all cells in the connected group to use a special shade
    for (let row of this.cellGroups) {
      for (let cell of row) {
        if (cell.groupId === groupId) {
          cell.setShadeIndex(1); // Use a different shade index for highlight
        }
      }
    }
    // You could also trigger a sound, popup, or animation here!
  }

  constructor() {
    super();

    this.mainContainer = new Container();
    this.addChild(this.mainContainer);

    const buttonAnimations = {
      hover: {
        props: {
          scale: { x: 1.1, y: 1.1 },
        },
        duration: 100,
      },
      pressed: {
        props: {
          scale: { x: 0.9, y: 0.9 },
        },
        duration: 100,
      },
    };

    this.settingsButton = new FancyButton({
      defaultView: "icon-settings.png",
      anchor: 0.5,
      animations: buttonAnimations,
    });
    this.settingsButton.onPress.connect(async () => {
      await engine().navigation.presentPopup(SettingsPopup);
      const popup = engine().navigation.currentPopup as SettingsPopup;
      if (popup) {
        popup.prepare(this.mazePixelWidth / 32, this.mazePixelHeight / 32); // or store mazeWidth/mazeHeight as properties
        popup.onApply = (width, height) => {
          this.generateAndDisplayMaze(width, height);
        };
      }
    });
    this.addChild(this.settingsButton);


    // Initial maze
    this.generateAndDisplayMaze(15, 21);
  }

  /** Prepare the screen just before showing */
  public prepare() {}

  /** Update the screen */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public update(_time: Ticker) {
    if (this.paused) return;
  }

  /** Pause gameplay - automatically fired when a popup is presented */
  public async pause() {
    this.mainContainer.interactiveChildren = false;
    this.paused = true;
  }

  /** Resume gameplay */
  public async resume() {
    this.mainContainer.interactiveChildren = true;
    this.paused = false;
  }

  /** Fully reset */
  public reset() {}

  /** Resize the screen, fired whenever window size changes */
  public resize(width: number, height: number) {
    // Center the maze
    this.mainContainer.x = (width - this.mazePixelWidth) / 2;
    this.mainContainer.y = (height - this.mazePixelHeight) / 2;

    this.settingsButton.x = width - 30;
    this.settingsButton.y = 30;
  }

  /** Show screen with animations */
  public async show(): Promise<void> {
    const elementsToAnimate = [
      this.settingsButton,
    ];

    let finalPromise!: AnimationPlaybackControls;
    for (const element of elementsToAnimate) {
      element.alpha = 0;
      finalPromise = animate(
        element,
        { alpha: 1 },
        { duration: 0.3, delay: 0.75, ease: "backOut" },
      );
    }

    await finalPromise;
  }

  /** Hide screen with animations */
  public async hide() {}

  /** Auto pause the app when window go out of focus */
  public blur() {
    if (!engine().navigation.currentPopup) {
      engine().navigation.presentPopup(PausePopup);
    }
  }

  private generateAndDisplayMaze(width: number, height: number) {
    // Remove old maze cells
    this.mainContainer.removeChildren();
    this.cellGroups = [];

    const maze = generateMaze(width, height);
    const cellSize = 32;
    for (let y = 0; y < maze.length; y++) {
      this.cellGroups[y] = [];
      for (let x = 0; x < maze[0].length; x++) {
        const type = maze[y][x];
        const colorShades =
          type === "wall"
            ? COLOR_SHADES.DARK_GRAY
            : COLOR_SHADES.YELLOW_GREEN;
        const shadeIndex = type === "wall" ? 0 : 0;
        const cell = new MazeCell(
          colorShades,
          shadeIndex,
          cellSize,
          x * cellSize,
          y * cellSize,
        );
        cell.interactive = type !== "wall";
        if (type !== "wall") {
          cell.on("pointertap", () => this.handleCellClick(cell, x, y));
        }
        this.mainContainer.addChild(cell);
        this.cellGroups[y][x] = cell;
      }
    }

    this.mazePixelWidth = maze[0].length * cellSize;
    this.mazePixelHeight = maze.length * cellSize;

    // Optionally, call resize to re-center
    this.resize(engine().renderer.width, engine().renderer.height);
  }
}
