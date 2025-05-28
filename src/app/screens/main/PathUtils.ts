import type { MazeCell } from "./MazeCell";

export function findShortestPath(
  cellGroups: MazeCell[][],
  entryCell: MazeCell,
  exitCell: MazeCell,
): MazeCell[] {
  const height = cellGroups.length;
  const width = cellGroups[0].length;

  // Find coordinates of entryCell and exitCell
  let start: [number, number] | null = null;
  let end: [number, number] | null = null;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (cellGroups[y][x] === entryCell) start = [x, y];
      if (cellGroups[y][x] === exitCell) end = [x, y];
    }
  }
  if (!start) {
    console.error("Entry cell not found in cellGroups");
    return [];
  }
  if (!end) {
    console.error("Exit cell not found in cellGroups");
    return [];
  }
  if (!start || !end) return [];

  const visited = Array.from({ length: height }, () =>
    Array(width).fill(false),
  );
  const prev = Array.from({ length: height }, () =>
    Array(width).fill(null as [number, number] | null),
  );
  const queue: [number, number][] = [start];
  visited[start[1]][start[0]] = true;

  while (queue.length > 0) {
    const [x, y] = queue.shift()!;
    if (x === end[0] && y === end[1]) break;
    for (const [dx, dy] of [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0],
    ]) {
      const nx = x + dx,
        ny = y + dy;
      if (
        nx >= 0 &&
        ny >= 0 &&
        nx < width &&
        ny < height &&
        !visited[ny][nx] &&
        cellGroups[ny][nx].groupId === cellGroups[start[1]][start[0]].groupId
      ) {
        visited[ny][nx] = true;
        prev[ny][nx] = [x, y];
        queue.push([nx, ny]);
      }
    }
  }

  // Reconstruct path
  const path: MazeCell[] = [];
  let curr: [number, number] | null = end;
  while (curr && !(curr[0] === start[0] && curr[1] === start[1])) {
    path.push(cellGroups[curr[1]][curr[0]]);
    curr = prev[curr[1]][curr[0]];
  }
  if (curr) path.push(cellGroups[start[1]][start[0]]);
  path.reverse();
  return path;
}
