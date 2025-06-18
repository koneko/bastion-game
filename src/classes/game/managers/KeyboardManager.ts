type KeyEventType = 'down' | 'up';

interface Listener {
    cb: (key: string, e: KeyboardEvent) => void;
    priority: number;
}

/**
 * A disposable handle that removes the associated key listener when `.destroy()` is called.
 */
export class KeyboardListenerHandle {
    private manager: KeyboardManager;
    private type: KeyEventType;
    private key: string;
    private cb: (key: string, e: KeyboardEvent) => void;

    constructor(
        manager: KeyboardManager,
        type: KeyEventType,
        key: string,
        cb: (key: string, e: KeyboardEvent) => void
    ) {
        this.manager = manager;
        this.type = type;
        this.key = key;
        this.cb = cb;
    }

    /** Removes this listener from the manager. */
    public destroy(): void {
        this.manager._removeListener(this.type, this.key, this.cb);
    }
}

/**
 * Keyboard input manager with key state tracking and listener priorities.
 */
export class KeyboardManager {
    private readonly keysDown = new Set<string>();
    private readonly keysPressed = new Set<string>();
    private readonly keysReleased = new Set<string>();

    private readonly listenersDown = new Map<string, Listener[]>();
    private readonly listenersUp = new Map<string, Listener[]>();

    private isDisabled: boolean = false;

    constructor() {
        window.addEventListener('keydown', this.handleKeyDown, false);
        window.addEventListener('keyup', this.handleKeyUp, false);
    }

    // ---------------------------------------------------------------------------
    // Public API – state queries
    // ---------------------------------------------------------------------------

    public isKeyDown(keyCode: string): boolean {
        return this.keysDown.has(keyCode);
    }

    public isKeyPressed(keyCode: string): boolean {
        return this.keysPressed.has(keyCode);
    }

    public isKeyReleased(keyCode: string): boolean {
        return this.keysReleased.has(keyCode);
    }

    public setDisabled(bool) {
        this.isDisabled = bool;
    }

    public update(): void {
        this.keysPressed.clear();
        this.keysReleased.clear();
    }

    // ---------------------------------------------------------------------------
    // Public API – listener registration
    // ---------------------------------------------------------------------------

    public onKeyDown(
        keyCode: string,
        cb: (key: string, e: KeyboardEvent) => void,
        priority = 0
    ): KeyboardListenerHandle {
        this._addListener('down', keyCode, cb, priority);
        return new KeyboardListenerHandle(this, 'down', keyCode, cb);
    }

    public onKeyUp(keyCode: string, cb: (key: string, e: KeyboardEvent) => void, priority = 0): KeyboardListenerHandle {
        this._addListener('up', keyCode, cb, priority);
        return new KeyboardListenerHandle(this, 'up', keyCode, cb);
    }

    public destroy(): void {
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        this.listenersDown.clear();
        this.listenersUp.clear();
        this.keysDown.clear();
        this.keysPressed.clear();
        this.keysReleased.clear();
    }

    // ---------------------------------------------------------------------------
    // Internal – DOM event handlers
    // ---------------------------------------------------------------------------

    private handleKeyDown = (e: KeyboardEvent): void => {
        if (!this.keysDown.has(e.code)) this.keysPressed.add(e.code);
        this.keysDown.add(e.code);
        this._dispatch('down', e.code, e);
    };

    private handleKeyUp = (e: KeyboardEvent): void => {
        this.keysDown.delete(e.code);
        this.keysReleased.add(e.code);
        this._dispatch('up', e.code, e);
    };

    // ---------------------------------------------------------------------------
    // Internal – listener management
    // ---------------------------------------------------------------------------

    public _addListener(
        type: KeyEventType,
        key: string,
        cb: (key: string, e: KeyboardEvent) => void,
        priority: number
    ): void {
        const map = type === 'down' ? this.listenersDown : this.listenersUp;
        const arr = map.get(key) ?? [];
        arr.push({ cb, priority });
        map.set(key, arr);
    }

    public _removeListener(type: KeyEventType, key: string, cb: (key: string, e: KeyboardEvent) => void): void {
        const map = type === 'down' ? this.listenersDown : this.listenersUp;
        const arr = map.get(key);
        if (!arr) return;

        const i = arr.findIndex((l) => l.cb === cb);
        if (i !== -1) arr.splice(i, 1);
        if (arr.length === 0) map.delete(key);
    }

    private _dispatch(type: KeyEventType, key: string, e: KeyboardEvent): void {
        if (this.isDisabled) return;
        const map = type === 'down' ? this.listenersDown : this.listenersUp;
        const listeners = map.get(key);
        if (!listeners?.length) return;

        let maxPriority = Number.NEGATIVE_INFINITY;
        for (const l of listeners) if (l.priority > maxPriority) maxPriority = l.priority;

        for (const l of listeners) {
            if (l.priority === maxPriority) l.cb(key, e);
        }
    }
}
