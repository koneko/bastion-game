import { CellType, Engine } from '../Constants';
import GameAssets, { CharactersEnum } from '../GameAssets';
import { Camera } from '../classes/game/Camera';
import Player from '../classes/game/Player';
import World from '../classes/game/World';
import Scene from './Scene';
import * as PIXI from 'pixi.js';

export class TestingScene extends Scene {
    public World: World;
    public Player: Player;

    private ticker: PIXI.Ticker;
    public async init() {
        this.World = new World();
        await this.World.init('./data/maps/testing/map.bastion');
        Engine.World = this.World;
        this.Player = new Player(this.World.container, CharactersEnum.Soldier);
        this.World.container.follow(this.Player.container);
        this.World.container.setZoom(3.5, true);
        const spawnCell = this.World.GetCellsByType(CellType.PlayerSpawn)[0];
        this.Player.SetCoordinates(spawnCell.x, spawnCell.y);
        let originMarker = new PIXI.Text({
            x: 0,
            y: 0,
            zIndex: 100,
            text: 'origin',
            style: {
                fill: 'red',
                fontSize: 16,
                fontWeight: 'bold',
                stroke: {
                    color: 0xffffff,
                    width: 5,
                },
            },
        });
        this.World.container.addChild(originMarker);
        this.ticker = new PIXI.Ticker();
        this.ticker.maxFPS = 60;
        this.ticker.minFPS = 30;

        this.ticker.add((t) => {
            this.update(t.deltaTime);
        });
        this.ticker.start();
    }
    public update(deltaTime) {
        this.Player.update(deltaTime);
    }
}
