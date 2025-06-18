import * as PIXI from 'pixi.js';
import { Engine } from './Constants';

export enum WorldTexturesEnum {
    TexturedGrass = 0,
}

export default class GameAssets {
    public static Button01Texture: PIXI.Texture;

    public static WorldTextures = [
        {
            name: 'TexturedGrass',
            rows: 2,
            cols: 3,
            size: 16,
            textures: [],
        },
    ];

    private static text;
    private static counter = 0;
    private static async Load(src) {
        this.text.text = `Loading asset: ${src} (${this.counter}/2)`;
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
                fill: 0x333333,
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
                fill: 0x333333,
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
            console.log(spritesheet);
            for (let i = 0; i < texture.rows * texture.cols; i++) {
                this.WorldTextures[textureIndex].textures[i] = spritesheet.textures[i];
            }
        });
    }

    // private static async LoadCreeps() {
    //     const res = await fetch('./assets/json/Creeps.json');
    //     const creeps = await res.json();
    //     this.Creeps = creeps;
    //     for (let idx = 0; idx < this.Creeps.length; idx++) {
    //         const creep = this.Creeps[idx];
    //         const texture = await this.Load(`./assets/creeps/${creep.sprite}_spritesheet.png`);
    //         for (let i = 0; i < creep.textureArrayLength; i++) {
    //             const spritesheet = new PIXI.Spritesheet(texture, {
    //                 frames: {
    //                     [`${creep.sprite}_${i}.png`]: {
    //                         frame: { x: i * 128, y: 0, w: 128, h: 128 },
    //                         rotated: false,
    //                         trimmed: false,
    //                         spriteSourceSize: { x: 0, y: 0, w: 128, h: 128 },
    //                         sourceSize: { w: 128, h: 128 },
    //                     },
    //                 },
    //                 meta: {
    //                     image: `./assets/creeps/${creep.sprite}/spritesheet.png`,
    //                     format: 'RGBA8888',
    //                     size: { w: 128 * creep.textureArrayLength, h: 128 },
    //                     scale: '1',
    //                 },
    //             });
    //             await spritesheet.parse();
    //             creep.textures[i] = spritesheet.textures[`${creep.sprite}_${i}.png`];
    //         }
    //     }
    // }
}
