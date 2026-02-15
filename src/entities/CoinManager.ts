import type { Coin, Pipe, GameConfig } from '../types';

export class CoinManager {
    private pool: Coin[] = [];
    private activeCoins: Coin[] = [];
    private config: GameConfig;

    constructor(config: GameConfig) {
        this.config = config;
    }

    reset(): void {
        while (this.activeCoins.length > 0) {
            this.pool.push(this.activeCoins.pop()!);
        }
    }

    setConfig(config: GameConfig): void {
        this.config = config;
    }

    public spawn(x: number, y: number): void {
        let coin = this.pool.pop();
        if (!coin) {
            coin = { x: 0, y: 0, r: 12, collected: false, wobble: 0 };
        }
        coin.x = x;
        coin.y = y;
        coin.r = 12;
        coin.collected = false;
        coin.wobble = Math.random() * Math.PI * 2;
        this.activeCoins.push(coin);
    }

    public spawnSafeRandomCoin(pipes: Pipe[], lastPipeX: number): void {
        // Attempt to spawn a coin in a "safe" air spot (between pipes)
        // Similar to original logic but adapted
        const buffer = 150;
        const spawnX = lastPipeX - (Math.random() * 300 + 100);

        // Check if spawnX is safe relative to existing pipes
        let safe = true;
        for (const p of pipes) {
            if (spawnX > p.x - buffer && spawnX < p.x + p.w + buffer) {
                safe = false;
                break;
            }
        }

        if (safe) {
            this.spawn(spawnX, 200 + Math.random() * 300);
        }
    }

    update(speed: number, dtRatio: number, pipes: Pipe[], spawnEnabled: boolean): void {
        let writeIdx = 0;

        for (let i = 0; i < this.activeCoins.length; i++) {
            const c = this.activeCoins[i];
            c.x -= speed * dtRatio;
            c.wobble += 0.03 * dtRatio;

            // Simple Pipe Intersection removal (if coin runs into pipe due to moving platforms or bad spawn)
            let invalid = false;
            // Optimization: Only check pipes nearby (simple spatial check)
            for (const p of pipes) {
                if (p.x > c.x + 50) continue; // Pipe is ahead
                if (p.x + p.w < c.x - 50) continue; // Pipe is behind

                const horizontalOverlap = c.x + c.r > p.x - 5 && c.x - c.r < p.x + p.w + 5;
                if (horizontalOverlap) {
                    const inGap = c.y - c.r > p.top + 5 && c.y + c.r < p.top + this.config.pipeGap - 5;
                    if (!inGap) {
                        invalid = true;
                        break;
                    }
                }
            }

            if (c.collected || invalid || c.x + c.r < 0) {
                // Return to pool
                this.pool.push(c);
            } else {
                // Keep active
                if (writeIdx !== i) {
                    this.activeCoins[writeIdx] = c;
                }
                writeIdx++;
            }
        }

        while (this.activeCoins.length > writeIdx) {
            this.activeCoins.pop();
        }

        // Random Air Spawn
        if (spawnEnabled && Math.random() < 0.005 * dtRatio) {
            // We need lastPipeX to spawn safely behind? 
            // actually default random spawn was just checking safe spot.
            // Pass the set of pipes to check.
            // However, to find "lastPipeX", we need it passed.
            // We'll iterate pipes to find max x.
            let maxX = 0;
            for (const p of pipes) { if (p.x > maxX) maxX = p.x; }
            this.spawnSafeRandomCoin(pipes, maxX);
        }
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = '#ffd700';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;

        for (const c of this.activeCoins) {
            const scale = 1.0 + Math.sin(c.wobble) * 0.1;

            ctx.beginPath();
            ctx.ellipse(c.x, c.y, c.r * scale, c.r, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Shine
            ctx.beginPath();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.arc(c.x - c.r * 0.3, c.y - c.r * 0.3, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffd700'; // Reset
        }
    }

    getCoins(): Coin[] { return this.activeCoins; }
}
