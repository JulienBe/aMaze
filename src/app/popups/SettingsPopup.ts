import { List } from "@pixi/ui";
import { animate } from "motion";
import type { Text } from "pixi.js";
import { BlurFilter, Container, Sprite, Texture } from "pixi.js";

import { engine } from "../getEngine";
import { Button } from "../ui/Button";
import { Label } from "../ui/Label";
import { RoundedBox } from "../ui/RoundedBox";
import { VolumeSlider } from "../ui/VolumeSlider";

export class SettingsPopup extends Container {
  private bg: Sprite;
  private panel: Container;
  private title: Text;
  private doneButton: Button;
  private panelBase: RoundedBox;
  private versionLabel: Text;
  private layout: List;

  public mazeWidth: number = 15;
  public mazeHeight: number = 21;

  public onApply: ((width: number, height: number) => void) | null = null;

  private widthSlider: VolumeSlider;
  private heightSlider: VolumeSlider;

  constructor() {
    super();

    this.bg = new Sprite(Texture.WHITE);
    this.bg.tint = 0x0;
    this.bg.interactive = true;
    this.addChild(this.bg);

    this.panel = new Container();
    this.addChild(this.panel);

    this.panelBase = new RoundedBox({ height: 425 });
    this.panel.addChild(this.panelBase);

    this.title = new Label({
      text: "Settings",
      style: {
        fill: 0xec1561,
        fontSize: 50,
      },
    });
    this.title.y = -this.panelBase.boxHeight * 0.5 + 60;
    this.panel.addChild(this.title);

    this.doneButton = new Button({ text: "Generate!" });
    this.doneButton.y = this.panelBase.boxHeight * 0.5 - 78;
    this.doneButton.onPress.connect(() => {
      if (this.onApply) 
        this.onApply(
          Math.round(this.widthSlider.value),
          Math.round(this.heightSlider.value),
        );
      engine().navigation.dismissPopup()
    });
    this.panel.addChild(this.doneButton);

    this.versionLabel = new Label({
      text: `Version ${APP_VERSION}`,
      style: {
        fill: 0xffffff,
        fontSize: 12,
      },
    });
    this.versionLabel.alpha = 0.5;
    this.versionLabel.y = this.panelBase.boxHeight * 0.5 - 15;
    this.panel.addChild(this.versionLabel);

    this.layout = new List({ type: "vertical", elementsMargin: 4 });
    this.layout.x = -140;
    this.layout.y = -80;
    this.panel.addChild(this.layout);

    // Remove or comment out volume sliders for audio

    // Maze Width Slider
    this.widthSlider = new VolumeSlider("Width");
    this.widthSlider.min = 5;
    this.widthSlider.max = 50;
    this.widthSlider.value = this.mazeWidth;
    this.widthSlider.step = 1;
    this.layout.addChild(this.widthSlider);

    // Maze Height Slider
    this.heightSlider = new VolumeSlider("Height");
    this.heightSlider.min = 5;
    this.heightSlider.max = 50;
    this.heightSlider.value = this.mazeHeight;
    this.heightSlider.step = 1;
    this.layout.addChild(this.heightSlider);
  }

  /** Resize the popup, fired whenever window size changes */
  public resize(width: number, height: number) {
    this.bg.width = width;
    this.bg.height = height;
    this.panel.x = width * 0.5;
    this.panel.y = height * 0.5;
  }

  public prepare(width?: number, height?: number) {
    // Use provided values or fall back to defaults
    if (typeof width === "number") this.mazeWidth = width;
    if (typeof height === "number") this.mazeHeight = height;
  
    this.widthSlider.value = this.mazeWidth;
    this.heightSlider.value = this.mazeHeight;
  }

  /** Present the popup, animated */
  public async show() {
    const currentEngine = engine();
    if (currentEngine.navigation.currentScreen) {
      currentEngine.navigation.currentScreen.filters = [
        new BlurFilter({ strength: 4 }),
      ];
    }

    this.bg.alpha = 0;
    this.panel.pivot.y = -400;
    animate(this.bg, { alpha: 0.8 }, { duration: 0.2, ease: "linear" });
    await animate(
      this.panel.pivot,
      { y: 0 },
      { duration: 0.3, ease: "backOut" },
    );
  }

  /** Dismiss the popup, animated */
  public async hide() {
    const currentEngine = engine();
    if (currentEngine.navigation.currentScreen) {
      currentEngine.navigation.currentScreen.filters = [];
    }
    animate(this.bg, { alpha: 0 }, { duration: 0.2, ease: "linear" });
    await animate(
      this.panel.pivot,
      { y: -500 },
      {
        duration: 0.3,
        ease: "backIn",
      },
    );
  }
}
