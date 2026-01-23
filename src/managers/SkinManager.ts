import type { SkinDefinition, BirdState } from '../types';

/**
 * High-Quality Cybernetic Skin roster with 5 distinct color variations per type.
 * Restored detailed drawing (eyes, wings, fins) for all skins.
 */

// --- HELPER FOR VARIATIONS ---
function createVariations(baseId: string, baseName: string, baseDesc: string, baseFeatures: string[], colors: string[], drawFn: any): SkinDefinition[] {
    return colors.map((color, i) => {
        return {
            id: `${baseId}-${i}`,
            name: baseName,
            price: 500,
            description: baseDesc,
            features: baseFeatures,
            drawFunction: (ctx, bird, isDashing, frames) => drawFn(ctx, bird, isDashing, frames, color)
        };
    });
}

// --- DRAW FUNCTIONS ---

function drawEye(ctx: CanvasRenderingContext2D, dx: number, dy: number): void {
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(dx, dy, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(dx + 2, dy, 2, 0, Math.PI * 2); ctx.fill();
}

function drawSphere(ctx: CanvasRenderingContext2D, bird: BirdState, isDashing: boolean, _frames: number, color: string): void {
    const glow = isDashing ? '#fff' : color;
    ctx.shadowBlur = 15; ctx.shadowColor = glow;
    ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fillStyle = '#111'; ctx.fill();
    ctx.strokeStyle = glow; ctx.lineWidth = 2; ctx.stroke();
    drawEye(ctx, 8, -4);
    ctx.fillStyle = glow; ctx.beginPath(); ctx.moveTo(10, 2); ctx.quadraticCurveTo(18, 5, 10, 8); ctx.lineTo(6, 5); ctx.closePath(); ctx.fill();
    const flap = Math.sin(bird.wingAngle) * 6;
    ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.moveTo(-5, 0); ctx.quadraticCurveTo(-15, -15 + flap, -25, -5 + flap); ctx.lineTo(-10, 5); ctx.closePath(); ctx.fill();
}

function drawPigeon(ctx: CanvasRenderingContext2D, bird: BirdState, isDashing: boolean, _frames: number, color: string): void {
    const glow = isDashing ? '#fff' : color;
    ctx.shadowBlur = 15; ctx.shadowColor = glow;
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.ellipse(0, 0, 18, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = glow; ctx.lineWidth = 2; ctx.stroke();
    drawEye(ctx, 12, -4);
    ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.moveTo(18, -2); ctx.lineTo(26, 0); ctx.lineTo(18, 2); ctx.closePath(); ctx.fill();
    const flap = Math.sin(bird.wingAngle) * 6;
    ctx.fillStyle = color; ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.moveTo(-5, 0); ctx.quadraticCurveTo(-15, -15 + flap, -25, -5 + flap); ctx.lineTo(-10, 5); ctx.closePath(); ctx.fill();
}

function drawShark(ctx: CanvasRenderingContext2D, bird: BirdState, isDashing: boolean, _frames: number, color: string): void {
    const glow = isDashing ? '#fff' : color;
    ctx.shadowBlur = 20; ctx.shadowColor = glow;
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(-25, 0); ctx.bezierCurveTo(-25, -20, 25, -20, 35, 0); ctx.bezierCurveTo(25, 20, -25, 20, -25, 0); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();
    drawEye(ctx, 20, -5);
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(10, -25); ctx.lineTo(15, -12); ctx.closePath(); ctx.fill(); ctx.stroke();
    const wobble = Math.sin(bird.wingAngle * 1.2) * 6;
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.moveTo(-25, 0); ctx.lineTo(-35, -10 + wobble); ctx.lineTo(-35, 10 - wobble); ctx.closePath(); ctx.fill(); ctx.stroke();
}

function drawDragon(ctx: CanvasRenderingContext2D, bird: BirdState, isDashing: boolean, _frames: number, color: string): void {
    const glow = isDashing ? '#fff' : color;
    ctx.shadowBlur = 20; ctx.shadowColor = glow;
    for (let i = 5; i >= 0; i--) {
        const x = -i * 10; const size = 15 - i * 2;
        const y = Math.sin(bird.wingAngle * 0.5 + i * 0.5) * 6;
        ctx.fillStyle = i === 0 ? color : `rgba(20, 20, 30, ${1 - i * 0.15})`;
        ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = glow; ctx.lineWidth = 1; ctx.stroke();
        if (i === 0) drawEye(ctx, x + 8, y - 3);
    }
}

function drawChicken(ctx: CanvasRenderingContext2D, bird: BirdState, isDashing: boolean, _frames: number, color: string): void {
    const flap = Math.sin(bird.wingAngle) * 8;
    ctx.shadowBlur = 15; ctx.shadowColor = color;
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
    drawEye(ctx, 10, -5);
    ctx.fillStyle = '#ffd700'; ctx.beginPath(); ctx.moveTo(15, -2); ctx.lineTo(25, 4); ctx.lineTo(15, 8); ctx.fill();
    ctx.fillStyle = isDashing ? '#fff' : color;
    ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(-24, flap - 4); ctx.lineTo(-24, flap + 12); ctx.closePath(); ctx.fill(); ctx.stroke();
}

function drawFish(ctx: CanvasRenderingContext2D, bird: BirdState, isDashing: boolean, _frames: number, color: string): void {
    const glow = isDashing ? '#fff' : color;
    const wobble = Math.sin(bird.wingAngle * 1.5) * 8;
    ctx.shadowBlur = 20; ctx.shadowColor = glow;
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.ellipse(0, 0, 22, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = glow; ctx.lineWidth = 2; ctx.stroke();
    drawEye(ctx, 12, -4);
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(-20, 0); ctx.lineTo(-35, -15 + wobble); ctx.lineTo(-28, 0); ctx.lineTo(-35, 15 - wobble); ctx.closePath(); ctx.fill(); ctx.stroke();
}

function drawChimera(ctx: CanvasRenderingContext2D, bird: BirdState, isDashing: boolean, _frames: number, color: string): void {
    const flap = Math.sin(bird.wingAngle) * 15;
    const glow = isDashing ? '#fff' : color;
    ctx.shadowBlur = 25; ctx.shadowColor = glow;
    ctx.fillStyle = '#0a0a0a'; ctx.beginPath(); ctx.moveTo(25, 0); ctx.bezierCurveTo(20, -15, -5, -15, -15, 0); ctx.lineTo(-30, 0); ctx.bezierCurveTo(-15, 15, 20, 15, 25, 0); ctx.fill();
    ctx.strokeStyle = glow; ctx.lineWidth = 2; ctx.stroke();
    drawEye(ctx, 15, -4);
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, -5); ctx.quadraticCurveTo(-20, -40 + flap, -50, -10 + flap); ctx.lineTo(-25, 0); ctx.quadraticCurveTo(-20, 40 - flap, -50, 10 - flap); ctx.closePath(); ctx.fill(); ctx.stroke();
}

function drawWhale(ctx: CanvasRenderingContext2D, bird: BirdState, isDashing: boolean, _frames: number, color: string): void {
    const glow = isDashing ? '#fff' : color;
    ctx.shadowBlur = 30; ctx.shadowColor = glow;
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.ellipse(0, 0, 30, 18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = glow; ctx.lineWidth = 2; ctx.stroke();
    drawEye(ctx, 18, -5);
    const wobble = Math.sin(bird.wingAngle * 0.8) * 6;
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(-28, 0); ctx.quadraticCurveTo(-45, -20 + wobble, -55, -10 + wobble); ctx.lineTo(-55, 10 - wobble); ctx.quadraticCurveTo(-45, 20 - wobble, -28, 0); ctx.fill(); ctx.stroke();
}

// --- SKIN CONFIG: 5 VERY DISTINCT COLORS ---
const DISTINCT_COLORS = ['#ff00ff', '#00ffaa', '#00aaff', '#ffaa00', '#ff3333']; // Pink, Emerald, Sapphire, Amber, Ruby

export const SKINS: SkinDefinition[] = [
    ...createVariations('sphere', 'Neon Sphere', 'Standard magnetic containment unit with eyes and energy core.', ['Balanced'], DISTINCT_COLORS, drawSphere),
    ...createVariations('pigeon', 'Cyber Pigeon', 'Urban recon drone. High agility.', ['Agile'], DISTINCT_COLORS, drawPigeon),
    ...createVariations('shark', 'Cyber Shark', 'Apex predator of the data streams.', ['Fast'], DISTINCT_COLORS, drawShark),
    ...createVariations('dragon', 'Jade Wyrm', 'Ancient digital serpent with glowing segments.', ['Long'], DISTINCT_COLORS, drawDragon),
    ...createVariations('chicken', 'Sky Pecker', 'Orbital poultry craft with pulse wings.', ['Hover'], DISTINCT_COLORS, drawChicken),
    ...createVariations('fish', 'Deep-Net Fish', 'Data stream inhabitant with oscillating tail.', ['Swim'], DISTINCT_COLORS, drawFish),
    ...createVariations('chimera', 'Cyber Chimera', 'Forbidden experimental hybrid predator.', ['Exotic'], DISTINCT_COLORS, drawChimera),
    ...createVariations('whale', 'Plasma Whale', 'Titan of the binary deep with energy fins.', ['Titan'], DISTINCT_COLORS, drawWhale),
];

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
        const skin = this.getSkinById(skinId);
        if (skin) {
            ctx.save(); ctx.translate(bird.x, bird.y); ctx.rotate(bird.rotation);
            if (bird.invulnerableTimer > 0 && !isDashing) ctx.globalAlpha = 0.6 + Math.sin(frames * 0.2) * 0.3;
            skin.drawFunction(ctx, bird, isDashing, frames);
            ctx.restore();
        }
    }
    drawPreview(skinId: string): HTMLCanvasElement {
        const canvas = document.createElement('canvas'); canvas.width = 60; canvas.height = 60;
        const ctx = canvas.getContext('2d')!;
        const mockBird: BirdState = { x: 30, y: 30, radius: 15, rotation: 0, speed: 0, energy: 100, isDashing: false, wingAngle: 0, stabilizeTimer: 0, invulnerableTimer: 0 };
        ctx.translate(30, 30);
        const skin = this.getSkinById(skinId);
        if (skin) skin.drawFunction(ctx, mockBird, false, 0);
        return canvas;
    }
}
