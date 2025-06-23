// yes i used ai for this, i was super lazy
import GameAssets, { WorldTexturesEnum } from '../GameAssets';
import { Engine, CellType } from '../Constants';
import Scene from './Scene';
import * as PIXI from 'pixi.js';
import { Camera } from '../classes/game/Camera';
import { QTObject } from '../classes/gui/QuickText';
import { BSON } from 'bson';

const CellTypeEditorColor = ['orange', 'red', 'purple', 'cyan', 'blue', 'gray'];

type EditorProp = {
    propTexture: WorldTexturesEnum;
    propTextureIndex: number;
    tint: PIXI.Color;
    animated: boolean;
    animationTextures: number[];
    editorSprite: PIXI.Sprite;
};

type EditorCell = {
    x: number;
    y: number;
    backgroundTexture: WorldTexturesEnum;
    backgroundTextureIndex: number;
    type: CellType;
    props: EditorProp[];
    editorSprite: PIXI.Sprite;
};

type ExportProp = {
    propTexture: WorldTexturesEnum;
    propTextureIndex: number;
    tint: PIXI.Color;
    animated: boolean;
    animationTextures: number[];
};

type ExportCell = {
    x: number;
    y: number;
    backgroundTexture: WorldTexturesEnum;
    backgroundTextureIndex: number;
    type: CellType;
    props: ExportProp[];
};

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
        this.graphics.zIndex = 100;
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
    private editorCells: EditorCell[] = [];
    private mapContainer: PIXI.Container = new PIXI.Container();
    private camera: Camera = new Camera(this.mapContainer);
    private placementGrid: PlacementGrid = new PlacementGrid();
    private ticker: PIXI.Ticker;
    private leftMouseDown: boolean = false;

    private previewSprite: PIXI.Sprite;
    private selectedBackgroundTexture: WorldTexturesEnum = WorldTexturesEnum.BgTexturedGrass;
    private selectedBackgroundTextureIndex: number = 0;

    private selectedPropTexture: WorldTexturesEnum = WorldTexturesEnum.PropsChests;
    private selectedPropTextureIndex: number = 0;

    private selectedCellType: CellType = 0;

    private qtCellPlacemode: QTObject;
    private qtCellPlacingEnabled: QTObject;
    private qtCellPreviewEnabled: QTObject;
    private qtCellTypePreviewEnabled: QTObject;
    private qtBackgroundIndex: QTObject;
    private qtPropIndex: QTObject;
    private qtMouseX: QTObject;
    private qtMouseY: QTObject;
    private qtCellInfo: QTObject;
    private qtCellType: QTObject;
    private qtCellProps: QTObject;

    private cfgPlacingModeIsBg = true;
    private cfgPreviewEnabled = false;
    private cfgPlacingEnabled = false;
    private cfgShowCellType = false;

    public init() {
        this.stage.addChild(this.mapContainer);
        this.camera.enableMousePanning(true);
        this.mapContainer.addChild(this.placementGrid.view);
        this.ticker = new PIXI.Ticker();
        this.ticker.maxFPS = 60;
        this.ticker.minFPS = 30;

        this.qtCellPlacemode = this.quickText.new('placing mode: bg', '#f9229c');
        this.qtCellPreviewEnabled = this.quickText.new('cell preview: disabled', 'pink');
        this.qtCellPlacingEnabled = this.quickText.new('able to place: disabled', 'pink');
        this.qtCellTypePreviewEnabled = this.quickText.new('cell type preview: disabled', 'pink');
        this.qtBackgroundIndex = this.quickText.new('', '#00d9ff');
        this.qtPropIndex = this.quickText.new('', '#00d9ff');
        this.qtMouseX = this.quickText.new('', '#00ff00');
        this.qtMouseY = this.quickText.new('', '#00ff00');
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

        Engine.app.canvas.addEventListener('pointerdown', this.onPointerDown);
        Engine.app.canvas.addEventListener('pointerup', this.onPointerUp);

        this.StartShortcuts();
    }

    public StartShortcuts() {
        // X
        Engine.KeyboardManager.onKeyUp(
            'KeyX',
            () => {
                Engine.KeyboardManager.setDisabled(true);
                this.camera.enableMousePanning(false);
                let colors = [];
                CellTypeEditorColor.forEach((c, idx) => {
                    colors.push(`<span style='color:${c};text-stroke: 2px black;'>${CellType[idx].toString()}</span>`);
                });
                Engine.createModal({
                    title: 'Help menu',
                    content: `
                        <h1>General info</h1>
                        <p>top left shows some information and changes based on where your mouse is on the world</p>
                        <p>left click is place (if able to place is enabled), right click is pan world view</p>
                        <p><b>(by default able to place is DISABLED)</b></p>
                        <p>P.S cell type colors are ${colors.join(', ')}</p>
                        <p><b>selecting a different option in any <select><option>selector</option></select> will automagically apply your choice</b></p>
                        <h1>Hotkeys</h1>
                        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
                        <table border="1" cellpadding="8" cellspacing="0">
                        <thead>
                            <tr>
                            <th>HOTKEY</th>
                            <th>ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                            <td>Q</td>
                            <td>Reduce sprite index by 1 for current spritesheet</td>
                            </tr>
                            <tr>
                            <td>W</td>
                            <td>Switch placement mode (background or prop)</td>
                            </tr>
                            <tr>
                            <td>E</td>
                            <td>Increase sprite index by 1 for current spritesheet</td>
                            </tr>
                            <tr>
                            <td>R</td>
                            <td>Quick select sprite index from spritesheet visual modal</td>
                            </tr>
                            <tr>
                            <td>A</td>
                            <td>Enable/disable show cell preview + able to place with Left Click</td>
                            </tr>
                            <tr>
                            <td>S</td>
                            <td>Open cell picker</td>
                            </tr>
                            <tr>
                            <td>D</td>
                            <td>Open cell fill tool</td>
                            </tr>
                            <tr>
                            <td>F</td>
                            <td>Enable/disable show cell types</td>
                            </tr>
                            <tr>
                            <td>Z</td>
                            <td>Open prop animation editor</td>
                            </tr>
                            <tr>
                            <td>X</td>
                            <td>Show this menu</td>
                            </tr>
                        </tbody>
                        </table>
                        </div>
                            <h1>If able to place is enabled</h1>
                            <table border="1" cellpadding="8" cellspacing="0">
                        <thead>
                            <tr>
                            <th>ACTION</th>
                            <th>RESULT</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                            <td><b>SHIFT + Left Click</b> on a cell</td>
                            <td>
                                Deletes the clicked item<br>
                                <i>Deletes background <b>and</b> props if in background placing mode; only props in props placing mode</i>
                            </td>
                            </tr>
                            <tr>
                            <td><b>CTRL + Left Click</b> on a cell</td>
                            <td>Copies the cell's properties (spritesheet, first prop)</td>
                            </tr>
                        </tbody>
                        </table>
                        <h2>GOOD LUCK! PLAY AROUND WITH IT A LITTLE!</h2>
                        `,
                    onClose: () => {
                        Engine.KeyboardManager.setDisabled(false);
                        this.camera.enableMousePanning(true);
                    },
                });
            },
            10
        );
        // Q
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
        // W
        Engine.KeyboardManager.onKeyUp(
            'KeyW',
            () => {
                this.cfgPlacingModeIsBg = !this.cfgPlacingModeIsBg;
                this.qtCellPlacemode.setCaption('placing mode: ' + (this.cfgPlacingModeIsBg ? 'bg' : 'props'));
                if (this.cfgPlacingModeIsBg) this.qtCellPlacemode.setColor('#f9229c');
                else this.qtCellPlacemode.setColor('#f6f922');
            },
            10
        );
        // E
        Engine.KeyboardManager.onKeyUp(
            'KeyE',
            () => {
                if (this.cfgPlacingModeIsBg) {
                    const howMany = GameAssets.WorldTextures[this.selectedBackgroundTexture].textures.length - 1;
                    if (this.selectedBackgroundTextureIndex < howMany) this.selectedBackgroundTextureIndex++;
                } else {
                    const howMany = GameAssets.WorldTextures[this.selectedPropTexture].textures.length - 1;
                    if (this.selectedPropTextureIndex < howMany) this.selectedPropTextureIndex++;
                }
            },
            10
        );
        // R
        Engine.KeyboardManager.onKeyUp(
            'KeyR',
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
                    title: 'Texture index quick picker',
                    content: `
                    <select id='texture-selector' onchange='javascript:Engine.currentScene.modalQuickTexture()'>
                    <option value="bg">background</option>
                    <option value="prop">prop</option>
                    </select><br>
                    <div id='texture-preview'>
                    </div>
                    `,
                    onClose: () => {
                        Engine.KeyboardManager.setDisabled(false);
                        this.camera.enableMousePanning(true);
                    },
                });
                this.modalQuickTexture();
                if (!this.cfgPlacingModeIsBg) {
                    let e: any = document.getElementById('texture-selector');
                    e.value = 'prop';
                    this.modalQuickTexture();
                }
            },
            10
        );
        // A
        Engine.KeyboardManager.onKeyUp(
            'KeyA',
            () => {
                this.cfgPreviewEnabled = !this.cfgPreviewEnabled;
                this.qtCellPreviewEnabled.setCaption(
                    'cell preview: ' + (this.cfgPreviewEnabled ? 'enabled' : 'disabled')
                );
                if (this.cfgPreviewEnabled) this.qtCellPreviewEnabled.setColor('lightgreen');
                else this.qtCellPreviewEnabled.setColor('pink');

                this.cfgPlacingEnabled = !this.cfgPlacingEnabled;
                this.qtCellPlacingEnabled.setCaption(
                    'able to place: ' + (this.cfgPlacingEnabled ? 'enabled' : 'disabled')
                );
                if (this.cfgPlacingEnabled) this.qtCellPlacingEnabled.setColor('lightgreen');
                else this.qtCellPlacingEnabled.setColor('pink');
            },
            10
        );
        // S
        Engine.KeyboardManager.onKeyUp(
            'KeyS',
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

                let cellTypesArray = Object.keys(CellType).filter((item) => {
                    return isNaN(Number(item));
                });
                let cellTypes = [];
                cellTypesArray.forEach((tex, idx) => {
                    cellTypes.push(`<option value='${idx}'>${tex}</option>`);
                });

                Engine.createModal({
                    title: 'Texture picker',
                    content: `
                    <select id='bg-texture-selector' onchange='javascript:Engine.currentScene.modalSelectTexture(true)'>
                        ${textures.filter((p) => p.includes('Bg')).join('')}
                    </select>
                    <select id='bg-index-selector' onchange='javascript:Engine.currentScene.modalSelectTextureIndex(true)'>
                    <option value='0'>0</option>
                    </select>
                    <br><br>
                    <select id='prop-texture-selector' onchange='javascript:Engine.currentScene.modalSelectTexture(false)' value='${
                        this.selectedPropTexture
                    }'>
                        ${textures.filter((p) => p.includes('Props')).join('')}
                    </select>
                    <select id='prop-index-selector' onchange='javascript:Engine.currentScene.modalSelectTextureIndex(false)'>
                    <option value='0'>0</option>
                    </select><br><br>
                    <select id='celltype' onchange='javascript:Engine.currentScene.modalSelectCellType()'>
                    ${cellTypes.join('')}
                    </select>
                    <hr>
                    <h1 id='warn'></h1>
                    <p>Import map from file (can take a while for bigger files)</p>
                    <input id='import-map' type="file" accept=".bastion"><br><br>
                    <button onclick='javascript:Engine.currentScene.modalExportMap()'>export map</button>
                    `,
                    onClose: () => {
                        Engine.KeyboardManager.setDisabled(false);
                        this.camera.enableMousePanning(true);
                    },
                });
                let e1: any = document.getElementById('bg-texture-selector');
                let e2: any = document.getElementById('prop-texture-selector');
                let e3: any = document.getElementById('celltype');
                e1.value = this.selectedBackgroundTexture.toString();
                e2.value = this.selectedPropTexture.toString();
                e3.value = this.selectedCellType.toString();

                const fileInput = document.getElementById('import-map') as HTMLInputElement;
                fileInput.addEventListener('change', (event) => {
                    const file = fileInput.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.readAsArrayBuffer(file);
                    reader.onload = () => {
                        const content = reader.result as ArrayBuffer;
                        try {
                            const uint8array = new Uint8Array(content);
                            const decoded = BSON.deserialize(uint8array);
                            const importCells: ExportCell[] = decoded.cells;
                            document.getElementById('modal-backdrop').click();
                            importCells.forEach((cell) => {
                                const point = new PIXI.Point(cell.x, cell.y);
                                this.createCell(
                                    point,
                                    true,
                                    cell.type,
                                    cell.backgroundTexture,
                                    cell.backgroundTextureIndex
                                );
                                cell.props.forEach((prop) => {
                                    let p: EditorProp = this.createCell(
                                        point,
                                        false,
                                        cell.type,
                                        prop.propTexture,
                                        prop.propTextureIndex
                                    ) as EditorProp;
                                    p.animated = prop.animated;
                                    p.animationTextures = prop.animationTextures;
                                });
                            });
                        } catch (e) {
                            console.error('Invalid JSON');
                        }
                    };

                    reader.onerror = () => {
                        console.error('Error reading file:', reader.error);
                    };
                });

                this.modalSelectTexture(true);
                this.modalSelectTexture(false);
            },
            10
        );
        // D
        Engine.KeyboardManager.onKeyUp(
            'KeyD',
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

                let cellTypesArray = Object.keys(CellType).filter((item) => {
                    return isNaN(Number(item));
                });
                let cellTypes = [];
                cellTypesArray.forEach((tex, idx) => {
                    cellTypes.push(`<option value='${idx}'>${tex}</option>`);
                });
                Engine.createModal({
                    title: 'Fill tool',
                    content: `
                    <div style='display: flex; flex-direction: row;align-items:center;justify-content: center; gap: 10px;'>
                    <div>
                    <p>begin:</p>
                    <input id='x1' style="width:40px;height:20px;margin-right:5px;">x<br>
                    <input id='y1' style="width:40px;height:20px;margin-right:5px;">y<br>
                    </div>
                    <div>
                    <p>end:</p>
                    <input id='x2' style="width:40px;height:20px;margin-right:5px;">x<br>
                    <input id='y2' style="width:40px;height:20px;margin-right:5px;">y<br>
                    </div>
                    </div>
                    <br>
                    <select id='celltype'>
                    ${cellTypes.join('')}
                    </select><br><br>
                    <button onclick='javascript:Engine.currentScene.fillCells()' style="padding: 10px;background-color:red;color:white;border-radius: 10px;">fill with currently selected options</button>
                    `,
                    onClose: () => {
                        Engine.KeyboardManager.setDisabled(false);
                        this.camera.enableMousePanning(true);
                    },
                });
            },
            10
        );
        // F
        Engine.KeyboardManager.onKeyUp(
            'KeyF',
            () => {
                this.cfgShowCellType = !this.cfgShowCellType;
                this.qtCellTypePreviewEnabled.setCaption(
                    'cell type preview: ' + (this.cfgShowCellType ? 'enabled' : 'disabled')
                );
                if (this.cfgShowCellType) this.qtCellTypePreviewEnabled.setColor('lightgreen');
                else this.qtCellTypePreviewEnabled.setColor('pink');
                if (this.cfgShowCellType) {
                    this.editorCells.forEach((item) => {
                        item.editorSprite.tint = CellTypeEditorColor[item.type];
                        item.props.forEach((prop) => {
                            prop.editorSprite.tint = CellTypeEditorColor[item.type];
                        });
                    });
                } else {
                    this.editorCells.forEach((item) => {
                        item.editorSprite.tint = '0xffffff';
                        item.props.forEach((prop) => {
                            prop.editorSprite.tint = '0xffffff';
                        });
                    });
                }
            },
            10
        );
        // Z
        Engine.KeyboardManager.onKeyUp(
            'KeyZ',
            () => {
                Engine.KeyboardManager.setDisabled(true);
                this.camera.enableMousePanning(false);
                const mousePos = this.mapContainer.toLocal(new PIXI.Point(Engine.MouseX, Engine.MouseY));
                const cellSize = Engine.GridCellSize * Engine.SpriteScale;
                const snappedX = Math.floor(mousePos.x / cellSize) * cellSize;
                const snappedY = Math.floor(mousePos.y / cellSize) * cellSize;
                Engine.createModal({
                    title: 'Prop animation editor',
                    content: `
                    <p>animation works ONLY on FIRST PROP</p>
                    <p id='prop-info'></p>
                    <input type="checkbox" id='checkbox'><label>Animated</label><br><br>
                    <label>Start spritesheet index</label><input style='width: 32px;' placeholder='0' id='start'><br><br>
                    <label>End spritesheet index</label><input style='width: 32px;' placeholder='1' id='end'><br><br>
                    <button onclick='javascript:Engine.currentScene.modalPropAnimationChange(${snappedX / cellSize}, ${
                        snappedY / cellSize
                    })'>apply</button>
                    `,
                    onClose: () => {
                        Engine.KeyboardManager.setDisabled(false);
                        this.camera.enableMousePanning(true);
                    },
                });
                this.modalPropAnimationCheckbox(snappedX / cellSize, snappedY / cellSize);
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
        Engine.app.canvas.removeEventListener('pointerdown', this.onPointerDown);
        Engine.app.canvas.removeEventListener('pointerup', this.onPointerUp);
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
        this.qtBackgroundIndex.setCaption('background sprite idx: ' + this.selectedBackgroundTextureIndex);
        this.qtPropIndex.setCaption('prop sprite idx: ' + this.selectedPropTextureIndex);

        let snappedPoint = new PIXI.Point(
            snappedX / (Engine.GridCellSize * Engine.SpriteScale),
            snappedY / (Engine.GridCellSize * Engine.SpriteScale)
        );

        if (this.cfgPreviewEnabled) {
            this.previewSprite.alpha = 1;
        } else {
            this.previewSprite.alpha = 0;
        }

        let tex, textureIndex;
        if (this.cfgPlacingModeIsBg) {
            this.previewSprite.texture =
                GameAssets.WorldTextures[this.selectedBackgroundTexture].textures[this.selectedBackgroundTextureIndex];
            tex = this.selectedBackgroundTexture;
            textureIndex = this.selectedBackgroundTextureIndex;
        } else {
            this.previewSprite.texture =
                GameAssets.WorldTextures[this.selectedPropTexture].textures[this.selectedPropTextureIndex];
            tex = this.selectedPropTexture;
            textureIndex = this.selectedPropTextureIndex;
        }

        let cell = this.getCellByPoint(snappedPoint);
        if (cell != undefined) {
            this.qtCellInfo.setCaption(
                `bg: ${WorldTexturesEnum[cell.backgroundTexture].toString()}, idx: ${cell.backgroundTextureIndex}`
            );
            let props = [];
            cell.props.forEach((i) => {
                props.push(WorldTexturesEnum[i.propTexture].toString());
            });
            this.qtCellType.setCaption(`type: ` + CellType[cell.type].toString());
            this.qtCellType.setColor(CellTypeEditorColor[cell.type]);
            this.qtCellProps.setCaption(`props: ` + props.join(', '));
        } else {
            this.qtCellInfo.setCaption('');
            this.qtCellType.setCaption('');
            this.qtCellProps.setCaption('');
        }

        this.previewSprite.position.set(snappedX, snappedY);
        if (!this.leftMouseDown || !this.cfgPlacingEnabled) return;
        let shiftheld = Engine.KeyboardManager.isKeyDown('ShiftLeft');
        let ctrlheld = Engine.KeyboardManager.isKeyDown('ControlLeft');
        if (!shiftheld && !ctrlheld)
            this.createCell(snappedPoint, this.cfgPlacingModeIsBg, this.selectedCellType, tex, textureIndex);
        else if (shiftheld && !ctrlheld) this.deleteCell(snappedPoint, this.cfgPlacingModeIsBg);
        else if (!shiftheld && ctrlheld) this.copyCell(snappedPoint);
    }

    private getCellByPoint(point) {
        return this.editorCells.find((v) => v.x == point.x && v.y == point.y);
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
        let returnValue: EditorCell | EditorProp;
        if (isBg) {
            let cell = this.getCellByPoint(point);
            if (cell != undefined) {
                let idx = this.editorCells.indexOf(cell);
                cell.editorSprite.texture = GameAssets.WorldTextures[texture].textures[textureIndex];
                if (this.cfgShowCellType) cell.editorSprite.tint = CellTypeEditorColor[type];
                this.editorCells[idx] = {
                    x: point.x,
                    y: point.y,
                    backgroundTexture: texture,
                    backgroundTextureIndex: textureIndex,
                    type: type,
                    props: cell.props,
                    editorSprite: cell.editorSprite,
                };
                returnValue = this.editorCells[idx];
            } else {
                const newSprite = new PIXI.Sprite(GameAssets.WorldTextures[texture].textures[textureIndex]);
                const c: EditorCell = {
                    x: point.x,
                    y: point.y,
                    backgroundTexture: texture,
                    backgroundTextureIndex: textureIndex,
                    type: type,
                    props: [],
                    editorSprite: newSprite,
                };
                this.editorCells.push(c);
                newSprite.position.set(snappedX, snappedY);
                newSprite.width = cellSize;
                newSprite.height = cellSize;
                if (this.cfgShowCellType) newSprite.tint = CellTypeEditorColor[type];
                this.mapContainer.addChild(newSprite);
                returnValue = c;
            }
        } else {
            let cell = this.getCellByPoint(point);
            if (cell == undefined || cell.props.find((c) => c.propTexture == texture))
                return console.warn(
                    '[MapEditor] Cell must have background and must not have same texture prop in order to place prop onto it.'
                );
            const propSprite = new PIXI.Sprite(GameAssets.WorldTextures[texture].textures[textureIndex]);
            let prop: EditorProp = {
                propTexture: texture,
                propTextureIndex: textureIndex,
                tint: new PIXI.Color(0xffffff),
                editorSprite: propSprite,
                animated: false,
                animationTextures: [],
            };
            cell.props.push(prop);
            propSprite.position.set(snappedX, snappedY);
            propSprite.width = cellSize;
            propSprite.height = cellSize;
            if (this.cfgShowCellType) propSprite.tint = CellTypeEditorColor[type];
            this.mapContainer.addChild(propSprite);
            returnValue = prop;
        }
        return returnValue;
    }
    private deleteCell(point: PIXI.Point, isBg: boolean) {
        let cell = this.getCellByPoint(point);
        if (!cell) return;
        if (isBg) {
            let idx = this.editorCells.indexOf(cell);
            cell.editorSprite.destroy();
            cell.props.forEach((prop) => {
                prop.editorSprite.destroy();
            });
            this.editorCells.splice(idx, 1);
        } else {
            cell.props.forEach((prop) => {
                prop.editorSprite.destroy();
            });
            cell.props = [];
        }
    }
    private copyCell(point) {
        let cell = this.getCellByPoint(point);
        if (!cell) return;
        this.selectedBackgroundTexture = cell.backgroundTexture;
        this.selectedBackgroundTextureIndex = cell.backgroundTextureIndex;
        if (cell.props[0]) {
            this.selectedPropTexture = cell.props[0].propTexture;
            this.selectedPropTextureIndex = cell.props[0].propTextureIndex;
        }
        this.selectedCellType = cell.type;
    }
    private cleanCell(cell: EditorCell) {
        let props: ExportProp[] = [];
        cell.props.forEach((p) => {
            props.push({
                propTexture: p.propTexture,
                propTextureIndex: p.propTextureIndex,
                tint: p.tint,
                animated: p.animated,
                animationTextures: p.animationTextures,
            });
        });
        let result: ExportCell = {
            x: cell.x,
            y: cell.y,
            backgroundTexture: cell.backgroundTexture,
            backgroundTextureIndex: cell.backgroundTextureIndex,
            type: cell.type,
            props: props,
        };
        return result;
    }
    // NOTE: this MUST be an arrow function.
    private onPointerDown = (event: PointerEvent) => {
        if (event.button != 2) this.leftMouseDown = true;
    };
    private onPointerUp = (event: PointerEvent) => {
        if (event.button != 2) this.leftMouseDown = false;
    };
    public modalSelectTexture(isBg) {
        let element;
        if (isBg) {
            element = document.getElementById('bg-texture-selector');
        } else {
            element = document.getElementById('prop-texture-selector');
        }
        const num = parseInt(element.value);
        if (!isBg) {
            this.selectedPropTexture = num;
        } else {
            this.selectedBackgroundTexture = num;
        }
        const howMany = GameAssets.WorldTextures[num].textures.length;
        let selector;
        if (isBg) {
            selector = document.getElementById('bg-index-selector');
        } else {
            selector = document.getElementById('prop-index-selector');
        }
        selector.innerHTML = '';
        for (let i = 0; i < howMany; i++) {
            selector.innerHTML += `<option value='${i}'>${i}</option>`;
        }
    }
    public modalSelectTextureIndex(isBg) {
        try {
            if (!isBg) {
                let number: any = document.getElementById('prop-index-selector');
                this.selectedPropTextureIndex = parseInt(number.value);
            } else {
                let number: any = document.getElementById('bg-index-selector');
                this.selectedBackgroundTextureIndex = parseInt(number.value);
            }
        } catch (e) {
            console.error('Engine.currentScene.modalSelectTextureIndex crashed with error: ');
            console.error(e);
        }
    }
    public modalSelectCellType() {
        let e: any = document.getElementById('celltype');
        this.selectedCellType = parseInt(e.value);
    }
    public fillCells() {
        const x1: any = document.getElementById('x1');
        const y1: any = document.getElementById('y1');
        const x2: any = document.getElementById('x2');
        const y2: any = document.getElementById('y2');

        const cellType: any = document.getElementById('celltype');

        const x1num = parseInt(x1.value);
        const y1num = parseInt(y1.value);
        const x2num = parseInt(x2.value);
        const y2num = parseInt(y2.value);

        let tex, textureIndex;
        if (this.cfgPlacingModeIsBg) {
            tex = this.selectedBackgroundTexture;
            textureIndex = this.selectedBackgroundTextureIndex;
        } else {
            tex = this.selectedPropTexture;
            textureIndex = this.selectedPropTextureIndex;
        }

        for (let i = x1num; i <= x2num; i += 1) {
            for (let j = y1num; j <= y2num; j += 1) {
                const point = new PIXI.Point(i, j);
                this.createCell(point, this.cfgPlacingModeIsBg, parseInt(cellType.value), tex, textureIndex);
            }
        }
    }
    public modalQuickTexture() {
        const element: any = document.getElementById('texture-selector');
        let source, image;
        if (element.value == 'bg') {
            source = GameAssets.WorldTextures[this.selectedBackgroundTexture];
            image = `./assets/world/${WorldTexturesEnum[this.selectedBackgroundTexture].toString()}.png`;
        } else {
            source = GameAssets.WorldTextures[this.selectedPropTexture];
            image = `./assets/world/${WorldTexturesEnum[this.selectedPropTexture].toString()}.png`;
        }
        const preview = document.getElementById('texture-preview');
        const size = source.size * 3;
        preview.innerHTML = '';
        preview.style.alignItems = 'center';
        preview.style.justifyContent = 'center';
        preview.style.display = 'grid';
        preview.style.gap = '2px';
        preview.style.gridTemplateColumns = `repeat(${source.cols}, ${size}px)`;
        preview.style.gridTemplateRows = `repeat(${source.rows}, ${size}px)`;
        for (let rows = 0; rows < source.rows; rows++) {
            for (let cols = 0; cols < source.cols; cols++) {
                let item = document.createElement('button');
                item.style.backgroundImage = `url('${image}')`;
                item.style.backgroundPositionX = `-${cols * size}px`;
                item.style.backgroundPositionY = `-${rows * size}px`;
                item.style.backgroundRepeat = 'no-repeat';
                item.style.backgroundSize = `${source.cols * size}px ${source.rows * size}px`;
                item.style.width = size + 'px';
                item.style.height = size + 'px';
                item.style.border = 'none';
                preview.appendChild(item);
                item.onclick = () => {
                    if (element.value == 'bg') {
                        this.selectedBackgroundTextureIndex = rows * source.cols + cols;
                    } else {
                        this.selectedPropTextureIndex = rows * source.cols + cols;
                    }
                    document.getElementById('modal-backdrop').click();
                };
            }
        }
    }
    public modalExportMap() {
        const clean: ExportCell[] = [];
        this.editorCells.forEach((cell) => {
            clean.push(this.cleanCell(cell));
        });
        // Create a Blob from the string
        const blob = new Blob([BSON.serialize({ cells: clean })], { type: 'application/json' });

        // Create a URL for the Blob
        const url = URL.createObjectURL(blob);

        // Create a temporary anchor element and trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = 'map.bastion'; // Filename for download
        document.body.appendChild(a); // Required for Firefox
        a.click();
        document.body.removeChild(a);

        // Clean up the URL object
        URL.revokeObjectURL(url);
    }
    public modalPropAnimationCheckbox(snappedX, snappedY) {
        let point = new PIXI.Point(snappedX, snappedY);
        let cell = this.getCellByPoint(point);
        if (!cell || !cell.props[0]) return;
        let element: any = document.getElementById('checkbox');
        let propinfo: any = document.getElementById('prop-info');
        let start: any = document.getElementById('start');
        let end: any = document.getElementById('end');
        let textureinfo = GameAssets.WorldTextures[cell.props[0].propTexture];
        propinfo.textContent = `${textureinfo.name} has 0 - ${textureinfo.textures.length - 1} valid indexes.`;
        if (cell.props[0].animated) element.checked = true;
        if (cell.props[0].animationTextures.length == 0) return;
        start.value = cell.props[0].animationTextures[0].toString();
        end.value = cell.props[0].animationTextures[cell.props[0].animationTextures.length - 1].toString();
    }
    public modalPropAnimationChange(cellX, cellY) {
        let cell = this.getCellByPoint(new PIXI.Point(cellX, cellY));
        if (!cell) return;
        const checkbox: any = document.getElementById('checkbox');
        const start: any = document.getElementById('start');
        const end: any = document.getElementById('end');
        cell.props[0].animated = checkbox.checked;
        if (!checkbox.checked) return;
        for (let i = parseInt(start.value); i <= parseInt(end.value); i++) {
            cell.props[0].animationTextures.push(i);
        }
    }
}
