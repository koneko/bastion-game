import { CellType, Engine, GameMap } from '../Constants';
import GameAssets, { CharactersEnum } from '../GameAssets';
import { Enemy } from '../classes/game/Enemy';
import Player from '../classes/game/Player';
import World from '../classes/game/World';
import EnemyManager from '../classes/game/managers/EnemyManager';
import Scene from './Scene';
import * as PIXI from 'pixi.js';

export class TestingScene extends Scene {
    public World: World;
    public Player: Player;
    public Map: GameMap;
    public EnemyManager: EnemyManager;

    private ticker: PIXI.Ticker;
    public async init() {
        const mapName = 'testing';
        this.World = new World();
        await this.World.init(`./data/maps/${mapName}/map.bastion`);
        this.Map = await fetch(`./data/maps/${mapName}/data.json`).then((res) => res.json());
        this.EnemyManager = new EnemyManager(this.Map.paths);
        Engine.World = this.World;
        Engine.EnemyManager;
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
