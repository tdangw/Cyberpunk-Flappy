import { CANVAS, MAPS } from '../config/constants';
import type { StageDefinition } from '../config/constants';
import { WeatherSystem } from '../systems/WeatherSystem';
import jungleBg from '../assets/forest_bg_wide.jpg';
import neonBg from '../assets/neon_bg_wide.jpg';
import oceanBg from '../assets/ocean_bg_wide.jpg';
import volcanoBg from '../assets/volcano_bg_wide.jpg';

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
            { id: 'jungle', src: jungleBg },
            { id: 'neon', src: neonBg },
            { id: 'ocean', src: oceanBg },
            { id: 'volcano', src: volcanoBg }
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
            // Windows - Only draw detailed windows if it's a dark theme or not the Sunny map
            if (isDark || this.currentTheme.mapId !== 'sunny') {
                ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)';
                for (let wy = cityY - h + 10; wy < cityY - 10; wy += 20) {
                    for (let wx = wrappedX + 10; wx < wrappedX + w - 10; wx += 15) {
                        if (Math.random() > 0.4) ctx.fillRect(wx, wy, 8, 12);
                    }
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
                this.drawStarForgeStart();
                break;
            case 'jungle':
                this.drawLeafNest();
                break;
            case 'ocean':
                this.drawClamShell();
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

        // Arrows indicating forward - SLOWER and optimized for mobile performance
        const slowFactor = 45; // Increased from 15 to reduce visual "jitter" and CPU load
        const arrowOffset = (Date.now() / slowFactor) % 60;
        const pulseSpeed = 600; // Slower pulsing
        const arrowAlpha = 0.4 + Math.sin(Date.now() / pulseSpeed) * 0.4;
        ctx.fillStyle = `rgba(0, 255, 247, ${arrowAlpha})`; // Use Neon Blue

        // Arrow 1
        let x1 = -30 + arrowOffset;
        if (x1 > -40 && x1 < 35) {
            ctx.beginPath();
            ctx.moveTo(x1, 0);
            ctx.lineTo(x1 + 10, 5);
            ctx.lineTo(x1, 10);
            ctx.fill();
        }

        // Arrow 2 (Double Arrow as requested)
        let x2 = -60 + arrowOffset;
        if (x2 > -40 && x2 < 35) {
            ctx.beginPath();
            ctx.moveTo(x2, 0);
            ctx.lineTo(x2 + 10, 5);
            ctx.lineTo(x2, 10);
            ctx.fill();
        }

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

    private drawStarForgeStart() {
        const ctx = this.ctx;
        const time = Date.now() / 1000;

        // 1. ADVANCED STAR PLATFORM (Below Bird) - Based on reference image
        ctx.save();

        // Platform Base Shadow/Body
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.ellipse(0, 5, 60, 18, 0, 0, Math.PI * 2);
        ctx.fill();

        // Outer Magenta Glow Ring
        ctx.strokeStyle = '#f0abfc'; // Pink 300
        ctx.lineWidth = 4;
        ctx.shadowColor = '#d946ef';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.ellipse(0, 0, 55, 15, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Inner Flat Surface (Magenta Tint)
        ctx.fillStyle = 'rgba(217, 70, 239, 0.1)';
        ctx.beginPath();
        ctx.ellipse(0, 0, 55, 15, 0, 0, Math.PI * 2);
        ctx.fill();

        // Central Cyan Core (Radiant)
        const coreGlow = 10 + Math.sin(time * 4) * 5;
        ctx.shadowColor = '#22d3ee';
        ctx.shadowBlur = coreGlow;
        ctx.fillStyle = '#22d3ee';
        ctx.beginPath();
        ctx.ellipse(0, 0, 25, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Internal Core Shine
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(0, 0, 12, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Floating Dust Particles (Rotating) - Optimized for Mobile
        for (let i = 0; i < 6; i++) {
            const angle = time * 0.8 + (i * Math.PI * 2 / 6);
            const dist = 65 + Math.sin(time + i) * 5;
            const px = Math.cos(angle) * dist;
            const py = Math.sin(angle) * (dist / 4) - 5;

            const alpha = 0.4 + Math.sin(time * 2 + i) * 0.4;
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(px, py, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // 2. UFO SAUCER (Higher Above Bird)
        ctx.save();
        const hoverY = -180 + Math.sin(time * 1.5) * 10; // Moved HIGHER
        ctx.translate(0, hoverY);

        // Saucer Dome
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.ellipse(0, -5, 20, 8, 0, Math.PI, 0);
        ctx.fill();
        ctx.stroke();

        // Saucer Main Body
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#94a3b8';
        ctx.beginPath();
        ctx.ellipse(0, 2, 40, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Rim Lights
        const lightCount = 6;
        for (let i = 0; i < lightCount; i++) {
            const angle = (i / lightCount) * Math.PI * 2 + time;
            const lx = Math.cos(angle) * 35;
            const ly = Math.sin(angle) * 6 + 2;
            if (Math.sin(angle) > 0) {
                ctx.fillStyle = '#38bdf8';
                ctx.beginPath(); ctx.arc(lx, ly, 2, 0, Math.PI * 2); ctx.fill();
            }
        }

        // 3. TRACTOR BEAM (Fading out as it reaches the platform)
        const beamGrad = ctx.createLinearGradient(0, 5, 0, 180);
        beamGrad.addColorStop(0, 'rgba(56, 189, 248, 0.5)'); // Top
        beamGrad.addColorStop(0.7, 'rgba(56, 189, 248, 0.2)'); // Bird level
        beamGrad.addColorStop(1, 'rgba(56, 189, 248, 0)'); // Fade to total transparency

        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(-15, 5);
        ctx.lineTo(15, 5);
        ctx.lineTo(45, 180);
        ctx.lineTo(-45, 180);
        ctx.fill();

        ctx.restore();
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

        // Small Leaf on the upper branch (More Realistic)
        ctx.save();
        ctx.translate(-100, -15);
        ctx.rotate(-0.4);

        // Leaf Body with a more natural, pointed shape
        ctx.fillStyle = '#2e7d32';
        ctx.strokeStyle = '#1b5e20'; // Dark Green outline instead of brown
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(5, -12, 25, -12, 35, 0); // Top edge
        ctx.bezierCurveTo(25, 12, 5, 12, 0, 0);   // Bottom edge
        ctx.fill();
        ctx.stroke();

        // Midrib (Vein)
        ctx.strokeStyle = 'rgba(129, 199, 132, 0.4)'; // Matching veinColor with alpha
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(15, 2, 35, 0);
        ctx.stroke();

        ctx.restore();

        ctx.beginPath(); ctx.moveTo(-80, 2); ctx.lineTo(-70, 10); ctx.stroke();

        // Fireflies / Đom đóm (Behind the leaf) - Optimized for Mobile
        const time = Date.now() / 1000;
        ctx.save();
        for (let i = 0; i < 6; i++) {
            const seed = i * 1.5;
            // Smooth natural movement
            const fx = Math.cos(time * 0.8 + seed) * 50;
            const fy = Math.sin(time * 1.2 + seed) * 25 - 15;
            const fPulse = 0.3 + Math.sin(time * 3 + seed) * 0.3;

            ctx.fillStyle = `rgba(168, 255, 120, ${fPulse})`; // Glowy green-yellow
            ctx.shadowColor = '#a8ff78';
            ctx.shadowBlur = 8 * fPulse;
            ctx.beginPath();
            ctx.arc(fx, fy, 1.8, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // Natural Leaf Nest
        // Darker, more natural green (Forest Green)
        const leafColor = '#2e7d32'; // Slightly deeper green
        const veinColor = '#81c784';

        ctx.fillStyle = leafColor;
        ctx.shadowColor = 'rgba(0,0,0,0.2)';
        ctx.shadowBlur = 4;

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

    private drawClamShell() {
        const ctx = this.ctx;
        const time = Date.now() / 1000;

        ctx.save();

        // Shell Style - Classic Pink
        ctx.fillStyle = '#f472b6';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#db2777';
        ctx.shadowBlur = 10;

        // 1. Lower Shell (Base)
        ctx.beginPath();
        ctx.ellipse(0, 15, 45, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 2. The Pearl - Fixed position
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(0, 5, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // 3. Upper Shell (Open Lid)
        // Joint at the bottom-left point
        ctx.translate(-40, 10);
        const openAngle = -0.7 - Math.sin(time * 1.5) * 0.1; // "Breathing" open
        ctx.rotate(openAngle);

        ctx.fillStyle = '#ff9edb'; // Slightly lighter on top
        ctx.beginPath();
        ctx.ellipse(40, 0, 45, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    private drawVolcanoRock() {
        const ctx = this.ctx;

        // Anti-gravity rock shard (SCALED UP)
        ctx.fillStyle = '#1c1917'; // Stone 900
        ctx.shadowColor = '#ef4444'; // Red glow
        ctx.shadowBlur = 15;

        // Larger jagged shape
        ctx.beginPath();
        ctx.moveTo(-50, 0);
        ctx.lineTo(-25, -12);
        ctx.lineTo(25, -6);
        ctx.lineTo(50, 6);
        ctx.lineTo(15, 35);
        ctx.lineTo(-40, 30);
        ctx.closePath();
        ctx.fill();

        // Lava glow vein inside the rock
        const pulse = 0.5 + Math.sin(Date.now() / 400) * 0.5;
        ctx.strokeStyle = `rgba(239, 68, 68, ${pulse})`;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 5;

        ctx.beginPath();
        ctx.moveTo(-35, 10);
        ctx.lineTo(0, 5);
        ctx.lineTo(35, 15);
        ctx.stroke();

        // Heat rising effect (particles) - Optimized for mobile performance
        const t = Date.now();
        ctx.shadowBlur = 0; // Disable blur for small particles on mobile

        for (let i = 0; i < 3; i++) {
            const seed = i * 1234;
            const cycle = 1500; // 1.5s lifespan
            const progress = ((t + seed) % cycle) / cycle;

            // Rise up and fade out
            const px = -20 + (i * 20);
            const py = 20 - (progress * 50); // Rise up
            const pAlpha = (1 - progress) * 0.8;
            const pSize = 2 + (progress * 2);

            ctx.fillStyle = `rgba(239, 68, 68, ${pAlpha})`;
            ctx.fillRect(px, py, pSize, pSize);
        }
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

        // Advanced Branches and Swaying Leaves (Optimized for Mobile)
        const time = Date.now() / 1000;
        ctx.fillStyle = '#4caf50';
        ctx.strokeStyle = '#5d4037';
        ctx.lineWidth = 2;

        const drawBetterLeaf = (x: number, y: number, angle: number) => {
            ctx.save();
            ctx.translate(x, y);
            // GENTLE SWAY: Subtle rotation based on time
            const sway = Math.sin(time * 2 + x) * 0.15;
            ctx.rotate(angle + sway);

            ctx.beginPath();
            ctx.moveTo(0, 0); // Stem base
            ctx.bezierCurveTo(5, -10, 20, -10, 25, 0); // Upper edge
            ctx.bezierCurveTo(20, 10, 5, 10, 0, 0);   // Lower edge
            ctx.fill();
            // Subtle center vein
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(20, 0); ctx.stroke();
            ctx.restore();
        };

        // Branch 1: Natural upwards growth
        ctx.strokeStyle = '#5d4037';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-100, 0);
        ctx.quadraticCurveTo(-90, -15, -70, -25);
        ctx.stroke();
        drawBetterLeaf(-70, -25, -0.8);

        // Branch 2: Sideways extension (Moved further left)
        ctx.beginPath();
        ctx.moveTo(-80, 5);
        ctx.quadraticCurveTo(-65, 0, -55, -8);
        ctx.stroke();
        drawBetterLeaf(-55, -8, -0.4);

        // Branch 3: Small sprout from top
        ctx.beginPath();
        ctx.moveTo(-160, 0);
        ctx.lineTo(-175, -12);
        ctx.stroke();
        drawBetterLeaf(-175, -12, -1.2);

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
