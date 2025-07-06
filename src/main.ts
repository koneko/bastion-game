import * as PIXI from 'pixi.js';
import { Engine } from './Constants';
import Assets from './GameAssets';
import { StartScene } from './scenes/StartScene';
import { KeyboardManager } from './classes/game/managers/KeyboardManager';
import { MapEditor } from './scenes/MapEditor';
import { GameScene } from './scenes/GameScene';
import { TestingScene } from './scenes/TestingScene';

(async () => {
    const app = new PIXI.Application();
    Engine.app = app;

    await app.init({
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        backgroundColor: 0x000000,
        sharedTicker: true,
        roundPixels: true,
        antialias: true,
        // Don’t specify fixed width/height
    });

    document.body.appendChild(app.canvas);

    // Resize the actual renderer to fill the viewport
    function resize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        app.renderer.resize(width, height);
    }

    window.addEventListener('resize', resize);
    resize(); // Initial call

    // Store latest commit (unrelated, keeping as-is)
    Engine.latestCommit = await fetch('./latestCommit').then((res) => res.text());
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
        let unsuportedDeviceText = new PIXI.Text({
            text: 'Bastion: Call of the Wild is currently unsupported on mobile.\nPlease play it on your computer instead.',
            style: new PIXI.TextStyle({
                fill: 0x333333,
                fontSize: 50,
                textBaseline: 'middle',
            }),
        });
        unsuportedDeviceText.x = Engine.app.canvas.width / 2;
        unsuportedDeviceText.y = Engine.app.canvas.height / 2 + 50;
        unsuportedDeviceText.anchor.set(0.5, 0.5);
        Engine.app.stage.addChild(unsuportedDeviceText);
        return;
    }
    window.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });

    await Assets.LoadAssets();
    globalThis.Engine = Engine;
    Engine.KeyboardManager = new KeyboardManager();
    PIXI.Ticker.shared.add((ticker) => {
        Engine.KeyboardManager.update();
    });
    app.canvas.addEventListener('pointermove', function (event) {
        Engine.MouseX = ((event.clientX - app.canvas.offsetLeft) / app.canvas.offsetWidth) * 1920;
        Engine.MouseY = ((event.clientY - app.canvas.offsetTop) / app.canvas.offsetHeight) * 1080;
    });
    let params = new URLSearchParams(location.href);
    if (params.entries().next().value[1] == 'editor') await Engine.changeScene(new MapEditor());
    else if (params.entries().next().value[1] == 'game') await Engine.changeScene(new GameScene());
    else if (params.entries().next().value[1] == 'test') await Engine.changeScene(new TestingScene());
    else await Engine.changeScene(new StartScene());
    // if (Engine.latestCommit != 'DEVELOPMENT')
    //     window.onbeforeunload = () => {
    //         return 'You are about to leave.';
    //     };
    // else Engine.TestSuite();
})();
