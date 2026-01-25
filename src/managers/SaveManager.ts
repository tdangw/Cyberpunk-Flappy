import type { PlayerData } from '../types';

/**
 * Manages game saving and player data persistence
 */
export class SaveManager {
    private static instance: SaveManager;
    private storageKey = 'flappy_cyber_data';
    private backupKey = 'flappy_cyber_data_bak';
    private data: PlayerData;
    private wasTampered: boolean = false;

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
        const backup = localStorage.getItem(this.backupKey);

        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (this.verifySignature(parsed)) {
                    // Main save is valid, update backup just in case
                    localStorage.setItem(this.backupKey, saved);
                    return parsed.content;
                } else {
                    console.warn('⚠️ MAIN SAVE TAMPERED. Attempting to restore from backup.');
                    this.wasTampered = true;
                    // Trigger UI alert event
                    window.dispatchEvent(new CustomEvent('securityAlert'));

                    // Try backup
                    if (backup) {
                        try {
                            const parsedBak = JSON.parse(backup);
                            if (this.verifySignature(parsedBak)) {
                                console.log('✅ Success: Restored from last known valid backup.');
                                return parsedBak.content;
                            }
                        } catch (e) { /* ignore */ }
                    }
                }
            } catch (e) {
                console.error('Failed to parse saved data', e);
            }
        }
        return this.getDefaultData();
    }

    public isTampered(): boolean { return this.wasTampered; }

    private getDefaultData(): PlayerData {
        return {
            coins: 10000,
            ownedSkins: ['sphere-0'],
            equippedSkin: 'sphere-0',
            highScore: 0,
            equippedBoostId: 'nitro_default',
            boostRemainingMeters: 10,
            inventoryBoosts: {},
            maxDistance: 0
        };
    }

    resetData(): void {
        this.data = this.getDefaultData();
        this.save();
        localStorage.removeItem(this.backupKey);
    }

    private generateSignature(data: PlayerData): string {
        const str = JSON.stringify(data);
        const salt = 'cyber_salt_99';
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        for (let i = 0; i < salt.length; i++) {
            hash = ((hash << 5) - hash) + salt.charCodeAt(i);
            hash |= 0;
        }
        return hash.toString(16);
    }

    private verifySignature(savedObj: any): boolean {
        if (!savedObj || !savedObj.content || !savedObj.sig) return false;
        return this.generateSignature(savedObj.content) === savedObj.sig;
    }

    save(): void {
        const wrapped = {
            content: this.data,
            sig: this.generateSignature(this.data)
        };
        const serialized = JSON.stringify(wrapped);
        localStorage.setItem(this.storageKey, serialized);
        // Also update backup with this known-good state
        localStorage.setItem(this.backupKey, serialized);
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

    getMaxDistance(): number { return this.data.maxDistance || 0; }
    updateMaxDistance(distance: number): boolean {
        if (distance > (this.data.maxDistance || 0)) {
            this.data.maxDistance = Math.floor(distance);
            this.save();
            return true;
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
