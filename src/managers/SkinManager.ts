import type { BirdState, SkinDefinition } from '../types';
import { SKINS } from '../config/skins';
import { drawShield, drawOriginalBird, drawStunnedEffect } from '../renderers/SkinDrawers';

export class SkinManager {
    private static instance: SkinManager;
    private constructor() { }
    static getInstance(): SkinManager {
        if (!SkinManager.instance) SkinManager.instance = new SkinManager();
        return SkinManager.instance;
    }
    getAllSkins(): SkinDefinition[] { return SKINS; }
    getSkinById(id: string): SkinDefinition | undefined { return SKINS.find((skin) => skin.id === id); }

    drawSkin(ctx: CanvasRenderingContext2D, skinId: string, bird: BirdState, isDashing: boolean, frames: number): void {
        ctx.save();
        ctx.translate(bird.x, bird.y);
        ctx.rotate(bird.rotation);

        drawShield(ctx, bird, isDashing, frames);
        drawStunnedEffect(ctx, bird, frames);

        if (skinId === 'default') {
            drawOriginalBird(ctx, bird);
        } else {
            const skin = this.getSkinById(skinId);
            if (skin) {
                skin.drawFunction(ctx, bird, isDashing, frames);
            } else {
                // Fallback if skin not found
                const fallback = this.getAllSkins()[0];
                if (fallback) fallback.drawFunction(ctx, bird, isDashing, frames);
            }
        }
        ctx.restore();
    }

    drawPreview(skinId: string): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d')!;
        const mockBird: BirdState = {
            x: 50, y: 60, radius: 15, rotation: 0, speed: 0, energy: 100, isDashing: false,
            isStunned: false,
            wingAngle: 0, stabilizeTimer: 0, invulnerableTimer: 0
        };
        ctx.translate(50, 60); // Offset down slightly for taller stick figures
        const skin = this.getSkinById(skinId);
        if (skin) {
            // Scale down slightly to fit 100x100 better
            ctx.scale(0.85, 0.85);
            skin.drawFunction(ctx, mockBird, false, 0);
        }
        return canvas;
    }
}
