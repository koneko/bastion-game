import * as PIXI from 'pixi.js';

/**
 * Base class for all game objects.
 * Encapsulates a container, bounding box, and an event emitter.
 */
export default abstract class GameObject {
    /**
     * The name of the object (defaults to the class name).
     */
    public readonly name: string = this.constructor.name;

    /**
     * The root container that visually represents this object.
     * Add sprites, graphics, etc. to this container.
     */
    protected _container: PIXI.Container = new PIXI.Container();

    /**
     * A manual bounding box for collision or spatial calculations.
     */
    protected _bb: PIXI.Rectangle = new PIXI.Rectangle();

    /**
     * Internal event emitter for object-specific events.
     */
    protected _events: PIXI.EventEmitter = new PIXI.EventEmitter();

    /**
     * Destroys the game object, removes all listeners and its container from parent.
     */
    public destroy(): void {
        this._events.removeAllListeners();

        if (this._container.parent) {
            this._container.parent.removeChild(this._container);
        }

        this._container.destroy({ children: true });
    }

    /**
     * The visual container of this object.
     * Useful for adding to the scene graph or manipulating position.
     */
    public get container(): PIXI.Container {
        return this._container;
    }

    /**
     * The internal event emitter. Use for subscribing to object-specific events.
     */
    public get events(): PIXI.EventEmitter {
        return this._events;
    }

    /**
     * Copies the position and size from the container to the bounding box.
     * Does NOT use getBounds() to avoid world transforms.
     * @returns The updated bounding box.
     */
    public copyContainerToBB(): PIXI.Rectangle {
        this._bb.x = this._container.x;
        this._bb.y = this._container.y;
        this._bb.width = this._container.getLocalBounds().width;
        this._bb.height = this._container.getLocalBounds().height;
        return this._bb;
    }

    /**
     * Applies the stored bounding box to the container's position.
     * Note: Does NOT set width/height (as that affects scale in Pixi).
     * @returns The modified container.
     */
    public copyBBToContainer(): PIXI.Container {
        this._container.x = this._bb.x;
        this._container.y = this._bb.y;
        return this._container;
    }

    /**
     * Copies the bounding box values to a target container's position.
     * Note: Avoids setting width/height.
     * @param obj A target PIXI container to copy position to.
     * @returns The modified container.
     */
    public copyPropertiesToObj(obj: PIXI.Container): PIXI.Container {
        obj.x = this._bb.x;
        obj.y = this._bb.y;
        return obj;
    }

    /**
     * Returns the manually stored bounding box.
     * @returns A read-only rectangle representing the bounding box.
     */
    public getBB(): Readonly<PIXI.Rectangle> {
        return this._bb;
    }

    /**
     * Update logic for the game object.
     * Must be implemented by subclasses.
     * @param deltaMS Time elapsed in milliseconds since the last update.
     */
    public abstract update(deltaMS: number): void;
}
