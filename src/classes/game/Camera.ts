import * as PIXI from 'pixi.js';

/**
 * A camera system with target following, zoom, and optional mouse panning.
 */
export class Camera {
    private container: PIXI.Container;
    private target: PIXI.Container | null = null;
    private zoomLevel: number = 1;
    private zoomSpeed: number = 0.1;
    private readonly minZoom = 0.5;
    private readonly maxZoom = 3;

    private isFollowingEnabled: boolean = true;
    private isMousePanningEnabled: boolean = false;

    private isDragging: boolean = false;
    private dragStart: PIXI.Point = new PIXI.Point();
    private cameraStart: PIXI.Point = new PIXI.Point();

    constructor(container: PIXI.Container) {
        this.container = container;

        // Attach global mouse listeners
        window.addEventListener('mousedown', this.onMouseDown);
        window.addEventListener('mouseup', this.onMouseUp);
        window.addEventListener('mousemove', this.onMouseMove);
        window.addEventListener('wheel', this.onWheel, { passive: false });
    }

    private onWheel = (e: WheelEvent) => {
        e.preventDefault(); // prevent page scroll

        // Normalize wheel delta (positive is zoom out, negative zoom in)
        const delta = e.deltaY > 0 ? -1 : 1;

        // Adjust zoom based on delta and speed
        this.setZoom(this.zoomLevel + delta * this.zoomSpeed);
    };

    public follow(target: PIXI.Container) {
        this.target = target;
    }

    public setZoom(zoom: number) {
        this.zoomLevel = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
        this.container.scale.set(this.zoomLevel);
    }

    public zoomIn() {
        this.setZoom(this.zoomLevel + this.zoomSpeed);
    }

    public zoomOut() {
        this.setZoom(this.zoomLevel - this.zoomSpeed);
    }

    public setPosition(x: number, y: number) {
        this.container.position.set(x, y);
    }

    public getZoom(): number {
        return this.zoomLevel;
    }

    public enableFollowing(enabled: boolean) {
        this.isFollowingEnabled = enabled;
    }

    public enableMousePanning(enabled: boolean) {
        this.isMousePanningEnabled = enabled;
        if (!enabled) this.isDragging = false;
    }

    public update(deltaMS: number) {
        if (this.target && this.isFollowingEnabled && !this.isDragging) {
            const targetX = -this.target.x * this.zoomLevel + window.innerWidth / 2;
            const targetY = -this.target.y * this.zoomLevel + window.innerHeight / 2;

            this.container.x += (targetX - this.container.x) * 0.1 * deltaMS;
            this.container.y += (targetY - this.container.y) * 0.1 * deltaMS;
        }
    }

    private onMouseDown = (e: MouseEvent) => {
        if (!this.isMousePanningEnabled) return;

        // Optional: restrict to right mouse button (button === 2)
        if (e.button !== 2) return;

        this.isDragging = true;
        this.dragStart.set(e.clientX, e.clientY);
        this.cameraStart.set(this.container.x, this.container.y);
    };

    private onMouseUp = (e: MouseEvent) => {
        if (e.button === 2) this.isDragging = false;
    };

    private onMouseMove = (e: MouseEvent) => {
        if (!this.isMousePanningEnabled || !this.isDragging) return;

        const dx = e.clientX - this.dragStart.x;
        const dy = e.clientY - this.dragStart.y;

        this.container.x = this.cameraStart.x + dx;
        this.container.y = this.cameraStart.y + dy;
    };

    public destroy(): void {
        this.target = null;
        this.isDragging = false;

        window.removeEventListener('mousedown', this.onMouseDown);
        window.removeEventListener('mouseup', this.onMouseUp);
        window.removeEventListener('mousemove', this.onMouseMove);
        window.removeEventListener('wheel', this.onWheel);
    }
}
