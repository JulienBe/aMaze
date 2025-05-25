export type MazeCellType = "wall" | "path";

export function generateMaze(width: number, height: number): MazeCellType[][] {
    // Ensure odd dimensions for proper maze structure
    if (width % 2 === 0) width += 1;
    if (height % 2 === 0) height += 1;

    // Initialize all cells as walls
    const maze: MazeCellType[][] = Array.from({ length: height }, () =>
        Array.from({ length: width }, () => "wall")
    );

    function carve(x: number, y: number) {
        const dirs = [[0, -2], [2, 0], [0, 2], [-2, 0]].sort(() => Math.random() - 0.5);

        for (const [dx, dy] of dirs) {
            const nx = x + dx, ny = y + dy;
            if (
                nx > 0 && nx < width && ny > 0 && ny < height &&
                maze[ny][nx] === "wall"
            ) {
                maze[ny - dy / 2][nx - dx / 2] = "path";
                maze[ny][nx] = "path";
                carve(nx, ny);
            }
        }
    }

    // Start carving from (1,1)
    maze[1][1] = "path";
    carve(1, 1);

    // Add entry and exit
    maze[1][0] = "path"; // Entry at left of (1,1)
    maze[height - 2][width - 1] = "path"; // Exit at right of (width-2, height-2)

    return maze;
}