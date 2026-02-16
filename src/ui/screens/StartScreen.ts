import type { IUIManager } from '../IUIManager';
import { IconDrawer } from '../IconDrawer';

export class StartScreen {
    private ui: IUIManager;
    private startScreenCooldown: number = 0;
    private lastStartTouchTime: number = 0;
    private abortController = new AbortController();

    constructor(ui: IUIManager) {
        this.ui = ui;
        this.setupMapSelector();
        this.setupStartListener();
    }

    destroy(): void {
        this.abortController.abort();
    }

    show(): void {
        this.ui.game.pause();
        const screen = document.getElementById('start-screen');
        if (screen) {
            screen.style.display = 'flex';
            this.setupTutorialIcons();
        }
        // Also reset cooldown when showing to prevent accidental start
        this.startScreenCooldown = Date.now();
    }

    hide(): void {
        const screen = document.getElementById('start-screen');
        if (screen) screen.style.display = 'none';
        this.ui.game.resume();
    }

    private setupStartListener(): void {
        const startScreen = document.getElementById('start-screen');
        const startHandler = (e: Event) => {
            if (Date.now() - this.startScreenCooldown < 300) return;
            if (e.type === 'touchstart') this.lastStartTouchTime = Date.now();
            if (e.type === 'mousedown' && Date.now() - this.lastStartTouchTime < 500) return;

            const target = e.target as HTMLElement;
            // If user clicked a button (map, mode, settings), don't start the game
            if (target.closest('.map-option, .mode-option, .btn-icon, .modal-panel')) return;

            // Otherwise, initiate
            if (this.ui.game.getState() === 'START') {
                e.preventDefault();
                e.stopPropagation();

                (this.ui as any).hud.animateMapName();
                this.hide();
                this.ui.game.resume(true);
            }
        };
        startScreen?.addEventListener('mousedown', startHandler, { signal: this.abortController.signal });
        startScreen?.addEventListener('touchstart', startHandler, { passive: false, signal: this.abortController.signal });

        window.addEventListener('keydown', (e) => {
            // Space handled by game input, but if we need interception:
            if ((e.code === 'Space' || e.code === 'ArrowUp') && this.ui.game.getState() === 'START') {
                // Game Input manager handles this? Or we handle UI hiding.
                // UIManager listened to 'gameStarted' event to hide screen.
                // So we don't strictly need this keydown unless we trigger start ourselves.
                // The InputManager likely triggers 'gameStarted' which calls this.hide().
            }
        }, { signal: this.abortController.signal });
    }

    private setupMapSelector(): void {
        const options = document.querySelectorAll('.map-option') as NodeListOf<HTMLElement>;
        const themeName = document.getElementById('selected-theme-name');

        options.forEach((opt, _index) => {
            const name = opt.getAttribute('data-name') || '';
            const mapId = parseInt(opt.getAttribute('data-map') || '0');
            const description = this.getMapDescription(mapId);

            opt.addEventListener('mouseenter', (e: MouseEvent) => this.ui.showTooltip(description, e.clientX, e.clientY), { signal: this.abortController.signal });
            opt.addEventListener('mouseleave', () => this.ui.hideTooltip(), { signal: this.abortController.signal });

            const handler = (e: Event) => {
                e.preventDefault();
                this.ui.playClick();
                options.forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                if (themeName) themeName.textContent = name;
                // use the mapId we already parsed
                this.ui.game.setStartMap(mapId);
                this.updateStartScreenTheme(mapId);
                this.setupTutorialIcons();
            };

            opt.addEventListener('click', handler, { signal: this.abortController.signal });
        });

        this.setupModeSelector();
    }

    private setupModeSelector(): void {
        const modes = document.querySelectorAll('.mode-option') as NodeListOf<HTMLElement>;
        modes.forEach(modeBtn => {
            const mode = modeBtn.getAttribute('data-mode') || 'advance';
            const description = mode === 'classic'
                ? "CLASSIC MODE: Pure skill. No nitro, no shops, standard physics."
                : "ADVANCE MODE: Full experience. Nitro, skins, and sectors.";

            modeBtn.addEventListener('mouseenter', (e) => this.ui.showTooltip(description, e.clientX, e.clientY), { signal: this.abortController.signal });
            modeBtn.addEventListener('mouseleave', () => this.ui.hideTooltip(), { signal: this.abortController.signal });

            const handler = (e: Event) => {
                e.stopPropagation();
                this.ui.playClick();
                modes.forEach(m => m.classList.remove('active'));
                modeBtn.classList.add('active');
                this.ui.game.setGameMode(mode as 'classic' | 'advance');

                // --- Map Filtering Logic ---
                const mapOptions = document.querySelectorAll('.map-option') as NodeListOf<HTMLElement>;
                const themeNameEl = document.getElementById('selected-theme-name');

                if (mode === 'classic') {
                    mapOptions.forEach(opt => {
                        const mIndex = opt.getAttribute('data-map');
                        if (mIndex === '5') {
                            opt.style.display = 'flex';
                            // Auto-select Sunny if not already selected
                            if (!opt.classList.contains('active')) {
                                mapOptions.forEach(o => o.classList.remove('active'));
                                opt.classList.add('active');
                                if (themeNameEl) themeNameEl.textContent = opt.getAttribute('data-name');
                                this.ui.game.setStartMap(5);
                                this.updateStartScreenTheme(5);
                            }
                        } else {
                            opt.style.display = 'none';
                        }
                    });
                } else {
                    // Show all in Advance
                    mapOptions.forEach(opt => {
                        opt.style.display = 'flex';
                    });
                }

                this.setupTutorialIcons();
                this.ui.updateAllUI();
            };
            modeBtn.addEventListener('click', handler, { signal: this.abortController.signal });
        });
    }

    private updateStartScreenTheme(index: number): void {
        const screen = document.getElementById('start-screen');
        if (screen) {
            const mapId = this.ui.game.getMapIdByIndex(index);
            screen.setAttribute('data-theme', mapId);
        }
    }

    private getMapDescription(index: number): string {
        const descriptions = [
            "NEON CITY: The heart of the cyber world.",      // 0
            "TECNHO JUNGLE: Dense bio-synthetic growth.",    // 1
            "OCEAN ABYSS: High-pressure data streams.",      // 2
            "VOLCANO CORE: Thermal energy overflow.",        // 3
            "STAR FORGE: Zero-gravity manufacturing.",       // 4
            "SUNNY HIGHLANDS: Peaceful classic vibes."       // 5
        ];
        return descriptions[index] || "Unknown Sectors";
    }

    private setupTutorialIcons(): void {
        const jumpIcon = document.getElementById('tut-jump-icon');
        const dashIcon = document.getElementById('tut-dash-icon');
        const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const classicBtn = document.querySelector('.mode-option[data-mode="classic"]');
        const isClassic = classicBtn?.classList.contains('active');

        if (jumpIcon) {
            if (isTouch) {
                jumpIcon.innerHTML = `<img src="${IconDrawer.getSimpleIcon('hand')}" style="width: 40px; height: 40px; object-fit: contain;">`;
            } else {
                jumpIcon.textContent = 'SPACE';
            }
            jumpIcon.className = `tut-icon ${isTouch ? 'touch-icon' : 'key-icon'}`;
        }

        if (dashIcon) {
            const dashItem = document.getElementById('tut-dash');
            const separator = document.querySelector('.tut-separator') as HTMLElement;
            if (isClassic) {
                if (dashItem) dashItem.style.display = 'none';
                if (separator) separator.style.display = 'none';
            } else {
                if (dashItem) dashItem.style.display = 'flex';
                if (separator) separator.style.display = 'block';
                if (isTouch) {
                    dashIcon.innerHTML = `<img src="${IconDrawer.getSimpleIcon('hand')}" style="width: 35px; height: 35px; object-fit: contain;"> <span style="font-size: 0.6rem; margin-left: 4px;">R</span>`;
                } else {
                    dashIcon.textContent = 'SHIFT';
                }
                dashIcon.className = `tut-icon ${isTouch ? 'touch-icon' : 'key-icon'}`;
                if (isTouch) dashIcon.style.fontSize = '0.6rem';
            }
        }
    }
}
