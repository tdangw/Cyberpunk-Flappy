import type { Particle } from '../types';

/**
 * Particle system for visual effects
 */
export class ParticleSystem {
    private particles: Particle[] = [];

    update(speedOffset: number): void {
        this.particles.forEach((p) => {
            p.x += p.vx - speedOffset * 0.5;
            p.y += p.vy;
            p.life -= 0.02;
        });

        // Remove dead particles
        this.particles = this.particles.filter((p) => p.life > 0);
    }

    emit(x: number, y: number, count: number, color: string): void {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x,
                y,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                life: 1,
                color,
            });
        }
    }

    render(ctx: CanvasRenderingContext2D): void {
        this.particles.forEach((p) => {
            ctx.save();
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }

    clear(): void {
        this.particles = [];
    }
}
