import * as PIXI from 'pixi.js';
import { Engine } from './Constants';

export enum WorldTexturesEnum {
    BgTexturedGrass = 0,
    BgBigTiles = 1,
    BgDungeon = 2,
    PropsTrees = 3,
    PropsCliff = 4,
    PropsRocks = 5,
    PropsChests = 6,
    PropsTorch = 7,
    PropsEnemyPortal = 8,
}

type WorldTextures = {
    name: string;
    rows: number;
    cols: number;
    size: number;
    textures: PIXI.Texture[];
};

export default class GameAssets {
    public static Button01Texture: PIXI.Texture;

    public static WorldTextures: WorldTextures[] = [];

    private static text;
    private static counter = 0;
    private static async Load(src) {
        this.text.text = `Loading asset: ${src} (${this.counter}/${1 + this.WorldTextures.length})`;
        this.counter++;
        return await PIXI.Assets.load({
            src: src,
        });
    }

    public static async LoadAssets() {
        if (this.text) {
            console.warn('Do not call GameAssets.LoadAssets() more than once.');
            return;
        }
        console.log('Loading Texture Assets');
        const t = new PIXI.Text({
            text: 'Loading textures. This might take a while.',
            style: new PIXI.TextStyle({
                fill: 0xffffff,
                fontSize: 50,
            }),
        });
        t.x = Engine.app.canvas.width / 2;
        t.y = Engine.app.canvas.height / 2;
        t.anchor.set(0.5, 0.5);
        Engine.app.stage.addChild(t);

        this.text = new PIXI.Text({
            text: '',
            style: new PIXI.TextStyle({
                fill: 0xffffff,
                fontSize: 50,
            }),
        });
        this.text.x = Engine.app.canvas.width / 2;
        this.text.y = Engine.app.canvas.height / 2 + 50;
        this.text.anchor.set(0.5, 0.5);
        Engine.app.stage.addChild(this.text);

        await Promise.all([
            this.Load('./assets/gui/button_01.png').then((texture) => (this.Button01Texture = texture)),
            this.LoadWorld(),
        ]);
        t.destroy();
        this.text.destroy();
        // Set this.text = true to disallow calling GameAssets.LoadAssets() again
        this.text = true;
    }

    private static async LoadWorld() {
        let worldTextures = Object.keys(WorldTexturesEnum).filter((item) => {
            return isNaN(Number(item));
        });
        worldTextures.forEach((texture) => {
            this.WorldTextures.push({
                name: texture,
                rows: 0,
                cols: 0,
                size: 16,
                textures: [],
            });
        });
        await worldTextures.forEach(async (name, idx) => {
            const webTexture = await this.Load(`./assets/world/${name}.png`);
            const textureSize = 16;
            const textureRows = webTexture.orig.height / textureSize;
            const textureCols = webTexture.orig.width / textureSize;
            this.WorldTextures[idx].rows = textureRows;
            this.WorldTextures[idx].cols = textureCols;
            let frames = {};
            for (let rows = 0; rows < textureRows; rows++) {
                for (let cols = 0; cols < textureCols; cols++) {
                    frames[rows * textureCols + cols] = {
                        frame: { x: cols * textureSize, y: rows * textureSize, w: textureSize, h: textureSize },
                        rotated: false,
                        trimmed: false,
                        spriteSourceSize: {
                            x: cols * textureSize,
                            y: rows * textureSize,
                            w: textureSize,
                            h: textureSize,
                        },
                        sourceSize: { w: textureSize, h: textureSize },
                    };
                }
            }
            const spritesheet = new PIXI.Spritesheet(webTexture, {
                frames,
                meta: {
                    image: `./assets/world/${name}.png`,
                    format: 'RGBA8888',
                    size: { w: webTexture.frame.width, h: webTexture.frame.height },
                    scale: '1',
                },
            });
            await spritesheet.parse();
            for (let i = 0; i < textureRows * textureCols; i++) {
                this.WorldTextures[idx].textures[i] = spritesheet.textures[i];
                // even though this is "DEPRECATED", i cant find any other way to enable smooth scaling
                this.WorldTextures[idx].textures[i].baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
            }
        });
    }
}
