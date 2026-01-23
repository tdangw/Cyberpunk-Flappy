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

    constructor() {
        this.setupListeners();
    }

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
            if (this.isUIElement(e.target as HTMLElement)) return;
            // Only handle left click here; right click is handled by contextmenu
            if (e.button === 0) {
                this.processPointerDown(e.clientX);
            }
        });
        window.addEventListener('mouseup', () => this.onDashEnd?.());

        window.addEventListener('touchstart', (e) => {
            if (this.isUIElement(e.target as HTMLElement)) return;
            const touch = e.touches[0];
            this.processPointerDown(touch.clientX);
        }, { passive: false });

        window.addEventListener('touchend', () => this.onDashEnd?.());

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
        return !!target.closest('.btn-icon, .modal-panel, .map-option, .shop-card-btn, .close-modal, .btn-primary, .btn-secondary, .btn-toggle');
    }

    private processPointerDown(clientX: number): void {
        const isRightSide = clientX > window.innerWidth / 2;

        if (isRightSide) {
            this.onDashStart?.();
        } else {
            this.onJump?.();
        }
    }

    private handleKeyDown(key: string): void {
        if (key === ' ' || key === 'ArrowUp') {
            this.onJump?.();
        }
        if (key === 'Control' || key === 'Shift') {
            this.onDashStart?.();
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

    isKeyPressed(key: string): boolean {
        return this.keysPressed.has(key);
    }
}
