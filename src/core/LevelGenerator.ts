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

        // Difficulty scaling triggers every 50 points
        const phase = Math.floor(score / 50);

        // Pseudo-random selection based on phase to act as "Seed" 
        // ensuring consistent experience for a short duration
        const seed = phase + mapId.length;

        return this.generateFromPalette(map, seed);
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
