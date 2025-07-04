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
    public moveSpeed: number = 2.5;
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
        const newX = Math.round(this.container.x + dx);
        const newY = Math.round(this.container.y + dy);
        if (this.CollidesWithWall(newX, newY)) return;
        this.container.x = newX;
        this.container.y = newY;
    }
    public CollidesWithWall(x: number, y: number): boolean {
        const cellSize = Engine.GridCellSize * Engine.GridUpscale;

        // Calculate center of the object
        const centerX = x;
        const centerY = y;
        const cellX = Math.floor(centerX / cellSize);
        const cellY = Math.floor(centerY / cellSize);

        // Check if that cell contains a wall
        for (const wall of Engine.World.walls) {
            if (wall.x === cellX && wall.y === cellY) {
                return true; // Collision!
            }
        }

        return false;
    }
    public SetCoordinates(x: number, y: number) {
        const cellSize = Engine.GridCellSize * Engine.GridUpscale;
        this.container.x = x * cellSize + cellSize / 2;
        this.container.y = y * cellSize + cellSize / 2;
    }

    public update(delta) {
        const wDown = this.keysDown.KeyW;
        const aDown = this.keysDown.KeyA;
        const sDown = this.keysDown.KeyS;
        const dDown = this.keysDown.KeyD;

        let x = 0;
        let y = 0;
        if (wDown && sDown) {
            y = 0;
        } else if (aDown && dDown) {
            x = 0;
        } else {
            if (wDown) {
                y -= this.moveSpeed * delta;
                this.direction = Directions.Up;
            }
            if (sDown) {
                y += this.moveSpeed * delta;
                this.direction = Directions.Down;
            }
            if (aDown) {
                x -= this.moveSpeed * delta;
                this.direction = Directions.Left;
            }
            if (dDown) {
                x += this.moveSpeed * delta;
                this.direction = Directions.Right;
            }

            const half = Math.round((this.moveSpeed / 1.5) * delta);
            if (wDown && aDown) {
                x = -half;
                y = -half;
                this.direction = Directions.LeftUp;
            } else if (wDown && dDown) {
                x = half;
                y = -half;
                this.direction = Directions.RightUp;
            } else if (dDown && sDown) {
                x = half;
                y = half;
                this.direction = Directions.RightDown;
            } else if (aDown && sDown) {
                x = -half;
                y = half;
                this.direction = Directions.LeftDown;
            }

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
