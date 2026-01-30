/**
 * Core type definitions for Flappy Cyber game
 */

export type DashControlType = 'touch' | 'button_left' | 'button_right';

export interface GameConfig {
    speed: number;
    gravity: number;
    jump: number;
    pipeGap: number;
    bgmVolume: number;
    sfxVolume: number;
    bgmEnabled: boolean;
    sfxEnabled: boolean;
    pipeSpacing: number;
    dashControl: DashControlType;
    showFPS: boolean;
}

export interface StageDefinition {
    score: number;
    pipeColor: string;
    skyColor: string;
    groundColor: string;
    pipeStyle: string;
    decorations: string;
    pipePattern?: string; // Optional for compatibility / new feature
}

export interface MapDefinition {
    id: string;
    name: string;
    bgm: string;
    stages: StageDefinition[];
}

export interface PlayerData {
    coins: number;
    ownedSkins: string[];
    equippedSkin: string;
    highScore?: number;
    classicHighScore?: number;
    equippedBoostId?: string;
    boostRemainingMeters?: number;
    inventoryBoosts: { [key: string]: number };
    maxDistance?: number;
}

export interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
}

export interface Pipe {
    x: number;
    top: number;
    w: number;
    passed: boolean;
    seed: number;
}

export interface Coin {
    x: number;
    y: number;
    r: number;
    collected: boolean;
    wobble: number;
}

export interface GroundEnemy {
    type: 'goomba' | 'snail' | 'bullet';
    x: number;
    y: number;
    vy?: number; // Vertical velocity for falling enemies
    w: number;
    h: number;
    scaleX: number;
    scaleY: number;
    color: string;
    crawlingSpeed: number;
    animFrame: number;
    dead: boolean;
}

export interface SkinDefinition {
    id: string;
    name: string;
    price: number;
    description: string;
    features: string[];
    drawFunction: (
        ctx: CanvasRenderingContext2D,
        bird: BirdState,
        isDashing: boolean,
        frames: number
    ) => void;
}

export interface BirdState {
    x: number;
    y: number;
    speed: number;
    radius: number;
    rotation: number;
    energy: number;
    isDashing: boolean;
    wingAngle: number;
    stabilizeTimer: number;
    invulnerableTimer: number;
    // Boost State Extension
    nitroType?: string;
    nitroRemaining?: number;
    nitroCapacity?: number;
}

export type GameState = 'SPLASH' | 'START' | 'PLAYING' | 'PAUSED' | 'DYING' | 'GAMEOVER';
