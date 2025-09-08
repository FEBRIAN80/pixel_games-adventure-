import Phaser from 'phaser';
import { Enemy } from './Enemy.js';

export class EnemyManager {
    constructor(scene) {
        this.scene = scene;
        this.enemies = new Phaser.GameObjects.Group(scene);
        this.spawnPoints = [];
        this.maxEnemies = 15;
        this.spawnTimer = 0;
        this.spawnDelay = 3000; // 3 seconds
    }

    init() {
        // Define spawn points across the world
        this.spawnPoints = [
            { x: 200, y: 500, type: 'goblin' },
            { x: 800, y: 400, type: 'wolf' },
            { x: 1200, y: 350, type: 'skeleton' },
            { x: 600, y: 200, type: 'goblin' },
            { x: 1000, y: 600, type: 'wolf' }
        ];
        
        // Spawn initial enemies
        this.spawnInitialEnemies();
    }

    update(delta) {
        this.spawnTimer += delta;
        
        if (this.spawnTimer >= this.spawnDelay && this.enemies.children.size < this.maxEnemies) {
            this.spawnRandomEnemy();
            this.spawnTimer = 0;
        }
        
        // Update all enemies
        this.enemies.children.entries.forEach(enemy => {
            if (enemy.active) {
                enemy.update(delta);
            }
        });
    }

    spawnInitialEnemies() {
        this.spawnPoints.forEach(point => {
            this.spawnEnemy(point.x, point.y, point.type);
        });
    }

    spawnRandomEnemy() {
        const spawnPoint = Phaser.Utils.Array.GetRandom(this.spawnPoints);
        const enemyTypes = ['goblin', 'wolf', 'skeleton'];
        const randomType = Phaser.Utils.Array.GetRandom(enemyTypes);
        
        // Add some randomness to spawn position
        const x = spawnPoint.x + Phaser.Math.Between(-50, 50);
        const y = spawnPoint.y + Phaser.Math.Between(-30, 30);
        
        this.spawnEnemy(x, y, randomType);
    }

    spawnEnemy(x, y, type) {
        const enemy = new Enemy(this.scene, x, y, type);
        this.enemies.add(enemy);
        this.scene.add.existing(enemy);
        
        // Set up collision with player
        this.scene.physics.add.overlap(enemy, this.scene.player, (enemy, player) => {
            enemy.attackPlayer(player);
        });
        
        return enemy;
    }

    removeEnemy(enemy) {
        this.enemies.remove(enemy);
        enemy.destroy();
    }

    getEnemiesInRange(x, y, range) {
        return this.enemies.children.entries.filter(enemy => {
            const distance = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
            return distance <= range && enemy.active;
        });
    }

    getNearestEnemy(x, y) {
        let nearest = null;
        let minDistance = Infinity;
        
        this.enemies.children.entries.forEach(enemy => {
            if (enemy.active) {
                const distance = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearest = enemy;
                }
            }
        });
        
        return nearest;
    }
}