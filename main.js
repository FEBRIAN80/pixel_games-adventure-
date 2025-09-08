import { GameEngine } from './src/core/GameEngine.js';

// Initialize the game when the page loads
window.addEventListener('load', () => {
    const gameEngine = new GameEngine();
    gameEngine.init();
});

// Handle window resize
window.addEventListener('resize', () => {
    if (window.game) {
        window.game.scale.refresh();
    }
});

// Prevent context menu on right-click
document.addEventListener('contextmenu', (e) => e.preventDefault());

// Prevent default touch behaviors on mobile
document.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });