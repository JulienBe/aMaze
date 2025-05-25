import { FancyButton } from "@pixi/ui";
import { animate } from "motion";
import type { AnimationPlaybackControls } from "motion/react";
import { Ticker, Container } from "pixi.js";

import { engine } from "../../getEngine";
import { PausePopup } from "../../popups/PausePopup";
import { SettingsPopup } from "../../popups/SettingsPopup";
import { MazeCellType } from "../../utils/MazeGenerator";
import { COLOR_SHADES } from "../../utils/ColorPalette";
import { MazeCell } from "./MazeCell";
import { MazeRevealer } from "./MazeRevealPatterns";
import { generateAndDisplayMaze } from "./MazeDisplayUtils";

/** The screen that holds the app */
export class MainScreen extends Container {
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
    for (let row of this.cellGroups) {
      for (let cell of row) {
        if (cell.groupId === groupId) {
          cell.setShadeIndex(1);
        }
      }
    }
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
        popup.prepare(this.mazePixelWidth / 32, this.mazePixelHeight / 32);
        popup.onApply = (width, height) => {
          this.generateAndDisplayMaze(width, height);
        };
      }
    });
    this.addChild(this.settingsButton);

    generateAndDisplayMaze(this, 15, 21);
  }

  public prepare() {}

  public update(_time: Ticker) {
    if (this.paused) return;
  }

  public async pause() {
    this.mainContainer.interactiveChildren = false;
    this.paused = true;
  }

  public async resume() {
    this.mainContainer.interactiveChildren = true;
    this.paused = false;
  }

  public reset() {}

  public resize(width: number, height: number) {
    this.mainContainer.x = (width - this.mazePixelWidth) / 2;
    this.mainContainer.y = (height - this.mazePixelHeight) / 2;

    this.settingsButton.x = width - 30;
    this.settingsButton.y = 30;
  }

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

  public async hide() {}

  public blur() {
    if (!engine().navigation.currentPopup) {
      engine().navigation.presentPopup(PausePopup);
    }
  }

  private mazeData: MazeCellType[][] = [];

  private mazeRevealer?: MazeRevealer;

  private generateAndDisplayMaze(width: number, height: number) {
    generateAndDisplayMaze(this, width, height);
  }

  private cellTransitionKey: string = "shade";

}
