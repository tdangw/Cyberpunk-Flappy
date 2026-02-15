import type { IUIManager } from '../IUIManager';
import { MAPS } from '../../config/constants';

export class LeaderboardScreen {
    private ui: IUIManager;
    private currentTab: 'personal' | 'online' = 'personal';
    private currentMap: string = 'classic';

    constructor(ui: IUIManager) {
        this.ui = ui;
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        const panel = document.getElementById('leaderboard-panel');
        if (panel) {
            panel.querySelectorAll('.shop-tab').forEach((tab) => {
                const handler = (e: Event) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.ui.playClick();
                    panel.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
                    (e.target as HTMLElement).classList.add('active');
                    this.currentTab = (e.target as HTMLElement).getAttribute('data-lb-tab') as any;

                    // Toggle map tabs visibility
                    panel.setAttribute('data-online', this.currentTab === 'online' ? 'true' : 'false');
                    this.renderLeaderboard();
                };
                tab.addEventListener('click', handler);
                tab.addEventListener('touchstart', handler, { passive: false });
            });

            panel.querySelectorAll('.lb-sub-tab').forEach((tab) => {
                const handler = (e: Event) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.ui.playClick();
                    panel.querySelectorAll('.lb-sub-tab').forEach(t => t.classList.remove('active'));
                    (e.target as HTMLElement).classList.add('active');
                    this.currentMap = (e.target as HTMLElement).getAttribute('data-lb-map') || 'classic';
                    this.renderLeaderboard();
                };
                tab.addEventListener('click', handler);
                tab.addEventListener('touchstart', handler, { passive: false });
            });
        }
    }

    show(): void {
        this.ui.game.pause();
        this.renderLeaderboard();
        document.getElementById('leaderboard-panel')?.classList.add('modal-active');
    }

    private renderLeaderboard(): void {
        const container = document.getElementById('lb-content');
        const mapTabs = document.getElementById('lb-map-tabs');
        if (!container) return;
        container.innerHTML = '';

        if (this.currentTab === 'personal') {
            if (mapTabs) mapTabs.style.display = 'flex';
            this.renderPersonalLB(container);
        } else {
            if (mapTabs) mapTabs.style.display = 'none';
            this.renderOnlineLB(container);
        }
    }

    private renderPersonalLB(container: HTMLElement): void {
        const isClassic = this.currentMap === 'classic';
        const mapIdx = parseInt(this.currentMap);
        const mapDef = !isClassic ? MAPS[mapIdx] : null;

        let highScore = 0;
        let maxDist = 0;
        let totalCoins = 0;

        if (isClassic) {
            highScore = this.ui.saveManager.getHighScore(true);
            maxDist = 0;
            totalCoins = 0;
        } else if (mapDef) {
            const mId = mapDef.id;
            highScore = this.ui.saveManager.getMapHighScore(mId);
            maxDist = this.ui.saveManager.getMapMaxDistance(mId);
            totalCoins = this.ui.saveManager.getMapTotalCoins(mId);
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
}
