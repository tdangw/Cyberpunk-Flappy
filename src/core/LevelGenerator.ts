import { MAPS } from '../config/constants';
import type { StageDefinition, MapDefinition } from '../config/constants';

/**
 * Procedural Level Generator
 * Creates infinite stages by mixing and matching palette elements from the map.
 */
export class LevelGenerator {
    private static instance: LevelGenerator;

    private constructor() { }

    static getInstance(): LevelGenerator {
        if (!LevelGenerator.instance) {
            LevelGenerator.instance = new LevelGenerator();
        }
        return LevelGenerator.instance;
    }

    /**
     * Generates a stage definition based on score and map ID.
     * Deterministic random seeding could be added here if needed, 
     * but for now Math.random() provides variance.
     */
    getStageForScore(score: number, mapId: string): StageDefinition {
        const map = MAPS.find(m => m.id === mapId) || MAPS[0];

        // 1. Theme Scaling (Colors/Styles) - Every 50 points
        const themePhase = Math.floor(score / 50);
        const themeSeed = themePhase + mapId.length;

        // 2. Weather Scaling (Decorations) - Map specific durations
        let weatherThreshold = 30; // Default: 30 points
        if (mapId === 'sunny') weatherThreshold = 15; // Sunny: Short storms (15 pts)
        if (mapId === 'jungle') weatherThreshold = 50; // Jungle: Long rain (50 pts)

        const weatherPhase = Math.floor(score / weatherThreshold);
        const weatherSeed = weatherPhase + mapId.length + 100; // Offset to not sync with theme

        // Generate base stage
        const stage = this.generateFromPalette(map, themeSeed);

        // Override decorations specifically with weatherSeed
        const pseudoRandom = (offset: number) => {
            const x = Math.sin(weatherSeed + offset) * 10000;
            return x - Math.floor(x);
        };
        stage.decorations = map.palette.decorations[Math.floor(pseudoRandom(5) * map.palette.decorations.length)];

        // 3. Early Game Safety (0-20 score)
        if (score < 20) {
            stage.decorations = map.palette.decorations[0];
        }

        return stage;
    }

    private generateFromPalette(map: MapDefinition, seed: number): StageDefinition {
        const { palette } = map;

        // Simple pseudo-random function using seed
        const pseudoRandom = (offset: number) => {
            const x = Math.sin(seed + offset) * 10000;
            return x - Math.floor(x);
        };

        const pick = (arr: string[], offset: number) => arr[Math.floor(pseudoRandom(offset) * arr.length)];

        return {
            score: 0, // Not used practically in dynamic generation
            pipeColor: pick(palette.pipeColors, 1),
            skyColor: pick(palette.skyColors, 2),
            groundColor: pick(palette.groundColors, 3),
            pipeStyle: pick(palette.styles, 4),
            decorations: pick(palette.decorations, 5),
            pipePattern: pick(palette.patterns, 6)
        };
    }
}
