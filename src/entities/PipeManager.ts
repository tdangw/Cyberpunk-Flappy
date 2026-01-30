import type { Pipe, Coin, GroundEnemy, GameConfig } from '../types';
import { CANVAS, COLORS } from '../config/constants';

/**
 * Manages pipe generation, movement, coins and enemies
 */
export class PipeManager {
    private pipes: Pipe[] = [];
    private coins: Coin[] = [];
    private groundEnemies: GroundEnemy[] = [];
    private config: GameConfig;
    private pipeStyle: string = 'cyber';
    private pipeColor: string = COLORS.NEON_PINK;

    // Generation State
    private currentPipeInterval: number = 400;
    private patternType: 'none' | 'stairs_up' | 'stairs_down' | 'twins' | 'desert' = 'none';
    private patternRemaining: number = 0;
    private lastPipeTop: number = 300;

    constructor(config: GameConfig) {
        this.config = config;
        this.setNextPipeInterval();
    }

    setConfig(config: GameConfig): void {
        this.config = config;
        this.setNextPipeInterval();
    }

    update(speed: number, dtRatio: number, spawnCoins: boolean = true): void {
        // Pipes
        this.pipes.forEach((p) => (p.x -= speed * dtRatio));
        if (this.pipes.length && this.pipes[0].x + this.pipes[0].w < -100) {
            this.pipes.shift();
        }

        const lastPipe = this.pipes[this.pipes.length - 1];
        if (!lastPipe || CANVAS.WIDTH - lastPipe.x >= this.currentPipeInterval) {
            this.createPipe(spawnCoins);
            this.setNextPipeInterval();
        }

        // Coins
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
        if (spawnCoins && Math.random() < 0.005 * dtRatio) this.spawnSafeRandomCoin();
        this.coins = this.coins.filter((c) => c.x + c.r > 0 && !c.collected);

        // Ground Enemies (Goombas)
        this.groundEnemies.forEach((e) => {
            // Move with map PLUS their own crawling speed
            e.x -= (speed + e.crawlingSpeed) * dtRatio;
            e.animFrame += 0.1 * dtRatio;
        });
        this.groundEnemies = this.groundEnemies.filter(e => e.x + e.w > -100 && !e.dead);
    }

    private createPipe(spawnCoins: boolean): void {
        const groundH = CANVAS.GROUND_HEIGHT;
        const configGap = this.config.pipeGap;
        const gapVariance = (Math.random() - 0.5) * 20;
        const gap = configGap + gapVariance;
        const padding = 100;
        const minY = padding;
        const maxY = CANVAS.HEIGHT - groundH - gap - padding;

        const lastPipe = this.pipes[this.pipes.length - 1];
        let topH: number;
        let spawnX = CANVAS.WIDTH + 150;

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

        // Spawn Coin
        const isTight = this.currentPipeInterval < 150;
        if (spawnCoins && Math.random() < (isTight ? 0.1 : 0.4)) {
            const coinX = pipe.x + 40;
            const coinY = topH + gap / 2;
            if (this.isPositionSafe(coinX, coinY, 15)) {
                this.coins.push({ x: coinX, y: coinY, r: 15, collected: false, wobble: Math.random() * Math.PI });
            }
        }

        // NEW: Spawn Ground Enemy (Goomba)
        // Only in non-contiguous gaps for fairness, or desert
        if (this.currentPipeInterval > 150 && Math.random() < 0.2) {
            const enemyX = spawnX + 150; // Between pipes
            const enemyW = 40;
            const enemyH = 40;
            const enemyY = CANVAS.HEIGHT - CANVAS.GROUND_HEIGHT - enemyH;
            this.groundEnemies.push({
                x: enemyX,
                y: enemyY,
                w: enemyW,
                h: enemyH,
                crawlingSpeed: 1 + Math.random() * 2,
                animFrame: 0,
                dead: false
            });
        }
    }

    private isPositionSafe(x: number, y: number, r: number): boolean {
        const pipeOverlap = this.pipes.some(p => {
            const horizontalProximity = x + r > p.x - 20 && x - r < p.x + p.w + 20;
            if (!horizontalProximity) return false;
            const gapTop = p.top;
            const gapBottom = p.top + this.config.pipeGap;
            return y - r < gapTop + 10 || y + r > gapBottom - 10;
        });
        if (pipeOverlap) return false;
        const coinOverlap = this.coins.some(c => {
            const dx = c.x - x;
            const dy = c.y - y;
            return Math.sqrt(dx * dx + dy * dy) < (c.r + r + 20);
        });
        return !coinOverlap;
    }

    private spawnSafeRandomCoin(): void {
        let x = CANVAS.WIDTH + 150;
        const lastPipe = this.pipes[this.pipes.length - 1];
        if (lastPipe) x = lastPipe.x + this.currentPipeInterval / 2;
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
        if (rand < 0.12) {
            this.patternType = 'stairs_up';
            this.patternRemaining = 2 + Math.floor(Math.random() * 3);
            this.currentPipeInterval = 250;
        } else if (rand < 0.22) {
            this.patternType = 'stairs_down';
            this.patternRemaining = 2 + Math.floor(Math.random() * 3);
            this.currentPipeInterval = 250;
        } else if (rand < 0.30) {
            this.patternType = 'twins';
            this.patternRemaining = 2 + Math.floor(Math.random() * 3);
            this.currentPipeInterval = 250;
        } else if (rand < 0.35) {
            this.patternType = 'desert';
            this.currentPipeInterval = 1800 + Math.random() * 500;
        } else {
            // NORMAL: 250 +- 50
            const variance = 50;
            this.currentPipeInterval = baseSpacing + (Math.random() - 0.5) * variance * 2;
        }
    }

    getPipes(): Pipe[] { return this.pipes; }
    getCoins(): Coin[] { return this.coins; }
    getEnemies(): GroundEnemy[] { return this.groundEnemies; }
    reset(): void { this.pipes = []; this.coins = []; this.groundEnemies = []; }

    clearNearPipes(birdX: number): void {
        this.pipes = this.pipes.filter(p => p.x < birdX - 50 || p.x > birdX + 400);
        this.coins = this.coins.filter(c => c.x < birdX - 50 || c.x > birdX + 400);
        this.groundEnemies = this.groundEnemies.filter(e => e.x < birdX - 50 || e.x > birdX + 400);
    }

    render(ctx: CanvasRenderingContext2D): void {
        this.pipes.forEach((p) => this.drawPipe(ctx, p));
        this.coins.forEach((c) => {
            if (c.collected) return;
            const absScale = Math.abs(Math.cos(c.wobble));
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
        this.groundEnemies.forEach(e => this.drawGoomba(ctx, e));
    }

    private drawGoomba(ctx: CanvasRenderingContext2D, e: GroundEnemy): void {
        const walk = Math.sin(e.animFrame) * 3;
        ctx.save();
        ctx.translate(e.x + e.w / 2, e.y + e.h / 2);

        // Body Shadow
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#000';

        // Mushroom Head (Brown)
        ctx.fillStyle = '#8b4513';
        ctx.beginPath();
        ctx.moveTo(-e.w * 0.5, e.h * 0.2); // Left base
        ctx.bezierCurveTo(-e.w * 0.6, -e.h * 0.6, e.w * 0.6, -e.h * 0.6, e.w * 0.5, e.h * 0.2); // Top curve
        ctx.lineTo(-e.w * 0.5, e.h * 0.2);
        ctx.fill();

        // Stalk/Face (Tan)
        ctx.fillStyle = '#ffdead';
        ctx.fillRect(-e.w * 0.25, e.h * 0.1, e.w * 0.5, e.h * 0.4);

        // Eyes (Mean looking)
        ctx.fillStyle = '#000';
        // Left
        ctx.beginPath();
        ctx.moveTo(-e.w * 0.15, e.h * 0.2);
        ctx.lineTo(-e.w * 0.05, e.h * 0.25);
        ctx.stroke();
        ctx.fillRect(-e.w * 0.15, e.h * 0.25, 4, 4);
        // Right
        ctx.beginPath();
        ctx.moveTo(e.w * 0.15, e.h * 0.2);
        ctx.lineTo(e.w * 0.05, e.h * 0.25);
        ctx.stroke();
        ctx.fillRect(e.w * 0.08, e.h * 0.25, 4, 4);

        // Feet (Black) - Walking animation
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#000';
        ctx.fillRect(-e.w * 0.4 + walk, e.h * 0.4, e.w * 0.3, e.h * 0.15);
        ctx.fillRect(e.w * 0.1 - walk, e.h * 0.4, e.w * 0.3, e.h * 0.15);

        ctx.restore();
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
        } else if (this.pipeStyle === 'classic') {
            this.drawClassicPipe(ctx, p.x, p.w, p.top, botY);
        } else if (this.pipeStyle === 'coral') {
            this.drawOrganicBody(ctx, p.x, p.w, p.top, botY);
        } else {
            drawBody();
        }

        if (['cyber', 'neon', 'glitch', 'plasma'].includes(this.pipeStyle)) {
            ctx.globalAlpha = 0.1; ctx.fillStyle = this.pipeColor;
            ctx.fillRect(p.x + 5, 0, p.w - 10, p.top);
            ctx.fillRect(p.x + 5, botY, p.w - 10, CANVAS.HEIGHT - botY);
            ctx.globalAlpha = 0.5; ctx.beginPath();
            for (let y = 20; y < p.top; y += 40) { ctx.moveTo(p.x, y); ctx.lineTo(p.x + p.w, y); }
            for (let y = botY + 20; y < CANVAS.HEIGHT; y += 40) { ctx.moveTo(p.x, y); ctx.lineTo(p.x + p.w, y); }
            ctx.stroke();
        }
        ctx.restore();
    }

    private drawClassicPipe(ctx: CanvasRenderingContext2D, x: number, w: number, top: number, botY: number): void {
        const rimHeight = 26; const rimOverhang = 4;
        const drawPart = (bx: number, by: number, bw: number, bh: number) => {
            const grad = ctx.createLinearGradient(bx, by, bx + bw, by);
            grad.addColorStop(0, '#4a8522'); grad.addColorStop(0.1, '#65a830');
            grad.addColorStop(0.4, '#b4e05b'); grad.addColorStop(0.6, '#98d146');
            grad.addColorStop(0.9, '#65a830'); grad.addColorStop(1, '#3b6916');
            ctx.fillStyle = grad; ctx.beginPath(); ctx.rect(bx, by, bw, bh); ctx.fill(); ctx.stroke();
        };
        drawPart(x, -5, w, top - rimHeight + 5);
        drawPart(x - rimOverhang, top - rimHeight, w + rimOverhang * 2, rimHeight);
        drawPart(x - rimOverhang, botY, w + rimOverhang * 2, rimHeight);
        drawPart(x, botY + rimHeight, w, CANVAS.HEIGHT - (botY + rimHeight) - CANVAS.GROUND_HEIGHT + 5);
    }

    private drawOrganicBody(ctx: CanvasRenderingContext2D, x: number, w: number, top: number, bot: number): void {
        const drawPart = (sy: number, ey: number) => {
            ctx.beginPath(); ctx.moveTo(x, sy);
            for (let y = sy; y <= ey; y += 10) ctx.lineTo(x + Math.sin(y * 0.1) * 10, y);
            ctx.lineTo(x + w, ey);
            for (let y = ey; y >= sy; y -= 10) ctx.lineTo(x + w + Math.sin(y * 0.1) * 10, y);
            ctx.closePath(); ctx.fill(); ctx.stroke();
        };
        drawPart(0, top); drawPart(bot, CANVAS.HEIGHT);
    }

    private draw3DPipe(ctx: CanvasRenderingContext2D, x: number, w: number, top: number, bot: number): void {
        const drawCyl = (sx: number, sy: number, sw: number, sh: number) => {
            const grad = ctx.createLinearGradient(sx, sy, sx + sw, sy);
            grad.addColorStop(0, '#000'); grad.addColorStop(0.15, this.pipeColor);
            grad.addColorStop(0.4, this.pipeColor); grad.addColorStop(0.85, this.pipeColor); grad.addColorStop(1.0, '#000');
            ctx.fillStyle = grad; ctx.fillRect(sx, sy, sw, sh);
        };
        const rim = 25; const over = 6;
        drawCyl(x, 0, w, top - rim); drawCyl(x - over, top - rim, w + over * 2, rim);
        drawCyl(x - over, bot, w + over * 2, rim); drawCyl(x, bot + rim, w, CANVAS.HEIGHT - (bot + rim) - CANVAS.GROUND_HEIGHT);
    }
}
