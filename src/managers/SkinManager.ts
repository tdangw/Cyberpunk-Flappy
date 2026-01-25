import type { SkinDefinition, BirdState } from '../types';

/**
 * High-Quality Cybernetic Skin roster with 5 distinct color variations per type.
 * Restored detailed drawing (eyes, wings, fins) for all skins.
 */

// --- HELPER FOR VARIATIONS ---
function createVariations(baseId: string, baseName: string, baseDesc: string, baseFeatures: string[], colors: string[], drawFn: any, price: number = 500): SkinDefinition[] {
    return colors.map((color, i) => {
        return {
            id: `${baseId}-${i}`,
            name: baseName,
            price: price,
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
    ctx.shadowBlur = 8; ctx.shadowColor = glow;
    ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fillStyle = '#111'; ctx.fill();
    ctx.strokeStyle = glow; ctx.lineWidth = 1.5; ctx.stroke();
    drawEye(ctx, 8, -4);
    ctx.fillStyle = glow; ctx.beginPath(); ctx.moveTo(10, 2); ctx.quadraticCurveTo(18, 5, 10, 8); ctx.lineTo(6, 5); ctx.closePath(); ctx.fill();
    const flap = Math.sin(bird.wingAngle) * 6;
    ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.moveTo(-5, 0); ctx.quadraticCurveTo(-15, -15 + flap, -25, -5 + flap); ctx.lineTo(-10, 5); ctx.closePath(); ctx.fill();
}

function drawPigeon(ctx: CanvasRenderingContext2D, bird: BirdState, isDashing: boolean, _frames: number, color: string): void {
    const glow = isDashing ? '#fff' : color;
    ctx.shadowBlur = 8; ctx.shadowColor = glow;
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.ellipse(0, 0, 18, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = glow; ctx.lineWidth = 1.5; ctx.stroke();
    drawEye(ctx, 12, -4);
    ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.moveTo(18, -2); ctx.lineTo(26, 0); ctx.lineTo(18, 2); ctx.closePath(); ctx.fill();
    const flap = Math.sin(bird.wingAngle) * 6;
    ctx.fillStyle = color; ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.moveTo(-5, 0); ctx.quadraticCurveTo(-15, -15 + flap, -25, -5 + flap); ctx.lineTo(-10, 5); ctx.closePath(); ctx.fill();
}

function drawShark(ctx: CanvasRenderingContext2D, bird: BirdState, isDashing: boolean, _frames: number, color: string): void {
    const glow = isDashing ? '#fff' : color;
    ctx.shadowBlur = 10; ctx.shadowColor = glow;
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(-25, 0); ctx.bezierCurveTo(-25, -20, 25, -20, 35, 0); ctx.bezierCurveTo(25, 20, -25, 20, -25, 0); ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'; ctx.lineWidth = 1; ctx.stroke();
    drawEye(ctx, 20, -5);
    // Fins synced with color
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(10, -25); ctx.lineTo(15, -12); ctx.closePath(); ctx.fill(); ctx.stroke();
    const wobble = Math.sin(bird.wingAngle * 1.2) * 6;
    ctx.beginPath(); ctx.moveTo(-25, 0); ctx.lineTo(-35, -10 + wobble); ctx.lineTo(-35, 10 - wobble); ctx.closePath(); ctx.fill(); ctx.stroke();
}

function drawButterfly(ctx: CanvasRenderingContext2D, bird: BirdState, isDashing: boolean, _frames: number, color: string): void {
    const glow = isDashing ? '#fff' : color;
    ctx.shadowBlur = 12; ctx.shadowColor = glow;

    // 1. Phác thảo thân bướm (Segmented Body)
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 4, 0, 0, Math.PI * 2); // Thân chính
    ctx.fill();
    ctx.strokeStyle = glow; ctx.lineWidth = 1; ctx.stroke();

    // Đầu và Râu (Head & Antennae)
    ctx.beginPath();
    ctx.arc(12, -2, 4, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    // Râu bướm (Antennae)
    ctx.beginPath();
    ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
    ctx.moveTo(14, -4); ctx.quadraticCurveTo(20, -15, 25, -20);
    ctx.moveTo(14, -4); ctx.quadraticCurveTo(18, -12, 18, -25);
    ctx.stroke();

    // 2. Cánh bướm (Realistic Wings with Scalloped Edges)
    const flap = Math.sin(bird.wingAngle * 1.5) * 0.8;
    ctx.globalAlpha = 0.7;

    const drawDetailedWing = (isUpper: boolean) => {
        ctx.save();
        const yDir = isUpper ? -1 : 1;
        ctx.translate(-2, 2 * yDir);
        ctx.rotate(flap * yDir + (isUpper ? -0.4 : 0.4));

        ctx.beginPath();
        if (isUpper) {
            // Cánh trên lớn, hình răng cưa
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(-10, -35, -45, -30, -50, -5);
            ctx.bezierCurveTo(-45, 0, -10, 5, 0, 0);
        } else {
            // Cánh dưới gọn gàng
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(-5, 25, -35, 30, -35, 10);
            ctx.bezierCurveTo(-30, 0, -10, -5, 0, 0);
        }

        // Tạo dải màu Gradient cho cánh
        const grad = ctx.createRadialGradient(0, 0, 5, -20, isUpper ? -15 : 15, 40);
        grad.addColorStop(0, '#fff');
        grad.addColorStop(0.3, color);
        grad.addColorStop(1, '#000');
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = glow; ctx.lineWidth = 1.5; ctx.stroke();

        // Vẽ Gân cánh (Wing Veins)
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 0.8;
        for (let i = 0; i < 5; i++) {
            ctx.moveTo(0, 0);
            const angle = (i - 2) * 0.3;
            const length = isUpper ? 40 : 25;
            ctx.lineTo(Math.cos(angle + (isUpper ? -2.2 : 2.2)) * length, Math.sin(angle + (isUpper ? -1.8 : 1.8)) * length);
        }
        ctx.stroke();

        // Điểm sáng ở rìa cánh
        ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.5;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(-40 + i * 5, isUpper ? -20 + i * 2 : 20 - i * 2, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    };

    drawDetailedWing(true);  // Cánh trên
    drawDetailedWing(false); // Cánh dưới

    ctx.globalAlpha = 1.0;
    drawEye(ctx, 14, -3);
}

function drawChicken(ctx: CanvasRenderingContext2D, bird: BirdState, isDashing: boolean, _frames: number, color: string): void {
    const flap = Math.sin(bird.wingAngle) * 8;
    ctx.shadowBlur = 8; ctx.shadowColor = color;
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke();
    drawEye(ctx, 10, -5);
    ctx.fillStyle = '#ffd700'; ctx.beginPath(); ctx.moveTo(15, -2); ctx.lineTo(25, 4); ctx.lineTo(15, 8); ctx.fill();
    ctx.fillStyle = isDashing ? '#fff' : color;
    ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(-24, flap - 4); ctx.lineTo(-24, flap + 12); ctx.closePath(); ctx.fill(); ctx.stroke();
}

function drawFish(ctx: CanvasRenderingContext2D, bird: BirdState, isDashing: boolean, _frames: number, color: string): void {
    const glow = isDashing ? '#fff' : color;
    const wobble = Math.sin(bird.wingAngle * 1.5) * 8;
    ctx.shadowBlur = 10; ctx.shadowColor = glow;
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.ellipse(0, 0, 22, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = glow; ctx.lineWidth = 1.5; ctx.stroke();
    drawEye(ctx, 12, -4);
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(-20, 0); ctx.lineTo(-35, -15 + wobble); ctx.lineTo(-28, 0); ctx.lineTo(-35, 15 - wobble); ctx.closePath(); ctx.fill(); ctx.stroke();
}

function drawChimera(ctx: CanvasRenderingContext2D, bird: BirdState, isDashing: boolean, _frames: number, color: string): void {
    const flap = Math.sin(bird.wingAngle) * 15;
    const glow = isDashing ? '#fff' : color;
    ctx.shadowBlur = 12; ctx.shadowColor = glow;
    ctx.fillStyle = '#0a0a0a'; ctx.beginPath(); ctx.moveTo(25, 0); ctx.bezierCurveTo(20, -15, -5, -15, -15, 0); ctx.lineTo(-30, 0); ctx.bezierCurveTo(-15, 15, 20, 15, 25, 0); ctx.fill();
    ctx.strokeStyle = glow; ctx.lineWidth = 1.5; ctx.stroke();
    drawEye(ctx, 15, -4);
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, -5); ctx.quadraticCurveTo(-20, -40 + flap, -50, -10 + flap); ctx.lineTo(-25, 0); ctx.quadraticCurveTo(-20, 40 - flap, -50, 10 - flap); ctx.closePath(); ctx.fill(); ctx.stroke();
}

function drawWhale(ctx: CanvasRenderingContext2D, bird: BirdState, isDashing: boolean, _frames: number, color: string): void {
    const glow = isDashing ? '#fff' : color;
    ctx.shadowBlur = 15; ctx.shadowColor = glow;
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.ellipse(0, 0, 30, 18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = glow; ctx.lineWidth = 1.5; ctx.stroke();
    drawEye(ctx, 18, -5);
    const wobble = Math.sin(bird.wingAngle * 0.8) * 6;
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(-28, 0); ctx.quadraticCurveTo(-45, -20 + wobble, -55, -10 + wobble); ctx.lineTo(-55, 10 - wobble); ctx.quadraticCurveTo(-45, 20 - wobble, -28, 0); ctx.fill(); ctx.stroke();
}

function drawPhoenix(ctx: CanvasRenderingContext2D, bird: BirdState, isDashing: boolean, frames: number, color: string): void {
    const glow = isDashing ? '#fff' : color;
    ctx.shadowBlur = 12; ctx.shadowColor = glow;

    // Sparkles - Simple pulsing dots (3 static positions)
    ctx.save();
    for (let i = 0; i < 3; i++) {
        const pulse = 0.4 + Math.sin(frames * 0.08 + i * 2) * 0.4;
        ctx.globalAlpha = pulse;
        ctx.fillStyle = '#fff';
        const px = [-15, 5, 20][i];
        const py = [-20, 15, -15][i];
        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();

    // Body - Sleek avian shape
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath();
    ctx.moveTo(25, 0);
    ctx.bezierCurveTo(20, -12, -10, -12, -20, 0);
    ctx.bezierCurveTo(-10, 12, 20, 12, 25, 0);
    ctx.fill();
    ctx.strokeStyle = glow; ctx.lineWidth = 2; ctx.stroke();

    // Mythical Eye - Glowing iris with slit pupil
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(14, -4, 6, 4, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(15, -4, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(15, -4, 1.2, 3, 0, 0, Math.PI * 2); // Slit pupil
    ctx.fill();

    // Curved Beak (Mythical/Phoenix style)
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.moveTo(22, -2);
    ctx.quadraticCurveTo(35, 0, 32, 8); // Curved tip
    ctx.quadraticCurveTo(28, 4, 22, 5);
    ctx.closePath();
    ctx.fill();

    // Wings - Large and flowing
    const flap = Math.sin(bird.wingAngle) * 25;
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.6;

    // Upper Wing
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.quadraticCurveTo(-15, -45 + flap, -45, -20 + flap);
    ctx.quadraticCurveTo(-30, -5, -10, 0);
    ctx.fill(); ctx.stroke();

    // Lower Wing
    ctx.beginPath();
    ctx.moveTo(0, 5);
    ctx.quadraticCurveTo(-15, 45 - flap, -45, 20 - flap);
    ctx.quadraticCurveTo(-30, 5, -10, 0);
    ctx.fill(); ctx.stroke();

    // Tail - Flowing fire trails (3 branches)
    ctx.globalAlpha = 0.4;
    for (let i = 0; i < 3; i++) {
        const angle = (i - 1) * 0.3;
        const tailWobble = Math.sin(frames * 0.1 + i) * 10;
        ctx.save();
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(-15, 0);
        ctx.bezierCurveTo(-35, -10 + tailWobble, -60, 5 - tailWobble, -80, 0);
        ctx.strokeStyle = color;
        ctx.lineWidth = 4 - i;
        ctx.stroke();
        ctx.restore();
    }
    ctx.globalAlpha = 1.0;
}

function drawDragonfly(ctx: CanvasRenderingContext2D, bird: BirdState, isDashing: boolean, _frames: number, color: string): void {
    const glow = isDashing ? '#fff' : color;
    ctx.shadowBlur = 8; ctx.shadowColor = glow;
    // Long Body
    ctx.fillStyle = '#1b1b1b';
    ctx.beginPath();
    ctx.ellipse(0, 0, 25, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = glow; ctx.lineWidth = 1.5; ctx.stroke();
    drawEye(ctx, 18, -2);

    // 4 Thin Wings - Improved pivot-based rotation
    const flap = Math.sin(bird.wingAngle * 2.5) * 0.6;
    ctx.fillStyle = color; ctx.globalAlpha = 0.4;

    for (let i = 0; i < 2; i++) {
        const xOffset = -5 - i * 10;
        // Top Wings
        ctx.save();
        ctx.translate(xOffset, -2);
        ctx.rotate(flap - 0.5);
        ctx.beginPath(); ctx.ellipse(-10, 0, 15, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.restore();

        // Bottom Wings
        ctx.save();
        ctx.translate(xOffset, 2);
        ctx.rotate(-flap + 0.5);
        ctx.beginPath(); ctx.ellipse(-10, 0, 15, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.restore();
    }
    ctx.globalAlpha = 1.0;
}

function drawBee(ctx: CanvasRenderingContext2D, bird: BirdState, isDashing: boolean, _frames: number, color: string): void {
    const glow = isDashing ? '#fff' : color;
    ctx.shadowBlur = 10; ctx.shadowColor = glow;

    // Body - Cute rounded egg shape
    ctx.save();
    ctx.rotate(0.1);

    // Main Body (Synced with variant color)
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(-2, 4, 18, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3a2a0d'; ctx.lineWidth = 1.5; ctx.stroke();

    // Stripes (Dark Brown for that honey bee look)
    ctx.fillStyle = '#3a2a0d';
    // Tail stripe
    ctx.beginPath();
    ctx.ellipse(-8, 4, 8, 13.5, 0, Math.PI * 0.4, Math.PI * 1.6);
    ctx.fill();
    // Middle stripe
    ctx.fillRect(0, -9, 6, 26);

    // Stinger
    ctx.beginPath();
    ctx.moveTo(-18, 4); ctx.lineTo(-28, 6); ctx.lineTo(-18, 10);
    ctx.closePath(); ctx.fill();

    // Head - Large and round
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(12, -4, 13, 0, Math.PI * 2); ctx.fill();
    ctx.stroke();

    // Cute Face with Blush
    ctx.fillStyle = 'rgba(255, 100, 100, 0.3)'; // Blush
    ctx.beginPath(); ctx.arc(18, 0, 4, 0, Math.PI * 2); ctx.fill();

    // Cartoon Eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(16, -6, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(17.5, -6, 2.5, 0, Math.PI * 2); ctx.fill();
    // Eye sparkle
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(16.5, -7, 1.2, 0, Math.PI * 2); ctx.fill();

    // Smile
    ctx.strokeStyle = '#3a2a0d'; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(15, -1, 4, 0.2, 2.5); ctx.stroke();

    // Antennae with round tips
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(8, -15); ctx.quadraticCurveTo(5, -22, 4, -28); ctx.stroke();
    ctx.beginPath(); ctx.arc(4, -28, 3, 0, Math.PI * 2); ctx.fill();

    ctx.beginPath(); ctx.moveTo(16, -15); ctx.quadraticCurveTo(19, -22, 20, -28); ctx.stroke();
    ctx.beginPath(); ctx.arc(20, -28, 3, 0, Math.PI * 2); ctx.fill();

    // Translucent Rounded Wings
    const flap = Math.sin(bird.wingAngle * 3.5) * 0.5;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';

    // Top Wing
    ctx.save();
    ctx.translate(-5, -6);
    ctx.rotate(flap - 0.5);
    ctx.beginPath(); ctx.ellipse(-14, 0, 18, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();

    // Bottom Wing
    ctx.save();
    ctx.translate(-8, -4);
    ctx.rotate(-flap + 0.3);
    ctx.beginPath(); ctx.ellipse(-12, 0, 15, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();

    ctx.restore();
}

function drawClassicFlappy(ctx: CanvasRenderingContext2D, bird: BirdState, isDashing: boolean, _frames: number, color: string): void {
    const glow = isDashing ? '#fff' : color;
    ctx.shadowBlur = 8; ctx.shadowColor = glow;
    // Classic Fat Shape
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.ellipse(0, 0, 18, 15, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.stroke();
    // Big Eye
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(10, -6, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(12, -6, 2.5, 0, Math.PI * 2); ctx.fill();
    // Big Beak
    ctx.fillStyle = '#f97316'; ctx.beginPath(); ctx.ellipse(15, 4, 10, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // Wing - Safety check for negative radius to prevent crash
    const flap = Math.sin(bird.wingAngle) * 5;
    const wingH = Math.max(1, 6 + flap);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(-6, 2, 8, wingH, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
}

function drawJellyfish(ctx: CanvasRenderingContext2D, _bird: BirdState, isDashing: boolean, frames: number, color: string): void {
    const glow = isDashing ? '#fff' : color;
    ctx.shadowBlur = 15; ctx.shadowColor = glow;

    // Bell
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(0, -5, 18, Math.PI, 0);
    ctx.quadraticCurveTo(18, 5, 10, 8);
    ctx.quadraticCurveTo(0, 5, -10, 8);
    ctx.quadraticCurveTo(-18, 5, -18, -5);
    ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();

    // Eyes (Inside the bell)
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-5, -5, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(5, -5, 3, 0, Math.PI * 2); ctx.fill();

    // Tentacles (Wavy animation)
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
        const x = -10 + i * 10;
        const wave = Math.sin(frames * 0.1 + i) * 5;
        ctx.moveTo(x, 5);
        ctx.quadraticCurveTo(x + wave, 15, x, 25 + wave);
    }
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
}

function drawDuck(ctx: CanvasRenderingContext2D, bird: BirdState, isDashing: boolean, _frames: number, color: string): void {
    const glow = isDashing ? '#fff' : color;
    ctx.shadowBlur = 10; ctx.shadowColor = glow;

    // Body
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.ellipse(-4, 4, 18, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.stroke();

    // Head
    ctx.beginPath(); ctx.arc(10, -5, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // Beak (Flat)
    ctx.fillStyle = '#ffaa00';
    ctx.beginPath();
    ctx.ellipse(20, -2, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    // Eye
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(14, -8, 2, 0, Math.PI * 2); ctx.fill();

    // Wing
    const flap = Math.sin(bird.wingAngle) * 5;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath(); ctx.ellipse(-8, 5, 10, 6 + flap, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
}

function drawBeetle(ctx: CanvasRenderingContext2D, bird: BirdState, isDashing: boolean, _frames: number, color: string): void {
    const glow = isDashing ? '#fff' : color;
    ctx.shadowBlur = 12; ctx.shadowColor = glow;

    // Under-wings (Flying wings - intense flapping)
    const wingFlap = Math.sin(bird.wingAngle * 4) * 20;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.ellipse(-10, -5 + wingFlap, 15, 8, -0.4, 0, Math.PI * 2);
    ctx.ellipse(-10, 5 - wingFlap, 15, 8, 0.4, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    // Shell (Two halves)
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fill();

    const flap = Math.abs(Math.sin(bird.wingAngle)) * 0.6;
    ctx.fillStyle = color;

    // Left Wing Cover (Elytra)
    ctx.save();
    ctx.translate(0, -2);
    ctx.rotate(-flap);
    ctx.beginPath(); ctx.ellipse(0, 0, 18, 18, 0, Math.PI, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();

    // Right Wing Cover (Elytra)
    ctx.save();
    ctx.translate(0, 2);
    ctx.rotate(flap);
    ctx.beginPath(); ctx.ellipse(0, 0, 18, 18, 0, 0, Math.PI); ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Head
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.arc(15, 0, 9, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#333'; ctx.lineWidth = 1; ctx.stroke();

    // Forked Horn (Refined as per image)
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.moveTo(18, -2);
    ctx.quadraticCurveTo(28, -20, 42, -15); // Long upper horn
    ctx.lineTo(38, -12);
    ctx.quadraticCurveTo(28, -15, 22, -2);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    // Lower small horn
    ctx.beginPath();
    ctx.moveTo(22, 2);
    ctx.quadraticCurveTo(30, 8, 38, 2);
    ctx.lineTo(35, 0);
    ctx.quadraticCurveTo(28, 4, 22, 2);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    // Eyes
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(20, -4, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(20, 4, 2, 0, Math.PI * 2); ctx.fill();
}

function drawClownfish(ctx: CanvasRenderingContext2D, bird: BirdState, isDashing: boolean, _frames: number, color: string): void {
    const glow = isDashing ? '#fff' : color;
    ctx.shadowBlur = 10; ctx.shadowColor = glow;

    // Body (Nemo style)
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, 0, 24, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3 Translucent White Bands for a "Bone/Ethereal" effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'; ctx.lineWidth = 1;

    // Front Band
    ctx.beginPath();
    ctx.ellipse(10, -1, 9, 11, 0.1, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    // Middle Band
    ctx.beginPath();
    ctx.ellipse(-3, 0, 7, 16, 0.15, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    // Tail Band
    ctx.beginPath();
    ctx.ellipse(-16, 0, 5, 11, -0.1, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    // Eye - Larger for better visibility
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(14, -4, 5.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(16, -4, 2.5, 0, Math.PI * 2); ctx.fill();
    // Tiny sparkle
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(15.5, -5, 1.2, 0, Math.PI * 2); ctx.fill();

    // Smiling Mouth
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(15, 1, 4, 0.3, 2.2); ctx.stroke();

    // Fins - Larger and more pronounced
    const wobble = Math.sin(bird.wingAngle * 1.5) * 8;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;

    // Tail Fin (Fan shaped)
    ctx.beginPath();
    ctx.moveTo(-22, 0);
    ctx.quadraticCurveTo(-38, -18 + wobble, -32, 0);
    ctx.quadraticCurveTo(-38, 18 - wobble, -22, 0);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Dorsal Fin (Top)
    ctx.beginPath();
    ctx.moveTo(-5, -14);
    ctx.quadraticCurveTo(5, -22, 10, -12);
    ctx.fill(); ctx.stroke();

    // Side Fin (Larger)
    ctx.beginPath();
    ctx.ellipse(0, 5, 10, 6 + wobble / 2, 0.5, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
}

function drawSwordSurfer(ctx: CanvasRenderingContext2D, bird: BirdState, isDashing: boolean, frames: number, color: string): void {
    const glow = isDashing ? '#fff' : color;
    ctx.shadowBlur = 15; ctx.shadowColor = glow;

    // 1. Demonic Soul Blade (Soul Edge style)
    ctx.save();

    // Main Organic Body (Fleshy/Jagged)
    ctx.fillStyle = '#2a1a1a';
    ctx.beginPath();
    ctx.moveTo(-45, 5); // Hilt
    // Top Jagged Edge
    ctx.lineTo(-20, -2); ctx.lineTo(0, 2); ctx.lineTo(25, -5); ctx.lineTo(55, 0);
    // Bottom Jagged Edge
    ctx.lineTo(25, 12); ctx.lineTo(0, 8); ctx.lineTo(-20, 15); ctx.lineTo(-45, 10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = glow; ctx.lineWidth = 1.2; ctx.stroke();

    // Central Eye Socket (Organic bulge)
    ctx.fillStyle = '#3a0a0a';
    ctx.beginPath();
    ctx.arc(-5, 5, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // The "Living" Eye - Moved to be centrally integrated
    const eyeX = -5; const eyeY = 5;
    const eyePulse = Math.sin(frames * 0.1) * 0.5; // Slight pulse

    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(eyeX, eyeY, 8, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.stroke();

    // Iris (Sync with color)
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(eyeX, eyeY, 3.5 + eyePulse, 0, Math.PI * 2); ctx.fill();

    // Pupil (Vertical slit)
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.ellipse(eyeX, eyeY, 1.5, 3, 0, 0, Math.PI * 2); ctx.fill();

    // Glowing Veins
    ctx.strokeStyle = glow; ctx.globalAlpha = 0.5; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-35, 5); ctx.lineTo(-15, 5);
    ctx.moveTo(5, 5); ctx.lineTo(40, 4);
    ctx.stroke();
    ctx.globalAlpha = 1.0;
    ctx.restore();

    // 2. Stick Figure Warrior
    ctx.save();
    ctx.translate(15, 0); // Move forward to clear the eye

    ctx.strokeStyle = '#000'; ctx.lineWidth = 2.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const flap = Math.sin(bird.wingAngle) * 12;

    // Legs (Improved alignment - meeting at hip)
    ctx.beginPath();
    // Back leg
    ctx.moveTo(-4, 0); ctx.lineTo(-8, -10); ctx.lineTo(0, -20);
    // Front leg
    ctx.moveTo(6, 0); ctx.lineTo(10, -10); ctx.lineTo(0, -20);
    ctx.stroke();

    // Torso (Stick - connected to hips at 0,-20)
    ctx.beginPath();
    ctx.moveTo(0, -20); ctx.lineTo(3, -38);
    ctx.stroke();

    // Arms
    ctx.beginPath();
    ctx.moveTo(2, -32); ctx.lineTo(12, -30 + flap / 4); ctx.lineTo(18, -34);
    ctx.stroke();

    // Cape (Shadowy/Translucent)
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.moveTo(-2, -38);
    ctx.bezierCurveTo(-30, -38 + flap, -55, -23 - flap, -85, -48 + flap);
    ctx.lineTo(-75, -18 + flap);
    ctx.bezierCurveTo(-50, -13 - flap, -20, -23, 0, -31);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1.0;

    // Helmet
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath();
    ctx.arc(6, -47, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = glow; ctx.lineWidth = 1.2; ctx.stroke();

    // Visor
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(9, -48, 4, 3, 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

// 2. PHANTOM REAPER (Scythe-Sword Stick Figure)
function drawReaper(ctx: CanvasRenderingContext2D, bird: BirdState, isDashing: boolean, _frames: number, color: string): void {
    const glow = isDashing ? '#fff' : color;
    ctx.shadowBlur = 15; ctx.shadowColor = glow;

    // SCYTHE SWORD
    ctx.save();
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath();
    ctx.moveTo(-45, 10); ctx.lineTo(10, 8);
    ctx.quadraticCurveTo(30, 5, 45, -20); // Massive curved blade
    ctx.lineTo(35, -15); ctx.quadraticCurveTo(25, 0, 0, 5); ctx.lineTo(-45, 8);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = glow; ctx.lineWidth = 1.2; ctx.stroke();

    // Central Ghostly Eye
    const eyeX = -15; const eyeY = 4;
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(eyeX, eyeY, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(eyeX, eyeY, 2 + Math.sin(_frames * 0.1) * 1, 0, Math.PI * 2); ctx.fill();

    ctx.restore();

    // STICK FIGURE
    ctx.save();
    ctx.translate(5, 4);
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    const flap = Math.sin(bird.wingAngle) * 12;

    // Legs (Improved alignment - meeting at hip)
    ctx.beginPath();
    // Back leg
    ctx.moveTo(-3, 0); ctx.lineTo(-8, -10); ctx.lineTo(0, -18);
    // Front leg
    ctx.moveTo(7, 0); ctx.lineTo(12, -10); ctx.lineTo(0, -18);
    ctx.stroke();

    // Torso (Connected at 0,-18)
    ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(3, -35); ctx.stroke();
    // TATTERED CLOAK
    ctx.fillStyle = color; ctx.globalAlpha = 0.35;
    ctx.beginPath(); ctx.moveTo(3, -35); ctx.lineTo(-40, -40 + flap); ctx.lineTo(-50, -10 - flap); ctx.lineTo(-10, -20); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1.0;
    // Helmet
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(6, -44, 5.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
}

// 3. PLASMA LANCER (Spear-Blade Stick Figure)
function drawLancer(ctx: CanvasRenderingContext2D, bird: BirdState, isDashing: boolean, _frames: number, color: string): void {
    const glow = isDashing ? '#fff' : color;
    ctx.shadowBlur = 15; ctx.shadowColor = glow;

    // PLASMA SPEAR
    ctx.save();
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath();
    ctx.moveTo(-50, 8); ctx.lineTo(40, 8); ctx.lineTo(65, 0); ctx.lineTo(40, -3); ctx.lineTo(-50, -3);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = glow; ctx.lineWidth = 1; ctx.stroke();

    // Quad Eyes (Robotic)
    ctx.fillStyle = color;
    for (let i = 0; i < 4; i++) {
        ctx.beginPath(); ctx.arc(-30 + i * 10, 2.5, 2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();

    // STICK FIGURE (Leaning forward)
    ctx.save();
    ctx.translate(20, 0);
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    const flap = Math.sin(bird.wingAngle) * 10;

    // Legs
    ctx.beginPath(); ctx.moveTo(-6, 2); ctx.lineTo(-10, -8); ctx.lineTo(-2, -16);
    ctx.moveTo(4, 2); ctx.lineTo(8, -8); ctx.lineTo(2, -16); ctx.stroke();
    // Torso
    ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(8, -32); ctx.stroke();
    // HIGH-TECH SCARF
    ctx.fillStyle = color; ctx.globalAlpha = 0.5;
    ctx.beginPath(); ctx.moveTo(8, -32); ctx.quadraticCurveTo(-20, -35 + flap, -60, -25 - flap); ctx.lineTo(-55, -15); ctx.lineTo(5, -25); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1.0;
    // Helmet
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(12, -40, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
}

// 4. VOID SAMURAI (Traditional Blade Stick Figure)
function drawSamurai(ctx: CanvasRenderingContext2D, bird: BirdState, isDashing: boolean, _frames: number, color: string): void {
    const glow = isDashing ? '#fff' : color;
    ctx.shadowBlur = 15; ctx.shadowColor = glow;

    // VOID KATANA
    ctx.save();
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath();
    ctx.moveTo(-45, 8); ctx.lineTo(-30, 8); ctx.lineTo(-30, 4); ctx.lineTo(40, 4);
    ctx.quadraticCurveTo(55, 4, 60, -2); ctx.lineTo(40, 6); ctx.lineTo(-30, 6); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = glow; ctx.lineWidth = 1; ctx.stroke();

    // Slit Eye
    ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(-15, 5, 10, 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // STICK FIGURE (Classic Stance)
    ctx.save();
    ctx.translate(5, 5);
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    const flap = Math.sin(bird.wingAngle) * 8;

    // Legs
    ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(-8, -10); ctx.lineTo(-2, -18);
    ctx.moveTo(6, 0); ctx.lineTo(10, -10); ctx.lineTo(4, -18); ctx.stroke();
    // Torso
    ctx.beginPath(); ctx.moveTo(1, -18); ctx.lineTo(2, -35); ctx.stroke();
    // MINIMALIST CLOAK (Added dynamic flap)
    ctx.fillStyle = color; ctx.globalAlpha = 0.4;
    ctx.beginPath(); ctx.moveTo(2, -35);
    ctx.bezierCurveTo(-30, -35 + flap, -55, -20 - flap, -70, -30 + flap);
    ctx.lineTo(-65, -10 + flap / 2);
    ctx.bezierCurveTo(-40, -5, -20, -20, 1, -28);
    ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1.0;
    // Helmet
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(5, -42, 5.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
}

// --- SKIN CONFIG: 5 VERY DISTINCT COLORS ---
const DISTINCT_COLORS = ['#ff00ff', '#00ffaa', '#00aaff', '#ffaa00', '#ff3333']; // Pink, Emerald, Sapphire, Amber, Ruby

export const SKINS: SkinDefinition[] = [
    ...createVariations('sphere', 'Neon Sphere', 'Standard magnetic containment unit with eyes and energy core.', ['Balanced'], DISTINCT_COLORS, drawSphere),
    ...createVariations('pigeon', 'Cyber Pigeon', 'Urban recon drone. High agility.', ['Agile'], DISTINCT_COLORS, drawPigeon),
    ...createVariations('shark', 'Cyber Shark', 'Apex predator of the data streams.', ['Fast'], DISTINCT_COLORS, drawShark),
    ...createVariations('butterfly', 'Cyber Butterfly', 'Bio-luminescent winged unit for silent data infiltration.', ['Flow'], DISTINCT_COLORS, drawButterfly),
    ...createVariations('chicken', 'Sky Pecker', 'Orbital poultry craft with pulse wings.', ['Hover'], DISTINCT_COLORS, drawChicken),
    ...createVariations('fish', 'Deep-Net Fish', 'Data stream inhabitant with oscillating tail.', ['Swim'], DISTINCT_COLORS, drawFish),
    ...createVariations('chimera', 'Cyber Chimera', 'Forbidden experimental hybrid predator.', ['Exotic'], DISTINCT_COLORS, drawChimera),
    ...createVariations('whale', 'Plasma Whale', 'Titan of the binary deep with energy fins.', ['Titan'], DISTINCT_COLORS, drawWhale),
    ...createVariations('phoenix', 'Cyber Phoenix', 'Mythical eternal bird reborn in neon fire.', ['Immortal'], DISTINCT_COLORS, drawPhoenix),
    ...createVariations('dragonfly', 'Neon Dragonfly', 'High-speed interceptor with quadruple wings.', ['Agile'], DISTINCT_COLORS, drawDragonfly),
    ...createVariations('bee', 'Cyber Bee', 'Aggressive swarm unit with pulse stinger.', ['Small'], DISTINCT_COLORS, drawBee),
    ...createVariations('flappy', 'Retro Flappy', 'Old-school classic reborn in the grid.', ['Classic'], DISTINCT_COLORS, drawClassicFlappy),
    ...createVariations('jellyfish', 'Plasma Jelly', 'Bioluminescent deep-sea explorer.', ['Fluid'], DISTINCT_COLORS, drawJellyfish),
    ...createVariations('duck', 'Cyber Duck', 'Tactical waterfowl with buoyant plating.', ['Quack'], DISTINCT_COLORS, drawDuck),
    ...createVariations('beetle', 'Iron Beetle', 'Heavy armored insect with hydraulic shell.', ['Heavy'], DISTINCT_COLORS, drawBeetle),
    ...createVariations('clownfish', 'Neon Clown', 'Playful reef inhabitant with energy bands.', ['Reef'], DISTINCT_COLORS, drawClownfish),
    ...createVariations('swordsurfer', 'Cyber Blade Walker', 'Legendary warrior surfing the data tides on a gravity-blade.', ['Legendary'], DISTINCT_COLORS, drawSwordSurfer, 1000),
    ...createVariations('reaper', 'Phantom Reaper', 'Demonic scythe-master with a tattered soul-cloak.', ['Grim'], DISTINCT_COLORS, drawReaper, 1000),
    ...createVariations('lancer', 'Plasma Lancer', 'Futuristic spear-rider with energy scarf.', ['Elite'], DISTINCT_COLORS, drawLancer, 1000),
    ...createVariations('samurai', 'Void Samurai', 'Traditional minimalist shadow-walker.', ['Swift'], DISTINCT_COLORS, drawSamurai, 1000),
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
        ctx.save();
        ctx.translate(bird.x, bird.y);
        ctx.rotate(bird.rotation);

        if (bird.invulnerableTimer > 0 || isDashing) {
            // Giữ độ hiển thị ổn định cho chim
            if (bird.invulnerableTimer > 0 && !isDashing) {
                ctx.globalAlpha = 0.9;
            }

            // --- VẼ KHIÊN BẢO VỆ TỔ ONG (HONEYCOMB SHIELD) ---
            ctx.save();
            const shieldRadius = bird.radius * 3.0;
            const shieldColor = isDashing ? '#fff' : '#00d2ff';

            // 1. Viền ngoài NET LIỀN (Solid Circle) với Glow rực rỡ
            ctx.beginPath();
            ctx.arc(0, 0, shieldRadius, 0, Math.PI * 2);
            ctx.strokeStyle = shieldColor;
            ctx.lineWidth = 2.5;
            ctx.shadowBlur = 18;
            ctx.shadowColor = shieldColor;
            ctx.globalAlpha = 0.4;
            ctx.stroke();

            // 2. Lớp màng bảo vệ mờ ảo
            ctx.beginPath();
            ctx.arc(0, 0, shieldRadius - 2, 0, Math.PI * 2);
            ctx.fillStyle = shieldColor;
            ctx.globalAlpha = 0.06;
            ctx.fill();

            // 3. Họa tiết Tổ ong (Xoay cực kỳ chậm)
            ctx.save();
            ctx.rotate(frames * -0.0015); // Xoay cực chậm
            ctx.globalAlpha = 0.12;
            ctx.strokeStyle = shieldColor;
            ctx.lineWidth = 0.6;

            const hexSize = 10;
            for (let q = -5; q <= 5; q++) {
                for (let r = -5; r <= 5; r++) {
                    const hx = hexSize * 1.5 * q;
                    const hy = hexSize * Math.sqrt(3) * (r + q / 2);

                    if (hx * hx + hy * hy < (shieldRadius - 4) * (shieldRadius - 4)) {
                        ctx.beginPath();
                        for (let i = 0; i < 6; i++) {
                            const angle = (Math.PI / 3) * i;
                            const x = hx + hexSize * Math.cos(angle);
                            const y = hy + hexSize * Math.sin(angle);
                            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                        }
                        ctx.closePath();
                        ctx.stroke();
                    }
                }
            }
            ctx.restore();
            ctx.restore();
        }

        if (skinId === 'default') {
            // Draw Classic Bird (Yellow)
            ctx.fillStyle = '#facc15'; // Yellow
            ctx.beginPath();
            ctx.ellipse(0, 0, 15, 12, 0, 0, Math.PI * 2);
            ctx.fill();

            // Eye
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(6, -6, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(8, -6, 2, 0, Math.PI * 2);
            ctx.fill();

            // Wing Animation (Fixed Pivot)
            ctx.fillStyle = '#fff';

            // Flap range: -0.5 to 0.5 (radians roughly)
            // Phase shifted for natural feel
            const flap = Math.sin(bird.wingAngle + Math.PI) * 0.5;

            ctx.save();
            // Translate to shoulder pivot point (relative to bird center 0,0)
            const pivotX = -2;
            const pivotY = 2;
            ctx.translate(pivotX, pivotY);
            // Rotate wing around shoulder
            ctx.rotate(flap * 0.5); // reduced amplitude for realism

            // Draw wing shape (relative to pivot 0,0)
            ctx.beginPath();
            ctx.ellipse(-6, 0, 8, 5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Beak
            ctx.fillStyle = '#f97316'; // Orange
            ctx.beginPath();
            ctx.moveTo(10, 0);
            ctx.lineTo(22, 4); // Slightly longer beak
            ctx.lineTo(10, 8);
            ctx.fill();
        } else {
            const skin = this.getSkinById(skinId);
            if (skin) {
                skin.drawFunction(ctx, bird, isDashing, frames);
            } else {
                // Fallback if skin not found (e.g. data corruption), draw Sphere-0
                const fallback = this.getAllSkins()[0];
                if (fallback) fallback.drawFunction(ctx, bird, isDashing, frames);
            }
        }
        ctx.restore();
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
