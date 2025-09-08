import Phaser from 'phaser';
import { GameScene } from '../scenes/GameScene.js';
import { UIManager } from '../ui/UIManager.js';
import { AssetLoader } from '../utils/AssetLoader.js';

export class GameEngine {
    constructor() {
        this.config = {
            type: Phaser.AUTO,
            width: 1024,
            height: 768,
            parent: 'game-container',
            backgroundColor: '#2c3e50',
            pixelArt: true,
            antialias: false,
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { y: 300 },
                    debug: false
                }
            },
            scene: [GameScene],
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH,
                min: {
                    width: 800,
                    height: 600
                },
                max: {
                    width: 1920,
                    height: 1080
                }
            }
        };
        
        this.uiManager = null;
        this.assetLoader = null;
    }

    async init() {
        try {
            // Show loading screen
            this.showLoadingScreen();
            
            // Initialize asset loader
            this.assetLoader = new AssetLoader();
            await this.assetLoader.preloadAssets((progress) => {
                this.updateLoadingProgress(progress);
            });
            
            // Initialize UI Manager
            this.uiManager = new UIManager();
            this.uiManager.init();
            
            // Create Phaser game instance
            window.game = new Phaser.Game(this.config);
            
            // Store references globally
            window.gameEngine = this;
            window.uiManager = this.uiManager;
            
            // Hide loading screen after game is ready
            setTimeout(() => {
                this.hideLoadingScreen();
            }, 1000);
            
        } catch (error) {
            console.error('Failed to initialize game:', error);
            this.showError('Failed to load game. Please refresh the page.');
        }
    }

    showLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'flex';
        }
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            loadingScreen.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
    }

    updateLoadingProgress(progress) {
        const progressBar = document.getElementById('loading-progress');
        if (progressBar) {
            progressBar.style.width = `${progress * 100}%`;
        }
    }

    showError(message) {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.innerHTML = `
                <div class="loading-content">
                    <h1>Error</h1>
                    <p style="color: #ff4444; font-size: 12px; margin-top: 20px;">${message}</p>
                </div>
            `;
        }
    }
}