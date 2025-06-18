// yes i used ai for this, i was super lazy
import GameAssets, { WorldTexturesEnum } from '../GameAssets';
import { Engine } from '../Constants';
import Scene from './Scene';
import * as PIXI from 'pixi.js';
import { Camera } from '../classes/game/Camera';
import QuickText from '../classes/gui/QuickText';

enum CellType {
    Build = 0,
    NoBuild = 1,
    Spawn = 2,
    PathingObjective = 3,
}

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
        this.color = 0xffffff;
        this.lineAlpha = 0.5;
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

        const cell = this.cellSize;

        // Convert screen bounds to world coordinates
        const left = -pos.x / zoom;
        const top = -pos.y / zoom;
        const right = left + viewportWidth / zoom;
        const bottom = top + viewportHeight / zoom;

        // Find start positions snapped to cell size
        const startX = Math.floor(left / cell) * cell;
        const startY = Math.floor(top / cell) * cell;

        const cols = Math.ceil((right - startX) / cell);
        const rows = Math.ceil((bottom - startY) / cell);

        this.graphics.clear(); // Clear before drawing
        for (let i = 0; i <= cols; i++) {
            const x = startX + i * cell;
            this.graphics.moveTo(x, top);
            this.graphics.lineTo(x, bottom).stroke({
                width: 1 / zoom, // This keeps the grid line thin when zoomed
                color: this.color,
                alpha: this.lineAlpha,
                alignment: 0.5,
                cap: 'butt',
                join: 'miter',
                pixelLine: true,
            });
        }

        for (let j = 0; j <= rows; j++) {
            const y = startY + j * cell;
            this.graphics.moveTo(left, y);
            this.graphics.lineTo(right, y).stroke({
                width: 1 / zoom,
                color: this.color,
                alpha: this.lineAlpha,
                alignment: 0.5,
                cap: 'butt',
                join: 'miter',
                pixelLine: true,
            });
        }

        // DO NOT scale graphics manually — it's in world space
        this.graphics.position.set(0, 0);
        this.graphics.scale.set(1, 1);
    }
}

export class MapEditor extends Scene {
    private mapContainer: PIXI.Container;
    private camera: Camera;
    private placementGrid: PlacementGrid = new PlacementGrid();
    private ticker: PIXI.Ticker;
    private quickText = new QuickText(this.stage);
    private previewSprite: PIXI.Sprite;
    private selectedTexture: WorldTexturesEnum = 0;
    private selectedTextureIndex: number = 0;
    private placedMapCells = [];

    private qt1: any;
    private qt2: any;
    private qt3: any;
    private qt4: any;

    public init() {
        this.mapContainer = new PIXI.Container();
        this.stage.addChild(this.mapContainer);
        this.camera = new Camera(this.mapContainer);
        this.camera.enableMousePanning(true);
        this.mapContainer.addChild(this.placementGrid.view);
        this.ticker = new PIXI.Ticker();
        this.ticker.maxFPS = 60;
        this.ticker.minFPS = 30;
        this.qt1 = this.quickText.new('x', 'red');
        this.qt2 = this.quickText.new('y', 'lightgreen');
        this.qt3 = this.quickText.new('x', 'lightblue');
        this.qt4 = this.quickText.new('y', 'orange');

        let originMarker = new PIXI.Text({
            x: 0,
            y: 0,
            zIndex: 4,
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
        this.previewSprite = new PIXI.Sprite(
            GameAssets.WorldTextures[this.selectedTexture].textures[this.selectedTextureIndex]
        );
        this.previewSprite.width = Engine.GridCellSize * Engine.SpriteScale;
        this.previewSprite.height = Engine.GridCellSize * Engine.SpriteScale;
        this.mapContainer.addChild(this.previewSprite);

        this.ticker.add((t) => {
            this.camera.update(t.deltaMS);
            this.placementGrid.draw(this.mapContainer, Engine.app.canvas.width, Engine.app.canvas.height);
            this.update(t.deltaMS);
        });
        this.ticker.start();
        Engine.app.canvas.addEventListener('pointerup', this.onPointerUp);
    }
    public destroy() {
        this.stage.destroy();
        this._events.removeAllListeners();
        this.gui.forEach((element) => {
            element.destroy();
        });
        Engine.app.canvas.removeEventListener('pointerdown', this.onPointerUp);
        this.camera.destroy();
        this.ticker.stop();
        this.ticker.destroy();
    }
    public update(deltaMS: number) {
        // Convert global mouse to world (map) coordinates
        const mousePos = this.mapContainer.toLocal(new PIXI.Point(Engine.MouseX, Engine.MouseY));

        // Use raw grid size in world units (not scaled twice)
        const cellSize = Engine.GridCellSize * Engine.SpriteScale;

        // Snap preview sprite to grid-aligned world position
        const snappedX = Math.floor(mousePos.x / cellSize) * cellSize;
        const snappedY = Math.floor(mousePos.y / cellSize) * cellSize;

        this.qt1.setCaption('x = ' + snappedX / (Engine.GridCellSize * Engine.SpriteScale));
        this.qt2.setCaption('y = ' + snappedY / (Engine.GridCellSize * Engine.SpriteScale));

        let snappedPoint = new PIXI.Point(
            snappedX / (Engine.GridCellSize * Engine.SpriteScale),
            snappedY / (Engine.GridCellSize * Engine.SpriteScale)
        );

        let cell = this.getCellByPoint(snappedPoint);
        if (cell != undefined) {
            this.qt3.setCaption(`tex: ${WorldTexturesEnum[cell.texture].toString()}, idx: ${cell.textureIndex}`);
            this.qt4.setCaption(`type: ` + CellType[cell.type].toString());
        } else {
            this.qt3.setCaption('');
            this.qt4.setCaption('');
        }

        this.previewSprite.position.set(snappedX, snappedY);
    }

    private getCellByPoint(point) {
        return this.placedMapCells.find((v) => v.x == point.x && v.y == point.y);
    }
    // NOTE: this MUST be an arrow function.
    private onPointerUp = (event: PointerEvent) => {
        if (event.button == 2 || !this.ticker) return;
        // Convert global screen mouse position to world position
        const worldPos = this.mapContainer.toLocal(new PIXI.Point(Engine.MouseX, Engine.MouseY));

        const cellSize = Engine.GridCellSize * Engine.SpriteScale;

        // Snap position to grid
        const snappedX = Math.floor(worldPos.x / cellSize) * cellSize;
        const snappedY = Math.floor(worldPos.y / cellSize) * cellSize;

        // Create a new sprite and place it at the snapped position
        const newSprite = new PIXI.Sprite(
            GameAssets.WorldTextures[this.selectedTexture].textures[this.selectedTextureIndex]
        );
        newSprite.position.set(snappedX, snappedY);
        newSprite.width = cellSize;
        newSprite.height = cellSize;

        let snappedPoint = new PIXI.Point(
            snappedX / (Engine.GridCellSize * Engine.SpriteScale),
            snappedY / (Engine.GridCellSize * Engine.SpriteScale)
        );

        let cell = this.getCellByPoint(snappedPoint);
        console.log(cell);
        if (cell != undefined) {
        } else {
            this.placedMapCells.push({
                x: snappedPoint.x,
                y: snappedPoint.y,
                texture: this.selectedTexture,
                textureIndex: this.selectedTextureIndex,
                type: CellType.Build,
            });
        }
        console.log(this.placedMapCells);

        this.mapContainer.addChild(newSprite);
    };
}
