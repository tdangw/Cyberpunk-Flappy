import './style.css';
import { Game } from './core/Game';
import { UIManager } from './ui/UIManager';

/**
 * Application entry point
 */
function init() {
  const canvas = document.getElementById('game') as HTMLCanvasElement;

  if (!canvas) {
    console.error('Canvas element not found!');
    return;
  }

  // Initialize game
  const game = new Game(canvas);

  // FORCE RESET DATA ONCE (Commented out for production)
  // game.resetAllData();

  // Initialize UI
  const ui = new UIManager(game);
  (window as any).uiManager = ui;

  console.log('🎮 Flappy Cyber Pro initialized');
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
