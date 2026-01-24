import type { GameState as GameStateType, GameConfig } from '../types';
import { DEFAULT_CONFIG, CANVAS, COLORS, MAPS } from '../config/constants';
import { Bird } from '../entities/Bird';
import { PipeManager } from '../entities/PipeManager';
import { ParticleSystem } from '../entities/ParticleSystem';
import { SkinManager } from '../managers/SkinManager';
import { SaveManager } from '../managers/SaveManager';
import { InputManager } from './InputManager';
import { Renderer } from './Renderer';
import { AudioManager } from '../managers/AudioManager';

/**
 * Main Game class - orchestrates all game systems
 */
export class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    private state: GameStateType = 'START';
    private frames = 0;
    private score = 0;
    private sessionCoins = 0;
    private lastThemeName = '';
    private startMapIndex = 0;

    private config: GameConfig;
    private bird: Bird;
    private pipeManager: PipeManager;
    private particleSystem: ParticleSystem;

    private skinManager: SkinManager;
    private saveManager: SaveManager;
    private inputManager: InputManager;
    private renderer: Renderer;
    private audioManager: AudioManager;

    private rafId: number | null = null;
    private screenShake = 0;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.canvas.width = CANVAS.WIDTH;
        this.canvas.height = CANVAS.HEIGHT;
        this.config = { ...DEFAULT_CONFIG };

        this.skinManager = SkinManager.getInstance();
        this.saveManager = SaveManager.getInstance();
        this.inputManager = new InputManager();
        this.renderer = new Renderer(this.ctx);
        this.audioManager = AudioManager.getInstance();

        this.bird = new Bird(this.config, () => this.handleGroundCollision());
        this.pipeManager = new PipeManager(this.config);
        this.particleSystem = new ParticleSystem();

        this.setupInput();
        this.audioManager.playBGM();
        this.start();
    }

    private setupInput(): void {
        this.inputManager.setJumpCallback(() => {
            if (this.state === 'START') this.state = 'PLAYING';
            if (this.state === 'PLAYING') {
                this.bird.flap();
                this.audioManager.play('jump');
                this.particleSystem.emit(this.bird.x, this.bird.y, 5, '#fff');
            }
        });

        this.inputManager.setDashStartCallback(() => {
            if (this.state === 'PLAYING') {
                this.bird.startDash();
                this.audioManager.play('dash');
            }
        });

        this.inputManager.setDashEndCallback(() => {
            if (this.state === 'PLAYING') this.bird.stopDash();
        });
    }

    private start(): void { this.loop(); }
    private loop = (): void => { this.update(); this.render(); this.rafId = requestAnimationFrame(this.loop); };

    private update(): void {
        if (this.state === 'PAUSED') return;
        this.frames++;

        if (this.screenShake > 0) this.screenShake--;

        if (this.state === 'PLAYING') {
            this.bird.update();
            const speed = this.bird.isDashing ? this.config.speed * 2.5 : this.config.speed;
            this.pipeManager.update(speed);
            this.particleSystem.update(speed);

            this.renderer.updateTheme(this.score, this.startMapIndex);
            const theme = this.renderer.getCurrentTheme();

            if (this.lastThemeName !== theme.theme) {
                if (this.lastThemeName !== '') {
                    // Bonus Coins every phase change (rewarding progression)
                    this.sessionCoins += 10;
                    this.saveManager.addCoins(10);
                    this.updateCoinUI();
                    this.audioManager.play('coin'); // Reward sound
                    (window as any).uiManager?.showBonus();
                }
                this.lastThemeName = theme.theme;
            }

            this.pipeManager.setColors(theme.pipeColor);
            this.pipeManager.setStyle(theme.pipeStyle || 'cyber');
            this.checkCollisions();

            // Dash Trail
            if (this.bird.isDashing && this.frames % 2 === 0) {
                this.particleSystem.emit(this.bird.x - 10, this.bird.y, 1, 'rgba(255, 255, 255, 0.4)');
            }
        } else if (this.state === 'DYING') {
            this.bird.speed += this.config.gravity;
            this.bird.y += this.bird.speed;
            this.bird.rotation += 0.15;
            this.particleSystem.update(0);

            // Ground check handled via the Bird's callback which calls handleGroundCollision
            if (this.bird.y + this.bird.radius >= CANVAS.HEIGHT - CANVAS.GROUND_HEIGHT) {
                this.handleGroundCollision();
            }
        }
    }

    private checkCollisions(): void {
        const birdRect = {
            t: this.bird.y - this.bird.radius * 0.6,
            b: this.bird.y + this.bird.radius * 0.6,
            l: this.bird.x - this.bird.radius * 0.6,
            r: this.bird.x + this.bird.radius * 0.6,
        };

        this.pipeManager.getPipes().forEach((pipe) => {
            const gapBot = pipe.top + this.config.pipeGap;
            if (birdRect.r > pipe.x && birdRect.l < pipe.x + pipe.w) {
                if (birdRect.t < pipe.top || birdRect.b > gapBot) {
                    if (!this.bird.isInvulnerable()) this.triggerDying();
                }
            }
            if (!pipe.passed && this.bird.x > pipe.x + pipe.w) {
                pipe.passed = true;
                this.score++;
                this.updateScoreUI();
            }
        });

        this.pipeManager.getCoins().forEach((coin) => {
            const dx = this.bird.x - coin.x;
            const dy = this.bird.y - coin.y;
            if (Math.sqrt(dx * dx + dy * dy) < this.bird.radius + coin.r + 5) {
                coin.collected = true;
                this.sessionCoins++;
                this.saveManager.addCoins(1);
                this.audioManager.play('coin');
                this.updateCoinUI();
                this.particleSystem.emit(coin.x, coin.y, 8, COLORS.NEON_GOLD);
            }
        });
    }

    private triggerDying(): void {
        if (this.state !== 'PLAYING') return;
        this.state = 'DYING';
        this.screenShake = 15;
        this.audioManager.play('hit'); // Sync: Hit Pipe
        this.particleSystem.emit(this.bird.x, this.bird.y, 15, COLORS.NEON_RED);

        // Brief delay before fall sound triggers
        setTimeout(() => {
            if (this.state === 'DYING') this.audioManager.play('die'); // FALL SOUND
        }, 250);
    }

    private handleGroundCollision(): void {
        if (this.state === 'GAMEOVER') return;

        this.audioManager.play('hit'); // Sync: Impact Ground
        this.gameOver();
    }

    private render(): void {
        this.ctx.save();
        if (this.screenShake > 0) {
            this.ctx.translate((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
        }

        this.renderer.clear();
        this.renderer.drawBackground(this.frames);
        this.renderer.drawGround(this.frames, this.state === 'PLAYING' ? this.config.speed : 0);
        this.pipeManager.render(this.ctx);
        this.particleSystem.render(this.ctx);

        if (this.bird.isDashing) {
            this.renderer.drawDashEffect(this.bird, this.frames);
        }

        this.skinManager.drawSkin(this.ctx, this.saveManager.getEquippedSkin(), this.bird, this.bird.isDashing, this.frames);

        if (this.state === 'START') this.renderer.drawStartMessage();
        this.ctx.restore();
    }

    private gameOver(): void {
        this.state = 'GAMEOVER';
        this.saveManager.updateHighScore(this.score);
        setTimeout(() => {
            if (this.state === 'GAMEOVER') {
                window.dispatchEvent(new CustomEvent('gameOver', { detail: { score: this.score, coins: this.sessionCoins } }));
            }
        }, 800);
    }

    restart(): void {
        this.state = 'START';
        this.score = 0;
        this.sessionCoins = 0;
        this.frames = 0;
        this.lastThemeName = '';
        this.bird.reset();
        this.pipeManager.reset();
        this.particleSystem.clear();
        this.updateScoreUI();
        this.updateCoinUI();
    }

    pause(): void { if (this.state === 'PLAYING') this.state = 'PAUSED'; }
    resume(forceStart = false): void {
        if (this.state === 'PAUSED' || (forceStart && this.state === 'START')) {
            this.state = 'PLAYING';
        }
    }
    updateConfig(newConfig: Partial<GameConfig>): void {
        this.config = { ...this.config, ...newConfig };
        this.bird.setConfig(this.config);
        this.pipeManager.setConfig(this.config);
    }
    getConfig(): GameConfig { return { ...this.config }; }
    getScore(): number { return this.score; }
    getEnergy(): number { return this.bird.energy; }
    getCurrentThemeName(): string { return this.renderer.getCurrentTheme().theme; }
    getState(): GameStateType { return this.state; }
    private updateScoreUI(): void { window.dispatchEvent(new CustomEvent('updateUI')); }
    private updateCoinUI(): void { window.dispatchEvent(new CustomEvent('updateUI')); }

    setStartMap(index: number): void {
        this.startMapIndex = index;
        this.renderer.updateTheme(0, index);
        const theme = this.renderer.getCurrentTheme() as any;
        if (theme.bgm) {
            this.audioManager.playBGM(theme.bgm);
        }
        window.dispatchEvent(new CustomEvent('mapChanged', { detail: { theme } }));
    }

    getMapIdByIndex(index: number): string {
        return MAPS[index]?.id || 'neon';
    }

    resetAllData(): void {
        this.saveManager.resetData();
        this.updateScoreUI();
        this.updateCoinUI();
    }

    destroy(): void { if (this.rafId) cancelAnimationFrame(this.rafId); }
}
