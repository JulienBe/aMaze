import type { MazeCell } from "./MazeCell";

export class EntryExitAnimator {
  private interval?: ReturnType<typeof setInterval>;
  private colorIndex = 0;

  start(
    entryCell: MazeCell,
    exitCell: MazeCell,
    shadesList: number[][],
    intervalMs: number = 250,
  ) {
    this.stop();
    this.interval = setInterval(() => {
      this.colorIndex = (this.colorIndex + 1) % shadesList.length;
      entryCell.setColorKey(shadesList[this.colorIndex]);
      exitCell.setColorKey(shadesList[this.colorIndex]);
    }, intervalMs);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
  }
}
