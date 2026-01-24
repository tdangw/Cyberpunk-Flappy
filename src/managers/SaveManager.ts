import type { PlayerData } from '../types';

/**
 * Manages game saving and player data persistence
 */
export class SaveManager {
    private static instance: SaveManager;
    private storageKey = 'flappy_cyber_data';
    private data: PlayerData;

    private constructor() {
        this.data = this.load();
    }

    static getInstance(): SaveManager {
        if (!SaveManager.instance) {
            SaveManager.instance = new SaveManager();
        }
        return SaveManager.instance;
    }

    private load(): PlayerData {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Failed to parse saved data', e);
            }
        }
        return {
            coins: 0,
            ownedSkins: ['sphere-0'],
            equippedSkin: 'sphere-0',
            highScore: 0,
            equippedBoostId: 'nitro_default',
            boostRemainingMeters: 10,
            inventoryBoosts: {}
        };
    }

    resetData(): void {
        this.data = {
            coins: 0,
            ownedSkins: ['sphere-0'],
            equippedSkin: 'sphere-0',
            highScore: 0,
            equippedBoostId: 'nitro_default',
            boostRemainingMeters: 10,
            inventoryBoosts: {}
        };
        this.save();
    }

    save(): void {
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    }

    getCoins(): number { return this.data.coins; }
    addCoins(amount: number): void { this.data.coins += amount; this.save(); }
    spendCoins(amount: number): boolean {
        if (this.data.coins >= amount) {
            this.data.coins -= amount;
            this.save();
            return true;
        }
        return false;
    }

    getHighScore(isClassic: boolean = false): number {
        return isClassic ? (this.data.classicHighScore || 0) : (this.data.highScore || 0);
    }

    updateHighScore(score: number, isClassic: boolean = false): boolean {
        if (isClassic) {
            if (score > (this.data.classicHighScore || 0)) {
                this.data.classicHighScore = score;
                this.save();
                return true;
            }
        } else {
            if (score > (this.data.highScore || 0)) {
                this.data.highScore = score;
                this.save();
                return true;
            }
        }
        return false;
    }

    getOwnedSkins(): string[] { return this.data.ownedSkins; }
    unlockSkin(id: string): void {
        if (!this.data.ownedSkins.includes(id)) {
            this.data.ownedSkins.push(id);
            this.save();
        }
    }

    getEquippedSkin(): string { return this.data.equippedSkin; }
    equipSkin(id: string): void {
        this.data.equippedSkin = id;
        this.save();
    }

    getEquippedBoostId(): string {
        return this.data.equippedBoostId || 'nitro_default';
    }

    setEquippedBoost(id: string, capacity: number): void {
        this.data.equippedBoostId = id;
        this.data.boostRemainingMeters = capacity;
        this.save();
    }

    getBoostRemaining(): number {
        return this.data.boostRemainingMeters || 0;
    }

    updateBoostRemaining(meters: number): void {
        this.data.boostRemainingMeters = meters;
        this.save();
    }

    addBoostToInventory(id: string, count: number = 1): void {
        if (!this.data.inventoryBoosts) this.data.inventoryBoosts = {};
        this.data.inventoryBoosts[id] = (this.data.inventoryBoosts[id] || 0) + count;
        this.save();
    }

    getBoostCount(id: string): number {
        return this.data.inventoryBoosts?.[id] || 0;
    }

    useBoostFromInventory(id: string): boolean {
        if (!this.data.inventoryBoosts || !this.data.inventoryBoosts[id]) return false;
        this.data.inventoryBoosts[id]--;
        if (this.data.inventoryBoosts[id] <= 0) delete this.data.inventoryBoosts[id];
        this.save();
        return true;
    }
}
