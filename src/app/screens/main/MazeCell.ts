import { Graphics } from 'pixi.js';

export class MazeCell extends Graphics {
    /**
     * @param colorKey The key of the color in COLOR_SHADES (e.g. "YELLOW")
     * @param shadeIndex The index in the shades array (0-5)
     * @param size Size of the cell
     * @param x X position
     * @param y Y Position
     */
    constructor(
        public shades: number[],
        public shadeIndex: number = 0,
        public size: number = 40,
        x: number = 0,
        y: number = 0
    ) {
        super();
        this.drawCell();
        this.position.set(x, y);
    }

    private drawCell() {
        this.clear();
        this.rect(0, 0, this.size, this.size);
        const color = this.shades[this.shadeIndex] ?? 0xFFFFFF;
        this.fill({ color });
    }

    public setColorKey(shades: number[]) {
        this.shades = shades;
        this.drawCell();
    }

    public setShadeIndex(shadeIndex: number) {
        this.shadeIndex = shadeIndex;
        this.drawCell();
    }

    public setSize(size: number) {
        this.size = size;
        this.drawCell();
    }
}