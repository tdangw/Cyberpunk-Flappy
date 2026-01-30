import type { Pipe, Coin, GameConfig } from '../types';
import { CANVAS, COLORS } from '../config/constants';

/**
 * Manages pipe generation and movement
 * Optimized with dynamic patterns (Stairs, Twins, Desert)
 */
export class PipeManager {
    private pipes: Pipe[] = [];
    private coins: Coin[] = [];
    private config: GameConfig;
    private pipeStyle: string = 'cyber';
    private pipeColor: string = COLORS.NEON_PINK;

    // Generation State
    private currentPipeInterval: number = 400;
    private patternType: 'none' | 'stairs_up' | 'stairs_down' | 'twins' | 'desert' = 'none';
    private patternRemaining: number = 0;
    private lastPipeTop: number = 300;
    private lastPipeGap: number = 250;

    constructor(config: GameConfig) {
        this.config = config;
        this.setNextPipeInterval();
    }

    setConfig(config: GameConfig): void {
        this.config = config;
        this.setNextPipeInterval();
    }

    update(speed: number, dtRatio: number, spawnCoins: boolean = true): void {
        this.pipes.forEach((p) => (p.x -= speed * dtRatio));
        if (this.pipes.length && this.pipes[0].x + this.pipes[0].w < -100) {
            this.pipes.shift();
        }

        const lastPipe = this.pipes[this.pipes.length - 1];

        // Check if it's time to spawn a new pipe
        if (!lastPipe || CANVAS.WIDTH - lastPipe.x >= this.currentPipeInterval) {
            this.createPipe(spawnCoins);
            this.setNextPipeInterval();
        }

        this.coins.forEach((c) => {
            c.x -= speed * dtRatio;
            c.wobble += 0.03 * dtRatio;
            this.pipes.forEach(p => {
                const horizontalOverlap = c.x + c.r > p.x - 5 && c.x - c.r < p.x + p.w + 5;
                if (horizontalOverlap) {
                    const inGap = c.y - c.r > p.top + 5 && c.y + c.r < p.top + this.config.pipeGap - 5;
                    if (!inGap) c.collected = true;
                }
            });
        });

        // Random floating coins
        if (spawnCoins && Math.random() < 0.005 * dtRatio) this.spawnSafeRandomCoin();

        this.coins = this.coins.filter((c) => c.x + c.r > 0 && !c.collected);
    }

    private createPipe(spawnCoins: boolean): void {
        const groundH = CANVAS.GROUND_HEIGHT;
        const configGap = this.config.pipeGap;
        const gapVariance = (Math.random() - 0.5) * 20;
        const gap = configGap + gapVariance;
        const padding = 80;
        const minY = padding;
        const maxY = CANVAS.HEIGHT - groundH - gap - padding;

        let topH: number;

        // Pattern Height Logic
        // If we are IN a pattern sequence, calculate based on last pipe
        if (this.patternType === 'stairs_up' && this.patternRemaining > 0) {
            topH = Math.max(minY, this.lastPipeTop - 100);
        } else if (this.patternType === 'stairs_down' && this.patternRemaining > 0) {
            topH = Math.min(maxY, this.lastPipeTop + 100);
        } else if (this.patternType === 'twins' && this.patternRemaining > 0) {
            topH = this.lastPipeTop; // Contiguous wall at same height
        } else {
            // Normal Random or start of a pattern
            topH = Math.random() * (maxY - minY) + minY;

            // Safety: if starting fresh after a pattern, don't jump too far too fast
            if (this.patternRemaining === 0 && Math.abs(topH - this.lastPipeTop) > 300) {
                topH = this.lastPipeTop + (topH > this.lastPipeTop ? 150 : -150);
            }
        }

        this.lastPipeTop = topH;

        const pipe: Pipe = {
            x: CANVAS.WIDTH + 100,
            top: topH,
            w: 80,
            passed: false,
            seed: Math.floor(Math.random() * 1000)
        };
        this.pipes.push(pipe);

        if (this.patternRemaining > 0) this.patternRemaining--;

        if (spawnCoins && Math.random() > 0.4) {
            const coinX = pipe.x + 40;
            const coinY = topH + gap / 2;
            if (this.isPositionSafe(coinX, coinY, 15)) {
                this.coins.push({ x: coinX, y: coinY, r: 15, collected: false, wobble: Math.random() * Math.PI });
            }
        }
    }

    private isPositionSafe(x: number, y: number, r: number): boolean {
        // Check against pipes
        const pipeOverlap = this.pipes.some(p => {
            const horizontalProximity = x + r > p.x - 20 && x - r < p.x + p.w + 20;
            if (!horizontalProximity) return false;
            // Inside horizontal range, check vertical gap
            const gapTop = p.top;
            const gapBottom = p.top + this.config.pipeGap;
            return y - r < gapTop + 10 || y + r > gapBottom - 10;
        });
        if (pipeOverlap) return false;

        // Check against existing coins
        const coinOverlap = this.coins.some(c => {
            const dx = c.x - x;
            const dy = c.y - y;
            return Math.sqrt(dx * dx + dy * dy) < (c.r + r + 20);
        });
        return !coinOverlap;
    }

    private spawnSafeRandomCoin(): void {
        // Try spawning between pipes (midpoint logic)
        let x = CANVAS.WIDTH + 150;
        const lastPipe = this.pipes[this.pipes.length - 1];
        if (lastPipe) {
            // Spawn after last pipe
            x = lastPipe.x + this.currentPipeInterval / 2;
        }

        const minY = 150;
        const maxY = CANVAS.HEIGHT - CANVAS.GROUND_HEIGHT - 150;
        const y = Math.random() * (maxY - minY) + minY;

        if (this.isPositionSafe(x, y, 15)) {
            this.coins.push({ x, y, r: 15, collected: false, wobble: Math.random() * Math.PI });
        }
    }

    setColors(color: string): void { this.pipeColor = color; }
    setStyle(style: string): void { this.pipeStyle = style; }

    private setNextPipeInterval(): void {
        const baseSpacing = this.config.pipeSpacing || 350;

        // 1. Check if we are currently mid-sequence
        if (this.patternRemaining > 0) {
            // Contiguous sequence: pipes touch each other
            if (['stairs_up', 'stairs_down', 'twins'].includes(this.patternType)) {
                this.currentPipeInterval = 80; // Pipe width (contiguous)
                return;
            }
        }

        // 2. Check if a pattern just finished
        if (this.patternType !== 'none') {
            const prevType = this.patternType;
            this.patternType = 'none';
            this.patternRemaining = 0;

            // Give extra space for player to recover after a dense wall/stairs
            if (prevType !== 'desert') {
                this.currentPipeInterval = baseSpacing + 250;
                return;
            }
        }

        // 3. Roll for a NEW pattern or normal spacing
        const rand = Math.random();

        if (rand < 0.15) {
            // STAIRS UP
            this.patternType = 'stairs_up';
            this.patternRemaining = 2 + Math.floor(Math.random() * 3); // 2-4 more pipes
            this.currentPipeInterval = baseSpacing;
        } else if (rand < 0.30) {
            // STAIRS DOWN
            this.patternType = 'stairs_down';
            this.patternRemaining = 2 + Math.floor(Math.random() * 3);
            this.currentPipeInterval = baseSpacing;
        } else if (rand < 0.40) {
            // CONTIGUOUS WALL (Twins/Triples/Quads)
            this.patternType = 'twins';
            this.patternRemaining = 1 + Math.floor(Math.random() * 4); // 2-5 pipes total
            this.currentPipeInterval = baseSpacing;
        } else if (rand < 0.45) {
            // DESERT (Long gap)
            this.patternType = 'desert';
            this.currentPipeInterval = 1600 + Math.random() * 1000;
        } else {
            // Normal rhythmic behavior
            const variance = 150;
            const randomDist = baseSpacing + (Math.random() - 0.5) * variance;
            this.currentPipeInterval = Math.max(350, randomDist);
        }
    }

    getPipes(): Pipe[] { return this.pipes; }
    getCoins(): Coin[] { return this.coins; }
    reset(): void { this.pipes = []; this.coins = []; }

    clearNearPipes(birdX: number): void {
        this.pipes = this.pipes.filter(p => p.x < birdX - 50 || p.x > birdX + 400);
        this.coins = this.coins.filter(c => c.x < birdX - 50 || c.x > birdX + 400);
    }

    render(ctx: CanvasRenderingContext2D): void {
        this.pipes.forEach((p) => this.drawPipe(ctx, p));
        this.coins.forEach((c) => {
            if (c.collected) return;
            const spin = Math.cos(c.wobble);
            const absScale = Math.abs(spin);
            ctx.save();
            ctx.translate(c.x, c.y);
            ctx.shadowBlur = 20; ctx.shadowColor = COLORS.NEON_GOLD;
            ctx.fillStyle = COLORS.NEON_GOLD;
            ctx.beginPath(); ctx.ellipse(0, 0, c.r * absScale, c.r, 0, 0, Math.PI * 2); ctx.fill();
            if (absScale > 0.4) {
                ctx.fillStyle = '#000'; ctx.font = `bold ${Math.floor(c.r * 1.2)}px Arial`;
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.save(); ctx.scale(absScale, 1); ctx.fillText('$', 0, 1); ctx.restore();
            }
            ctx.restore();
        });
    }

    private drawPipe(ctx: CanvasRenderingContext2D, p: Pipe): void {
        const gap = this.config.pipeGap;
        const botY = p.top + gap;

        ctx.save();
        ctx.fillStyle = '#050010';
        ctx.strokeStyle = this.pipeColor;
        ctx.lineWidth = 4;
        ctx.shadowBlur = 15; ctx.shadowColor = this.pipeColor;

        const drawBody = () => {
            ctx.strokeRect(p.x, 0, p.w, p.top);
            ctx.fillRect(p.x, 0, p.w, p.top);
            ctx.strokeRect(p.x, botY, p.w, CANVAS.HEIGHT - botY);
            ctx.fillRect(p.x, botY, p.w, CANVAS.HEIGHT - botY);
        };

        if (this.pipeStyle === '3d_neon') {
            this.draw3DPipe(ctx, p.x, p.w, p.top, botY);
            ctx.restore();
            return;
        }

        if (this.pipeStyle === 'classic') {
            this.drawClassicPipe(ctx, p.x, p.w, p.top, botY);
            ctx.restore();
            return;
        }

        if (this.pipeStyle === 'coral') {
            this.drawOrganicBody(ctx, p.x, p.w, p.top, botY);
        } else {
            drawBody();
        }

        ctx.globalAlpha = 0.15;
        ctx.fillStyle = this.pipeColor;
        ctx.fillRect(p.x, 0, p.w, p.top);
        ctx.fillRect(p.x, botY, p.w, CANVAS.HEIGHT - botY);
        ctx.globalAlpha = 1.0;

        ctx.shadowBlur = 0;
        ctx.strokeStyle = this.pipeColor;

        switch (this.pipeStyle) {
            case 'cyber':
            case 'neon':
            case 'glitch':
            case 'plasma':
                ctx.fillStyle = this.pipeColor;
                ctx.globalAlpha = 0.1;
                ctx.fillRect(p.x + 5, 0, p.w - 10, p.top);
                ctx.fillRect(p.x + 5, botY, p.w - 10, CANVAS.HEIGHT - botY);
                ctx.globalAlpha = 0.5;
                ctx.beginPath();
                for (let y = 20; y < p.top; y += 40) { ctx.moveTo(p.x, y); ctx.lineTo(p.x + p.w, y); }
                for (let y = botY + 20; y < CANVAS.HEIGHT; y += 40) { ctx.moveTo(p.x, y); ctx.lineTo(p.x + p.w, y); }
                ctx.stroke();
                ctx.globalAlpha = 1;
                ctx.strokeRect(p.x, 0, p.w, p.top);
                ctx.strokeRect(p.x, botY, p.w, CANVAS.HEIGHT - botY);
                break;
            case 'bamboo':
                ctx.fillStyle = this.pipeColor;
                ctx.fillRect(p.x, 0, p.w, p.top);
                ctx.fillRect(p.x, botY, p.w, CANVAS.HEIGHT - botY);
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                for (let y = 40; y < p.top; y += 80) ctx.fillRect(p.x - 2, y, p.w + 4, 6);
                for (let y = botY + 40; y < CANVAS.HEIGHT; y += 80) ctx.fillRect(p.x - 2, y, p.w + 4, 6);
                break;
            case 'rusty':
            case 'stone':
            case 'lava':
            case 'magma':
                ctx.fillStyle = this.pipeColor;
                ctx.fillRect(p.x, 0, p.w, p.top);
                ctx.fillRect(p.x, botY, p.w, CANVAS.HEIGHT - botY);
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                for (let y = 20; y < p.top; y += 50) { ctx.beginPath(); ctx.arc(p.x + 10, y, 5, 0, Math.PI * 2); ctx.fill(); }
                for (let y = botY + 20; y < CANVAS.HEIGHT; y += 50) { ctx.beginPath(); ctx.arc(p.x + p.w - 15, y + 10, 8, 0, Math.PI * 2); ctx.fill(); }
                break;
            case 'golden':
            case 'crystal':
            case 'ice':
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.fillRect(p.x, 0, p.w, p.top);
                ctx.fillRect(p.x, botY, p.w, CANVAS.HEIGHT - botY);
                ctx.strokeStyle = '#fff';
                ctx.strokeRect(p.x, 0, p.w, p.top);
                ctx.strokeRect(p.x, botY, p.w, CANVAS.HEIGHT - botY);
                break;
            case 'laser':
                ctx.strokeStyle = this.pipeColor; ctx.lineWidth = 3;
                ctx.globalAlpha = 0.9;
                ctx.beginPath(); ctx.moveTo(p.x + p.w / 2, 0); ctx.lineTo(p.x + p.w / 2, p.top); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(p.x + p.w / 2, botY); ctx.lineTo(p.x + p.w / 2, CANVAS.HEIGHT); ctx.stroke();
                ctx.shadowColor = this.pipeColor; ctx.shadowBlur = 20;
                break;
        }

        ctx.restore();
    }

    private drawClassicPipe(ctx: CanvasRenderingContext2D, x: number, w: number, top: number, botY: number): void {
        const rimHeight = 26;
        const rimOverhang = 4;
        const borderW = 2;
        const borderColor = '#2f441a';

        ctx.shadowBlur = 0;
        ctx.lineWidth = borderW;
        ctx.strokeStyle = borderColor;

        const drawPart = (bx: number, by: number, bw: number, bh: number) => {
            const grad = ctx.createLinearGradient(bx, by, bx + bw, by);
            grad.addColorStop(0, '#4a8522');
            grad.addColorStop(0.1, '#65a830');
            grad.addColorStop(0.4, '#b4e05b');
            grad.addColorStop(0.6, '#98d146');
            grad.addColorStop(0.9, '#65a830');
            grad.addColorStop(1, '#3b6916');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.rect(bx, by, bw, bh);
            ctx.fill();
            ctx.stroke();
        };

        drawPart(x, -5, w, top - rimHeight + 5);
        drawPart(x - rimOverhang, top - rimHeight, w + rimOverhang * 2, rimHeight);
        drawPart(x - rimOverhang, botY, w + rimOverhang * 2, rimHeight);
        drawPart(x, botY + rimHeight, w, CANVAS.HEIGHT - (botY + rimHeight) - CANVAS.GROUND_HEIGHT + 5);
    }

    private drawOrganicBody(ctx: CanvasRenderingContext2D, x: number, w: number, top: number, bot: number): void {
        const drawPart = (sy: number, ey: number) => {
            ctx.beginPath();
            ctx.moveTo(x, sy);
            for (let y = sy; y <= ey; y += 10) {
                const off = Math.sin(y * 0.1) * 10;
                ctx.lineTo(x + off, y);
            }
            ctx.lineTo(x + w, ey);
            for (let y = ey; y >= sy; y -= 10) {
                const off = Math.sin(y * 0.1) * 10;
                ctx.lineTo(x + w + off, y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        };
        drawPart(0, top);
        drawPart(bot, CANVAS.HEIGHT);
    }

    private draw3DPipe(ctx: CanvasRenderingContext2D, x: number, w: number, top: number, bot: number): void {
        ctx.globalAlpha = 1.0;
        const drawCylinder = (sx: number, sy: number, sw: number, sh: number) => {
            const grad = ctx.createLinearGradient(sx, sy, sx + sw, sy);
            grad.addColorStop(0, '#000');
            grad.addColorStop(0.15, this.pipeColor);
            grad.addColorStop(0.4, this.pipeColor);
            grad.addColorStop(0.85, this.pipeColor);
            grad.addColorStop(1.0, '#000');
            ctx.fillStyle = grad;
            ctx.fillRect(sx, sy, sw, sh);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(sx + sw * 0.7, sy, sw * 0.1, sh);
        };

        const rimHeight = 25;
        const rimOverhang = 6;
        const getDarkShade = () => 'rgba(0,0,0,0.5)';

        drawCylinder(x, 0, w, top - rimHeight);
        drawCylinder(x - rimOverhang, top - rimHeight, w + rimOverhang * 2, rimHeight);
        ctx.fillStyle = getDarkShade();
        ctx.fillRect(x + 2, top - 4, w - 4, 4);

        drawCylinder(x - rimOverhang, bot, w + rimOverhang * 2, rimHeight);
        drawCylinder(x, bot + rimHeight, w, CANVAS.HEIGHT - (bot + rimHeight) - CANVAS.GROUND_HEIGHT);
        ctx.fillStyle = getDarkShade();
        ctx.fillRect(x + 2, bot, w - 4, 4);
    }
}
