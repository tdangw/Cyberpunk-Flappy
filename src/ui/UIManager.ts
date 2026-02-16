import type { Game } from '../core/Game';
import { SaveManager } from '../managers/SaveManager';
import { SkinManager } from '../managers/SkinManager';
import { AudioManager } from '../managers/AudioManager';
import { IconDrawer } from './IconDrawer';
import type { IUIManager } from './IUIManager';
import { ShopScreen } from './screens/ShopScreen';
import { InventoryScreen } from './screens/InventoryScreen';
import { LeaderboardScreen } from './screens/LeaderboardScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { StartScreen } from './screens/StartScreen';
import { HUD } from './screens/HUD';

/**
 * Manages all UI interactions (modals, buttons, HUD, Tooltips).
 * Coordinates specialized screens.
 */
export class UIManager implements IUIManager {
    game: Game;
    saveManager: SaveManager;
    skinManager: SkinManager;
    audioManager: AudioManager;

    shopScreen: ShopScreen;
    inventoryScreen: InventoryScreen;
    leaderboardScreen: LeaderboardScreen;
    settingsScreen: SettingsScreen;
    startScreen: StartScreen;
    hud: HUD;

    private confirmCallback: ((qty?: number) => void) | null = null;
    private tooltipEl: HTMLElement | null = null;
    private notifTimeout: any = null;
    private tooltipTimeout: any = null;

    constructor(game: Game) {
        this.game = game;
        this.saveManager = SaveManager.getInstance();
        this.skinManager = SkinManager.getInstance();
        this.audioManager = AudioManager.getInstance();
        this.tooltipEl = document.getElementById('custom-tooltip');

        // Initialize Screens
        this.hud = new HUD(this); // HUD first as others might depend on it (e.g. splash)
        this.shopScreen = new ShopScreen(this);
        this.inventoryScreen = new InventoryScreen(this);
        this.leaderboardScreen = new LeaderboardScreen(this);
        this.settingsScreen = new SettingsScreen(this);
        this.startScreen = new StartScreen(this);

        this.init();
    }

    private init(): void {
        this.setupGlobalListeners();
        this.updateAllUI();
        this.hud.checkTampering();
    }

    updateAllUI(): void {
        this.hud.updateAllUI();
    }

    playClick(): void {
        this.audioManager.play('click');
    }

    private setupGlobalListeners(): void {
        const bindAction = (id: string, callback: (e?: Event) => void) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('click', (e) => { e.stopPropagation(); callback(e); });
            el.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); callback(e); }, { passive: false });
        };

        bindAction('settings-btn', () => { this.playClick(); this.settingsScreen.show(); });
        bindAction('shop-btn', () => { this.playClick(); this.shopScreen.show(); });
        bindAction('backpack-btn', () => { this.playClick(); this.inventoryScreen.show(); });
        bindAction('leaderboard-btn', () => { this.playClick(); this.leaderboardScreen.show(); });

        document.querySelectorAll('.close-modal').forEach((btn) => {
            const handler = (e: Event) => {
                e.preventDefault();
                e.stopPropagation();
                this.playClick();
                this.closeActiveModals();
            };
            btn.addEventListener('click', handler);
            btn.addEventListener('touchstart', handler, { passive: false });
        });

        document.querySelectorAll('.modal-panel').forEach(modal => {
            modal.addEventListener('mousedown', (e) => e.stopPropagation());
            // ALLOW touchstart to bubble so scrolling actually works!
            modal.addEventListener('touchstart', () => {
                // We stop propagation only on mousedown (PC), but for touch (Mobile), 
                // we allow bubbling so the browser can detect vertical scrolling.
            }, { passive: true });
        });

        // Tooltip hide on touch outside
        window.addEventListener('touchstart', (e) => {
            const target = e.target as HTMLElement;
            // Hide if not touching a trigger or the tooltip itself
            if (!target.closest('.skin-card, .mode-option, .boost-card, .map-option, .btn-icon, .shop-item, .inventory-item')) {
                this.hideTooltip();
            }
        }, { passive: true });

        // Orientation
        // Orientation
        const handleOrientationChange = () => {
            const isLandscape = window.innerWidth > window.innerHeight;
            const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

            if (isTouch) {
                if (!isLandscape && document.fullscreenElement) {
                    // Portrait Mode -> Exit Fullscreen automatically to fix layout stretching
                    if (document.exitFullscreen) {
                        document.exitFullscreen().catch(() => { });
                    } else if ((document as any).webkitExitFullscreen) {
                        (document as any).webkitExitFullscreen();
                    }
                } else if (isLandscape && !document.fullscreenElement) {
                    // Landscape Mode -> Try to enter Fullscreen (may be blocked by browser policy without user gesture)
                    this.game.requestFullscreen();
                }
            }
        };
        window.addEventListener('resize', handleOrientationChange);
        window.addEventListener('orientationchange', handleOrientationChange);
        if (screen.orientation) screen.orientation.addEventListener('change', handleOrientationChange);

        window.addEventListener('mousedown', (e) => this.closeOnClickOutside(e));
        window.addEventListener('touchstart', (e) => this.closeOnClickOutside(e), { passive: false });

        this.setupConfirmListeners();

        // Retry & Revive
        bindAction('restartBtn', (e) => {
            if (e) { e.preventDefault(); e.stopPropagation(); }
            this.playClick();
            this.hud.stopReviveTimer();
            this.hud.hideGameOver();
            this.startScreen.show();
            this.game.restart();
        });

        bindAction('reviveBtn', () => {
            const cost = 3;
            if (this.saveManager.getCoins() >= cost) {
                this.playClick();
                this.saveManager.spendCoins(cost);
                this.updateAllUI();
                this.hud.stopReviveTimer();
                this.hud.hideGameOver();
                this.game.revive('paid');
            } else {
                this.showError('INSUFFICIENT CREDITS');
                const btn = document.getElementById('reviveBtn');
                btn?.classList.add('shake-error');
                setTimeout(() => btn?.classList.remove('shake-error'), 500);
            }
        });

        bindAction('reviveAdBtn', () => {
            this.playClick();
            this.hud.stopReviveTimer();
            const btn = document.getElementById('reviveAdBtn');
            if (btn) {
                const originalText = btn.innerHTML;
                btn.innerHTML = '<span>WATCHING AD...</span>';
                btn.style.pointerEvents = 'none';
                setTimeout(() => {
                    this.hud.hideGameOver();
                    this.game.revive('ad');
                    btn.innerHTML = originalText;
                    btn.style.pointerEvents = 'auto';
                }, 1500);
            }
        });

        bindAction('fullscreen-btn', () => { this.playClick(); this.toggleFullscreen(); });

        // Dash Button
        const dashBtn = document.getElementById('dash-btn');
        if (dashBtn) {
            const startDash = (e: Event) => {
                e.preventDefault();
                e.stopPropagation();
                this.game.getInputManager().triggerDashStart();
            };
            const stopDash = (e: Event) => {
                e.preventDefault();
                this.game.getInputManager().triggerDashEnd();
            };
            dashBtn.addEventListener('pointerdown', startDash);
            window.addEventListener('pointerup', stopDash);
        }

        bindAction('play-btn', () => {
            this.playClick();
            this.hud.hideSplashScreen();
            this.startScreen.show();
            this.game.onSplashPlay();
        });

        // Global Custom Events
        window.addEventListener('gameStarted', () => {
            this.hud.animateMapName();
            this.startScreen.hide();
            this.hud.hideSplashScreen();
        });

        window.addEventListener('gameOver', ((e: CustomEvent) => {
            this.hud.showGameOver(
                e.detail.score,
                e.detail.coins,
                e.detail.isClassic,
                e.detail.bestDistance,
                e.detail.canAdRevive,
                e.detail.canQuickRevive
            );
        }) as EventListener);

        window.addEventListener('updateUI', () => this.updateAllUI());
        window.addEventListener('showStartScreen', () => this.hud.resetMapNameAnimation());

        window.addEventListener('openSettings', () => {
            const panel = document.getElementById('settings-panel');
            if (panel?.classList.contains('modal-active')) {
                this.playClick();
                this.closeActiveModals();
            } else {
                this.playClick();
                this.settingsScreen.show();
            }
        });

        window.addEventListener('phaseReward', () => this.hud.showBonus());
        window.addEventListener('fpsUpdate', ((e: CustomEvent) => {
            const el = document.getElementById('fps-display');
            if (el) el.textContent = `${e.detail} FPS`;
        }) as EventListener);

        window.addEventListener('startCountdown', ((e: CustomEvent) => {
            if (e.detail.onStart) e.detail.onStart();
            this.hud.runCountdown(e.detail.onComplete);
        }) as EventListener);

        window.addEventListener('securityAlert', () => this.hud.showSecurityAlert());

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                if (this.game.getState() === 'PLAYING') {
                    this.game.pause();
                    this.settingsScreen.show();
                }
                this.audioManager.pauseAll();
            } else {
                this.audioManager.resumeAll();
            }
        });
    }

    private setupConfirmListeners(): void {
        document.getElementById('confirm-cancel')?.addEventListener('click', () => {
            this.playClick();
            document.getElementById('confirm-modal')?.classList.remove('modal-active');
        });
        document.getElementById('confirm-ok')?.addEventListener('click', () => {
            this.playClick();
            const qtyInput = document.getElementById('confirm-qty-input') as HTMLInputElement;
            const qty = parseInt(qtyInput?.value || '1');
            if (this.confirmCallback) { (this.confirmCallback as any)(qty); this.confirmCallback = null; }
            document.getElementById('confirm-modal')?.classList.remove('modal-active');
        });
    }

    showConfirm(title: string, msg: string, callback: (qty?: number) => void, showQty: boolean = false): void {
        const modal = document.getElementById('confirm-modal');
        const titleEl = document.getElementById('confirm-title');
        const msgEl = document.getElementById('confirm-msg');
        const qtyContainer = document.getElementById('confirm-qty-container');
        const qtyInput = document.getElementById('confirm-qty-input') as HTMLInputElement;

        if (!modal || !titleEl || !msgEl) return;

        titleEl.textContent = title;
        msgEl.textContent = msg;

        if (qtyContainer) qtyContainer.style.display = showQty ? 'block' : 'none';
        if (qtyInput) qtyInput.value = '1';

        this.confirmCallback = callback;
        modal.classList.add('modal-active');
    }

    showTooltip(text: string, x: number, y: number): void {
        if (!this.tooltipEl) return;

        // Auto-hide old timer
        if (this.tooltipTimeout) clearTimeout(this.tooltipTimeout);

        this.tooltipEl.textContent = text;
        this.tooltipEl.style.display = 'block';

        const rect = this.tooltipEl.getBoundingClientRect();
        let posX = x + 15;
        let posY = y + 15;

        // Mobile offset adjustment to avoid being under finger
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
            if (y < window.innerHeight * 0.4) {
                posY = y + 45; // Show BELOW if touching elements at the top (like mode buttons)
            } else {
                posY = y - rect.height - 40; // Show ABOVE finger for other elements
            }
        }

        if (posX + rect.width > window.innerWidth) posX = x - rect.width - 15;
        if (posY + rect.height > window.innerHeight) posY = y - rect.height - 15;
        if (posY < 5) posY = y + 30; // Don't go off top

        this.tooltipEl.style.left = `${posX}px`;
        this.tooltipEl.style.top = `${posY}px`;

        // Auto-hide on mobile after 2.5 seconds
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
            this.tooltipTimeout = setTimeout(() => this.hideTooltip(), 2500);
        }
    }

    hideTooltip(): void {
        if (this.tooltipTimeout) clearTimeout(this.tooltipTimeout);
        if (this.tooltipEl) this.tooltipEl.style.display = 'none';
    }

    showCentralNotification(msg: string, type: 'success' | 'error' = 'success'): void {
        const popup = document.getElementById('notification-popup');
        const icon = document.getElementById('notif-icon');
        const txt = document.getElementById('notif-message');

        if (!popup || !icon || !txt) return;

        popup.className = `notification-popup show ${type}`;
        icon.innerHTML = `<img src="${IconDrawer.getSimpleIcon(type)}" alt="${type}">`;
        txt.textContent = msg;

        if (this.notifTimeout) clearTimeout(this.notifTimeout);
        this.notifTimeout = setTimeout(() => {
            popup.classList.remove('show');
        }, 1500);

        if (type === 'success') this.audioManager.play('buy_success');
        else this.audioManager.play('buy_fail');
    }

    showError(msg: string): void {
        this.showCentralNotification(msg, 'error');
    }

    closeActiveModals(onFinalComplete?: () => void): void {
        const activeModals = document.querySelectorAll('.modal-panel.modal-active');
        if (activeModals.length === 0) {
            if (onFinalComplete) onFinalComplete();
            return;
        }

        activeModals.forEach(m => m.classList.remove('modal-active'));

        if (this.game.getState() === 'PAUSED') {
            this.game.resumeWithCountdown(onFinalComplete);
        } else {
            if (onFinalComplete) onFinalComplete();
        }
    }

    private closeOnClickOutside(e: Event): void {
        const target = e.target as HTMLElement;
        const activeModal = document.querySelector('.modal-panel.modal-active');
        if (activeModal && !target.closest('.modal-panel') && !target.closest('.btn-icon')) {
            this.closeActiveModals();
        }
    }

    private toggleFullscreen(): void {
        const doc = document as any;
        if (!doc.fullscreenElement && !doc.webkitFullscreenElement) {
            this.game.requestFullscreen();
        } else {
            const exit = doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen;
            if (exit) exit.call(doc);
        }
    }
}
