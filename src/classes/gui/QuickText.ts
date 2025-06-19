import * as PIXI from 'pixi.js';
import GuiObject from '../GuiObject';

export default class QuickText {
    private texts: QTObject[] = [];
    private parent: PIXI.Container;
    constructor(parent) {
        this.parent = parent;
    }
    public new(caption, color) {
        let obj = new QTObject(caption, color, this.parent);
        this.texts.push(obj);
        this.updateAll();
        return obj;
    }
    private updateAll() {
        this.texts.forEach((txt, idx) => {
            txt._t.x = 10;
            txt._t.y = idx * 21;
        });
    }
}

export class QTObject extends GuiObject {
    public _t: PIXI.Text;
    constructor(caption, color, parent) {
        super(false);
        this._t = new PIXI.Text({
            text: caption,
            style: new PIXI.TextStyle({
                fill: color,
                fontSize: 20,
                stroke: {
                    color: 0x000000,
                    width: 5,
                },
            }),
        });
        parent.addChild(this._t);
    }
    public setCaption(caption) {
        this._t.text = caption;
    }
}
