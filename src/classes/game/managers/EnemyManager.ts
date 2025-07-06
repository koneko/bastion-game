import * as PIXI from 'pixi.js';
import { Enemy } from '../Enemy';
import { Path } from '../../../Constants';

export default class EnemyManager {
    public paths: Path[];
    constructor(paths: Path[]) {
        this.paths = paths;
    }
}
