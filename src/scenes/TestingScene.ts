import { Engine } from '../Constants';
import GameAssets, { CharactersEnum } from '../GameAssets';
import { Camera } from '../classes/game/Camera';
import Player from '../classes/game/Player';
import World from '../classes/game/World';
import Scene from './Scene';
import * as PIXI from 'pixi.js';

export class TestingScene extends Scene {
    public World: World;
    public Camera: Camera;
    public Player: Player;

    private ticker: PIXI.Ticker;
    public init() {
        this.World = new World('./data/maps/testing/map.bastion');
        this.Camera = new Camera(this.World.container);
        this.Camera.enableMousePanning(true);
        console.log(GameAssets.Characters);
        this.Player = new Player(this.World.container, CharactersEnum.Soldier);

        this.ticker = new PIXI.Ticker();
        this.ticker.maxFPS = 60;
        this.ticker.minFPS = 30;

        this.ticker.add((t) => {
            this.Camera.update(t.deltaMS);
            this.update(t.deltaMS);
        });
        this.ticker.start();
    }
    public update(deltaMS) {}
}
