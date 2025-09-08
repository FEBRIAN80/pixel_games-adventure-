import Phaser from 'phaser';

export class CombatSystem extends Phaser.Events.EventEmitter {
    constructor(scene) {
        super();
        this.scene = scene;
        this.attackEffects = new Phaser.GameObjects.Group(scene);
    }

    update(delta) {
        // Update any ongoing attack effects
        this.attackEffects.children.entries.forEach(effect => {
            if (effect.active && effect.update) {
                effect.update(delta);
            }
        });
    }

    playerAttack(player) {
        const weapon = player.equipment.weapon;
        const attackRange = this.getWeaponRange(weapon.type);
        
        // Find enemies in attack range
        const targets = this.scene.enemyManager.getEnemiesInRange(
            player.x, 
            player.y, 
            attackRange
        );
        
        // Calculate damage
        const baseDamage = weapon.damage + player.stats.strength;
        
        targets.forEach(enemy => {
            let damage = this.calculateDamage(baseDamage);
            
            // Apply damage to enemy
            enemy.takeDamage(damage);
            
            // Create damage effect
            this.createDamageEffect(enemy.x, enemy.y, damage);
            
            // Knockback effect
            this.applyKnockback(enemy, player);
        });
        
        // Create attack visual effect
        this.createAttackEffect(player, weapon);
    }

    getWeaponRange(weaponType) {
        const ranges = {
            sword: 50,
            axe: 45,
            spear: 70,
            bow: 200,
            staff: 180
        };
        return ranges[weaponType] || 50;
    }

    calculateDamage(baseDamage) {
        // Add some randomness
        const variance = 0.2;
        const minDamage = Math.floor(baseDamage * (1 - variance));
        const maxDamage = Math.ceil(baseDamage * (1 + variance));
        let damage = Phaser.Math.Between(minDamage, maxDamage);
        
        // Critical hit chance (10%)
        if (Math.random() < 0.1) {
            damage = Math.floor(damage * 1.5);
            console.log('Critical hit!');
        }
        
        return damage;
    }

    createDamageEffect(x, y, damage) {
        const damageText = this.scene.add.text(x, y - 30, damage.toString(), {
            fontSize: '16px',
            fill: '#ff4444',
            stroke: '#000000',
            strokeThickness: 2
        });
        
        this.scene.tweens.add({
            targets: damageText,
            y: damageText.y - 40,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => {
                damageText.destroy();
            }
        });
    }

    createAttackEffect(player, weapon) {
        let effectSprite;
        
        switch (weapon.type) {
            case 'sword':
                effectSprite = this.createSlashEffect(player);
                break;
            case 'bow':
                effectSprite = this.createProjectileEffect(player);
                break;
            case 'staff':
                effectSprite = this.createMagicEffect(player);
                break;
            default:
                effectSprite = this.createSlashEffect(player);
        }
        
        if (effectSprite) {
            this.attackEffects.add(effectSprite);
        }
    }

    createSlashEffect(player) {
        const slashGraphics = this.scene.add.graphics();
        slashGraphics.lineStyle(4, 0xffffff, 0.8);
        
        const startX = player.x + (player.facingRight ? 20 : -20);
        const startY = player.y - 10;
        const endX = player.x + (player.facingRight ? 40 : -40);
        const endY = player.y + 10;
        
        slashGraphics.lineBetween(startX, startY, endX, endY);
        
        this.scene.tweens.add({
            targets: slashGraphics,
            alpha: 0,
            scaleX: 1.5,
            scaleY: 1.5,
            duration: 200,
            onComplete: () => {
                slashGraphics.destroy();
            }
        });
        
        return slashGraphics;
    }

    createProjectileEffect(player) {
        const arrow = this.scene.add.rectangle(
            player.x, 
            player.y - 10, 
            20, 3, 
            0x8B4513
        );
        
        const targetX = player.x + (player.facingRight ? 200 : -200);
        
        this.scene.tweens.add({
            targets: arrow,
            x: targetX,
            duration: 500,
            onComplete: () => {
                arrow.destroy();
            }
        });
        
        return arrow;
    }

    createMagicEffect(player) {
        const magic = this.scene.add.circle(
            player.x + (player.facingRight ? 30 : -30),
            player.y - 10,
            10,
            0x9932CC,
            0.8
        );
        
        this.scene.tweens.add({
            targets: magic,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 400,
            onComplete: () => {
                magic.destroy();
            }
        });
        
        return magic;
    }

    applyKnockback(target, source) {
        const direction = target.x > source.x ? 1 : -1;
        const knockbackForce = 100;
        
        if (target.body) {
            target.body.setVelocityX(direction * knockbackForce);
        }
    }
}