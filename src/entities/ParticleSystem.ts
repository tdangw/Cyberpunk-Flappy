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
                x, y,
                vx: (Math.random() - 0.5) * 12,
                vy: (Math.random() - 0.5) * 12,
                life: 1.0 + Math.random() * 0.5,
                color,
            });
        }
    }

    emitText(x: number, y: number, text: string, color: string): void {
        // We use a dummy vx/vy for text particles to move up slowly
        this.particles.push({
            x, y,
            vx: 0,
            vy: -2,
            life: 1.5,
            color,
            text
        } as any);
    }

    render(ctx: CanvasRenderingContext2D): void {
        this.particles.forEach((p: any) => {
            ctx.save();
            ctx.globalAlpha = Math.min(1.0, p.life);
            ctx.fillStyle = p.color;

            if (p.text) {
                ctx.font = '700 20px "JetBrains Mono", monospace';
                ctx.textAlign = 'center';
                ctx.fillText(p.text, p.x, p.y);
            } else {
                ctx.beginPath();
                const radius = Math.max(0, 4 * p.life);
                ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        });
    }

    clear(): void {
        this.particles = [];
    }
}
