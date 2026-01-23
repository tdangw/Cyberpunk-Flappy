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
    energy: number;
    isDashing: boolean;
    wingAngle: number;
    stabilizeTimer: number;
    invulnerableTimer: number;

    private config: GameConfig;
    private onGameOver: () => void;

    constructor(config: GameConfig, onGameOver: () => void) {
        this.x = 200;
        this.y = 350;
        this.speed = 0;
        this.radius = 16;
        this.rotation = 0;
        this.energy = ENERGY.MAX;
        this.isDashing = false;
        this.wingAngle = 0;
        this.stabilizeTimer = 0;
        this.invulnerableTimer = 0;
        this.config = config;
        this.onGameOver = onGameOver;
    }

    setConfig(config: GameConfig): void {
        this.config = config;
    }

    update(): void {
        if (this.invulnerableTimer > 0) this.invulnerableTimer--;

        if (this.isDashing) {
            this.handleDashing();
        } else {
            this.handleNormalMovement();
        }

        this.updateRotation();
        this.checkBounds();
    }

    private handleDashing(): void {
        this.stabilizeTimer = 0;
        if (this.energy > 0) {
            this.energy -= ENERGY.DRAIN_RATE;
            this.speed = 0;
            // Auto-center to middle
            this.y += (CANVAS.HEIGHT / 2 - this.y) * 0.02;
        } else {
            this.stopDash();
        }
    }

    private handleNormalMovement(): void {
        if (this.stabilizeTimer > 0) {
            this.stabilizeTimer--;
            this.speed = 0;
            this.rotation = 0;
        } else {
            this.energy = Math.min(this.energy + ENERGY.RECHARGE_RATE, ENERGY.MAX);
            this.speed += this.config.gravity;
            this.y += this.speed;
        }
    }

    private updateRotation(): void {
        if (this.isDashing) {
            this.rotation = 0;
            this.wingAngle += 0.5;
        } else {
            if (this.stabilizeTimer > 0) {
                this.rotation = 0;
            } else {
                if (this.speed < -2) {
                    this.rotation = -0.3;
                } else if (this.speed > 2) {
                    this.rotation += 0.05;
                    if (this.rotation > 1.2) this.rotation = 1.2;
                } else {
                    this.rotation = 0;
                }
            }
            this.wingAngle += 0.2;
        }
    }

    private checkBounds(): void {
        // Ground collision
        if (this.y + this.radius >= CANVAS.HEIGHT - CANVAS.GROUND_HEIGHT) {
            this.y = CANVAS.HEIGHT - CANVAS.GROUND_HEIGHT - this.radius;
            this.onGameOver();
        }
        // Ceiling collision
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

    startDash(): void {
        if (this.energy >= 20 && !this.isDashing) {
            this.isDashing = true;
        }
    }

    stopDash(): void {
        if (this.isDashing) {
            this.isDashing = false;
            this.stabilizeTimer = ENERGY.STABILIZE_DURATION;
            this.invulnerableTimer = ENERGY.STABILIZE_DURATION;
        }
    }

    isInvulnerable(): boolean {
        return this.isDashing || this.invulnerableTimer > 0;
    }

    reset(): void {
        this.x = 200;
        this.y = 350;
        this.speed = 0;
        this.rotation = 0;
        this.energy = ENERGY.MAX;
        this.isDashing = false;
        this.wingAngle = 0;
        this.stabilizeTimer = 0;
        this.invulnerableTimer = 0;
    }
}
