import type { BirdState, GameConfig } from '../types';
import { ENERGY, CANVAS } from '../config/constants';

/**
 * Bird entity - player character
 */
export class Bird implements BirdState {
    x: number;
    y: number;
    speed: number;
    radius: number;
    rotation: number;

    nitroRemaining: number;
    nitroCapacity: number;
    nitroType: string;
    isDashing: boolean;
    wingAngle: number;
    stabilizeTimer: number;
    invulnerableTimer: number;

    private config: GameConfig;
    private onGameOver: () => void;
    private dashAwaitingMeters = 0;
    private stopRequested = false;
    private nitroRechargeRate = 0; // m/s
    private pxToMeter = 50;

    constructor(config: GameConfig, onGameOver: () => void) {
        this.x = 200;
        this.y = 350;
        this.speed = 0;
        this.radius = 16;
        this.rotation = 0;

        this.nitroType = 'nitro_default';
        this.nitroCapacity = 10;
        this.nitroRemaining = 10;
        this.nitroRechargeRate = 1.0;

        this.isDashing = false;
        this.wingAngle = 0;
        this.stabilizeTimer = 0;
        this.invulnerableTimer = 0;
        this.config = config;
        this.onGameOver = onGameOver;
    }

    setNitroState(type: string, capacity: number, remaining: number, rechargeRate: number = 0): void {
        this.nitroType = type;
        this.nitroCapacity = capacity;
        this.nitroRemaining = remaining;
        this.nitroRechargeRate = rechargeRate;
    }

    get energy(): number {
        return (this.nitroRemaining / this.nitroCapacity) * 100;
    }

    update(dtRatio: number): void {
        if (this.invulnerableTimer > 0) this.invulnerableTimer -= 1 * dtRatio;

        if (this.isDashing) {
            this.handleDashing(dtRatio);
        } else {
            this.handleNormalMovement(dtRatio);
        }

        this.updateRotation(dtRatio);
        this.checkBounds();
    }

    private handleDashing(dtRatio: number): void {
        this.stabilizeTimer = 0;
        const dashSpeed = this.config.speed * 2.5;
        const movedMeters = (dashSpeed * dtRatio) / this.pxToMeter;

        if (this.nitroRemaining > 0 || this.dashAwaitingMeters > 0) {
            const consumeMeters = Math.min(this.nitroRemaining > 0 ? this.nitroRemaining : this.dashAwaitingMeters, movedMeters);
            if (this.nitroRemaining > 0) this.nitroRemaining -= consumeMeters;

            if (this.dashAwaitingMeters > 0) {
                this.dashAwaitingMeters -= movedMeters;
            }

            this.speed = 0;
            this.y += (CANVAS.HEIGHT / 2 - this.y) * 0.02 * dtRatio;

            // Stop condition:
            const outOfEnergy = this.nitroRemaining <= 0 && this.dashAwaitingMeters <= 0;
            const releasedAndBuffered = this.stopRequested && this.dashAwaitingMeters <= 0;

            if (outOfEnergy || releasedAndBuffered) {
                this.finishDash();
            }
        } else {
            this.finishDash();
        }
    }

    private finishDash(): void {
        this.isDashing = false;
        this.stopRequested = false;
        this.dashAwaitingMeters = 0;

        // Anti-Drop Mechanism: Give a small upward pop to prevent falling instantly
        // This gives the player reaction time after a dash ends.
        this.speed = -this.config.jump * 0.5;

        this.stabilizeTimer = 0; // Allow immediate control

        // Extended Invulnerability: 
        // 12 frames (approx 0.2s) of safety after dash ends to prevent 
        // INSTANT death if the dash stops exactly inside a pipe or hazard.
        this.invulnerableTimer = Math.max(12, ENERGY.STABILIZE_DURATION);

        this.checkNitroFallback();
    }

    private checkNitroFallback(): void {
        if (this.nitroType !== 'nitro_default' && this.nitroRemaining <= 0) {
            window.dispatchEvent(new CustomEvent('nitroDepleted'));
            this.setNitroState('nitro_default', 10, 0, 0.333);
        }
    }

    private handleNormalMovement(dtRatio: number): void {
        const hasStabilized = this.stabilizeTimer <= 0;

        if (!hasStabilized) {
            this.stabilizeTimer -= 1 * dtRatio;
            // Removed speed = 0 here. Bird now falls normally during recovery.
        }

        if (this.nitroRechargeRate > 0) {
            const recharge = (this.nitroRechargeRate * dtRatio) / 60;
            this.nitroRemaining = Math.min(this.nitroRemaining + recharge, this.nitroCapacity);
        }

        // Apply constant physics
        this.speed += this.config.gravity * dtRatio;
        this.y += this.speed * dtRatio;

        if (!hasStabilized) {
            // Keep bird level during recovery but allowed to fall
            this.rotation = 0;
        }
    }

    startDash(): void {
        if (!this.isDashing && this.nitroRemaining > 0) {
            // Default Nitro requires > 20% to activate (anti-spam)
            if (this.nitroType === 'nitro_default' && this.energy < 20) {
                return;
            }

            this.isDashing = true;
            this.stopRequested = false;
            this.dashAwaitingMeters = 2; // Fixed tap distance
        }
    }

    stopDash(): void {
        if (this.isDashing) {
            this.stopRequested = true;
        }
    }

    updateFall(dtRatio: number): void {
        this.speed += this.config.gravity * dtRatio;
        this.y += this.speed * dtRatio;
        this.rotation += 0.15 * dtRatio;
    }

    private updateRotation(dtRatio: number): void {
        if (this.isDashing) {
            this.rotation = 0;
            this.wingAngle += 0.5 * dtRatio;
        } else {
            if (this.stabilizeTimer > 0) {
                this.rotation = 0;
            } else {
                if (this.speed < -2) this.rotation = -0.3;
                else if (this.speed > 2) {
                    this.rotation += 0.05 * dtRatio;
                    if (this.rotation > 1.2) this.rotation = 1.2;
                } else this.rotation = 0;
            }
            this.wingAngle += 0.2 * dtRatio;
        }
    }

    private checkBounds(): void {
        const groundY = CANVAS.HEIGHT - CANVAS.GROUND_HEIGHT;
        if (this.y + this.radius >= groundY) {
            if (this.isInvulnerable()) {
                // Ground Bounce Mechanic: If shielded, bounce up instead of dying
                this.y = groundY - this.radius;
                this.bounce();
                this.speed = -this.config.jump * 1.0; // Stronger bounce for ground
                this.invulnerableTimer = 5; // Very short grace period to clear ground collision
                window.dispatchEvent(new CustomEvent('groundBounce'));
            } else {
                this.y = groundY - this.radius;
                this.onGameOver();
            }
        }
        if (this.y - this.radius <= 0) {
            this.y = this.radius;
            this.speed = 0;
        }
    }

    flap(): void {
        if (!this.isDashing) {
            this.stabilizeTimer = 0;
            this.speed = -this.config.jump;
            this.wingAngle = 0;
        }
    }

    bounce(): void {
        this.speed = -this.config.jump * 0.8; // Small bounce up
        this.wingAngle = 0;
    }

    getVelocity(): { x: number; y: number } {
        return { x: 0, y: this.speed };
    }

    isInvulnerable(): boolean {
        // If dashing, ALWAYS safe.
        // If timer > 0 (post-dash or revive), ALSO safe.
        return this.isDashing || this.invulnerableTimer > 0;
    }

    getInvulnerableTimer(): number {
        return this.invulnerableTimer;
    }

    extendInvulnerability(frames: number): void {
        this.invulnerableTimer = Math.max(this.invulnerableTimer, frames);
    }

    resetStateForRevive(): void {
        this.speed = 0;
        this.rotation = 0;
        this.isDashing = false;
        this.stabilizeTimer = 0;
        this.invulnerableTimer = 300; // Extended invulnerability (approx 5s at 60fps)
        this.y = Math.max(100, Math.min(this.y, CANVAS.HEIGHT - 250)); // Safety reposition
    }

    reset(): void {
        this.x = 200; this.y = 350; this.speed = 0; this.rotation = 0;
        this.isDashing = false; this.wingAngle = 0; this.stabilizeTimer = 0; this.invulnerableTimer = 0;
        this.dashAwaitingMeters = 0;
        this.stopRequested = false;
    }

    setConfig(config: GameConfig): void { this.config = config; }
}
