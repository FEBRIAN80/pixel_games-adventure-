import Phaser from 'phaser';
import { Player } from '../entities/Player.js';
import { EnemyManager } from '../entities/EnemyManager.js';
import { WorldManager } from '../world/WorldManager.js';
import { CombatSystem } from '../systems/CombatSystem.js';
import { InventorySystem } from '../systems/InventorySystem.js';
import { QuestSystem } from '../systems/QuestSystem.js';
import { InputManager } from '../input/InputManager.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        
        this.player = null;
        this.enemyManager = null;
        this.worldManager = null;
        this.combatSystem = null;
        this.inventorySystem = null;
        this.questSystem = null;
        this.inputManager = null;
        
        this.gameTime = 0;
        this.dayNightCycle = 0;
    }

    preload() {
        // Create pixel art sprites programmatically
        this.createPixelAssets();
        
        // Load any external assets
        this.load.json('gameData', 'data/gameData.json');
    }

    create() {
        // Initialize game systems
        this.initializeSystems();
        
        // Create world
        this.worldManager.createWorld();
        
        // Create player
        this.player = new Player(this, 400, 300);
        this.add.existing(this.player);
        
        // Initialize enemy manager
        this.enemyManager.init();
        
        // Set up camera to follow player
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setLerp(0.1, 0.1);
        this.cameras.main.setDeadzone(100, 100);
        
        // Initialize input handling
        this.inputManager.init();
        
        // Start initial quests
        this.questSystem.startInitialQuests();
        
        // Set up game events
        this.setupGameEvents();
        
        console.log('Game scene initialized successfully!');
    }

    update(time, delta) {
        this.gameTime = time;
        
        // Update day/night cycle
        this.updateDayNightCycle(delta);
        
        // Update game systems
        this.inputManager.update();
        this.player.update(delta);
        this.enemyManager.update(delta);
        this.combatSystem.update(delta);
        this.questSystem.update(delta);
        
        // Update world
        this.worldManager.update(delta);
    }

    initializeSystems() {
        this.worldManager = new WorldManager(this);
        this.combatSystem = new CombatSystem(this);
        this.inventorySystem = new InventorySystem(this);
        this.questSystem = new QuestSystem(this);
        this.inputManager = new InputManager(this);
        this.enemyManager = new EnemyManager(this);
    }

    updateDayNightCycle(delta) {
        // 24-hour cycle in 24 minutes (1 hour = 1 minute)
        this.dayNightCycle += delta / 60000; // Convert to minutes
        if (this.dayNightCycle >= 24) this.dayNightCycle = 0;
        
        // Update lighting based on time
        const isNight = this.dayNightCycle >= 18 || this.dayNightCycle < 6;
        const lightLevel = isNight ? 0.3 : 1.0;
        
        this.cameras.main.setTint(
            Phaser.Display.Color.GetColor32(
                Math.floor(255 * lightLevel),
                Math.floor(255 * lightLevel),
                Math.floor(255 * (lightLevel + 0.1))
            )
        );
    }

    setupGameEvents() {
        // Listen for player events
        this.player.on('levelUp', (newLevel) => {
            window.uiManager.showLevelUp(newLevel);
            this.questSystem.checkQuestProgress('level', newLevel);
        });
        
        this.player.on('takeDamage', (damage) => {
            window.uiManager.showDamageFlash();
        });
        
        // Listen for combat events
        this.combatSystem.on('enemyKilled', (enemy) => {
            this.questSystem.checkQuestProgress('kill', enemy.enemyType);
            this.inventorySystem.handleEnemyLoot(enemy);
        });
        
        // Listen for quest events
        this.questSystem.on('questCompleted', (quest) => {
            window.uiManager.showQuestComplete(quest);
        });
    }

    createPixelAssets() {
        // Create player sprite (32x32 pixels)
        const playerGraphics = this.add.graphics();
        playerGraphics.fillStyle(0x4CAF50); // Green body
        playerGraphics.fillRect(8, 8, 16, 24);
        playerGraphics.fillStyle(0xFFDBB0); // Skin color for head
        playerGraphics.fillRect(10, 2, 12, 10);
        playerGraphics.fillStyle(0x8B4513); // Brown hair
        playerGraphics.fillRect(8, 0, 16, 6);
        playerGraphics.generateTexture('player-idle', 32, 32);
        playerGraphics.destroy();

        // Create enemy sprites
        this.createEnemySprites();
        
        // Create weapon sprites
        this.createWeaponSprites();
        
        // Create item sprites
        this.createItemSprites();
        
        // Create world tiles
        this.createWorldTiles();
    }

    createEnemySprites() {
        // Goblin sprite
        const goblinGraphics = this.add.graphics();
        goblinGraphics.fillStyle(0x8B4513); // Brown body
        goblinGraphics.fillRect(6, 10, 20, 22);
        goblinGraphics.fillStyle(0x90EE90); // Light green skin
        goblinGraphics.fillRect(8, 4, 16, 12);
        goblinGraphics.fillStyle(0xFF0000); // Red eyes
        goblinGraphics.fillRect(10, 8, 2, 2);
        goblinGraphics.fillRect(20, 8, 2, 2);
        goblinGraphics.generateTexture('enemy-goblin', 32, 32);
        goblinGraphics.destroy();

        // Wolf sprite
        const wolfGraphics = this.add.graphics();
        wolfGraphics.fillStyle(0x696969); // Gray body
        wolfGraphics.fillRect(2, 16, 28, 12);
        wolfGraphics.fillStyle(0x2F4F4F); // Dark gray head
        wolfGraphics.fillRect(18, 8, 14, 16);
        wolfGraphics.fillStyle(0xFFFFFF); // White fangs
        wolfGraphics.fillRect(24, 16, 2, 4);
        wolfGraphics.fillRect(26, 16, 2, 4);
        wolfGraphics.generateTexture('enemy-wolf', 32, 32);
        wolfGraphics.destroy();

        // Skeleton sprite
        const skeletonGraphics = this.add.graphics();
        skeletonGraphics.fillStyle(0xFFFAF0); // Bone white
        skeletonGraphics.fillRect(8, 8, 16, 24);
        skeletonGraphics.fillStyle(0x2F4F4F); // Dark armor
        skeletonGraphics.fillRect(6, 12, 20, 16);
        skeletonGraphics.fillStyle(0xFF0000); // Red eye sockets
        skeletonGraphics.fillRect(10, 10, 2, 2);
        skeletonGraphics.fillRect(20, 10, 2, 2);
        skeletonGraphics.generateTexture('enemy-skeleton', 32, 32);
        skeletonGraphics.destroy();
    }

    createWeaponSprites() {
        // Sword
        const swordGraphics = this.add.graphics();
        swordGraphics.fillStyle(0xC0C0C0); // Silver blade
        swordGraphics.fillRect(14, 2, 4, 20);
        swordGraphics.fillStyle(0x8B4513); // Brown handle
        swordGraphics.fillRect(12, 22, 8, 8);
        swordGraphics.fillStyle(0xFFD700); // Gold crossguard
        swordGraphics.fillRect(10, 18, 12, 4);
        swordGraphics.generateTexture('weapon-sword', 32, 32);
        swordGraphics.destroy();

        // Bow
        const bowGraphics = this.add.graphics();
        bowGraphics.fillStyle(0x8B4513); // Brown wood
        bowGraphics.fillRect(15, 4, 2, 24);
        bowGraphics.lineStyle(2, 0x654321); // Correct line style for bow curve
        bowGraphics.beginPath();
        bowGraphics.arc(16, 16, 12, -Math.PI/3, Math.PI/3, false); // Draw bow curve
        bowGraphics.strokePath();
        bowGraphics.generateTexture('weapon-bow', 32, 32);
        bowGraphics.destroy();

        // Staff
        const staffGraphics = this.add.graphics();
        staffGraphics.fillStyle(0x8B4513); // Brown handle
        staffGraphics.fillRect(15, 8, 2, 20);
        staffGraphics.fillStyle(0x9932CC); // Purple orb
        staffGraphics.fillCircle(16, 8, 4);
        staffGraphics.generateTexture('weapon-staff', 32, 32);
        staffGraphics.destroy();
    }

    createItemSprites() {
        // Health potion
        const healthPotionGraphics = this.add.graphics();
        // Draw bottle first
        healthPotionGraphics.lineStyle(2, 0x8B4513); // Brown bottle outline
        healthPotionGraphics.beginPath();
        healthPotionGraphics.strokeRect(12, 8, 8, 16);
        // Draw liquid
        healthPotionGraphics.fillStyle(0xFF0000); // Red liquid
        healthPotionGraphics.fillRect(12, 8, 8, 16);
        // Add bottle neck
        healthPotionGraphics.fillStyle(0x8B4513);
        healthPotionGraphics.fillRect(14, 6, 4, 2);
        healthPotionGraphics.generateTexture('item-health-potion', 32, 32);
        healthPotionGraphics.destroy();

        // Mana potion
        const manaPotionGraphics = this.add.graphics();
        // Draw bottle first
        manaPotionGraphics.lineStyle(2, 0x8B4513); // Brown bottle outline
        manaPotionGraphics.beginPath();
        manaPotionGraphics.strokeRect(12, 8, 8, 16);
        // Draw liquid
        manaPotionGraphics.fillStyle(0x0000FF); // Blue liquid
        manaPotionGraphics.fillRect(12, 8, 8, 16);
        // Add bottle neck
        manaPotionGraphics.fillStyle(0x8B4513);
        manaPotionGraphics.fillRect(14, 6, 4, 2);
        manaPotionGraphics.generateTexture('item-mana-potion', 32, 32);
        manaPotionGraphics.destroy();

        // Gold coin
        const goldGraphics = this.add.graphics();
        goldGraphics.fillStyle(0xFFD700); // Gold color
        goldGraphics.fillCircle(16, 16, 6);
        goldGraphics.fillStyle(0xFFA500); // Darker gold for detail
        goldGraphics.fillCircle(16, 16, 4);
        goldGraphics.generateTexture('item-gold', 32, 32);
        goldGraphics.destroy();
    }

    createWorldTiles() {
        // Grass tile
        const grassGraphics = this.add.graphics();
        grassGraphics.fillStyle(0x228B22); // Forest green
        grassGraphics.fillRect(0, 0, 32, 32);
        grassGraphics.fillStyle(0x32CD32); // Lime green patches
        grassGraphics.fillRect(4, 4, 6, 6);
        grassGraphics.fillRect(18, 12, 8, 8);
        grassGraphics.fillRect(8, 22, 10, 6);
        grassGraphics.generateTexture('tile-grass', 32, 32);
        grassGraphics.destroy();

        // Stone tile
        const stoneGraphics = this.add.graphics();
        stoneGraphics.fillStyle(0x696969); // Dim gray
        stoneGraphics.fillRect(0, 0, 32, 32);
        stoneGraphics.fillStyle(0x778899); // Light slate gray cracks
        stoneGraphics.fillRect(8, 0, 2, 32);
        stoneGraphics.fillRect(0, 12, 32, 2);
        stoneGraphics.fillRect(20, 0, 2, 32);
        stoneGraphics.generateTexture('tile-stone', 32, 32);
        stoneGraphics.destroy();

        // Tree
        const treeGraphics = this.add.graphics();
        treeGraphics.fillStyle(0x8B4513); // Saddle brown trunk
        treeGraphics.fillRect(12, 16, 8, 16);
        treeGraphics.fillStyle(0x228B22); // Forest green leaves
        treeGraphics.fillCircle(16, 12, 12);
        treeGraphics.generateTexture('tile-tree', 32, 32);
        treeGraphics.destroy();

        // Water
        const waterGraphics = this.add.graphics();
        waterGraphics.fillStyle(0x4682B4); // Steel blue
        waterGraphics.fillRect(0, 0, 32, 32);
        waterGraphics.fillStyle(0x87CEEB); // Sky blue ripples
        waterGraphics.fillRect(4, 8, 24, 2);
        waterGraphics.fillRect(2, 16, 28, 2);
        waterGraphics.fillRect(6, 24, 20, 2);
        waterGraphics.generateTexture('tile-water', 32, 32);
        waterGraphics.destroy();
    }
}