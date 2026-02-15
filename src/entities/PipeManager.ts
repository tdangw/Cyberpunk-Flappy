import type { Pipe, GameConfig } from '../types';
import { CANVAS, COLORS } from '../config/constants';
import { CoinManager } from './CoinManager';
import { EnemyManager } from './EnemyManager';

/**
 * Manages pipe generation, movement
 */
export class PipeManager {
    private pipes: Pipe[] = [];
    private config: GameConfig;
    private coinManager: CoinManager;
    private enemyManager: EnemyManager;
    private pipeStyle: string = 'cyber';
    private pipeColor: string = COLORS.NEON_PINK;
    private currentScore: number = 0;

    // Generation State
    private currentPipeInterval: number = 400;
    private patternType: 'none' | 'stairs_up' | 'stairs_down' | 'twins' | 'desert' | 'bullet_stairs' | 'bullet_squad' | 'bullet_zigzag' = 'none';
    private patternRemaining: number = 0;
    private lastPipeTop: number = 300;

    constructor(config: GameConfig, coinManager: CoinManager, enemyManager: EnemyManager) {
        this.config = config;
        this.coinManager = coinManager;
        this.enemyManager = enemyManager;
        this.setNextPipeInterval();
    }

    setConfig(config: GameConfig): void {
        this.config = config;
        this.setNextPipeInterval();
    }

    update(speed: number, dtRatio: number, isClassic: boolean, currentScore: number): void {
        this.currentScore = currentScore;

        // Pipes
        this.pipes.forEach((p) => {
            p.x -= speed * dtRatio;

            // Post-Pass Animations (Data-Driven Mechanics)
            // Disable effects in Classic Mode
            if (!isClassic && p.passed && this.currentScore >= 3) {
                if (p.mechanic === undefined) {
                    let pool: string[] = ['falling', 'clamping'];

                    // Expanded pool for Neon/Cyber themes
                    const neonStyles = ['cyber', 'neon', 'glitch', 'plasma'];

                    if (neonStyles.includes(this.pipeStyle)) {
                        pool = [
                            'falling', 'clamping', 'glitch', 'pixelate',
                            'hologram', 'wireframe', 'binary',
                            'laser_blue', 'laser_red', 'laser_green',
                            'laser_purple', 'laser_rainbow',
                            'laser_mega', 'laser_dual'
                        ];
                    } else if (this.pipeStyle === 'magma') {
                        pool = ['falling', 'clamping', 'pixelate', 'burning', 'lava_spray', 'cracking'];
                    }

                    // Use pure random for better distribution
                    const roll = Math.floor(Math.random() * pool.length);
                    p.mechanic = pool[roll];
                    p.animTimer = 0;
                    p.mechanicState = {};
                }

                p.animTimer! += dtRatio;
            }
        });

        if (this.pipes.length && this.pipes[0].x + this.pipes[0].w < -100) {
            this.pipes.shift();
        }

        const lastPipe = this.pipes[this.pipes.length - 1];
        if (!lastPipe || CANVAS.WIDTH - lastPipe.x >= this.currentPipeInterval) {
            const wasEvent = this.patternType !== 'none' && this.patternType.startsWith('bullet_');
            this.createPipe(wasEvent, isClassic);
            // Only randomize next interval if we didn't just start a custom event 
            // handleBulletEvent sets a specific interval; we mustn't overwrite it.
            if (!wasEvent) {
                this.setNextPipeInterval();
            }
        }
    }

    private createPipe(wasEvent: boolean, isClassic: boolean): void {
        const groundH = CANVAS.GROUND_HEIGHT;
        const configGap = this.config.pipeGap;
        const gapVariance = (Math.random() - 0.5) * 20;
        const gap = configGap + gapVariance;
        const padding = 100;
        const minY = padding;
        const maxY = CANVAS.HEIGHT - groundH - gap - padding;

        let topH: number;
        let spawnX = CANVAS.WIDTH + 150;
        const lastPipe = this.pipes[this.pipes.length - 1];

        // Enemy Spawning
        const randEvent = Math.random();
        if (!isClassic && !wasEvent && this.currentPipeInterval > 150) {
            if (randEvent < 0.12) {
                this.enemyManager.spawnGroundEnemy(spawnX + 200);
            } else if (randEvent < 0.22) {
                this.enemyManager.spawnFallingEnemy(spawnX, lastPipe ? lastPipe.top : 300);
            } else if (randEvent < 0.40) {
                const midY = lastPipe ? (lastPipe.top + gap / 2) : 350;
                this.enemyManager.spawnBullet(spawnX + 180, midY + (Math.random() - 0.5) * 100);
            }
        }

        // Complex Events
        if (!isClassic && !wasEvent && (this.patternType === 'bullet_stairs' || this.patternType === 'bullet_zigzag')) {
            this.handleBulletEvent(spawnX, lastPipe ? lastPipe.top : 300, gap);
            return;
        }

        // Pattern Logic
        if (lastPipe && this.patternRemaining > 0) {
            spawnX = lastPipe.x + this.currentPipeInterval;
            if (this.patternType === 'stairs_up') {
                topH = Math.max(minY, this.lastPipeTop - 60);
            } else if (this.patternType === 'stairs_down') {
                topH = Math.min(maxY, this.lastPipeTop + 80);
            } else if (this.patternType === 'twins') {
                topH = this.lastPipeTop;
            } else {
                topH = Math.random() * (maxY - minY) + minY;
            }
        } else {
            topH = Math.random() * (maxY - minY) + minY;
            if (lastPipe && Math.abs(topH - this.lastPipeTop) > 300) {
                topH = this.lastPipeTop + (topH > this.lastPipeTop ? 150 : -150);
            }
        }

        this.lastPipeTop = topH;
        const pipe: Pipe = { x: spawnX, top: topH, w: 80, passed: false, seed: Math.floor(Math.random() * 1000) };
        this.pipes.push(pipe);

        if (this.patternRemaining > 0) this.patternRemaining--;

        // Spawn Coin (Only in Non-Classic Modes)
        if (!isClassic) {
            const isTight = this.currentPipeInterval < 150;
            if (Math.random() < (isTight ? 0.1 : 0.4)) {
                const coinX = pipe.x + 40;
                const coinY = topH + gap / 2;
                this.coinManager.spawn(coinX, coinY);
            }
        }
    }

    private handleBulletEvent(spawnX: number, lastTop: number, gap: number): void {
        const type = this.patternType;
        this.patternType = 'none';

        if (type === 'bullet_squad') {
            this.currentPipeInterval = 800;
            const startX = spawnX + 100;
            const count = 4;
            const midY = lastTop + gap / 2;
            const squadY = midY + (Math.random() > 0.5 ? -50 : 50);
            for (let i = 0; i < count; i++) {
                this.enemyManager.spawnBullet(startX + i * 90, squadY);
            }
        } else if (type === 'bullet_stairs') {
            this.currentPipeInterval = 2500;
            const startX = spawnX + 150;
            const count = 5;
            const hGap = 62;
            const vStep = 50;

            const startY1 = CANVAS.HEIGHT - CANVAS.GROUND_HEIGHT - 120;
            for (let i = 0; i < count; i++) {
                this.enemyManager.spawnBullet(startX + i * hGap, startY1 - (i * vStep));
            }

            const offsetX = (count * hGap) + 350;
            const startY2 = CANVAS.HEIGHT - CANVAS.GROUND_HEIGHT - 180;
            for (let i = 0; i < count; i++) {
                this.enemyManager.spawnBullet(startX + offsetX + i * hGap, startY2 - (i * vStep));
            }
        } else if (type === 'bullet_zigzag') {
            this.currentPipeInterval = 2500;
            const startX = spawnX + 150;
            const count = 6;
            const horizontalGap = 220;
            const topY = 80;
            const bottomY = CANVAS.HEIGHT - CANVAS.GROUND_HEIGHT - 80;

            for (let i = 0; i < count; i++) {
                const x = startX + i * horizontalGap;
                this.enemyManager.spawnBullet(x, topY);
                this.enemyManager.spawnBullet(x, bottomY);
            }
        }
    }

    setColors(color: string): void { this.pipeColor = color; }
    setStyle(style: string): void { this.pipeStyle = style; }

    private setNextPipeInterval(): void {
        const baseSpacing = 250;

        // 1. Logic for currently active patterns
        if (this.patternRemaining > 0) {
            if (this.patternType === 'stairs_up' || this.patternType === 'twins') {
                this.currentPipeInterval = 80;
                return;
            }
            if (this.patternType === 'stairs_down') {
                this.currentPipeInterval = 320;
                return;
            }
        }
        if (this.patternType !== 'none') {
            const prevType = this.patternType;
            this.patternType = 'none';
            this.patternRemaining = 0;
            if (prevType !== 'desert') {
                this.currentPipeInterval = 450;
                return;
            }
        }
        const rand = Math.random();
        if (rand < 0.10) {
            this.patternType = 'stairs_up';
            this.patternRemaining = 2 + Math.floor(Math.random() * 3);
            this.currentPipeInterval = 250;
        } else if (rand < 0.18) {
            this.patternType = 'stairs_down';
            this.patternRemaining = 2 + Math.floor(Math.random() * 3);
            this.currentPipeInterval = 250;
        } else if (rand < 0.25) {
            this.patternType = 'twins';
            this.patternRemaining = 2 + Math.floor(Math.random() * 3);
            this.currentPipeInterval = 250;
        } else if (rand < 0.30) {
            this.patternType = 'desert';
            this.currentPipeInterval = 1800 + Math.random() * 500;
        } else if (rand < 0.45) {
            // ADVANCED BULLET FORMATIONS (Now chose as top-level patterns)
            const fRand = Math.random();
            if (fRand < 0.4) this.patternType = 'bullet_stairs';
            else if (fRand < 0.7) this.patternType = 'bullet_squad';
            else this.patternType = 'bullet_zigzag';
            // Spacing will be set inside createPipe when the event triggers
            this.currentPipeInterval = baseSpacing;
        } else {
            // NORMAL: 250 +- 50
            const variance = 50;
            this.currentPipeInterval = baseSpacing + (Math.random() - 0.5) * variance * 2;
        }
    }

    getPipes(): Pipe[] { return this.pipes; }


    reset(): void {
        this.pipes = [];
        this.patternType = 'none';
        this.patternRemaining = 0;
        this.lastPipeTop = 300;
        this.setNextPipeInterval();
    }

    clearNearPipes(birdX: number): void {
        this.pipes = this.pipes.filter(p => p.x < birdX - 50 || p.x > birdX + 400);
    }

    render(ctx: CanvasRenderingContext2D, frames: number, _isClassic: boolean = false): void {
        this.pipes.forEach((p) => this.drawPipe(ctx, p, frames));
    }

    private drawPipe(ctx: CanvasRenderingContext2D, p: Pipe, frames: number): void {
        const gap = this.config.pipeGap;
        const botY = p.top + gap;
        ctx.save();
        ctx.fillStyle = '#050010';
        ctx.strokeStyle = this.pipeColor;
        ctx.lineWidth = 4;
        // ctx.shadowBlur = 5; // Removed for performance

        const drawBody = () => {
            ctx.strokeRect(p.x, 0, p.w, p.top);
            ctx.fillRect(p.x, 0, p.w, p.top);
            ctx.strokeRect(p.x, botY, p.w, CANVAS.HEIGHT - botY);
            ctx.fillRect(p.x, botY, p.w, CANVAS.HEIGHT - botY);
        };

        const neonStyles = ['cyber', 'neon', 'glitch', 'plasma'];
        if (this.pipeStyle === '3d') {
            this.draw3DPipe(ctx, p, botY);
        } else if (neonStyles.includes(this.pipeStyle)) {
            this.drawNeonStylePipe(ctx, p, botY, frames);
        } else if (this.pipeStyle === 'classic') {
            this.drawClassicPipe(ctx, p, botY);
        } else if (this.pipeStyle === 'ocean' || this.pipeStyle === 'coral') {
            this.drawOceanPipe(ctx, p, botY, frames);
        } else if (this.pipeStyle === 'magma') {
            this.drawMagmaPipe(ctx, p, botY, frames);
        } else if (this.pipeStyle === 'mossy') {
            this.drawMossyPipe(ctx, p, botY);
        } else if (this.pipeStyle === 'star_forge') {
            this.drawStarForgePipe(ctx, p, botY, frames);
        } else {
            drawBody();
        }

        ctx.restore();
    }

    private drawClassicPipe(ctx: CanvasRenderingContext2D, p: Pipe, botY: number): void {
        const bx = p.x; const bw = p.w; const top = p.top;
        const rimHeight = 26; const rimOverhang = 4;
        const t = p.animTimer || 0;

        const drawPart = (pbx: number, pby: number, pbw: number, pbh: number, isRim: boolean) => {
            const fall = (p.mechanic === 'falling' && p.passed) ? (t * t * 0.2) : 0;
            const close = (p.mechanic === 'clamping' && p.passed) ? Math.min(30, t * 1.5) : 0;
            const finalBY = pby + fall + (isRim ? (pbx < bx ? -close : close) : (pby < top ? close : -close));

            const grad = ctx.createLinearGradient(pbx, finalBY, pbx + pbw, finalBY);
            grad.addColorStop(0, '#4a8522'); grad.addColorStop(0.1, '#65a830');
            grad.addColorStop(0.4, '#b4e05b'); grad.addColorStop(0.6, '#98d146');
            grad.addColorStop(0.9, '#65a830'); grad.addColorStop(1, '#3b6916');
            ctx.fillStyle = grad; ctx.beginPath(); ctx.rect(pbx, finalBY, pbw, pbh); ctx.fill(); ctx.stroke();
        };
        drawPart(bx, -5, bw, top - rimHeight + 5, false);
        drawPart(bx - rimOverhang, top - rimHeight, bw + rimOverhang * 2, rimHeight, true);
        drawPart(bx - rimOverhang, botY, bw + rimOverhang * 2, rimHeight, true);
        drawPart(bx, botY + rimHeight, bw, CANVAS.HEIGHT - (botY + rimHeight) - CANVAS.GROUND_HEIGHT + 5, false);
    }

    private drawOceanPipe(ctx: CanvasRenderingContext2D, p: Pipe, bot: number, frames: number): void {
        const x = p.x; const w = p.w; const top = p.top;
        const rimHeight = 26;
        const rimOverhang = 6;

        const drawPart = (bx: number, by: number, bw: number, bh: number, isRim: boolean) => {
            // 1. Deep Ocean Metallic Base
            // Using a rich blue gradient
            const grad = ctx.createLinearGradient(bx, by, bx + bw, by);
            grad.addColorStop(0, '#0c4a6e');     // Deep Seal Blue
            grad.addColorStop(0.2, '#0369a1');   // Ocean Blue
            grad.addColorStop(0.5, '#0ea5e9');   // Cyan Highlight (Light reflection underwater)
            grad.addColorStop(0.8, '#0369a1');
            grad.addColorStop(1, '#082f49');     // Dark Depth Blue
            ctx.fillStyle = grad;

            // Clip everything to the pipe body to prevent overflow
            ctx.save();
            ctx.beginPath();
            if (isRim && ctx.roundRect) {
                ctx.roundRect(bx, by, bw, bh, 3);
            } else {
                ctx.rect(bx, by, bw, bh);
            }
            ctx.fill(); // Fill the base color before clipping
            ctx.clip();

            // 2. Scale Pattern (Optimized)
            if (!isRim) {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
                ctx.lineWidth = 1.2;
                ctx.beginPath();

                const scaleSize = 24; // Increased size (fewer iterations)
                for (let y = by; y < by + bh; y += 16) {
                    const row = Math.floor((y - by) / 16);
                    const offset = (row % 2) * (scaleSize / 2);

                    for (let sx = bx - scaleSize; sx < bx + bw + scaleSize; sx += scaleSize) {
                        ctx.moveTo(sx + offset, y);
                        // Simplified curve
                        ctx.lineTo(sx + offset + scaleSize / 2, y + 6);
                        ctx.lineTo(sx + offset + scaleSize, y);
                    }
                }
                ctx.stroke();

                // 3. Ocean Decorations (Deterministic Randomness)
                const seed = Math.abs(top * 13.7);

                // 3a. Bubble Field (Like Star Field but for underwater)
                const bubbleCount = 4 + (Math.floor(seed) % 6);
                ctx.fillStyle = '#fff';
                for (let i = 0; i < bubbleCount; i++) {
                    const bxPos = (seed * (i + 1) * 23) % (bw - 10) + 5;
                    const byPos = (seed + i * 45) % bh;
                    ctx.globalAlpha = 0.15 + (i % 3) * 0.05;
                    ctx.beginPath();
                    ctx.arc(bx + bxPos, by + byPos, 1.2, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.globalAlpha = 1.0;

                // 3b. Main Decorations (Deterministic placement)
                const decoCount = 2 + (Math.floor(seed) % 3); // 2-4 decorations

                for (let j = 0; j < decoCount; j++) {
                    const dSeed = seed * (j + 3.7);
                    const rx = (dSeed * 79.1) % (bw - 24) + 12;
                    const ry = (dSeed * 113.3) % (bh - 40) + 20;
                    const type = Math.floor(dSeed * 4.9) % 3;

                    const bxPos = bx + rx;
                    const finalY = by + ry;

                    if (type === 0) {
                        // Barnacles (Cluster)
                        ctx.fillStyle = '#f0f9ff';
                        ctx.beginPath();
                        ctx.arc(bxPos, finalY, 3.5, 0, Math.PI * 2);
                        ctx.arc(bxPos + 4, finalY + 2.5, 2.5, 0, Math.PI * 2);
                        ctx.fill();
                    } else if (type === 1) {
                        // Starfish
                        ctx.fillStyle = '#ff7f50';
                        const size = 5 + (Math.floor(dSeed) % 4);
                        ctx.beginPath();
                        for (let k = 0; k < 5; k++) {
                            const ang = (k * 4 * Math.PI) / 5 - Math.PI / 2;
                            ctx.lineTo(bxPos + Math.cos(ang) * size, finalY + Math.sin(ang) * size);
                        }
                        ctx.closePath();
                        ctx.fill();
                    } else {
                        // Seaweed (Optimized & Wavy)
                        ctx.strokeStyle = '#bef264';
                        ctx.lineWidth = 1.6;
                        const weedH = 15 + (Math.floor(dSeed) % 12);
                        const wave = Math.sin(j + seed) * 5;
                        ctx.beginPath();
                        ctx.moveTo(bxPos, finalY);
                        ctx.quadraticCurveTo(bxPos + wave, finalY - weedH / 2, bxPos, finalY - weedH);
                        ctx.stroke();
                    }
                }

                // 3c. Jellyfish (Swimming)
                const jellyCount = Math.floor(seed) % 2; // 0-1 Jellyfish
                for (let k = 0; k < jellyCount; k++) {
                    const jSeed = seed * (k + 5.3);
                    const rx = (jSeed * 127) % (bw - 30) + 15;
                    const ryBase = (jSeed * 89) % (bh - 60) + 30;

                    // Swimming animation
                    const swimOffset = Math.sin(frames * 0.05 + k) * 5;
                    const jX = bx + rx;
                    const jY = by + ryBase + swimOffset;

                    ctx.save();
                    ctx.globalAlpha = 0.5;
                    ctx.fillStyle = '#e0f2fe'; // Light sky blue

                    // Bell/Dome
                    ctx.beginPath();
                    ctx.arc(jX, jY, 7, Math.PI, 0);
                    ctx.quadraticCurveTo(jX + 7, jY + 4, jX, jY + 2);
                    ctx.quadraticCurveTo(jX - 7, jY + 4, jX - 7, jY);
                    ctx.fill();

                    // Tentacles (Curling)
                    ctx.strokeStyle = '#bae6fd';
                    ctx.lineWidth = 1.2;
                    for (let t = -4; t <= 4; t += 4) {
                        ctx.beginPath();
                        ctx.moveTo(jX + t, jY + 2);
                        const curly = Math.sin(frames * 0.1 + t + k) * 3;
                        ctx.quadraticCurveTo(jX + t + curly, jY + 8, jX + t, jY + 14);
                        ctx.stroke();
                    }
                    ctx.restore();
                }
            } else {
                // Rim Detail - Gold/Brass ring
                ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
                ctx.fillRect(bx, by + bh / 2 - 2, bw, 4);
            }

            // 4. Wet Highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fillRect(bx + bw * 0.2, by, bw * 0.1, bh);

            // Edge Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(bx + bw - 5, by, 5, bh);

            ctx.restore(); // End Clip
        };

        drawPart(x, -5, w, top - rimHeight + 5, false);
        drawPart(x - rimOverhang, top - rimHeight, w + rimOverhang * 2, rimHeight, true);
        drawPart(x - rimOverhang, bot, w + rimOverhang * 2, rimHeight, true);
        drawPart(x, bot + rimHeight, w, CANVAS.HEIGHT - (bot + rimHeight) - CANVAS.GROUND_HEIGHT + 5, false);
    }

    private drawStarForgePipe(ctx: CanvasRenderingContext2D, p: Pipe, bot: number, frames: number): void {
        const bx = p.x; const bw = p.w; const top = p.top;
        const rimHeight = 28; const rimOverhang = 5;
        const t = p.animTimer || 0;

        const drawPart = (pbx: number, pby: number, pbw: number, pbh: number, isRim: boolean) => {
            const fall = (p.mechanic === 'falling' && p.passed) ? (t * t * 0.2) : 0;
            const close = (p.mechanic === 'clamping' && p.passed) ? Math.min(30, t * 1.5) : 0;
            const finalBY = pby + fall + (isRim ? (pbx < bx ? -close : close) : (pby < top ? close : -close));

            // Cosmic Void Base
            const grad = ctx.createLinearGradient(pbx, finalBY, pbx + pbw, finalBY);
            grad.addColorStop(0, '#020617'); grad.addColorStop(0.5, '#1e293b'); grad.addColorStop(1, '#020617');
            ctx.fillStyle = grad;
            ctx.beginPath();
            if (isRim) ctx.roundRect(pbx, finalBY, pbw, pbh, 4);
            else ctx.rect(pbx, finalBY, pbw, pbh);
            ctx.fill();

            // Decorations
            ctx.save(); ctx.beginPath();
            if (isRim) ctx.roundRect(pbx, finalBY, pbw, pbh, 4);
            else ctx.rect(pbx, finalBY, pbw, pbh);
            ctx.clip();

            if (!isRim) {
                const seed = Math.abs(top * 13.7);
                // Star Field
                const starCount = 3 + (Math.floor(seed) % 4);
                ctx.fillStyle = '#f8fafc';
                for (let i = 0; i < starCount; i++) {
                    const rX = (seed * (i + 1) * 17) % (pbw - 10) + 5;
                    const rY = (seed + i * 50) % pbh;
                    ctx.globalAlpha = 0.3 + Math.sin(frames * 0.05 + i) * 0.2;
                    ctx.beginPath(); ctx.arc(pbx + rX, finalBY + rY, 1, 0, Math.PI * 2); ctx.fill();
                }
                // Runes
                // Runes - Ancient/Tech Symbols
                ctx.globalAlpha = 0.8;
                ctx.strokeStyle = '#06b6d4';
                ctx.lineWidth = 1.5;

                // Draw runes at regular intervals
                for (let y = 40; y < pbh - 40; y += 80) {
                    const runeSeed = seed + y;
                    const cx = pbx + pbw / 2;
                    const cy = finalBY + y;
                    const runeType = Math.floor(runeSeed * 7) % 6;

                    // Glow effect
                    ctx.shadowColor = '#06b6d4';
                    ctx.shadowBlur = 5 + Math.sin(frames * 0.1 + y) * 3;

                    ctx.beginPath();
                    if (runeType === 0) {
                        // Vertical line with dot
                        ctx.moveTo(cx, cy - 12); ctx.lineTo(cx, cy + 12);
                        ctx.moveTo(cx - 8, cy); ctx.lineTo(cx + 8, cy);
                    } else if (runeType === 1) {
                        // Diamond
                        ctx.moveTo(cx, cy - 8); ctx.lineTo(cx + 8, cy);
                        ctx.lineTo(cx, cy + 8); ctx.lineTo(cx - 8, cy); ctx.closePath();
                    } else if (runeType === 2) {
                        // Arrow
                        ctx.moveTo(cx - 6, cy - 6); ctx.lineTo(cx + 6, cy); ctx.lineTo(cx - 6, cy + 6);
                    } else if (runeType === 3) {
                        // Circle cross
                        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
                        ctx.moveTo(cx - 4, cy); ctx.lineTo(cx + 4, cy);
                        ctx.moveTo(cx, cy - 4); ctx.lineTo(cx, cy + 4);
                    } else if (runeType === 4) {
                        // Double Chevron
                        ctx.moveTo(cx - 6, cy - 6); ctx.lineTo(cx, cy); ctx.lineTo(cx + 6, cy - 6);
                        ctx.moveTo(cx - 6, cy); ctx.lineTo(cx, cy + 6); ctx.lineTo(cx + 6, cy);
                    } else {
                        // Alien F
                        ctx.moveTo(cx + 4, cy - 8); ctx.lineTo(cx - 4, cy - 8); ctx.lineTo(cx - 4, cy + 8);
                        ctx.moveTo(cx - 4, cy); ctx.lineTo(cx + 2, cy);
                    }
                    ctx.stroke();
                    ctx.shadowBlur = 0; // Reset shadow
                }

                // Connecting Lines
                ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                for (let y = 40; y < pbh - 40; y += 80) {
                    ctx.moveTo(pbx + 15, finalBY + y);
                    ctx.lineTo(pbx + pbw - 15, finalBY + y + 20);
                }
                ctx.stroke();
            } else {
                ctx.fillStyle = 'rgba(6, 182, 212, 0.4)';
                ctx.fillRect(pbx, finalBY + pbh / 2 - 1, pbw, 2);
            }
            ctx.restore();
        };

        drawPart(bx, -5, bw, top - rimHeight + 5, false);
        drawPart(bx - rimOverhang, top - rimHeight, bw + rimOverhang * 2, rimHeight, true);
        drawPart(bx - rimOverhang, bot, bw + rimOverhang * 2, rimHeight, true);
        drawPart(bx, bot + rimHeight, bw, CANVAS.HEIGHT - (bot + rimHeight) - CANVAS.GROUND_HEIGHT + 5, false);
    }

    private drawNeonStylePipe(ctx: CanvasRenderingContext2D, p: Pipe, bot: number, frames: number): void {
        const rimHeight = 28;
        const rimOverhang = 5;
        const bx = p.x;
        const bw = p.w;
        const top = p.top;

        const mech = p.mechanic || 'none';
        const t = p.animTimer || 0;

        const drawPart = (bx: number, by: number, bw: number, bh: number, isRim: boolean, isTop: boolean) => {
            // Logic cho Mechanic
            let fall = 0;
            let close = 0;
            if (isTop && mech === 'falling') fall = 0.5 * 0.8 * t * t;
            if (mech === 'clamping') close = Math.min(60, t * 1.5);

            const finalBY = isTop ? by + fall + close : by - close;
            if (bh <= 0) return;

            const seed = Math.abs(top * 17.3);
            let rewardColor = '#fbbf24';
            if (this.currentScore >= 100) rewardColor = '#f43f5e';
            else if (this.currentScore >= 50) rewardColor = '#a855f7';
            let accent = p.passed ? rewardColor : this.pipeColor;

            ctx.save();

            // RENDER DATA-DRIVEN
            if (p.passed && mech === 'pixelate') {
                const diss = Math.min(1, t * 0.02);
                if (diss >= 1) { ctx.restore(); return; }
                const gridSize = 10;
                ctx.globalAlpha = 1 - diss;
                for (let r = 0; r < Math.ceil(bh / gridSize); r++) {
                    for (let c = 0; c < Math.ceil(bw / gridSize); c++) {
                        const pSeed = (r * 0.5 + c * 0.8 + seed) % 1;
                        if (pSeed < diss * 0.4) continue;
                        const px = bx + c * gridSize + (pSeed - 0.5) * 120 * diss;
                        const py = finalBY + r * gridSize + (Math.sin(pSeed * 12) - 0.5) * 120 * diss;
                        ctx.fillStyle = (c === Math.floor(bw / gridSize / 2)) ? '#ffffff' : accent;
                        ctx.fillRect(px, py, gridSize - 1, gridSize - 1);
                    }
                }
            }
            else if (p.passed && mech === 'hologram') {
                ctx.globalAlpha = 0.4 + Math.random() * 0.2;
                ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 1;
                for (let sy = 0; sy < bh; sy += 4) {
                    if (Math.random() > 0.1) {
                        ctx.beginPath(); ctx.moveTo(bx, finalBY + sy); ctx.lineTo(bx + bw, finalBY + sy); ctx.stroke();
                    }
                }
                ctx.strokeRect(bx + Math.sin(frames * 0.2) * 5, finalBY, bw, bh);
            }
            else if (p.passed && mech === 'wireframe') {
                ctx.strokeStyle = accent; ctx.lineWidth = 2; ctx.strokeRect(bx, finalBY, bw, bh);
                ctx.beginPath(); ctx.moveTo(bx, finalBY); ctx.lineTo(bx + bw, finalBY + bh);
                ctx.moveTo(bx + bw, finalBY); ctx.lineTo(bx, finalBY + bh); ctx.stroke();
            }
            else if (p.passed && mech === 'binary') {
                ctx.fillStyle = accent; ctx.font = '10px monospace';
                for (let r = 0; r < bh / 12; r++) {
                    for (let c = 0; c < bw / 10; c++) {
                        const char = (Math.sin(frames * 0.1 + r * 0.5 + c) > 0) ? '1' : '0';
                        const py = finalBY + ((r * 12 + frames * 2) % bh);
                        ctx.globalAlpha = (py / (finalBY + bh)) * 0.5;
                        ctx.fillText(char, bx + c * 10, py);
                    }
                }
            }
            else {
                let glitchA = 1.0;
                if (mech === 'glitch' && p.passed && Math.sin(frames * 0.5 + seed) > 0.3) {
                    glitchA = 0.2; accent = '#334155';
                }
                const grad = ctx.createLinearGradient(bx, finalBY, bx + bw, finalBY);
                grad.addColorStop(0, '#020617'); grad.addColorStop(0.5, '#1e293b'); grad.addColorStop(1, '#020617');
                ctx.fillStyle = grad; ctx.beginPath();
                if (isRim && ctx.roundRect) ctx.roundRect(bx, finalBY, bw, bh, 4);
                else ctx.rect(bx, finalBY, bw, bh);
                ctx.fill();
                ctx.clip();
                ctx.strokeStyle = accent; ctx.globalAlpha = 0.2 * glitchA;
                ctx.strokeRect(bx + 2, finalBY + 2, bw - 4, bh - 4);
                if (!isRim) {
                    for (let ry = finalBY + 20; ry < finalBY + bh - 20; ry += 64) {
                        const pulse = (0.4 + (Math.sin(frames * 0.04 + ry * 0.1 + seed) + 1) * 0.25) * glitchA;
                        ctx.globalAlpha = pulse * 0.6;
                        ctx.fillStyle = accent; ctx.fillRect(bx, ry - 1, bw, 4);
                        ctx.fillStyle = '#ffffff'; ctx.fillRect(bx, ry + 0.5, bw, 1.5);
                    }
                } else {
                    const pulse = (0.55 + (Math.sin(frames * 0.06 + seed) + 1) * 0.25) * glitchA;
                    ctx.globalAlpha = pulse * 0.7; ctx.fillStyle = accent;
                    ctx.fillRect(bx, finalBY + (bh * 0.5) - 3, bw, 6);
                }
            }

            if (p.passed && mech.startsWith('laser_') && !isRim && isTop) {
                ctx.restore(); ctx.save();

                // Firing Flash Effect (Initial burst when laser ignites)
                const ignitionDuration = 15;
                const flash = Math.max(0, (ignitionDuration - t) / ignitionDuration);

                const drawSingleBeam = (xOffset: number, widthBase: number, color: string, isMega: boolean = false) => {
                    ctx.save();
                    ctx.strokeStyle = color;
                    ctx.shadowBlur = (isMega ? 40 : 20) + (flash * 50);
                    ctx.shadowColor = color;

                    // Slow, steady pulse (Steady Hum) instead of fast flicker
                    const pulse = Math.sin(frames * 0.05) * (isMega ? 5 : 2);
                    const flashWidth = flash * (isMega ? 40 : 15);

                    ctx.lineWidth = widthBase + pulse + flashWidth;
                    ctx.beginPath();
                    ctx.moveTo(bx + bw / 2 + xOffset, finalBY + bh);
                    ctx.lineTo(bx + bw / 2 + xOffset, bot);
                    ctx.stroke();

                    // Corona Glow
                    ctx.globalAlpha = 0.3 + (flash * 0.5);
                    ctx.lineWidth = ctx.lineWidth * (isMega ? 1.5 : 2.0);
                    ctx.stroke();

                    // White Core
                    ctx.globalAlpha = 1.0;
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = (isMega ? 8 : 4) + (flash * 10);
                    ctx.stroke();
                    ctx.restore();
                };

                // Color Selection (Data-Driven by Suffix)
                let lColor = '#60a5fa'; // Default Blue
                if (mech.includes('_red')) lColor = '#f43f5e';
                else if (mech.includes('_green')) lColor = '#10b981';
                else if (mech.includes('_purple')) lColor = '#a855f7';
                else if (mech.includes('_rainbow') || mech.endsWith('_mega') || mech.endsWith('_dual')) {
                    // If it just says '_mega' or '_dual' without color, or is rainbow
                    lColor = `hsl(${(frames * 5 + seed * 100) % 360}, 100%, 65%)`;
                }

                // Drawing Logic (Data-Driven by Type)
                if (mech.includes('_dual')) {
                    drawSingleBeam(-15, 8, lColor);
                    drawSingleBeam(15, 8, lColor);
                } else if (mech.includes('_mega')) {
                    drawSingleBeam(0, 40, lColor, true);
                    ctx.globalAlpha = 0.2 + (flash * 0.6);
                    ctx.fillStyle = '#fff';
                    ctx.fillRect(bx + bw / 2 - 80, bot - 5, 160, 10);
                } else {
                    drawSingleBeam(0, 12, lColor);
                }
            }
            ctx.restore();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'; ctx.fillRect(bx + 4, finalBY, 4, bh);
        };

        // Render
        drawPart(bx, - 5, bw, top - rimHeight + 5, false, true);
        drawPart(bx - rimOverhang, top - rimHeight, bw + rimOverhang * 2, rimHeight, true, true);
        drawPart(bx - rimOverhang, bot, bw + rimOverhang * 2, rimHeight, true, false);
        drawPart(bx, bot + rimHeight, bw, CANVAS.HEIGHT - (bot + rimHeight) - CANVAS.GROUND_HEIGHT + 5, false, false);
    }

    private draw3DPipe(ctx: CanvasRenderingContext2D, p: Pipe, bot: number): void {
        const bx = p.x; const bw = p.w; const top = p.top;
        const t = p.animTimer || 0;

        const drawCyl = (pbx: number, pby: number, pbw: number, pbh: number, isRim: boolean) => {
            const fall = (p.mechanic === 'falling' && p.passed) ? (t * t * 0.2) : 0;
            const close = (p.mechanic === 'clamping' && p.passed) ? Math.min(30, t * 1.5) : 0;
            const finalBY = pby + fall + (isRim ? (pbx < bx ? -close : close) : (pby < top ? close : -close));

            const grad = ctx.createLinearGradient(pbx, finalBY, pbx + pbw, finalBY);
            grad.addColorStop(0, '#000'); grad.addColorStop(0.15, this.pipeColor);
            grad.addColorStop(0.4, this.pipeColor); grad.addColorStop(0.85, this.pipeColor); grad.addColorStop(1.0, '#000');
            ctx.fillStyle = grad; ctx.fillRect(pbx, finalBY, pbw, pbh);
        };
        const rim = 25; const over = 6;
        drawCyl(bx, 0, bw, top - rim, false);
        drawCyl(bx - over, top - rim, bw + over * 2, rim, true);
        drawCyl(bx - over, bot, bw + over * 2, rim, true);
        drawCyl(bx, bot + rim, bw, CANVAS.HEIGHT - (bot + rim) - CANVAS.GROUND_HEIGHT, false);
    }

    private drawMagmaPipe(ctx: CanvasRenderingContext2D, p: Pipe, bot: number, frames: number): void {
        const bx = p.x; const bw = p.w; const top = p.top;
        const rimHeight = 28; const rimOverhang = 5;
        const mech = p.mechanic; const t = p.animTimer || 0;

        const drawPart = (pbx: number, pby: number, pbw: number, pbh: number, isRim: boolean, isTop: boolean) => {
            // Shared Logic: Falling and Clamping
            const fall = (p.mechanic === 'falling' && p.passed) ? (t * t * 0.2) : 0;
            const close = (p.mechanic === 'clamping' && p.passed) ? Math.min(30, t * 1.5) : 0;

            const finalBY = pby + fall + (isRim ? (pbx < bx ? -close : close) : (pby < top ? close : -close));
            const finalBH = pbh;

            // Effect: Pixelate (Stone Fragment version)
            if (p.passed && mech === 'pixelate') {
                const diss = Math.min(1, t * 0.02);
                if (diss >= 1) return;
                const gridSize = 10;
                ctx.save();
                ctx.globalAlpha = 1 - diss;
                for (let r = 0; r < Math.ceil(pbh / gridSize); r++) {
                    for (let c = 0; c < Math.ceil(pbw / gridSize); c++) {
                        const pSeed = (r * 0.5 + c * 0.8 + Math.abs(top)) % 1;
                        if (pSeed < diss * 0.4) continue;
                        const fx = pbx + c * gridSize + (pSeed - 0.5) * 80 * diss;
                        const fy = finalBY + r * gridSize + (Math.sin(pSeed * 12) - 0.5) * 80 * diss;
                        ctx.fillStyle = (pSeed > 0.8) ? '#f97316' : '#292524';
                        ctx.fillRect(fx, fy, gridSize - 1, gridSize - 1);
                    }
                }
                ctx.restore();
                return;
            }

            // Effect: Burning (Rực cháy & Bốc khói)
            if (p.passed && mech === 'burning') {
                const burn = Math.min(1, t * 0.015);
                ctx.shadowBlur = 15 + burn * 30;
                ctx.shadowColor = '#ff4500';
                if (t % 10 < 5) { // Nhấp nháy lửa
                    ctx.fillStyle = '#ff6600';
                }
            }

            // Normal Magma Render
            const grad = ctx.createLinearGradient(pbx, finalBY, pbx + pbw, finalBY);
            grad.addColorStop(0, '#1a0500'); grad.addColorStop(0.3, '#3a1005'); grad.addColorStop(1, '#0f0505');
            ctx.fillStyle = grad;
            ctx.beginPath();
            if (isRim) {
                ctx.roundRect(pbx, finalBY, pbw, finalBH, 4);
            } else {
                ctx.rect(pbx, finalBY, pbw, pbh);
            }
            ctx.fill();

            // Volcano Decorations: Rock Texture & Cracks (Always visible)
            if (!isRim) {
                ctx.save();
                // Rock Texture
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                for (let i = 0; i < pbh; i += 20) {
                    if ((i * 1.7 + Math.abs(top)) % 3 < 1) {
                        const rx = pbx + (Math.sin(i * 0.1) * 0.5 + 0.5) * (pbw - 4);
                        ctx.fillRect(rx, finalBY + i, 4, 4);
                    }
                }

                // Cracks (Static)
                ctx.strokeStyle = '#441c11';
                ctx.lineWidth = 2;
                ctx.beginPath();
                for (let y = 30; y < pbh - 30; y += 75) {
                    const cx = pbx + pbw / 2;
                    const cy = finalBY + y;
                    if ((y + Math.abs(top)) % 50 > 25) {
                        ctx.moveTo(cx - 15, cy - 5);
                        ctx.lineTo(cx, cy + 5);
                        ctx.lineTo(cx + 15, cy - 2);
                    }
                }
                ctx.stroke();
                ctx.restore();
            }

            // Effect: Cracking (Nứt vỡ dữ dội)
            const crackShake = (mech === 'cracking' && p.passed) ? Math.sin(t * 0.5) * 3 : 0;

            // Volcano Decorations: Glowing Chevron Pattern
            if (!isRim) {
                ctx.save();

                // Chevron Pattern
                // Use frames for subtle pulsation if burning mechanic
                const pulse = (mech === 'burning') ? Math.sin(frames * 0.1) * 5 : 0;

                ctx.strokeStyle = '#ff6600';
                ctx.shadowColor = '#ff4500';
                ctx.shadowBlur = 10 + pulse;
                ctx.lineWidth = 3;

                const spacing = 40;
                const offset = (Math.abs(top) * 5) % spacing;

                ctx.beginPath();
                for (let y = offset; y < pbh; y += spacing) {
                    if (y < 10 || y > pbh - 10) continue;

                    // Apply crackShake to x-coordinates
                    const cx = pbx + pbw / 2 + crackShake;
                    const cy = finalBY + y;
                    const size = 15;

                    // Chevron pointing down
                    ctx.moveTo(cx - size, cy - size / 2);
                    ctx.lineTo(cx, cy + size / 2);
                    ctx.lineTo(cx + size, cy - size / 2);

                    // Vertical sidebar lines 
                    ctx.moveTo(pbx + 8 + crackShake, cy - size);
                    ctx.lineTo(pbx + 8 + crackShake, cy + size);
                }
                ctx.stroke();

                // Inner glow heat
                ctx.strokeStyle = '#ffcc00';
                ctx.lineWidth = 1;
                ctx.shadowBlur = 5;
                ctx.beginPath();
                for (let y = offset; y < pbh; y += spacing) {
                    if (y < 10 || y > pbh - 10) continue;
                    const cx = pbx + pbw / 2 + crackShake;
                    const cy = finalBY + y;
                    const size = 15;

                    ctx.moveTo(cx - size, cy - size / 2);
                    ctx.lineTo(cx, cy + size / 2);
                    ctx.lineTo(cx + size, cy - size / 2);
                }
                ctx.stroke();

                // Lava Spray Particles (Restored)
                if (mech === 'lava_spray' && p.passed && t < 100) {
                    ctx.fillStyle = '#ff4500';
                    const pSeed = Math.abs(top) * 10;
                    for (let i = 0; i < 5; i++) {
                        const px = pbx + pbw / 2 + Math.sin(t * 0.1 + i + pSeed) * 20;
                        const py = finalBY + (isTop ? pbh : 0) + (isTop ? -t : t) * 2;
                        ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fill();
                    }
                }

                ctx.restore();
            } else {
                // Rim Highlight with Shake
                ctx.fillStyle = '#ff4500';
                ctx.fillRect(pbx + 4 + crackShake, finalBY + 10, pbw - 8, 4);
            }
        };

        drawPart(bx, -5, bw, top - rimHeight + 5, false, true);
        drawPart(bx - rimOverhang, top - rimHeight, bw + rimOverhang * 2, rimHeight, true, true);
        drawPart(bx - rimOverhang, bot, bw + rimOverhang * 2, rimHeight, true, false);
        drawPart(bx, bot + rimHeight, bw, CANVAS.HEIGHT - (bot + rimHeight) - CANVAS.GROUND_HEIGHT + 5, false, false);
    }

    private drawMossyPipe(ctx: CanvasRenderingContext2D, p: Pipe, bot: number): void {
        const bx = p.x; const bw = p.w; const top = p.top;
        const rimHeight = 24; const rimOverhang = 4;
        const t = p.animTimer || 0;
        const seed = Math.abs(top);

        const drawPart = (pbx: number, pby: number, pbw: number, pbh: number, isRim: boolean) => {
            const fall = (p.mechanic === 'falling' && p.passed) ? (t * t * 0.2) : 0;
            const close = (p.mechanic === 'clamping' && p.passed) ? Math.min(30, t * 1.5) : 0;
            const finalBY = pby + fall + (isRim ? (pbx < bx ? -close : close) : (pby < top ? close : -close));

            // Ancient Stone Base
            const grad = ctx.createLinearGradient(pbx, finalBY, pbx + pbw, finalBY);
            grad.addColorStop(0, '#1c1917'); grad.addColorStop(0.3, '#292524'); grad.addColorStop(1, '#0c0a09');
            ctx.fillStyle = grad;
            ctx.beginPath();
            if (isRim) ctx.roundRect(pbx, finalBY, pbw, pbh, 3);
            else ctx.rect(pbx, finalBY, pbw, pbh);
            ctx.fill();

            if (!isRim) {
                // Weathered Cracks
                ctx.strokeStyle = '#44403c'; ctx.lineWidth = 1; ctx.beginPath();
                for (let y = 30; y < pbh - 30; y += 50) {
                    if ((y + seed) % 80 < 20) {
                        ctx.moveTo(pbx + 10, finalBY + y); ctx.lineTo(pbx + pbw * 0.4, finalBY + y + 10);
                    }
                }
                ctx.stroke();

                // Moss Patches
                ctx.fillStyle = '#65a30d';
                for (let y = 20; y < pbh - 20; y += 40) {
                    if (Math.sin(y * 0.1 + seed) > 0.3) {
                        ctx.beginPath(); ctx.arc(pbx + (pbw / 2), finalBY + y, 5, 0, Math.PI * 2); ctx.fill();
                    }
                }
            } else {
                ctx.fillStyle = '#4d7c0f';
                ctx.beginPath(); ctx.arc(pbx + 10, finalBY + 5, 5, 0, Math.PI * 2); ctx.fill();
            }
        };

        drawPart(bx, -5, bw, top - rimHeight + 5, false);
        drawPart(bx - rimOverhang, top - rimHeight, bw + rimOverhang * 2, rimHeight, true);
        drawPart(bx - rimOverhang, bot, bw + rimOverhang * 2, rimHeight, true);
        drawPart(bx, bot + rimHeight, bw, CANVAS.HEIGHT - (bot + rimHeight) - CANVAS.GROUND_HEIGHT + 5, false);
    }
}
