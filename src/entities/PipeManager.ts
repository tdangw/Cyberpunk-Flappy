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
    private pipeColor: string = COLORS.NEON_PINK;
    private pipeStyle: string = 'cyber';

    constructor(config: GameConfig) {
        this.config = config;
    }

    setConfig(config: GameConfig): void {
        this.config = config;
    }

    update(speed: number): void {
        this.pipes.forEach((p) => (p.x -= speed));
        if (this.pipes.length && this.pipes[0].x + this.pipes[0].w < -100) {
            this.pipes.shift();
        }

        const lastPipe = this.pipes[this.pipes.length - 1];
        const minSpawnDist = 300;
        const maxSpawnDist = 600;
        const nextDist = Math.random() * (maxSpawnDist - minSpawnDist) + minSpawnDist;

        if (!lastPipe || CANVAS.WIDTH - lastPipe.x >= nextDist) {
            this.createPipe();
        }

        this.coins.forEach((c) => {
            c.x -= speed;
            c.wobble += 0.03;
            this.pipes.forEach(p => {
                const horizontalOverlap = c.x + c.r > p.x - 5 && c.x - c.r < p.x + p.w + 5;
                if (horizontalOverlap) {
                    const inGap = c.y - c.r > p.top + 5 && c.y + c.r < p.top + this.config.pipeGap - 5;
                    if (!inGap) c.collected = true;
                }
            });
        });

        if (Math.random() < 0.005) this.spawnSafeRandomCoin();
        this.coins = this.coins.filter((c) => c.x + c.r > 0 && !c.collected);
    }

    private createPipe(): void {
        const groundH = CANVAS.GROUND_HEIGHT;
        const gap = this.config.pipeGap;

        // Ensure more dramatic height variations
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

        if (Math.random() > 0.4) {
            this.coins.push({
                x: pipe.x + 40,
                y: topH + gap / 2,
                r: 15,
                collected: false,
                wobble: Math.random() * Math.PI,
            });
        }
    }

    private spawnSafeRandomCoin(): void {
        const x = CANVAS.WIDTH + 150;
        const y = Math.random() * (CANVAS.HEIGHT - 350) + 150;
        if (!this.pipes.some(p => Math.abs(x - (p.x + 40)) < 250)) {
            this.coins.push({ x, y, r: 15, collected: false, wobble: Math.random() * Math.PI });
        }
    }

    setColors(color: string): void { this.pipeColor = color; }
    setStyle(style: string): void { this.pipeStyle = style; }
    getPipes(): Pipe[] { return this.pipes; }
    getCoins(): Coin[] { return this.coins; }
    reset(): void { this.pipes = []; this.coins = []; }

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

        // Internal Details
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = this.pipeColor;

        switch (this.pipeStyle) {
            case 'cyber':
            case 'neon':
            case 'glitch':
            case 'plasma':
                for (let y = 20; y < p.top; y += 40) { ctx.beginPath(); ctx.moveTo(p.x + 10, y); ctx.lineTo(p.x + p.w - 10, y); ctx.stroke(); }
                for (let y = botY + 20; y < CANVAS.HEIGHT; y += 40) { ctx.beginPath(); ctx.moveTo(p.x + 10, y); ctx.lineTo(p.x + p.w - 10, y); ctx.stroke(); }
                break;
            case 'bamboo':
                ctx.fillStyle = this.pipeColor;
                for (let y = 40; y < p.top; y += 80) ctx.fillRect(p.x - 5, y, p.w + 10, 8);
                for (let y = botY + 40; y < CANVAS.HEIGHT; y += 80) ctx.fillRect(p.x - 5, y, p.w + 10, 8);
                break;
            case 'rusty':
            case 'stone':
                ctx.fillStyle = this.pipeColor;
                for (let y = 20; y < p.top; y += 60) { ctx.beginPath(); ctx.arc(p.x + 10, y, 4, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(p.x + p.w - 10, y, 4, 0, Math.PI * 2); ctx.fill(); }
                for (let y = botY + 20; y < CANVAS.HEIGHT; y += 60) { ctx.beginPath(); ctx.arc(p.x + 10, y, 4, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(p.x + p.w - 10, y, 4, 0, Math.PI * 2); ctx.fill(); }
                break;
            case 'golden':
            case 'crystal':
            case 'ice':
                ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.2;
                ctx.fillRect(p.x + p.w / 2 - 5, 0, 10, p.top);
                ctx.fillRect(p.x + p.w / 2 - 5, botY, 10, CANVAS.HEIGHT - botY);
                break;
            case 'laser':
                ctx.strokeStyle = '#fff'; ctx.globalAlpha = 0.8; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(p.x + p.w / 2, 0); ctx.lineTo(p.x + p.w / 2, p.top); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(p.x + p.w / 2, botY); ctx.lineTo(p.x + p.w / 2, CANVAS.HEIGHT); ctx.stroke();
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
        const drawBody = (sy: number, ey: number) => {
            const h = Math.abs(ey - sy);
            // Main 3D Pipe Shading - using sy ensures top and bottom pipes look the same
            const pipeGrad = ctx.createLinearGradient(x, sy, x + w, sy);
            pipeGrad.addColorStop(0, '#064e3b');
            pipeGrad.addColorStop(0.5, '#10b981');
            pipeGrad.addColorStop(1, '#064e3b');

            ctx.fillStyle = pipeGrad;
            ctx.fillRect(x, sy, w, h);

            // Neon Glow Edges
            ctx.strokeStyle = '#00fff7';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.8;
            ctx.strokeRect(x, sy, w, h);

            // Inner highlight for 3D look
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.moveTo(x + 10, sy);
            ctx.lineTo(x + 10, ey);
            ctx.stroke();
            ctx.globalAlpha = 1.0;
        };

        drawBody(0, top);
        drawBody(bot, CANVAS.HEIGHT - CANVAS.GROUND_HEIGHT);
    }
}
