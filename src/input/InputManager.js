import Phaser from 'phaser';

export class InputManager {
    constructor(scene) {
        this.scene = scene;
        this.keys = {};
        this.gamepadConnected = false;
    }

    init() {
        // Create keyboard input
        this.keys = this.scene.input.keyboard.addKeys({
            'up': Phaser.Input.Keyboard.KeyCodes.W,
            'left': Phaser.Input.Keyboard.KeyCodes.A,
            'down': Phaser.Input.Keyboard.KeyCodes.S,
            'right': Phaser.Input.Keyboard.KeyCodes.D,
            'run': Phaser.Input.Keyboard.KeyCodes.SHIFT,
            'jump': Phaser.Input.Keyboard.KeyCodes.SPACE,
            'attack': Phaser.Input.Keyboard.KeyCodes.SPACE,
            'inventory': Phaser.Input.Keyboard.KeyCodes.I,
            'character': Phaser.Input.Keyboard.KeyCodes.C,
            'quest': Phaser.Input.Keyboard.KeyCodes.Q,
            'skill1': Phaser.Input.Keyboard.KeyCodes.ONE,
            'skill2': Phaser.Input.Keyboard.KeyCodes.TWO,
            'skill3': Phaser.Input.Keyboard.KeyCodes.THREE,
            'ability1': Phaser.Input.Keyboard.KeyCodes.Q,
            'ability2': Phaser.Input.Keyboard.KeyCodes.E,
            'ability3': Phaser.Input.Keyboard.KeyCodes.R
        });

        // Set up key press events
        this.setupKeyEvents();
        
        // Check for gamepad
        this.scene.input.gamepad.once('connected', (pad) => {
            this.gamepadConnected = true;
            console.log('Gamepad connected');
        });
    }

    setupKeyEvents() {
        // Inventory toggle
        this.keys.inventory.on('down', () => {
            window.uiManager.toggleInventory();
        });
        
        // Character panel toggle
        this.keys.character.on('down', () => {
            window.uiManager.toggleCharacterPanel();
        });
        
        // Quest panel toggle (using Q key separately from ability)
        this.scene.input.keyboard.on('keydown-Q', () => {
            if (!this.keys.ability1.isDown) {
                window.uiManager.toggleQuestPanel();
            }
        });
        
        // Hotbar item use
        this.keys.skill1.on('down', () => {
            this.useHotbarItem(0);
        });
        
        this.keys.skill2.on('down', () => {
            this.useHotbarItem(1);
        });
        
        this.keys.skill3.on('down', () => {
            this.useHotbarItem(2);
        });
    }

    update() {
        this.handleMovement();
        this.handleCombat();
        this.handleGamepad();
    }

    handleMovement() {
        const player = this.scene.player;
        let isMoving = false;
        
        // Reset movement state
        player.stopMoving();
        
        // Handle movement input
        if (this.keys.left.isDown) {
            player.moveLeft();
            isMoving = true;
        }
        
        if (this.keys.right.isDown) {
            player.moveRight();
            isMoving = true;
        }
        
        if (this.keys.up.isDown) {
            player.moveUp();
            isMoving = true;
        }
        
        if (this.keys.down.isDown) {
            player.moveDown();
            isMoving = true;
        }
        
        // Handle running
        player.setRunning(this.keys.run.isDown);
        
        // Handle jumping
        if (Phaser.Input.Keyboard.JustDown(this.keys.jump)) {
            player.jump();
        }
    }

    handleCombat() {
        const player = this.scene.player;
        
        // Handle attack
        if (Phaser.Input.Keyboard.JustDown(this.keys.attack)) {
            player.attack();
        }
        
        // Handle abilities
        if (Phaser.Input.Keyboard.JustDown(this.keys.ability1)) {
            this.useAbility(1);
        }
        
        if (Phaser.Input.Keyboard.JustDown(this.keys.ability2)) {
            this.useAbility(2);
        }
        
        if (Phaser.Input.Keyboard.JustDown(this.keys.ability3)) {
            this.useAbility(3);
        }
    }

    handleGamepad() {
        if (!this.gamepadConnected) return;
        
        const gamepad = this.scene.input.gamepad.pad1;
        if (!gamepad) return;
        
        const player = this.scene.player;
        
        // Movement with left stick
        const leftStickX = gamepad.leftStick.x;
        const leftStickY = gamepad.leftStick.y;
        
        if (Math.abs(leftStickX) > 0.1) {
            if (leftStickX > 0) {
                player.moveRight();
            } else {
                player.moveLeft();
            }
        }
        
        if (Math.abs(leftStickY) > 0.1) {
            if (leftStickY > 0) {
                player.moveDown();
            } else {
                player.moveUp();
            }
        }
        
        // Attack with A button
        if (gamepad.A && Phaser.Input.Keyboard.JustDown(gamepad.A)) {
            player.attack();
        }
        
        // Run with right trigger
        player.setRunning(gamepad.R2 > 0.5);
    }

    useHotbarItem(slotIndex) {
        // Use item from hotbar slot
        this.scene.inventorySystem.useItem(slotIndex);
    }

    useAbility(abilityIndex) {
        const player = this.scene.player;
        
        // Check if player has enough mana
        const manaCost = 10;
        if (player.stats.mp < manaCost) {
            console.log('Not enough mana!');
            return;
        }
        
        // Use mana
        player.stats.mp -= manaCost;
        
        // Execute ability based on index
        switch (abilityIndex) {
            case 1: // Q - Dash attack
                this.dashAttack(player);
                break;
            case 2: // E - Heal
                this.healAbility(player);
                break;
            case 3: // R - Area attack
                this.areaAttack(player);
                break;
        }
    }

    dashAttack(player) {
        const direction = player.facingRight ? 1 : -1;
        player.body.setVelocityX(300 * direction);
        
        // Deal damage to enemies in path
        setTimeout(() => {
            const enemies = this.scene.enemyManager.getEnemiesInRange(player.x, player.y, 80);
            enemies.forEach(enemy => {
                enemy.takeDamage(player.stats.strength * 1.5);
            });
        }, 200);
    }

    healAbility(player) {
        player.heal(20);
        
        // Create heal effect
        const healEffect = this.scene.add.text(player.x, player.y - 40, '+20 HP', {
            fontSize: '14px',
            fill: '#00ff00'
        });
        
        this.scene.tweens.add({
            targets: healEffect,
            y: healEffect.y - 30,
            alpha: 0,
            duration: 1000,
            onComplete: () => healEffect.destroy()
        });
    }

    areaAttack(player) {
        const enemies = this.scene.enemyManager.getEnemiesInRange(player.x, player.y, 100);
        
        enemies.forEach(enemy => {
            enemy.takeDamage(player.stats.strength * 0.8);
        });
        
        // Create area effect visual
        const areaEffect = this.scene.add.circle(player.x, player.y, 100, 0xff4444, 0.3);
        
        this.scene.tweens.add({
            targets: areaEffect,
            scaleX: 0,
            scaleY: 0,
            alpha: 0,
            duration: 500,
            onComplete: () => areaEffect.destroy()
        });
    }
}