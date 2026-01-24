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
    }

    private playClick(): void {
        this.audioManager.play('click');
    }

    private setupEventListeners(): void {
        document.getElementById('settings-btn')?.addEventListener('click', () => { this.playClick(); this.showSettings(); });
        document.getElementById('shop-btn')?.addEventListener('click', () => { this.playClick(); this.showShop(); });

        document.querySelectorAll('.shop-tab').forEach((tab) => {
            tab.addEventListener('click', (e) => {
                this.playClick();
                const target = e.target as HTMLElement;
                document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
                target.classList.add('active');
                this.currentShopTab = target.getAttribute('data-tab') as any;
                this.renderShopGrid();
            });
        });

        document.querySelectorAll('.close-modal').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                this.playClick();
                const modal = (e.target as HTMLElement).closest('.modal-panel');
                modal?.classList.remove('modal-active');
                if (!document.querySelector('.modal-active')) this.game.resume();
            });
        });

        this.setupSettingsControls();
        this.setupAudioControls();
        this.setupConfirmControls();

        // Retry Button
        document.getElementById('restartBtn')?.addEventListener('click', () => {
            this.playClick();
            this.hideGameOver();
            this.showStartScreen();
            this.game.restart();
        });

        document.getElementById('start-screen')?.addEventListener('mousedown', (e) => {
            if ((e.target as HTMLElement).closest('.map-option, .modal-panel')) return;

            this.hideStartScreen();

            if (this.game.getState() === 'START') {
                this.game.resume(true);
            }
        });

        window.addEventListener('gameOver', ((e: CustomEvent) => {
            this.showGameOver(e.detail.score, e.detail.coins, e.detail.isClassic);
        }) as EventListener);

        window.addEventListener('updateUI', () => this.updateAllUI());

        window.addEventListener('openSettings', () => {
            const panel = document.getElementById('settings-panel');
            if (panel?.classList.contains('modal-active')) {
                this.playClick();
                panel.classList.remove('modal-active');
                this.game.resume();
            } else {
                this.playClick();
                this.showSettings();
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
            document.getElementById('settings-panel')?.classList.remove('modal-active');
            this.game.resume();
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

    private showSettings(): void {
        this.game.pause();
        document.getElementById('settings-panel')?.classList.add('modal-active');
    }

    private showShop(): void {
        this.game.pause();
        this.renderShopGrid();
        this.updateShopBalance();
        document.getElementById('shop-panel')?.classList.add('modal-active');
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
            const boostId = this.saveManager.getEquippedBoostId();
            const boostDef = BOOSTS.find(b => b.id === boostId);
            if (boostDef) {
                label.textContent = `${boostDef.name.toUpperCase()} (${energyPct.toFixed(1)}%)`;
            }
        }
    }

    private renderShopGrid(): void {
        if (this.currentShopTab === 'skins') {
            this.renderSkinGrid();
        } else {
            this.renderBoostGrid();
        }
    }

    private renderBoostGrid(): void {
        const gridEl = document.getElementById('shop-grid');
        if (!gridEl) return;
        gridEl.innerHTML = '';

        const equippedId = this.saveManager.getEquippedBoostId();

        BOOSTS.forEach(boost => {
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
                this.renderBoostGrid();
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
            this.renderBoostGrid();
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

    private renderSkinGrid(): void {
        const gridEl = document.getElementById('shop-grid');
        if (!gridEl) return;
        gridEl.innerHTML = '';

        const skins = this.skinManager.getAllSkins();
        const owned = this.saveManager.getOwnedSkins();
        const equipped = this.saveManager.getEquippedSkin();

        skins.forEach(skin => {
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

    private handleSkinAction(id: string): void {
        const skin = this.skinManager.getSkinById(id);
        if (!skin) return;

        const owned = this.saveManager.getOwnedSkins();
        const equipped = this.saveManager.getEquippedSkin();
        if (equipped === id) return;

        if (owned.includes(id)) {
            this.saveManager.equipSkin(id);
            this.renderSkinGrid();
            this.updateAllUI();
        } else {
            this.showConfirm(`PURCHASE: ${skin.name}`, `Spend ${skin.price} credits to unlock this skin?`, () => {
                if (this.saveManager.spendCoins(skin.price)) {
                    this.saveManager.unlockSkin(id);
                    this.saveManager.equipSkin(id);
                    this.renderSkinGrid();
                    this.updateAllUI();
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

    private showGameOver(score: number, _coins: number, isClassic: boolean = false): void {
        const msg = document.getElementById('message');
        const s = document.getElementById('finalScore');
        const b = document.getElementById('finalBest');
        const c = document.getElementById('finalCoins');

        if (s) s.textContent = score.toString();
        if (b) b.textContent = this.saveManager.getHighScore(isClassic).toString();
        if (c) c.textContent = this.saveManager.getCoins().toString();

        if (msg) msg.style.display = 'flex';
        this.updateAllUI();
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

            opt.addEventListener('click', (e: MouseEvent) => {
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
            });

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
            modeBtn.addEventListener('mousedown', (e) => {
                e.stopPropagation();
            });

            modeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.playClick();
                modes.forEach(m => m.classList.remove('active'));
                modeBtn.classList.add('active');

                const mode = modeBtn.getAttribute('data-mode') || 'advance';
                this.game.setGameMode(mode as 'classic' | 'advance');
            });
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
        if (screen) screen.style.display = 'flex';
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
    }
}
