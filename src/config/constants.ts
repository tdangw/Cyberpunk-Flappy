import type { GameConfig } from '../types';

/**
 * Default game configuration values
 */
export const DEFAULT_CONFIG: GameConfig = {
    speed: 2,
    gravity: 0.15,
    jump: 6,
    pipeGap: 250,
    bgmVolume: 0.4,
    sfxVolume: 0.6,
    bgmEnabled: true,
    sfxEnabled: true,
};

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

export const MAPS: MapDefinition[] = [
    {
        id: 'neon',
        name: 'Neon District',
        bgm: 'bgm_city.mp3',
        stages: [
            { score: 0, pipeColor: '#00fff7', skyColor: '#05001a', groundColor: '#0a0020', pipeStyle: 'cyber', decorations: 'buildings' },
            { score: 50, pipeColor: '#ff00ff', skyColor: '#0a0025', groundColor: '#100030', pipeStyle: 'cyber', decorations: 'buildings' },
            { score: 100, pipeColor: '#39ff14', skyColor: '#001a05', groundColor: '#00250a', pipeStyle: 'cyber', decorations: 'buildings' },
            { score: 150, pipeColor: '#ff3333', skyColor: '#1a0000', groundColor: '#250000', pipeStyle: 'cyber', decorations: 'buildings' },
            { score: 200, pipeColor: '#ffd700', skyColor: '#1a1a00', groundColor: '#252500', pipeStyle: 'cyber', decorations: 'buildings' },
            { score: 250, pipeColor: '#00ffff', skyColor: '#000000', groundColor: '#111', pipeStyle: 'glitch', decorations: 'pixels' },
            { score: 300, pipeColor: '#ffffff', skyColor: '#0a1a2a', groundColor: '#050a15', pipeStyle: 'crystal', decorations: 'shards' },
            { score: 350, pipeColor: '#ff6600', skyColor: '#1a052a', groundColor: '#100015', pipeStyle: 'neon', decorations: 'clouds' },
            { score: 400, pipeColor: '#cc00ff', skyColor: '#051a2a', groundColor: '#001015', pipeStyle: 'plasma', decorations: 'waves' },
            { score: 450, pipeColor: '#ff0000', skyColor: '#2a0505', groundColor: '#1a0000', pipeStyle: 'lava', decorations: 'fire' }
        ]
    },
    {
        id: 'jungle',
        name: 'Techno Jungle',
        bgm: 'bgm_jungle.mp3',
        stages: [
            { score: 0, pipeColor: '#39ff14', skyColor: '#001a05', groundColor: '#001000', pipeStyle: 'bamboo', decorations: 'trees' },
            { score: 50, pipeColor: '#00ff88', skyColor: '#002010', groundColor: '#001a08', pipeStyle: 'bamboo', decorations: 'trees' },
            { score: 100, pipeColor: '#88ff00', skyColor: '#101a00', groundColor: '#081500', pipeStyle: 'bamboo', decorations: 'trees' },
            { score: 150, pipeColor: '#ffff00', skyColor: '#1a1a00', groundColor: '#151500', pipeStyle: 'bamboo', decorations: 'trees' },
            { score: 200, pipeColor: '#ffbb00', skyColor: '#1a1005', groundColor: '#150a00', pipeStyle: 'stone', decorations: 'vines' },
            { score: 250, pipeColor: '#ff0000', skyColor: '#150000', groundColor: '#250000', pipeStyle: 'rusty', decorations: 'embers' },
            { score: 300, pipeColor: '#00ff00', skyColor: '#1a1a00', groundColor: '#101000', pipeStyle: 'toxic', decorations: 'slime' },
            { score: 350, pipeColor: '#ffffff', skyColor: '#aaccaa', groundColor: '#88aa88', pipeStyle: 'paper', decorations: 'petals' },
            { score: 400, pipeColor: '#00ccff', skyColor: '#1a2a3a', groundColor: '#101a25', pipeStyle: 'ice', decorations: 'snow' },
            { score: 450, pipeColor: '#333333', skyColor: '#050505', groundColor: '#000000', pipeStyle: 'dark', decorations: 'ghosts' }
        ]
    },
    {
        id: 'ocean',
        name: 'Cyber Ocean',
        bgm: 'bgm_ocean.mp3',
        stages: [
            { score: 0, pipeColor: '#00fff7', skyColor: '#000a1a', groundColor: '#001525', pipeStyle: 'coral', decorations: 'bubbles' },
            { score: 50, pipeColor: '#0088ff', skyColor: '#000515', groundColor: '#000a18', pipeStyle: 'coral', decorations: 'bubbles' },
            { score: 100, pipeColor: '#0044ff', skyColor: '#000210', groundColor: '#000510', pipeStyle: 'coral', decorations: 'bubbles' },
            { score: 150, pipeColor: '#00ffff', skyColor: '#001a1a', groundColor: '#002525', pipeStyle: 'coral', decorations: 'bubbles' },
            { score: 200, pipeColor: '#cc00ff', skyColor: '#10001a', groundColor: '#150025', pipeStyle: 'lava', decorations: 'fire' },
            { score: 250, pipeColor: '#ff00ff', skyColor: '#1a001a', groundColor: '#250025', pipeStyle: 'plasma', decorations: 'waves' },
            { score: 300, pipeColor: '#ffffff', skyColor: '#1a2a3a', groundColor: '#101a25', pipeStyle: 'crystal', decorations: 'shards' },
            { score: 350, pipeColor: '#ffd700', skyColor: '#1a1a00', groundColor: '#252500', pipeStyle: 'golden', decorations: 'nebula' },
            { score: 400, pipeColor: '#000a1a', skyColor: '#000', groundColor: '#000', pipeStyle: 'glitch', decorations: 'pixels' },
            { score: 450, pipeColor: '#ff3333', skyColor: '#050000', groundColor: '#100', pipeStyle: 'dark', decorations: 'ghosts' }
        ]
    },
    {
        id: 'volcano',
        name: 'Volcano Core',
        bgm: 'bgm_volcano.mp3',
        stages: [
            { score: 0, pipeColor: '#ff3333', skyColor: '#150000', groundColor: '#250000', pipeStyle: 'rusty', decorations: 'embers' },
            { score: 50, pipeColor: '#ff6600', skyColor: '#200500', groundColor: '#300a00', pipeStyle: 'rusty', decorations: 'embers' },
            { score: 100, pipeColor: '#ff9900', skyColor: '#2a0a00', groundColor: '#401000', pipeStyle: 'rusty', decorations: 'embers' },
            { score: 150, pipeColor: '#ffcc00', skyColor: '#351000', groundColor: '#501500', pipeStyle: 'rusty', decorations: 'embers' },
            { score: 200, pipeColor: '#ffff00', skyColor: '#401500', groundColor: '#601a00', pipeStyle: 'rusty', decorations: 'embers' },
            { score: 250, pipeColor: '#ffffff', skyColor: '#000000', groundColor: '#111', pipeStyle: 'glitch', decorations: 'pixels' },
            { score: 300, pipeColor: '#00ffff', skyColor: '#001a1a', groundColor: '#002525', pipeStyle: 'laser', decorations: 'beams' },
            { score: 350, pipeColor: '#cc00ff', skyColor: '#10001a', groundColor: '#150025', pipeStyle: 'plasma', decorations: 'waves' },
            { score: 400, pipeColor: '#39ff14', skyColor: '#001a05', groundColor: '#00250a', pipeStyle: 'toxic', decorations: 'slime' },
            { score: 450, pipeColor: '#ff0000', skyColor: '#2a0505', groundColor: '#1a0000', pipeStyle: 'lava', decorations: 'fire' }
        ]
    },
    {
        id: 'forge',
        name: 'Star Forge',
        bgm: 'bgm_space.mp3',
        stages: [
            { score: 0, pipeColor: '#ffd700', skyColor: '#050510', groundColor: '#101015', pipeStyle: 'golden', decorations: 'nebula' },
            { score: 50, pipeColor: '#ffffff', skyColor: '#0a0a20', groundColor: '#1a1a25', pipeStyle: 'golden', decorations: 'nebula' },
            { score: 100, pipeColor: '#00fff7', skyColor: '#001030', groundColor: '#0a2040', pipeStyle: 'golden', decorations: 'nebula' },
            { score: 150, pipeColor: '#ff00ff', skyColor: '#100030', groundColor: '#200a40', pipeStyle: 'golden', decorations: 'nebula' },
            { score: 200, pipeColor: '#39ff14', skyColor: '#051505', groundColor: '#0a250a', pipeStyle: 'golden', decorations: 'nebula' },
            { score: 250, pipeColor: '#ffaa00', skyColor: '#150a00', groundColor: '#251500', pipeStyle: 'laser', decorations: 'beams' },
            { score: 300, pipeColor: '#00aaff', skyColor: '#00051a', groundColor: '#000a2a', pipeStyle: 'crystal', decorations: 'shards' },
            { score: 350, pipeColor: '#ffffff', skyColor: '#000', groundColor: '#000', pipeStyle: 'glitch', decorations: 'pixels' },
            { score: 400, pipeColor: '#cc00ff', skyColor: '#051a2a', groundColor: '#001015', pipeStyle: 'plasma', decorations: 'waves' },
            { score: 450, pipeColor: '#ffd700', skyColor: '#000', groundColor: '#000', pipeStyle: 'golden', decorations: 'stars' }
        ]
    },
    {
        id: 'sunny',
        name: 'Sunny Highlands',
        bgm: 'bgm_sunny.mp3',
        stages: [
            { score: 0, pipeColor: '#00fff7', skyColor: '#6366f1', groundColor: '#22c55e', pipeStyle: '3d_neon', decorations: 'highlands' },
            { score: 50, pipeColor: '#00ffaa', skyColor: '#4f46e5', groundColor: '#16a34a', pipeStyle: '3d_neon', decorations: 'highlands' },
            { score: 100, pipeColor: '#ff00ff', skyColor: '#4338ca', groundColor: '#15803d', pipeStyle: '3d_neon', decorations: 'highlands' },
            { score: 150, pipeColor: '#ffbb00', skyColor: '#3730a3', groundColor: '#166534', pipeStyle: '3d_neon', decorations: 'highlands' },
            { score: 200, pipeColor: '#fff', skyColor: '#312e81', groundColor: '#14532d', pipeStyle: '3d_neon', decorations: 'highlands' }
        ]
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
