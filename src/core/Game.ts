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
import { LevelGenerator } from './LevelGenerator';
import { BOOSTS } from '../config/boosts';

/**
 * Main Game class - orchestrates all game systems
 */
export class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    private state: GameStateType = 'SPLASH';
    private frames = 0;
    private score = 0;
    private sessionCoins = 0;
    private lastThemeName = '';
    private startMapIndex = 0;
    private distanceTraveled = 0;
    private isClassicMode = false;

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
    private lastTime = 0;
    private isSafeResuming = false;
    private adReviveUsed = false;
    private paidReviveCount = 0;
    // Perf metrics
    private fps = 60;
    private frameCount = 0;
    private lastFpsUpdate = performance.now();

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
        this.setupDebugKeys();
        this.setupNitroEvents();
        this.syncNitroToBird();
        this.audioManager.playBGM();
        this.start();
    }

    private setupNitroEvents(): void {
        window.addEventListener('nitroDepleted', () => {
            const boostId = this.saveManager.getEquippedBoostId();
            if (boostId !== 'nitro_default') {
                this.saveManager.useBoostFromInventory(boostId);
            }
            this.saveManager.setEquippedBoost('nitro_default', 10);
            this.updateCoinUI(); // Refresh UI if needed
        });
    }

    private syncNitroToBird(): void {
        const boostId = this.saveManager.getEquippedBoostId();
        const remaining = this.saveManager.getBoostRemaining();

        // Find boost details
        const boostDef = BOOSTS.find(b => b.id === boostId) || BOOSTS[0];
        this.bird.setNitroState(
            boostDef.id,
            boostDef.capacity,
            remaining,
            boostDef.rechargeRate || 0
        );
    }

    private setupDebugKeys(): void {
        window.addEventListener('keydown', (e) => {
            if (e.key === '`') {
                this.updateConfig({ showFPS: !this.config.showFPS });
                // Notify UI to update buttons and display
                window.dispatchEvent(new CustomEvent('updateUI'));
            }
        });
    }

    private setupInput(): void {
        this.inputManager.setJumpCallback(() => {
            if (this.state === 'START') {
                this.state = 'PLAYING';
                this.lastTime = performance.now();
                window.dispatchEvent(new CustomEvent('gameStarted'));
            }
            if (this.state === 'PLAYING') {
                this.isSafeResuming = false; // Restore normal speed on action
                this.bird.flap();
                this.audioManager.play('jump');
                if (!this.isClassicMode) {
                    this.particleSystem.emit(this.bird.x, this.bird.y, 5, '#fff');
                }
            } else if (this.state === 'GAMEOVER') {
                // Potential quick restart or UI handle
            }
        });

        this.inputManager.setDashStartCallback(() => {
            if (this.state === 'PLAYING' && !this.isClassicMode) {
                this.isSafeResuming = false; // Restore normal speed on action
                this.bird.startDash();
                this.audioManager.play('dash');
            }
        });

        this.inputManager.setDashEndCallback(() => {
            if (this.state === 'PLAYING') this.bird.stopDash();
        });

        this.inputManager.setEscCallback(() => {
            window.dispatchEvent(new CustomEvent('openSettings'));
        });
    }

    private start(): void {
        this.lastTime = performance.now();
        this.rafId = requestAnimationFrame(this.loop);
    }

    public onSplashPlay(): void {
        if (this.state === 'SPLASH') {
            this.state = 'START';
            this.audioManager.startBGM(this.renderer.getThemeMapId());
        }
    }

    private loop = (timestamp: number): void => {
        let dt = (timestamp - this.lastTime) / 1000;
        if (dt < 0) dt = 0.016; // Fallback for first frame weirdness

        // Safe Resume: Reduce speed by 90%
        if (this.isSafeResuming && this.state === 'PLAYING') {
            dt *= 0.1;
        }

        this.lastTime = timestamp;

        // FPS Calculation
        this.frameCount++;
        if (timestamp - this.lastFpsUpdate >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFpsUpdate = timestamp;
            window.dispatchEvent(new CustomEvent('fpsUpdate', { detail: this.fps }));
        }

        this.update(dt);
        this.render();
        this.rafId = requestAnimationFrame(this.loop);
    };

    // ... (update method unchanged) -> This comment was from previous patch, causing issues.
    // We will consolidate update/render here.

    // ... (render logic moved to bottom)

    private update(dt: number): void {
        if (this.state === 'PAUSED') {
            this.lastTime = performance.now();
            return;
        }

        // Smoother Cap: 0.05s (20fps minimum to avoid huge jumps)
        const safeDt = Math.min(dt, 0.05);
        // Target 60 FPS reference: if dt = 0.016 (60hz), ratio = 1.
        // If dt = 0.007 (144hz), ratio = 0.42.
        const dtRatio = safeDt * 60;

        this.frames++;

        if (this.screenShake > 0) this.screenShake--;

        if (this.state === 'PLAYING') {
            this.bird.update(dtRatio);
            const speed = this.bird.isDashing ? this.config.speed * 2.5 : this.config.speed;

            // Accurate Distance Tracking (pixels)
            // Assuming 50 pixels = 1 meter for gameplay feel
            const moveStep = speed * dtRatio;
            this.distanceTraveled += moveStep;

            // Update pipes with Coin Spawn Flag (Disable coins if classic mode)
            this.pipeManager.update(speed, dtRatio, !this.isClassicMode);

            // Procedural Level Generation
            // Use visual score (passed pipes) for difficulty, but could use distance too
            const mapId = this.getMapIdByIndex(this.startMapIndex);

            // In Classic Mode, we stick to the starting theme and don't progress zones
            const effectiveScore = this.isClassicMode ? 0 : this.score;

            const stageDef = LevelGenerator.getInstance().getStageForScore(effectiveScore, mapId);

            this.renderer.setTheme(stageDef, mapId);
            const theme = this.renderer.getCurrentTheme();

            if (this.lastThemeName !== theme.pipeColor + theme.decorations) {
                if (this.lastThemeName !== '') {
                    // Bonus Coins every phase change (rewarding progression)
                    this.sessionCoins += 10;
                    this.saveManager.addCoins(10);
                    this.updateCoinUI();
                    this.audioManager.play('coin');
                    window.dispatchEvent(new CustomEvent('phaseReward'));
                }
                this.lastThemeName = theme.pipeColor + theme.decorations;
            }

            this.pipeManager.setColors(theme.pipeColor);
            this.pipeManager.setStyle(theme.pipeStyle || 'cyber');
            this.checkCollisions();

            // Dash Trail
            if (this.bird.isDashing && this.frames % 2 === 0) {
                this.particleSystem.emit(this.bird.x - 10, this.bird.y, 1, 'rgba(255, 255, 255, 0.4)');
            }
        } else if (this.state === 'DYING') {
            this.bird.updateFall(dtRatio);

            if (this.bird.y + this.bird.radius >= CANVAS.HEIGHT - CANVAS.GROUND_HEIGHT) {
                this.handleGroundCollision();
            }
        }

        // Update particles regardless of state (so explosions play out)
        // Use active speed if playing, else 0 (or small drift)
        const particleSpeed = this.state === 'PLAYING' ? this.config.speed : 0;
        this.particleSystem.update(particleSpeed, dtRatio);
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
                    if (this.bird.isInvulnerable()) {
                        // Sticky Invulnerability:
                        // If the safety timer is running out but we are STILL inside a pipe hazard,
                        // extend the timer slightly to ensure we don't die instantly upon appearing.
                        // This allows the "Anti-Drop" pop to carry us out of danger.
                        if (!this.bird.isDashing && this.bird.getInvulnerableTimer() < 5) {
                            this.bird.extendInvulnerability(5);
                        }
                    } else {
                        this.triggerDying();
                    }
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

        // Stop music when dying starts
        this.audioManager.setBGMEnabled(false);
    }

    private handleGroundCollision(): void {
        if (this.state === 'GAMEOVER') return;

        this.audioManager.play('hit'); // Sync: Impact Ground
        this.audioManager.play('die'); // Game over sound
        this.audioManager.setBGMEnabled(false);
        this.gameOver();
    }

    public revive(type: 'ad' | 'paid'): void {
        if (this.state !== 'GAMEOVER') return;

        if (type === 'ad') {
            this.adReviveUsed = true;
        } else {
            this.paidReviveCount++;
        }

        this.state = 'START';
        this.bird.resetStateForRevive();
        this.pipeManager.clearNearPipes(this.bird.x);
        this.audioManager.setBGMEnabled(true);
        this.resumeWithCountdown();
    }

    private render(): void {
        this.ctx.save();
        if (this.screenShake > 0 && !this.isClassicMode) {
            this.ctx.translate((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
        }

        this.renderer.clear();

        // Pass Classic flags to renderer
        this.renderer.drawBackground(this.frames, this.isClassicMode);
        this.renderer.drawDistanceMarkers(this.distanceTraveled, this.isClassicMode);
        this.renderer.drawGround(this.frames, this.state === 'PLAYING' ? this.config.speed : 0);

        this.pipeManager.render(this.ctx);

        // Particles now allowed in Classic (vFX requested for collisions)
        this.particleSystem.render(this.ctx);

        if (this.bird.isDashing && !this.isClassicMode) {
            this.renderer.drawDashEffect(this.bird, this.frames);
        }

        // Classic = Default Bird, Advance = Equipped Skin
        if (this.isClassicMode) {
            // Draw default simple bird (yellow/basic)
            this.skinManager.drawSkin(this.ctx, 'default', this.bird, false, this.frames);
        } else {
            this.skinManager.drawSkin(this.ctx, this.saveManager.getEquippedSkin(), this.bird, this.bird.isDashing, this.frames);
        }

        if (this.state === 'START') this.renderer.drawStartMessage();

        // Distance Counter (Lower Right Corner)
        // 50 pixels = 1 meter
        if (!this.isClassicMode) {
            const distance = Math.floor(this.distanceTraveled / 50);
            this.ctx.save();
            this.ctx.font = '14px "Segoe UI", Arial, sans-serif'; // Regular weight, normal size
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.textAlign = 'right';
            this.ctx.shadowBlur = 0; // No Shadow
            // Added space as requested: "0 m" instead of "0m"
            this.ctx.fillText(`${distance} m`, CANVAS.WIDTH - 10, CANVAS.HEIGHT - 10);
            this.ctx.restore();
        }

        this.ctx.restore();
    }

    private gameOver(): void {
        this.state = 'GAMEOVER';
        this.saveManager.updateHighScore(this.score, this.isClassicMode);
        this.saveManager.updateBoostRemaining(this.bird.nitroRemaining);

        const currentDist = Math.floor(this.distanceTraveled / 50);
        if (!this.isClassicMode) {
            this.saveManager.updateMaxDistance(currentDist);
        }

        setTimeout(() => {
            if (this.state === 'GAMEOVER') {
                const canAdRevive = !this.adReviveUsed && !this.isClassicMode;
                const canQuickRevive = this.paidReviveCount < 3 && !this.isClassicMode;

                window.dispatchEvent(new CustomEvent('gameOver', {
                    detail: {
                        score: this.score,
                        coins: this.sessionCoins,
                        isClassic: this.isClassicMode,
                        distance: currentDist,
                        bestDistance: this.saveManager.getMaxDistance(),
                        canAdRevive: canAdRevive,
                        canQuickRevive: canQuickRevive
                    }
                }));
            }
        }, 800);
    }

    restart(): void {
        this.state = 'START';
        this.score = 0;
        this.sessionCoins = 0;
        this.adReviveUsed = false;
        this.paidReviveCount = 0;
        this.frames = 0;
        this.distanceTraveled = 0;
        this.lastThemeName = '';
        this.bird.reset();
        this.syncNitroToBird(); // Ensure fresh boost state from save
        this.pipeManager.reset();
        this.particleSystem.clear();
        this.updateScoreUI();
        this.updateCoinUI();

        // Resume music on restart
        this.audioManager.setBGMEnabled(true);

        // Re-apply mode settings to ensure consistent state
        this.setGameMode(this.isClassicMode ? 'classic' : 'advance');
    }

    pause(): void { if (this.state === 'PLAYING') this.state = 'PAUSED'; }
    resume(forceStart = false): void {
        if (this.state === 'PAUSED' || (forceStart && this.state === 'START')) {
            const wasStart = this.state === 'START';
            this.state = 'PLAYING';
            this.lastTime = performance.now(); // Reset time to prevent big DT jump

            // Nếu bắt đầu từ màn hình chờ, thực hiện nhảy ngay lập tức
            if (forceStart && wasStart) {
                this.bird.flap();
                this.audioManager.play('jump');
            }
        }
    }

    resumeWithCountdown(callback?: () => void): void {
        if (this.state !== 'PAUSED') {
            if (callback) callback();
            return;
        }

        window.dispatchEvent(new CustomEvent('startCountdown', {
            detail: {
                onStart: () => {
                    // Game stays paused during the countdown
                },
                onComplete: () => {
                    // Start game in slow-motion mode
                    this.isSafeResuming = true;
                    this.resume();
                    if (callback) callback();
                }
            }
        }));
    }
    updateConfig(newConfig: Partial<GameConfig>): void {
        this.config = { ...this.config, ...newConfig };
        this.bird.setConfig(this.config);
        this.pipeManager.setConfig(this.config);
        this.inputManager.setDashControl(this.config.dashControl);
    }
    getConfig(): GameConfig { return { ...this.config }; }
    getScore(): number { return this.score; }
    getEnergy(): number { return this.bird.energy; }
    getCurrentThemeName(): string { return this.renderer.getCurrentTheme().theme; }
    getState(): GameStateType { return this.state; }
    public getInputManager(): InputManager { return this.inputManager; }
    public isClassic(): boolean { return this.isClassicMode; }
    public getFPS(): number { return this.fps; }
    private updateScoreUI(): void { window.dispatchEvent(new CustomEvent('updateUI')); }
    private updateCoinUI(): void { window.dispatchEvent(new CustomEvent('updateUI')); }

    setStartMap(index: number): void {
        this.startMapIndex = index;
        const mapId = this.getMapIdByIndex(index);
        const stageDef = LevelGenerator.getInstance().getStageForScore(0, mapId);
        this.renderer.setTheme(stageDef, mapId);

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

    setGameMode(mode: 'classic' | 'advance'): void {
        this.isClassicMode = mode === 'classic';
        this.inputManager.setClassicMode(this.isClassicMode);

        // Toggle UI visibility via global class
        const container = document.getElementById('game-container');
        if (this.isClassicMode) {
            container?.classList.add('classic-mode');
        } else {
            container?.classList.remove('classic-mode');
        }

        // Both modes now use the same core physics configuration for consistency
        // Classic mode just hides the extra UI and visual flair
        // REMOVED: Automatic reset to default config here to allow user settings to persist.
    }

    destroy(): void { if (this.rafId) cancelAnimationFrame(this.rafId); }
}
