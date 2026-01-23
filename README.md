# Flappy Cyber Pro

**Cyberpunk Flappy Bird** game built with modern web technologies for professional game development.

## 🎮 Features

- **TypeScript**: Full type safety for maintainable code
- **Modular Architecture**: Clean separation of concerns
- **Data-Driven Design**: Easy to add skins, features, and content
- **Professional Structure**: Scalable for monetization and deployment
- **Canvas Rendering**: Optimized 2D graphics with cyberpunk aesthetic
- **Persistent Data**: LocalStorage for saves, coins, and unlocks

## 🏗️ Project Structure

```
flappy-cyber-pro/
├── src/
│   ├── core/                # Core game systems
│   │   ├── Game.ts          # Main game orchestrator
│   │   ├── InputManager.ts  # Input handling
│   │   └── Renderer.ts      # Rendering system
│   ├── entities/            # Game entities
│   │   ├── Bird.ts          # Player character
│   │   ├── PipeManager.ts   # Obstacles & coins
│   │   └── ParticleSystem.ts # Visual effects
│   ├── managers/            # High-level managers
│   │   ├── SaveManager.ts   # Data persistence
│   │   └── SkinManager.ts   # Skin system
│   ├── ui/                  # User interface
│   │   └── UIManager.ts     # Modal, HUD, buttons
│   ├── config/              # Configuration
│   │   └── constants.ts     # Game constants
│   ├── types/               # TypeScript types
│   │   └── index.ts         # Type definitions
│   ├── main.ts              # Entry point
│   └── style.css            # Styles
├── index.html
└── package.json
```

## 🚀 Quick Start

### Development

```bash
npm install
npm run dev
```

Open http://localhost:5173

### Build for Production

```bash
npm run build
npm run preview
```

## 🎨 Adding New Skins

Adding a new skin is simple - just add it to `src/managers/SkinManager.ts`:

```typescript
// 1. Create a draw function
function drawMySkin(
  ctx: CanvasRenderingContext2D,
  bird: BirdState,
  isDashing: boolean,
  frames: number
): void {
  // Your custom drawing code here
  ctx.fillStyle = '#00ff00';
  ctx.fillRect(-10, -10, 20, 20);
}

// 2. Add to SKINS array
export const SKINS: SkinDefinition[] = [
  // ... existing skins
  {
    id: 'myskin',
    name: 'My Cool Skin',
    price: 150,
    drawFunction: drawMySkin,
  },
];

// 3. Add preview element to index.html
<div class="skin-card" data-skin="myskin">
  <div class="skin-preview" id="preview-myskin"></div>
  <div class="skin-name">My Cool Skin</div>
  <div class="skin-price" data-cost="150">150 Coins</div>
</div>
```

## 💰 Monetization Ready

The architecture is prepared for monetization:

### Ad Integration (Future)

Create `src/managers/AdManager.ts`:

```typescript
export class AdManager {
  static showInterstitial() {
    // Google AdSense/AdMob integration
  }
  
  static showRewarded(callback: () => void) {
    // Rewarded video ads
  }
}
```

When to show ads:
- After every 3 game overs
- Before unlocking premium skins
- For bonus coins (rewarded ads)

### Revenue Streams

1. **Display Ads**: Banner ads on game over screen
2. **Interstitial Ads**: Full screen between sessions
3. **Rewarded Ads**: Watch ad for extra coins
4. **In-App Purchase** (if deploying as mobile app): Remove ads, coin packs

## 📱 Deployment

### Web (Static Hosting)

```bash
npm run build
# Deploy 'dist' folder to:
# - Vercel
# - Netlify
# - GitHub Pages
```

### Mobile App (Capacitor)

```bash
npm install @capacitor/core @capacitor/cli
npx cap init
npx cap add android
npx cap add ios
npm run build
npx cap sync
npx cap open android  # or ios
```

## 🔧 Game Configuration

Adjust gameplay in `src/config/constants.ts`:

```typescript
export const DEFAULT_CONFIG: GameConfig = {
  speed: 2,          // Pipe scroll speed
  gravity: 0.15,     // How fast bird falls
  jump: 6,           // Jump force
  pipeGap: 250,      // Gap between pipes
};
```

## 📊 Data Persistence

All player data is saved in LocalStorage:

```typescript
{
  coins: number,
  ownedSkins: string[],
  equippedSkin: string,
  highScore: number
}
```

## 🎯 Next Steps

### Short Term
- [ ] Add sound effects (Howler.js)
- [ ] Add background music toggle
- [ ] Implement leaderboard (Firebase)
- [ ] Create 5+ more skins
- [ ] Mobile touch controls optimization

### Medium Term
- [ ] Integrate Google AdSense
- [ ] Add power-ups system
- [ ] Create daily challenges
- [ ] Implement achievements
- [ ] Add themes (neon, retro, matrix)

### Long Term
- [ ] Multiplayer mode
- [ ] Tournament system
- [ ] NFT skin marketplace (optional)
- [ ] Cross-platform save (cloud)
- [ ] Publish to Play Store / App Store

## 🛠️ Tech Stack

- **Vite**: Build tool
- **TypeScript**: Type-safe JavaScript
- **Canvas API**: 2D rendering
- **LocalStorage**: Data persistence
- **CSS3**: Cyberpunk UI styling
- **Google Fonts**: Orbitron font

## 📝 License

MIT - feel free to use for commercial projects

## 🎮 Controls

- **SPACE** or **Click**: Jump
- **CTRL** or **SHIFT**: Dash (consumes energy)
- **Settings Icon**: Adjust gameplay
- **Shop Icon**: Buy skins with coins

---

**Built with ❤️ for professional game development**
