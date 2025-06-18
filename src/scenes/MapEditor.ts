import GameAssets, { WorldTexturesEnum } from '../GameAssets';
import { Engine } from '../Constants';
import Scene from './Scene';
import * as PIXI from 'pixi.js';
import { Camera } from '../classes/game/Camera';
import QuickText from '../classes/gui/QuickText';

/**
 * Infinite grid renderer that draws a grid based on camera position and zoom.
 */
export class PlacementGrid {
    private graphics: PIXI.Graphics;
    private cellSize: number;
    private color: number;
    private lineAlpha: number;

    constructor() {
        this.graphics = new PIXI.Graphics();
        this.cellSize = Engine.GridCellSize * Engine.SpriteScale;
        this.color = 0xfff;
        this.lineAlpha = 1;
    }

    /**
     * Returns the graphics object to be added to the stage.
     */
    public get view(): PIXI.Graphics {
        return this.graphics;
    }

    /**
     * Draw the grid based on the current camera transformation.
     * @param cameraContainer The camera's container (position/scale applied)
     * @param viewportWidth Width of the visible area
     * @param viewportHeight Height of the visible area
     */
    public draw(cameraContainer: PIXI.Container, viewportWidth: number, viewportHeight: number) {
        const zoom = cameraContainer.scale.x;
        const pos = cameraContainer.position;

        const cell = this.cellSize * zoom;
        const offsetX = pos.x % cell;
        const offsetY = pos.y % cell;

        const cols = Math.ceil(viewportWidth / cell) + 2;
        const rows = Math.ceil(viewportHeight / cell) + 2;

        this.graphics.clear();
        let style = {
            width: 1,
            color: 0xfff,
            alpha: 0.3,
            alignment: 0.5,
            cap: 'butt',
            join: 'miter',
        };

        for (let i = 0; i < cols; i++) {
            const x = i * cell - offsetX;
            this.graphics.moveTo(x, 0);
            this.graphics.lineTo(x, viewportHeight).stroke({
                width: 1,
                color: 0x00ff00,
                alpha: 0.3,
                alignment: 0.5,
                cap: 'butt',
                join: 'miter',
                pixelLine: true,
            });
        }

        for (let j = 0; j < rows; j++) {
            const y = j * cell - offsetY;
            this.graphics.moveTo(0, y);
            this.graphics.lineTo(viewportWidth, y).stroke({
                width: 1,
                color: 0x00ff00,
                alpha: 0.3,
                alignment: 0.5,
                cap: 'butt',
                join: 'miter',
                pixelLine: true,
            });
        }
    }
}

export class MapEditor extends Scene {
    private mapContainer: PIXI.Container;
    private camera: Camera;
    private placementGrid: PlacementGrid = new PlacementGrid();
    private ticker: PIXI.Ticker;
    private quickText = new QuickText(this.stage);
    private previewSprite: PIXI.Sprite;

    private qt1: any;
    private qt2: any;

    public init() {
        this.mapContainer = new PIXI.Container();
        this.stage.addChild(this.mapContainer);
        this.camera = new Camera(this.mapContainer);
        this.camera.enableMousePanning(true);
        this.stage.addChild(this.placementGrid.view);
        this.ticker = new PIXI.Ticker();
        this.ticker.maxFPS = 60;
        this.ticker.minFPS = 30;

        this.qt1 = this.quickText.new('x', 'red');
        this.qt2 = this.quickText.new('y', 'lightgreen');

        let originMarker = new PIXI.Text({
            x: 0,
            y: 0,
            zIndex: 5,
            text: '0',
            style: {
                fill: 'red',
                fontSize: 9,
                fontWeight: 'bold',
                stroke: {
                    color: 0xffffff,
                    width: 5,
                },
            },
        });
        this.mapContainer.addChild(originMarker);
        originMarker.x = -originMarker.width / 2;
        originMarker.y = -originMarker.height / 2;
        console.log(GameAssets.WorldTextures[WorldTexturesEnum.TexturedGrass].textures);
        this.previewSprite = new PIXI.Sprite(GameAssets.WorldTextures[WorldTexturesEnum.TexturedGrass].textures[2]);
        this.previewSprite.width = Engine.GridCellSize * Engine.SpriteScale;
        this.previewSprite.height = Engine.GridCellSize * Engine.SpriteScale;
        this.previewSprite.zIndex = 5;
        this.mapContainer.addChild(this.previewSprite);

        this.ticker.add((t) => {
            this.camera.update(t.deltaMS);
            this.placementGrid.draw(this.mapContainer, Engine.app.canvas.width, Engine.app.canvas.height);
            this.update(t.deltaMS);
        });
        this.ticker.start();
    }
    public destroy() {
        this.stage.destroy();
        this._events.removeAllListeners();
        this.gui.forEach((element) => {
            element.destroy();
        });
        this.camera.destroy();
        this.ticker.stop();
        this.ticker.destroy();
    }
    public update(deltaMS) {
        const mousePos = this.mapContainer.toLocal(new PIXI.Point(Engine.MouseX, Engine.MouseY));
        this.qt1.setCaption('MouseX = ' + Math.round(mousePos.x));
        this.qt2.setCaption('MouseY = ' + Math.round(mousePos.y));
        let snapped = new PIXI.Point(
            Math.floor((mousePos.x / Engine.GridCellSize) * Engine.SpriteScale) *
                Engine.GridCellSize *
                Engine.SpriteScale,
            Math.floor((mousePos.y / Engine.GridCellSize) * Engine.SpriteScale) *
                Engine.GridCellSize *
                Engine.SpriteScale
        );
        this.previewSprite.x = snapped.x;
        this.previewSprite.y = snapped.y;
    }
}
