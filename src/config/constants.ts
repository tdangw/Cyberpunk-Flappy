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
}

export const MAPS: MapDefinition[] = [
    {
        id: 'neon',
        name: 'Neon District',
        bgm: 'bgm_city.mp3',
        palette: {
            pipeColors: ['#00fff7', '#ff00ff', '#39ff14', '#ff3333', '#ffd700', '#0099ff', '#ff6600'],
            skyColors: ['#05001a', '#0a0025', '#001a05', '#1a0000', '#1a1a00', '#000000'],
            groundColors: ['#0a0020', '#100030', '#00250a', '#250000', '#252500', '#111'],
            styles: ['cyber', 'neon', 'glitch', 'plasma'],
            decorations: ['buildings', 'pixels', 'shards', 'waves'],
            patterns: ['circuit', 'plain', 'lines']
        }
    },
    {
        id: 'jungle',
        name: 'Techno Jungle',
        bgm: 'bgm_jungle.mp3',
        palette: {
            pipeColors: ['#39ff14', '#00ff88', '#88ff00', '#ffff00', '#ffbb00', '#00cc44'],
            skyColors: ['#001a05', '#002010', '#101a00', '#1a1a00', '#1a1005', '#052525'],
            groundColors: ['#001000', '#001a08', '#081500', '#151500', '#150a00', '#001515'],
            styles: ['bamboo', 'stone', 'toxic'],
            decorations: ['trees', 'vines', 'slime'], // Removed rain-forest per user request
            patterns: ['rust', 'stripes', 'plain']
        }
    },
    {
        id: 'ocean',
        name: 'Cyber Ocean',
        bgm: 'bgm_ocean.mp3',
        palette: {
            pipeColors: ['#00fff7', '#0088ff', '#0044ff', '#00ffff', '#cc00ff', '#ffffff'],
            skyColors: ['#000a1a', '#000515', '#000210', '#001a1a', '#10001a', '#001020'],
            groundColors: ['#001525', '#000a18', '#000510', '#002525', '#150025', '#002030'],
            styles: ['coral'], // Unified style
            decorations: ['bubbles', 'waves', 'shards', 'rain'],
            patterns: ['hex', 'waves', 'plain']
        }
    },
    {
        id: 'volcano',
        name: 'Volcano Core',
        bgm: 'bgm_volcano.mp3',
        palette: {
            pipeColors: ['#ff3333', '#ff6600', '#ff9900', '#ffcc00', '#ffff00', '#cc0000'],
            skyColors: ['#150000', '#200500', '#2a0a00', '#351000', '#401500', '#250000'],
            groundColors: ['#250000', '#300a00', '#401000', '#501500', '#601a00', '#300000'],
            styles: ['rusty', 'lava', 'magma'],
            decorations: ['embers', 'fire', 'smoke', 'ash'], // Added smoke, ash
            patterns: ['cracks', 'magma', 'plain']
        }
    },
    {
        id: 'forge',
        name: 'Star Forge',
        bgm: 'bgm_space.mp3',
        palette: {
            pipeColors: ['#ffd700', '#ffffff', '#00fff7', '#ff00ff', '#39ff14', '#00aaff'],
            skyColors: ['#050510', '#0a0a20', '#001030', '#100030', '#051505', '#000000'],
            groundColors: ['#101015', '#1a1a25', '#0a2040', '#200a40', '#0a250a', '#111'],
            styles: ['golden', 'crystal', 'laser', 'star-metal'],
            decorations: ['nebula', 'shards', 'stars', 'beams'],
            patterns: ['ornate', 'minimal', 'plain']
        }
    },
    {
        id: 'sunny',
        name: 'Sunny Highlands',
        bgm: 'bgm_sunny.mp3',
        palette: {
            // Highland Greens
            pipeColors: ['#2d5a27', '#4a8c3d', '#73bf2e'],
            // Deeper Sky Blue (Improved contrast for white/blue HUD)
            skyColors: ['#0ea5e9', '#0284c7', '#0369a1'],
            // Grass/Highland Green
            groundColors: ['#15803d', '#166534'],
            styles: ['classic'],
            decorations: ['clouds', 'highlands'],
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
