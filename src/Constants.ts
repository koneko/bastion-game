import * as PIXI from 'pixi.js';
import GuiObject from './classes/GuiObject';
import Scene from './scenes/Scene';
import { KeyboardManager } from './classes/game/managers/KeyboardManager';
import { WorldTexturesEnum, CharactersEnum } from './GameAssets';
import World, { Cell } from './classes/game/World';
import { Enemy } from './classes/game/Enemy';
import EnemyManager from './classes/game/managers/EnemyManager';

export enum CellType {
    Build = 0,
    NoBuild = 1,
    EnemySpawn = 2,
    PathingObjective = 3,
    CoreObjective = 4,
    Wall = 5,
    PlayerSpawn = 6,
}

/**
 * Name this the same as its respective entry in {@link CharactersEnum}.
 */
export enum EnemyType {
    Orc = 0,
}

/**
 * First point in path should be CellType.EnemySpawn for consistency.
 */
export type Path = PIXI.Point[];

/**
 * Approximate ratio is 0.00 - 1.00.
 */
export type EnemyInformation = {
    approximateRatio: number;
    enemyType: EnemyType;
};

export type Wave = {
    enemyCount: Enemy[];
    enemyInformation: EnemyInformation[];
};

export enum Difficulty {
    Easy = 0,
}

/**
 * Reference to /data/maps/[name]/data.json.
 * Game automatically pulls respective map.bastion file.
 */
export type GameMap = {
    name: string;
    difficulties: Difficulty[];
    waves: Wave[];
    paths: Path[];
};

export type ExportProp = {
    propTexture: WorldTexturesEnum;
    propTextureIndex: number;
    tint: PIXI.Color;
    animated: boolean;
    animationTextures: number[];
};

export type ExportCell = {
    x: number;
    y: number;
    backgroundTexture: WorldTexturesEnum;
    backgroundTextureIndex: number;
    type: CellType;
    props: ExportProp[];
};

export class Engine {
    public static app: PIXI.Application;
    public static currentScene: Scene;
    public static latestCommit: string;

    // Game will dynamically update these references to singletons.
    public static World: World;
    public static EnemyManager: EnemyManager;

    public static KeyboardManager: KeyboardManager;

    public static GridCellSize: number = 16;
    public static GridUpscale: number = 1.5;
    public static PlayerSpriteScale: number = 1;
    public static EnemySpriteScale: number = 1;
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

    public static async changeScene(newScene: Scene) {
        if (Engine.currentScene) {
            Engine.currentScene.destroy();
        }
        Engine.currentScene = newScene;
        await Engine.currentScene.init();
    }

    public static createModal({ title = 'Modal Title', content = '', onClose = null } = {}) {
        // Create backdrop
        const backdrop = document.createElement('div');
        backdrop.id = 'modal-backdrop';
        backdrop.style.position = 'fixed';
        backdrop.style.top = '0';
        backdrop.style.left = '0';
        backdrop.style.width = '100vw';
        backdrop.style.height = '100vh';
        backdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        backdrop.style.display = 'flex';
        backdrop.style.alignItems = 'center';
        backdrop.style.justifyContent = 'center';
        backdrop.style.zIndex = '1000';

        // Create modal container
        const modal = document.createElement('div');
        modal.style.background = 'white';
        modal.style.padding = '1.5rem';
        modal.style.borderRadius = '8px';
        modal.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.4)';
        modal.style.maxWidth = '1200px';
        modal.style.minWidth = '400px';
        modal.style.textAlign = 'center';

        // Add title
        const heading = document.createElement('h2');
        heading.textContent = title;
        modal.appendChild(heading);

        // Add content
        const contentDiv = document.createElement('div');
        contentDiv.id = 'modal-content';
        contentDiv.innerHTML = content;
        modal.appendChild(contentDiv);

        // Add close button
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.style.marginTop = '1rem';
        closeButton.style.padding = '0.5rem 1rem';
        closeButton.onclick = () => close();
        modal.appendChild(closeButton);

        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);

        // Close logic
        function close() {
            backdrop.remove();
            if (onClose) onClose();
        }

        // ESC key & outside click
        function handleKey(e) {
            if (e.key === 'Escape') close();
        }

        function handleClick(e) {
            if (e.target === backdrop) close();
        }

        document.addEventListener('keydown', handleKey);
        backdrop.addEventListener('click', handleClick);

        return {
            close,
        };
    }

    public static TestSuite() {}
}
