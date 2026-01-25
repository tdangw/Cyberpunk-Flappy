import type { Pipe, Coin, GameConfig } from '../types';
import { CANVAS, COLORS } from '../config/constants';

/**
 * Manages pipe generation and movement
 * Restored to original clean design. Covers all style types to fix the 26 points bug.
 */
export class PipeManager {
    private pipes: Pipe[] = [];
    private coins: Coin[] = [];
    private config: GameConfig;
    private currentPipeInterval: number = 250;
    private pipeColor: string = COLORS.NEON_PINK;
    private pipeStyle: string = 'cyber';

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

        // If no pipes, spawn immediately. If pipes exist, check against stored interval.
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

        // Random floating coins (disabled in classic)
        if (spawnCoins && Math.random() < 0.005 * dtRatio) this.spawnSafeRandomCoin();

        this.coins = this.coins.filter((c) => c.x + c.r > 0 && !c.collected);
    }

    private createPipe(spawnCoins: boolean): void {
        const groundH = CANVAS.GROUND_HEIGHT;
        const configGap = this.config.pipeGap;
        const gapVariance = (Math.random() - 0.5) * 40;
        const gap = configGap + gapVariance;
        const padding = 80;
        const minY = padding;
        const maxY = CANVAS.HEIGHT - groundH - gap - padding;
        const topH = Math.random() * (maxY - minY) + minY;

        const pipe: Pipe = {
            x: CANVAS.WIDTH + 100,
            top: topH,
            w: 80,
            passed: false,
            seed: Math.floor(Math.random() * 1000)
        };
        this.pipes.push(pipe);

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
            // Spawn 200px after last pipe if interval allows
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
        const baseSpacing = this.config.pipeSpacing || 250;
        const variance = 200;
        const randomDist = baseSpacing + (Math.random() - 0.5) * variance;
        this.currentPipeInterval = Math.max(150, randomDist);
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

        // Base logic for drawing shapes
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

        if (this.pipeStyle === 'coral') {
            this.drawOrganicBody(ctx, p.x, p.w, p.top, botY);
        } else {
            drawBody();
        }

        // Universal Body Fill for ALL styles
        ctx.globalAlpha = 0.15; // Subtle fill
        ctx.fillStyle = this.pipeColor;
        ctx.fillRect(p.x, 0, p.w, p.top);
        ctx.fillRect(p.x, botY, p.w, CANVAS.HEIGHT - botY);
        ctx.globalAlpha = 1.0;

        // Internal Details & Borders
        ctx.shadowBlur = 0;
        ctx.strokeStyle = this.pipeColor;

        switch (this.pipeStyle) {
            case 'cyber':
            case 'neon':
            case 'glitch':
            case 'plasma':
                // Add fill for these tech styles + extra glow
                ctx.fillStyle = this.pipeColor;
                ctx.globalAlpha = 0.1;
                ctx.fillRect(p.x + 5, 0, p.w - 10, p.top);
                ctx.fillRect(p.x + 5, botY, p.w - 10, CANVAS.HEIGHT - botY);
                ctx.globalAlpha = 0.5;
                ctx.beginPath();
                for (let y = 20; y < p.top; y += 40) { ctx.moveTo(p.x, y); ctx.lineTo(p.x + p.w, y); }
                for (let y = botY + 20; y < CANVAS.HEIGHT; y += 40) { ctx.moveTo(p.x, y); ctx.lineTo(p.x + p.w, y); }
                ctx.stroke();
                // Solid Border
                ctx.globalAlpha = 1;
                ctx.strokeRect(p.x, 0, p.w, p.top);
                ctx.strokeRect(p.x, botY, p.w, CANVAS.HEIGHT - botY);
                break;
            case 'bamboo':
                ctx.fillStyle = this.pipeColor;
                ctx.fillRect(p.x, 0, p.w, p.top);
                ctx.fillRect(p.x, botY, p.w, CANVAS.HEIGHT - botY);
                // Knots
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                for (let y = 40; y < p.top; y += 80) ctx.fillRect(p.x - 2, y, p.w + 4, 6);
                for (let y = botY + 40; y < CANVAS.HEIGHT; y += 80) ctx.fillRect(p.x - 2, y, p.w + 4, 6);
                break;
            case 'rusty':
            case 'stone':
            case 'lava':
            case 'magma':
                ctx.fillStyle = this.pipeColor; // Solid Fill
                ctx.fillRect(p.x, 0, p.w, p.top);
                ctx.fillRect(p.x, botY, p.w, CANVAS.HEIGHT - botY);
                // Texture
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

        // Optimized Cylinder Shader - FASTEST & SMOOTHEST
        const drawCylinder = (sx: number, sy: number, sw: number, sh: number) => {
            // Gradient only - no overlay for maximum performance and smoothness
            const grad = ctx.createLinearGradient(sx, sy, sx + sw, sy);
            grad.addColorStop(0, '#000');           // Edge shadow
            grad.addColorStop(0.15, this.pipeColor);// Base color
            grad.addColorStop(0.4, this.pipeColor); // Highlight area (flat)
            grad.addColorStop(0.85, this.pipeColor);// Base color
            grad.addColorStop(1.0, '#000');         // Edge shadow

            ctx.fillStyle = grad;
            ctx.fillRect(sx, sy, sw, sh);

            // Add a very subtle inner shadow line to define shape without white
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(sx + sw * 0.7, sy, sw * 0.1, sh);
        };

        const rimHeight = 25;
        const rimOverhang = 6;

        // Darker color for inside the pipe (simulating depth without solid black line)
        const getDarkShade = () => {
            // Simple hack: overlay black with alpha on current coloring
            return 'rgba(0,0,0,0.5)';
        };

        // TOP PIPE
        drawCylinder(x, 0, w, top - rimHeight); // Body
        drawCylinder(x - rimOverhang, top - rimHeight, w + rimOverhang * 2, rimHeight); // Rim

        // Cap (Bottom of top pipe) - No black line
        // Just fill with a slightly darker shade to look like a solid object
        ctx.fillStyle = getDarkShade();
        ctx.fillRect(x + 2, top - 4, w - 4, 4);

        // BOTTOM PIPE
        drawCylinder(x - rimOverhang, bot, w + rimOverhang * 2, rimHeight); // Rim
        drawCylinder(x, bot + rimHeight, w, CANVAS.HEIGHT - (bot + rimHeight) - CANVAS.GROUND_HEIGHT); // Body

        // Cap (Top of bottom pipe)
        ctx.fillStyle = getDarkShade();
        ctx.fillRect(x + 2, bot, w - 4, 4);
    }
}
