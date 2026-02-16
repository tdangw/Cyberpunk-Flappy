import type { Particle } from '../types';


/**
 * Particle system for visual effects - Optimized with Object Pooling and Batch Rendering
 */
export class ParticleSystem {
    private pool: Particle[] = [];
    private activeParticles: Particle[] = [];
    private maxParticles = 300;
    private isMobile = false;

    constructor() {
        // Simple mobile/touch detection
        this.isMobile = (window.innerWidth <= 800) || ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

        // Cap particles on mobile to maintain 60FPS
        if (this.isMobile) {
            this.maxParticles = 120; // Sufficient for mobile screens
        }

        // Pre-allocate pool
        for (let i = 0; i < this.maxParticles; i++) {
            this.pool.push({
                x: 0, y: 0,
                vx: 0, vy: 0,
                life: 0,
                color: '#fff',
                text: undefined
            });
        }
    }

    update(speedOffset: number, dtRatio: number): void {
        let writeIdx = 0;

        for (let i = 0; i < this.activeParticles.length; i++) {
            const p = this.activeParticles[i];

            p.x += (p.vx - speedOffset * 0.5) * dtRatio;
            p.y += p.vy * dtRatio;
            p.life -= (this.isMobile ? 0.05 : 0.04) * dtRatio; // Slightly faster fade on mobile
            p.vx *= 0.95;
            p.vy *= 0.95;

            if (p.life > 0) {
                if (writeIdx !== i) {
                    this.activeParticles[writeIdx] = p;
                }
                writeIdx++;
            } else {
                this.pool.push(p);
            }
        }

        while (this.activeParticles.length > writeIdx) {
            this.activeParticles.pop();
        }
    }

    emit(x: number, y: number, count: number, color: string): void {
        // Adaptive count for mobile
        const finalCount = this.isMobile ? Math.ceil(count * 0.6) : count;

        for (let i = 0; i < finalCount; i++) {
            if (this.pool.length === 0) break;

            const p = this.pool.pop()!;
            p.x = x;
            p.y = y;
            p.vx = (Math.random() - 0.5) * 12;
            p.vy = (Math.random() - 0.5) * 12;
            p.life = 0.8 + Math.random() * 0.7;
            p.color = color;
            p.text = undefined;

            this.activeParticles.push(p);
        }
    }

    emitText(x: number, y: number, text: string, color: string): void {
        if (this.pool.length === 0) return;

        const p = this.pool.pop()!;
        p.x = x;
        p.y = y;
        p.vx = 0;
        p.vy = -2;
        p.life = 1.2;
        p.color = color;
        p.text = text;

        this.activeParticles.push(p);
    }

    render(ctx: CanvasRenderingContext2D): void {
        if (this.activeParticles.length === 0) return;

        const originalAlpha = ctx.globalAlpha;

        // 1. Render Shapes
        // On Mobile, we use Squares (fillRect) which is much faster than Arcs
        for (const p of this.activeParticles) {
            if (p.text) continue;

            const size = Math.max(0, (this.isMobile ? 3 : 4) * p.life);
            ctx.globalAlpha = Math.min(1.0, p.life);
            ctx.fillStyle = p.color;

            if (this.isMobile) {
                // Optimized Square rendering for mobile
                ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
            } else {
                // High-quality Circles for PC
                ctx.beginPath();
                ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // 2. Render Text
        ctx.font = '700 18px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';

        for (const p of this.activeParticles) {
            if (!p.text) continue;
            ctx.globalAlpha = Math.min(1.0, p.life);
            ctx.fillStyle = p.color;
            ctx.fillText(p.text, p.x, p.y);
        }

        ctx.globalAlpha = originalAlpha;
    }

    clear(): void {
        while (this.activeParticles.length > 0) {
            this.pool.push(this.activeParticles.pop()!);
        }
    }
}
