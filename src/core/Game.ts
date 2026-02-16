import type { GameState as GameStateType, GameConfig } from '../types';
import { DEFAULT_CONFIG, CANVAS, COLORS, MAPS } from '../config/constants';
import { Bird } from '../entities/Bird';
import { PipeManager } from '../entities/PipeManager';
import { CoinManager } from '../entities/CoinManager';
import { EnemyManager } from '../entities/EnemyManager';
import { ParticleSystem } from '../entities/ParticleSystem';
import { SkinManager } from '../managers/SkinManager';
import { SaveManager } from '../managers/SaveManager';
import { InputManager } from './InputManager';
import { Renderer } from './Renderer';
import { AudioManager } from '../managers/AudioManager';
import { LevelGenerator } from './LevelGenerator';
import { BOOSTS } from '../config/boosts';
import { GroundDecorationManager } from '../entities/GroundDecorationManager';
import { BackgroundBirdManager } from '../entities/BackgroundBirdManager';
import { CollisionSystem } from '../systems/CollisionSystem';

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
    private startMapIndex = 5; // Default to Sunny Highlands as requested
    private distanceTraveled = 0;
    private isClassicMode = false;

    private config: GameConfig;
    private bird: Bird;
    private pipeManager: PipeManager;
    private coinManager: CoinManager;
    private enemyManager: EnemyManager;
    private particleSystem: ParticleSystem;
    private groundDecorationManager: GroundDecorationManager;
    private backgroundBirdManager: BackgroundBirdManager;

    private skinManager: SkinManager;
    private saveManager: SaveManager;
    private inputManager: InputManager;
    private renderer: Renderer;
    private audioManager: AudioManager;
    private collisionSystem: CollisionSystem;

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
    private abortController = new AbortController();

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: false })!; // Alpha false for performance optimization
        this.canvas.width = CANVAS.WIDTH;
        this.canvas.height = CANVAS.HEIGHT;
        this.config = { ...DEFAULT_CONFIG };

        const signal = this.abortController.signal;

        // Handle Responsive Layout (Aspect Fit)
        this.resize();
        window.addEventListener('resize', () => this.resize(), { signal });

        this.skinManager = SkinManager.getInstance();
        this.saveManager = SaveManager.getInstance();
        this.inputManager = new InputManager();
        this.renderer = new Renderer(this.ctx);
        this.audioManager = AudioManager.getInstance();

        this.bird = new Bird(this.config, () => this.handleGroundCollision());

        this.coinManager = new CoinManager(this.config);
        this.enemyManager = new EnemyManager();
        this.pipeManager = new PipeManager(this.config, this.coinManager, this.enemyManager);

        this.particleSystem = new ParticleSystem();
        this.groundDecorationManager = new GroundDecorationManager();
        this.backgroundBirdManager = new BackgroundBirdManager();
        this.collisionSystem = new CollisionSystem();

        this.setupInput();
        this.setupDebugKeys();

        // Listen for Ground/Pipe Bounce Events
        window.addEventListener('groundBounce', () => {
            this.audioManager.play('jump');
            this.particleSystem.emit(this.bird.x, CANVAS.HEIGHT - CANVAS.GROUND_HEIGHT, 10, '#00fff7');
            this.screenShake = 5;
        }, { signal });
        window.addEventListener('shieldActive', (e: any) => {
            // No sound for pipe sliding as requested
            this.particleSystem.emit(e.detail.x, e.detail.y, 8, COLORS.NEON_BLUE);
        }, { signal });
        window.addEventListener('enemyStomp', (e: any) => {
            this.audioManager.play('jump'); // Play bounce sound for stomp
            this.particleSystem.emit(e.detail.x, e.detail.y, 15, COLORS.NEON_GOLD);
        }, { signal });
        this.setupNitroEvents();
        this.syncNitroToBird();

        // Initialize Map Theme immediately
        this.setStartMap(this.startMapIndex);

        this.audioManager.playBGM();
        this.groundDecorationManager.reset(CANVAS.WIDTH, CANVAS.HEIGHT, CANVAS.GROUND_HEIGHT);
        this.start();
    }

    private setupNitroEvents(): void {
        window.addEventListener('nitroDepleted', () => {
            const boostId = this.saveManager.getEquippedBoostId();
            if (boostId !== 'nitro_default') {
                const count = this.saveManager.getBoostCount(boostId);
                if (count > 0) {
                    // Replenish: use one from inventory and refill the bird's tank
                    this.saveManager.useBoostFromInventory(boostId);

                    const boostDef = BOOSTS.find(b => b.id === boostId);
                    if (boostDef) {
                        this.saveManager.setEquippedBoost(boostId, boostDef.capacity);
                        this.syncNitroToBird();
                        return; // Successfully replenished
                    }
                }
            }

            // Fallback to default if no boosters left or using default
            this.saveManager.setEquippedBoost('nitro_default', 10);
            this.syncNitroToBird();
            this.updateCoinUI();
        });
    }

    public syncNitroToBird(): void {
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

    public requestFullscreen(): void {
        const docEl = document.documentElement as any;
        const request = docEl.requestFullscreen ||
            docEl.webkitRequestFullscreen ||
            docEl.mozRequestFullScreen ||
            docEl.msRequestFullscreen;

        if (request) {
            request.call(docEl).catch((err: any) => {
                console.warn('Fullscreen request failed:', err);
            });
        }
    }

    private resize(): void {
        const aspect = CANVAS.WIDTH / CANVAS.HEIGHT;
        const winW = window.innerWidth;
        const winH = window.innerHeight;
        const winAspect = winW / winH;

        let finalW, finalH;

        if (winAspect > aspect) {
            // Screen is wider than game -> fit by height
            finalH = winH;
            finalW = winH * aspect;
        } else {
            // Screen is taller than game -> fit by width
            finalW = winW;
            finalH = winW / aspect;
        }

        this.canvas.style.width = `${finalW}px`;
        this.canvas.style.height = `${finalH}px`;

        // Center the canvas
        const left = (winW - finalW) / 2;
        const top = (winH - finalH) / 2;

        this.canvas.style.position = 'absolute';
        this.canvas.style.left = `${left}px`;
        this.canvas.style.top = `${top}px`;

        // Sync UI Layer
        const uiLayer = document.querySelector('.ui-layer') as HTMLElement;
        if (uiLayer) {
            uiLayer.style.width = `${finalW}px`;
            uiLayer.style.height = `${finalH}px`;
            uiLayer.style.position = 'absolute';
            uiLayer.style.left = `${left}px`;
            uiLayer.style.top = `${top}px`;
        }
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
            this.pipeManager.update(speed, dtRatio, this.isClassicMode, this.score);
            this.coinManager.update(speed, dtRatio, this.pipeManager.getPipes(), this.state === 'PLAYING' && !this.isClassicMode);
            this.enemyManager.update(speed, dtRatio);

            // Ground Decorations
            if (!this.isClassicMode) {
                this.groundDecorationManager.update(speed, dtRatio, CANVAS.WIDTH, CANVAS.HEIGHT, CANVAS.GROUND_HEIGHT);
                if (this.config.showBackgroundDetails) {
                    this.backgroundBirdManager.update(dtRatio, speed);
                }
            }

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
            if (this.bird.y + this.bird.radius >= CANVAS.HEIGHT - CANVAS.GROUND_HEIGHT) {
                this.handleGroundCollision();
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

    // Collision check delegated to system
    private checkCollisions(): void {
        const result = this.collisionSystem.checkCollisions({
            bird: this.bird,
            pipes: this.pipeManager.getPipes(),
            coins: this.coinManager.getCoins(),
            enemies: this.enemyManager.getEnemies(),
            saveManager: this.saveManager,
            audioManager: this.audioManager,
            particleSystem: this.particleSystem,
            config: this.config,
            score: this.score,
            sessionCoins: this.sessionCoins,
            isClassicMode: this.isClassicMode,
            state: this.state,
            triggerDying: this.triggerDying.bind(this),
            createScorePopup: this.createScorePopup.bind(this),
            updateScoreUI: this.updateScoreUI.bind(this),
            updateCoinUI: this.updateCoinUI.bind(this)
        });

        this.score = result.score;
        this.sessionCoins = result.sessionCoins;
    }

    private createScorePopup(x: number, y: number, text: string): void {
        // We already have particle logic, let's reuse or add a simple particle for score
        this.particleSystem.emitText(x, y, text, COLORS.NEON_GOLD);
        // We could also add a temporary UI element if needed, but particles are lighter
    }

    private triggerDying(): void {
        if (this.state !== 'PLAYING') return;
        this.state = 'DYING';
        this.screenShake = 15;
        this.audioManager.play('hit'); // Sync: Hit Pipe
        this.audioManager.play('die'); // Play Die sound immediately
        this.particleSystem.emit(this.bird.x, this.bird.y, 15, COLORS.NEON_RED);

        // Stop music when dying starts
        this.audioManager.stopBGM();
    }

    private handleGroundCollision(): void {
        if (this.state === 'GAMEOVER') return;

        // NEW: Shield Protection for Ground
        // If bird is invulnerable (has shield aura), allow one bounce
        if (this.bird.isInvulnerable()) {
            this.bird.bounce();

            // If the shield was a "real" one (from stomp/dash), let it persist
            // If it was just a tiny sticky safety, consume it.
            if (this.bird.invulnerableTimer < 15) {
                this.bird.invulnerableTimer = 0;
            }

            if (this.bird.isDashing) {
                // @ts-ignore - access private but needed for logic sync
                this.bird.finishDash();
            }

            this.audioManager.play('hit');
            this.particleSystem.emit(this.bird.x, this.bird.y + this.bird.radius, 15, COLORS.NEON_BLUE);
            return;
        }

        // Play die sound if hitting ground directly (skipped triggerDying)
        if (this.state === 'PLAYING') {
            this.audioManager.play('die');
        }

        this.audioManager.play('hit'); // Sync: Impact Ground
        this.audioManager.stopBGM();
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
        this.coinManager.reset();
        this.enemyManager.reset();

        this.audioManager.startBGM(this.renderer.getThemeMapId());
        this.resumeWithCountdown();
    }

    private render(): void {
        this.renderer.clear();

        // Render distant background BEFORE screen shake/translate
        // This makes stars/nebula/forest feel like a "separate layout"
        this.renderer.drawBackground(this.frames, this.distanceTraveled, this.isClassicMode);

        if (!this.isClassicMode && this.config.showBackgroundDetails) {
            this.backgroundBirdManager.render(this.ctx, this.frames);
        }

        // Draw Start Zone Decoration (Nest, Pad, etc.)
        this.renderer.drawStartZone(this.distanceTraveled);

        this.ctx.save();
        if (this.screenShake > 0 && !this.isClassicMode) {
            this.ctx.translate((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
        }

        this.renderer.drawDistanceMarkers(this.distanceTraveled, this.isClassicMode);
        this.renderer.drawGround(this.frames, this.state === 'PLAYING' ? this.config.speed : 0);

        this.pipeManager.render(this.ctx, this.frames, this.isClassicMode);
        this.coinManager.draw(this.ctx);
        this.enemyManager.draw(this.ctx);

        if (!this.isClassicMode && this.config.showGroundDetails) {
            this.groundDecorationManager.render(this.ctx);
        }

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
        if (!this.isClassicMode) {
            const mapId = this.getMapIdByIndex(this.startMapIndex);
            this.saveManager.updateMapHighScore(mapId, this.score);
            this.saveManager.updateMapMaxDistance(mapId, this.distanceTraveled / 50);
            this.saveManager.addMapCoins(mapId, this.sessionCoins);
        }
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

        // Ensure default nitro is full at start of game
        if (this.saveManager.getEquippedBoostId() === 'nitro_default') {
            this.saveManager.updateBoostRemaining(10); // nitro_default capacity
        }

        this.syncNitroToBird(); // Ensure fresh boost state from save
        this.pipeManager.reset();
        this.coinManager.reset();
        this.enemyManager.reset();
        this.particleSystem.clear();
        this.groundDecorationManager.reset(CANVAS.WIDTH, CANVAS.HEIGHT, CANVAS.GROUND_HEIGHT);
        this.backgroundBirdManager.reset();

        this.updateScoreUI();
        this.updateCoinUI();

        this.audioManager.stopBGM();

        // Re-apply mode settings to ensure consistent state
        this.setGameMode(this.isClassicMode ? 'classic' : 'advance');

        // Force map reset on restart to ensure correct background if switching modes/maps
        this.setStartMap(this.startMapIndex);

        // Notify UI to reset visuals for Start Screen
        window.dispatchEvent(new CustomEvent('showStartScreen'));
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
        this.coinManager.setConfig(this.config);
        this.inputManager.setDashControl(this.config.dashControl);
    }
    getConfig(): GameConfig { return { ...this.config }; }
    getScore(): number { return this.score; }
    getEnergy(): number { return this.bird.energy; }
    getNitroQuantity(): number {
        const boostId = this.saveManager.getEquippedBoostId();
        if (boostId === 'nitro_default') return 0;
        return this.saveManager.getBoostCount(boostId);
    }
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
        // Only play BGM if in START state to avoid restarting it mid-game unnecessarily
        // But initial load needs it.
        if (this.state === 'SPLASH' || this.state === 'START') {
            if (theme.bgm) {
                this.audioManager.playBGM(theme.bgm);
            }
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
            // Force Sunny map for Classic mode
            this.setStartMap(5);
        } else {
            container?.classList.remove('classic-mode');
        }

        // Both modes now use the same core physics configuration for consistency
        // Classic mode just hides the extra UI and visual flair
        // REMOVED: Automatic reset to default config here to allow user settings to persist.
    }

    destroy(): void {
        if (this.rafId) cancelAnimationFrame(this.rafId);
        this.abortController.abort();
        this.inputManager.destroy();
    }
}
