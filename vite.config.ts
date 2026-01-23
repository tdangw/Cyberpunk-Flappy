import { defineConfig } from 'vite';

export default defineConfig({
    base: '/Cyberpunk-Flappy-Bird/', // PHẢI CÓ gạch chéo 2 đầu và đúng tên repo
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
    }
});