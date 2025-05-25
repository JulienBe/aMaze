import { Graphics } from 'pixi.js';

export class MazeCell extends Graphics {
    constructor(
        public size: number,
        public color: number = 0xFFFFFF,
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
        this.fill(this.color);
    }

    public setColor(color: number) {
        this.color = color;
        this.drawCell();
    }

    public setSize(size: number) {
        this.size = size;
        this.drawCell();
    }
}