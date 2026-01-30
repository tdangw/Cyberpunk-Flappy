import { CANVAS, MAPS } from '../config/constants';
import type { StageDefinition } from '../config/constants';

/**
 * Rendering system for backgrounds and effects
 * Supports infinite stage variations
 */
export class Renderer {
    private ctx: CanvasRenderingContext2D;
    private groundOffset = 0;
    private currentTheme: StageDefinition & { theme: string; mapId: string; bgm: string };

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
        // Initialize with default values, Game will update immediately on start
        this.currentTheme = {
            score: 0,
            pipeColor: '#00fff7',
            skyColor: '#000',
            groundColor: '#111',
            pipeStyle: 'cyber',
            decorations: 'buildings',
            theme: 'Initializing...',
            mapId: 'neon',
            bgm: 'bgm_city.mp3'
        };
    }

    setTheme(stage: StageDefinition, mapId: string): void {
        const map = MAPS.find(m => m.id === mapId) || MAPS[0];

        // We only update if something changed to avoid thrashing, 
        // though strictly rendering every frame reads these props anyway.
        this.currentTheme = {
            ...stage,
            mapId: map.id,
            bgm: map.bgm,
            theme: `${map.name} - Infinite`
        };
    }

    getCurrentTheme() { return this.currentTheme; }
    getThemeMapId(): string { return this.currentTheme.mapId; }
    clear(): void { this.ctx.clearRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT); }

    drawBackground(frames: number, isClassicMode: boolean = false): void {
        const isSunny = (this.currentTheme as any).mapId === 'sunny';
        let skyTop = isSunny ? '#4ec0ca' : '#000000'; // Classic Cyan

        // Simplified Sky for Classic
        if (isClassicMode) {
            const grad = this.ctx.createLinearGradient(0, 0, 0, CANVAS.HEIGHT);
            grad.addColorStop(0, skyTop);
            grad.addColorStop(1, this.currentTheme.skyColor);
            this.ctx.fillStyle = grad;
            this.ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);

            // Only draw static decorations or simple ones
            if (this.currentTheme.decorations === 'highlands' || isSunny) {
                this.drawHighlands(frames); // Keep city silhouette as it's the map identity
            } else {
                this.drawBuildings(frames);
                this.drawCyberGrid(frames);
            }
            return; // Stop here for Classic
        }

        // ... Standard Advance Logic ...
        // Adaptive Sky for Sunny Storms/Rain
        if (isSunny) {
            const dec = this.currentTheme.decorations;
            if (dec === 'storm' || dec === 'rain') {
                skyTop = '#2c3e50';
            } else if (this.currentTheme.skyColor === '#9ca3af') {
                skyTop = '#6b7280';
            }
        }

        const grad = this.ctx.createLinearGradient(0, 0, 0, CANVAS.HEIGHT);
        grad.addColorStop(0, skyTop);
        grad.addColorStop(1, this.currentTheme.skyColor);
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);

        switch (this.currentTheme.decorations) {
            case 'buildings': this.drawBuildings(frames); this.drawCyberGrid(frames); break;
            case 'trees': this.drawTrees(frames); break;
            case 'rain-forest': this.drawTrees(frames); this.drawRain(frames); break;
            case 'bubbles': this.drawUnderwater(frames); break;
            case 'embers': this.drawVolcano(frames); break;
            case 'smoke': this.drawVolcano(frames); this.drawSmoke(frames); break;
            case 'ash': this.drawVolcano(frames); this.drawAsh(frames); break;
            case 'nebula': this.drawStars(frames); break;
            case 'highlands': this.drawHighlands(frames); this.drawClouds(frames, isSunny); break;
            case 'rain':
                if (this.currentTheme.mapId === 'ocean') {
                    this.drawUnderwater(frames);
                } else {
                    this.drawHighlands(frames);
                }
                this.drawRain(frames);
                break;
            case 'storm': this.drawHighlands(frames); this.drawRain(frames); this.drawStorm(frames); break;
            case 'clouds': this.drawHighlands(frames); this.drawClouds(frames, isSunny); break;
            case 'sun_rays': this.drawHighlands(frames); this.drawSun(frames); this.drawClouds(frames, isSunny); break;
        }
    }

    // State for High-FPS Rain System
    private rainParticles: Raindrop[] = [];

    private drawRain(_frames: number): void {
        const CONFIG = {
            RAIN_COUNT: 30, // Optimized for game background
            WIND: -2,
            FALL_SPEED: 1.0,
            LENGTH_MULT: 1.0
        };

        // Init if needed
        if (this.rainParticles.length !== CONFIG.RAIN_COUNT) {
            this.rainParticles = [];
            for (let i = 0; i < CONFIG.RAIN_COUNT; i++) {
                this.rainParticles.push(new Raindrop(CANVAS.WIDTH, CANVAS.HEIGHT, CONFIG));
            }
        }

        // Draw Loop
        this.ctx.save();
        this.ctx.lineCap = 'round';

        for (const p of this.rainParticles) {
            p.update(CONFIG, CANVAS.WIDTH, CANVAS.HEIGHT);

            this.ctx.beginPath();
            this.ctx.strokeStyle = p.color;
            this.ctx.lineWidth = p.lineWidth;
            this.ctx.moveTo(p.x, p.y);
            this.ctx.lineTo(p.x + (CONFIG.WIND * 0.2), p.y + p.len);
            this.ctx.stroke();
        }

        this.ctx.restore();
    }

    private drawStorm(frames: number): void {
        const LIGHTNING_FREQ = 1; // User config value
        this.drawRain(frames);

        // Optimized Lightning from user code
        // Probability adapted for game loop (assuming 60fps)
        if (Math.random() < (LIGHTNING_FREQ / 1200)) {
            // Flash Effect (Global overlay controlled by CSS if possible, but here via canvas)
            this.ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.15 + 0.05})`; // Very subtle flash
            this.ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);
        }
    }



    private drawSmoke(frames: number): void {
        this.ctx.fillStyle = 'rgba(50, 50, 50, 0.3)'; // Lighter smoke/soot
        const timeSc = frames * 0.05;

        // Draw tiny soot particles instead of big smoke clouds
        for (let i = 0; i < 20; i++) {
            // Rising flow
            const yOffset = ((frames * 1.5) + (i * 50)) % CANVAS.HEIGHT;
            const y = CANVAS.HEIGHT - yOffset;

            // Wiggle x sine wave
            const x = (i * 70 + Math.sin(timeSc + i) * 30) % CANVAS.WIDTH;

            // Fade out near top
            const opacity = Math.max(0, 1 - (yOffset / (CANVAS.HEIGHT * 0.8)));
            this.ctx.fillStyle = `rgba(80, 80, 80, ${opacity * 0.3})`;

            const size = 3 + Math.sin(i) * 2;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    private drawAsh(frames: number): void {
        this.ctx.fillStyle = 'rgba(100, 100, 100, 0.6)';
        for (let i = 0; i < 50; i++) {
            const x = (i * 99 + Math.sin(frames * 0.05) * 20) % CANVAS.WIDTH;
            const y = (i * 77 + frames * 1.5) % CANVAS.HEIGHT;
            this.ctx.fillRect(x, y, 3, 3);
        }
    }

    private drawHighlands(frames: number): void {
        const ctx = this.ctx;
        // Brighten the city silhouette for daytime
        ctx.fillStyle = 'rgba(49, 46, 129, 0.4)';
        const cityY = CANVAS.HEIGHT - 30;
        const bSizes = [120, 180, 100, 220, 150, 190, 110, 200];
        const w = 150;
        const totalWidth = CANVAS.WIDTH + w; // Buffer for smooth wrapping

        for (let i = 0; i < 15; i++) {
            // Calculate base position minus scroll offset
            let x = (i * w - (frames * 0.4));

            // Correct wrapping logic:
            // 1. Modulo by total width (Width + One Element)
            // 2. Add totalWidth before modulo to handle negative numbers correctly
            x = ((x % totalWidth) + totalWidth) % totalWidth;

            // Shift back by width to ensure smooth entry from left if needed
            // But standard wrapping usually goes 0 -> Width.
            // With this logic, x is always [0, totalWidth].
            // To allow drawing "offscreen left" properly, we adjust slightly if we want strictly seamless
            // but [0, totalWidth] range covers the screen [0, 800] since totalWidth is larger.

            // If x is near end, draw it at start too? 
            // Better approach for standard endless scroll:

            const h = bSizes[i % bSizes.length];
            // Adjust x to render slightly offscreen left if needed 
            // (Current logic wraps to 0 when it hits -w, which causes 'pop' if not fully offscreen)
            // We want it to wrap when it is fully OFF screen (x < -w)

            // Simplified standard approach:
            const offset = frames * 0.4;
            const pos = (i * w) - offset;
            const wrappedX = ((pos % totalWidth) + totalWidth) % totalWidth - w;

            ctx.fillRect(wrappedX, cityY - h, w + 2, h);

            // Little windows in the silhouette
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.fillRect(wrappedX + 20, cityY - h + 20, 20, 20);
            ctx.fillStyle = 'rgba(20, 20, 40, 0.3)';
        }
    }

    private drawBuildings(frames: number): void {
        const isSunny = (this.currentTheme as any).mapId === 'sunny';
        // Classic: Greenish/Teal city silhouette
        this.ctx.fillStyle = isSunny ? 'rgba(64, 165, 120, 0.4)' : 'rgba(20, 0, 40, 0.4)';
        const w = 150;
        const totalWidth = CANVAS.WIDTH + 200; // Buffer

        for (let i = 0; i < 10; i++) {
            const offset = frames * 0.2;
            const pos = (i * 200) - offset;
            const wrappedX = ((pos % totalWidth) + totalWidth) % totalWidth - 200;

            const h = 200 + Math.sin(i * 2) * 120;
            this.ctx.fillRect(wrappedX, CANVAS.HEIGHT - h - 30, w, h);
        }
    }

    private drawCyberGrid(frames: number): void {
        this.ctx.save();
        this.ctx.strokeStyle = this.currentTheme.pipeColor;
        this.ctx.globalAlpha = 0.15;
        const gridY = CANVAS.HEIGHT - 30;
        for (let i = 0; i < 20; i++) {
            const x = (i * 80 - (frames * 1.2) % 80) % (CANVAS.WIDTH + 80);
            this.ctx.beginPath(); this.ctx.moveTo(x, gridY); this.ctx.lineTo(CANVAS.WIDTH / 2, CANVAS.HEIGHT); this.ctx.stroke();
        }
        this.ctx.restore();
    }

    private drawTrees(frames: number): void {
        this.ctx.fillStyle = 'rgba(0, 30, 0, 0.5)';
        for (let i = 0; i < 12; i++) {
            const x = (i * 180 - (frames * 0.3)) % (CANVAS.WIDTH + 200);
            const h = 250 + Math.sin(i * 3) * 150;
            this.ctx.beginPath(); this.ctx.moveTo(x, CANVAS.HEIGHT - 30); this.ctx.lineTo(x + 40, CANVAS.HEIGHT - h); this.ctx.lineTo(x + 80, CANVAS.HEIGHT - 30); this.ctx.fill();
        }
    }

    private drawUnderwater(frames: number): void {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        for (let i = 0; i < 30; i++) {
            const x = (i * 97) % CANVAS.WIDTH;
            const y = (i * 233 - (frames * 0.8)) % (CANVAS.HEIGHT);
            const r = 2 + Math.sin(frames * 0.05 + i) * 2;
            this.ctx.beginPath(); this.ctx.arc(x, y < 0 ? y + CANVAS.HEIGHT : y, r, 0, Math.PI * 2); this.ctx.fill();
        }
    }

    private drawVolcano(frames: number): void {
        this.ctx.fillStyle = 'rgba(60, 0, 0, 0.4)';
        for (let i = 0; i < 5; i++) {
            const x = (i * 400 - (frames * 0.2)) % (CANVAS.WIDTH + 400);
            this.ctx.beginPath(); this.ctx.moveTo(x, CANVAS.HEIGHT - 30); this.ctx.lineTo(x + 200, 300); this.ctx.lineTo(x + 400, CANVAS.HEIGHT - 30); this.ctx.fill();
        }
    }

    private drawStars(frames: number): void {
        this.ctx.fillStyle = '#fff';
        for (let i = 0; i < 60; i++) {
            const x = (i * 137) % CANVAS.WIDTH;
            const y = (i * 567) % CANVAS.HEIGHT;
            this.ctx.globalAlpha = 0.5 + Math.sin(frames * 0.05 + i) * 0.5;
            this.ctx.fillRect(x, y, 1.5, 1.5);
        }
        this.ctx.globalAlpha = 1;
    }

    private drawClouds(frames: number, isSunny: boolean = false): void {
        this.ctx.fillStyle = isSunny ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.15)';
        for (let i = 0; i < 5; i++) {
            const x = (i * 450 - (frames * 0.6)) % (CANVAS.WIDTH + 400);
            this.drawCloudAt(x, 50 + i * 80);
        }
    }

    private drawCloudAt(x: number, y: number): void {
        // High Performance Simple Cloud
        // Just one ellipse + one circle instead of 3 overlapping complex arcs
        this.ctx.beginPath();
        this.ctx.ellipse(x + 25, y, 40, 20, 0, 0, Math.PI * 2);
        this.ctx.arc(x + 25, y - 10, 25, 0, Math.PI * 2);
        this.ctx.fill();
    }

    private drawSun(frames: number): void {
        // Position based on reference image: Top Right, large
        const cx = CANVAS.WIDTH - 200;
        const cy = 120;

        // Sun Core - Pale Yellow/White, distinct circle
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(254, 252, 232, 0.9)'; // Pale yellow
        this.ctx.shadowBlur = 40;
        this.ctx.shadowColor = 'rgba(253, 224, 71, 0.3)'; // Soft yellow glow
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, 50, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        this.ctx.restore();

        // Rays - Geometric, long beams, very subtle rotation
        this.ctx.save();
        this.ctx.translate(cx, cy);
        this.ctx.rotate(frames * 0.002); // Slow rotation

        // Main structural rays
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        const rayCount = 8;
        for (let i = 0; i < rayCount; i++) {
            this.ctx.rotate((Math.PI * 2) / rayCount);
            this.ctx.fillRect(60, -10, 800, 20); // Long rectangular rays
        }

        // Interleaved smaller rays
        this.ctx.rotate((Math.PI * 2) / (rayCount * 2)); // Offset
        this.ctx.fillStyle = 'rgba(255, 241, 118, 0.08)'; // Faint yellow
        for (let i = 0; i < rayCount; i++) {
            this.ctx.rotate((Math.PI * 2) / rayCount);
            this.ctx.fillRect(60, -5, 400, 10);
        }

        this.ctx.restore();

        // Screen Glare / "Sunny Effect" - Global soft overlay
        // Creates the "hazy" look of a bright day
        const grad = this.ctx.createRadialGradient(cx, cy, 50, cx, cy, 800);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);
    }

    drawDistanceMarkers(distanceTraveled: number, isClassicMode: boolean): void {
        if (isClassicMode) return; // Hide markers in Classic Mode

        const PIXELS_PER_KM = 50000;
        const startKm = Math.floor((distanceTraveled - 1000) / PIXELS_PER_KM);
        const endKm = Math.floor((distanceTraveled + CANVAS.WIDTH + 1000) / PIXELS_PER_KM);

        this.ctx.save();
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        for (let i = startKm; i <= endKm; i++) {
            if (i < 0) continue;

            const distPx = i * PIXELS_PER_KM;
            // Align "0km" exactly with Bird's start X (200px)
            const screenX = distPx - distanceTraveled + 200;

            if (screenX < -150 || screenX > CANVAS.WIDTH + 150) continue;

            const groundY = CANVAS.HEIGHT - CANVAS.GROUND_HEIGHT;
            const themeColor = this.currentTheme.pipeColor;

            // --- Pole (Pipe Style) ---
            const poleW = 8;
            const poleH = 70;
            const poleX = screenX - poleW / 2;
            const poleY = groundY - poleH;

            // Pipe Gradient for 3D look
            const grad = this.ctx.createLinearGradient(poleX, 0, poleX + poleW, 0);
            grad.addColorStop(0, '#000');
            grad.addColorStop(0.5, themeColor);
            grad.addColorStop(1, '#000');

            this.ctx.fillStyle = grad;
            this.ctx.fillRect(poleX, poleY, poleW, poleH);

            // --- Sign Board (Hexagon Tech Style) ---
            this.ctx.fillStyle = '#111';
            this.ctx.strokeStyle = themeColor;
            this.ctx.lineWidth = 2;

            const signY = poleY;
            this.ctx.beginPath();
            this.ctx.moveTo(screenX - 35, signY - 15);
            this.ctx.lineTo(screenX + 35, signY - 15);
            this.ctx.lineTo(screenX + 40, signY);
            this.ctx.lineTo(screenX + 35, signY + 15);
            this.ctx.lineTo(screenX - 35, signY + 15);
            this.ctx.lineTo(screenX - 40, signY);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();

            // Text
            this.ctx.fillStyle = '#ffffff'; // White text for visibility
            this.ctx.font = 'bold 12px "JetBrains Mono", monospace';
            this.ctx.shadowBlur = 5;
            this.ctx.shadowColor = themeColor; // Keep glow as theme color
            this.ctx.fillText(`${i} km`, screenX, signY);
            this.ctx.shadowBlur = 0;

            // --- Decorations (Base) ---
            // Simple Rocks (Dark Grey)
            this.ctx.fillStyle = '#333';
            this.ctx.beginPath();
            this.ctx.arc(screenX - 12, groundY, 6, 0, Math.PI, true); // Left Rock
            this.ctx.arc(screenX + 8, groundY, 9, 0, Math.PI, true);  // Right Rock
            this.ctx.fill();

            // Grass/Flowers (Simple Lines)
            this.ctx.strokeStyle = '#4ade80'; // Bright Green
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            // Left Grass
            this.ctx.moveTo(screenX - 20, groundY);
            this.ctx.quadraticCurveTo(screenX - 25, groundY - 10, screenX - 28, groundY - 8);
            // Right Flower Stem
            this.ctx.moveTo(screenX + 15, groundY);
            this.ctx.quadraticCurveTo(screenX + 18, groundY - 15, screenX + 15, groundY - 20);
            this.ctx.stroke();

            // Flower Head
            this.ctx.fillStyle = '#f472b6'; // Pink
            this.ctx.beginPath();
            this.ctx.arc(screenX + 15, groundY - 20, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.restore();
    }

    drawGround(_frames: number, speed: number): void {
        this.groundOffset -= speed;
        if (this.groundOffset <= -100) this.groundOffset = 0;
        const groundY = CANVAS.HEIGHT - CANVAS.GROUND_HEIGHT;
        this.ctx.fillStyle = this.currentTheme.groundColor; this.ctx.fillRect(0, groundY, CANVAS.WIDTH, CANVAS.GROUND_HEIGHT);
        this.ctx.strokeStyle = this.currentTheme.pipeColor; this.ctx.lineWidth = 3;
        this.ctx.beginPath(); this.ctx.moveTo(0, groundY); this.ctx.lineTo(CANVAS.WIDTH, groundY); this.ctx.stroke();
    }

    drawStartMessage(): void { }
    drawDashEffect(bird: any, _frames: number): void {
        this.ctx.save();
        this.ctx.strokeStyle = this.currentTheme.pipeColor; this.ctx.lineWidth = 2; this.ctx.globalAlpha = 0.5;
        for (let i = 0; i < 5; i++) {
            const l = 100 + Math.random() * 50; const yo = (Math.random() - 0.5) * 40;
            this.ctx.beginPath(); this.ctx.moveTo(bird.x - l, bird.y + yo); this.ctx.lineTo(bird.x, bird.y + yo); this.ctx.stroke();
        }
        this.ctx.restore();
    }
}

/**
 * Ported Raindrop Class
 * Optimized for Canvas 2D
 */
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
