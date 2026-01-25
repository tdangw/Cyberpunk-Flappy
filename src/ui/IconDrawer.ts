
/**
 * Utility to generate custom code-drawn icons for the shop
 */
export class IconDrawer {
    static getNitroIcon(type: string, size: number = 60): string {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;

        ctx.clearRect(0, 0, size, size);
        ctx.save();
        ctx.translate(size / 2, size / 2);

        const isDefault = type === 'nitro_default';
        const color = this.getColorForType(type);

        // Draw Battery body
        ctx.fillStyle = '#111';
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;

        // Main body
        const bw = size * 0.4;
        const bh = size * 0.7;
        ctx.strokeRect(-bw / 2, -bh / 2, bw, bh);
        ctx.fillRect(-bw / 2, -bh / 2, bw, bh);

        // Cap
        ctx.fillStyle = color;
        ctx.fillRect(-bw / 4, -bh / 2 - 8, bw / 2, 8);

        // Glow/Neon detail
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;

        if (isDefault) {
            // Recyclable/Default icon (+ and -)
            ctx.fillStyle = color;
            ctx.font = `bold ${size * 0.2}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('+', 0, -bh / 4);
            ctx.fillText('-', 0, bh / 3);
        } else {
            // Bolt icon for premium cells
            ctx.beginPath();
            ctx.moveTo(0, -bh / 3);
            ctx.lineTo(-bw / 3, bh / 10);
            ctx.lineTo(bw / 5, bh / 10);
            ctx.lineTo(0, bh / 3);
            ctx.lineTo(bw / 3, -bh / 10);
            ctx.lineTo(-bw / 5, -bh / 10);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
        return canvas.toDataURL();
    }

    private static getColorForType(type: string): string {
        switch (type) {
            case 'nitro_basic': return '#00fff7';
            case 'nitro_advanced': return '#39ff14';
            case 'nitro_premium': return '#ff00ff';
            case 'nitro_super': return '#ffd700';
            case 'nitro_ultra': return '#ff4500'; // OrangeRed
            case 'nitro_quantum': return '#adff2f'; // GreenYellow
            case 'nitro_hyper': return '#ffffff'; // White/Hyper
            default: return '#888';
        }
    }
    static getSimpleIcon(type: 'success' | 'error' | 'shop' | 'settings' | 'fullscreen' | 'map_0' | 'map_1' | 'map_2' | 'map_3' | 'map_4' | 'map_5', size: number = 60): string {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;

        ctx.translate(size / 2, size / 2);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        switch (type) {
            case 'success':
                this.drawCheckmark(ctx, size);
                break;
            case 'error':
                this.drawCross(ctx, size);
                break;
            case 'shop':
                this.drawShop(ctx, size);
                break;
            case 'settings':
                this.drawGear(ctx, size);
                break;
            case 'fullscreen':
                this.drawFullscreen(ctx, size);
                break;
            case 'map_0': this.drawMapIcon(ctx, size, 'hightech'); break; // Neon City
            case 'map_1': this.drawMapIcon(ctx, size, 'jungle'); break;   // Techno Jungle
            case 'map_2': this.drawMapIcon(ctx, size, 'ocean'); break;    // Ocean Abyss
            case 'map_3': this.drawMapIcon(ctx, size, 'volcano'); break;  // Volcano Core
            case 'map_4': this.drawMapIcon(ctx, size, 'space'); break;    // Star Forge
            case 'map_5': this.drawMapIcon(ctx, size, 'sunny'); break;    // Sunny Highlands
        }

        return canvas.toDataURL();
    }

    private static drawCheckmark(ctx: CanvasRenderingContext2D, size: number) {
        const r = size * 0.4;
        ctx.strokeStyle = '#39ff14'; // Neon Green
        ctx.lineWidth = 4;
        ctx.shadowColor = '#39ff14';
        ctx.shadowBlur = 10;

        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-r * 0.5, 0);
        ctx.lineTo(-r * 0.1, r * 0.4);
        ctx.lineTo(r * 0.5, -r * 0.4);
        ctx.stroke();
    }

    private static drawCross(ctx: CanvasRenderingContext2D, size: number) {
        const r = size * 0.4;
        ctx.strokeStyle = '#ff003c'; // Neon Red
        ctx.lineWidth = 4;
        ctx.shadowColor = '#ff003c';
        ctx.shadowBlur = 10;

        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-r * 0.4, -r * 0.4);
        ctx.lineTo(r * 0.4, r * 0.4);
        ctx.moveTo(r * 0.4, -r * 0.4);
        ctx.lineTo(-r * 0.4, r * 0.4);
        ctx.stroke();
    }

    private static drawShop(ctx: CanvasRenderingContext2D, size: number) {
        const color = '#00fff7'; // Neon Blue
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;

        const s = size * 0.5; // Scale factor relative to half size

        // Centering adjustment
        ctx.translate(-size * 0.05, size * 0.05);

        ctx.beginPath();
        // Handle start (left)
        ctx.moveTo(-s, -s * 0.8);
        ctx.lineTo(-s * 0.7, -s * 0.8);
        // Back of cart (downwards)
        ctx.lineTo(-s * 0.5, s * 0.4);
        // Bottom of basket
        ctx.lineTo(s * 0.6, s * 0.4);
        // Front of basket (upwards angled)
        ctx.lineTo(s * 0.8, -s * 0.4);
        // Top of basket (back to handle/back connection)
        ctx.lineTo(-s * 0.6, -s * 0.4);
        ctx.stroke();

        // Internal Grid Lines (Horizontal)
        ctx.beginPath();
        ctx.moveTo(-s * 0.55, -s * 0.1);
        ctx.lineTo(s * 0.7, -s * 0.1);
        ctx.stroke();

        // Internal Grid Lines (Vertical)
        ctx.beginPath();
        ctx.moveTo(0, s * 0.4); // Middle bottom
        ctx.lineTo(0.1 * s, -s * 0.4); // Middle top
        ctx.stroke();

        // Wheels
        ctx.fillStyle = color;
        const wheelR = size * 0.08;

        ctx.beginPath();
        ctx.arc(-s * 0.2, s * 0.7, wheelR, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(s * 0.4, s * 0.7, wheelR, 0, Math.PI * 2);
        ctx.fill();
    }

    private static drawGear(ctx: CanvasRenderingContext2D, size: number) {
        ctx.strokeStyle = '#00fff7'; // Cyan
        ctx.fillStyle = '#00fff7';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#00fff7';
        ctx.shadowBlur = 5;

        const outerR = size * 0.35;
        const innerR = size * 0.25;
        const teeth = 8;

        ctx.beginPath();
        for (let i = 0; i < teeth * 2; i++) {
            const angle = (Math.PI * 2 * i) / (teeth * 2);
            const r = (i % 2 === 0) ? outerR : innerR * 1.1;
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, size * 0.1, 0, Math.PI * 2);
        ctx.fill();
    }

    private static drawFullscreen(ctx: CanvasRenderingContext2D, size: number) {
        ctx.strokeStyle = '#00fff7'; // Neon Blue
        ctx.lineWidth = 3;
        ctx.shadowColor = '#00fff7';
        ctx.shadowBlur = 5;

        const s = size * 0.2;
        const d = size * 0.4; // dist from center

        ctx.beginPath();
        // TL
        ctx.moveTo(-d, -d + s); ctx.lineTo(-d, -d); ctx.lineTo(-d + s, -d);
        // TR
        ctx.moveTo(d, -d + s); ctx.lineTo(d, -d); ctx.lineTo(d - s, -d);
        // BR
        ctx.moveTo(d, d - s); ctx.lineTo(d, d); ctx.lineTo(d - s, d);
        // BL
        ctx.moveTo(-d, d - s); ctx.lineTo(-d, d); ctx.lineTo(-d + s, d);
        ctx.stroke();
    }

    private static drawMapIcon(ctx: CanvasRenderingContext2D, size: number, type: string) {
        const s = size * 0.3;

        if (type === 'sunny') { // Map 5
            ctx.fillStyle = '#facc15'; // Sun
            ctx.shadowColor = '#facc15'; ctx.shadowBlur = 10;
            ctx.beginPath(); ctx.arc(0, -5, s, 0, Math.PI * 2); ctx.fill();
            // Hills
            ctx.fillStyle = '#4ade80'; // Green
            ctx.beginPath(); ctx.moveTo(-s * 2, size / 2);
            ctx.quadraticCurveTo(-s, 0, 0, size / 2);
            ctx.quadraticCurveTo(s, 0, s * 2, size / 2);
            ctx.fill();
        }
        else if (type === 'hightech') { // Neon City Map 0
            ctx.fillStyle = '#00fff7';
            ctx.shadowColor = '#00fff7'; ctx.shadowBlur = 10;
            // Buildings
            ctx.fillRect(-15, 0, 10, 20);
            ctx.fillRect(-2, -10, 8, 30);
            ctx.fillRect(10, 5, 10, 15);
        }
        else if (type === 'jungle') { // Jungle Map 1
            ctx.strokeStyle = '#39ff14';
            ctx.shadowColor = '#39ff14'; ctx.shadowBlur = 5; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(0, 20); ctx.lineTo(0, -15); ctx.stroke();
            // Leaves
            ctx.beginPath(); ctx.ellipse(-5, -5, 8, 3, Math.PI / 4, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.ellipse(5, -10, 8, 3, -Math.PI / 4, 0, Math.PI * 2); ctx.stroke();
        }
        else if (type === 'ocean') { // Ocean Map 2
            const s = size * 0.4;
            ctx.strokeStyle = '#0ea5e9'; // Sky Blue
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.shadowColor = '#0ea5e9'; ctx.shadowBlur = 8;

            // Wave 1
            ctx.beginPath();
            ctx.moveTo(-s, 0);
            ctx.bezierCurveTo(-s / 2, -s / 2, 0, s / 2, s, -5);
            ctx.stroke();

            // Wave 2 (lower)
            ctx.beginPath();
            ctx.moveTo(-s + 5, 12);
            ctx.bezierCurveTo(-s / 2, 12 - s / 3, 0, 12 + s / 3, s - 5, 8);
            ctx.stroke();

            // Bubbles
            ctx.shadowBlur = 5;
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(-10, -15, 3, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.arc(15, -10, 4, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.arc(5, -25, 2, 0, Math.PI * 2); ctx.stroke();
        }
        else if (type === 'volcano') { // Volcano Map 3
            const s = size * 0.35;
            // Base
            ctx.fillStyle = '#b91c1c'; // Dark Red
            ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.moveTo(-s, s);
            ctx.lineTo(-s / 3, -s / 2); // Left slope
            // Crater
            ctx.quadraticCurveTo(0, -s / 2 + 5, s / 3, -s / 2);
            ctx.lineTo(s, s); // Right slope
            ctx.closePath();
            ctx.fill();

            // Lava Flow
            ctx.fillStyle = '#fca5a5'; // Light Red/Orange
            ctx.beginPath();
            ctx.moveTo(-2, -s / 2 + 3);
            ctx.quadraticCurveTo(0, 0, 2, -s / 2 + 3);
            ctx.fill();

            // Eruption particles
            ctx.fillStyle = '#ef4444';
            for (let i = 0; i < 4; i++) {
                const ox = (Math.random() - 0.5) * 15;
                const oy = -s / 2 - 5 - Math.random() * 12;
                const r = 2 + Math.random() * 2;
                ctx.beginPath(); ctx.arc(ox, oy, r, 0, Math.PI * 2); ctx.fill();
            }
        }
        else if (type === 'space') { // Star Forge Map 4 -> Now Earth Style
            const r = size * 0.35;
            const color = '#00fff7'; // Neon Blue

            ctx.shadowColor = color;
            ctx.shadowBlur = 10;
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.fillStyle = color;

            // Earth Circle Outline
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.stroke();

            // Simple "Continent" shapes inside (Cyber styled)
            // Americas approximation
            ctx.beginPath();
            ctx.moveTo(-r * 0.4, -r * 0.5);
            ctx.bezierCurveTo(-r * 0.1, -r * 0.6, r * 0.2, -r * 0.2, r * 0.3, -r * 0.4); // North
            ctx.bezierCurveTo(r * 0.1, 0, -r * 0.1, 0.2, r * 0.2, r * 0.6); // South tail
            ctx.bezierCurveTo(-r * 0.2, r * 0.4, -r * 0.5, 0, -r * 0.4, -r * 0.5); // West side
            ctx.globalAlpha = 0.3;
            ctx.fill();
            ctx.globalAlpha = 1.0;
            ctx.stroke();

            // Eurasia/Africa approximation
            ctx.beginPath();
            ctx.moveTo(r * 0.5, -r * 0.6);
            ctx.quadraticCurveTo(r * 0.8, -r * 0.2, r * 0.5, r * 0.5);
            ctx.quadraticCurveTo(r * 0.2, r * 0.2, r * 0.5, -r * 0.6);
            ctx.globalAlpha = 0.3;
            ctx.fill();
            ctx.globalAlpha = 1.0;
            ctx.stroke();

            // Grid lines (Latitude / Longitude) for Cyber feel
            ctx.beginPath();
            ctx.ellipse(0, 0, r, r * 0.4, 0, 0, Math.PI * 2); // Equator
            ctx.stroke();

            ctx.beginPath();
            ctx.ellipse(0, 0, r * 0.4, r, 0, 0, Math.PI * 2); // Meridian
            ctx.stroke();

            // Satellites / Stars
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(-r * 1.2, -r * 0.8, 2, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(r * 1.1, r * 0.9, 1.5, 0, Math.PI * 2); ctx.fill();
        }
    }
}
