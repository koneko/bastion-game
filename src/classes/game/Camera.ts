import * as PIXI from 'pixi.js';
import { Engine } from '../../Constants';

/**
 * A camera system with target following, zoom, and optional mouse panning.
 */
export class Camera {
    private container: PIXI.Container;
    private target: PIXI.Container | null = null;
    private zoomLevel: number = 0.5;
    private zoomSpeed: number = 0.1;
    private readonly minZoom = 1; // as much as you can go OUT
    private readonly maxZoom = 3; // as much as you can go IN

    private isFollowingEnabled: boolean = true;
    private isMousePanningEnabled: boolean = false;

    private isDragging: boolean = false;
    private canZoom: boolean = true;
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
        if (!this.canZoom) return;
        const delta = e.deltaY > 0 ? -1 : 1;
        const oldZoom = this.zoomLevel;
        const newZoom = this.zoomLevel + delta * this.zoomSpeed;

        // Clamp zoom if needed
        const clampedZoom = Math.max(this.minZoom, Math.min(this.maxZoom, newZoom));

        // Get mouse position in screen space
        const screenX = Engine.MouseX;
        const screenY = Engine.MouseY;

        // Convert screen position to world position before zoom
        const worldXBefore = (screenX - this.container.position.x) / oldZoom;
        const worldYBefore = (screenY - this.container.position.y) / oldZoom;

        // Apply zoom
        this.setZoom(clampedZoom);

        // Convert world position back to screen coordinates after zoom
        const worldXAfter = worldXBefore * clampedZoom + this.container.position.x;
        const worldYAfter = worldYBefore * clampedZoom + this.container.position.y;

        // Offset camera so the point under the mouse stays under the mouse
        this.container.position.x -= worldXAfter - screenX;
        this.container.position.y -= worldYAfter - screenY;

        // Save zoom level
        this.zoomLevel = clampedZoom;
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

    public enableZooming(enabled: boolean) {
        this.canZoom = enabled;
    }
    public update(delta: number) {
        if (!this.target || !this.isFollowingEnabled || this.isDragging) return;

        const lerpSpeed = 0.1;

        // Get target's world position (center)
        const bounds = this.target.getBounds(); // Use getBounds() instead of getLocalBounds()
        const targetWorldX = bounds.x + bounds.width / 2;
        const targetWorldY = bounds.y + bounds.height / 2;

        // Calculate desired container position to center the target on screen
        const screenCenterX = window.innerWidth / 2;
        const screenCenterY = window.innerHeight / 2;

        const desiredX = screenCenterX - targetWorldX;
        const desiredY = screenCenterY - targetWorldY;

        // Apply smooth follow
        this.container.x += (desiredX - this.container.x) * lerpSpeed * delta;
        this.container.y += (desiredY - this.container.y) * lerpSpeed * delta;
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
