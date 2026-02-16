import { BOOSTS } from '../config/boosts';
import { SaveManager } from '../managers/SaveManager';
import { Bird } from '../entities/Bird';

/**
 * Handles Nitro/Stamina logic, inventory usage, and bird syncing.
 */
export class NitroSystem {
    private saveManager: SaveManager;
    private abortController = new AbortController();
    private bird: Bird;

    constructor(saveManager: SaveManager, bird: Bird) {
        this.saveManager = saveManager;
        this.bird = bird;

        this.setupEvents();
    }

    private setupEvents(): void {
        const signal = this.abortController.signal;
        window.addEventListener('nitroDepleted', () => this.handleDepletion(), { signal });
    }

    public destroy(): void {
        this.abortController.abort();
    }

    public syncToBird(): void {
        const boostId = this.saveManager.getEquippedBoostId();
        const remaining = this.saveManager.getBoostRemaining();

        // Find boost details
        const boostDef = BOOSTS.find(b => b.id === boostId) || BOOSTS[0];

        let capacity = boostDef.capacity;

        // Safety fallback for default
        if (boostId === 'nitro_default' && capacity <= 0) {
            capacity = BOOSTS[0].capacity;
        }

        this.bird.setNitroState(
            boostDef.id,
            capacity,
            remaining,
            boostDef.rechargeRate || 0
        );
    }

    private handleDepletion(): void {
        const boostId = this.saveManager.getEquippedBoostId();

        if (boostId !== 'nitro_default') {
            const count = this.saveManager.getBoostCount(boostId);
            if (count > 0) {
                // Replenish: use one from inventory and refill the bird's tank
                this.saveManager.useBoostFromInventory(boostId);

                const boostDef = BOOSTS.find(b => b.id === boostId);
                if (boostDef) {
                    this.saveManager.setEquippedBoost(boostId, boostDef.capacity);
                    this.syncToBird();
                    return; // Successfully replenished
                }
            }
        }

        // Fallback to default if no boosters left or using default
        this.saveManager.setEquippedBoost('nitro_default', BOOSTS[0].capacity);
        this.syncToBird();

        // Notify UI to update inventory counts
        window.dispatchEvent(new CustomEvent('updateUI'));
    }

    public resetDefault(): void {
        if (this.saveManager.getEquippedBoostId() === 'nitro_default') {
            this.saveManager.updateBoostRemaining(BOOSTS[0].capacity);
        }
    }

    public updateRemaining(amount: number): void {
        this.saveManager.updateBoostRemaining(amount);
    }
}
