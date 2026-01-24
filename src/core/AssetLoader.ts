/**
 * Asset Loader for Hybrid Rendering
 * Loads and caches images for use in the game.
 */
export class AssetLoader {
    private static instance: AssetLoader;
    private assets: Map<string, HTMLImageElement> = new Map();

    private constructor() { }

    static getInstance(): AssetLoader {
        if (!AssetLoader.instance) {
            AssetLoader.instance = new AssetLoader();
        }
        return AssetLoader.instance;
    }

    /**
     * Loads a dictionary of image sources.
     * @param sources Key-Value pair of { id: url }
     */
    async loadImages(sources: { [key: string]: string }): Promise<void> {
        const promises = Object.entries(sources).map(([key, src]) => {
            return new Promise<void>((resolve) => {
                const img = new Image();
                img.src = src;
                img.onload = () => {
                    this.assets.set(key, img);
                    resolve();
                };
                img.onerror = () => {
                    console.warn(`Failed to load asset: ${src}`);
                    // Resolve anyway to avoid blocking the game for one missing asset
                    resolve();
                };
            });
        });

        await Promise.all(promises);
    }

    get(key: string): HTMLImageElement | undefined {
        return this.assets.get(key);
    }

    has(key: string): boolean {
        return this.assets.has(key);
    }
}
