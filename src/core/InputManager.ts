/**
 * Input handler for keyboard and mouse/touch events
 * - Left side of screen: Jump
 * - Right side of screen: Dash
 */
export class InputManager {
    private keysPressed = new Set<string>();

    private onJump?: () => void;
    private onDashStart?: () => void;
    private onDashEnd?: () => void;
    private onEsc?: () => void;

    private useDashButton: boolean = false;

    constructor() {
        this.setupListeners();
    }

    public setUseDashButton(val: boolean): void {
        this.useDashButton = val;
    }

    private lastTouchTime = 0;

    private setupListeners(): void {
        // Keyboard events
        window.addEventListener('keydown', (e) => {
            if (!this.keysPressed.has(e.key)) {
                this.keysPressed.add(e.key);
                this.handleKeyDown(e.key);
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keysPressed.delete(e.key);
            this.handleKeyUp(e.key);
        });

        // Pointer events (Mobile/Touch focus)
        window.addEventListener('mousedown', (e) => {
            // Ignore mouse events that fire immediately after touch events (ghost clicks)
            if (Date.now() - this.lastTouchTime < 500) return;

            if (this.isUIElement(e.target as HTMLElement)) return;
            // Only handle left click here; right click is handled by contextmenu
            if (e.button === 0) {
                this.processPointerDown(e.clientX, this.useDashButton);
            }
        });
        window.addEventListener('mouseup', () => this.onDashEnd?.());

        window.addEventListener('touchstart', (e) => {
            const target = e.target as HTMLElement;
            if (this.isUIElement(target)) {
                // If it's a UI element, let the specific element's listener handle it
                return;
            }

            // Prevent default to stop scrolling and zooming
            if (e.cancelable) e.preventDefault();
            this.lastTouchTime = Date.now();

            const touch = e.touches[0];
            this.processPointerDown(touch.clientX, this.useDashButton);
        }, { passive: false });

        window.addEventListener('touchend', (e) => {
            const target = e.target as HTMLElement;
            if (this.isUIElement(target)) return;

            if (e.cancelable) e.preventDefault();
            this.onDashEnd?.();
        }, { passive: false });

        // Context Menu (Right Click) for Dash
        window.addEventListener('contextmenu', (e) => {
            if (this.isUIElement(e.target as HTMLElement)) return;
            e.preventDefault();
            this.onDashStart?.();
        });

        // Ensure right-click release also stops dash
        window.addEventListener('mouseup', (e) => {
            if (e.button === 2) this.onDashEnd?.();
        });
    }

    private isUIElement(target: HTMLElement): boolean {
        return !!target.closest('.btn-icon, .modal-panel, .map-option, .shop-card-btn, .close-modal, .btn-primary, .btn-secondary, .btn-toggle, .screen-overlay, .dash-button-hud');
    }

    private processPointerDown(clientX: number, useDashButton: boolean = false): void {
        const isRightSide = clientX > window.innerWidth / 2;

        if (useDashButton) {
            // In Dash Mode, tapping anywhere is a jump
            this.onJump?.();
        } else {
            if (isRightSide) {
                this.onDashStart?.();
            } else {
                this.onJump?.();
            }
        }
    }

    // Explicit triggers for UI buttons
    public triggerJump(): void { this.onJump?.(); }
    public triggerDashStart(): void { this.onDashStart?.(); }
    public triggerDashEnd(): void { this.onDashEnd?.(); }

    private handleKeyDown(key: string): void {
        if (key === ' ' || key === 'ArrowUp') {
            this.onJump?.();
        }
        if (key === 'Control' || key === 'Shift') {
            this.onDashStart?.();
        }
        if (key === 'Escape') {
            this.onEsc?.();
        }
    }

    private handleKeyUp(key: string): void {
        if (key === 'Control' || key === 'Shift') {
            this.onDashEnd?.();
        }
    }

    setJumpCallback(callback: () => void): void { this.onJump = callback; }
    setDashStartCallback(callback: () => void): void { this.onDashStart = callback; }
    setDashEndCallback(callback: () => void): void { this.onDashEnd = callback; }
    setEscCallback(callback: () => void): void { this.onEsc = callback; }

    isKeyPressed(key: string): boolean {
        return this.keysPressed.has(key);
    }
}
