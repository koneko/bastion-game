import { Path } from '../../Constants';
import { Character } from '../../GameAssets';
import PathfindingAI from './PathfindingAI';
import * as PIXI from 'pixi.js';

export class Enemy extends PathfindingAI {
    public cellPath: Path = [];

    constructor(x: number, y: number, character: Character, path: PIXI.Point[]) {
        super(x, y, new PIXI.AnimatedSprite(character.animations[0].textures));
        this.cellPath = path;
    }
}
