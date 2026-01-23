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
            highScore: 0
        };
    }

    resetData(): void {
        this.data = {
            coins: 0,
            ownedSkins: ['sphere-0'],
            equippedSkin: 'sphere-0',
            highScore: 0
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

    getHighScore(): number { return this.data.highScore || 0; }
    updateHighScore(score: number): void {
        if (score > this.getHighScore()) {
            this.data.highScore = score;
            this.save();
        }
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
}
