import { Bird } from '../entities/Bird';

import { SaveManager } from '../managers/SaveManager';
import { AudioManager } from '../managers/AudioManager';
import { ParticleSystem } from '../entities/ParticleSystem';
import type { GameConfig, Pipe, Coin, GroundEnemy } from '../types';
import { COLORS } from '../config/constants';

interface CollisionContext {
    bird: Bird;
    pipes: Pipe[];
    coins: Coin[];
    enemies: GroundEnemy[];
    saveManager: SaveManager;
    audioManager: AudioManager;
    particleSystem: ParticleSystem;
    config: GameConfig;
    score: number;
    sessionCoins: number;
    isClassicMode: boolean;
    state: string; // 'PLAYING', etc.
    triggerDying: () => void;
    updateScoreUI: () => void;
    updateCoinUI: () => void;
    createScorePopup: (x: number, y: number, text: string) => void;
}

export class CollisionSystem {
    constructor() { }

    public checkCollisions(ctx: CollisionContext): { score: number; sessionCoins: number } {
        const { bird, pipes, coins, enemies, config } = ctx;
        let { score, sessionCoins } = ctx;

        const birdRect = {
            t: bird.y - bird.radius * 0.6,
            b: bird.y + bird.radius * 0.6,
            l: bird.x - bird.radius * 0.6,
            r: bird.x + bird.radius * 0.6,
        };

        // 1. Pipes
        for (let i = 0; i < pipes.length; i++) {
            const pipe = pipes[i];
            const gapBot = pipe.top + config.pipeGap;

            // Collision Check
            if (birdRect.r > pipe.x && birdRect.l < pipe.x + pipe.w) {
                if (birdRect.t < pipe.top || birdRect.b > gapBot) {
                    if (bird.isInvulnerable()) {
                        // Persistently extend shield while inside ANY part of the pipe
                        // 20 frames ensures it lasts until the next collision check
                        bird.extendInvulnerability(20);

                        // Small visual feedback (no screen shake or big bounce)
                        if (Math.random() > 0.8) {
                            window.dispatchEvent(new CustomEvent('shieldActive', { detail: { x: bird.x, y: bird.y } }));
                        }
                    } else {
                        ctx.triggerDying();
                    }
                }
            }

            // Score Pass Logic
            if (!pipe.passed && bird.x > pipe.x + pipe.w) {
                pipe.passed = true;
                score++;
                ctx.updateScoreUI();
            }
        }

        // 2. Coins
        for (let i = 0; i < coins.length; i++) {
            const coin = coins[i];
            // Simple AABB optimization
            if (bird.x + bird.radius + 5 < coin.x - coin.r ||
                bird.x - bird.radius - 5 > coin.x + coin.r) continue;

            const dx = bird.x - coin.x;
            const dy = bird.y - coin.y;
            if (dx * dx + dy * dy < (bird.radius + coin.r + 5) ** 2) {
                coin.collected = true;
                sessionCoins++;
                ctx.saveManager.addCoins(1);
                ctx.audioManager.play('coin');
                ctx.updateCoinUI();
                ctx.particleSystem.emit(coin.x, coin.y, 8, COLORS.NEON_GOLD);
            }
        }

        // 3. Enemies
        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];
            if (enemy.dead || (enemy as any).dying) continue;

            const enemyRect = {
                l: enemy.x + 5,
                r: enemy.x + enemy.w - 5,
                t: enemy.y + 5,
                b: enemy.y + enemy.h - 5
            };

            if (birdRect.r > enemyRect.l && birdRect.l < enemyRect.r &&
                birdRect.b > enemyRect.t && birdRect.t < enemyRect.b) {

                // STOMP LOGIC
                // Check if bird is falling (vy > 0)
                const isNotJumpingUp = bird.getVelocity().y > -2;
                const hitTopPart = birdRect.b < enemy.y + enemy.h * 0.8;

                if (isNotJumpingUp && hitTopPart) {
                    (enemy as any).dying = true;

                    if (enemy.type === 'bullet') {
                        (enemy as any).vy = -5;
                        enemy.crawlingSpeed = 0;
                        score += 5;
                        ctx.createScorePopup(enemy.x, enemy.y, '+5$ 🪙');
                        ctx.audioManager.play('coin');
                    } else {
                        const originalH = enemy.h;
                        enemy.scaleY = 0.2;
                        enemy.y += originalH * 0.4;
                        enemy.crawlingSpeed = 0;
                        setTimeout(() => { enemy.dead = true; }, 400);
                        score += 2;
                        ctx.createScorePopup(enemy.x, enemy.y, '+2$ 🪙');
                        ctx.audioManager.play('coin');
                    }

                    bird.extendInvulnerability(60);
                    bird.bounce();
                    // Dispatch stomp event for specific effects
                    window.dispatchEvent(new CustomEvent('enemyStomp', { detail: { x: enemy.x, y: enemy.y } }));
                    continue;
                }

                if (bird.isInvulnerable()) {
                    // Sticky Safety: Don't die inside the enemy if shield just ended
                    bird.extendInvulnerability(10);
                } else {
                    ctx.triggerDying();
                }
            }
        }

        return { score, sessionCoins };
    }
}

