import type { GroundEnemy } from '../types';
import { CANVAS, COLORS } from '../config/constants';

export class EnemyManager {
    private pool: GroundEnemy[] = [];
    private activeEnemies: GroundEnemy[] = [];

    constructor() { }

    reset(): void {
        while (this.activeEnemies.length > 0) {
            this.pool.push(this.activeEnemies.pop()!);
        }
    }

    spawnBullet(x: number, y: number): void {
        let e = this.pool.pop();
        if (!e) {
            e = {
                type: 'bullet',
                x: 0, y: 0,
                w: 50, h: 35,
                scaleX: 1.2, scaleY: 1.2,
                color: '#000',
                crawlingSpeed: 0,
                animFrame: 0,
                dead: false
            };
        }

        // Reset properties
        e.type = 'bullet';
        e.x = x;
        e.y = y;
        e.w = 50;
        e.h = 35;
        e.scaleX = 1.2;
        e.scaleY = 1.2;
        e.dead = false;
        e.color = '#000';
        e.animFrame = 0;
        e.crawlingSpeed = 0;
        // Reset dying status (hack property)
        (e as any).dying = false;
        (e as any).vy = 0;
        (e as any).rotation = 0;

        this.activeEnemies.push(e);
    }

    spawnGroundEnemy(x: number): void {
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

        let e = this.pool.pop();
        if (!e) e = { type, x, y: 0, w, h, scaleX: sx, scaleY: sy, color, crawlingSpeed: 0, animFrame: 0, dead: false };

        e.type = type;
        e.x = x;
        e.y = CANVAS.HEIGHT - CANVAS.GROUND_HEIGHT - h;
        e.w = w; e.h = h;
        e.scaleX = sx; e.scaleY = sy;
        e.color = color;
        e.crawlingSpeed = (type === 'snail' ? 0.3 : 1.0) * (sizeRand < 0.33 ? 1.3 : 1.0);
        e.animFrame = 0;
        e.dead = false;
        (e as any).dying = false;
        (e as any).vy = 0;
        (e as any).rotation = 0;

        this.activeEnemies.push(e);
    }

    spawnFallingEnemy(x: number, pipeTop: number): void {
        const w = 35; const h = 35;
        let e = this.pool.pop();
        if (!e) e = { type: 'goomba', x, y: 0, w, h, scaleX: 0.9, scaleY: 0.9, color: COLORS.NEON_PINK, crawlingSpeed: 1, animFrame: 0, dead: false };

        e.type = Math.random() > 0.5 ? 'goomba' : 'snail';
        e.x = x + 20;
        e.y = pipeTop - h;
        (e as any).vy = 2; // Initial push
        e.w = w; e.h = h;
        e.scaleX = 0.9; e.scaleY = 0.9;
        e.color = COLORS.NEON_PINK;
        e.crawlingSpeed = 1;
        e.animFrame = 0;
        e.dead = false;
        (e as any).dying = false;
        (e as any).rotation = 0;

        this.activeEnemies.push(e);
    }

    update(speed: number, dtRatio: number): void {
        let writeIdx = 0;

        for (let i = 0; i < this.activeEnemies.length; i++) {
            const e = this.activeEnemies[i];

            if ((e as any).dying) {
                // Death Animation (Fall and rotate)
                e.x -= speed * dtRatio;
                e.y += ((e as any).vy || 5) * dtRatio;
                (e as any).vy = ((e as any).vy || 5) + 0.5 * dtRatio; // Gravity
                (e as any).rotation = ((e as any).rotation || 0) + 0.1 * dtRatio;

                if (e.y > CANVAS.HEIGHT + 100) {
                    this.pool.push(e);
                    continue;
                }
            } else {
                // Normal Movement and Physics
                let movementSpeed = e.type === 'bullet' ? speed * 2 : (speed + e.crawlingSpeed);
                e.x -= movementSpeed * dtRatio;
                e.animFrame += 0.1 * dtRatio;

                // Falling Physics for Goombas/Snails
                if (e.type !== 'bullet') {
                    const groundY = CANVAS.HEIGHT - CANVAS.GROUND_HEIGHT - e.h;
                    if (e.y < groundY) {
                        const vy = (e as any).vy || 0;
                        const newVy = vy + 0.25 * dtRatio;
                        (e as any).vy = newVy;
                        e.y += newVy * dtRatio;

                        if (e.y > groundY) {
                            e.y = groundY;
                            (e as any).vy = 0;
                        }
                    } else {
                        // Ensure aligned to ground
                        e.y = groundY;
                    }
                }

                // Bounds check (left side)
                if (e.x + e.w < -100) {
                    this.pool.push(e);
                    continue;
                }
            }

            // Keep active
            if (writeIdx !== i) {
                this.activeEnemies[writeIdx] = e;
            }
            writeIdx++;
        }

        while (this.activeEnemies.length > writeIdx) {
            this.activeEnemies.pop();
        }
    }

    draw(ctx: CanvasRenderingContext2D): void {
        for (const e of this.activeEnemies) {
            this.drawGroundEnemy(ctx, e);
        }
    }

    private drawGroundEnemy(ctx: CanvasRenderingContext2D, e: GroundEnemy): void {
        ctx.save();
        ctx.translate(e.x + e.w / 2, e.y + e.h / 2);

        if ((e as any).dying) {
            ctx.rotate((e as any).rotation || 0);
        }

        if (e.type !== 'bullet') {
            ctx.scale(e.scaleX, e.scaleY);
        }

        const walk = Math.sin(e.animFrame) * 4;
        const baseW = 40;
        const baseH = 40;

        switch (e.type) {
            case 'goomba':
                // Mario Goomba
                ctx.fillStyle = e.color;
                ctx.beginPath();
                ctx.moveTo(-baseW * 0.5, baseH * 0.2);
                ctx.bezierCurveTo(-baseW * 0.6, -baseH * 0.6, baseW * 0.6, -baseH * 0.6, baseW * 0.5, baseH * 0.2);
                ctx.fill();
                ctx.fillStyle = '#ffdead';
                ctx.fillRect(-baseW * 0.2, baseH * 0.1, baseW * 0.4, baseH * 0.4);
                ctx.fillStyle = '#000';
                ctx.fillRect(-baseW * 0.15, baseH * 0.2, 3, 3);
                ctx.fillRect(baseW * 0.05, baseH * 0.2, 3, 3);
                ctx.fillStyle = '#000';
                ctx.fillRect(-baseW * 0.35 + walk, baseH * 0.4, baseW * 0.25, baseH * 0.1);
                ctx.fillRect(baseW * 0.1 - walk, baseH * 0.4, baseW * 0.25, baseH * 0.1);
                break;

            case 'snail':
                // Refined Snail
                ctx.fillStyle = e.color;
                ctx.beginPath();
                ctx.ellipse(baseW * 0.1, baseH * 0.3, baseW * 0.4, baseH * 0.15, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(-baseW * 0.3, baseH * 0.1, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = e.color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-baseW * 0.25, baseH * 0.1);
                ctx.lineTo(-baseW * 0.2, -baseH * 0.1);
                ctx.moveTo(-baseW * 0.35, baseH * 0.1);
                ctx.lineTo(-baseW * 0.4, -baseH * 0.1);
                ctx.stroke();
                ctx.fillStyle = '#000';
                ctx.beginPath(); ctx.arc(-baseW * 0.2, -baseH * 0.1, 2, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(-baseW * 0.4, -baseH * 0.1, 2, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#d2691e';
                ctx.beginPath();
                ctx.arc(baseW * 0.1, baseH * 0.05, baseH * 0.35, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#8b4513'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(baseW * 0.1, baseH * 0.05, baseH * 0.15, 0, Math.PI * 2); ctx.stroke();
                break;

            case 'bullet':
                this.drawBulletBill(ctx, -e.w / 2, -e.h / 2, e.w, e.h);
                break;
        }

        ctx.restore();
    }

    private drawBulletBill(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
        ctx.translate(x + w / 2, y + h / 2);

        // Body
        const grad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
        grad.addColorStop(0, '#1a1a2e');
        grad.addColorStop(0.5, '#16213e');
        grad.addColorStop(1, '#0f3460');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(-w * 0.2, -h * 0.5);
        ctx.quadraticCurveTo(-w * 0.6, 0, -w * 0.2, h * 0.5);
        ctx.lineTo(w * 0.4, h * 0.5);
        ctx.lineTo(w * 0.35, 0);
        ctx.lineTo(w * 0.4, -h * 0.5);
        ctx.closePath();
        ctx.fill();
        // Visor
        ctx.fillStyle = COLORS.NEON_BLUE;
        ctx.beginPath();
        ctx.moveTo(-w * 0.35, -h * 0.1);
        ctx.lineTo(-w * 0.1, -h * 0.1);
        ctx.lineTo(-w * 0.2, h * 0.1);
        ctx.lineTo(-w * 0.4, h * 0.1);
        ctx.fill();
        // Thruster
        const engineGrad = ctx.createRadialGradient(w * 0.4, 0, 0, w * 0.4, 0, 10);
        engineGrad.addColorStop(0, '#fff');
        engineGrad.addColorStop(1, COLORS.NEON_BLUE);
        ctx.fillStyle = engineGrad;
        ctx.beginPath();
        ctx.arc(w * 0.4, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        // Fins
        ctx.fillStyle = '#4e4e4e';
        ctx.beginPath(); ctx.moveTo(w * 0.1, -h * 0.5); ctx.lineTo(w * 0.3, -h * 0.75); ctx.lineTo(w * 0.4, -h * 0.5); ctx.fill();
        ctx.beginPath(); ctx.moveTo(w * 0.1, h * 0.5); ctx.lineTo(w * 0.3, h * 0.75); ctx.lineTo(w * 0.4, h * 0.5); ctx.fill();
    }

    getEnemies(): GroundEnemy[] { return this.activeEnemies; }
}
