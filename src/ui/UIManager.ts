import type { Game } from '../core/Game';
import { SaveManager } from '../managers/SaveManager';
import { SkinManager } from '../managers/SkinManager';
import { AudioManager } from '../managers/AudioManager';
import { DEFAULT_CONFIG } from '../config/constants';
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
        const bindAction = (id: string, callback: () => void) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('click', (e) => { e.stopPropagation(); callback(); });
            el.addEventListener('touchstart', (e) => { e.stopPropagation(); callback(); }, { passive: false });
        };

        bindAction('settings-btn', () => { this.playClick(); this.showSettings(); });
        bindAction('shop-btn', () => { this.playClick(); this.showShop(); });

        document.querySelectorAll('.shop-tab').forEach((tab) => {
            const handler = (e: Event) => {
                e.preventDefault();
                e.stopPropagation();
                this.playClick();
                document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
                (e.target as HTMLElement).classList.add('active');
                this.currentShopTab = (e.target as HTMLElement).getAttribute('data-tab') as any;
                this.currentShopPage = 1; // Reset to page 1 on tab switch
                this.renderShopGrid();
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

        const closeOnClickOutside = (e: Event) => {
            const target = e.target as HTMLElement;
            const activeModal = document.querySelector('.modal-panel.modal-active');
            if (activeModal && !target.closest('.modal-panel') && !target.closest('.btn-icon')) {
                this.closeActiveModals();
            }
        };
        window.addEventListener('mousedown', closeOnClickOutside);
        window.addEventListener('touchstart', closeOnClickOutside, { passive: true });

        this.setupSettingsControls();
        this.setupAudioControls();
        this.setupConfirmControls();

        // Retry Button
        bindAction('restartBtn', () => {
            this.playClick();
            this.stopReviveTimer();
            this.hideGameOver();
            this.showStartScreen();
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

    private updateEnergyBar(): void {
        const fill = document.getElementById('energy-fill');
        const label = document.getElementById('energy-label');
        const energyPct = this.game.getEnergy();
        if (fill) fill.style.width = `${energyPct}%`;

        if (label) {
            label.textContent = `NITRO (${energyPct.toFixed(1)}%)`;
        }
    }

    private renderShopGrid(): void {
        const gridEl = document.getElementById('shop-grid');
        const paginationEl = document.getElementById('shop-pagination');
        if (!gridEl || !paginationEl) return;

        // Clear message when re-rendering
        const msgEl = document.getElementById('shop-msg');
        if (msgEl) msgEl.textContent = '';

        if (this.currentShopTab === 'skins') {
            const skins = this.skinManager.getAllSkins();
            this.renderSkinGrid(skins);
            this.renderPagination(skins.length, paginationEl);
        } else {
            this.renderBoostGrid(BOOSTS);
            this.renderPagination(BOOSTS.length, paginationEl);
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
            const count = this.saveManager.getBoostCount(boost.id);
            const isEquipped = equippedId === boost.id;
            const isDefault = boost.id === 'nitro_default';

            const card = document.createElement('div');
            card.className = `skin-card ${isEquipped ? 'equipped' : ''}`;

            const quantityBadge = count > 0 ? `<div class="item-quantity">${count}</div>` : '';

            card.innerHTML = `
                ${quantityBadge}
                <div class="card-preview-box">
                    <img src="${IconDrawer.getNitroIcon(boost.id)}" alt="icon" style="width: 45px; height: 45px;">
                </div>
                <div class="card-name">${boost.name}</div>
                <div style="font-size: 0.55rem; color: #888; text-align: center; margin-bottom: 0.5rem;">${boost.capacity}m Capacity</div>
                
                <div class="boost-card-actions">
                    <button class="shop-card-btn activate ${isEquipped ? 'equipped' : (count > 0 || isDefault ? 'can-activate' : 'locked')}" data-action="activate">
                        ${isEquipped ? 'ACTIVE' : (isDefault ? 'EQUIP' : 'START')}
                    </button>
                    ${!isDefault ? `<button class="shop-card-btn buy" data-action="buy">$${boost.price}</button>` : ''}
                </div>
            `;

            card.addEventListener('mouseenter', (e) => this.showTooltip(boost.description, e.clientX, e.clientY));
            card.addEventListener('mouseleave', () => this.hideTooltip());

            card.querySelector('.buy')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.playClick();
                this.handleBoostBuy(boost);
            });

            card.querySelector('.activate')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.playClick();
                this.handleBoostActivate(boost);
            });

            gridEl.appendChild(card);
        });
    }

    private handleBoostBuy(boost: BoostDefinition): void {
        this.showConfirm(`PURCHASE: ${boost.name}`, `Select quantity to buy for ${boost.name}:`, (qty) => {
            const quantity = qty || 1;
            const total = boost.price * quantity;

            if (this.saveManager.spendCoins(total)) {
                this.saveManager.addBoostToInventory(boost.id, quantity);
                this.renderShopGrid();
                this.updateAllUI();
            } else {
                this.showError('INSUFFICIENT CREDITS');
            }
        }, true);
    }

    private handleBoostActivate(boost: BoostDefinition): void {
        const equippedId = this.saveManager.getEquippedBoostId();
        const isDefault = boost.id === 'nitro_default';
        const count = this.saveManager.getBoostCount(boost.id);

        if (equippedId === boost.id) return;

        if (isDefault || count > 0) {
            this.saveManager.setEquippedBoost(boost.id, boost.capacity);
            this.renderShopGrid();
            this.game.restart(); // Applies to bird
        } else {
            this.showError('NO STOCK - BUY FIRST');
        }
    }

    private showError(msg: string): void {
        const el = document.getElementById('shop-msg');
        if (el) {
            el.textContent = msg;
            setTimeout(() => el.textContent = '', 2000);
        }
    }

    private renderSkinGrid(allSkins: any[]): void {
        const gridEl = document.getElementById('shop-grid');
        if (!gridEl) return;
        gridEl.innerHTML = '';

        const owned = this.saveManager.getOwnedSkins();
        const equipped = this.saveManager.getEquippedSkin();

        // Paginate items
        const start = (this.currentShopPage - 1) * this.itemsPerPage;
        const pageItems = allSkins.slice(start, start + this.itemsPerPage);

        pageItems.forEach(skin => {
            const card = document.createElement('div');
            const isOwned = owned.includes(skin.id);
            const isEquipped = equipped === skin.id;

            card.className = `skin-card ${isEquipped ? 'equipped' : ''}`;

            card.addEventListener('mouseenter', (e) => this.showTooltip(skin.description, e.clientX, e.clientY));
            card.addEventListener('mousemove', (e) => this.showTooltip(skin.description, e.clientX, e.clientY));
            card.addEventListener('mouseleave', () => this.hideTooltip());

            let btnText = `$${skin.price}`;
            let btnClass = 'buy';
            if (isEquipped) {
                btnText = 'Equipped';
                btnClass = 'equipped';
            } else if (isOwned) {
                btnText = 'Equip';
                btnClass = 'equip';
            }

            card.innerHTML = `
                <div class="card-preview-box">
                    <div id="card-preview-${skin.id}"></div>
                </div>
                <div class="card-name">${skin.name}</div>
                <button class="shop-card-btn ${btnClass}">${btnText}</button>
            `;

            card.querySelector('.shop-card-btn')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.playClick();
                this.handleSkinAction(skin.id);
            });

            gridEl.appendChild(card);
            const previewIcon = card.querySelector(`#card-preview-${skin.id}`);
            if (previewIcon) previewIcon.appendChild(this.skinManager.drawPreview(skin.id));
        });
    }

    private renderPagination(totalItems: number, container: HTMLElement): void {
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        container.innerHTML = '';

        if (totalPages <= 1) return;

        const createBtn = (label: string | number, page: number, isActive = false, isDisabled = false) => {
            const btn = document.createElement('button');
            btn.className = `page-btn ${isActive ? 'active' : ''}`;
            btn.innerHTML = label.toString();
            btn.disabled = isDisabled;
            if (!isDisabled && !isActive) {
                btn.addEventListener('click', () => {
                    this.playClick();
                    this.currentShopPage = page;
                    this.renderShopGrid();
                });
            }
            return btn;
        };

        // Prev Button
        container.appendChild(createBtn('<', this.currentShopPage - 1, false, this.currentShopPage === 1));

        // Logic for "Smart" Page Numbering (1 ... 4 5 6 ... 10)
        const delta = 2; // Number of pages around current
        const range = [];
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentShopPage - delta && i <= this.currentShopPage + delta)) {
                range.push(i);
            }
        }

        let last = 0;
        for (const i of range) {
            if (last) {
                if (i - last === 2) {
                    container.appendChild(createBtn(last + 1, last + 1));
                } else if (i - last !== 1) {
                    const dots = document.createElement('span');
                    dots.className = 'page-dots';
                    dots.textContent = '...';
                    container.appendChild(dots);
                }
            }
            container.appendChild(createBtn(i, i, i === this.currentShopPage));
            last = i;
        }

        // Next Button
        container.appendChild(createBtn('>', this.currentShopPage + 1, false, this.currentShopPage === totalPages));
    }

    private handleSkinAction(id: string): void {
        const skin = this.skinManager.getSkinById(id);
        if (!skin) return;

        const owned = this.saveManager.getOwnedSkins();
        const equipped = this.saveManager.getEquippedSkin();
        if (equipped === id) return;

        if (owned.includes(id)) {
            this.saveManager.equipSkin(id);
            this.renderShopGrid();
            this.updateAllUI();
        } else {
            this.showConfirm(`PURCHASE: ${skin.name}`, `Spend ${skin.price} credits to unlock this skin?`, () => {
                if (this.saveManager.spendCoins(skin.price)) {
                    this.saveManager.unlockSkin(id);
                    this.saveManager.equipSkin(id);
                    this.renderShopGrid();
                    this.updateAllUI();
                    this.updateSkinsOwnedCount();
                } else {
                    const msg = document.getElementById('shop-msg');
                    if (msg) { msg.textContent = 'INSUFFICIENT CREDITS'; setTimeout(() => msg.textContent = '', 2000); }
                }
            });
        }
    }

    private showConfirm(title: string, msg: string, callback: (qty?: number) => void, showQty: boolean = false): void {
        const modal = document.getElementById('confirm-modal');
        const titleEl = document.getElementById('confirm-title');
        const msgEl = document.getElementById('confirm-msg');
        const qtyContainer = document.getElementById('confirm-qty-container');
        const qtyInput = document.getElementById('confirm-qty-input') as HTMLInputElement;

        if (titleEl) titleEl.textContent = title;
        if (msgEl) msgEl.textContent = msg;

        if (qtyContainer) qtyContainer.style.display = showQty ? 'block' : 'none';
        if (qtyInput) qtyInput.value = '1';

        this.confirmCallback = callback as any;
        modal?.classList.add('modal-active');
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

    private showGameOver(score: number, coins: number, isClassic: boolean = false, bestDist: number = 0, canAdRevive: boolean = false, canQuickRevive: boolean = false): void {
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
                if (d) d.textContent = `${bestDist} m`;
            }
        }

        // Handle Revive UI
        const reviveBtn = document.getElementById('reviveBtn');
        const reviveAdBtn = document.getElementById('reviveAdBtn');
        if (reviveBtn && reviveAdBtn) {
            reviveBtn.style.display = canQuickRevive ? 'flex' : 'none';
            reviveAdBtn.style.display = canAdRevive ? 'flex' : 'none';

            if (canQuickRevive || canAdRevive) {
                this.startReviveTimer();
            }
        }

        if (msg) msg.style.display = 'flex';
        this.updateAllUI();
    }

    private startReviveTimer(): void {
        this.stopReviveTimer();
        const reviveBtn = document.getElementById('reviveBtn');
        const reviveAdBtn = document.getElementById('reviveAdBtn');
        if (!reviveBtn || !reviveAdBtn) return;

        // Reset state
        reviveBtn.classList.remove('revive-expired', 'timer-active');
        reviveAdBtn.classList.remove('revive-expired');

        // Force reflow
        void (reviveBtn as HTMLElement).offsetHeight;

        // Use a small delay to ensure the browser registers the class removal before adding it back
        setTimeout(() => {
            reviveBtn.classList.add('timer-active');
        }, 20);

        this.reviveTimer = setTimeout(() => {
            if (reviveBtn && reviveBtn.classList.contains('timer-active')) {
                reviveBtn.classList.add('revive-expired');
                reviveBtn.classList.remove('timer-active');
                reviveAdBtn.classList.add('revive-expired');
            }
        }, 5020);
    }

    private stopReviveTimer(): void {
        if (this.reviveTimer) {
            clearTimeout(this.reviveTimer);
            this.reviveTimer = null;
        }
        const reviveBtn = document.getElementById('reviveBtn');
        const reviveAdBtn = document.getElementById('reviveAdBtn');
        if (reviveBtn) {
            reviveBtn.classList.remove('timer-active', 'revive-expired');
        }
        if (reviveAdBtn) {
            reviveAdBtn.classList.remove('revive-expired');
        }
    }

    private setupMapSelector(): void {
        const options = document.querySelectorAll('.map-option') as NodeListOf<HTMLElement>;
        const themeName = document.getElementById('selected-theme-name');

        options.forEach((opt, index) => {
            const name = opt.getAttribute('data-name') || '';
            const description = this.getMapDescription(index);

            opt.addEventListener('mouseenter', (e: MouseEvent) => this.showTooltip(description, e.clientX, e.clientY));
            opt.addEventListener('mousemove', (e: MouseEvent) => this.showTooltip(description, e.clientX, e.clientY));
            opt.addEventListener('mouseleave', () => this.hideTooltip());

            const handler = (e: Event) => {
                e.preventDefault();
                e.stopPropagation();
                const mapIdIndex = parseInt(opt.getAttribute('data-map') || '0');
                this.playClick();
                options.forEach(o => o.classList.remove('active'));
                opt.classList.add('active');

                if (themeName) {
                    themeName.textContent = name;
                    themeName.style.transform = 'scale(1.1)';
                    setTimeout(() => themeName.style.transform = 'scale(1)', 200);
                }

                this.game.setStartMap(mapIdIndex);
                this.updateStartScreenTheme(mapIdIndex);
            };

            opt.addEventListener('click', handler);
            opt.addEventListener('touchstart', handler, { passive: false });

            if (opt.classList.contains('active')) {
                const initialMapIndex = parseInt(opt.getAttribute('data-map') || '5');
                this.game.setStartMap(initialMapIndex);
                this.updateStartScreenTheme(initialMapIndex);
            }
        });

        this.setupModeSelector();
    }

    private setupModeSelector(): void {
        const modeContainer = document.querySelector('.mode-selector-container');
        if (modeContainer) {
            modeContainer.addEventListener('mousedown', (e) => e.stopPropagation());
        }

        const modes = document.querySelectorAll('.mode-option') as NodeListOf<HTMLElement>;

        modes.forEach(modeBtn => {
            const mode = modeBtn.getAttribute('data-mode') || 'advance';
            const description = mode === 'classic'
                ? "CLASSIC MODE: Pure skill. No nitro, no shops, just you and the pipes. Standard physics."
                : "ADVANCE MODE: Full experience. Use nitro, unlock skins, and travel through different sectors.";

            modeBtn.addEventListener('mouseenter', (e) => this.showTooltip(description, e.clientX, e.clientY));
            modeBtn.addEventListener('mousemove', (e) => this.showTooltip(description, e.clientX, e.clientY));
            modeBtn.addEventListener('mouseleave', () => this.hideTooltip());

            const handler = (e: Event) => {
                e.stopPropagation();
                e.preventDefault();
                this.playClick();
                modes.forEach(m => m.classList.remove('active'));
                modeBtn.classList.add('active');

                this.game.setGameMode(mode as 'classic' | 'advance');
                this.setupTutorialIcons(); // Refresh tutorial icons for new mode
                this.updateControlUI(); // Ensure Dash button in HUD is toggled
            };
            modeBtn.addEventListener('click', handler);
            modeBtn.addEventListener('touchstart', handler, { passive: false });
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
            "NEON CITY: The heart of the cyber world. Balanced and bright.",
            "TECHO JUNGLE: Dense bio-synthetic growth. Mind the vines.",
            "OCEAN ABYSS: High-pressure data streams. Deep dive.",
            "VOLCANO CORE: Thermal energy overflow. Scorching heat.",
            "STAR FORGE: Zero-gravity manufacturing. Cosmic power."
        ];
        return descriptions[index] || "Unknown Sectors";
    }

    private hideStartScreen(): void {
        const screen = document.getElementById('start-screen');
        if (screen) screen.style.display = 'none';
    }

    private showStartScreen(): void {
        const screen = document.getElementById('start-screen');
        if (screen) {
            screen.style.display = 'flex';
            this.startScreenCooldown = Date.now(); // Set cooldown
            this.setupTutorialIcons();
        }
    }

    private setupTutorialIcons(): void {
        const jumpIcon = document.getElementById('tut-jump-icon');
        const dashIcon = document.getElementById('tut-dash-icon');
        const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        // Find which mode is active from the buttons
        const classicBtn = document.querySelector('.mode-option[data-mode="classic"]');
        const isClassic = classicBtn?.classList.contains('active');

        if (jumpIcon) {
            if (isTouch) {
                jumpIcon.textContent = '👆';
                jumpIcon.className = 'tut-icon touch-icon';
            } else {
                jumpIcon.textContent = 'SPACE';
                jumpIcon.className = 'tut-icon key-icon';
            }
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
                    dashIcon.textContent = 'Touch R';
                    dashIcon.className = 'tut-icon touch-icon';
                    dashIcon.style.fontSize = '0.6rem';
                } else {
                    dashIcon.textContent = 'SHIFT';
                    dashIcon.className = 'tut-icon key-icon';
                }
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
            setTimeout(() => {
                popup.classList.remove('active');
            }, 2500);
        }
    }

    private toggleFullscreen(): void {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
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
        this.updateShopBalance();
        this.updateControlUI();
    }
}
