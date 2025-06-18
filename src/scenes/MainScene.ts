import { Engine } from '../Constants';
import Button, { ButtonTexture } from '../classes/gui/Button';
import { MapEditor } from './MapEditor';
import Scene from './Scene';
import * as PIXI from 'pixi.js';

export class MainScene extends Scene {
    public init() {
        const NewGameButton = {
            caption: 'MapEditor',
            rect: new PIXI.Rectangle(Engine.app.canvas.width / 2 - 300 / 2, 400 + 0 * 70, 300, 60),

            texture: ButtonTexture.Button01,
        };

        let text2 = new PIXI.Text({
            x: 0,
            y: 0,
            text: 'Latest commit: ' + Engine.latestCommit,
            style: {
                fill: 0xffffff,
                fontSize: 10,
                fontWeight: 'bold',
            },
        });
        this.stage.addChild(text2);
        const button01 = new Button(NewGameButton.rect, NewGameButton.caption, NewGameButton.texture, true);
        button01.onClick = (e) => {
            Engine.changeScene(new MapEditor());
        };
    }
}
