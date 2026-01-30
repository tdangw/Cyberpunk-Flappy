export class GroundDecorationManager {
    private decorations: { x: number; y: number; type: string; variant: number; scale: number; rotation: number }[] = [];
    private density: number = 40;
    private nextGap: number = 0;

    constructor() { }

    reset(width: number, height: number, groundHeight: number): void {
        this.decorations = [];
        this.nextGap = Math.random() * this.density + 10;

        // Pre-fill screen
        let currentX = 0;
        while (currentX < width + 100) {
            this.spawnDecorationAt(currentX, height, groundHeight);
            currentX += Math.random() * this.density + 10;
        }
    }

    update(speed: number, dtRatio: number, width: number, height: number, groundHeight: number): void {
        // Scroll decorations
        for (let i = this.decorations.length - 1; i >= 0; i--) {
            this.decorations[i].x -= speed * dtRatio;
            if (this.decorations[i].x < -50) {
                this.decorations.splice(i, 1);
            }
        }

        // Spawn new ones based on gap from the last added decoration
        // If no decorations, treat the last one as being way off-screen to the left
        const lastDecorX = this.decorations.length > 0
            ? this.decorations[this.decorations.length - 1].x
            : -1000;

        const spawnX = width + 50;

        // If the gap is large enough, spawn a new one
        if (spawnX - lastDecorX > this.nextGap) {
            // Random chance check is removed here to ensure consistent density, 
            // or we keep it but only if we really want gaps.
            // Given user feedback "too few grass", let's fill every gap.

            // Performance Cap: Don't spawn if too many items (e.g., > 35) 
            if (this.decorations.length < 35) {
                this.spawnDecorationAt(width + 50, height, groundHeight);
            }

            // Calculate next gap
            this.nextGap = Math.random() * this.density + 10;
        }
    }

    private spawnDecorationAt(x: number, height: number, groundHeight: number): void {
        const types = ['grass', 'grass', 'grass', 'flower', 'rock', 'rock']; // Weight probability
        const type = types[Math.floor(Math.random() * types.length)];

        let y = height - groundHeight;
        let scale = 0.8 + Math.random() * 0.4;
        let rotation = (Math.random() - 0.5) * 0.2; // Slight tilt

        // Adjustment for type
        // if (type === 'rock') y += 5;

        this.decorations.push({
            x: x,
            y: y,
            type: type,
            variant: Math.floor(Math.random() * 3), // 3 variants per type
            scale: scale,
            rotation: rotation
        });
    }

    render(ctx: CanvasRenderingContext2D): void {
        ctx.save();

        // Optimize clipping? No, just draw
        // Performance: Only draw visible items
        for (const dec of this.decorations) {
            if (dec.x < -50 || dec.x > ctx.canvas.width + 50) continue;

            ctx.save();
            ctx.translate(dec.x, dec.y);
            ctx.scale(dec.scale, dec.scale);
            ctx.rotate(dec.rotation);

            if (dec.type === 'grass') {
                this.drawGrass(ctx, dec.variant);
            } else if (dec.type === 'flower') {
                this.drawFlower(ctx, dec.variant);
            } else if (dec.type === 'rock') {
                this.drawRock(ctx, dec.variant);
            }

            ctx.restore();
        }
        ctx.restore();
    }

    private drawGrass(ctx: CanvasRenderingContext2D, variant: number): void {
        // Green Grass
        ctx.strokeStyle = '#4ade80'; // Bright Green default
        ctx.fillStyle = '#22c55e';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';

        ctx.beginPath();
        if (variant === 0) {
            // Tuft
            ctx.moveTo(0, 0); ctx.quadraticCurveTo(-5, -15, -10, -5);
            ctx.moveTo(0, 0); ctx.quadraticCurveTo(2, -20, 0, -10);
            ctx.moveTo(0, 0); ctx.quadraticCurveTo(8, -12, 10, -2);
            ctx.stroke();
        } else if (variant === 1) {
            // Bushy
            ctx.moveTo(0, 0);
            ctx.arc(0, -5, 8, Math.PI, 0);
            ctx.fill();
        } else {
            // Tall
            ctx.moveTo(0, 0); ctx.lineTo(-2, -18);
            ctx.moveTo(3, 0); ctx.lineTo(5, -15);
            ctx.stroke();
        }
    }

    private drawFlower(ctx: CanvasRenderingContext2D, variant: number): void {
        // Stem
        ctx.strokeStyle = '#4ade80';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(5, -10, 0, -20);
        ctx.stroke();

        // Bloom
        ctx.fillStyle = variant === 0 ? '#f472b6' : (variant === 1 ? '#facc15' : '#c084fc'); // Pink, Yellow, Purple
        ctx.beginPath();
        ctx.arc(0, -20, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff'; // Center
        ctx.beginPath();
        ctx.arc(0, -20, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    private drawRock(ctx: CanvasRenderingContext2D, variant: number): void {
        ctx.fillStyle = '#555'; // Dark Grey
        ctx.beginPath();
        if (variant === 0) {
            ctx.arc(0, 0, 8, Math.PI, 0); // Dome
        } else if (variant === 1) {
            ctx.moveTo(-10, 0);
            ctx.lineTo(-5, -8);
            ctx.lineTo(5, -12);
            ctx.lineTo(12, 0);
        } else {
            ctx.arc(-4, 0, 5, Math.PI, 0);
            ctx.arc(4, 0, 7, Math.PI, 0);
        }
        ctx.fill();
    }
}
