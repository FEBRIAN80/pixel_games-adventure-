import Phaser from 'phaser';

export class Player extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player-idle');
        
        this.scene = scene;
        
        // Player stats
        this.stats = {
            level: 1,
            hp: 100,
            maxHp: 100,
            mp: 50,
            maxMp: 50,
            xp: 0,
            xpToNext: 100,
            strength: 10,
            dexterity: 10,
            intelligence: 10,
            defense: 5
        };
        
        // Player state
        this.isMoving = false;
        this.isRunning = false;
        this.isAttacking = false;
        this.facingRight = true;
        this.invulnerable = false;
        this.invulnerabilityTime = 0;
        
        // Movement properties
        this.speed = 150;
        this.runMultiplier = 1.5;
        this.jumpPower = 350;
        
        // Equipment
        this.equipment = {
            weapon: { type: 'sword', damage: 15, attackSpeed: 1.0 },
            armor: { type: 'basic', defense: 5 },
            helmet: null,
            boots: null
        };
        
        this.setupPhysics();
        this.setupAnimations();
        this.updateUI();
    }

    setupPhysics() {
        // Enable physics
        this.scene.physics.add.existing(this);
        this.body.setSize(20, 28);
        this.body.setOffset(6, 4);
        this.body.setCollideWorldBounds(true);
        this.body.setDragX(500);
        this.body.setMaxVelocityX(this.speed * this.runMultiplier);
    }

    setupAnimations() {
        // Create animations if they don't exist
        if (!this.scene.anims.exists('player-walk')) {
            // For now, use the same frame - in a real game you'd have multiple frames
            this.scene.anims.create({
                key: 'player-walk',
                frames: [{ key: 'player-idle', frame: null }],
                frameRate: 8,
                repeat: -1
            });
        }
        
        if (!this.scene.anims.exists('player-attack')) {
            this.scene.anims.create({
                key: 'player-attack',
                frames: [{ key: 'player-idle', frame: null }],
                frameRate: 12,
                repeat: 0
            });
        }
    }

    update(delta) {
        this.handleInvulnerability(delta);
        this.updateAnimation();
        this.updateUI();
    }

    handleInvulnerability(delta) {
        if (this.invulnerable) {
            this.invulnerabilityTime -= delta;
            if (this.invulnerabilityTime <= 0) {
                this.invulnerable = false;
                this.setAlpha(1);
            } else {
                // Flashing effect
                this.setAlpha(0.5 + 0.5 * Math.sin(this.invulnerabilityTime * 0.02));
            }
        }
    }

    updateAnimation() {
        if (this.isAttacking) {
            this.play('player-attack', true);
        } else if (this.isMoving) {
            this.play('player-walk', true);
        } else {
            this.play('player-idle', true);
        }
        
        // Flip sprite based on facing direction
        this.setFlipX(!this.facingRight);
    }

    moveLeft() {
        this.body.setVelocityX(-this.speed * (this.isRunning ? this.runMultiplier : 1));
        this.isMoving = true;
        this.facingRight = false;
    }

    moveRight() {
        this.body.setVelocityX(this.speed * (this.isRunning ? this.runMultiplier : 1));
        this.isMoving = true;
        this.facingRight = true;
    }

    moveUp() {
        this.body.setVelocityY(-this.speed * (this.isRunning ? this.runMultiplier : 1));
        this.isMoving = true;
    }

    moveDown() {
        this.body.setVelocityY(this.speed * (this.isRunning ? this.runMultiplier : 1));
        this.isMoving = true;
    }

    stopMoving() {
        this.isMoving = false;
    }

    setRunning(running) {
        this.isRunning = running;
    }

    jump() {
        if (this.body.touching.down) {
            this.body.setVelocityY(-this.jumpPower);
        }
    }

    attack() {
        if (this.isAttacking) return;
        
        this.isAttacking = true;
        
        // Attack animation and damage dealing
        this.scene.combatSystem.playerAttack(this);
        
        // Reset attack state after animation
        setTimeout(() => {
            this.isAttacking = false;
        }, 500 / this.equipment.weapon.attackSpeed);
    }

    takeDamage(damage) {
        if (this.invulnerable) return;
        
        const actualDamage = Math.max(1, damage - this.stats.defense);
        this.stats.hp = Math.max(0, this.stats.hp - actualDamage);
        
        // Start invulnerability
        this.invulnerable = true;
        this.invulnerabilityTime = 1000; // 1 second
        
        // Emit damage event
        this.emit('takeDamage', actualDamage);
        
        if (this.stats.hp <= 0) {
            this.die();
        }
    }

    heal(amount) {
        this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + amount);
    }

    restoreMana(amount) {
        this.stats.mp = Math.min(this.stats.maxMp, this.stats.mp + amount);
    }

    gainXP(amount) {
        this.stats.xp += amount;
        
        while (this.stats.xp >= this.stats.xpToNext) {
            this.levelUp();
        }
    }

    levelUp() {
        this.stats.level++;
        this.stats.xp -= this.stats.xpToNext;
        this.stats.xpToNext = Math.floor(this.stats.xpToNext * 1.2);
        
        // Increase stats
        this.stats.maxHp += 10;
        this.stats.maxMp += 5;
        this.stats.hp = this.stats.maxHp;
        this.stats.mp = this.stats.maxMp;
        this.stats.strength += 2;
        this.stats.dexterity += 1;
        this.stats.intelligence += 1;
        this.stats.defense += 1;
        
        this.emit('levelUp', this.stats.level);
    }

    equipItem(item) {
        if (this.equipment[item.type]) {
            this.equipment[item.type] = item;
            this.updateStats();
        }
    }

    updateStats() {
        // Recalculate stats based on equipment
        let totalDefense = 5; // Base defense
        
        Object.values(this.equipment).forEach(item => {
            if (item && item.defense) {
                totalDefense += item.defense;
            }
        });
        
        this.stats.defense = totalDefense;
    }

    die() {
        // Handle player death
        console.log('Player died!');
        this.stats.hp = this.stats.maxHp;
        this.x = 400; // Respawn position
        this.y = 300;
    }

    updateUI() {
        if (window.uiManager) {
            window.uiManager.updatePlayerStats(this.stats);
        }
    }
}