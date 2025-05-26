import { Container, Ticker } from "pixi.js";

import { engine } from "../../getEngine";
import { PausePopup } from "../../popups/PausePopup";
import { MazeCellType, generateMaze } from "../../utils/MazeGenerator";
import { MazeCell } from "./MazeCell";
import { MazeRevealer } from "./MazeRevealPatterns";
import { generateAndDisplayMaze } from "./MazeDisplayUtils";
import { EntryExitAnimator } from "./EntryExitAnimator";
import { findShortestPath } from "./PathUtils";
import { PathAnimator } from "./PathAnimator";
import { UIScreenUIManager } from "./UIScreenUIManager";
import { MazeManager } from "./MazeManager";
import { Raycaster } from "./Raycaster";

/** The screen that holds the app */
export class MainScreen extends Container {
  public static assetBundles = ["main"];

  public mainContainer: Container;
  private raycastContainer: Container; // Add a container for the raycast view
  private paused = false;
  private mazePixelWidth = 0;
  private mazePixelHeight = 0;

  private mazeManager?: MazeManager;

  private entryExitAnimator = new EntryExitAnimator();
  private pathAnimator = new PathAnimator();

  private isMouseDown = false;

  private uiManager: UIScreenUIManager;

  private isRaycastView = false; // Track whether the raycast view is active
  private raycaster?: Raycaster;

  constructor() {
    super();

    this.mainContainer = new Container();
    this.raycastContainer = new Container();
    this.addChild(this.mainContainer);
    this.addChild(this.raycastContainer);
    this.raycastContainer.visible = false; // Hide the raycast container by default

    // Listen for mouse events on the main container
    this.mainContainer.eventMode = "static";
    this.mainContainer.on("pointerdown", () => {
      this.isMouseDown = true;
    });
    this.mainContainer.on("pointerup", () => {
      this.isMouseDown = false;
    });
    this.mainContainer.on("pointerupoutside", () => {
      this.isMouseDown = false;
    });

    this.uiManager = new UIScreenUIManager(
      this,
      (width, height) => this.generateAndDisplayMaze(width, height),
      () => this.mazePixelWidth,
      () => this.mazePixelHeight,
      (isRaycast) => this.toggleView(isRaycast)
    );

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

    this.uiManager.resize(width, height);
    if (this.raycaster) {
      this.raycaster.setSize(width, height);
      this.raycastContainer.x = 0;
      this.raycastContainer.y = 0;
    }
  }

  public async show(): Promise<void> {
    await this.uiManager.animateIn();
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
    this.mazeData = generateMaze(width, height);
    const cellGroups = generateAndDisplayMaze(this, width, height);
    this.mazeManager = new MazeManager(cellGroups);
  }

  private cellTransitionKey: string = "shade";

  public setupCellInteractions(cell: MazeCell, x: number, y: number) {
    if (!this.mazeManager) return;
    this.mazeManager.setupCellInteractions(
      cell,
      x,
      y,
      () => this.isMouseDown,
      (entry, exit) => this.onPathConnected(entry, exit)
    );
  }

  private onPathConnected(entry: MazeCell, exit: MazeCell) {
    if (!this.mazeManager) return;
    const path = findShortestPath(this.mazeManager.cellGroups, entry, exit);
    this.pathAnimator.start(path);
  }

  // Add this method to handle view toggling
  private toggleView(isRaycast: boolean) {
    this.isRaycastView = isRaycast;
    this.mainContainer.visible = !isRaycast;
    this.raycastContainer.visible = isRaycast;
    if (isRaycast) {
      // Remove previous raycaster if any
      this.raycastContainer.removeChildren();
      // Use the latest mazeData for the raycaster
      const screenWidth = (engine().renderer.width || window.innerWidth);
      const screenHeight = (engine().renderer.height || window.innerHeight);
      this.raycaster = new Raycaster(
        this.mazeData,
        32,
        screenWidth,
        screenHeight
      );
      this.raycastContainer.addChild(this.raycaster);
      this.raycaster.setSize(screenWidth, screenHeight);
      // Center the raycast view (now fills screen, so set to 0,0)
      this.raycastContainer.x = 0;
      this.raycastContainer.y = 0;
    } else {
      this.raycastContainer.removeChildren();
    }
    console.log('Toggled view. Raycast:', isRaycast);
  }
}
