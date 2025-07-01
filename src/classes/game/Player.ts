import * as PIXI from 'pixi.js';
import GameAssets, { Character, CharactersEnum } from '../../GameAssets';
export default class Player {
    public x: number;
    public y: number;
    public container: PIXI.Container;
    private sprite: PIXI.AnimatedSprite;
    constructor(parent: PIXI.Container, character: CharactersEnum) {
        let c = GameAssets.Characters[character];
        console.log(c, character);
    }
}
