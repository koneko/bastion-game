import * as PIXI from 'pixi.js';
import { Engine, CellType } from '../../Constants';

/**
 * A* Pathfinding that only respects {@link CellType.Wall}.  
 * Inherit from this for anything that moves.
 * @usage ```js
 * const sprite = new PIXI.AnimatedSprite(frames);
const ai = new PathfindingAI(64, 64, sprite);

// Move AI to pixel position (e.g. player position)
ai.moveTo(320, 256);

// In your game loop (e.g. ticker or requestAnimationFrame):
ai.update();
```
 */
export default class PathfindingAI {
    public position: PIXI.Point;
    public sprite: PIXI.AnimatedSprite;
    private path: PIXI.Point[] = [];
    private cellSize = Engine.GridCellSize * Engine.GridUpscale;

    protected moveSpeed = 2;
    protected target: PIXI.Point | null = null;
    private waitTime = 0;

    constructor(x: number, y: number, sprite: PIXI.AnimatedSprite) {
        this.position = new PIXI.Point(x, y);
        this.sprite = sprite;
        this.sprite.x = x;
        this.sprite.y = y;
    }

    public moveTo(targetX: number, targetY: number) {
        this.target = new PIXI.Point(targetX, targetY);

        // Add small random offset to target for variance (± cellSize/3)
        const variance = this.cellSize / 3;
        const offsetX = (Math.random() - 0.5) * 2 * variance;
        const offsetY = (Math.random() - 0.5) * 2 * variance;

        const newTarget = new PIXI.Point(targetX + offsetX, targetY + offsetY);

        const startCell = this.posToCell(this.position);
        const endCell = this.posToCell(newTarget);

        this.path = this.findPath(startCell, endCell);
    }

    public update() {
        if (this.waitTime > 0) {
            this.waitTime -= 1;
            return;
        }

        if (this.path.length === 0) return;

        const targetCell = this.path[0];
        const targetPixel = this.cellToPos(targetCell);

        const dx = targetPixel.x - this.position.x;
        const dy = targetPixel.y - this.position.y;
        const dist = Math.hypot(dx, dy);

        if (dist < this.moveSpeed) {
            // Snap to target and move to next node
            this.position.copyFrom(targetPixel);
            this.path.shift();
        } else {
            // Movement with jitter
            const jitterAmount = 0.3; // pixels per update
            const jitterX = (Math.random() - 0.5) * 2 * jitterAmount;
            const jitterY = (Math.random() - 0.5) * 2 * jitterAmount;

            this.position.x += (dx / dist) * this.moveSpeed + jitterX;
            this.position.y += (dy / dist) * this.moveSpeed + jitterY;
        }

        this.sprite.x = this.position.x;
        this.sprite.y = this.position.y;

        // Occasionally pause movement (1% chance per update)
        if (Math.random() < 0.01) {
            this.waitTime = 30; // pause for 30 frames (~0.5 seconds at 60fps)
        }

        // Occasionally recalc path (2% chance per update)
        if (this.target && Math.random() < 0.02) {
            this.moveTo(this.target.x, this.target.y);
        }
    }

    private posToCell(pos: PIXI.Point): PIXI.Point {
        return new PIXI.Point(Math.floor(pos.x / this.cellSize), Math.floor(pos.y / this.cellSize));
    }

    private cellToPos(cell: PIXI.Point): PIXI.Point {
        return new PIXI.Point(cell.x * this.cellSize + this.cellSize / 2, cell.y * this.cellSize + this.cellSize / 2);
    }

    private findPath(start: PIXI.Point, end: PIXI.Point): PIXI.Point[] {
        const openSet = new Set<string>();
        const cameFrom = new Map<string, string>();
        const gScore = new Map<string, number>();
        const fScore = new Map<string, number>();

        const startKey = `${start.x},${start.y}`;
        const endKey = `${end.x},${end.y}`;
        openSet.add(startKey);
        gScore.set(startKey, 0);
        fScore.set(startKey, this.heuristic(start, end));

        while (openSet.size > 0) {
            let currentKey = [...openSet].reduce((a, b) =>
                (fScore.get(a) ?? Infinity) < (fScore.get(b) ?? Infinity) ? a : b
            );

            if (currentKey === endKey) {
                return this.reconstructPath(cameFrom, currentKey).map((k) => {
                    const [x, y] = k.split(',').map(Number);
                    return new PIXI.Point(x, y);
                });
            }

            openSet.delete(currentKey);
            const [cx, cy] = currentKey.split(',').map(Number);

            for (const [nx, ny] of [
                [cx + 1, cy],
                [cx - 1, cy],
                [cx, cy + 1],
                [cx, cy - 1],
            ]) {
                const neighborKey = `${nx},${ny}`;
                if (Engine.World.enemyWalls.has(neighborKey)) continue;

                const tentativeG = (gScore.get(currentKey) ?? Infinity) + 1;

                if (tentativeG < (gScore.get(neighborKey) ?? Infinity)) {
                    cameFrom.set(neighborKey, currentKey);
                    gScore.set(neighborKey, tentativeG);
                    fScore.set(neighborKey, tentativeG + this.heuristic(new PIXI.Point(nx, ny), end));
                    openSet.add(neighborKey);
                }
            }
        }

        return []; // No path found
    }

    private heuristic(a: PIXI.Point, b: PIXI.Point): number {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); // Manhattan distance
    }

    private reconstructPath(cameFrom: Map<string, string>, current: string): string[] {
        const totalPath = [current];
        while (cameFrom.has(current)) {
            current = cameFrom.get(current)!;
            totalPath.unshift(current);
        }
        return totalPath;
    }
}
