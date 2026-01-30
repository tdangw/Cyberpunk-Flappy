import type { Game } from '../core/Game';
import { SaveManager } from '../managers/SaveManager';
import { SkinManager } from '../managers/SkinManager';
import { AudioManager } from '../managers/AudioManager';
import { DEFAULT_CONFIG, MAPS } from '../config/constants';
import { BOOSTS } from '../config/boosts';
import type { BoostDefinition } from '../config/boosts';
import { IconDrawer } from './IconDrawer';

/**
 * Manages all UI interactions (modals, buttons, HUD, Tooltips)
 */
export class UIManager {
    private game: Game;
    private saveManager: SaveManager;
    private skinManager: SkinManager;
    private audioManager: AudioManager;

    private confirmCallback: (() => void) | null = null;
    private tooltipEl: HTMLElement | null = null;
    private currentShopTab: 'skins' | 'boosts' = 'skins';
    private currentShopPage: number = 1;

    private currentInvTab: 'skins' | 'boosts' = 'skins';
    private currentInvPage: number = 1;

    private currentLBTab: 'personal' | 'online' = 'personal';
    private currentLBMap: string = 'classic';

    private readonly itemsPerPage: number = 20; // 5 rows x 4 items
    private lastStartTouchTime: number = 0;
    private startScreenCooldown: number = 0;
    private reviveTimer: any = null;

    constructor(game: Game) {
        this.game = game;
        this.saveManager = SaveManager.getInstance();
        this.skinManager = SkinManager.getInstance();
        this.audioManager = AudioManager.getInstance();
        this.tooltipEl = document.getElementById('custom-tooltip');

        this.init();
    }

    private init(): void {
        this.setupEventListeners();
        this.setupMapSelector();
        this.updateAllUI();
        this.updateAudioUI();
        this.checkTampering();
        this.replaceIcons();

        // Listen for real-time security alerts
        window.addEventListener('securityAlert', () => this.showSecurityAlert());
    }

    private checkTampering(): void {
        if (this.saveManager.isTampered()) {
            this.showSecurityAlert();
        }
    }

    private showSecurityAlert(): void {
        const securityModal = document.getElementById('security-modal');
        const okBtn = document.getElementById('security-ok');

        if (securityModal && !securityModal.classList.contains('modal-active')) {
            this.game.pause();
            securityModal.classList.add('modal-active');

            okBtn?.addEventListener('click', () => {
                this.playClick();
                securityModal.classList.remove('modal-active');
                this.game.resume();
            }, { once: true });
        }
    }

    private playClick(): void {
        this.audioManager.play('click');
    }

    private setupEventListeners(): void {
        const bindAction = (id: string, callback: (e?: Event) => void) => {
            const el = document.getElementById(id);
            if (!el) return;
            // Handle Click
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                callback(e);
            });
            // Handle Touch - Prevent Default to stop Ghost Click
            el.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                callback(e);
            }, { passive: false });
        };

        bindAction('settings-btn', () => { this.playClick(); this.showSettings(); });
        bindAction('shop-btn', () => { this.playClick(); this.showShop(); });
        bindAction('backpack-btn', () => { this.playClick(); this.showBackpack(); });
        bindAction('leaderboard-btn', () => { this.playClick(); this.showLeaderboard(); });

        // Shop Tabs logic
        document.getElementById('shop-panel')?.querySelectorAll('.shop-tab').forEach((tab) => {
            const handler = (e: Event) => {
                e.preventDefault();
                e.stopPropagation();
                this.playClick();
                document.getElementById('shop-panel')?.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
                (e.target as HTMLElement).classList.add('active');
                this.currentShopTab = (e.target as HTMLElement).getAttribute('data-tab') as any;
                this.currentShopPage = 1;
                this.renderShopGrid();
            };
            tab.addEventListener('click', handler);
            tab.addEventListener('touchstart', handler, { passive: false });
        });

        // Inventory Tabs logic
        document.getElementById('inventory-panel')?.querySelectorAll('.shop-tab').forEach((tab) => {
            const handler = (e: Event) => {
                e.preventDefault();
                e.stopPropagation();
                this.playClick();
                document.getElementById('inventory-panel')?.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
                (e.target as HTMLElement).classList.add('active');
                this.currentInvTab = (e.target as HTMLElement).getAttribute('data-tab') as any;
                this.currentInvPage = 1;
                this.renderInventoryGrid();
            };
            tab.addEventListener('click', handler);
            tab.addEventListener('touchstart', handler, { passive: false });
        });

        // Leaderboard Tabs logic
        document.getElementById('leaderboard-panel')?.querySelectorAll('.shop-tab').forEach((tab) => {
            const handler = (e: Event) => {
                e.preventDefault();
                e.stopPropagation();
                this.playClick();
                document.getElementById('leaderboard-panel')?.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
                (e.target as HTMLElement).classList.add('active');
                this.currentLBTab = (e.target as HTMLElement).getAttribute('data-lb-tab') as any;

                // Toggle map tabs visibility
                const panel = document.getElementById('leaderboard-panel');
                if (panel) panel.setAttribute('data-online', this.currentLBTab === 'online' ? 'true' : 'false');

                this.renderLeaderboard();
            };
            tab.addEventListener('click', handler);
            tab.addEventListener('touchstart', handler, { passive: false });
        });

        // Leaderboard Map Sub-Tabs logic
        document.getElementById('leaderboard-panel')?.querySelectorAll('.lb-sub-tab').forEach((tab) => {
            const handler = (e: Event) => {
                e.preventDefault();
                e.stopPropagation();
                this.playClick();
                document.getElementById('leaderboard-panel')?.querySelectorAll('.lb-sub-tab').forEach(t => t.classList.remove('active'));
                (e.target as HTMLElement).classList.add('active');
                this.currentLBMap = (e.target as HTMLElement).getAttribute('data-lb-map') || 'classic';
                this.renderLeaderboard();
            };
            tab.addEventListener('click', handler);
            tab.addEventListener('touchstart', handler, { passive: false });
        });

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

        // Click outside to close modals
        document.querySelectorAll('.modal-panel').forEach(modal => {
            modal.addEventListener('mousedown', (e) => e.stopPropagation());
            modal.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: false });
        });

        // Mobile Tooltip Fix: Hide tooltip if touching outside interactive elements
        window.addEventListener('touchstart', (e) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.skin-card') && !target.closest('.mode-option') && !target.closest('.boost-card')) {
                this.hideTooltip();
            }
        }, { passive: true });

        // Auto Fullscreen on Landscape Rotation (Mobile)
        const handleOrientationChange = () => {
            const isLandscape = window.innerWidth > window.innerHeight;
            // Check if it's a mobile device (touch capable)
            const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

            if (isMobile && isLandscape && !document.fullscreenElement) {
                // Attempt to enter fullscreen
                document.documentElement.requestFullscreen().catch(err => {
                    // Silent catch - browser might block if no user interaction immediately precedes this
                    // But often rotating device happens while holding (events fired)
                    console.log('Auto-fullscreen blocked:', err);
                });
            }
        };

        // Listen for orientation changes via resize and API
        window.addEventListener('resize', handleOrientationChange);
        if (screen.orientation) {
            screen.orientation.addEventListener('change', handleOrientationChange);
        }

        // Close on click outside (Modals)
        window.addEventListener('mousedown', (e) => this.closeOnClickOutside(e));
        window.addEventListener('touchstart', (e) => this.closeOnClickOutside(e), { passive: false });

        this.setupSettingsControls();
        this.setupAudioControls();
        this.setupConfirmControls();

        // Retry Button
        bindAction('restartBtn', (e) => {
            if (e) { e.preventDefault(); e.stopPropagation(); }
            this.playClick();
            this.stopReviveTimer();
            this.hideGameOver();
            this.showStartScreen();
            this.startScreenCooldown = Date.now(); // Prevent immediate start
            this.game.restart();
        });

        // Revive Button (Quick)
        bindAction('reviveBtn', () => {
            const cost = 3;
            if (this.saveManager.getCoins() >= cost) {
                this.playClick();
                this.saveManager.spendCoins(cost);
                this.updateAllUI(); // Cập nhật xu ngay lập tức!
                this.stopReviveTimer();
                this.hideGameOver();
                this.game.revive('paid');
            } else {
                this.showError('INSUFFICIENT CREDITS');
                const btn = document.getElementById('reviveBtn');
                btn?.classList.add('shake-error');
                setTimeout(() => btn?.classList.remove('shake-error'), 500);
            }
        });

        // Revive Button (AD)
        bindAction('reviveAdBtn', () => {
            this.playClick();
            this.stopReviveTimer();
            // Simulate watching Ad
            const btn = document.getElementById('reviveAdBtn');
            if (btn) {
                const originalText = btn.innerHTML;
                btn.innerHTML = '<span>WATCHING AD...</span>';
                btn.style.pointerEvents = 'none';
                setTimeout(() => {
                    this.hideGameOver();
                    this.game.revive('ad');
                    btn.innerHTML = originalText;
                    btn.style.pointerEvents = 'auto';
                }, 1500);
            }
        });

        bindAction('fullscreen-btn', () => { this.playClick(); this.toggleFullscreen(); });

        // Dash Button in HUD
        const dashBtn = document.getElementById('dash-btn');
        if (dashBtn) {
            const startDash = (e: Event) => {
                e.preventDefault();
                e.stopPropagation(); // Stop from bubbling to jump logic
                this.game.getInputManager().triggerDashStart();
            };
            const stopDash = (e: Event) => {
                e.preventDefault();
                this.game.getInputManager().triggerDashEnd();
            };
            // Use pointer events for maximum reliability
            dashBtn.addEventListener('pointerdown', startDash);
            window.addEventListener('pointerup', stopDash);
        }

        // Play Button on Splash Screen
        bindAction('play-btn', () => {
            this.playClick();
            this.hideSplashScreen();
            this.showStartScreen();
            this.game.onSplashPlay();
        });

        // Optimized Start Screen Listener
        const startScreen = document.getElementById('start-screen');
        const startHandler = (e: Event) => {
            if (Date.now() - this.startScreenCooldown < 300) return;
            if (e.type === 'touchstart') this.lastStartTouchTime = Date.now();
            if (e.type === 'mousedown' && Date.now() - this.lastStartTouchTime < 500) return;

            const target = e.target as HTMLElement;
            // If user clicked a button (map, mode, settings), don't start the game
            if (target.closest('.map-option, .mode-option, .btn-icon, .modal-panel')) return;

            // Otherwise, initiate
            if (this.game.getState() === 'START') {
                e.preventDefault();
                e.stopPropagation();

                this.animateMapName();
                this.hideStartScreen();
                this.game.resume(true);
            }
        };
        startScreen?.addEventListener('mousedown', startHandler);
        startScreen?.addEventListener('touchstart', startHandler, { passive: false });

        window.addEventListener('keydown', (e) => {
            if ((e.code === 'Space' || e.code === 'ArrowUp') && this.game.getState() === 'START') {
                // If it's the start screen, the game started event will catch it
            }
        });

        window.addEventListener('gameStarted', () => {
            this.animateMapName();
            this.hideStartScreen();
            this.hideSplashScreen();
        });

        window.addEventListener('gameOver', ((e: CustomEvent) => {
            this.showGameOver(
                e.detail.score,
                e.detail.coins,
                e.detail.isClassic,
                e.detail.bestDistance,
                e.detail.canAdRevive,
                e.detail.canQuickRevive
            );
        }) as EventListener);

        window.addEventListener('updateUI', () => this.updateAllUI());

        window.addEventListener('showStartScreen', () => {
            this.resetMapNameAnimation();
        });

        window.addEventListener('openSettings', () => {
            const panel = document.getElementById('settings-panel');
            if (panel?.classList.contains('modal-active')) {
                this.playClick();
                this.closeActiveModals();
            } else {
                this.playClick();
                this.showSettings();
            }
        });

        window.addEventListener('phaseReward', () => this.showBonus());
        window.addEventListener('fpsUpdate', ((e: CustomEvent) => {
            const el = document.getElementById('fps-display');
            if (el) el.textContent = `${e.detail} FPS`;
        }) as EventListener);

        window.addEventListener('startCountdown', ((e: CustomEvent) => {
            if (e.detail.onStart) e.detail.onStart();
            this.runCountdown(e.detail.onComplete);
        }) as EventListener);

        // Visibility Change Protection (Anti-drain / Auto-pause)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                // Rời tab hoặc tắt màn hình
                if (this.game.getState() === 'PLAYING') {
                    this.game.pause();
                    this.showSettings(); // Tự động mở menu để game không chạy tiếp khi quay lại
                }
                this.audioManager.pauseAll();
            } else {
                // Quay lại tab
                // Chỉ resume nhạc, game vẫn đợi người chơi đóng menu
                this.audioManager.resumeAll();
            }
        });

        setInterval(() => this.updateEnergyBar(), 100);
    }

    private closeOnClickOutside(e: Event): void {
        const target = e.target as HTMLElement;
        const activeModal = document.querySelector('.modal-panel.modal-active');
        // Close if clicking overlay (outside modal-panel) AND not clicking a button implementation
        if (activeModal && !target.closest('.modal-panel') && !target.closest('.btn-icon')) {
            this.closeActiveModals();
        }
    }

    private setupSettingsControls(): void {
        const config = this.game.getConfig();
        const setupSlider = (id: string, valId: string, initial: number, updateFn: (v: number) => void) => {
            const range = document.getElementById(id) as HTMLInputElement;
            const val = document.getElementById(valId);
            if (range && val) {
                range.value = initial.toString();
                val.textContent = initial.toString();
                range.addEventListener('input', () => {
                    val.textContent = range.value;
                    updateFn(parseFloat(range.value));
                });
            }
        };

        setupSlider('speedRange', 'val-speed', config.speed, (v) => this.game.updateConfig({ speed: v }));
        setupSlider('gravityRange', 'val-gravity', config.gravity, (v) => this.game.updateConfig({ gravity: v }));
        setupSlider('liftRange', 'val-lift', config.jump, (v) => this.game.updateConfig({ jump: v }));
        setupSlider('gapRange', 'val-gap', config.pipeGap, (v) => this.game.updateConfig({ pipeGap: v }));
        setupSlider('spacingRange', 'val-spacing', config.pipeSpacing, (v) => this.game.updateConfig({ pipeSpacing: v }));

        document.getElementById('applySettingsBtn')?.addEventListener('click', () => {
            this.playClick();
            this.closeActiveModals(() => {
                this.game.restart();
                this.showSplashScreen();
            });
        });

        document.getElementById('resetDefaultsBtn')?.addEventListener('click', () => {
            this.playClick();
            this.resetSettings();
        });
    }

    private setupAudioControls(): void {
        const settings = this.audioManager.getSettings();
        const bgmRange = document.getElementById('bgmVolumeRange') as HTMLInputElement;
        const sfxRange = document.getElementById('sfxVolumeRange') as HTMLInputElement;

        if (bgmRange) {
            bgmRange.value = settings.bgmVolume.toString();
            bgmRange.addEventListener('input', () => this.audioManager.setBGMVolume(parseFloat(bgmRange.value)));
        }
        if (sfxRange) {
            sfxRange.value = settings.sfxVolume.toString();
            sfxRange.addEventListener('input', () => this.audioManager.setSFXVolume(parseFloat(sfxRange.value)));
        }

        document.getElementById('toggle-bgm')?.addEventListener('click', () => {
            this.playClick();
            this.audioManager.setBGMEnabled(!this.audioManager.getSettings().bgmEnabled);
            this.updateAudioUI();
        });
        document.getElementById('toggle-sfx')?.addEventListener('click', () => {
            this.playClick();
            this.audioManager.setSFXEnabled(!this.audioManager.getSettings().sfxEnabled);
            this.updateAudioUI();
        });
        // Dash Control Selectors
        document.getElementById('mode-touch')?.addEventListener('click', () => {
            this.playClick();
            this.game.updateConfig({ dashControl: 'touch' });
            this.updateControlUI();
        });
        document.getElementById('mode-left')?.addEventListener('click', () => {
            this.playClick();
            this.game.updateConfig({ dashControl: 'button_left' });
            this.updateControlUI();
        });
        document.getElementById('mode-right')?.addEventListener('click', () => {
            this.playClick();
            this.game.updateConfig({ dashControl: 'button_right' });
            this.updateControlUI();
        });
        document.getElementById('mode-fps')?.addEventListener('click', () => {
            this.playClick();
            const current = this.game.getConfig().showFPS;
            this.game.updateConfig({ showFPS: !current });
            this.updateControlUI();
        });
        document.getElementById('toggle-bg-details')?.addEventListener('click', () => {
            this.playClick();
            const current = this.game.getConfig().showBackgroundDetails;
            this.game.updateConfig({ showBackgroundDetails: !current });
            this.updateControlUI();
        });
        document.getElementById('toggle-ground-details')?.addEventListener('click', () => {
            this.playClick();
            const current = this.game.getConfig().showGroundDetails;
            this.game.updateConfig({ showGroundDetails: !current });
            this.updateControlUI();
        });
    }

    private setupConfirmControls(): void {
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

    private updateAudioUI(): void {
        const settings = this.audioManager.getSettings();
        const btnBGM = document.getElementById('toggle-bgm');
        const btnSFX = document.getElementById('toggle-sfx');
        if (btnBGM) {
            btnBGM.textContent = settings.bgmEnabled ? 'ON' : 'OFF';
            btnBGM.className = `btn-toggle ${settings.bgmEnabled ? 'on' : 'off'}`;
        }
        if (btnSFX) {
            btnSFX.textContent = settings.sfxEnabled ? 'ON' : 'OFF';
            btnSFX.className = `btn-toggle ${settings.sfxEnabled ? 'on' : 'off'}`;
        }
    }

    private updateControlUI(): void {
        const config = this.game.getConfig();
        const isClassic = this.game.isClassic();
        const container = document.getElementById('game-container');
        const dashContainer = document.getElementById('dash-btn-container');

        // Update Active States in Settings
        const btnTouch = document.getElementById('mode-touch');
        const btnLeft = document.getElementById('mode-left');
        const btnRight = document.getElementById('mode-right');
        const btnFPS = document.getElementById('mode-fps');

        [btnTouch, btnLeft, btnRight].forEach(b => b?.classList.remove('active'));
        if (config.dashControl === 'touch') btnTouch?.classList.add('active');
        else if (config.dashControl === 'button_left') btnLeft?.classList.add('active');
        else if (config.dashControl === 'button_right') btnRight?.classList.add('active');

        if (btnFPS) {
            if (config.showFPS) {
                btnFPS.classList.add('active');
                container?.classList.add('has-fps');
            } else {
                btnFPS.classList.remove('active');
                container?.classList.remove('has-fps');
            }
        }

        const btnBg = document.getElementById('toggle-bg-details');
        if (btnBg) {
            const isOn = config.showBackgroundDetails;
            btnBg.textContent = isOn ? 'ON' : 'OFF';
            btnBg.classList.remove('on', 'off', 'active');
            btnBg.classList.add(isOn ? 'on' : 'off');
        }

        const btnGround = document.getElementById('toggle-ground-details');
        if (btnGround) {
            const isOn = config.showGroundDetails;
            btnGround.textContent = isOn ? 'ON' : 'OFF';
            btnGround.classList.remove('on', 'off', 'active');
            btnGround.classList.add(isOn ? 'on' : 'off');
        }

        // Dashboard HUD Visibility and Position
        if (dashContainer) {
            // Classic mode OR Touch mode hides the physical button
            if (isClassic || config.dashControl === 'touch') {
                dashContainer.style.display = 'none';
                container?.classList.remove('has-dash-btn');
            } else {
                dashContainer.style.display = 'block';
                container?.classList.add('has-dash-btn');

                if (config.dashControl === 'button_left') {
                    dashContainer.style.left = '2rem';
                    dashContainer.style.right = 'auto';
                } else if (config.dashControl === 'button_right') {
                    dashContainer.style.left = 'auto';
                    dashContainer.style.right = '2rem';
                }
            }
        }
    }

    private showSettings(): void {
        this.game.pause();
        this.updateControlUI(); // Ensure UI reflects current state
        document.getElementById('settings-panel')?.classList.add('modal-active');
    }

    private closeActiveModals(onFinalComplete?: () => void): void {
        const activeModals = document.querySelectorAll('.modal-panel.modal-active');
        if (activeModals.length === 0) {
            if (onFinalComplete) onFinalComplete();
            return;
        }

        activeModals.forEach(m => m.classList.remove('modal-active'));

        // If we were paused, resume with countdown
        if (this.game.getState() === 'PAUSED') {
            this.game.resumeWithCountdown(onFinalComplete);
        } else {
            if (onFinalComplete) onFinalComplete();
        }
    }

    private runCountdown(onComplete: () => void): void {
        const overlay = document.getElementById('countdown-overlay');
        const text = document.getElementById('countdown-text');
        if (!overlay || !text) {
            onComplete();
            return;
        }

        overlay.style.display = 'flex';
        let count = 3;
        text.textContent = count.toString();
        this.audioManager.play('click'); // Beep for count

        const interval = setInterval(() => {
            count--;
            if (count > 0) {
                text.textContent = count.toString();
                this.audioManager.play('click');
            } else {
                clearInterval(interval);
                overlay.style.display = 'none';
                onComplete();
            }
        }, 800); // 800ms per count for a snappy feel
    }

    private showShop(): void {
        this.game.pause();
        this.renderShopGrid();
        this.updateShopBalance();
        this.updateSkinsOwnedCount();
        document.getElementById('shop-panel')?.classList.add('modal-active');
    }

    private showBackpack(): void {
        this.game.pause();
        this.renderInventoryGrid();
        this.updateInventoryStats();
        document.getElementById('inventory-panel')?.classList.add('modal-active');
    }

    private updateInventoryStats(): void {
        const ownedCount = this.saveManager.getOwnedSkins().length;
        const totalSkins = this.skinManager.getAllSkins().length;
        const el = document.getElementById('inv-skins-count');
        if (el) el.textContent = `${ownedCount}/${totalSkins} SKINS ARCHIVED`;
    }

    private showLeaderboard(): void {
        this.game.pause();
        this.renderLeaderboard();
        document.getElementById('leaderboard-panel')?.classList.add('modal-active');
    }

    private renderLeaderboard(): void {
        const container = document.getElementById('lb-content');
        const mapTabs = document.getElementById('lb-map-tabs');
        if (!container) return;
        container.innerHTML = '';

        if (this.currentLBTab === 'personal') {
            if (mapTabs) mapTabs.style.display = 'flex';
            this.renderPersonalLB(container);
        } else {
            if (mapTabs) mapTabs.style.display = 'none';
            this.renderOnlineLB(container);
        }
    }

    private renderPersonalLB(container: HTMLElement): void {
        const isClassic = this.currentLBMap === 'classic';
        const mapIdx = parseInt(this.currentLBMap);
        const mapDef = !isClassic ? MAPS[mapIdx] : null;

        let highScore = 0;
        let maxDist = 0;
        let totalCoins = 0;

        if (isClassic) {
            highScore = this.saveManager.getHighScore(true);
            maxDist = 0;
            totalCoins = 0;
        } else if (mapDef) {
            const mId = mapDef.id;
            highScore = this.saveManager.getMapHighScore(mId);
            maxDist = this.saveManager.getMapMaxDistance(mId);
            totalCoins = this.saveManager.getMapTotalCoins(mId);
        }

        container.innerHTML = `
            <div class="lb-detail-row">
                <div class="lb-detail-label">HIGHEST RECORD</div>
                <div class="lb-detail-value highlight">${highScore}</div>
            </div>

            <div class="lb-detail-row">
                <div class="lb-detail-label">MAX DISTANCE</div>
                <div class="lb-detail-value">${Math.floor(maxDist)} <span class="unit">m</span></div>
            </div>

            <div class="lb-detail-row">
                <div class="lb-detail-label">CREDITS ACQUIRED</div>
                <div class="lb-detail-value">${totalCoins} <span class="unit">$</span></div>
            </div>
        `;
    }

    private renderOnlineLB(container: HTMLElement): void {
        container.innerHTML = `
            <div style="text-align: center; padding: 4rem 2rem; color: #888;">
                <h3 class="neon-text-blue" style="margin-bottom: 1rem;">NEURAL NETWORK</h3>
                <p style="font-size: 0.8rem; letter-spacing: 1px;">CONNECTING TO GLOBAL RANKING...</p>
                <div style="font-size: 4rem; margin: 1.5rem; filter: drop-shadow(0 0 10px var(--neon-blue));">🌐</div>
                <p style="font-size: 0.9rem; color: var(--neon-blue); font-weight: 900; margin-top: 1rem;">ACCESS RESTRICTED</p>
                <p style="font-size: 0.7rem; opacity: 0.6; margin-top: 0.5rem; letter-spacing: 1px;">SYNCHRONIZING GLOBAL DATALINK...</p>
                <p style="font-size: 0.6rem; opacity: 0.4; margin-top: 0.4rem;">PLEASE WAIT FOR NETWORK CALIBRATION</p>
            </div>
         `;
    }

    private updateSkinsOwnedCount(): void {
        const owned = this.saveManager.getOwnedSkins().length;
        const total = this.skinManager.getAllSkins().length;
        const ownedEl = document.getElementById('owned-skins-count');
        const totalEl = document.getElementById('total-skins-count');
        if (ownedEl) ownedEl.textContent = owned.toString();
        if (totalEl) totalEl.textContent = total.toString();
    }

    private showTooltip(text: string, x: number, y: number): void {
        if (!this.tooltipEl) return;
        this.tooltipEl.textContent = text;
        this.tooltipEl.style.display = 'block';

        const rect = this.tooltipEl.getBoundingClientRect();
        let posX = x + 15;
        let posY = y + 15;
        if (posX + rect.width > window.innerWidth) posX = x - rect.width - 15;
        if (posY + rect.height > window.innerHeight) posY = y - rect.height - 15;

        this.tooltipEl.style.left = `${posX}px`;
        this.tooltipEl.style.top = `${posY}px`;
    }

    private hideTooltip(): void {
        if (this.tooltipEl) this.tooltipEl.style.display = 'none';
    }

    private resetMapNameAnimation(): void {
        const themeNameEl = document.getElementById('selected-theme-name');
        const hudLabel = document.getElementById('hud-map-name');

        if (themeNameEl) {
            themeNameEl.style.opacity = '1';
            themeNameEl.style.transition = 'none';
        }

        if (hudLabel) {
            hudLabel.classList.remove('active');
            hudLabel.style.opacity = '0';
            hudLabel.style.transform = 'translateX(-50%)';
            hudLabel.style.transition = 'none';
        }
    }

    private updateEnergyBar(): void {
        const fill = document.getElementById('energy-fill');
        const label = document.getElementById('energy-label');
        const qtyEl = document.getElementById('nitro-qty');
        const energyPct = this.game.getEnergy();

        if (fill) fill.style.width = `${energyPct}%`;
        if (label) label.textContent = `NITRO (${energyPct.toFixed(1)}%)`;

        if (qtyEl) {
            const qty = this.game.getNitroQuantity();
            qtyEl.textContent = qty > 0 ? `x${qty}` : '';
            qtyEl.style.display = qty > 0 ? 'block' : 'none';
        }
    }

    private renderShopGrid(): void {
        const gridEl = document.getElementById('shop-grid');
        const paginationEl = document.getElementById('shop-pagination');
        if (!gridEl || !paginationEl) return;

        const msgEl = document.getElementById('shop-msg');
        if (msgEl) msgEl.textContent = '';

        if (this.currentShopTab === 'skins') {
            const allSkins = this.skinManager.getAllSkins();
            const ownedIds = this.saveManager.getOwnedSkins();
            // Shop only shows NOT OWNED
            const buyableSkins = allSkins.filter(s => !ownedIds.includes(s.id));
            this.renderSkinGrid(buyableSkins);
            this.renderPagination(buyableSkins.length, paginationEl, 'shop');
        } else {
            // Consumable boosters (except default) show in shop
            const buyableBoosts = BOOSTS.filter(b => b.id !== 'nitro_default');
            this.renderBoostGrid(buyableBoosts);
            this.renderPagination(buyableBoosts.length, paginationEl, 'shop');
        }
    }

    private renderInventoryGrid(): void {
        const gridEl = document.getElementById('inventory-grid');
        const paginationEl = document.getElementById('inventory-pagination');
        if (!gridEl || !paginationEl) return;

        if (this.currentInvTab === 'skins') {
            const allSkins = this.skinManager.getAllSkins();
            const ownedIds = this.saveManager.getOwnedSkins();
            const ownedSkins = allSkins.filter(s => ownedIds.includes(s.id));
            this.renderInvSkinGrid(ownedSkins);
            this.renderPagination(ownedSkins.length, paginationEl, 'inv');
        } else {
            const ownedBoosts = BOOSTS.filter(b => {
                return b.id === 'nitro_default' || this.saveManager.getBoostCount(b.id) > 0;
            });
            this.renderInvBoostGrid(ownedBoosts);
            this.renderPagination(ownedBoosts.length, paginationEl, 'inv');
        }
    }

    private renderBoostGrid(allBoosts: BoostDefinition[]): void {
        const gridEl = document.getElementById('shop-grid');
        if (!gridEl) return;
        gridEl.innerHTML = '';

        const equippedId = this.saveManager.getEquippedBoostId();

        // Paginate items
        const start = (this.currentShopPage - 1) * this.itemsPerPage;
        const pageItems = allBoosts.slice(start, start + this.itemsPerPage);

        pageItems.forEach(boost => {
            const isEquipped = equippedId === boost.id;

            const card = document.createElement('div');
            card.className = `skin-card ${isEquipped ? 'equipped' : ''}`;

            card.innerHTML = `
                <div class="card-preview-box">
                    <img src="${IconDrawer.getNitroIcon(boost.id)}" alt="icon" style="width: 45px; height: 45px;">
                </div>
                <div class="card-name">${boost.name}</div>
                <div style="font-size: 0.55rem; color: #888; text-align: center; margin-bottom: 0.5rem;">${boost.capacity}m Capacity</div>
                <button class="shop-card-btn buy" style="width: 100%">BUY $${boost.price}</button>
            `;

            card.addEventListener('mouseenter', (e) => this.showTooltip(boost.description, e.clientX, e.clientY));
            card.addEventListener('mouseleave', () => this.hideTooltip());

            card.querySelector('.buy')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.playClick();
                this.handleBoostBuy(boost);
            });

            gridEl.appendChild(card);
        });
    }

    private renderInvBoostGrid(ownedBoosts: BoostDefinition[]): void {
        const gridEl = document.getElementById('inventory-grid');
        if (!gridEl) return;
        gridEl.innerHTML = '';

        const equippedId = this.saveManager.getEquippedBoostId();
        const start = (this.currentInvPage - 1) * this.itemsPerPage;
        const pageItems = ownedBoosts.slice(start, start + this.itemsPerPage);

        pageItems.forEach(boost => {
            const count = this.saveManager.getBoostCount(boost.id);
            const isEquipped = equippedId === boost.id;


            const card = document.createElement('div');
            card.className = `skin-card ${isEquipped ? 'equipped' : ''}`;
            const quantityBadge = count > 0 ? `<div class="item-quantity">${count}</div>` : '';

            card.innerHTML = `
                ${quantityBadge}
                <div class="card-preview-box">
                    <img src="${IconDrawer.getNitroIcon(boost.id)}" alt="icon" style="width: 45px; height: 45px;">
                </div>
                <div class="card-name">${boost.name}</div>
                <button class="shop-card-btn activate ${isEquipped ? 'equipped' : 'can-activate'}" style="width: 100%">
                    ${isEquipped ? 'EQUIPPED' : 'EQUIP'}
                </button>
            `;

            card.addEventListener('mouseenter', (e) => this.showTooltip(boost.description, e.clientX, e.clientY));
            card.addEventListener('mouseleave', () => this.hideTooltip());

            card.querySelector('.activate')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.playClick();
                this.handleInvBoostActivate(boost);
            });

            gridEl.appendChild(card);
        });
    }

    private handleInvBoostActivate(boost: BoostDefinition): void {
        const equippedId = this.saveManager.getEquippedBoostId();
        if (equippedId === boost.id) return;

        this.saveManager.setEquippedBoost(boost.id, boost.capacity);
        this.renderInventoryGrid();
        this.game.restart();
        this.showCentralNotification(`${boost.name.toUpperCase()} EQUIPPED`, 'success');
    }

    private handleBoostBuy(boost: BoostDefinition): void {
        this.showConfirm(`PURCHASE: ${boost.name}`, `Select quantity to buy for ${boost.name}:`, (qty) => {
            const quantity = qty || 1;
            const total = boost.price * quantity;

            if (this.saveManager.spendCoins(total)) {
                this.saveManager.addBoostToInventory(boost.id, quantity);
                this.renderShopGrid();
                this.updateAllUI();
                this.showCentralNotification(`${boost.name} x${quantity} PURCHASED!`, 'success');
            } else {
                this.showCentralNotification('INSUFFICIENT CREDITS', 'error');
            }
        }, true);
    }



    private showCentralNotification(msg: string, type: 'success' | 'error' = 'success'): void {
        const popup = document.getElementById('notification-popup');
        const icon = document.getElementById('notif-icon');
        const txt = document.getElementById('notif-message');

        if (!popup || !icon || !txt) return;

        popup.className = `notification-popup show ${type}`; // Reset classes

        // Use Image Icon
        icon.innerHTML = `<img src="${IconDrawer.getSimpleIcon(type)}" alt="${type}">`;

        txt.textContent = msg;

        // Auto hide after 1.5s
        if ((this as any).notifTimeout) clearTimeout((this as any).notifTimeout);
        (this as any).notifTimeout = setTimeout(() => {
            popup.classList.remove('show');
        }, 1500);

        // Also play sound if possible
        if (type === 'success') this.audioManager.play('unlock');
        else this.audioManager.play('hit'); // Error sound
    }

    private replaceIcons(): void {
        // HUD Buttons
        const setIcon = (id: string, type: any) => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = `<img src="${IconDrawer.getSimpleIcon(type)}" style="width: 70%; height: 70%; object-fit: contain; pointer-events: none;">`;
        };
        setIcon('fullscreen-btn', 'fullscreen');
        setIcon('backpack-btn', 'backpack');
        setIcon('shop-btn', 'shop');
        setIcon('settings-btn', 'settings');
        setIcon('leaderboard-btn', 'leaderboard');

        // Map Selector
        document.querySelectorAll('.map-option').forEach(opt => {
            const mapIndex = opt.getAttribute('data-map');
            if (mapIndex) {
                opt.innerHTML = `<img src="${IconDrawer.getSimpleIcon(`map_${mapIndex}` as any)}" style="width: 70%; height: 70%; object-fit: contain; pointer-events: none;">`;
            }
        });
    }

    private showError(msg: string): void {
        this.showCentralNotification(msg, 'error');
    }

    private renderSkinGrid(buyableSkins: any[]): void {
        const gridEl = document.getElementById('shop-grid');
        if (!gridEl) return;
        gridEl.innerHTML = '';

        const start = (this.currentShopPage - 1) * this.itemsPerPage;
        const pageItems = buyableSkins.slice(start, start + this.itemsPerPage);

        pageItems.forEach(skin => {
            const card = document.createElement('div');
            card.className = `skin-card`;

            card.addEventListener('mouseenter', (e) => this.showTooltip(skin.description, e.clientX, e.clientY));
            card.addEventListener('mouseleave', () => this.hideTooltip());

            card.innerHTML = `
                <div class="card-preview-box">
                    <div id="card-preview-${skin.id}"></div>
                </div>
                <div class="card-name">${skin.name}</div>
                <button class="shop-card-btn buy" style="width: 100%">$${skin.price}</button>
            `;

            card.querySelector('.shop-card-btn')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.playClick();
                this.handleSkinAction(skin.id);
            });

            gridEl.appendChild(card);
            const previewBox = card.querySelector(`#card-preview-${skin.id}`);
            if (previewBox) previewBox.appendChild(this.skinManager.drawPreview(skin.id));
        });
    }

    private renderInvSkinGrid(ownedSkins: any[]): void {
        const gridEl = document.getElementById('inventory-grid');
        if (!gridEl) return;
        gridEl.innerHTML = '';

        const equipped = this.saveManager.getEquippedSkin();
        const start = (this.currentInvPage - 1) * this.itemsPerPage;
        const pageItems = ownedSkins.slice(start, start + this.itemsPerPage);

        pageItems.forEach(skin => {
            const card = document.createElement('div');
            const isEquipped = equipped === skin.id;
            card.className = `skin-card ${isEquipped ? 'equipped' : ''}`;

            card.innerHTML = `
                <div class="card-preview-box">
                    <div id="inv-preview-${skin.id}"></div>
                </div>
                <div class="card-name">${skin.name}</div>
                <button class="shop-card-btn ${isEquipped ? 'equipped' : 'equip'}" style="width: 100%">
                    ${isEquipped ? 'EQUIPPED' : 'EQUIP'}
                </button>
            `;

            card.querySelector('.shop-card-btn')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.playClick();
                this.saveManager.equipSkin(skin.id);
                this.renderInventoryGrid();
                this.showCentralNotification(`${skin.name.toUpperCase()} EQUIPPED`, 'success');
            });

            gridEl.appendChild(card);
            const previewBox = card.querySelector(`#inv-preview-${skin.id}`);
            if (previewBox) previewBox.appendChild(this.skinManager.drawPreview(skin.id));
        });
    }

    private renderPagination(totalItems: number, container: HTMLElement, type: 'shop' | 'inv' = 'shop'): void {
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        container.innerHTML = '';
        if (totalPages <= 1) return;

        const currentPage = type === 'shop' ? this.currentShopPage : this.currentInvPage;

        const createBtn = (label: string | number, page: number, isActive = false, isDisabled = false) => {
            const btn = document.createElement('button');
            btn.className = `page-btn ${isActive ? 'active' : ''}`;
            btn.innerHTML = label.toString();
            btn.disabled = isDisabled;
            if (!isDisabled && !isActive) {
                btn.addEventListener('click', () => {
                    this.playClick();
                    if (type === 'shop') {
                        this.currentShopPage = page;
                        this.renderShopGrid();
                    } else {
                        this.currentInvPage = page;
                        this.renderInventoryGrid();
                    }
                });
            }
            return btn;
        };

        container.appendChild(createBtn('<', currentPage - 1, false, currentPage === 1));
        for (let i = 1; i <= totalPages; i++) {
            container.appendChild(createBtn(i, i, i === currentPage));
        }
        container.appendChild(createBtn('>', currentPage + 1, false, currentPage === totalPages));
    }

    private handleSkinAction(id: string): void {
        const skin = this.skinManager.getSkinById(id);
        if (!skin) return;

        const owned = this.saveManager.getOwnedSkins();
        if (owned.includes(id)) return;

        this.showConfirm(`PURCHASE: ${skin.name}`, `Spend ${skin.price} credits to unlock this skin?`, () => {
            if (this.saveManager.spendCoins(skin.price)) {
                this.saveManager.unlockSkin(id);
                this.renderShopGrid();
                this.updateAllUI();
                this.showCentralNotification(`${skin.name.toUpperCase()} UNLOCKED!`, 'success');
            } else {
                this.showCentralNotification('INSUFFICIENT CREDITS', 'error');
            }
        });
    }

    private showConfirm(title: string, msg: string, callback: (qty?: number) => void, showQty: boolean = false): void {
        const modal = document.getElementById('confirm-modal');
        const titleEl = document.getElementById('confirm-title');
        const msgEl = document.getElementById('confirm-msg');
        const okBtn = document.getElementById('confirm-ok');
        const cancelBtn = document.getElementById('confirm-cancel');
        const qtyContainer = document.getElementById('confirm-qty-container');
        const qtyInput = document.getElementById('confirm-qty-input') as HTMLInputElement;

        if (!modal || !titleEl || !msgEl || !okBtn || !cancelBtn) return;

        titleEl.textContent = title;
        msgEl.textContent = msg;

        if (qtyContainer) qtyContainer.style.display = showQty ? 'block' : 'none';
        if (qtyInput) qtyInput.value = '1';

        modal.classList.add('modal-active');

        const cleanup = () => {
            modal.classList.remove('modal-active');
            okBtn.replaceWith(okBtn.cloneNode(true));
            cancelBtn.replaceWith(cancelBtn.cloneNode(true));
        };

        const onOk = () => {
            this.playClick();
            const qty = qtyInput ? parseInt(qtyInput.value) : 1;
            callback(qty);
            cleanup();
        };

        const onCancel = () => {
            this.playClick();
            cleanup();
        };

        document.getElementById('confirm-ok')?.addEventListener('click', onOk);
        document.getElementById('confirm-cancel')?.addEventListener('click', onCancel);
    }

    private updateShopBalance(): void {
        const bal = document.getElementById('shop-balance');
        if (bal) bal.textContent = this.saveManager.getCoins().toString();
    }

    private resetSettings(): void {
        this.game.updateConfig(DEFAULT_CONFIG);
        const config = this.game.getConfig();
        const set = (id: string, valId: string, v: number) => {
            const r = document.getElementById(id) as HTMLInputElement;
            if (r) r.value = v.toString();
            const t = document.getElementById(valId);
            if (t) t.textContent = v.toString();
        };
        set('speedRange', 'val-speed', config.speed);
        set('gravityRange', 'val-gravity', config.gravity);
        set('liftRange', 'val-lift', config.jump);
        set('gapRange', 'val-gap', config.pipeGap);
        set('spacingRange', 'val-spacing', config.pipeSpacing);
    }

    showGameOver(score: number, coins: number, isClassic: boolean = false, bestDist: number = 0, canAdRevive: boolean = false, canQuickRevive: boolean = false): void {
        this.audioManager.play('gameover');
        const msg = document.getElementById('message');
        const s = document.getElementById('finalScore');
        const b = document.getElementById('finalBest');
        const c = document.getElementById('finalCoins');
        const distRow = document.getElementById('distance-row');
        const d = document.getElementById('finalDist');

        if (s) s.textContent = score.toString();
        if (b) b.textContent = this.saveManager.getHighScore(isClassic).toString();
        if (c) c.textContent = coins.toString();

        if (distRow) {
            if (isClassic) {
                distRow.style.display = 'none';
            } else {
                distRow.style.display = 'flex';
                if (d) d.textContent = `${Math.floor(bestDist)} m`;
            }
        }

        const reviveBtn = document.getElementById('reviveBtn');
        const reviveAdBtn = document.getElementById('reviveAdBtn');
        if (reviveBtn && reviveAdBtn) {
            reviveBtn.style.display = canQuickRevive ? 'flex' : 'none';
            reviveAdBtn.style.display = canAdRevive ? 'flex' : 'none';
            if (canQuickRevive || canAdRevive) this.startReviveTimer();
        }

        if (msg) msg.style.display = 'flex';
        this.updateAllUI();
    }

    private startReviveTimer(): void {
        this.stopReviveTimer();
        const reviveBtn = document.getElementById('reviveBtn');
        if (!reviveBtn) return;
        reviveBtn.classList.remove('revive-expired', 'timer-active');
        void (reviveBtn as HTMLElement).offsetHeight;
        setTimeout(() => reviveBtn.classList.add('timer-active'), 20);
        this.reviveTimer = setTimeout(() => {
            if (reviveBtn.classList.contains('timer-active')) {
                reviveBtn.classList.add('revive-expired');
                reviveBtn.classList.remove('timer-active');
            }
        }, 5020);
    }

    private stopReviveTimer(): void {
        if (this.reviveTimer) {
            clearTimeout(this.reviveTimer);
            this.reviveTimer = null;
        }
        const reviveBtn = document.getElementById('reviveBtn');
        if (reviveBtn) reviveBtn.classList.remove('timer-active', 'revive-expired');
    }

    private setupMapSelector(): void {
        const options = document.querySelectorAll('.map-option') as NodeListOf<HTMLElement>;
        const themeName = document.getElementById('selected-theme-name');

        options.forEach((opt, index) => {
            const name = opt.getAttribute('data-name') || '';
            const description = this.getMapDescription(index);

            opt.addEventListener('mouseenter', (e: MouseEvent) => this.showTooltip(description, e.clientX, e.clientY));
            opt.addEventListener('mouseleave', () => this.hideTooltip());

            const handler = (e: Event) => {
                e.preventDefault();
                this.playClick();
                options.forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                if (themeName) themeName.textContent = name;
                const mapIdIndex = parseInt(opt.getAttribute('data-map') || '5');
                this.game.setStartMap(mapIdIndex);
                this.updateStartScreenTheme(mapIdIndex);
                this.setupTutorialIcons();
            };

            opt.addEventListener('click', handler);
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

            modeBtn.addEventListener('mouseenter', (e) => this.showTooltip(description, e.clientX, e.clientY));
            modeBtn.addEventListener('mouseleave', () => this.hideTooltip());

            const handler = (e: Event) => {
                e.stopPropagation();
                this.playClick();
                modes.forEach(m => m.classList.remove('active'));
                modeBtn.classList.add('active');
                this.game.setGameMode(mode as 'classic' | 'advance');
                this.setupTutorialIcons();
                this.updateControlUI();
            };
            modeBtn.addEventListener('click', handler);
        });
    }

    private updateStartScreenTheme(index: number): void {
        const screen = document.getElementById('start-screen');
        if (screen) {
            const mapId = this.game.getMapIdByIndex(index);
            screen.setAttribute('data-theme', mapId);
        }
    }

    private getMapDescription(index: number): string {
        const descriptions = [
            "NEON CITY: The heart of the cyber world.",
            "TECHO JUNGLE: Dense bio-synthetic growth.",
            "OCEAN ABYSS: High-pressure data streams.",
            "VOLCANO CORE: Thermal energy overflow.",
            "STAR FORGE: Zero-gravity manufacturing."
        ];
        return descriptions[index] || "Unknown Sectors";
    }

    private hideStartScreen(): void {
        const screen = document.getElementById('start-screen');
        if (screen) screen.style.display = 'none';
        this.game.resume();
    }

    showStartScreen(): void {
        this.game.pause();
        const screen = document.getElementById('start-screen');
        if (screen) {
            screen.style.display = 'flex';
            this.setupTutorialIcons();
        }
    }

    private setupTutorialIcons(): void {
        const jumpIcon = document.getElementById('tut-jump-icon');
        const dashIcon = document.getElementById('tut-dash-icon');
        const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const classicBtn = document.querySelector('.mode-option[data-mode="classic"]');
        const isClassic = classicBtn?.classList.contains('active');

        if (jumpIcon) {
            jumpIcon.textContent = isTouch ? '👆' : 'SPACE';
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
                dashIcon.textContent = isTouch ? 'Touch R' : 'SHIFT';
                dashIcon.className = `tut-icon ${isTouch ? 'touch-icon' : 'key-icon'}`;
                if (isTouch) dashIcon.style.fontSize = '0.6rem';
            }
        }
    }

    private hideSplashScreen(): void {
        const screen = document.getElementById('splash-screen');
        if (screen) screen.classList.remove('splash-active');
    }

    private showSplashScreen(): void {
        const screen = document.getElementById('splash-screen');
        if (screen) screen.classList.add('splash-active');
    }

    showBonus(): void {
        const popup = document.getElementById('bonus-notification');
        if (popup) {
            popup.classList.add('active');
            setTimeout(() => popup.classList.remove('active'), 2500);
        }
    }

    private toggleFullscreen(): void {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => { });
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
        }
    }

    private hideGameOver(): void {
        const msg = document.getElementById('message');
        if (msg) msg.style.display = 'none';
    }

    updateAllUI(): void {
        const c = document.getElementById('total-coins');
        const s = document.getElementById('score');
        if (c) c.textContent = this.saveManager.getCoins().toString();
        if (s) s.textContent = this.game.getScore().toString();
        this.updateEnergyBar();
        this.updateShopBalance();
        this.updateControlUI();
    }

    private animateMapName(): void {
        const themeNameEl = document.getElementById('selected-theme-name');
        const hudLabel = document.getElementById('hud-map-name');

        if (themeNameEl && hudLabel) {
            hudLabel.textContent = themeNameEl.textContent;

            // 1. Initial State (No-transition snap)
            hudLabel.style.transition = 'none';
            hudLabel.style.opacity = '1';
            hudLabel.style.transform = 'translateX(-50%)';

            const firstRect = themeNameEl.getBoundingClientRect();
            const lastRect = hudLabel.getBoundingClientRect();
            const themeStyle = window.getComputedStyle(themeNameEl);
            const hudStyle = window.getComputedStyle(hudLabel);

            const firstFontSize = parseFloat(themeStyle.fontSize);
            const lastFontSize = parseFloat(hudStyle.fontSize);
            const scale = firstFontSize / lastFontSize;

            const deltaX = (firstRect.left + firstRect.width / 2) - (lastRect.left + lastRect.width / 2);
            const deltaY = (firstRect.top + firstRect.height / 2) - (lastRect.top + lastRect.height / 2);

            // Apply visual match to source (Snap)
            hudLabel.style.transform = `translate(calc(-50% + ${deltaX}px), ${deltaY}px) scale(${scale})`;
            hudLabel.style.color = themeStyle.color;
            // Do not copy letter-spacing/shadow as scale handles it naturally

            themeNameEl.style.transition = 'opacity 0.2s';
            themeNameEl.style.opacity = '0';

            void hudLabel.offsetWidth; // Force Reflow

            // 2. Play Animation (Only Transform for GPU smoothness)
            setTimeout(() => {
                hudLabel.style.transition = 'transform 2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s';
                hudLabel.style.transform = 'translateX(-50%) scale(1)';

                // Visual Polish
                setTimeout(() => {
                    hudLabel.style.color = 'rgba(255, 255, 255, 0.9)';
                    hudLabel.style.textShadow = '0 2px 4px rgba(0, 0, 0, 0.8)';
                    hudLabel.style.letterSpacing = '0.8px';
                }, 200);
            }, 600);

            setTimeout(() => {
                hudLabel.classList.add('active');
                hudLabel.style.transition = '';
                hudLabel.style.transform = '';
                hudLabel.style.color = '';
                hudLabel.style.textShadow = '';
                hudLabel.style.letterSpacing = '';
            }, 2700);
        }
    }
}
