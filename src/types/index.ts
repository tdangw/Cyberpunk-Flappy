/**
 * Core type definitions for Flappy Cyber game
 */

export interface GameConfig {
    speed: number;
    gravity: number;
    jump: number;
    pipeGap: number;
    bgmVolume: number;
    sfxVolume: number;
    bgmEnabled: boolean;
    sfxEnabled: boolean;
}

export interface StageDefinition {
    score: number;
    pipeColor: string;
    skyColor: string;
    groundColor: string;
    pipeStyle: string;
    decorations: string;
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
}

export type GameState = 'START' | 'PLAYING' | 'PAUSED' | 'DYING' | 'GAMEOVER';
