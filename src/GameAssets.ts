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

    public static WorldTextures: WorldTextures[] = [
        {
            name: 'BgTexturedGrass',
            rows: 2,
            cols: 3,
            size: 16,
            textures: [],
        },
        {
            name: 'BgBigTiles',
            rows: 10,
            cols: 10,
            size: 16,
            textures: [],
        },
        {
            name: 'BgDungeon',
            rows: 12,
            cols: 16,
            size: 16,
            textures: [],
        },
        {
            name: 'PropsTrees',
            rows: 1,
            cols: 4,
            size: 16,
            textures: [],
        },
        {
            name: 'PropsCliff',
            rows: 9,
            cols: 7,
            size: 16,
            textures: [],
        },
        {
            name: 'PropsRocks',
            rows: 4,
            cols: 3,
            size: 16,
            textures: [],
        },
        {
            name: 'PropsChests',
            rows: 1,
            cols: 2,
            size: 16,
            textures: [],
        },
        {
            name: 'PropsTorch',
            rows: 1,
            cols: 4,
            size: 16,
            textures: [],
        },
        {
            name: 'PropsEnemyPortal',
            rows: 1,
            cols: 9,
            size: 16,
            textures: [],
        },
    ];

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
        await this.WorldTextures.forEach(async (texture, textureIndex) => {
            const webTexture = await this.Load(`./assets/world/${texture.name}.png`);
            console.log(webTexture);
            let frames = {};
            for (let rows = 0; rows < texture.rows; rows++) {
                for (let cols = 0; cols < texture.cols; cols++) {
                    frames[rows * texture.cols + cols] = {
                        frame: { x: cols * texture.size, y: rows * texture.size, w: texture.size, h: texture.size },
                        rotated: false,
                        trimmed: false,
                        spriteSourceSize: {
                            x: cols * texture.size,
                            y: rows * texture.size,
                            w: texture.size,
                            h: texture.size,
                        },
                        sourceSize: { w: texture.size, h: texture.size },
                    };
                }
            }
            const spritesheet = new PIXI.Spritesheet(webTexture, {
                frames,
                meta: {
                    image: `./assets/creeps/${texture.name}/spritesheet.png`,
                    format: 'RGBA8888',
                    size: { w: webTexture.frame.width, h: webTexture.frame.height },
                    scale: '1',
                },
            });
            await spritesheet.parse();
            for (let i = 0; i < texture.rows * texture.cols; i++) {
                this.WorldTextures[textureIndex].textures[i] = spritesheet.textures[i];
                // even though this is "DEPRECATED", i cant find any other way to enable smooth scaling
                this.WorldTextures[textureIndex].textures[i].baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
            }
        });
    }
}
