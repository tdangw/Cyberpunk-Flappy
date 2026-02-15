import { CANVAS } from '../config/constants';

class Raindrop {
    x: number = 0; y: number = 0; z: number = 0;
    speed: number = 0; len: number = 0; opacity: number = 0;
    color: string = ''; lineWidth: number = 0;

    constructor(w: number, h: number, config: any) {
        this.reset(w, h, config);
    }

    reset(w: number, h: number, config: any) {
        const spread = Math.abs(config.WIND * 60);
        this.z = Math.random() * 0.5 + 0.5;
        this.x = Math.random() * (w + spread) - (config.WIND > 0 ? spread : 0);
        this.y = -Math.random() * h - 50;
        this.speed = (Math.random() * 10 + 10) * this.z * config.FALL_SPEED;
        this.len = (Math.random() * 15 + 10) * this.z * config.LENGTH_MULT;
        this.opacity = (Math.random() * 0.4 + 0.1) * this.z;
        this.color = `rgba(180, 200, 255, ${this.opacity.toFixed(2)})`;
        this.lineWidth = 1.5 * this.z;
    }

    update(config: any, w: number, h: number) {
        this.y += this.speed;
        this.x += config.WIND * this.z;

        if (this.y > h + 20) {
            this.y = -this.len - 20;
            const spread = Math.abs(config.WIND * 60);
            this.x = Math.random() * (w + spread) - (config.WIND > 0 ? spread : 0);
        }
    }
}

export class WeatherSystem {
    private ctx: CanvasRenderingContext2D;
    private rainParticles: Raindrop[] = [];
    private starCache: HTMLCanvasElement | null = null;

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
        this.createStarCache();
    }

    private createStarCache(): void {
        const size = 16;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        grad.addColorStop(0, '#fff');
        grad.addColorStop(0.3, 'rgba(186, 230, 253, 0.8)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.fill();
        this.starCache = canvas;
    }

    public drawRain(_frames: number): void {
        const CONFIG = {
            RAIN_COUNT: 25,
            WIND: -2,
            FALL_SPEED: 1.0,
            LENGTH_MULT: 1.0
        };

        if (this.rainParticles.length !== CONFIG.RAIN_COUNT) {
            this.rainParticles = [];
            for (let i = 0; i < CONFIG.RAIN_COUNT; i++) {
                this.rainParticles.push(new Raindrop(CANVAS.WIDTH, CANVAS.HEIGHT, CONFIG));
            }
        }

        const ctx = this.ctx;
        ctx.save();
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#fff';

        for (const p of this.rainParticles) {
            p.update(CONFIG, CANVAS.WIDTH, CANVAS.HEIGHT);
            ctx.globalAlpha = 0.4;
            ctx.beginPath();
            ctx.lineWidth = 1;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x + (CONFIG.WIND * 0.2), p.y + p.len);
            ctx.stroke();
        }
        ctx.globalAlpha = 1.0;
        ctx.restore();
    }

    public drawStorm(frames: number): void {
        const LIGHTNING_FREQ = 1;
        this.drawRain(frames);

        if (Math.random() < (LIGHTNING_FREQ / 1200)) {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.15 + 0.05})`;
            this.ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);
        }
    }

    public drawSmoke(frames: number): void {
        const ctx = this.ctx;
        ctx.fillStyle = '#505050';
        const timeSc = frames * 0.05;

        for (let i = 0; i < 15; i++) {
            const yOffset = ((frames * 1.5) + (i * 60)) % CANVAS.HEIGHT;
            const y = CANVAS.HEIGHT - yOffset;
            const x = (i * 70 + Math.sin(timeSc + i) * 30) % CANVAS.WIDTH;

            const opacity = Math.max(0, 1 - (yOffset / (CANVAS.HEIGHT * 0.8)));
            ctx.globalAlpha = opacity * 0.2;

            const size = 3 + Math.sin(i) * 2;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;
    }

    public drawAsh(frames: number): void {
        const ctx = this.ctx;
        ctx.fillStyle = '#646464';
        ctx.globalAlpha = 0.5;
        for (let i = 0; i < 40; i++) {
            const x = (i * 99 + Math.sin(frames * 0.05) * 20) % CANVAS.WIDTH;
            const y = (i * 77 + frames * 1.5) % CANVAS.HEIGHT;
            ctx.fillRect(x, y, 2.5, 2.5);
        }
        ctx.globalAlpha = 1.0;
    }

    public drawStars(frames: number): void {
        const ctx = this.ctx;
        ctx.fillStyle = '#fff';
        const starCount = 80;
        for (let i = 0; i < starCount; i++) {
            const seedX = i * 437.58;
            const seedY = i * 123.45;
            const x = (Math.abs(Math.sin(seedX) * 100000) % CANVAS.WIDTH);
            const y = (Math.abs(Math.sin(seedY) * 100000) % CANVAS.HEIGHT);

            ctx.globalAlpha = 0.2 + (Math.abs(Math.cos(i + frames * 0.02)) * 0.5);
            const size = (i % 5 === 0) ? 1.5 : 0.8;
            ctx.fillRect(x, y, size, size);
        }
        ctx.globalAlpha = 1.0;
    }

    public drawShootingStars(frames: number): void {
        this.ctx.save();
        const mainInterval = 1400;
        const showerSeed = Math.floor(frames / mainInterval);
        const numStars = 1 + (showerSeed % 3);

        for (let i = 0; i < numStars; i++) {
            const starOffset = i * 80;
            const cycle = (frames + starOffset) % mainInterval;
            const duration = 550;

            if (cycle < duration) {
                const seed = showerSeed + i;
                const progress = cycle / duration;
                const travelDist = 3200;

                const startX = (Math.abs(Math.sin(seed * 88.8) * (CANVAS.WIDTH + 1500))) - 200;
                const startY = (Math.abs(Math.sin(seed * 44.4) * CANVAS.HEIGHT * 0.3)) - 350;

                const curX = startX - progress * travelDist;
                const curY = startY + progress * (travelDist * 0.55);

                const size = 0.6 + (i % 3) * 0.4;
                const trailLength = 150 + (i % 2) * 100;

                const trailX = curX + trailLength;
                const trailY = curY - (trailLength * 0.55);

                if (curX > -500 && curX < CANVAS.WIDTH + 500) {
                    const grad = this.ctx.createLinearGradient(curX, curY, trailX, trailY);
                    const baseAlpha = 0.5 + (i % 2) * 0.2;
                    grad.addColorStop(0, `rgba(255, 255, 255, ${baseAlpha})`);
                    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

                    this.ctx.strokeStyle = grad;
                    this.ctx.lineWidth = size * 0.8;
                    this.ctx.lineCap = 'round';
                    this.ctx.beginPath();
                    this.ctx.moveTo(curX, curY);
                    this.ctx.lineTo(trailX, trailY);
                    this.ctx.stroke();

                    this.ctx.fillStyle = `rgba(255, 255, 255, ${baseAlpha})`;
                    this.ctx.beginPath();
                    this.ctx.arc(curX, curY, size * 0.5, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
        }
        this.ctx.restore();
    }

    public drawCosmicNebula(frames: number): void {
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'screen';
        const time = frames * 0.002;

        const drawCloud = (x: number, y: number, r: number, color1: string) => {
            const grad = this.ctx.createRadialGradient(x, y, 0, x, y, r);
            grad.addColorStop(0, color1);
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            this.ctx.fillStyle = grad;
            this.ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);
        };

        drawCloud(400 + Math.sin(time) * 100, 200, 600, 'rgba(29, 78, 216, 0.4)');
        drawCloud(1000 + Math.cos(time * 0.8) * 150, 400, 700, 'rgba(30, 58, 138, 0.3)');
        drawCloud(600 + Math.sin(time * 1.2) * 200, 500, 500, 'rgba(88, 28, 135, 0.2)');
        drawCloud(200 + Math.cos(time * 1.6) * 120, 100, 400, 'rgba(6, 182, 212, 0.15)');

        this.ctx.restore();
        this.drawGlowingStars(frames);
    }

    public drawGlowingStars(frames: number): void {
        const ctx = this.ctx;
        const starCount = 120;
        const useCache = !!this.starCache;

        for (let i = 0; i < starCount; i++) {
            const seedX = i * 129.1 + 437.5;
            const seedY = i * 311.7 + 123.4;
            const x = (Math.abs(Math.sin(seedX) * 43758.5453) % 1) * CANVAS.WIDTH;
            const y = (Math.abs(Math.sin(seedY) * 43758.5453) % 1) * CANVAS.HEIGHT;

            const twinkle = 0.3 + (Math.abs(Math.sin(frames * 0.03 + i)) * 0.7);
            const isLarge = i % 15 === 0;
            const size = isLarge ? 2.5 : (i % 4 === 0 ? 1.2 : 0.6);

            if (isLarge && useCache) {
                ctx.globalAlpha = twinkle;
                const glowSize = 16;
                ctx.drawImage(this.starCache!, x - glowSize / 2, y - glowSize / 2, glowSize, glowSize);
            } else {
                ctx.globalAlpha = twinkle;
                ctx.fillStyle = '#fff';
                ctx.fillRect(x, y, size, size);
            }
        }
        ctx.globalAlpha = 1.0;
    }

    public drawClouds(distanceTraveled: number, isSunny: boolean = false): void {
        this.ctx.fillStyle = isSunny ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.15)';
        const totalWidth = CANVAS.WIDTH + 400;
        for (let i = 0; i < 5; i++) {
            const offset = distanceTraveled * 0.15;
            const pos = (i * 450) - offset;
            const wrappedX = ((pos % totalWidth) + totalWidth) % totalWidth - 200;
            this.drawCloudAt(wrappedX, 50 + i * 80);
        }
    }

    private drawCloudAt(x: number, y: number): void {
        this.ctx.beginPath();
        this.ctx.ellipse(x + 25, y, 40, 20, 0, 0, Math.PI * 2);
        this.ctx.arc(x + 25, y - 10, 25, 0, Math.PI * 2);
        this.ctx.fill();
    }

    public drawSun(frames: number): void {
        const cx = CANVAS.WIDTH - 200;
        const cy = 120;

        this.ctx.save();
        this.ctx.fillStyle = 'rgba(254, 252, 232, 0.9)';
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, 50, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();

        this.ctx.save();
        this.ctx.translate(cx, cy);
        this.ctx.rotate(frames * 0.002);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        const rayCount = 8;
        for (let i = 0; i < rayCount; i++) {
            this.ctx.rotate((Math.PI * 2) / rayCount);
            this.ctx.fillRect(60, -10, 800, 20);
        }
        this.ctx.rotate((Math.PI * 2) / (rayCount * 2));
        this.ctx.fillStyle = 'rgba(255, 241, 118, 0.08)';
        for (let i = 0; i < rayCount; i++) {
            this.ctx.rotate((Math.PI * 2) / rayCount);
            this.ctx.fillRect(60, -5, 400, 10);
        }
        this.ctx.restore();

        const grad = this.ctx.createRadialGradient(cx, cy, 50, cx, cy, 800);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);
    }

    public applySunRays(frames: number): void {
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'overlay';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        for (let i = 0; i < 3; i++) {
            const x = ((i * 500 + frames * 0.2) % (CANVAS.WIDTH + 400)) - 200;
            this.ctx.beginPath();
            this.ctx.moveTo(x, -50);
            this.ctx.lineTo(x + 150, -50);
            this.ctx.lineTo(x - 300, CANVAS.HEIGHT + 50);
            this.ctx.lineTo(x - 500, CANVAS.HEIGHT + 50);
            this.ctx.fill();
        }
        this.ctx.restore();
    }

    public drawUnderwaterEffects(frames: number, distanceTraveled: number): void {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        for (let i = 0; i < 20; i++) {
            const parallax = 0.5;
            const worldX = (i * 300) + (Math.sin(i * 132.5) * 500);
            const loopWidth = CANVAS.WIDTH * 2;
            const scrollOffset = distanceTraveled * parallax;

            let screenX = (worldX - scrollOffset) % loopWidth;
            if (screenX < -50) screenX += loopWidth;

            const y = (CANVAS.HEIGHT + (i * 100) - (frames * (1 + (i % 3) * 0.5))) % (CANVAS.HEIGHT + 50);
            const wiggle = Math.sin(frames * 0.02 + i) * 20;

            this.ctx.beginPath();
            this.ctx.arc(screenX + wiggle, y - 50, 3 + (i % 4), 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            this.ctx.beginPath();
            this.ctx.arc(screenX + wiggle - 1, y - 52, 1, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        }
    }

    public drawUnderwater(frames: number): void {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        for (let i = 0; i < 30; i++) {
            const x = (i * 97) % CANVAS.WIDTH;
            const y = (i * 233 - (frames * 0.8)) % (CANVAS.HEIGHT);
            const r = 2 + Math.sin(frames * 0.05 + i) * 2;
            this.ctx.beginPath(); this.ctx.arc(x, y < 0 ? y + CANVAS.HEIGHT : y, r, 0, Math.PI * 2); this.ctx.fill();
        }
    }
}
