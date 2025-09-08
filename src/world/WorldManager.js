import Phaser from 'phaser';

export class WorldManager {
    constructor(scene) {
        this.scene = scene;
        this.currentZone = 'forest';
        this.zones = {};
        this.worldObjects = new Phaser.GameObjects.Group(scene);
        this.backgroundLayers = [];
        this.interactables = new Phaser.GameObjects.Group(scene);
        this.dayNightCycle = 0;
        
        this.initializeZones();
    }

    initializeZones() {
        this.zones = {
            forest: {
                name: 'Enchanted Forest',
                backgroundColor: 0x2d5016,
                tileTypes: ['grass', 'tree', 'stone'],
                enemies: ['goblin', 'wolf'],
                music: 'forest-theme'
            },
            desert: {
                name: 'Scorching Desert',
                backgroundColor: 0xffd700,
                tileTypes: ['sand', 'cactus', 'stone'],
                enemies: ['scorpion', 'bandit'],
                music: 'desert-theme'
            },
            dungeon: {
                name: 'Dark Dungeon',
                backgroundColor: 0x1a1a1a,
                tileTypes: ['stone', 'torch', 'door'],
                enemies: ['skeleton', 'ghost'],
                music: 'dungeon-theme'
            }
        };
    }

    createWorld() {
        this.generateTerrain();
        this.createBackground();
        this.spawnWorldObjects();
        this.createBoundaries();
    }

    generateTerrain() {
        const worldWidth = 2048;
        const worldHeight = 1536;
        const tileSize = 32;
        
        // Create ground layer
        for (let x = 0; x < worldWidth; x += tileSize) {
            for (let y = worldHeight - 200; y < worldHeight; y += tileSize) {
                const groundTile = this.scene.add.image(x, y, 'tile-grass');
                groundTile.setOrigin(0, 0);
            }
        }
        
        // Create platforms and elevated areas
        this.createPlatforms();
        
        // Add decorative elements
        this.addDecorations();
        
        // Set world bounds
        this.scene.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    }

    createPlatforms() {
        const platforms = [
            { x: 200, y: 1200, width: 300, height: 32 },
            { x: 800, y: 1100, width: 400, height: 32 },
            { x: 1400, y: 1000, width: 200, height: 32 },
            { x: 600, y: 900, width: 500, height: 32 }
        ];
        
        platforms.forEach(platform => {
            for (let x = platform.x; x < platform.x + platform.width; x += 32) {
                const tile = this.scene.add.image(x, platform.y, 'tile-stone');
                tile.setOrigin(0, 0);
                
                // Add physics body for collision
                this.scene.physics.add.existing(tile, true);
            }
        });
    }

    addDecorations() {
        // Add trees
        const treePositions = [
            { x: 100, y: 1200 }, { x: 300, y: 1280 }, { x: 500, y: 1250 },
            { x: 900, y: 1200 }, { x: 1200, y: 1300 }, { x: 1600, y: 1280 }
        ];
        
        treePositions.forEach(pos => {
            const tree = this.scene.add.image(pos.x, pos.y, 'tile-tree');
            tree.setOrigin(0.5, 1);
            tree.setDepth(pos.y);
        });
        
        // Add treasure chests
        this.createTreasureChests();
        
        // Add breakable objects
        this.createBreakables();
    }

    createTreasureChests() {
        const chestPositions = [
            { x: 400, y: 1150, loot: ['rare-sword', 'gold-100'] },
            { x: 1000, y: 950, loot: ['epic-armor', 'health-potion-5'] },
            { x: 1500, y: 1200, loot: ['legendary-bow', 'gold-500'] }
        ];
        
        chestPositions.forEach((pos, index) => {
            const chest = this.createTreasureChest(pos.x, pos.y, pos.loot);
            this.interactables.add(chest);
        });
    }

    createTreasureChest(x, y, loot) {
        // Create chest sprite
        const chestGraphics = this.scene.add.graphics();
        chestGraphics.fillStyle(0x8B4513); // Brown wood
        chestGraphics.fillRect(0, 8, 32, 20);
        chestGraphics.fillStyle(0xFFD700); // Gold hinges
        chestGraphics.fillRect(0, 16, 32, 4);
        chestGraphics.fillRect(14, 4, 4, 12);
        chestGraphics.generateTexture('treasure-chest', 32, 32);
        chestGraphics.destroy();
        
        const chest = this.scene.add.sprite(x, y, 'treasure-chest');
        chest.setOrigin(0.5, 1);
        chest.setInteractive();
        chest.loot = loot;
        chest.opened = false;
        
        // Add glow effect
        const glow = this.scene.add.circle(x, y - 16, 20, 0xFFD700, 0.3);
        chest.glow = glow;
        
        // Animate glow
        this.scene.tweens.add({
            targets: glow,
            alpha: 0.1,
            duration: 1500,
            yoyo: true,
            repeat: -1
        });
        
        chest.on('pointerdown', () => {
            this.openTreasureChest(chest);
        });
        
        return chest;
    }

    openTreasureChest(chest) {
        if (chest.opened) return;
        
        chest.opened = true;
        chest.setTexture('treasure-chest-open');
        chest.glow.destroy();
        
        // Give loot to player
        chest.loot.forEach(item => {
            if (item.startsWith('gold-')) {
                const amount = parseInt(item.split('-')[1]);
                this.scene.inventorySystem.gold += amount;
            } else {
                const itemData = this.scene.inventorySystem.generateItem({ type: item });
                this.scene.inventorySystem.addItem(itemData);
            }
        });
        
        // Show loot notification
        const lootText = this.scene.add.text(chest.x, chest.y - 50, 'Treasure Found!', {
            fontSize: '16px',
            fill: '#FFD700',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        this.scene.tweens.add({
            targets: lootText,
            y: lootText.y - 30,
            alpha: 0,
            duration: 2000,
            onComplete: () => lootText.destroy()
        });
    }

    createBreakables() {
        const cratePositions = [
            { x: 250, y: 1300 }, { x: 750, y: 1200 }, { x: 1300, y: 1250 }
        ];
        
        cratePositions.forEach(pos => {
            const crate = this.createBreakableCrate(pos.x, pos.y);
            this.interactables.add(crate);
        });
    }

    createBreakableCrate(x, y) {
        // Create crate sprite
        const crateGraphics = this.scene.add.graphics();
        crateGraphics.fillStyle(0x8B4513); // Brown wood
        crateGraphics.fillRect(0, 0, 24, 24);
        crateGraphics.strokeLineStyle(2, 0x654321);
        crateGraphics.strokeRect(0, 0, 24, 24);
        crateGraphics.strokeLineStyle(1, 0x654321);
        crateGraphics.lineBetween(8, 0, 8, 24);
        crateGraphics.lineBetween(16, 0, 16, 24);
        crateGraphics.lineBetween(0, 8, 24, 8);
        crateGraphics.lineBetween(0, 16, 24, 16);
        crateGraphics.generateTexture('breakable-crate', 24, 24);
        crateGraphics.destroy();
        
        const crate = this.scene.add.sprite(x, y, 'breakable-crate');
        crate.setOrigin(0.5, 1);
        crate.hp = 10;
        
        // Add physics for collision detection
        this.scene.physics.add.existing(crate, true);
        
        return crate;
    }

    createBackground() {
        // Create parallax background layers
        const layers = [
            { key: 'bg-sky', scrollFactor: 0.1, tint: 0x87CEEB },
            { key: 'bg-mountains', scrollFactor: 0.3, tint: 0x708090 },
            { key: 'bg-trees', scrollFactor: 0.6, tint: 0x228B22 }
        ];
        
        layers.forEach(layer => {
            this.createBackgroundLayer(layer);
        });
    }

    createBackgroundLayer(layerData) {
        // Create background sprites procedurally
        const graphics = this.scene.add.graphics();
        
        switch (layerData.key) {
            case 'bg-sky':
                graphics.fillGradientStyle(0x87CEEB, 0x87CEEB, 0xFFE4E1, 0xFFE4E1);
                graphics.fillRect(0, 0, 2048, 400);
                break;
            case 'bg-mountains':
                graphics.fillStyle(0x708090);
                for (let i = 0; i < 5; i++) {
                    const x = i * 400;
                    graphics.beginPath();
                    graphics.moveTo(x, 400);
                    graphics.lineTo(x + 200, 200);
                    graphics.lineTo(x + 400, 400);
                    graphics.closePath();
                    graphics.fillPath();
                }
                break;
            case 'bg-trees':
                graphics.fillStyle(0x228B22);
                for (let i = 0; i < 20; i++) {
                    const x = i * 100 + Math.random() * 50;
                    const height = 100 + Math.random() * 50;
                    graphics.fillRect(x, 400 - height, 20, height);
                    graphics.fillCircle(x + 10, 400 - height, 25);
                }
                break;
        }
        
        graphics.generateTexture(layerData.key, 2048, 400);
        
        const bgSprite = this.scene.add.tileSprite(0, 0, 2048, 400, layerData.key);
        bgSprite.setOrigin(0, 0);
        bgSprite.setScrollFactor(layerData.scrollFactor);
        bgSprite.setTint(layerData.tint);
        bgSprite.setDepth(-100);
        
        this.backgroundLayers.push(bgSprite);
        graphics.destroy();
    }

    createBoundaries() {
        // Create invisible walls at world edges
        const leftWall = this.scene.add.rectangle(-10, 768, 20, 1536, 0x000000, 0);
        const rightWall = this.scene.add.rectangle(2058, 768, 20, 1536, 0x000000, 0);
        const topWall = this.scene.add.rectangle(1024, -10, 2048, 20, 0x000000, 0);
        const bottomWall = this.scene.add.rectangle(1024, 1546, 2048, 20, 0x000000, 0);
        
        [leftWall, rightWall, topWall, bottomWall].forEach(wall => {
            this.scene.physics.add.existing(wall, true);
        });
    }

    update(delta) {
        this.updateDayNightCycle(delta);
        this.updateParallax();
        this.updateWorldObjects(delta);
    }

    updateDayNightCycle(delta) {
        this.dayNightCycle += delta / 120000; // 2 minute cycle
        if (this.dayNightCycle >= 1) this.dayNightCycle = 0;
        
        // Calculate light level (0 = night, 1 = day)
        const lightLevel = 0.3 + 0.7 * Math.abs(Math.sin(this.dayNightCycle * Math.PI));
        
        // Apply tint to background layers
        this.backgroundLayers.forEach(layer => {
            const tint = Phaser.Display.Color.GetColor32(
                Math.floor(255 * lightLevel),
                Math.floor(255 * lightLevel),
                Math.floor(255 * (lightLevel + 0.1))
            );
            layer.setTint(tint);
        });
    }

    updateParallax() {
        const camera = this.scene.cameras.main;
        this.backgroundLayers.forEach(layer => {
            if (layer.scrollFactorX !== 0) {
                layer.tilePositionX = camera.scrollX * layer.scrollFactorX;
            }
        });
    }

    updateWorldObjects(delta) {
        // Update any animated world objects
        this.interactables.children.entries.forEach(obj => {
            if (obj.update) {
                obj.update(delta);
            }
        });
    }

    changeZone(newZone) {
        if (this.zones[newZone]) {
            this.currentZone = newZone;
            this.scene.cameras.main.setBackgroundColor(this.zones[newZone].backgroundColor);
            // Could implement zone transition effects here
        }
    }

    getInteractableAt(x, y) {
        return this.interactables.children.entries.find(obj => {
            const distance = Phaser.Math.Distance.Between(x, y, obj.x, obj.y);
            return distance < 50;
        });
    }
}