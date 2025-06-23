import * as PIXI from 'pixi.js';
import GuiObject from './classes/GuiObject';
import Scene from './scenes/Scene';
import { KeyboardManager } from './classes/game/managers/KeyboardManager';

export enum CellType {
    Build = 0,
    NoBuild = 1,
    EnemySpawn = 2,
    PathingObjective = 3,
    CoreObjective = 4,
    PlayerWall = 5,
}

export class Engine {
    public static app: PIXI.Application;
    public static currentScene: Scene;
    public static latestCommit: string;

    public static KeyboardManager: KeyboardManager;

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
