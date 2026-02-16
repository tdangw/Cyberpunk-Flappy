import type { IUIManager } from '../IUIManager';
import { IconDrawer } from '../IconDrawer';
import splashBg from '../../assets/menu_bg.jpg';
import { MascotManager } from '../MascotManager';

export class HUD {
    private ui: IUIManager;
    private reviveTimer: any = null;
    private energyInterval: any = null;
    private splashInterval: any = null;
    private mascot: MascotManager | null = null;

    constructor(ui: IUIManager) {
        this.ui = ui;
        this.replaceIcons();
        this.energyInterval = setInterval(() => this.updateEnergyBar(), 100);

        // Initialize mascot after DOM is ready
        setTimeout(() => {
            this.mascot = new MascotManager();
            this.startSplashLoading();
        }, 50);
    }

    updateAllUI(): void {
        const c = document.getElementById('total-coins');
        const s = document.getElementById('score');
        if (c) c.textContent = this.ui.saveManager.getCoins().toString();
        if (s) s.textContent = this.ui.game.getScore().toString();
        this.updateEnergyBar();
        this.updateShopBalance();
        this.updateControlUI();
    }

    setMascotVisible(visible: boolean): void {
        if (this.mascot) this.mascot.setVisible(visible);
    }

    private startSplashLoading(): void {
        const container = document.getElementById('loading-container');
        const bar = document.getElementById('loading-bar');
        const status = document.getElementById('splash-status');
        const playBtn = document.getElementById('play-btn');
        const splashScreen = document.getElementById('splash-screen');
        if (!bar || !status || !playBtn || !container || !splashScreen) return;

        // Set background via JS import for maximum reliability in Vite
        splashScreen.style.backgroundImage = `url(${splashBg})`;
        splashScreen.style.backgroundColor = '#0b0e14';

        let progress = 0;
        const messages = [
            "INITIALIZING NEON CORE...",
            "LOADING ASSETS...",
            "CONNECTING TO GRID...",
            "READY FOR DEPLOYMENT"
        ];

        this.splashInterval = setInterval(() => {
            // Speed varies for realistic look
            progress += Math.random() * 5 + 1;
            if (progress >= 100) {
                progress = 100;
                clearInterval(this.splashInterval);
                this.splashInterval = null;

                status.textContent = messages[messages.length - 1] + " 100%";
                bar.style.width = '100%';
                if (this.mascot) this.mascot.updatePosition(100);

                setTimeout(() => {
                    container.style.display = 'none';
                    playBtn.style.display = 'block';
                    playBtn.classList.add('fade-in');

                    // Mascot logic for completion
                    if (this.mascot) {
                        this.mascot.onLoadComplete();
                    }
                }, 500);
            } else {
                const msgIndex = Math.floor((progress / 100) * (messages.length - 1));
                status.textContent = `${messages[msgIndex]} ${Math.floor(progress)}%`;
                bar.style.width = `${progress}%`;
                if (this.mascot) this.mascot.updatePosition(progress);
            }
        }, 80);
    }

    private updateShopBalance(): void {
        const bal = document.getElementById('shop-balance');
        if (bal) bal.textContent = this.ui.saveManager.getCoins().toString();
    }

    private updateControlUI(): void {
        const config = this.ui.game.getConfig();
        const isClassic = this.ui.game.isClassic();
        const container = document.getElementById('game-container');
        const dashContainer = document.getElementById('dash-btn-container');

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

        const inventoryBtn = document.getElementById('backpack-btn');
        const shopBtn = document.getElementById('shop-btn');
        if (inventoryBtn) inventoryBtn.style.display = isClassic ? 'none' : 'flex';
        if (shopBtn) shopBtn.style.display = isClassic ? 'none' : 'flex';

        if (dashContainer) {
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

    updateEnergyBar(): void {
        const fill = document.getElementById('energy-fill');
        const label = document.getElementById('energy-label');
        const qtyEl = document.getElementById('nitro-qty');
        const energyPct = this.ui.game.getEnergy();

        if (fill) fill.style.width = `${energyPct}%`;
        if (label) label.textContent = `NITRO (${energyPct.toFixed(1)}%)`;

        if (qtyEl) {
            const qty = this.ui.game.getNitroQuantity();
            qtyEl.textContent = qty > 0 ? `x${qty}` : '';
            qtyEl.style.display = qty > 0 ? 'block' : 'none';
        }
    }

    showGameOver(score: number, coins: number, isClassic: boolean = false, bestDist: number = 0, canAdRevive: boolean = false, canQuickRevive: boolean = false): void {
        this.ui.audioManager.play('gameover');
        const msg = document.getElementById('message');
        const s = document.getElementById('finalScore');
        const b = document.getElementById('finalBest');
        const c = document.getElementById('finalCoins');
        const distRow = document.getElementById('distance-row');
        const d = document.getElementById('finalDist');

        if (s) s.textContent = score.toString();
        if (b) b.textContent = this.ui.saveManager.getHighScore(isClassic).toString();
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

    hideGameOver(): void {
        const msg = document.getElementById('message');
        if (msg) msg.style.display = 'none';
        this.stopReviveTimer();
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

    stopReviveTimer(): void {
        if (this.reviveTimer) {
            clearTimeout(this.reviveTimer);
            this.reviveTimer = null;
        }
        const reviveBtn = document.getElementById('reviveBtn');
        if (reviveBtn) reviveBtn.classList.remove('timer-active', 'revive-expired');
    }

    showSplashScreen(): void {
        const screen = document.getElementById('splash-screen');
        if (screen) screen.classList.add('splash-active');
        this.setMascotVisible(true);
    }

    hideSplashScreen(): void {
        const screen = document.getElementById('splash-screen');
        if (screen) screen.classList.remove('splash-active');
        this.setMascotVisible(false);
    }

    animateMapName(): void {
        const themeNameEl = document.getElementById('selected-theme-name');
        const hudLabel = document.getElementById('hud-map-name');

        if (themeNameEl && hudLabel) {
            hudLabel.textContent = themeNameEl.textContent;
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

            hudLabel.style.transform = `translate(calc(-50% + ${deltaX}px), ${deltaY}px) scale(${scale})`;
            hudLabel.style.color = themeStyle.color;

            themeNameEl.style.transition = 'opacity 0.2s';
            themeNameEl.style.opacity = '0';

            void hudLabel.offsetWidth;

            setTimeout(() => {
                hudLabel.style.transition = 'transform 2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s';
                hudLabel.style.transform = 'translateX(-50%) scale(1)';

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

    resetMapNameAnimation(): void {
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

    showBonus(): void {
        const popup = document.getElementById('bonus-notification');
        if (popup) {
            popup.classList.add('active');
            setTimeout(() => popup.classList.remove('active'), 2500);
        }
    }

    runCountdown(onComplete: () => void): void {
        const overlay = document.getElementById('countdown-overlay');
        const text = document.getElementById('countdown-text');
        if (!overlay || !text) {
            onComplete();
            return;
        }

        overlay.style.display = 'flex';
        let count = 3;
        text.textContent = count.toString();
        this.ui.audioManager.play('click');

        const interval = setInterval(() => {
            count--;
            if (count > 0) {
                text.textContent = count.toString();
                this.ui.audioManager.play('click');
            } else {
                clearInterval(interval);
                overlay.style.display = 'none';
                onComplete();
            }
        }, 800);
    }

    checkTampering(): void {
        if (this.ui.saveManager.isTampered()) {
            this.showSecurityAlert();
        }
    }

    showSecurityAlert(): void {
        const securityModal = document.getElementById('security-modal');
        const okBtn = document.getElementById('security-ok');

        if (securityModal && !securityModal.classList.contains('modal-active')) {
            this.ui.game.pause();
            securityModal.classList.add('modal-active');
            const signal = this.ui.getSignal();

            okBtn?.addEventListener('click', () => {
                this.ui.playClick();
                securityModal.classList.remove('modal-active');
                this.ui.game.resume();
            }, { once: true, signal });
        }
    }

    replaceIcons(): void {
        const setIcon = (id: string, type: any) => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = `<img src="${IconDrawer.getSimpleIcon(type)}" style="width: 70%; height: 70%; object-fit: contain; pointer-events: none;">`;
        };
        setIcon('fullscreen-btn', 'fullscreen');
        setIcon('backpack-btn', 'backpack');
        setIcon('shop-btn', 'shop');
        setIcon('settings-btn', 'settings');
        setIcon('leaderboard-btn', 'leaderboard');

        document.querySelectorAll('.map-option').forEach(opt => {
            const mapIndex = opt.getAttribute('data-map');
            if (mapIndex) {
                opt.innerHTML = `<img src="${IconDrawer.getSimpleIcon(`map_${mapIndex}` as any)}" style="width: 70%; height: 70%; object-fit: contain; pointer-events: none;">`;
            }
        });

        const reviveCostTag = document.getElementById('revive-cost-tag');
        if (reviveCostTag) {
            reviveCostTag.innerHTML = `3$ <img src="${IconDrawer.getCoinIcon(30)}" style="width: 1.2rem; height: 1.2rem; vertical-align: middle; margin-left: 4px; filter: drop-shadow(0 0 5px #ffd700);">`;
        }

        const coinIcon = document.querySelector('.coin-icon');
        if (coinIcon) {
            coinIcon.innerHTML = `<img src="${IconDrawer.getCoinIcon(40)}" style="width: 1.5rem; height: 1.5rem; vertical-align: middle; filter: drop-shadow(0 0 8px #ffd700);">`;
        }

        this.setupTooltips();
    }

    private setupTooltips(): void {
        const signal = this.ui.getSignal();
        const icons = [
            { id: 'fullscreen-btn', text: 'FULLSCREEN' },
            { id: 'backpack-btn', text: 'INVENTORY' },
            { id: 'shop-btn', text: 'ITEM SHOP' },
            { id: 'leaderboard-btn', text: 'RANKINGS' },
            { id: 'settings-btn', text: 'SETTINGS' }
        ];

        icons.forEach(icon => {
            const el = document.getElementById(icon.id);
            if (!el) return;

            // PC Interface
            el.addEventListener('mouseenter', (e) => this.ui.showTooltip(icon.text, e.clientX, e.clientY), { signal });
            el.addEventListener('mouseleave', () => this.ui.hideTooltip(), { signal });

            // Mobile Interface - Prevent sticking
            el.addEventListener('touchstart', (e) => {
                const t = e.touches[0];
                // Show tooltip slightly offset to not be under finger
                this.ui.showTooltip(icon.text, t.clientX, t.clientY + 50);
            }, { passive: true, signal });

            el.addEventListener('touchend', () => {
                // Delay hiding slightly so it's readable, but ensure it hides to prevent sticking
                setTimeout(() => this.ui.hideTooltip(), 400);
            }, { signal });

            el.addEventListener('touchcancel', () => this.ui.hideTooltip(), { signal });
        });
    }

    destroy(): void {
        if (this.energyInterval) {
            clearInterval(this.energyInterval);
            this.energyInterval = null;
        }
        if (this.splashInterval) {
            clearInterval(this.splashInterval);
            this.splashInterval = null;
        }
        this.stopReviveTimer();
    }
}
