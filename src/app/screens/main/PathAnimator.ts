import type { MazeCell } from "./MazeCell";
import { COLOR_SHADES } from "../../utils/ColorPalette";

export class PathAnimator {
    private interval?: ReturnType<typeof setInterval>;
    private currentIndex = 0;
    private currentPalette = 0;
    private currentShade = 0;
    private palettes: number[][] = Object.values(COLOR_SHADES);
    private direction: 1 | -1 = 1; // 1 for forward, -1 for backward

    /**
     * Start animating the path.
     * @param path The array of MazeCells representing the path.
     * @param intervalMs Animation interval in ms.
     */
    start(
        path: MazeCell[],
        intervalMs: number = 80
    ) {
        this.stop();
        this.currentIndex = 0;
        this.currentPalette = 0;
        this.currentShade = 0;
        this.direction = 1;

        this.interval = setInterval(() => {
            // Bounce logic BEFORE coloring the cell
            if (
                (this.direction === 1 && this.currentIndex === path.length - 1) ||
                (this.direction === -1 && this.currentIndex === 0)
            ) {
                this.direction *= -1;
                this.currentShade = (this.currentShade + 1) % this.palettes[this.currentPalette].length;
                if (this.currentShade === 0) {
                    this.currentPalette = (this.currentPalette + 1) % this.palettes.length;
                }
            }

            const shades = this.palettes[this.currentPalette];
            const cell = path[this.currentIndex];
            cell.setColorKey(shades);
            cell.setShadeIndex(this.currentShade);

            // Move index in current direction
            this.currentIndex += this.direction;
        }, intervalMs);
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = undefined;
        }
    }
}