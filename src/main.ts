import './style.css';
import { Game } from './core/Game';
import { UIManager } from './ui/UIManager';

/**
 * Secure Application Entry Point
 * Wrapped in IIFE to prevent global scope pollution and console hacking
 */
(function () {
  function init() {
    const canvas = document.getElementById('game') as HTMLCanvasElement;

    if (!canvas) {
      console.error('Canvas element not found!');
      return;
    }

    // Initialize game (Private instance)
    const game = new Game(canvas);

    // Initialize UI (Private instance)
    new UIManager(game);

    console.log('🎮 Cyberpunk-Flappy initialized');
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
