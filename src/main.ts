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
        width: 1920,
        height: 1080,
        resolution: 1,
        autoDensity: true,
        backgroundColor: 0x000,
        sharedTicker: true,
        roundPixels: true,
    });

    document.body.appendChild(app.canvas);

    function resize() {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const scaleX = windowWidth / app.screen.width;
        const scaleY = windowHeight / app.screen.height;
        const scale = Math.min(scaleX, scaleY);

        const gameWidth = Math.round(app.screen.width * scale);
        const gameHeight = Math.round(app.screen.height * scale);

        const marginHorizontal = (windowWidth - gameWidth) / 2;
        const marginVertical = (windowHeight - gameHeight) / 2;

        app.canvas.style.width = `${gameWidth}px`;
        app.canvas.style.height = `${gameHeight}px`;
        app.canvas.style.marginLeft = `${marginHorizontal}px`;
        app.canvas.style.marginTop = `${marginVertical}px`;
        app.canvas.style.marginRight = `0`;
        app.canvas.style.marginBottom = `0`;
        app.canvas.style.display = 'block';
    }
    Engine.latestCommit = await fetch('./latestCommit').then((res) => res.text());
    window.addEventListener('resize', resize);

    resize();
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
