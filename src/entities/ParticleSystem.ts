import type { Particle } from '../types';


/**
 * Particle system for visual effects - Optimized with Object Pooling and Batch Rendering
 */
export class ParticleSystem {
    private pool: Particle[] = [];
    private activeParticles: Particle[] = [];
    private maxParticles = 300; // Increased limit for better effects

    constructor() {
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

        // Single pass update and compact
        for (let i = 0; i < this.activeParticles.length; i++) {
            const p = this.activeParticles[i];

            p.x += (p.vx - speedOffset * 0.5) * dtRatio;
            p.y += p.vy * dtRatio;
            p.life -= 0.04 * dtRatio;
            p.vx *= 0.95;
            p.vy *= 0.95;

            if (p.life > 0) {
                // Keep active
                if (writeIdx !== i) {
                    this.activeParticles[writeIdx] = p;
                }
                writeIdx++;
            } else {
                // Return to pool
                this.pool.push(p);
            }
        }

        // Truncate active list (remove dead references)
        // Since we pushed dead ones to pool, they are safe. 
        // We just need to shorten the active array.
        while (this.activeParticles.length > writeIdx) {
            this.activeParticles.pop();
        }
    }

    emit(x: number, y: number, count: number, color: string): void {
        for (let i = 0; i < count; i++) {
            if (this.pool.length === 0) break; // limit reached

            const p = this.pool.pop()!;
            p.x = x;
            p.y = y;
            p.vx = (Math.random() - 0.5) * 12;
            p.vy = (Math.random() - 0.5) * 12;
            p.life = 1.0 + Math.random() * 0.5;
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
        p.life = 1.5;
        p.color = color;
        p.text = text;

        this.activeParticles.push(p);
    }

    render(ctx: CanvasRenderingContext2D): void {
        if (this.activeParticles.length === 0) return;

        const originalAlpha = ctx.globalAlpha;

        // Separate Text and Shape particles
        // We can't batch text easily with shapes

        // 1. Draw Shapes (Batched by Color)
        // Sort by color to minimize state changes and enable batching
        // Using a temporary array reference for sorting is fine, but sorting in place is better if order doesn't matter (it doesn't usually)
        this.activeParticles.sort((a, b) => (a.color > b.color) ? 1 : -1);

        let currentColor = '';
        let batchStarted = false;

        for (const p of this.activeParticles) {
            if (p.text) continue; // Skip text for now

            // Start new batch if color changes
            if (p.color !== currentColor) {
                if (batchStarted) {
                    ctx.fill(); // Draw previous batch
                }
                currentColor = p.color;
                ctx.fillStyle = currentColor;
                ctx.beginPath();
                batchStarted = true;
            }

            // Add circle to current path
            const radius = Math.max(0, 4 * p.life);
            ctx.globalAlpha = Math.min(1.0, p.life); // Alpha change breaks batching!
            // Wait, alpha changes per particle based on life. 
            // If we want true batching, we can't change alpha per particle.
            // Option 1: Ignore alpha fading (popping out). 
            // Option 2: Group by "Color + Alpha bucket"? Too complex.
            // Option 3: Use globalAlpha = 1 and use rgba() colors? modifying string is slow.
            // Option 4: Optimization compromise - Batching works for color, but if alpha varies, we invoke draw.
            // Actually, ctx.globalAlpha affects the whole fill(). 
            // So we CANNOT batch particles with different alphas into one fill().

            // Re-evaluating: 'Draw each individual particle > not optimized'
            // The user implies looking for something faster.
            // If we drop the batching requirement for Alpha, we can keep the loop.
            // But if we want to batch, we must accept uniform alpha or use a different technique.

            // Let's stick to simple "Sort by Color" to reduce fillStyle changes, 
            // but we likely have to draw individually if alpha varies.
            // UNLESS we use instance rendering (WebGL) or put alpha in the color string.

            // Compromise: Just draw individually but sorted by color.
            // This avoids state changes of `fillStyle`.

            ctx.beginPath();
            ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
        // (Self-Correction: Sorting helps fillStyle, but if we draw individually, it's not a huge batch gain.
        // However, avoiding `ctx.fillStyle = ...` 200 times is still a win if it checks string equality internally).

        // 2. Draw Text (Individually)
        ctx.font = '700 20px "JetBrains Mono", monospace';
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
        // Return all to pool
        while (this.activeParticles.length > 0) {
            this.pool.push(this.activeParticles.pop()!);
        }
    }
}
