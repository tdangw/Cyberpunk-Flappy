import type { BirdState, SkinDefinition } from '../types';

export function createVariations(baseId: string, baseName: string, baseDesc: string, baseFeatures: string[], colors: string[], drawFn: any, price: number = 500): SkinDefinition[] {
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

export function drawEye(ctx: CanvasRenderingContext2D, dx: number, dy: number): void {
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(dx, dy, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(dx + 2, dy, 2, 0, Math.PI * 2); ctx.fill();
}

export function drawShield(ctx: CanvasRenderingContext2D, bird: BirdState, isDashing: boolean, frames: number): void {
    if (bird.invulnerableTimer > 0 || isDashing) {
        if (bird.invulnerableTimer > 0 && !isDashing) {
            ctx.globalAlpha = 0.9;
        }
        ctx.save();
        const shieldRadius = bird.radius * 3.0;
        const shieldColor = isDashing ? '#fff' : '#00d2ff';
        ctx.beginPath();
        ctx.arc(0, 0, shieldRadius, 0, Math.PI * 2);
        ctx.strokeStyle = shieldColor;
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = 0.4;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, shieldRadius - 2, 0, Math.PI * 2);
        ctx.fillStyle = shieldColor;
        ctx.globalAlpha = 0.06;
        ctx.fill();
        ctx.save();
        ctx.rotate(frames * -0.0015);
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
    if (bird.invulnerableTimer > 0) {
        ctx.save();
        const pulse = (Math.sin(frames * 0.2) + 1) / 2;
        const alpha = Math.min(0.6, bird.invulnerableTimer / 30);
        ctx.strokeStyle = `rgba(0, 255, 247, ${alpha})`;
        ctx.lineWidth = 1 + pulse;
        ctx.beginPath();
        ctx.arc(0, 0, bird.radius + 6 + pulse * 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI * 2) / 6 + (frames * 0.05);
            const r = bird.radius + 4;
            const px = Math.cos(angle) * r;
            const py = Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.globalAlpha = alpha * 0.3;
        ctx.fillStyle = '#00fff7';
        ctx.fill();
        ctx.restore();
    }
}

export function drawOriginalBird(ctx: CanvasRenderingContext2D, bird: BirdState): void {
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-15, 0);
    ctx.quadraticCurveTo(-24, -2, -22, -12);
    ctx.quadraticCurveTo(-18, -10, -15, -5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.ellipse(-2, 5, 12, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(10, -6, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(12, -6, 2.5, 0, Math.PI * 2);
    ctx.fill();
    const flap = Math.sin(bird.wingAngle * 0.5) * 4;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.8;
    ctx.save();
    ctx.translate(-6, 2);
    ctx.rotate(flap * 0.05);
    const wingW = 10;
    const wingH = Math.max(1, 7 + flap);
    ctx.beginPath();
    ctx.ellipse(-4, 0, wingW, wingH, 0, 0, Math.PI * 2);
    ctx.save();
    ctx.clip();
    ctx.fillStyle = '#fff';
    ctx.fillRect(-4 - wingW, -wingH, wingW * 2, wingH);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(-4 - wingW, 0, wingW * 2, wingH);
    ctx.restore();
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#f97316';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.quadraticCurveTo(22, -2, 28, 5);
    ctx.lineTo(12, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(12, 5);
    ctx.lineTo(24, 5);
    ctx.quadraticCurveTo(22, 10, 12, 9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

export function drawSphere(ctx: CanvasRenderingContext2D, bird: BirdState, isDashing: boolean, _frames: number, color: string): void {
    const glow = isDashing ? '#fff' : color;
    ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fillStyle = '#111'; ctx.fill();
    ctx.strokeStyle = glow; ctx.lineWidth = 1.5; ctx.stroke();
    drawEye(ctx, 8, -4);
    ctx.fillStyle = glow; ctx.beginPath(); ctx.moveTo(10, 2); ctx.quadraticCurveTo(18, 5, 10, 8); ctx.lineTo(6, 5); ctx.closePath(); ctx.fill();
    const flap = Math.sin(bird.wingAngle) * 6;
    ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.moveTo(-5, 0); ctx.quadraticCurveTo(-15, -15 + flap, -25, -5 + flap); ctx.lineTo(-10, 5); ctx.closePath(); ctx.fill();
}

export function drawPigeon(ctx: CanvasRenderingContext2D, bird: BirdState, isDashing: boolean, _frames: number, color: string): void {
    const glow = isDashing ? '#fff' : color;
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.ellipse(0, 0, 18, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = glow; ctx.lineWidth = 1.5; ctx.stroke();
    drawEye(ctx, 12, -4);
    ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.moveTo(18, -2); ctx.lineTo(26, 0); ctx.lineTo(18, 2); ctx.closePath(); ctx.fill();
    const flap = Math.sin(bird.wingAngle) * 6;
    ctx.fillStyle = color; ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.moveTo(-5, 0); ctx.quadraticCurveTo(-15, -15 + flap, -25, -5 + flap); ctx.lineTo(-10, 5); ctx.closePath(); ctx.fill();
}

export function drawShark(ctx: CanvasRenderingContext2D, bird: BirdState, _isDashing: boolean, _frames: number, color: string): void {
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(-25, 0); ctx.bezierCurveTo(-25, -20, 25, -20, 35, 0); ctx.bezierCurveTo(25, 20, -25, 20, -25, 0); ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'; ctx.lineWidth = 1; ctx.stroke();
    drawEye(ctx, 20, -5);
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(10, -25); ctx.lineTo(15, -12); ctx.closePath(); ctx.fill(); ctx.stroke();
    const wobble = Math.sin(bird.wingAngle * 1.2) * 6;
    ctx.beginPath(); ctx.moveTo(-25, 0); ctx.lineTo(-35, -10 + wobble); ctx.lineTo(-35, 10 - wobble); ctx.closePath(); ctx.fill(); ctx.stroke();
}

export function drawButterfly(ctx: CanvasRenderingContext2D, bird: BirdState, isDashing: boolean, _frames: number, color: string): void {
    const glow = isDashing ? '#fff' : color;
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = glow; ctx.lineWidth = 1; ctx.stroke();
    ctx.beginPath();
    ctx.arc(12, -2, 4, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
    ctx.moveTo(14, -4); ctx.quadraticCurveTo(20, -15, 25, -20);
    ctx.moveTo(14, -4); ctx.quadraticCurveTo(18, -12, 18, -25);
    ctx.stroke();
    const flap = Math.sin(bird.wingAngle * 1.5) * 0.8;
    ctx.globalAlpha = 0.7;
    const drawDetailedWing = (isUpper: boolean) => {
        ctx.save();
        const yDir = isUpper ? -1 : 1;
        ctx.translate(-2, 2 * yDir);
        ctx.rotate(flap * yDir + (isUpper ? -0.4 : 0.4));
        ctx.beginPath();
        if (isUpper) {
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(-10, -35, -45, -30, -50, -5);
            ctx.bezierCurveTo(-45, 0, -10, 5, 0, 0);
        } else {
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(-5, 25, -35, 30, -35, 10);
            ctx.bezierCurveTo(-30, 0, -10, -5, 0, 0);
        }
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = glow; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 0.8;
        for (let i = 0; i < 5; i++) {
            ctx.moveTo(0, 0);
            const angle = (i - 2) * 0.3;
            const length = isUpper ? 40 : 25;
            ctx.lineTo(Math.cos(angle + (isUpper ? -2.2 : 2.2)) * length, Math.sin(angle + (isUpper ? -1.8 : 1.8)) * length);
        }
        ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.5;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(-40 + i * 5, isUpper ? -20 + i * 2 : 20 - i * 2, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    };
    drawDetailedWing(true);
    drawDetailedWing(false);
    ctx.globalAlpha = 1.0;
    drawEye(ctx, 14, -3);
}

export function drawChicken(ctx: CanvasRenderingContext2D, bird: BirdState, isDashing: boolean, _frames: number, color: string): void {
    const flap = Math.sin(bird.wingAngle) * 8;
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke();
    drawEye(ctx, 10, -5);
    ctx.fillStyle = '#ffd700'; ctx.beginPath(); ctx.moveTo(15, -2); ctx.lineTo(25, 4); ctx.lineTo(15, 8); ctx.fill();
    ctx.fillStyle = isDashing ? '#fff' : color;
    ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(-24, flap - 4); ctx.lineTo(-24, flap + 12); ctx.closePath(); ctx.fill(); ctx.stroke();
}

export function drawFish(ctx: CanvasRenderingContext2D, bird: BirdState, isDashing: boolean, _frames: number, color: string): void {
    const glow = isDashing ? '#fff' : color;
    const wobble = Math.sin(bird.wingAngle * 1.5) * 8;
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.ellipse(0, 0, 22, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = glow; ctx.lineWidth = isDashing ? 2.5 : 1.5; ctx.stroke();
    drawEye(ctx, 12, -4);
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(-20, 0); ctx.lineTo(-35, -15 + wobble); ctx.lineTo(-28, 0); ctx.lineTo(-35, 15 - wobble); ctx.closePath(); ctx.fill(); ctx.stroke();
}

export function drawChimera(ctx: CanvasRenderingContext2D, bird: BirdState, isDashing: boolean, _frames: number, color: string): void {
    const flap = Math.sin(bird.wingAngle) * 15;
    const glow = isDashing ? '#fff' : color;
    ctx.fillStyle = '#0a0a0a'; ctx.beginPath(); ctx.moveTo(25, 0); ctx.bezierCurveTo(20, -15, -5, -15, -15, 0); ctx.lineTo(-30, 0); ctx.bezierCurveTo(-15, 15, 20, 15, 25, 0); ctx.fill();
    ctx.strokeStyle = glow; ctx.lineWidth = 1.5; ctx.stroke();
    drawEye(ctx, 15, -4);
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, -5); ctx.quadraticCurveTo(-20, -40 + flap, -50, -10 + flap); ctx.lineTo(-25, 0); ctx.quadraticCurveTo(-20, 40 - flap, -50, 10 - flap); ctx.closePath(); ctx.fill(); ctx.stroke();
}

export function drawWhale(ctx: CanvasRenderingContext2D, bird: BirdState, isDashing: boolean, _frames: number, color: string): void {
    const glow = isDashing ? '#fff' : color;
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.ellipse(0, 0, 30, 18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = glow; ctx.lineWidth = 1.5; ctx.stroke();
    drawEye(ctx, 18, -5);
    const wobble = Math.sin(bird.wingAngle * 0.8) * 6;
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(-28, 0); ctx.quadraticCurveTo(-45, -20 + wobble, -55, -10 + wobble); ctx.lineTo(-55, 10 - wobble); ctx.quadraticCurveTo(-45, 20 - wobble, -28, 0); ctx.fill(); ctx.stroke();
}

export function drawPhoenix(ctx: CanvasRenderingContext2D, bird: BirdState, isDashing: boolean, frames: number, color: string): void {
    const glow = isDashing ? '#fff' : color;
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
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath();
    ctx.moveTo(25, 0);
    ctx.bezierCurveTo(20, -12, -10, -12, -20, 0);
    ctx.bezierCurveTo(-10, 12, 20, 12, 25, 0);
    ctx.fill();
    ctx.strokeStyle = glow; ctx.lineWidth = 2; ctx.stroke();
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
    ctx.ellipse(15, -4, 1.2, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.moveTo(22, -2);
    ctx.quadraticCurveTo(35, 0, 32, 8);
    ctx.quadraticCurveTo(28, 4, 22, 5);
    ctx.closePath();
    ctx.fill();
    const flap = Math.sin(bird.wingAngle) * 25;
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.quadraticCurveTo(-15, -45 + flap, -45, -20 + flap);
    ctx.quadraticCurveTo(-30, -5, -10, 0);
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 5);
    ctx.quadraticCurveTo(-15, 45 - flap, -45, 20 - flap);
    ctx.quadraticCurveTo(-30, 5, -10, 0);
    ctx.fill(); ctx.stroke();
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

export function drawDragonfly(ctx: CanvasRenderingContext2D, bird: BirdState, isDashing: boolean, _frames: number, color: string): void {
    const glow = isDashing ? '#fff' : color;
    ctx.fillStyle = '#1b1b1b';
    ctx.beginPath();
    ctx.ellipse(0, 0, 25, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = glow; ctx.lineWidth = 1.5; ctx.stroke();
    drawEye(ctx, 18, -2);
    const flap = Math.sin(bird.wingAngle * 2.5) * 0.6;
    ctx.fillStyle = color; ctx.globalAlpha = 0.4;
    for (let i = 0; i < 2; i++) {
        const xOffset = -5 - i * 10;
        ctx.save();
        ctx.translate(xOffset, -2);
        ctx.rotate(flap - 0.5);
        ctx.beginPath(); ctx.ellipse(-10, 0, 15, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.translate(xOffset, 2);
        ctx.rotate(-flap + 0.5);
        ctx.beginPath(); ctx.ellipse(-10, 0, 15, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.restore();
    }
    ctx.globalAlpha = 1.0;
}

export function drawBee(ctx: CanvasRenderingContext2D, bird: BirdState, _isDashing: boolean, _frames: number, color: string): void {
    ctx.save();
    ctx.rotate(0.1);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(-2, 4, 18, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3a2a0d'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#3a2a0d';
    ctx.beginPath();
    ctx.ellipse(-8, 4, 8, 13.5, 0, Math.PI * 0.4, Math.PI * 1.6);
    ctx.fill();
    ctx.fillRect(0, -9, 6, 26);
    ctx.beginPath();
    ctx.moveTo(-18, 4); ctx.lineTo(-28, 6); ctx.lineTo(-18, 10);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(12, -4, 13, 0, Math.PI * 2); ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 100, 100, 0.3)';
    ctx.beginPath(); ctx.arc(18, 0, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(16, -6, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(17.5, -6, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(16.5, -7, 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#3a2a0d'; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(15, -1, 4, 0.2, 2.5); ctx.stroke();
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(8, -15); ctx.quadraticCurveTo(5, -22, 4, -28); ctx.stroke();
    ctx.beginPath(); ctx.arc(4, -28, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(16, -15); ctx.quadraticCurveTo(19, -22, 20, -28); ctx.stroke();
    ctx.beginPath(); ctx.arc(20, -28, 3, 0, Math.PI * 2); ctx.fill();
    const flap = Math.sin(bird.wingAngle * 3.5) * 0.5;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.save();
    ctx.translate(-5, -6);
    ctx.rotate(flap - 0.5);
    ctx.beginPath(); ctx.ellipse(-14, 0, 18, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.translate(-8, -4);
    ctx.rotate(-flap + 0.3);
    ctx.beginPath(); ctx.ellipse(-12, 0, 15, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
    ctx.restore();
}

export function drawClassicFlappy(ctx: CanvasRenderingContext2D, bird: BirdState, _isDashing: boolean, _frames: number, color: string): void {
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.ellipse(0, 0, 18, 15, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(10, -6, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(12, -6, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f97316'; ctx.beginPath(); ctx.ellipse(15, 4, 10, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    const flap = Math.sin(bird.wingAngle) * 5;
    const wingH = Math.max(1, 6 + flap);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(-6, 2, 8, wingH, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
}

export function drawJellyfish(ctx: CanvasRenderingContext2D, _bird: BirdState, _isDashing: boolean, frames: number, color: string): void {
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(0, -5, 18, Math.PI, 0);
    ctx.quadraticCurveTo(18, 5, 10, 8);
    ctx.quadraticCurveTo(0, 5, -10, 8);
    ctx.quadraticCurveTo(-18, 5, -18, -5);
    ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-5, -5, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(5, -5, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
        const x = -10 + i * 10;
        const wave = Math.sin(frames * 0.1 + i) * 5;
        ctx.moveTo(x, 5);
        ctx.quadraticCurveTo(x + wave, 15, x, 25 + wave);
    }
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
}

export function drawDuck(ctx: CanvasRenderingContext2D, bird: BirdState, _isDashing: boolean, _frames: number, color: string): void {
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.ellipse(-4, 4, 18, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.stroke();
    ctx.beginPath(); ctx.arc(10, -5, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffaa00';
    ctx.beginPath();
    ctx.ellipse(20, -2, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(14, -8, 2, 0, Math.PI * 2); ctx.fill();
    const flap = Math.sin(bird.wingAngle) * 5;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath(); ctx.ellipse(-8, 5, 10, 6 + flap, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
}

export function drawBeetle(ctx: CanvasRenderingContext2D, bird: BirdState, isDashing: boolean, _frames: number, color: string): void {
    const glow = isDashing ? '#fff' : color;
    const wingFlap = Math.sin(bird.wingAngle * 4) * 20;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.ellipse(-10, -5 + wingFlap, 15, 8, -0.4, 0, Math.PI * 2);
    ctx.ellipse(-10, 5 - wingFlap, 15, 8, 0.4, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fill();
    const flap = Math.abs(Math.sin(bird.wingAngle)) * 0.6;
    ctx.fillStyle = color;
    ctx.save();
    ctx.translate(0, -2);
    ctx.rotate(-flap);
    ctx.beginPath(); ctx.ellipse(0, 0, 18, 18, 0, Math.PI, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.translate(0, 2);
    ctx.rotate(flap);
    ctx.beginPath(); ctx.ellipse(0, 0, 18, 18, 0, 0, Math.PI); ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.arc(15, 0, 9, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#333'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.moveTo(18, -2);
    ctx.quadraticCurveTo(28, -20, 42, -15);
    ctx.lineTo(38, -12);
    ctx.quadraticCurveTo(28, -15, 22, -2);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(22, 2);
    ctx.quadraticCurveTo(30, 8, 38, 2);
    ctx.lineTo(35, 0);
    ctx.quadraticCurveTo(28, 4, 22, 2);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(20, -4, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(20, 4, 2, 0, Math.PI * 2); ctx.fill();
}

export function drawClownfish(ctx: CanvasRenderingContext2D, bird: BirdState, _isDashing: boolean, _frames: number, color: string): void {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, 0, 24, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(10, -1, 9, 11, 0.1, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(-3, 0, 7, 16, 0.15, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(-16, 0, 5, 11, -0.1, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(14, -4, 5.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(16, -4, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(15.5, -5, 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(15, 1, 4, 0.3, 2.2); ctx.stroke();
    const wobble = Math.sin(bird.wingAngle * 1.5) * 8;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-22, 0);
    ctx.quadraticCurveTo(-38, -18 + wobble, -32, 0);
    ctx.quadraticCurveTo(-38, 18 - wobble, -22, 0);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-5, -14);
    ctx.quadraticCurveTo(5, -22, 10, -12);
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, 5, 10, 6 + wobble / 2, 0.5, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
}

export function drawSwordSurfer(ctx: CanvasRenderingContext2D, bird: BirdState, isDashing: boolean, frames: number, color: string): void {
    const glow = isDashing ? '#fff' : color;
    ctx.save();
    ctx.fillStyle = '#2a1a1a';
    ctx.beginPath();
    ctx.moveTo(-45, 5);
    ctx.lineTo(-20, -2); ctx.lineTo(0, 2); ctx.lineTo(25, -5); ctx.lineTo(55, 0);
    ctx.lineTo(25, 12); ctx.lineTo(0, 8); ctx.lineTo(-20, 15); ctx.lineTo(-45, 10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = glow; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.fillStyle = '#3a0a0a';
    ctx.beginPath();
    ctx.arc(-5, 5, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    const eyeX = -5; const eyeY = 5;
    const eyePulse = Math.sin(frames * 0.1) * 0.5;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(eyeX, eyeY, 8, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(eyeX, eyeY, 3.5 + eyePulse, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.ellipse(eyeX, eyeY, 1.5, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = glow; ctx.globalAlpha = 0.5; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-35, 5); ctx.lineTo(-15, 5);
    ctx.moveTo(5, 5); ctx.lineTo(40, 4);
    ctx.stroke();
    ctx.globalAlpha = 1.0;
    ctx.restore();
    ctx.save();
    ctx.translate(15, 0);
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const flap = Math.sin(bird.wingAngle) * 12;
    ctx.beginPath();
    ctx.moveTo(-4, 0); ctx.lineTo(-8, -10); ctx.lineTo(0, -20);
    ctx.moveTo(6, 0); ctx.lineTo(10, -10); ctx.lineTo(0, -20);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -20); ctx.lineTo(3, -38);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(2, -32); ctx.lineTo(12, -30 + flap / 4); ctx.lineTo(18, -34);
    ctx.stroke();
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
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath();
    ctx.arc(6, -47, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = glow; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(9, -48, 4, 3, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

export function drawReaper(ctx: CanvasRenderingContext2D, bird: BirdState, isDashing: boolean, _frames: number, color: string): void {
    const glow = isDashing ? '#fff' : color;
    ctx.save();
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath();
    ctx.moveTo(-45, 10); ctx.lineTo(10, 8);
    ctx.quadraticCurveTo(30, 5, 45, -20);
    ctx.lineTo(35, -15); ctx.quadraticCurveTo(25, 0, 0, 5); ctx.lineTo(-45, 8);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = glow; ctx.lineWidth = 1.2; ctx.stroke();
    const eyeX = -15; const eyeY = 4;
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(eyeX, eyeY, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(eyeX, eyeY, 2 + Math.sin(_frames * 0.1) * 1, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.translate(5, 4);
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    const flap = Math.sin(bird.wingAngle) * 12;
    ctx.beginPath();
    ctx.moveTo(-3, 0); ctx.lineTo(-8, -10); ctx.lineTo(0, -18);
    ctx.moveTo(7, 0); ctx.lineTo(12, -10); ctx.lineTo(0, -18);
    ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(3, -35); ctx.stroke();
    ctx.fillStyle = color; ctx.globalAlpha = 0.35;
    ctx.beginPath(); ctx.moveTo(3, -35); ctx.lineTo(-40, -40 + flap); ctx.lineTo(-50, -10 - flap); ctx.lineTo(-10, -20); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(6, -44, 5.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
}

export function drawLancer(ctx: CanvasRenderingContext2D, bird: BirdState, isDashing: boolean, _frames: number, color: string): void {
    const glow = isDashing ? '#fff' : color;
    ctx.save();
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath();
    ctx.moveTo(-50, 8); ctx.lineTo(40, 8); ctx.lineTo(65, 0); ctx.lineTo(40, -3); ctx.lineTo(-50, -3);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = glow; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = color;
    for (let i = 0; i < 4; i++) {
        ctx.beginPath(); ctx.arc(-30 + i * 10, 2.5, 2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    ctx.save();
    ctx.translate(20, 0);
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    const flap = Math.sin(bird.wingAngle) * 10;
    ctx.beginPath(); ctx.moveTo(-6, 2); ctx.lineTo(-10, -8); ctx.lineTo(-2, -16);
    ctx.moveTo(4, 2); ctx.lineTo(8, -8); ctx.lineTo(2, -16); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(8, -32); ctx.stroke();
    ctx.fillStyle = color; ctx.globalAlpha = 0.5;
    ctx.beginPath(); ctx.moveTo(8, -32); ctx.quadraticCurveTo(-20, -35 + flap, -60, -25 - flap); ctx.lineTo(-55, -15); ctx.lineTo(5, -25); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(12, -40, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
}

export function drawSamurai(ctx: CanvasRenderingContext2D, bird: BirdState, isDashing: boolean, _frames: number, color: string): void {
    const glow = isDashing ? '#fff' : color;
    ctx.save();
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath();
    ctx.moveTo(-45, 8); ctx.lineTo(-30, 8); ctx.lineTo(-30, 4); ctx.lineTo(40, 4);
    ctx.quadraticCurveTo(55, 4, 60, -2); ctx.lineTo(40, 6); ctx.lineTo(-30, 6); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = glow; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(-15, 5, 10, 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.translate(5, 5);
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    const flap = Math.sin(bird.wingAngle) * 8;
    ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(-8, -10); ctx.lineTo(-2, -18);
    ctx.moveTo(6, 0); ctx.lineTo(10, -10); ctx.lineTo(4, -18); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(1, -18); ctx.lineTo(2, -35); ctx.stroke();
    ctx.fillStyle = color; ctx.globalAlpha = 0.4;
    ctx.beginPath(); ctx.moveTo(2, -35);
    ctx.bezierCurveTo(-30, -35 + flap, -55, -20 - flap, -70, -30 + flap);
    ctx.lineTo(-65, -10 + flap / 2);
    ctx.bezierCurveTo(-40, -5, -20, -20, 1, -28);
    ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(5, -42, 5.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
}

export function drawAetherDragon(ctx: CanvasRenderingContext2D, bird: BirdState, isDashing: boolean, frames: number, color: string): void {
    ctx.save();
    ctx.scale(0.6, 0.6);
    const glow = isDashing ? '#fff' : color;
    const flap = Math.sin(bird.wingAngle) * 20;
    const isBlinking = (frames % 180) > 172;
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath();
    ctx.moveTo(-35, -5);
    ctx.quadraticCurveTo(-45, 0, -35, 5);
    ctx.quadraticCurveTo(-15, 20, 10, 12);
    ctx.lineTo(32, 6);
    ctx.quadraticCurveTo(46, 2, 46, -2);
    ctx.lineTo(38, -6);
    ctx.quadraticCurveTo(10, -12, -35, -5);
    ctx.fill();
    ctx.strokeStyle = glow;
    ctx.lineWidth = 2.0;
    ctx.stroke();
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.moveTo(0, 12); ctx.lineTo(-8, 22); ctx.lineTo(-2, 12); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-15, 10); ctx.lineTo(-20, 18); ctx.lineTo(-12, 10); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = glow; ctx.lineWidth = 0.8; ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(38, 1);
    ctx.quadraticCurveTo(20, 10, -15, 18 + Math.sin(frames * 0.06) * 4);
    ctx.moveTo(38, -1);
    ctx.quadraticCurveTo(20, -10, -15, -18 + Math.cos(frames * 0.06) * 4);
    ctx.stroke();
    ctx.restore();
    const corePulse = (Math.sin(frames * 0.08) + 1) * 0.5;
    ctx.save();
    ctx.globalAlpha = 0.2 + corePulse * 0.3;
    const coreGrad = ctx.createRadialGradient(-5, 0, 2, -5, 0, 14);
    coreGrad.addColorStop(0, '#fff');
    coreGrad.addColorStop(0.6, color);
    coreGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = coreGrad;
    ctx.setTransform(ctx.getTransform().scale(1 + corePulse * 0.1, 1 + corePulse * 0.1));
    ctx.beginPath(); ctx.arc(-5 / (1 + corePulse * 0.1), 0, 14, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.0;
    ctx.globalAlpha = 0.45;
    for (let i = 0; i < 5; i++) {
        const sx = -28 + i * 11;
        const sy = -3 + (i * 0.9);
        ctx.beginPath();
        ctx.moveTo(sx, sy - 6);
        ctx.quadraticCurveTo(sx + 3, sy, sx, sy + 6);
        ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.moveTo(10, -13); ctx.lineTo(6, -32); ctx.lineTo(18, -16);
    ctx.moveTo(22, -11); ctx.lineTo(22, -26); ctx.lineTo(30, -13);
    ctx.fill();
    if (!isBlinking) {
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.ellipse(33, -3, 4.2, 3.2, 0.1, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(35, -3, 1.6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(34, -4, 0.7, 0, Math.PI * 2); ctx.fill();
    } else {
        ctx.strokeStyle = glow; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(30, -3); ctx.lineTo(38, -3); ctx.stroke();
    }
    const drawEtherWing = (isUpper: boolean) => {
        const yDir = isUpper ? -1 : 1;
        ctx.save();
        ctx.translate(-5, 4 * yDir);
        ctx.rotate(flap * 0.008 * yDir);
        const grad = ctx.createRadialGradient(0, 0, 5, -30, -15 * yDir, 50);
        grad.addColorStop(0, color);
        grad.addColorStop(0.6, `rgba(0, 255, 204, 0.15)`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        if (isUpper) {
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(-20, -45 + flap, -75, -35 + flap, -85, -8 + flap / 2);
            ctx.quadraticCurveTo(-40, 2, 0, 0);
        } else {
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(-15, 35 - flap, -65, 40 - flap, -75, 15 - flap / 2);
            ctx.quadraticCurveTo(-35, 4, 0, 0);
        }
        ctx.fill();
        ctx.strokeStyle = color; ctx.lineWidth = 1.0; ctx.globalAlpha = 0.3; ctx.stroke();
        ctx.restore();
    };
    drawEtherWing(true);
    drawEtherWing(false);
    for (let i = 0; i < 5; i++) {
        const tx = -55 - i * 14;
        const ty = Math.sin(frames * 0.04 + i * 0.6) * 6;
        const s = 4.5 - i * 0.8;
        ctx.save();
        ctx.translate(tx, ty);
        ctx.globalAlpha = 1.0 - i * 0.18;
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.4;
        ctx.stroke();
        ctx.restore();
    }
    ctx.restore();
}

