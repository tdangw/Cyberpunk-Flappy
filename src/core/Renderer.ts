import { CANVAS, MAPS } from '../config/constants';
import type { StageDefinition } from '../config/constants';
import { WeatherSystem } from '../systems/WeatherSystem';

/**
 * Rendering system for backgrounds and effects
 * Supports infinite stage variations
 */
export class Renderer {
    private ctx: CanvasRenderingContext2D;
    private groundOffset = 0;
    private currentTheme: StageDefinition & { theme: string; mapId: string; bgm: string; isDark: boolean };
    private mapImages: Map<string, HTMLImageElement> = new Map();
    private imagesLoaded: Record<string, boolean> = {};
    private weatherSystem: WeatherSystem;

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
        this.weatherSystem = new WeatherSystem(ctx);
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
            bgm: 'bgm_city.mp3',
            isDark: true
        };

        this.loadMapAssets();
    }

    private loadMapAssets(): void {
        const mapsToLoad = [
            { id: 'jungle', src: '/forest_bg_wide.png' },
            { id: 'neon', src: '/neon_bg_wide.png' },
            { id: 'ocean', src: '/ocean_bg_wide.jpg' },
            { id: 'volcano', src: '/volcano_bg_wide.png' }
        ];

        mapsToLoad.forEach(mapData => {
            const img = new Image();
            img.src = mapData.src;
            img.onload = () => {
                this.mapImages.set(mapData.id, img);
                this.imagesLoaded[mapData.id] = true;
            };
            img.onerror = () => {
                // Silently fail if image doesn't exist yet, it will use procedurals
                console.log(`Dynamic background for ${mapData.id} not found: ${mapData.src}`);
            };
        });
    }

    setTheme(stage: StageDefinition, mapId: string): void {
        const map = MAPS.find(m => m.id === mapId) || MAPS[0];

        this.currentTheme = {
            ...stage,
            mapId: map.id,
            bgm: map.bgm,
            isDark: !!map.isDark,
            theme: `${map.name} - Infinite`
        };
    }

    getCurrentTheme() { return this.currentTheme; }
    getThemeMapId(): string { return this.currentTheme.mapId; }
    clear(): void { this.ctx.clearRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT); }

    drawBackground(frames: number, distanceTraveled: number, isClassicMode: boolean = false): void {
        const isSunny = this.currentTheme.mapId === 'sunny';
        const isDark = this.currentTheme.isDark;

        // Calculate Sky Top based on theme brightness
        let skyTop = isDark ? '#000000' : '#4ec0ca';

        // Specific overrides for improved aesthetics
        if (this.currentTheme.mapId === 'volcano') skyTop = '#fbcfe8'; // Pinkish-red morning
        if (this.currentTheme.mapId === 'forge') skyTop = '#050a1e'; // Deep Cosmic Blue
        if (this.currentTheme.mapId === 'jungle') skyTop = '#022c22'; // Deep Forest Green
        if (this.currentTheme.mapId === 'ocean') skyTop = '#f0f9ff'; // Pale blue

        // Simplified Sky for Classic
        if (isClassicMode) {
            const grad = this.ctx.createLinearGradient(0, 0, 0, CANVAS.HEIGHT);
            grad.addColorStop(0, skyTop);
            grad.addColorStop(1, this.currentTheme.skyColor);
            this.ctx.fillStyle = grad;
            this.ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);

            // Only draw static decorations or simple ones
            if (this.currentTheme.decorations === 'highlands' || isSunny) {
                this.drawHighlands(distanceTraveled);
            } else {
                this.drawBuildings(distanceTraveled, frames);
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
            case 'buildings':
                const isNeon = this.currentTheme.mapId === 'neon';
                if (isNeon && this.mapImages.has('neon')) {
                    this.drawImageBackground(distanceTraveled, frames, 'neon');
                } else {
                    this.drawBuildings(distanceTraveled, frames);
                    this.drawCyberGrid(frames);
                }
                break;
            case 'trees': this.drawTrees(distanceTraveled); break;
            case 'rain-forest': this.drawTrees(distanceTraveled); this.weatherSystem.drawRain(frames); break;
            case 'bubbles':
                if (this.currentTheme.mapId === 'ocean' && this.mapImages.has('ocean')) {
                    this.drawImageBackground(distanceTraveled, frames, 'ocean');
                } else {
                    this.weatherSystem.drawUnderwater(frames);
                }
                break;
            case 'embers': this.drawVolcano(distanceTraveled); break;
            case 'smoke': this.drawVolcano(distanceTraveled); this.weatherSystem.drawSmoke(frames); break;
            case 'ash': this.drawVolcano(distanceTraveled); this.weatherSystem.drawAsh(frames); break;
            case 'cosmic_nebula':
                this.weatherSystem.drawCosmicNebula(frames);
                this.weatherSystem.drawShootingStars(frames);
                break;
            case 'glowing_stars': this.weatherSystem.drawGlowingStars(frames); break;
            case 'stars': this.weatherSystem.drawStars(frames); break;
            case 'shooting_stars':
                this.weatherSystem.drawStars(frames);
                this.weatherSystem.drawShootingStars(frames);
                break;
            case 'dense_forest':
                this.drawImageBackground(distanceTraveled, frames, 'jungle');
                break;
            default:
                const mapId = this.currentTheme.mapId;
                if (mapId !== 'sunny' && mapId !== 'forge' && this.mapImages.has(mapId)) {
                    this.drawImageBackground(distanceTraveled, frames, mapId);
                } else {
                    if (this.currentTheme.decorations === 'buildings') {
                        this.drawBuildings(distanceTraveled, frames);
                        this.drawCyberGrid(frames);
                    }
                }
                break;
            case 'highlands': this.drawHighlands(distanceTraveled); this.weatherSystem.drawClouds(distanceTraveled, isSunny); break;
            case 'rain':
                if (this.currentTheme.mapId === 'ocean') {
                    this.weatherSystem.drawUnderwater(frames);
                } else {
                    this.drawHighlands(distanceTraveled);
                }
                this.weatherSystem.drawRain(frames);
                break;
            case 'storm': this.drawHighlands(distanceTraveled); this.weatherSystem.drawStorm(frames); break;
            case 'clouds': this.drawHighlands(distanceTraveled); this.weatherSystem.drawClouds(distanceTraveled, isSunny); break;
            case 'sun_rays': this.drawHighlands(distanceTraveled); this.weatherSystem.drawSun(frames); this.weatherSystem.drawClouds(distanceTraveled, isSunny); break;
        }
    }

    private drawHighlands(distanceTraveled: number): void {
        const ctx = this.ctx;
        const isDark = this.currentTheme.isDark;
        ctx.fillStyle = isDark ? 'rgba(49, 46, 129, 0.2)' : 'rgba(15, 23, 42, 0.3)';
        const cityY = CANVAS.HEIGHT - 30;
        const bSizes = [120, 180, 100, 220, 150, 190, 110, 200];
        const w = 150;
        const totalWidth = CANVAS.WIDTH + w;

        for (let i = 0; i < 15; i++) {
            const offset = distanceTraveled * 0.1;
            const pos = (i * w) - offset;
            const wrappedX = ((pos % totalWidth) + totalWidth) % totalWidth - w;
            const h = bSizes[i % bSizes.length];

            ctx.fillRect(wrappedX, cityY - h, w + 2, h);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            // Windows
            for (let wy = cityY - h + 10; wy < cityY - 10; wy += 20) {
                for (let wx = wrappedX + 10; wx < wrappedX + w - 10; wx += 15) {
                    if (Math.random() > 0.3) ctx.fillRect(wx, wy, 8, 12);
                }
            }
            ctx.fillStyle = isDark ? 'rgba(49, 46, 129, 0.2)' : 'rgba(15, 23, 42, 0.3)';
        }
    }

    public drawStartZone(distanceTraveled: number): void {
        const startX = 200; // Bird initial X (Center of bird)
        const birdY = 350;  // Bird initial Y
        // Position decoration exactly at bird's feet (Radius approx 16)
        const startY = birdY + 18;

        const drawX = startX - distanceTraveled;

        // Hide if far off-screen (left side)
        if (drawX < -250) return;

        this.ctx.save();
        this.ctx.translate(drawX, startY);

        switch (this.currentTheme.mapId) {
            case 'neon':
                this.drawNeonLaunchpad();
                break;
            case 'forge':
                this.drawUFOPlatform();
                break;
            case 'jungle':
                this.drawLeafNest();
                break;
            case 'ocean':
                this.drawCoralThrone();
                break;
            case 'volcano':
                this.drawVolcanoRock();
                break;
            case 'sunny':
            default:
                this.drawWoodenPerch();
                break;
        }

        this.ctx.restore();
    }

    private drawNeonLaunchpad() {
        const ctx = this.ctx;
        // Neon Style: Floating data platform
        // Floating from Left

        // Energy Stream from left

        ctx.strokeStyle = '#00fff7';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00fff7';
        ctx.shadowBlur = 10;

        // Stream lines
        ctx.beginPath();
        ctx.moveTo(-250, 0); // From far left
        ctx.lineTo(-40, 0);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(0, 255, 247, 0.3)';
        ctx.beginPath(); ctx.moveTo(-250, 5); ctx.lineTo(-50, 5); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-250, -5); ctx.lineTo(-50, -5); ctx.stroke();

        // The Platform (Hexagon-ish)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.strokeStyle = '#ff00ff'; // Magenta accent
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(-40, -5);
        ctx.lineTo(40, -5); // Top flat
        ctx.lineTo(50, 5);
        ctx.lineTo(30, 15);
        ctx.lineTo(-30, 15);
        ctx.lineTo(-50, 5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Arrows indicating forward
        const arrowOffset = (Date.now() / 15) % 20;
        ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + Math.sin(Date.now() / 200) * 0.5})`;
        ctx.beginPath();
        ctx.moveTo(0 + arrowOffset, 0);
        ctx.lineTo(10 + arrowOffset, 5);
        ctx.lineTo(0 + arrowOffset, 10);
        ctx.fill();

        // Vertical stabilizer (hanging down a bit but not to ground)
        ctx.strokeStyle = '#00fff7';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, 15);
        ctx.lineTo(0, 30);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 35, 3, 0, Math.PI * 2);
        ctx.stroke();
    }

    private drawUFOPlatform() {
        // Star Forge: Alien/Tech UFO Saucer
        const ctx = this.ctx;

        // Hover animation
        const t = Date.now() / 500;
        const hoverY = Math.sin(t) * 5;

        ctx.translate(0, hoverY);

        // Saucer Dome (Dark glass)
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 10;

        ctx.beginPath();
        ctx.ellipse(0, -5, 25, 10, 0, Math.PI, 0); // Top dome
        ctx.fill();
        ctx.stroke();

        // Saucer Ring (Main Body)
        ctx.fillStyle = '#1e293b';
        ctx.shadowBlur = 0;
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#94a3b8';

        ctx.beginPath();
        ctx.ellipse(0, 5, 50, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Lights on rim
        const lightCount = 8;
        const rot = (Date.now() / 1000) % (Math.PI * 2);

        for (let i = 0; i < lightCount; i++) {
            const angle = (i / lightCount) * Math.PI * 2 + rot;
            const lx = Math.cos(angle) * 45;
            const ly = Math.sin(angle) * 10 + 5;

            // Only draw front lights or change size/alpha for perspective
            // Simple depth sort: if ly > 5 draw bright, else dim
            const isFront = Math.sin(angle) > 0;

            ctx.fillStyle = isFront ? '#38bdf8' : '#0c4a6e';
            ctx.shadowColor = isFront ? '#38bdf8' : 'transparent';
            ctx.shadowBlur = isFront ? 5 : 0;

            ctx.beginPath();
            ctx.arc(lx, ly, isFront ? 3 : 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Beam Emitter
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.ellipse(0, 15, 10, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Faint Beam going down
        const beamGrad = ctx.createLinearGradient(0, 15, 0, 100);
        beamGrad.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
        beamGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(-10, 15);
        ctx.lineTo(10, 15);
        ctx.lineTo(20, 100);
        ctx.lineTo(-20, 100);
        ctx.fill();
    }

    private drawLeafNest() {
        const ctx = this.ctx;

        // Move the nest up to catch the bird properly
        ctx.translate(0, -20);

        // Branch from Left
        ctx.strokeStyle = '#5d4037'; // Wood color
        ctx.lineWidth = 6; // Slightly thinner
        ctx.lineCap = 'round';
        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.moveTo(-250, 0);
        ctx.quadraticCurveTo(-100, 5, -50, 0); // Curve up slightly
        ctx.stroke();

        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-120, 2); ctx.lineTo(-100, -15); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-80, 2); ctx.lineTo(-70, 10); ctx.stroke();

        // Natural Leaf Nest
        // Darker, more natural green (Forest Green)
        const leafColor = '#388e3c';
        const veinColor = '#81c784'; // Lighter green for veins

        ctx.fillStyle = leafColor;
        // Reduce shadow to avoid glowing look
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 5;

        ctx.beginPath();
        ctx.moveTo(-60, 0);
        // Top rim (Concave) - Draw closer to y=0 to hold bird
        ctx.bezierCurveTo(-30, 20, 30, 20, 60, -5);
        // Bottom belly
        ctx.bezierCurveTo(30, 40, -30, 40, -60, 0);
        ctx.fill();

        // Midrib and Veins
        ctx.strokeStyle = veinColor;
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 0;

        ctx.beginPath();
        // Midrib
        ctx.moveTo(-60, 0);
        ctx.quadraticCurveTo(0, 25, 60, -5);
        ctx.stroke();

        // Veins
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.moveTo(-40, 10); ctx.lineTo(-30, 5);
        ctx.moveTo(-40, 10); ctx.lineTo(-35, 25);
        ctx.moveTo(-10, 20); ctx.lineTo(0, 10);
        ctx.moveTo(-10, 20); ctx.lineTo(0, 30);
        ctx.moveTo(20, 18); ctx.lineTo(30, 8);
        ctx.moveTo(20, 18); ctx.lineTo(25, 28);
        ctx.stroke();
        ctx.globalAlpha = 1.0;

        // Dew drop (less distraction)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(50, -2, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    private drawCoralThrone() {
        const ctx = this.ctx;

        // Floating Coral Ledge

        // Coral Base (Brain coral texture)
        ctx.fillStyle = '#f472b6'; // Pink
        ctx.shadowColor = '#db2777';
        ctx.shadowBlur = 10;

        ctx.beginPath();
        ctx.moveTo(-50, 10);
        ctx.quadraticCurveTo(-20, -5, 0, 0); // Ledge top
        ctx.quadraticCurveTo(20, -5, 40, 10);
        ctx.quadraticCurveTo(0, 40, -50, 10);
        ctx.fill();

        // Texture spots
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath(); ctx.arc(-10, 10, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(15, 15, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(5, 5, 5, 0, Math.PI * 2); ctx.fill();

        // Bubbles from coral
        const t = Date.now() / 1000;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1;
        ctx.shadowBlur = 0;
        ctx.beginPath(); ctx.arc(-20, 10 - (t % 1) * 50, 2, 0, Math.PI * 2); ctx.stroke();
    }

    private drawVolcanoRock() {
        const ctx = this.ctx;

        // Anti-gravity rock shard
        ctx.fillStyle = '#1c1917'; // Stone 900
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 10;

        // Jagged shape
        ctx.beginPath();
        ctx.moveTo(-40, 0);
        ctx.lineTo(-20, -10);
        ctx.lineTo(20, -5);
        ctx.lineTo(40, 5); // Pad
        ctx.lineTo(10, 25);
        ctx.lineTo(-30, 20);
        ctx.closePath();
        ctx.fill();

        // Magma Veins
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-25, 0); ctx.lineTo(-5, 10); ctx.lineTo(15, 5);
        ctx.stroke();

        // Heat distortion hint (particles)
        ctx.fillStyle = 'rgba(239, 68, 68, 0.6)';
        const t = Date.now();
        const yOff = Math.sin(t / 300) * 5; // Floating effect
        ctx.fillRect(-10, 30 + yOff, 4, 4); // Drop of lava?
    }

    private drawWoodenPerch() {
        const ctx = this.ctx;

        // Rustic wooden branch/log from left

        // Main log body (cylinder-ish)
        ctx.fillStyle = '#8d6e63'; // Brown 400
        ctx.strokeStyle = '#5d4037'; // Brown 700
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(-250, 0);
        ctx.lineTo(10, 0);
        ctx.quadraticCurveTo(20, 10, 10, 20); // End cap rounded
        ctx.lineTo(-250, 20);
        ctx.fill();
        ctx.stroke();

        // Log rings texture on end cap
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(10, 10, 5, 10, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#a1887f';
        ctx.fill();
        ctx.strokeStyle = '#5d4037';
        ctx.stroke();
        ctx.restore();

        // Bark texture lines
        ctx.beginPath();
        ctx.moveTo(-80, 5); ctx.lineTo(-50, 5);
        ctx.moveTo(-150, 15); ctx.lineTo(-120, 15);
        ctx.stroke();

        // Hanging moss/vine
        ctx.fillStyle = '#4ade80'; // Bright green
        ctx.beginPath();
        ctx.moveTo(-40, 20);
        ctx.quadraticCurveTo(-35, 30, -30, 20);
        ctx.quadraticCurveTo(-25, 35, -20, 20);
        ctx.fill();

        // Small leaf sprouting
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.ellipse(-10, -2, 8, 4, -0.5, 0, Math.PI * 2);
        ctx.fill();

        // Bird "Sit" Spot shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 0, 15, 3, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    private drawBuildings(distanceTraveled: number, frames: number): void {
        const isDark = this.currentTheme.isDark;
        this.ctx.fillStyle = isDark ? 'rgba(15, 0, 30, 0.6)' : 'rgba(30, 41, 59, 0.25)';
        const w = 150;
        const totalWidth = CANVAS.WIDTH + 200;

        for (let i = 0; i < 10; i++) {
            const offset = distanceTraveled * 0.05;
            const pos = (i * 200) - offset;
            const wrappedX = ((pos % totalWidth) + totalWidth) % totalWidth - 200;

            const h = 200 + Math.sin(i * 2) * 120;
            this.ctx.fillRect(wrappedX, CANVAS.HEIGHT - h - 30, w, h);

            if (isDark) {
                this.ctx.fillStyle = i % 2 === 0 ? '#00fff7' : '#ff00ff';
                this.ctx.globalAlpha = 0.3 + Math.sin(frames * 0.05 + i) * 0.2;
                for (let row = 1; row < 5; row++) {
                    for (let col = 1; col < 3; col++) {
                        if ((i + row + col) % 3 === 0) continue;
                        this.ctx.fillRect(wrappedX + col * 40, CANVAS.HEIGHT - h - 30 + row * 40, 10, 10);
                    }
                }
                this.ctx.globalAlpha = 1.0;
                this.ctx.fillStyle = 'rgba(15, 0, 30, 0.6)';
            }
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

    private drawImageBackground(distanceTraveled: number, frames: number, mapId: string): void {
        const img = this.mapImages.get(mapId);
        if (!img || !this.imagesLoaded[mapId]) return;

        this.ctx.save();
        // Parallax effect: background moves at 10% of foreground speed for depth
        const parallaxFactor = 0.1;
        const totalDistance = distanceTraveled * parallaxFactor;

        const drawHeight = CANVAS.HEIGHT;
        const drawWidth = Math.ceil((img.width / img.height) * drawHeight); // Round up to avoid sub-pixel gaps
        // Use mirroring for ALL maps to ensure seamless edges regardless of the source image
        // unique maps: jungle, neon, ocean, volcano, forge, sunny
        const useMirroring = true;
        const totalX = totalDistance % (drawWidth * (useMirroring ? 2 : 1)); // Double width for mirrored loop

        for (let i = 0; i <= Math.ceil(CANVAS.WIDTH / drawWidth) + 1; i++) {
            const xPos = (i * drawWidth) - totalX;

            this.ctx.save();
            // Mirror every second image for maps that need it
            if (useMirroring && i % 2 !== 0) {
                this.ctx.translate(xPos + drawWidth, 0);
                this.ctx.scale(-1, 1);
                // Draw with 1px overlap on both sides (-1 start, width+2 total)
                this.ctx.drawImage(img, -1, 0, drawWidth + 2, drawHeight);
            } else {
                // Draw with 1px overlap on both sides
                this.ctx.drawImage(img, xPos - 1, 0, drawWidth + 2, drawHeight);
            }
            this.ctx.restore();
        }

        // Apply map-specific atmospheric overlays
        if (mapId === 'jungle') {
            this.weatherSystem.applySunRays(frames);
        } else if (mapId === 'volcano') {
            this.weatherSystem.drawSmoke(frames);
        } else if (mapId === 'ocean') {
            this.weatherSystem.drawUnderwaterEffects(frames, distanceTraveled);
        } else if (mapId === 'neon') {
            this.drawCyberGrid(frames);
        }

        this.ctx.restore();
    }

    private drawTrees(distanceTraveled: number): void {
        this.ctx.fillStyle = 'rgba(0, 30, 0, 0.5)';
        for (let i = 0; i < 12; i++) {
            const offset = distanceTraveled * 0.15;
            const x = (i * 180 - offset) % (CANVAS.WIDTH + 200);
            const h = 250 + Math.sin(i * 3) * 150;
            this.ctx.beginPath();
            this.ctx.moveTo(x < -100 ? x + CANVAS.WIDTH + 300 : x, CANVAS.HEIGHT - 30);
            this.ctx.lineTo((x < -100 ? x + CANVAS.WIDTH + 300 : x) + 40, CANVAS.HEIGHT - h);
            this.ctx.lineTo((x < -100 ? x + CANVAS.WIDTH + 300 : x) + 80, CANVAS.HEIGHT - 30);
            this.ctx.fill();
        }
    }

    private drawVolcano(distanceTraveled: number): void {
        this.ctx.fillStyle = 'rgba(60, 0, 0, 0.4)';
        for (let i = 0; i < 5; i++) {
            const offset = distanceTraveled * 0.1;
            const x = (i * 400 - offset) % (CANVAS.WIDTH + 400);
            const drawX = x < -400 ? x + CANVAS.WIDTH + 800 : x;
            this.ctx.beginPath();
            this.ctx.moveTo(drawX, CANVAS.HEIGHT - 30);
            this.ctx.lineTo(drawX + 200, 300);
            this.ctx.lineTo(drawX + 400, CANVAS.HEIGHT - 30);
            this.ctx.fill();
        }
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
            this.ctx.fillText(`${i} km`, screenX, signY);

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
        this.ctx.fillStyle = this.currentTheme.groundColor;
        this.ctx.fillRect(0, groundY, CANVAS.WIDTH, CANVAS.GROUND_HEIGHT);

        this.ctx.strokeStyle = this.currentTheme.pipeColor;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(0, groundY);
        this.ctx.lineTo(CANVAS.WIDTH, groundY);
        this.ctx.stroke();
    }

    drawStartMessage(): void { }
    drawDashEffect(bird: any, _frames: number): void {
        this.ctx.save();
        this.ctx.strokeStyle = this.currentTheme.pipeColor;
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = 0.5;
        for (let i = 0; i < 5; i++) {
            const l = 100 + Math.random() * 50;
            const yo = (Math.random() - 0.5) * 40;
            this.ctx.beginPath();
            this.ctx.moveTo(bird.x - l, bird.y + yo);
            this.ctx.lineTo(bird.x, bird.y + yo);
            this.ctx.stroke();
        }
        this.ctx.restore();
    }
}
