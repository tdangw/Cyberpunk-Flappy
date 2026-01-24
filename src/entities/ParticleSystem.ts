import type { Particle } from '../types';

/**
 * Particle system for visual effects
 */
export class ParticleSystem {
    private particles: Particle[] = [];

    update(speedOffset: number, dtRatio: number): void {
        this.particles.forEach((p) => {
            p.x += (p.vx - speedOffset * 0.5) * dtRatio;
            p.y += p.vy * dtRatio;
            p.life -= 0.04 * dtRatio; // Fade out (Faster dissipation)
            // Add gravity/drag for more natural movement (optional but nice)
            p.vx *= 0.95;
            p.vy *= 0.95;
        });

        // Remove dead particles
        this.particles = this.particles.filter((p) => p.life > 0);
    }

    emit(x: number, y: number, count: number, color: string): void {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x,
                y,
                vx: (Math.random() - 0.5) * 12, // Faster explosion
                vy: (Math.random() - 0.5) * 12,
                life: 1.0 + Math.random() * 0.5, // Varied life
                color,
            });
        }
    }

    render(ctx: CanvasRenderingContext2D): void {
        this.particles.forEach((p) => {
            ctx.save();
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.shadowBlur = 10 * p.life; // Blur fades too
            ctx.shadowColor = p.color;
            ctx.beginPath();
            // Shrink as it dies
            const radius = Math.max(0, 4 * p.life);
            ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }

    clear(): void {
        this.particles = [];
    }
}
