import { SkinManager } from '../managers/SkinManager';
import { CANVAS } from '../config/constants';
import type { BirdState } from '../types';

interface BGBird {
    id: string; // skin id
    x: number;
    y: number;
    vy: number; // Vertical velocity for gravity/jump
    rotation: number;
    scale: number;
    parallax: number;
    baseSpeed: number; // Normal flying speed
    currentSpeed: number; // Actual speed

    wingAngle: number;
    wingSpeed: number;

    // AI State
    targetY: number;      // Ideal Y level to maintain
    dashTimer: number;    // frames remaining for dash
    dashCooldown: number; // frames until next dash can happen
    isDashing: boolean;
}

export class BackgroundBirdManager {
    private birds: BGBird[] = [];
    private skinManager: SkinManager;
    private spawnTimer: number = 0;

    // Whitelist of "flying" skins to use for background
    private readonly ALLOWED_SKINS = [
        'pigeon', 'chicken', 'duck', 'phoenix', 'dragonfly', 'bee', 'flappy', 'beetle'
    ];

    constructor() {
        this.skinManager = SkinManager.getInstance();
        this.spawnTimer = Math.random() * 200 + 100;
    }

    reset(): void {
        this.birds = [];
        this.spawnTimer = Math.random() * 200 + 100;

        // PRE-SPAWN: Create birds already in the sky to simulate a living world
        // Spread them across the screen width (0 to CANVAS.WIDTH)
        const initialCount = 4 + Math.floor(Math.random() * 3);
        for (let i = 0; i < initialCount; i++) {
            const startX = Math.random() * CANVAS.WIDTH;
            const startY = Math.random() * (CANVAS.HEIGHT - 100) + 50;
            this.birds.push(this.createBird(this.getRandomSkinId(), startX, startY));
        }
    }

    update(dtRatio: number, scrollSpeed: number): void {
        // Spawn Logic
        this.spawnTimer -= dtRatio;
        if (this.spawnTimer <= 0) {
            this.spawnEvent();
            this.spawnTimer = Math.random() * 700 + 300;
        }

        // Update Position & Animation
        this.birds.forEach(b => {
            // 1. Horizontal Movement (SAME DIRECTION as Player)
            let activeSpeed = b.currentSpeed;

            // Dash Logic
            if (b.isDashing) {
                b.dashTimer -= dtRatio;
                activeSpeed = b.baseSpeed * 2.5;
                if (b.dashTimer <= 0) {
                    b.isDashing = false;
                    b.dashCooldown = Math.random() * 300 + 200;
                    b.currentSpeed = b.baseSpeed;
                }
            } else {
                if (b.dashCooldown > 0) b.dashCooldown -= dtRatio;
                if (b.dashCooldown <= 0 && Math.random() < 0.005) {
                    b.isDashing = true;
                    b.dashTimer = 20 + Math.random() * 20;
                }
            }

            // Move Formula for "Same Direction":
            const relativeSpeed = activeSpeed - (scrollSpeed * b.parallax);
            b.x += relativeSpeed * dtRatio;

            // 2. Vertical Physics
            b.vy += 0.25 * dtRatio;
            b.y += b.vy * dtRatio;

            // AI Flap Logic
            if (b.y > b.targetY + Math.random() * 30) {
                b.vy = -4.5;
                b.wingSpeed = 0.3;
            }
            if (b.wingSpeed > 0.15) b.wingSpeed -= 0.01 * dtRatio;

            // Rotation
            const rotationTarget = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (b.vy * 0.1)));
            b.rotation += (rotationTarget - b.rotation) * 0.1 * dtRatio;

            // Flap Wings
            b.wingAngle += b.wingSpeed * dtRatio;
        });

        // Cleanup: Remove if off-screen Right OR drifts too far Left
        this.birds = this.birds.filter(b => b.x < CANVAS.WIDTH + 150 && b.x > -150);
    }

    private spawnEvent(): void {
        // Spawn from LEFT side now (-50)
        if (Math.random() < 0.3) {
            this.spawnFlock();
        } else {
            this.spawnSolo();
        }
    }

    private getRandomSkinId(): string {
        const baseId = this.ALLOWED_SKINS[Math.floor(Math.random() * this.ALLOWED_SKINS.length)];
        const variants = this.skinManager.getAllSkins().filter(s => s.id.startsWith(baseId + '-'));
        if (variants.length > 0) {
            return variants[Math.floor(Math.random() * variants.length)].id;
        }
        return baseId + '-0';
    }

    private spawnSolo(): void {
        const skinId = this.getRandomSkinId();
        // Wider Vertical Range: 50px from top to near ground
        const y = Math.random() * (CANVAS.HEIGHT - 120) + 50;
        const startX = -80;
        this.birds.push(this.createBird(skinId, startX, y));
    }

    private spawnFlock(): void {
        const skinId = this.getRandomSkinId();
        const startX = -100;
        const startY = Math.random() * (CANVAS.HEIGHT - 150) + 50;

        // Leader
        this.birds.push(this.createBird(skinId, startX, startY));

        // Followers
        const count = Math.floor(Math.random() * 3) + 2;
        const formation = Math.random() > 0.5 ? 'V' : 'Line';

        for (let i = 1; i <= count; i++) {
            let x = startX, y = startY;
            if (formation === 'V') {
                x = startX - i * 40;
                y = startY - i * 20;
                this.birds.push(this.createBird(skinId, x, y));
                y = startY + i * 20;
                this.birds.push(this.createBird(skinId, x, y));
            } else {
                x = startX - i * 50;
                y = startY + (Math.random() - 0.5) * 30;
                this.birds.push(this.createBird(skinId, x, y));
            }
        }
    }

    private createBird(id: string, x: number, y: number): BGBird {
        // Depth Logic: "Farther" means smaller scale, slower parallax, less vivid
        // Random depth factor: 0.0 (Close) to 1.0 (Very Far)
        const depth = Math.random();

        // Scale: Much Smaller (0.28) -> Far (0.14)
        // "xa hơn, nhỏ"
        const scale = 0.28 - (depth * 0.14);

        // Parallax: Close (0.8) -> Far (0.2)
        // Moves slower relative to camera when far
        const parallax = 0.8 - (depth * 0.6);

        // Speed Tuning:
        // World Scroll is approx 3-4.
        // Some slower (2.0) -> Drifts back.
        // Some faster (6.0) -> Overtakes.
        // Range: 1.5 to 6.5
        const baseSpeed = 1.5 + Math.random() * 5.0;

        return {
            id, x, y,
            vy: (Math.random() - 0.5) * 2,
            rotation: 0,
            scale,
            parallax,
            baseSpeed,
            currentSpeed: baseSpeed,
            wingAngle: Math.random() * Math.PI,
            wingSpeed: 0.15,

            targetY: y,
            dashTimer: 0,
            dashCooldown: Math.random() * 200,
            isDashing: false
        };
    }

    render(ctx: CanvasRenderingContext2D, frames: number): void {
        this.birds.forEach(b => {
            ctx.save();
            ctx.translate(b.x, b.y);

            // Face Right
            ctx.scale(b.scale, b.scale);
            ctx.rotate(b.rotation);

            // Depth Opacity: Faint
            ctx.globalAlpha = 0.25 + b.parallax * 0.45;

            // Dash Trail (Removed for Mobile Performance)
            // if (b.isDashing) { ... }

            const mockBird: Partial<BirdState> = {
                x: 0, y: 0,
                rotation: 0,
                wingAngle: b.wingAngle,
                radius: 10,
                invulnerableTimer: 0,
                isDashing: b.isDashing
            };

            this.skinManager.drawSkin(ctx, b.id, mockBird as BirdState, b.isDashing, frames);

            ctx.restore();
        });
    }
}
