import type { GameConfig } from '../types';

/**
 * Default game configuration values
 */
export const DEFAULT_CONFIG: GameConfig = {
    speed: 4.5,
    gravity: 0.85,
    jump: 15,
    pipeGap: 210,
    pipeSpacing: 250, // Default spacing
    bgmVolume: 0.3,
    sfxVolume: 0.5,
    bgmEnabled: true,
    sfxEnabled: true,
    dashControl: 'button_right',
    showFPS: false,
    showBackgroundDetails: true,
    showGroundDetails: true,
};

export interface StageDefinition {
    score: number;
    pipeColor: string;
    skyColor: string;
    groundColor: string;
    pipeStyle: string;
    decorations: string;
    pipePattern?: string; // Optional for compatibility / new feature
}

export interface MapPalette {
    pipeColors: string[];
    skyColors: string[];
    groundColors: string[]; // Base ground colors
    styles: string[];
    decorations: string[];
    patterns: string[];
}

export interface MapDefinition {
    id: string;
    name: string;
    bgm: string;
    palette: MapPalette;
    isDark?: boolean;
}

export const MAPS: MapDefinition[] = [
    {
        id: 'neon',
        name: 'Neon District',
        bgm: 'bgm_city.mp3',
        isDark: true,
        palette: {
            pipeColors: ['#00fff7', '#ff00ff', '#39ff14', '#ff3333', '#ffd700', '#0099ff', '#ff6600'],
            skyColors: ['#05001a', '#0a0025', '#001a05', '#1a0000', '#1a1a00', '#000000'],
            groundColors: ['#0a0020', '#100030', '#00250a', '#250000', '#252500', '#111'],
            styles: ['cyber', 'neon', 'glitch', 'plasma'],
            decorations: ['buildings', 'pixels', 'shards', 'waves', 'rain', 'storm'],
            patterns: ['circuit', 'plain', 'lines']
        }
    },
    {
        id: 'jungle',
        name: 'Emerald Forest',
        bgm: 'bgm_jungle.mp3',
        palette: {
            // Bright neon-ish pipes to contrast with dark forest
            pipeColors: ['#bef264', '#d9f99d', '#84cc16', '#65a30d'],
            // Deep forest canopy (much lower brightness)
            skyColors: ['#134e4a', '#064e3b', '#065f46'],
            groundColors: ['#022c22', '#064e3b'],
            styles: ['mossy'],
            decorations: ['dense_forest', 'rain-forest', 'rain-forest'],
            patterns: ['plain']
        }
    },
    {
        id: 'ocean',
        name: 'Cyber Ocean',
        bgm: 'bgm_ocean.mp3',
        palette: {
            // Slate and steel greys
            pipeColors: ['#64748b', '#475569', '#94a3b8', '#334155'],
            // Near-white pale blue
            skyColors: ['#f8fafc', '#f1f5f9', '#f0f9ff'],
            groundColors: ['#1e293b', '#0f172a'],
            styles: ['coral'],
            decorations: ['bubbles', 'waves', 'rain', 'storm'],
            patterns: ['plain']
        }
    },
    {
        id: 'volcano',
        name: 'Volcano Core',
        bgm: 'bgm_volcano.mp3',
        palette: {
            // Muted brick and warm greys
            pipeColors: ['#a8a29e', '#78716c', '#d6d3d1', '#57534e'],
            // Near-white warm beige
            skyColors: ['#fafaf9', '#fff7ed', '#fff1f2'],
            groundColors: ['#44403c', '#292524'],
            styles: ['magma'],
            decorations: ['fire', 'smoke', 'rain', 'storm'],
            patterns: ['plain']
        }
    },
    {
        id: 'forge',
        name: 'Star Forge',
        bgm: 'bgm_space.mp3',
        isDark: true,
        palette: {
            pipeColors: ['#ffffff', '#00fff7', '#cbd5e1', '#94a3b8'],
            // Richer Deep Cosmic Blue Gradient
            skyColors: ['#020617', '#030712', '#080a24', '#0c0e33'],
            groundColors: ['#020617', '#000000'],
            styles: ['star_forge'],
            decorations: ['cosmic_nebula', 'glowing_stars', 'shooting_stars', 'rain', 'storm'],
            patterns: ['minimal', 'plain']
        }
    },
    {
        id: 'sunny',
        name: 'Sunny Highlands',
        bgm: 'bgm_sunny.mp3',
        palette: {
            pipeColors: ['#2d5a27', '#4a8c3d', '#73bf2e'],
            skyColors: ['#e0f2fe', '#bae6fd', '#7dd3fc', '#0ea5e9'],
            groundColors: ['#15803d', '#166534'],
            styles: ['classic'],
            decorations: ['clouds', 'highlands', 'clouds', 'highlands', 'clouds', 'highlands', 'rain', 'storm'],
            patterns: ['plain']
        }
    }
];

export const CANVAS = {
    WIDTH: 1280,
    HEIGHT: 720,
    GROUND_HEIGHT: 30,
} as const;

export const COLORS = {
    NEON_PINK: '#ff00ff',
    NEON_BLUE: '#00fff7',
    NEON_GREEN: '#39ff14',
    NEON_RED: '#ff3333',
    NEON_GOLD: '#ffd700',
    BG_DARK: '#090a0f',
} as const;

export const ENERGY = {
    MAX: 100,
    DRAIN_RATE: 1.5,
    RECHARGE_RATE: 0.15,
    STABILIZE_DURATION: 60,
} as const;

export const STORAGE_KEY = 'flappyCyberData';
