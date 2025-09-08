import Phaser from 'phaser';

export class Enemy extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, enemyType) {
        super(scene, x, y, `enemy-${enemyType}`);
        
        this.scene = scene;
        this.enemyType = enemyType;
        
        // Enemy stats based on type
        this.stats = this.getEnemyStats(enemyType);
        
        // AI state
        this.state = 'patrol';
        this.patrolDirection = Phaser.Math.Between(0, 1) ? 1 : -1;
        this.patrolDistance = 150;
        this.originalX = x;
        this.detectionRange = 120;
        this.attackRange = 35;
        this.attackCooldown = 0;
        this.lastAttackTime = 0;
        
        // Movement
        this.speed = this.stats.speed;
        this.facingRight = true;
        
        this.setupPhysics();
        this.setupAnimations();
    }

    getEnemyStats(type) {
        const enemyStats = {
            goblin: {
                hp: 30,
                maxHp: 30,
                damage: 8,
                speed: 80,
                xpReward: 15,
                goldReward: 5
            },
            wolf: {
                hp: 45,
                maxHp: 45,
                damage: 12,
                speed: 120,
                xpReward: 25,
                goldReward: 8
            },
            skeleton: {
                hp: 60,
                maxHp: 60,
                damage: 15,
                speed: 60,
                xpReward: 35,
                goldReward: 12
            }
        };
        
        return enemyStats[type] || enemyStats.goblin;
    }

    setupPhysics() {
        this.scene.physics.add.existing(this);
        this.body.setSize(24, 28);
        this.body.setOffset(4, 4);
        this.body.setCollideWorldBounds(true);
        this.body.setDragX(300);
    }

    setupAnimations() {
        // In a real game, you'd have walking animations
        // For now, we'll just flip the sprite for movement direction
    }

    update(delta) {
        this.updateAI(delta);
        this.updateCooldowns(delta);
        this.updateAnimation();
    }

    updateAI(delta) {
        const player = this.scene.player;
        const distanceToPlayer = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
        
        switch (this.state) {
            case 'patrol':
                this.patrol();
                if (distanceToPlayer <= this.detectionRange) {
                    this.state = 'chase';
                }
                break;
                
            case 'chase':
                this.chasePlayer(player);
                if (distanceToPlayer > this.detectionRange * 1.5) {
                    this.state = 'patrol';
                } else if (distanceToPlayer <= this.attackRange) {
                    this.state = 'attack';
                }
                break;
                
            case 'attack':
                this.body.setVelocityX(0);
                if (distanceToPlayer > this.attackRange) {
                    this.state = 'chase';
                } else if (this.canAttack()) {
                    this.attack(player);
                }
                break;
        }
    }

    patrol() {
        const distanceFromOrigin = Math.abs(this.x - this.originalX);
        
        if (distanceFromOrigin >= this.patrolDistance) {
            this.patrolDirection *= -1;
        }
        
        this.body.setVelocityX(this.speed * 0.5 * this.patrolDirection);
        this.facingRight = this.patrolDirection > 0;
    }

    chasePlayer(player) {
        const direction = player.x > this.x ? 1 : -1;
        this.body.setVelocityX(this.speed * direction);
        this.facingRight = direction > 0;
    }

    canAttack() {
        return Date.now() - this.lastAttackTime >= 1500; // 1.5 second cooldown
    }

    attack(player) {
        this.lastAttackTime = Date.now();
        // Attack animation would go here
        this.attackPlayer(player);
    }

    attackPlayer(player) {
        if (this.canAttack()) {
            player.takeDamage(this.stats.damage);
            this.lastAttackTime = Date.now();
        }
    }

    updateCooldowns(delta) {
        if (this.attackCooldown > 0) {
            this.attackCooldown -= delta;
        }
    }

    updateAnimation() {
        // Update sprite direction
        this.setFlipX(!this.facingRight);
    }

    takeDamage(damage) {
        this.stats.hp = Math.max(0, this.stats.hp - damage);
        
        // Flash red when taking damage
        this.setTint(0xff0000);
        setTimeout(() => {
            this.clearTint();
        }, 100);
        
        if (this.stats.hp <= 0) {
            this.die();
        }
    }

    die() {
        // Award XP and gold to player
        this.scene.player.gainXP(this.stats.xpReward);
        
        // Create death effect
        this.createDeathEffect();
        
        // Emit death event
        this.scene.combatSystem.emit('enemyKilled', this);
        
        // Remove enemy
        this.scene.enemyManager.removeEnemy(this);
    }

    createDeathEffect() {
        // Simple death effect - in a real game you'd have particles
        const deathEffect = this.scene.add.text(this.x, this.y - 20, `+${this.stats.xpReward} XP`, {
            fontSize: '12px',
            fill: '#ffaa00'
        });
        
        this.scene.tweens.add({
            targets: deathEffect,
            y: deathEffect.y - 30,
            alpha: 0,
            duration: 1000,
            onComplete: () => {
                deathEffect.destroy();
            }
        });
    }
}