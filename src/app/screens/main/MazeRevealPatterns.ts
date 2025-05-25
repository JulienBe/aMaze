// Maze reveal pattern utilities

import { Ticker } from "pixi.js";

export type RevealQueuePattern = (mazeData: any[][]) => [number, number][];

export function fillRevealQueueCenterOut(mazeData: any[][]): [number, number][] {
  const w = mazeData[0].length;
  const h = mazeData.length;
  const cx = (w - 1) / 2;
  const cy = (h - 1) / 2;
  const queue: [number, number][] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      queue.push([x, y]);
    }
  }
  queue.sort(
    ([x1, y1], [x2, y2]) =>
      Math.hypot(x1 - cx, y1 - cy) - Math.hypot(x2 - cx, y2 - cy)
  );
  return queue;
}

export function fillRevealQueueEdgesIn(mazeData: any[][]): [number, number][] {
  return fillRevealQueueCenterOut(mazeData).reverse();
}

export function fillRevealQueueMix(mazeData: any[][]): [number, number][] {
  const base = fillRevealQueueCenterOut(mazeData);
  const mixed: [number, number][] = [];
  let left = 0, right = base.length - 1;
  while (left <= right) {
    if (left === right) {
      mixed.push(base[left]);
    } else {
      mixed.push(base[left], base[right]);
    }
    left++;
    right--;
  }
  return mixed;
}

export function fillRevealQueueCornerToCorner(mazeData: any[][]): [number, number][] {
  const w = mazeData[0].length;
  const h = mazeData.length;
  const queue: [number, number][] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      queue.push([x, y]);
    }
  }
  queue.sort(
    ([x1, y1], [x2, y2]) =>
      Math.hypot(x1, y1) - Math.hypot(x2, y2)
  );
  return queue;
}

export function fillRevealQueueRandomPattern(mazeData: any[][]): [number, number][] {
  const patterns = [
    fillRevealQueueCenterOut,
    fillRevealQueueEdgesIn,
    fillRevealQueueMix,
    fillRevealQueueCornerToCorner,
  ];
  const idx = Math.floor(Math.random() * patterns.length);
  return patterns[idx](mazeData);
}

export class MazeRevealer {
  private queue: [number, number][];
  private ticker: Ticker | undefined;
  private onReveal: (x: number, y: number) => void;
  private N: number;

  constructor(
    mazeData: any[][],
    pattern: RevealQueuePattern,
    onReveal: (x: number, y: number) => void,
    N: number = 3
  ) {
    this.queue = pattern(mazeData);
    this.onReveal = onReveal;
    this.N = N;
  }

  start() {
    this.stop();
    this.ticker = new Ticker();
    this.ticker.add(this.step, this);
    this.ticker.start();
  }

  stop() {
    if (this.ticker) {
      this.ticker.stop();
      this.ticker.destroy();
      this.ticker = undefined;
    }
  }

  private step() {
    for (let i = 0; i < this.N && this.queue.length > 0; i++) {
      const [x, y] = this.queue.shift()!;
      this.onReveal(x, y);
    }
    if (this.queue.length === 0) {
      this.stop();
    }
  }
}