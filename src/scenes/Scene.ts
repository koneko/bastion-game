import { Engine } from '../Constants.ts';
import GuiObject from '../classes/GuiObject.ts';
import * as PIXI from 'pixi.js';

export default class Scene {
    public stage: PIXI.Container = new PIXI.Container();
    public gui: GuiObject[] = [];
    protected _events: PIXI.EventEmitter = new PIXI.EventEmitter();

    constructor() {
        Engine.app.stage.addChild(this.stage);
    }
    public destroy() {
        this.stage.destroy();
        this._events.removeAllListeners();
        this.gui.forEach((element) => {
            element.destroy();
        });
    }

    public get events(): PIXI.EventEmitter {
        return this._events;
    }

    public init() {}
}
