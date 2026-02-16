import type { IUIManager } from '../IUIManager';
import { BOOSTS, type BoostDefinition } from '../../config/boosts';
import { IconDrawer } from '../IconDrawer';

export class ShopScreen {
    private ui: IUIManager;
    private currentTab: 'skins' | 'boosts' = 'skins';
    private currentPage: number = 1;
    private readonly itemsPerPage: number = 20;

    constructor(ui: IUIManager) {
        this.ui = ui;
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        const panel = document.getElementById('shop-panel');
        if (panel) {
            panel.querySelectorAll('.shop-tab').forEach((tab) => {
                const handler = (e: Event) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.ui.playClick();
                    panel.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
                    (e.target as HTMLElement).classList.add('active');
                    this.currentTab = (e.target as HTMLElement).getAttribute('data-tab') as any;
                    this.currentPage = 1;
                    this.renderShopGrid();
                };
                const signal = this.ui.getSignal();
                tab.addEventListener('click', handler, { signal });
                tab.addEventListener('touchstart', handler, { passive: false, signal });
            });
        }
    }

    show(): void {
        this.ui.game.pause();
        this.renderShopGrid();
        this.updateShopBalance();
        this.updateSkinsOwnedCount();
        document.getElementById('shop-panel')?.classList.add('modal-active');
    }

    renderShopGrid(): void {
        const gridEl = document.getElementById('shop-grid');
        const paginationEl = document.getElementById('shop-pagination');
        if (!gridEl || !paginationEl) return;

        const msgEl = document.getElementById('shop-msg');
        if (msgEl) msgEl.textContent = '';

        if (this.currentTab === 'skins') {
            const allSkins = this.ui.skinManager.getAllSkins();
            this.renderSkinGrid(allSkins, gridEl);
            this.renderPagination(allSkins.length, paginationEl);
        } else {
            const buyableBoosts = BOOSTS.filter(b => b.id !== 'nitro_default');
            this.renderBoostGrid(buyableBoosts, gridEl);
            this.renderPagination(buyableBoosts.length, paginationEl);
        }
    }

    updateShopBalance(): void {
        const bal = document.getElementById('shop-balance');
        if (bal) bal.textContent = this.ui.saveManager.getCoins().toString();
    }

    updateSkinsOwnedCount(): void {
        const owned = this.ui.saveManager.getOwnedSkins().length;
        const total = this.ui.skinManager.getAllSkins().length;
        const ownedEl = document.getElementById('owned-skins-count');
        const totalEl = document.getElementById('total-skins-count');
        if (ownedEl) ownedEl.textContent = owned.toString();
        if (totalEl) totalEl.textContent = total.toString();
    }

    private renderSkinGrid(skins: any[], gridEl: HTMLElement): void {
        gridEl.innerHTML = '';
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const pageItems = skins.slice(start, start + this.itemsPerPage);

        pageItems.forEach(skin => {
            const card = document.createElement('div');
            const isLimited = skin.id.includes('limited');
            const isOwned = this.ui.saveManager.getOwnedSkins().includes(skin.id);

            card.className = `skin-card ${isLimited ? 'limited' : ''} ${isOwned ? 'owned-skin' : ''}`;

            const signal = this.ui.getSignal();
            card.addEventListener('mouseenter', (e) => this.ui.showTooltip(skin.description, e.clientX, e.clientY), { signal });
            card.addEventListener('mouseleave', () => this.ui.hideTooltip(), { signal });

            card.innerHTML = `
                <div class="card-preview-box">
                    <div id="card-preview-${skin.id}"></div>
                </div>
                <div class="card-name">${skin.name}</div>
                <button class="shop-card-btn ${isOwned ? 'owned' : 'buy'}" style="width: 100%" ${isOwned ? 'disabled' : ''}>
                    ${isOwned ? 'OWNED' : `$${skin.price}`}
                </button>
            `;

            if (!isOwned) {
                card.querySelector('.shop-card-btn')?.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.ui.playClick();
                    this.handleSkinAction(skin.id, skin.name, skin.price);
                }, { signal });
            }

            gridEl.appendChild(card);
            const previewBox = card.querySelector(`#card-preview-${skin.id}`);
            if (previewBox) previewBox.appendChild(this.ui.skinManager.drawPreview(skin.id));
        });
    }

    private renderBoostGrid(boosts: BoostDefinition[], gridEl: HTMLElement): void {
        gridEl.innerHTML = '';
        const equippedId = this.ui.saveManager.getEquippedBoostId();
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const pageItems = boosts.slice(start, start + this.itemsPerPage);

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

            const signal = this.ui.getSignal();
            card.addEventListener('mouseenter', (e) => this.ui.showTooltip(boost.description, e.clientX, e.clientY), { signal });
            card.addEventListener('mouseleave', () => this.ui.hideTooltip(), { signal });

            card.querySelector('.buy')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.ui.playClick();
                this.handleBoostBuy(boost);
            }, { signal });

            gridEl.appendChild(card);
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
                    this.ui.playClick();
                    this.currentPage = page;
                    this.renderShopGrid();
                }, { signal: this.ui.getSignal() });
            }
            return btn;
        };

        container.appendChild(createBtn('<', this.currentPage - 1, false, this.currentPage === 1));
        for (let i = 1; i <= totalPages; i++) {
            container.appendChild(createBtn(i, i, i === this.currentPage));
        }
        container.appendChild(createBtn('>', this.currentPage + 1, false, this.currentPage === totalPages));
    }

    private handleSkinAction(id: string, name: string, price: number): void {
        const owned = this.ui.saveManager.getOwnedSkins();
        if (owned.includes(id)) return;

        this.ui.showConfirm(`PURCHASE: ${name}`, `Spend ${price} credits to unlock this skin?`, () => {
            if (this.ui.saveManager.spendCoins(price)) {
                this.ui.saveManager.unlockSkin(id);
                this.renderShopGrid();
                this.ui.updateAllUI();
                this.ui.showCentralNotification(`${name.toUpperCase()} UNLOCKED!`, 'success');
            } else {
                this.ui.showCentralNotification('INSUFFICIENT CREDITS', 'error');
            }
        });
    }

    private handleBoostBuy(boost: BoostDefinition): void {
        this.ui.showConfirm(`PURCHASE: ${boost.name}`, `Select quantity to buy for ${boost.name}:`, (qty) => {
            const quantity = qty || 1;
            const total = boost.price * quantity;

            if (this.ui.saveManager.spendCoins(total)) {
                this.ui.saveManager.addBoostToInventory(boost.id, quantity);
                this.renderShopGrid();
                this.ui.updateAllUI();
                this.ui.showCentralNotification(`${boost.name} x${quantity} PURCHASED!`, 'success');
            } else {
                this.ui.showCentralNotification('INSUFFICIENT CREDITS', 'error');
            }
        }, true);
    }
}
