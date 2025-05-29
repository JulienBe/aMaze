import { Container, Ticker, Graphics, Text } from "pixi.js";

import { engine } from "../../getEngine";
import { PausePopup } from "../../popups/PausePopup";
import { MazeCellType, generateMaze } from "../../utils/MazeGenerator";
import { MazeCell } from "./MazeCell";
import { generateAndDisplayMaze } from "./MazeDisplayUtils";
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
  private raycastUIContainer: Container; // Overlay for raycast controls
  private paused = false;
  private mazePixelWidth = 0;
  private mazePixelHeight = 0;

  private mazeManager?: MazeManager;

  private pathAnimator = new PathAnimator();

  private isMouseDown = false;

  private uiManager: UIScreenUIManager;

  private isRaycastView = false; // Track whether the raycast view is active
  private raycaster?: Raycaster;

  private cellGroups: MazeCell[][] = [];

  constructor() {
    super();

    this.mainContainer = new Container();
    this.raycastContainer = new Container();
    this.raycastUIContainer = new Container();
    this.addChild(this.mainContainer);
    this.addChild(this.raycastContainer);
    this.addChild(this.raycastUIContainer);
    this.raycastContainer.visible = false;
    this.raycastUIContainer.visible = false; // Hide the raycast UI container by default

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
      (isRaycast) => this.toggleView(isRaycast),
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

  private mazeData: MazeCellType[][] = [];


  private generateAndDisplayMaze(width: number, height: number) {
    this.mazeData = generateMaze(width, height);
    this.cellGroups = generateAndDisplayMaze(this, width, height);
    this.mazeManager = new MazeManager(this.cellGroups);
  }


  public setupCellInteractions(cell: MazeCell, x: number, y: number) {
    if (!this.mazeManager) return;
    this.mazeManager.setupCellInteractions(
      cell,
      x,
      y,
      () => this.isMouseDown,
      (entry, exit) => this.onPathConnected(entry, exit),
    );
  }

  private onPathConnected(entry: MazeCell, exit: MazeCell) {
    if (!this.mazeManager) return;
    const path = findShortestPath(this.mazeManager.cellGroups, entry, exit);
    this.pathAnimator.start(path);
  }

  private createRaycastUI() {
    this.raycastUIContainer.removeChildren();
    const buttonSize = 48;
    const padding = 12;
    // Store intervals for each key
    const buttonIntervals: Record<string, NodeJS.Timeout | null> = {};
    const makeButton = (label: string, x: number, y: number, key: string) => {
      const btn = new Container();
      const g = new Graphics();
      g.beginFill(0x333333, 0.8);
      g.drawRoundedRect(0, 0, buttonSize, buttonSize, 12);
      g.endFill();
      btn.addChild(g);
      const t = new Text(label, {
        fontSize: 24,
        fill: 0xffffff,
        align: "center",
      });
      t.anchor.set(0.5);
      t.x = buttonSize / 2;
      t.y = buttonSize / 2;
      btn.addChild(t);
      btn.x = x;
      btn.y = y;
      btn.eventMode = "static";
      btn.cursor = "pointer";
      // Press and hold logic
      btn.on("pointerdown", () => {
        this.simulateRaycastKeyDown(key);
        // Repeat movement every 60ms while held
        buttonIntervals[key] = setInterval(
          () => this.simulateRaycastKeyDown(key),
          60,
        );
      });
      btn.on("pointerup", () => {
        this.simulateRaycastKeyUp(key);
        if (buttonIntervals[key]) {
          clearInterval(buttonIntervals[key]!);
          buttonIntervals[key] = null;
        }
      });
      btn.on("pointerupoutside", () => {
        this.simulateRaycastKeyUp(key);
        if (buttonIntervals[key]) {
          clearInterval(buttonIntervals[key]!);
          buttonIntervals[key] = null;
        }
      });
      btn.on("pointerout", () => {
        this.simulateRaycastKeyUp(key);
        if (buttonIntervals[key]) {
          clearInterval(buttonIntervals[key]!);
          buttonIntervals[key] = null;
        }
      });
      this.raycastUIContainer.addChild(btn);
      return btn;
    };
    // Layout: Up, Down, Left, Right
    const centerX = (engine().renderer.width || window.innerWidth) / 2;
    const baseY =
      (engine().renderer.height || window.innerHeight) -
      buttonSize * 2 -
      padding * 5;
    // Up
    makeButton("↑", centerX - buttonSize / 2, baseY, "w");
    // Down
    makeButton(
      "↓",
      centerX - buttonSize / 2,
      baseY + buttonSize + padding * 2,
      "s",
    );
    // Left
    makeButton(
      "←",
      centerX - buttonSize - padding * 4,
      baseY + buttonSize + padding,
      "a",
    );
    // Right
    makeButton(
      "→",
      centerX + buttonSize + padding * 4 - buttonSize,
      baseY + buttonSize + padding,
      "d",
    );
  }

  private simulateRaycastKeyDown(key: string) {
    if (!this.isRaycastView || !this.raycaster) return;
    this.raycaster["onKeyDown"]({ key } as KeyboardEvent);
  }

  private simulateRaycastKeyUp(key: string) {
    if (!this.isRaycastView || !this.raycaster) return;
    this.raycaster["onKeyUp"]({ key } as KeyboardEvent);
  }

  // Add this method to handle view toggling
  private toggleView(isRaycast: boolean) {
    this.isRaycastView = isRaycast;
    this.mainContainer.visible = !isRaycast;
    this.raycastContainer.visible = isRaycast;
    this.raycastUIContainer.visible = isRaycast;
    if (isRaycast) {
      // Remove previous raycaster if any
      this.raycastContainer.removeChildren();
      // Use the latest cellGroups for the raycaster
      const screenWidth = engine().renderer.width || window.innerWidth;
      const screenHeight = engine().renderer.height || window.innerHeight;
      this.raycaster = new Raycaster(
        this.mazeData,
        32,
        screenWidth,
        screenHeight,
        this.cellGroups, // pass cellGroups for color lookup
      );
      this.raycastContainer.addChild(this.raycaster);
      this.raycaster.setSize(screenWidth, screenHeight);
      this.raycastContainer.x = 0;
      this.raycastContainer.y = 0;
      this.createRaycastUI();
      // The toggleViewButton remains visible in both modes
    } else {
      this.raycastContainer.removeChildren();
      this.raycastUIContainer.removeChildren();
      // The toggleViewButton remains visible in both modes
    }
    // Ensure UI is updated
    this.uiManager.resize(
      engine().renderer.width || window.innerWidth,
      engine().renderer.height || window.innerHeight,
    );
    console.log("Toggled view. Raycast:", isRaycast);
  }

  public resize(width: number, height: number) {
    this.mainContainer.x = (width - this.mazePixelWidth) / 2;
    this.mainContainer.y = (height - this.mazePixelHeight) / 2;

    this.uiManager.resize(width, height);
    if (this.raycaster) {
      this.raycaster.setSize(width, height);
      this.raycastContainer.x = 0;
      this.raycastContainer.y = 0;
      this.createRaycastUI();
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
}
