import { Engine } from '../Constants';
import Button, { ButtonTexture } from '../classes/gui/Button';
import { MapEditor } from './MapEditor';
import Scene from './Scene';
import * as PIXI from 'pixi.js';
import { TestingScene } from './TestingScene';

export class StartScene extends Scene {
    public async init() {
        const TestingButton = {
            caption: 'Testing scene',
            rect: new PIXI.Rectangle(Engine.app.canvas.width / 2 - 300 / 2, 400 + 0 * 70, 300, 60),
            texture: ButtonTexture.Button01,
        };
        const NewGameButton = {
            caption: 'MapEditor',
            rect: new PIXI.Rectangle(Engine.app.canvas.width / 2 - 300 / 2, 400 + 1 * 70, 300, 60),
            texture: ButtonTexture.Button01,
        };

        let text2 = new PIXI.Text({
            x: 0,
            y: 0,
            text: 'Latest commit: ' + Engine.latestCommit,
            style: {
                fill: 0xffffff,
                fontSize: 16,
                fontWeight: 'bold',
            },
        });
        this.stage.addChild(text2);
        const button00 = new Button(TestingButton.rect, TestingButton.caption, TestingButton.texture, true);
        button00.onClick = (e) => {
            Engine.changeScene(new TestingScene());
        };
        const button01 = new Button(NewGameButton.rect, NewGameButton.caption, NewGameButton.texture, true);
        button01.onClick = (e) => {
            Engine.changeScene(new MapEditor());
        };
    }
}
