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
    private patternType: 'none' | 'stairs_up' | 'stairs_down' | 'twins' | 'desert' | 'bullet_stairs' | 'bullet_squad' | 'bullet_zigzag' = 'none';
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
            const wasEvent = this.patternType !== 'none' && this.patternType.startsWith('bullet_');
            this.createPipe(spawnCoins);
            // Only randomize next interval if we didn't just start a custom event 
            // handleBulletEvent sets a specific interval; we mustn't overwrite it.
            if (!wasEvent) {
                this.setNextPipeInterval();
            }
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

        // Ground & Air Enemies (Walking, Falling, Flying)
        this.groundEnemies.forEach((e) => {
            const movementSpeed = e.type === 'bullet' ? speed * 2 : (speed + e.crawlingSpeed);
            e.x -= movementSpeed * dtRatio;
            e.animFrame += 0.1 * dtRatio;

            // Falling Physics for Goombas/Snails
            if (e.type !== 'bullet') {
                const groundY = CANVAS.HEIGHT - CANVAS.GROUND_HEIGHT - e.h;
                if (e.y < groundY) {
                    e.vy = (e.vy || 0) + 0.25 * dtRatio; // Gravity
                    e.y += e.vy * dtRatio;
                    if (e.y > groundY) {
                        e.y = groundY;
                        e.vy = 0;
                    }
                }
            }
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

        let topH: number;
        let spawnX = CANVAS.WIDTH + 150;
        const lastPipe = this.pipes[this.pipes.length - 1];

        // Restore Simple Bullet/Enemy Spawning alongside pipes
        const randEvent = Math.random();
        if (this.currentPipeInterval > 150) {
            if (randEvent < 0.12) {
                this.spawnGroundEnemy(spawnX + 200);
            } else if (randEvent < 0.22) {
                this.spawnFallingEnemy(spawnX, lastPipe ? lastPipe.top : 300);
            } else if (randEvent < 0.40) {
                // SIMPLE BULLETS (Frequent)
                const midY = lastPipe ? (lastPipe.top + gap / 2) : 350;
                this.spawnBulletBill(spawnX + 180, midY + (Math.random() - 0.5) * 100);
            }
        }

        // COMPLEX EVENTS (Keep rare, exclusive)
        if (this.patternType === 'bullet_stairs' || this.patternType === 'bullet_zigzag') {
            this.handleBulletEvent(spawnX, lastPipe ? lastPipe.top : 300, gap);
            return;
        }

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
    }

    private handleBulletEvent(spawnX: number, lastTop: number, gap: number): void {
        const type = this.patternType;
        this.patternType = 'none'; // Reset so next call is normal

        if (type === 'bullet_squad') {
            this.currentPipeInterval = 800;
            const startX = spawnX + 100;
            const count = 4;
            const midY = lastTop + gap / 2;
            const squadY = midY + (Math.random() > 0.5 ? -50 : 50);
            for (let i = 0; i < count; i++) {
                this.spawnBulletBill(startX + i * 90, squadY);
            }
        } else if (type === 'bullet_stairs') {
            // STAIR FORMATION - Smaller localized groups in sequence
            this.currentPipeInterval = 2500;
            const startX = spawnX + 150;
            const count = 5;
            const hGap = 62; // Nearly touching (width is 60)
            const vStep = 50;

            // Cluster 1: Starting lower
            const startY1 = CANVAS.HEIGHT - CANVAS.GROUND_HEIGHT - 120;
            for (let i = 0; i < count; i++) {
                this.spawnBulletBill(startX + i * hGap, startY1 - (i * vStep));
            }

            // Cluster 2: Sequentially later, starting mid-height
            const offsetX = (count * hGap) + 350; // Gap between small stairs
            const startY2 = CANVAS.HEIGHT - CANVAS.GROUND_HEIGHT - 180;
            for (let i = 0; i < count; i++) {
                this.spawnBulletBill(startX + offsetX + i * hGap, startY2 - (i * vStep));
            }
        } else if (type === 'bullet_zigzag') {
            // "GATE/CORRIDOR" FORMATION - Top and bottom rows with dodge space
            this.currentPipeInterval = 2500;
            const startX = spawnX + 150;
            const count = 6; // 6 pairs
            const horizontalGap = 220;

            // Fixed heights for top and bottom barriers
            const topY = 80;
            const bottomY = CANVAS.HEIGHT - CANVAS.GROUND_HEIGHT - 80;

            for (let i = 0; i < count; i++) {
                const x = startX + i * horizontalGap;
                this.spawnBulletBill(x, topY);
                this.spawnBulletBill(x, bottomY);
            }
        }
    }

    private spawnGroundEnemy(x: number): void {
        const types: ('goomba' | 'snail')[] = ['goomba', 'snail'];
        const type = types[Math.floor(Math.random() * types.length)];
        const sizeRand = Math.random();
        let sx = 1, sy = 1;
        if (sizeRand < 0.33) { sx = 0.7; sy = 0.7; }
        else if (sizeRand < 0.66) { sx = 1.4; sy = 1.4; }

        const goombaColors = ['#8b4513', '#4682b4', '#a52a2a', '#2e8b57', '#6a5acd', '#2f4f4f'];
        const snailColors = ['#ffa07a', '#00ced1', '#32cd32', '#ff69b4', '#ffd700', '#9370db'];
        const color = type === 'goomba' ? goombaColors[Math.floor(Math.random() * goombaColors.length)] : snailColors[Math.floor(Math.random() * snailColors.length)];

        const w = 40 * sx; const h = 40 * sy;
        this.groundEnemies.push({
            type, x, y: CANVAS.HEIGHT - CANVAS.GROUND_HEIGHT - h,
            w, h, scaleX: sx, scaleY: sy, color,
            crawlingSpeed: (type === 'snail' ? 0.3 : 1.0) * (sizeRand < 0.33 ? 1.3 : 1.0),
            animFrame: 0, dead: false
        });
    }

    private spawnFallingEnemy(x: number, pipeTop: number): void {
        // Spawn right at the edge of the top pipe
        const w = 35; const h = 35;
        this.groundEnemies.push({
            type: Math.random() > 0.5 ? 'goomba' : 'snail',
            x: x + 20, y: pipeTop - h, vy: 2, // Start with a little down push
            w, h, scaleX: 0.9, scaleY: 0.9, color: COLORS.NEON_PINK,
            crawlingSpeed: 1, animFrame: 0, dead: false
        });
    }

    private spawnBulletBill(x: number, gapMidY: number): void {
        const w = 50; const h = 35;
        // Bullet Bill positions follow a "reachable" pattern
        // Slightly offset from exact center for variety
        const y = gapMidY + (Math.random() - 0.5) * 60;
        this.groundEnemies.push({
            type: 'bullet', x, y: y - h / 2,
            w, h, scaleX: 1.2, scaleY: 1.2, color: '#000',
            crawlingSpeed: 0, animFrame: 0, dead: false
        });
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
            // ctx.shadowBlur = 20; // Removed for mobile optimization
            ctx.fillStyle = COLORS.NEON_GOLD;
            ctx.beginPath(); ctx.ellipse(0, 0, c.r * absScale, c.r, 0, 0, Math.PI * 2); ctx.fill();
            if (absScale > 0.4) {
                ctx.fillStyle = '#000'; ctx.font = `bold ${Math.floor(c.r * 1.2)}px Arial`;
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.save(); ctx.scale(absScale, 1); ctx.fillText('$', 0, 1); ctx.restore();
            }
            ctx.restore();
        });
        this.groundEnemies.forEach(e => this.drawGroundEnemy(ctx, e));
    }

    private drawGroundEnemy(ctx: CanvasRenderingContext2D, e: GroundEnemy): void {
        ctx.save();
        ctx.translate(e.x + e.w / 2, e.y + e.h / 2);

        if (e.type !== 'bullet') {
            ctx.scale(e.scaleX, e.scaleY); // Apply size variant scaling
        }

        const walk = Math.sin(e.animFrame) * 4;
        const baseW = 40;
        const baseH = 40;

        switch (e.type) {
            case 'goomba':
                // Mario Goomba with color variants
                ctx.fillStyle = e.color; // Main Head Color
                ctx.beginPath();
                ctx.moveTo(-baseW * 0.5, baseH * 0.2);
                ctx.bezierCurveTo(-baseW * 0.6, -baseH * 0.6, baseW * 0.6, -baseH * 0.6, baseW * 0.5, baseH * 0.2);
                ctx.fill();

                ctx.fillStyle = '#ffdead'; // Stalk (Keep tan for recognizable face)
                ctx.fillRect(-baseW * 0.2, baseH * 0.1, baseW * 0.4, baseH * 0.4);

                ctx.fillStyle = '#000'; // Eyes
                ctx.fillRect(-baseW * 0.15, baseH * 0.2, 3, 3);
                ctx.fillRect(baseW * 0.05, baseH * 0.2, 3, 3);

                ctx.fillStyle = '#000'; // Feet
                ctx.fillRect(-baseW * 0.35 + walk, baseH * 0.4, baseW * 0.25, baseH * 0.1);
                ctx.fillRect(baseW * 0.1 - walk, baseH * 0.4, baseW * 0.25, baseH * 0.1);
                break;

            case 'snail':
                // Refined Snail with color variants
                ctx.fillStyle = e.color; // Body color variant
                ctx.beginPath();
                // Extended body (Flipped to face LEFT)
                ctx.ellipse(baseW * 0.1, baseH * 0.3, baseW * 0.4, baseH * 0.15, 0, 0, Math.PI * 2);
                ctx.fill();

                // Head part
                ctx.beginPath();
                ctx.arc(-baseW * 0.3, baseH * 0.1, 8, 0, Math.PI * 2);
                ctx.fill();

                // Eye Stalks
                ctx.strokeStyle = e.color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-baseW * 0.25, baseH * 0.1);
                ctx.lineTo(-baseW * 0.2, -baseH * 0.1);
                ctx.moveTo(-baseW * 0.35, baseH * 0.1);
                ctx.lineTo(-baseW * 0.4, -baseH * 0.1);
                ctx.stroke();

                // Eyes
                ctx.fillStyle = '#000';
                ctx.beginPath(); ctx.arc(-baseW * 0.2, -baseH * 0.1, 2, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(-baseW * 0.4, -baseH * 0.1, 2, 0, Math.PI * 2); ctx.fill();

                // Shell (Usually Brown/Orange, constant or varied)
                ctx.fillStyle = '#d2691e';
                ctx.beginPath();
                ctx.arc(baseW * 0.1, baseH * 0.05, baseH * 0.35, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#8b4513'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(baseW * 0.1, baseH * 0.05, baseH * 0.15, 0, Math.PI * 2); ctx.stroke();
                break;

            case 'bullet':
                this.drawBulletBill(ctx, e);
                break;
        }

        ctx.restore();
    }

    private drawBulletBill(ctx: CanvasRenderingContext2D, e: GroundEnemy): void {
        const w = e.w * 1.3;
        const h = e.h;

        ctx.save();

        // Body Glow (Optimized)
        // ctx.shadowBlur = 10; 
        // ctx.shadowColor = COLORS.NEON_BLUE;

        // 1. Main Body (Dark Metal Hexagon shape)
        const bodyGrad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
        bodyGrad.addColorStop(0, '#1a1a2e');
        bodyGrad.addColorStop(0.5, '#16213e');
        bodyGrad.addColorStop(1, '#0f3460');
        ctx.fillStyle = bodyGrad;

        ctx.beginPath();
        ctx.moveTo(-w * 0.5, 0);          // Front Point
        ctx.lineTo(-w * 0.2, -h * 0.5);   // Top Front
        ctx.lineTo(w * 0.5, -h * 0.5);    // Top Back
        ctx.lineTo(w * 0.4, 0);           // Rear Mid (Indented)
        ctx.lineTo(w * 0.5, h * 0.5);     // Bottom Back
        ctx.lineTo(-w * 0.2, h * 0.5);    // Bottom Front
        ctx.closePath();
        ctx.fill();

        // 2. Neon Visor (Optimized)
        ctx.fillStyle = COLORS.NEON_BLUE;
        // ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(-w * 0.35, -h * 0.1);
        ctx.lineTo(-w * 0.1, -h * 0.1);
        ctx.lineTo(-w * 0.2, h * 0.1);
        ctx.lineTo(-w * 0.4, h * 0.1);
        ctx.closePath();
        ctx.fill();

        // 3. Stabilization Fins (Instead of Arms)
        ctx.fillStyle = '#4e4e4e';
        ctx.shadowBlur = 0;
        // Upper Fin
        ctx.beginPath();
        ctx.moveTo(w * 0.1, -h * 0.5);
        ctx.lineTo(w * 0.3, -h * 0.75);
        ctx.lineTo(w * 0.4, -h * 0.5);
        ctx.fill();
        // Lower Fin
        ctx.beginPath();
        ctx.moveTo(w * 0.1, h * 0.5);
        ctx.lineTo(w * 0.3, h * 0.75);
        ctx.lineTo(w * 0.4, h * 0.5);
        ctx.fill();

        // 4. Rear Energy Core (Thruster)
        const engineGrad = ctx.createRadialGradient(w * 0.4, 0, 0, w * 0.4, 0, 10);
        engineGrad.addColorStop(0, '#fff');
        engineGrad.addColorStop(1, COLORS.NEON_BLUE);
        ctx.fillStyle = engineGrad;
        ctx.beginPath();
        ctx.arc(w * 0.4, 0, 8, 0, Math.PI * 2);
        ctx.fill();

        // 5. Surface Detail (Tech lines)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -h * 0.5);
        ctx.lineTo(0, h * 0.5);
        ctx.stroke();

        ctx.restore();
    }

    private drawPipe(ctx: CanvasRenderingContext2D, p: Pipe): void {
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
            ctx.globalAlpha = 0.05; ctx.fillStyle = this.pipeColor; // Reduced from 0.1 to 0.05
            ctx.fillRect(p.x + 5, 0, p.w - 10, p.top);
            ctx.fillRect(p.x + 5, botY, p.w - 10, CANVAS.HEIGHT - botY);
            ctx.globalAlpha = 0.3; ctx.beginPath(); // Reduced from 0.5 to 0.3
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
