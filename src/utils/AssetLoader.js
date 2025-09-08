export class AssetLoader {
    constructor() {
        this.totalAssets = 0;
        this.loadedAssets = 0;
        this.assets = {
            images: {},
            audio: {},
            data: {}
        };
    }

    async preloadAssets(progressCallback) {
        try {
            console.log('Starting asset preload...');
            
            // Load game data first
            await this.loadGameData();
            
            // Create all sprite assets programmatically
            this.createPixelArtAssets();
            
            // Load audio assets (if available)
            await this.loadAudioAssets();
            
            // Simulate loading progress for visual feedback
            await this.simulateLoadingProgress(progressCallback);
            
            console.log('Asset preload completed successfully!');
            
        } catch (error) {
            console.error('Failed to preload assets:', error);
            throw error;
        }
    }

    async loadGameData() {
        try {
            // In a real application, you might load from external files
            // For now, we'll use the data that's already defined in the project
            this.assets.data.gameData = {
                version: "1.0.0",
                gameTitle: "Pixel Quest RPG"
            };
            
            this.updateProgress();
        } catch (error) {
            console.warn('Could not load external game data, using defaults');
            this.assets.data.gameData = { version: "1.0.0" };
        }
    }

    createPixelArtAssets() {
        // This method creates all the pixel art programmatically
        // The actual creation happens in GameScene.createPixelAssets()
        // Here we just track that we're "loading" them
        
        const assetTypes = [
            'player-sprites',
            'enemy-sprites', 
            'weapon-sprites',
            'item-sprites',
            'world-tiles',
            'ui-elements',
            'particle-effects',
            'background-layers'
        ];
        
        assetTypes.forEach(type => {
            this.assets.images[type] = { loaded: true, generated: true };
            this.updateProgress();
        });
    }

    async loadAudioAssets() {
        // Define audio assets that would be loaded
        const audioAssets = [
            'sword-swing',
            'arrow-shoot', 
            'magic-cast',
            'enemy-hit',
            'player-hurt',
            'level-up',
            'quest-complete',
            'item-pickup',
            'forest-ambient',
            'desert-winds',
            'dungeon-echoes',
            'boss-battle'
        ];
        
        // For now, we'll simulate loading since we don't have actual audio files
        audioAssets.forEach(asset => {
            this.assets.audio[asset] = { 
                loaded: true, 
                simulated: true,
                path: `/audio/${asset}.wav`
            };
            this.updateProgress();
        });
    }

    async simulateLoadingProgress(progressCallback) {
        // Simulate gradual loading for better UX
        const steps = 20;
        for (let i = 0; i <= steps; i++) {
            await new Promise(resolve => setTimeout(resolve, 50));
            if (progressCallback) {
                progressCallback(i / steps);
            }
        }
    }

    updateProgress() {
        this.loadedAssets++;
        this.totalAssets = Math.max(this.totalAssets, this.loadedAssets);
    }

    getAsset(type, name) {
        return this.assets[type] && this.assets[type][name];
    }

    isAssetLoaded(type, name) {
        return this.getAsset(type, name) && this.getAsset(type, name).loaded;
    }

    // Helper methods for creating procedural sprites
    static createSpriteTexture(scene, width, height, drawFunction) {
        const graphics = scene.add.graphics();
        drawFunction(graphics);
        const texture = graphics.generateTexture('temp', width, height);
        graphics.destroy();
        return texture;
    }

    static drawPixelCharacter(graphics, colors = {}) {
        const {
            skin = 0xFFDBB0,
            hair = 0x8B4513,
            shirt = 0x4CAF50,
            pants = 0x2196F3
        } = colors;

        // Head
        graphics.fillStyle(skin);
        graphics.fillRect(10, 2, 12, 10);
        
        // Hair
        graphics.fillStyle(hair);
        graphics.fillRect(8, 0, 16, 6);
        
        // Body
        graphics.fillStyle(shirt);
        graphics.fillRect(8, 12, 16, 12);
        
        // Legs
        graphics.fillStyle(pants);
        graphics.fillRect(10, 24, 5, 8);
        graphics.fillRect(17, 24, 5, 8);
        
        // Arms
        graphics.fillStyle(skin);
        graphics.fillRect(6, 14, 4, 10);
        graphics.fillRect(22, 14, 4, 10);
    }

    static drawPixelEnemy(graphics, enemyType) {
        switch(enemyType) {
            case 'goblin':
                // Green goblin
                graphics.fillStyle(0x8B4513); // Brown clothes
                graphics.fillRect(6, 10, 20, 22);
                graphics.fillStyle(0x90EE90); // Light green skin
                graphics.fillRect(8, 4, 16, 12);
                graphics.fillStyle(0xFF0000); // Red eyes
                graphics.fillRect(10, 8, 2, 2);
                graphics.fillRect(20, 8, 2, 2);
                break;
                
            case 'wolf':
                // Gray wolf
                graphics.fillStyle(0x696969); // Gray body
                graphics.fillRect(2, 16, 28, 12);
                graphics.fillStyle(0x2F4F4F); // Dark gray head
                graphics.fillRect(18, 8, 14, 16);
                graphics.fillStyle(0xFFFFFF); // White fangs
                graphics.fillRect(24, 16, 2, 4);
                graphics.fillRect(26, 16, 2, 4);
                break;
                
            case 'skeleton':
                // Bone skeleton
                graphics.fillStyle(0xFFFAF0); // Bone white
                graphics.fillRect(8, 8, 16, 24);
                graphics.fillStyle(0x2F4F4F); // Dark armor
                graphics.fillRect(6, 12, 20, 16);
                graphics.fillStyle(0xFF0000); // Red eye sockets
                graphics.fillRect(10, 10, 2, 2);
                graphics.fillRect(20, 10, 2, 2);
                break;
        }
    }

    static drawPixelWeapon(graphics, weaponType) {
        switch(weaponType) {
            case 'sword':
                graphics.fillStyle(0xC0C0C0); // Silver blade
                graphics.fillRect(14, 2, 4, 20);
                graphics.fillStyle(0x8B4513); // Brown handle
                graphics.fillRect(12, 22, 8, 8);
                graphics.fillStyle(0xFFD700); // Gold crossguard
                graphics.fillRect(10, 18, 12, 4);
                break;
                
            case 'bow':
                graphics.fillStyle(0x8B4513); // Brown wood
                graphics.fillRect(15, 4, 2, 24);
                graphics.strokeLineStyle(1, 0x654321);
                graphics.strokePath();
                break;
                
            case 'staff':
                graphics.fillStyle(0x8B4513); // Brown handle
                graphics.fillRect(15, 8, 2, 20);
                graphics.fillStyle(0x9932CC); // Purple orb
                graphics.fillCircle(16, 8, 4);
                break;
        }
    }

    static drawPixelTile(graphics, tileType) {
        switch(tileType) {
            case 'grass':
                graphics.fillStyle(0x228B22); // Forest green
                graphics.fillRect(0, 0, 32, 32);
                graphics.fillStyle(0x32CD32); // Lime green patches
                graphics.fillRect(4, 4, 6, 6);
                graphics.fillRect(18, 12, 8, 8);
                graphics.fillRect(8, 22, 10, 6);
                break;
                
            case 'stone':
                graphics.fillStyle(0x696969); // Dim gray
                graphics.fillRect(0, 0, 32, 32);
                graphics.fillStyle(0x778899); // Light slate gray cracks
                graphics.fillRect(8, 0, 2, 32);
                graphics.fillRect(0, 12, 32, 2);
                graphics.fillRect(20, 0, 2, 32);
                break;
                
            case 'tree':
                graphics.fillStyle(0x8B4513); // Saddle brown trunk
                graphics.fillRect(12, 16, 8, 16);
                graphics.fillStyle(0x228B22); // Forest green leaves
                graphics.fillCircle(16, 12, 12);
                break;
                
            case 'water':
                graphics.fillStyle(0x4682B4); // Steel blue
                graphics.fillRect(0, 0, 32, 32);
                graphics.fillStyle(0x87CEEB); // Sky blue ripples
                graphics.fillRect(4, 8, 24, 2);
                graphics.fillRect(2, 16, 28, 2);
                graphics.fillRect(6, 24, 20, 2);
                break;
        }
    }

    // Audio utility methods
    static createAudioContext() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            return new AudioContext();
        } catch (error) {
            console.warn('Web Audio API not supported');
            return null;
        }
    }

    static generateTone(frequency, duration, type = 'sine') {
        const audioContext = this.createAudioContext();
        if (!audioContext) return null;

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
        
        return oscillator;
    }
}