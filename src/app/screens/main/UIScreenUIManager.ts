import { FancyButton } from "@pixi/ui";
import { animate } from "motion";
import { Container } from "pixi.js";
import { engine } from "../../getEngine";
import { SettingsPopup } from "../../popups/SettingsPopup";

export class UIScreenUIManager {
  public settingsButton: FancyButton;
  public toggleViewButton: FancyButton;

  constructor(
    parent: Container,
    onSettingsApply: (width: number, height: number) => void,
    getMazePixelWidth: () => number,
    getMazePixelHeight: () => number,
    onToggleView: (isRaycast: boolean) => void
  ) {
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

    this.toggleViewButton = new FancyButton({
      defaultView: "icon-raycast.svg", // Now using the SVG asset
      anchor: 0.5,
      animations: buttonAnimations,
    });
    let isRaycast = false;
    this.toggleViewButton.onPress.connect(() => {
      isRaycast = !isRaycast;
      this.toggleViewButton.defaultView = "icon-raycast.svg";
      onToggleView(isRaycast);
    });

    this.settingsButton.onPress.connect(async () => {
      await engine().navigation.presentPopup(SettingsPopup);
      const popup = engine().navigation.currentPopup as SettingsPopup;
      if (popup) {
        popup.prepare(getMazePixelWidth() / 32, getMazePixelHeight() / 32);
        popup.onApply = onSettingsApply;
      }
    });

    parent.addChild(this.settingsButton);
    parent.addChild(this.toggleViewButton);
  }

  public resize(width: number, _height: number) {
    this.settingsButton.x = width - 30;
    this.settingsButton.y = 30;
    this.toggleViewButton.x = width - 80;
    this.toggleViewButton.y = 30;
    this.toggleViewButton.visible = true; // Always visible
  }

  public async animateIn(): Promise<void> {
    this.settingsButton.alpha = 0;
    await animate(
      this.settingsButton,
      { alpha: 1 },
      { duration: 0.3, delay: 0.75, ease: "backOut" }
    );
  }
}