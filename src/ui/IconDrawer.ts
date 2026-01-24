
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
}
