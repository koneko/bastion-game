import * as PIXI from 'pixi.js';
import GuiObject from './classes/GuiObject';
import Scene from './scenes/Scene';

export class Engine {
    public static app: PIXI.Application;
    public static currentScene: Scene;
    public static latestCommit: string;

    public static GridCellSize: number = 16;
    public static SpriteScale: number = 1.5;
    public static MouseX: number = 0;
    public static MouseY: number = 0;

    public static _CreateGuiObject(object: GuiObject) {
        if (!Engine.currentScene)
            throw new Error('Unable to _CreateGuiObject, since Engine.currentScene is undefined.');
        Engine.currentScene.gui.push(object);
        Engine.currentScene.stage.addChild(object.container);
    }

    public static _RemoveGuiObject(object: GuiObject) {
        if (!Engine.currentScene)
            throw new Error('Unable to _RemoveGuiObject, since Engine.currentScene is undefined.');
        Engine.currentScene.gui.splice(Engine.currentScene.gui.indexOf(object), 1);
        Engine.currentScene.stage.removeChild(object.container);
    }

    public static changeScene(newScene: Scene) {
        if (Engine.currentScene) {
            Engine.currentScene.destroy();
        }
        Engine.currentScene = newScene;
        Engine.currentScene.init();
    }

    public static TestSuite() {}
}
