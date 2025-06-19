// yes i used ai for this, i was super lazy
import GameAssets, { WorldTexturesEnum } from '../GameAssets';
import { Engine } from '../Constants';
import Scene from './Scene';
import * as PIXI from 'pixi.js';
import { Camera } from '../classes/game/Camera';
import { QTObject } from '../classes/gui/QuickText';

enum CellType {
    Build = 0,
    NoBuild = 1,
    EnemySpawn = 2,
    PathingObjective = 3,
    CoreObjective = 4,
    PlayerWall = 5,
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
    private placedMapCells = [];
    private mapContainer: PIXI.Container = new PIXI.Container();
    private camera: Camera = new Camera(this.mapContainer);
    private placementGrid: PlacementGrid = new PlacementGrid();
    private ticker: PIXI.Ticker;

    private previewSprite: PIXI.Sprite;
    private selectedBackgroundTexture: WorldTexturesEnum = WorldTexturesEnum.BgTexturedGrass;
    private selectedBackgroundTextureIndex: number = 0;

    private selectedPropTexture: WorldTexturesEnum = WorldTexturesEnum.PropsChests;
    private selectedPropTextureIndex: number = 0;

    private qtCellPlacemode: QTObject;
    private qtCellPreviewEnabled: QTObject;
    private qtCellPlacingEnabled: QTObject;
    private qtBackgroundIndex: QTObject;
    private qtPropIndex: QTObject;
    private qtMouseX: QTObject;
    private qtMouseY: QTObject;
    private qtCellInfo: QTObject;
    private qtCellType: QTObject;
    private qtCellProps: QTObject;

    private cfgPlacingModeIsBg = true;
    private cfgPreviewEnabled = true;
    private cfgPlacingEnabled = false;

    public init() {
        this.stage.addChild(this.mapContainer);
        this.camera.enableMousePanning(true);
        this.mapContainer.addChild(this.placementGrid.view);
        this.ticker = new PIXI.Ticker();
        this.ticker.maxFPS = 60;
        this.ticker.minFPS = 30;

        this.qtCellPlacemode = this.quickText.new('mode: bg', 'white');
        this.qtCellPreviewEnabled = this.quickText.new('preview: true', 'white');
        this.qtCellPlacingEnabled = this.quickText.new('placing: false', 'white');
        this.qtMouseX = this.quickText.new('', '#00ff00');
        this.qtMouseY = this.quickText.new('', '#00ff00');
        this.qtBackgroundIndex = this.quickText.new('', '#00d9ff');
        this.qtPropIndex = this.quickText.new('', '#00d9ff');
        this.qtCellInfo = this.quickText.new('', 'lightblue');
        this.qtCellType = this.quickText.new('', 'orange');
        this.qtCellProps = this.quickText.new('', 'cyan');

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
        this.mapContainer.addChild(originMarker);
        originMarker.x = -originMarker.width / 2;
        originMarker.y = -originMarker.height / 2;
        this.previewSprite = new PIXI.Sprite(
            GameAssets.WorldTextures[this.selectedBackgroundTexture].textures[this.selectedBackgroundTextureIndex]
        );
        this.previewSprite.width = Engine.GridCellSize * Engine.SpriteScale;
        this.previewSprite.height = Engine.GridCellSize * Engine.SpriteScale;
        this.previewSprite.zIndex = 50;
        this.mapContainer.addChild(this.previewSprite);

        this.ticker.add((t) => {
            this.camera.update(t.deltaMS);
            this.placementGrid.draw(this.mapContainer, Engine.app.canvas.width, Engine.app.canvas.height);
            this.update(t.deltaMS);
        });
        this.ticker.start();

        Engine.app.canvas.addEventListener('pointerup', this.onPointerUp);

        this.StartShortcuts();
    }

    public StartShortcuts() {
        // shortcuts:
        // Q - for current placement mode, index--
        // W - switch placement mode (bg or prop)
        // E - for current placement mode, index++
        // A - enable/disable preview
        // S - enable/disable left click placing
        // D - view more information about selected cell
        // F - open cell picker
        // G - cell fill tool
        Engine.KeyboardManager.onKeyUp(
            'KeyW',
            () => {
                this.cfgPlacingModeIsBg = !this.cfgPlacingModeIsBg;
                this.qtCellPlacemode.setCaption('mode: ' + (this.cfgPlacingModeIsBg ? 'bg' : 'props'));
            },
            10
        );

        Engine.KeyboardManager.onKeyUp(
            'KeyQ',
            () => {
                if (this.cfgPlacingModeIsBg) {
                    if (this.selectedBackgroundTextureIndex > 0) this.selectedBackgroundTextureIndex--;
                } else {
                    if (this.selectedPropTextureIndex > 0) this.selectedPropTextureIndex--;
                }
            },
            10
        );
        Engine.KeyboardManager.onKeyUp(
            'KeyE',
            () => {
                if (this.cfgPlacingModeIsBg) {
                    const howMany = GameAssets.WorldTextures[this.selectedBackgroundTexture].textures.length - 1;
                    if (this.selectedBackgroundTexture != howMany) this.selectedBackgroundTextureIndex++;
                } else {
                    const howMany = GameAssets.WorldTextures[this.selectedPropTexture].textures.length - 1;
                    if (this.selectedPropTextureIndex != howMany) this.selectedPropTextureIndex++;
                }
            },
            10
        );

        Engine.KeyboardManager.onKeyUp(
            'KeyA',
            () => {
                this.cfgPreviewEnabled = !this.cfgPreviewEnabled;
                this.qtCellPreviewEnabled.setCaption('preview: ' + this.cfgPreviewEnabled);
            },
            10
        );

        Engine.KeyboardManager.onKeyUp(
            'KeyS',
            () => {
                this.cfgPlacingEnabled = !this.cfgPlacingEnabled;
                this.qtCellPlacingEnabled.setCaption('placing: ' + this.cfgPlacingEnabled);
            },
            10
        );

        Engine.KeyboardManager.onKeyUp(
            'KeyD',
            () => {
                Engine.KeyboardManager.setDisabled(true);
                this.camera.enableMousePanning(false);
                const mousePos = this.mapContainer.toLocal(new PIXI.Point(Engine.MouseX, Engine.MouseY));

                const cellSize = Engine.GridCellSize * Engine.SpriteScale;
                const snappedX = Math.floor(mousePos.x / cellSize) * cellSize;
                const snappedY = Math.floor(mousePos.y / cellSize) * cellSize;

                this.qtMouseX.setCaption('x = ' + snappedX / (Engine.GridCellSize * Engine.SpriteScale));
                this.qtMouseY.setCaption('y = ' + snappedY / (Engine.GridCellSize * Engine.SpriteScale));

                let snappedPoint = new PIXI.Point(
                    snappedX / (Engine.GridCellSize * Engine.SpriteScale),
                    snappedY / (Engine.GridCellSize * Engine.SpriteScale)
                );

                let cell = this.getCellByPoint(snappedPoint);
                Engine.createModal({
                    title: 'Manage cell',
                    content: ``,
                    onClose: () => {
                        Engine.KeyboardManager.setDisabled(false);
                        this.camera.enableMousePanning(true);
                    },
                });
            },
            10
        );

        Engine.KeyboardManager.onKeyUp(
            'KeyF',
            () => {
                Engine.KeyboardManager.setDisabled(true);
                this.camera.enableMousePanning(false);
                let texturesArray = Object.keys(WorldTexturesEnum).filter((item) => {
                    return isNaN(Number(item));
                });
                let textures = [];
                texturesArray.forEach((tex, idx) => {
                    textures.push(`<option value='${idx}'>${tex}</option>`);
                });
                Engine.createModal({
                    title: '',
                    content: `
                    <h3>bg: <span id='backgroundTexture'>${WorldTexturesEnum[
                        this.selectedBackgroundTexture
                    ].toString()}</span>[<span id='backgroundTextureIndex'>${
                        this.selectedBackgroundTextureIndex
                    }</span>]</h3>
                    <h3>prop: <span id='propTexture'>${WorldTexturesEnum[
                        this.selectedPropTexture
                    ].toString()}</span>[<span id='propTextureIndex'>${this.selectedPropTextureIndex}</span>]</h3>
                    <select id='texture-selector' onchange='javascript:Engine.currentScene.modalSelectTexture()'>
                        ${textures.join('')}
                    </select>
                    <select id='index-selector' onchange='javascript:Engine.currentScene.modalSelectTextureIndex()'>
                    <option value='0'>0</option>
                    <option value='1'>1</option>
                    <option value='2'>2</option>
                    <option value='3'>3</option>
                    </select>
                    <hr>
                    <input><button>import map</button><br><br>
                    <button>export map</button>
                    `,
                    onClose: () => {
                        Engine.KeyboardManager.setDisabled(false);
                        this.camera.enableMousePanning(true);
                    },
                });
            },
            10
        );
        Engine.KeyboardManager.onKeyUp(
            'KeyG',
            () => {
                Engine.KeyboardManager.setDisabled(true);
                this.camera.enableMousePanning(false);
                let texturesArray = Object.keys(WorldTexturesEnum).filter((item) => {
                    return isNaN(Number(item));
                });
                let textures = [];
                texturesArray.forEach((tex, idx) => {
                    textures.push(`<option value='${idx}'>${tex}</option>`);
                });
                Engine.createModal({
                    title: 'Fill tool',
                    content: `
                    <p>start:</p>
                    <input id='x1' style="width:40px;margin-right:5px;">x<br>
                    <input id='y1' style="width:40px;margin-right:5px;">y<br>
                    <p>end:</p>
                    <input id='x2' style="width:40px;margin-right:5px;">x<br>
                    <input id='y2' style="width:40px;margin-right:5px;">y<br>
                    <p>filling will use <select id='texture'>${textures.join(
                        ''
                    )}</select><input id='textureIndex' style="width:40px;"></p>
                    <button onclick='javascript:Engine.currentScene.fillCells()'>---FILL--</button>
                    `,
                    onClose: () => {
                        Engine.KeyboardManager.setDisabled(false);
                        this.camera.enableMousePanning(true);
                    },
                });
            },
            10
        );
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

        this.qtMouseX.setCaption('x: ' + snappedX / (Engine.GridCellSize * Engine.SpriteScale));
        this.qtMouseY.setCaption('y: ' + snappedY / (Engine.GridCellSize * Engine.SpriteScale));
        this.qtBackgroundIndex.setCaption('bg: ' + this.selectedBackgroundTextureIndex);
        this.qtPropIndex.setCaption('prop: ' + this.selectedPropTextureIndex);

        let snappedPoint = new PIXI.Point(
            snappedX / (Engine.GridCellSize * Engine.SpriteScale),
            snappedY / (Engine.GridCellSize * Engine.SpriteScale)
        );

        if (this.cfgPreviewEnabled) {
            this.previewSprite.alpha = 1;
        } else {
            this.previewSprite.alpha = 0;
        }

        if (this.cfgPlacingModeIsBg) {
            this.previewSprite.texture =
                GameAssets.WorldTextures[this.selectedBackgroundTexture].textures[this.selectedBackgroundTextureIndex];
        } else {
            this.previewSprite.texture =
                GameAssets.WorldTextures[this.selectedPropTexture].textures[this.selectedPropTextureIndex];
        }

        let cell = this.getCellByPoint(snappedPoint);
        if (cell != undefined) {
            this.qtCellInfo.setCaption(
                `bg: ${WorldTexturesEnum[cell.backgroundTexture].toString()}, idx: ${cell.backgroundTextureIndex}`
            );
            this.qtCellType.setCaption(`type: ` + CellType[cell.type].toString());
            this.qtCellProps.setCaption(`props: ` + JSON.stringify(cell.props));
        } else {
            this.qtCellInfo.setCaption('');
            this.qtCellType.setCaption('');
            this.qtCellProps.setCaption('');
        }

        this.previewSprite.position.set(snappedX, snappedY);
    }

    private getCellByPoint(point) {
        return this.placedMapCells.find((v) => v.x == point.x && v.y == point.y);
    }
    private createCell(
        point: PIXI.Point,
        isBg: boolean,
        type: CellType,
        texture: WorldTexturesEnum,
        textureIndex: number
    ) {
        // snapped point is unit irrelevant, while snappedX and snappedY are relevant to units
        // e.g snapped point (1, 2). snappedX and snappedY (1 * cellSize, 2 * cellSize)
        const cellSize = Engine.GridCellSize * Engine.SpriteScale;
        const snappedX = point.x * cellSize;
        const snappedY = point.y * cellSize;
        if (isBg) {
            let cell = this.getCellByPoint(point);
            if (cell != undefined) {
                let idx = this.placedMapCells.indexOf(cell);
                cell.editorSprite.texture = GameAssets.WorldTextures[texture].textures[textureIndex];
                this.placedMapCells[idx] = {
                    x: point.x,
                    y: point.y,
                    backgroundTexture: texture,
                    backgroundTextureIndex: textureIndex,
                    type: type,
                    props: cell.props,
                    editorSprite: cell.editorSprite,
                };
            } else {
                const newSprite = new PIXI.Sprite(
                    GameAssets.WorldTextures[this.selectedBackgroundTexture].textures[
                        this.selectedBackgroundTextureIndex
                    ]
                );
                this.placedMapCells.push({
                    x: point.x,
                    y: point.y,
                    backgroundTexture: this.selectedBackgroundTexture,
                    backgroundTextureIndex: this.selectedBackgroundTextureIndex,
                    type: type,
                    props: [],
                    editorSprite: newSprite,
                });
                newSprite.position.set(snappedX, snappedY);
                newSprite.width = cellSize;
                newSprite.height = cellSize;
                this.mapContainer.addChild(newSprite);
            }
        } else {
            let cell = this.getCellByPoint(point);
            if (cell == undefined) return console.warn('Cell must have background in order to place prop onto it.');
            cell.props.push({
                propTexture: texture,
                propTextureIndex: textureIndex,
                tint: 0xffffff,
            });
            const propSprite = new PIXI.Sprite(GameAssets.WorldTextures[texture].textures[textureIndex]);
            propSprite.position.set(snappedX, snappedY);
            propSprite.width = cellSize;
            propSprite.height = cellSize;
            this.mapContainer.addChild(propSprite);
        }
    }

    // NOTE: this MUST be an arrow function.
    private onPointerUp = (event: PointerEvent) => {
        if (event.button == 2 || !this.cfgPlacingEnabled) return;
        // Convert global screen mouse position to world position
        const worldPos = this.mapContainer.toLocal(new PIXI.Point(Engine.MouseX, Engine.MouseY));

        const cellSize = Engine.GridCellSize * Engine.SpriteScale;

        // Snap position to grid
        const snappedX = Math.floor(worldPos.x / cellSize) * cellSize;
        const snappedY = Math.floor(worldPos.y / cellSize) * cellSize;
        const snappedPoint = new PIXI.Point(
            snappedX / (Engine.GridCellSize * Engine.SpriteScale),
            snappedY / (Engine.GridCellSize * Engine.SpriteScale)
        );

        if (this.cfgPlacingModeIsBg) {
            let cell = this.getCellByPoint(snappedPoint);
            console.log(cell);
            if (cell != undefined) {
                let idx = this.placedMapCells.indexOf(cell);
                cell.editorSprite.texture =
                    GameAssets.WorldTextures[this.selectedBackgroundTexture].textures[
                        this.selectedBackgroundTextureIndex
                    ];
                this.placedMapCells[idx] = {
                    x: snappedPoint.x,
                    y: snappedPoint.y,
                    backgroundTexture: this.selectedBackgroundTexture,
                    backgroundTextureIndex: this.selectedBackgroundTextureIndex,
                    type: CellType.Build,
                    props: cell.props,
                    editorSprite: cell.editorSprite,
                };
            } else {
                const newSprite = new PIXI.Sprite(
                    GameAssets.WorldTextures[this.selectedBackgroundTexture].textures[
                        this.selectedBackgroundTextureIndex
                    ]
                );
                this.placedMapCells.push({
                    x: snappedPoint.x,
                    y: snappedPoint.y,
                    backgroundTexture: this.selectedBackgroundTexture,
                    backgroundTextureIndex: this.selectedBackgroundTextureIndex,
                    type: CellType.Build,
                    props: [],
                    editorSprite: newSprite,
                });
                newSprite.position.set(snappedX, snappedY);
                newSprite.width = cellSize;
                newSprite.height = cellSize;
                this.mapContainer.addChild(newSprite);
            }
        } else {
            let cell = this.getCellByPoint(snappedPoint);
            if (cell == undefined) return console.warn('Cell must have background in order to place prop onto it.');
            cell.props.push({
                propTexture: this.selectedPropTexture,
                propTextureIndex: this.selectedPropTextureIndex,
                tint: 0xffffff,
            });
            const propSprite = new PIXI.Sprite(
                GameAssets.WorldTextures[this.selectedPropTexture].textures[this.selectedPropTextureIndex]
            );
            propSprite.position.set(snappedX, snappedY);
            propSprite.width = cellSize;
            propSprite.height = cellSize;
            this.mapContainer.addChild(propSprite);
        }
    };
    public modalSelectTexture() {
        const element: any = document.getElementById('texture-selector');
        const num = parseInt(element.value);
        const tex = WorldTexturesEnum[num].toString();
        if (tex.startsWith('Props')) {
            this.selectedPropTexture = num;
            document.getElementById('propTexture').textContent = WorldTexturesEnum[num].toString();
        } else {
            this.selectedBackgroundTexture = num;
            document.getElementById('backgroundTexture').textContent = WorldTexturesEnum[num].toString();
        }
        const howMany = GameAssets.WorldTextures[num].textures.length - 1;
        document.getElementById('index-selector').innerHTML = '';
        for (let i = 0; i < howMany; i++) {
            document.getElementById('index-selector').innerHTML += `<option value='${i}'>${i}</option>`;
        }
    }
    public modalSelectTextureIndex() {
        try {
            const element: any = document.getElementById('texture-selector');
            const num = parseInt(element.value);
            const tex = WorldTexturesEnum[num].toString();
            const number: any = document.getElementById('index-selector');
            if (tex.startsWith('Props')) {
                this.selectedPropTextureIndex = parseInt(number.value);
                document.getElementById('propTextureIndex').textContent = number.value;
            } else {
                this.selectedBackgroundTextureIndex = parseInt(number.value);
                document.getElementById('backgroundTextureIndex').textContent = number.value;
            }
        } catch (e) {
            console.error('Engine.currentScene.modalSelectTextureIndex crashed with error: ');
            console.error(e);
        }
    }
    public fillCells() {
        const x1: any = document.getElementById('x1');
        const y1: any = document.getElementById('y1');
        const x2: any = document.getElementById('x2');
        const y2: any = document.getElementById('y2');

        const cellSize = Engine.GridCellSize * Engine.SpriteScale;

        const x1num = parseInt(x1.value) * cellSize;
        const y1num = parseInt(y1.value) * cellSize;
        const x2num = parseInt(x2.value) * cellSize;
        const y2num = parseInt(y2.value) * cellSize;

        for (let i = x1num; i < x2num; i += cellSize) {
            for (let j = y1num; j < y2num; j += cellSize) {
                const newSprite = new PIXI.Sprite(
                    GameAssets.WorldTextures[this.selectedBackgroundTexture].textures[
                        this.selectedBackgroundTextureIndex
                    ]
                );
                this.placedMapCells.push({
                    x: i,
                    y: j,
                    backgroundTexture: this.selectedBackgroundTexture,
                    backgroundTextureIndex: this.selectedBackgroundTextureIndex,
                    type: CellType.Build,
                    props: [],
                    editorSprite: newSprite,
                });
                newSprite.position.set(i, j);
                newSprite.width = cellSize;
                newSprite.height = cellSize;
                this.mapContainer.addChild(newSprite);
            }
        }
    }
}
