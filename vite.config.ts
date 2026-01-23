import { defineConfig } from 'vite';

export default defineConfig({
    base: './', // Use relative paths for assets, better for itch.io
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
    }
});
