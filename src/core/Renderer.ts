import { CANVAS, MAPS } from '../config/constants';
import type { StageDefinition } from '../types';

/**
 * Rendering system for backgrounds and effects
 * Supports infinite stage variations without darkening (keeping colors clear and bright)
 */
export class Renderer {
    private ctx: CanvasRenderingContext2D;
    private groundOffset = 0;
    private currentTheme: StageDefinition & { theme: string; mapId: string; bgm: string };

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
        const baseMap = MAPS[0];
        const baseStage = baseMap.stages[0];
        this.currentTheme = {
            ...baseStage,
            mapId: baseMap.id,
            bgm: baseMap.bgm,
            theme: `${baseMap.name} - Stage 1`
        };
        this.updateTheme(0, 0);
    }

    updateTheme(score: number, startMapIndex: number = 0): void {
        const map = MAPS[startMapIndex] || MAPS[0];

        // Find the appropriate stage from defining data
        let activeStage = map.stages[0];
        for (const stage of map.stages) {
            if (score >= stage.score) {
                activeStage = stage;
            } else {
                break;
            }
        }

        const stageIndex = map.stages.indexOf(activeStage);
        const theme: StageDefinition = { ...activeStage };

        // Procedural wrap-around: If score exceeds 45, cycle through colors without darkening the sky
        const lastDefinedScore = map.stages[map.stages.length - 1].score;
        if (score > lastDefinedScore) {
            const shift = (score - lastDefinedScore) * 0.2;
            const r = Math.floor(127 + 127 * Math.sin(shift));
            const g = Math.floor(127 + 127 * Math.sin(shift + 2));
            const b = Math.floor(127 + 127 * Math.sin(shift + 4));
            theme.pipeColor = `rgb(${r},${g},${b})`;
            // theme.skyColor remains as defined in the last stage to prevent darkening
        }

        this.currentTheme = {
            ...theme,
            mapId: map.id,
            bgm: map.bgm,
            theme: `${map.name} - Stage ${stageIndex + 1}`
        };
    }

    getCurrentTheme() { return this.currentTheme; }
    clear(): void { this.ctx.clearRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT); }

    drawBackground(frames: number): void {
        const isSunny = (this.currentTheme as any).mapId === 'sunny';
        const skyTop = isSunny ? '#a5b4fc' : '#000000'; // Light purple/blue for sunny, black for cyber maps

        const grad = this.ctx.createLinearGradient(0, 0, 0, CANVAS.HEIGHT);
        grad.addColorStop(0, skyTop);
        grad.addColorStop(1, this.currentTheme.skyColor);
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);

        switch (this.currentTheme.decorations) {
            case 'buildings': this.drawBuildings(frames); this.drawCyberGrid(frames); break;
            case 'trees': this.drawTrees(frames); break;
            case 'bubbles': this.drawUnderwater(frames); break;
            case 'embers': this.drawVolcano(frames); break;
            case 'nebula': this.drawStars(frames); break;
            case 'highlands': this.drawHighlands(frames); break;
        }
        this.drawClouds(frames, isSunny);
    }

    private drawHighlands(frames: number): void {
        const ctx = this.ctx;
        // Brighten the city silhouette for daytime
        ctx.fillStyle = 'rgba(49, 46, 129, 0.4)';
        const cityY = CANVAS.HEIGHT - 30;
        const bSizes = [120, 180, 100, 220, 150, 190, 110, 200];

        for (let i = 0; i < 15; i++) {
            const w = 150;
            const x = (i * w - (frames * 0.4)) % (CANVAS.WIDTH + w);
            const h = bSizes[i % bSizes.length];
            ctx.fillRect(x, cityY - h, w + 2, h);
            // Little windows in the silhouette
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.fillRect(x + 20, cityY - h + 20, 20, 20);
            ctx.fillStyle = 'rgba(20, 20, 40, 0.3)';
        }
    }

    private drawBuildings(frames: number): void {
        this.ctx.fillStyle = 'rgba(20, 0, 40, 0.4)';
        for (let i = 0; i < 10; i++) {
            const x = (i * 200 - (frames * 0.2)) % (CANVAS.WIDTH + 200);
            const h = 200 + Math.sin(i * 2) * 120;
            this.ctx.fillRect(x, CANVAS.HEIGHT - h - 30, 150, h);
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
        this.ctx.beginPath(); this.ctx.arc(x, y, 30, 0, Math.PI * 2);
        this.ctx.arc(x + 25, y - 15, 35, 0, Math.PI * 2);
        this.ctx.arc(x + 55, y, 30, 0, Math.PI * 2); this.ctx.fill();
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
