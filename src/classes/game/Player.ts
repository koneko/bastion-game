import * as PIXI from 'pixi.js';
import GameAssets, { Character, CharactersEnum } from '../../GameAssets';
import { CellType, Engine } from '../../Constants';

enum PlayerState {
    Idle = 0,
    Run = 1,
}

enum Directions {
    Left = 0,
    Right = 1,
    Down = 2,
    Up = 3,
    LeftUp = 4,
    LeftDown = 5,
    RightUp = 6,
    RightDown = 7,
}

export default class Player {
    public container: PIXI.Container = new PIXI.Container();
    public cameraFollow: PIXI.Graphics = new PIXI.Graphics();
    public sprite: PIXI.AnimatedSprite;
    public state: PlayerState = PlayerState.Idle;
    public direction: Directions = 0;
    public moveSpeed: number = 2.25;
    private facingRight: boolean = true;
    private character: Character;
    private stateChangeHandled: boolean = false;
    private keysDown = { KeyW: false, KeyA: false, KeyS: false, KeyD: false };
    constructor(parent: PIXI.Container, c: CharactersEnum) {
        this.character = GameAssets.Characters[c];
        this.container.zIndex = 100;
        this.sprite = new PIXI.AnimatedSprite(this.character.animations[this.state].textures);
        this.sprite.anchor.set(0.5, 0.5);
        this.container.addChild(this.sprite);
        parent.addChild(this.container);
        Object.keys(this.keysDown).forEach((key) => {
            Engine.KeyboardManager.onKeyDown(key, () => {
                this.keysDown[key] = true;
            });
            Engine.KeyboardManager.onKeyUp(key, () => {
                this.keysDown[key] = false;
            });
        });
    }
    public MovePlayer(dx: number, dy: number) {
        const nextX = Math.round(this.container.x + dx);
        const nextY = Math.round(this.container.y + dy);

        // Try horizontal move first
        if (!this.CollidesWithWall(nextX, this.container.y)) {
            this.container.x = nextX;
        }

        // Then try vertical move separately
        if (!this.CollidesWithWall(this.container.x, nextY)) {
            this.container.y = nextY;
        }
    }

    public CollidesWithWall(x: number, y: number): boolean {
        const cellSize = Engine.GridCellSize * Engine.GridUpscale;

        // mess with this a little bit. original uses this.container.width / 2 btw
        const halfWidth = this.container.width / 10;
        const halfHeight = this.container.height / 10;

        const left = x - halfWidth;
        const right = x + halfWidth;
        const top = y - halfHeight;
        const bottom = y + halfHeight;

        const startX = Math.floor(left / cellSize);
        const endX = Math.floor(right / cellSize);
        const startY = Math.floor(top / cellSize);
        const endY = Math.floor(bottom / cellSize);

        const wallSet = Engine.World.walls;

        for (let cx = startX; cx <= endX; cx++) {
            for (let cy = startY; cy <= endY; cy++) {
                if (wallSet.has(`${cx},${cy}`)) {
                    return true;
                }
            }
        }

        return false;
    }

    public SetCoordinates(x: number, y: number) {
        const cellSize = Engine.GridCellSize * Engine.GridUpscale;
        this.container.x = x * cellSize + cellSize / 2;
        this.container.y = y * cellSize + cellSize / 2;
    }
    public update(delta: number) {
        const wDown = this.keysDown.KeyW;
        const aDown = this.keysDown.KeyA;
        const sDown = this.keysDown.KeyS;
        const dDown = this.keysDown.KeyD;

        let x = 0;
        let y = 0;

        // Raw direction input
        if (wDown) y -= 1;
        if (sDown) y += 1;
        if (aDown) x -= 1;
        if (dDown) x += 1;

        // Normalize if moving diagonally or non-0
        if (x !== 0 || y !== 0) {
            const length = Math.hypot(x, y); // Equivalent to sqrt(x*x + y*y)
            x = (x / length) * this.moveSpeed * delta;
            y = (y / length) * this.moveSpeed * delta;

            // Set facing direction (optional – pick one dominant axis or keep diagonal)
            if (x > 0 && y < 0) this.direction = Directions.RightUp;
            else if (x > 0 && y > 0) this.direction = Directions.RightDown;
            else if (x < 0 && y < 0) this.direction = Directions.LeftUp;
            else if (x < 0 && y > 0) this.direction = Directions.LeftDown;
            else if (x > 0) this.direction = Directions.Right;
            else if (x < 0) this.direction = Directions.Left;
            else if (y < 0) this.direction = Directions.Up;
            else if (y > 0) this.direction = Directions.Down;
            console.log(Directions[this.direction]);
            this.MovePlayer(x, y);
        }

        if (x == 0 && y == 0) {
            if (this.state == PlayerState.Run) this.changeState(PlayerState.Idle);
        } else {
            if (this.state == PlayerState.Idle) this.changeState(PlayerState.Run);
            if (x < 0) {
                this.sprite.scale.x = -1;
                this.facingRight = false;
            } else if (x > 0) {
                this.sprite.scale.x = 1;
                this.facingRight = true;
            }
        }

        // Handles changing animation.
        if (!this.stateChangeHandled) {
            this.sprite.stop();
            this.sprite.textures = this.character.animations[this.state].textures;
            this.sprite.anchor.set(0.5, 0.5);
            this.container.addChild(this.sprite);
            if (!this.facingRight) this.sprite.scale.x = -1;
            this.sprite.animationSpeed = this.character.animations[this.state].animationSpeed;
            this.sprite.play();
            this.stateChangeHandled = true;
        }
    }

    private changeState(state) {
        this.state = state;
        this.stateChangeHandled = false;
    }
}
