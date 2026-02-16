import type { IUIManager } from '../IUIManager';
import { BOOSTS, type BoostDefinition } from '../../config/boosts';
import { IconDrawer } from '../IconDrawer';

export class InventoryScreen {
    private ui: IUIManager;
    private currentTab: 'skins' | 'boosts' = 'skins';
    private currentPage: number = 1;
    private readonly itemsPerPage: number = 20;

    constructor(ui: IUIManager) {
        this.ui = ui;
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        const panel = document.getElementById('inventory-panel');
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
                    this.renderInventoryGrid();
                };
                tab.addEventListener('click', handler);
                tab.addEventListener('touchstart', handler, { passive: false });
            });
        }
    }

    show(): void {
        this.ui.game.pause();
        this.renderInventoryGrid();
        this.updateInventoryStats();
        document.getElementById('inventory-panel')?.classList.add('modal-active');
    }

    renderInventoryGrid(): void {
        const gridEl = document.getElementById('inventory-grid');
        const paginationEl = document.getElementById('inventory-pagination');
        if (!gridEl || !paginationEl) return;

        if (this.currentTab === 'skins') {
            const allSkins = this.ui.skinManager.getAllSkins();
            const ownedIds = this.ui.saveManager.getOwnedSkins();
            const ownedSkins = allSkins.filter(s => ownedIds.includes(s.id));
            this.renderInvSkinGrid(ownedSkins, gridEl);
            this.renderPagination(ownedSkins.length, paginationEl);
        } else {
            const ownedBoosts = BOOSTS.filter(b => {
                return b.id === 'nitro_default' || this.ui.saveManager.getBoostCount(b.id) > 0;
            });
            this.renderInvBoostGrid(ownedBoosts, gridEl);
            this.renderPagination(ownedBoosts.length, paginationEl);
        }
    }

    updateInventoryStats(): void {
        const ownedCount = this.ui.saveManager.getOwnedSkins().length;
        const totalSkins = this.ui.skinManager.getAllSkins().length;
        const el = document.getElementById('inv-skins-count');
        if (el) el.textContent = `${ownedCount}/${totalSkins} SKINS ARCHIVED`;
    }

    private renderInvSkinGrid(ownedSkins: any[], gridEl: HTMLElement): void {
        gridEl.innerHTML = '';
        const equipped = this.ui.saveManager.getEquippedSkin();
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const pageItems = ownedSkins.slice(start, start + this.itemsPerPage);

        pageItems.forEach(skin => {
            const card = document.createElement('div');
            const isEquipped = equipped === skin.id;
            const isLimited = skin.id.includes('limited');
            card.className = `skin-card ${isEquipped ? 'equipped' : ''} ${isLimited ? 'limited' : ''}`;

            card.addEventListener('mouseenter', (e) => this.ui.showTooltip(skin.description, e.clientX, e.clientY));
            card.addEventListener('mouseleave', () => this.ui.hideTooltip());

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
                this.ui.playClick();
                this.ui.saveManager.equipSkin(skin.id);
                this.renderInventoryGrid();
                this.ui.showCentralNotification(`${skin.name.toUpperCase()} EQUIPPED`, 'success');
            });

            gridEl.appendChild(card);
            const previewBox = card.querySelector(`#inv-preview-${skin.id}`);
            if (previewBox) previewBox.appendChild(this.ui.skinManager.drawPreview(skin.id));
        });
    }

    private renderInvBoostGrid(ownedBoosts: BoostDefinition[], gridEl: HTMLElement): void {
        gridEl.innerHTML = '';
        const equippedId = this.ui.saveManager.getEquippedBoostId();
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const pageItems = ownedBoosts.slice(start, start + this.itemsPerPage);

        pageItems.forEach(boost => {
            const count = this.ui.saveManager.getBoostCount(boost.id);
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

            card.addEventListener('mouseenter', (e) => this.ui.showTooltip(boost.description, e.clientX, e.clientY));
            card.addEventListener('mouseleave', () => this.ui.hideTooltip());

            card.querySelector('.activate')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.ui.playClick();
                this.handleInvBoostActivate(boost);
            });

            gridEl.appendChild(card);
        });
    }

    private handleInvBoostActivate(boost: BoostDefinition): void {
        const equippedId = this.ui.saveManager.getEquippedBoostId();
        if (equippedId === boost.id) return;

        this.ui.saveManager.setEquippedBoost(boost.id, boost.capacity);
        this.renderInventoryGrid();
        this.ui.game.syncNitroToBird();
        this.ui.updateAllUI();
        this.ui.showCentralNotification(`${boost.name.toUpperCase()} EQUIPPED`, 'success');
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
                    this.renderInventoryGrid();
                });
            }
            return btn;
        };

        container.appendChild(createBtn('<', this.currentPage - 1, false, this.currentPage === 1));
        for (let i = 1; i <= totalPages; i++) {
            container.appendChild(createBtn(i, i, i === this.currentPage));
        }
        container.appendChild(createBtn('>', this.currentPage + 1, false, this.currentPage === totalPages));
    }
}
