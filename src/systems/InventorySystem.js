import Phaser from 'phaser';

export class InventorySystem {
    constructor(scene) {
        this.scene = scene;
        this.inventory = [];
        this.maxSlots = 48;
        this.gold = 100;
        
        this.initializeInventory();
    }

    initializeInventory() {
        // Add starting items
        this.addItem({
            id: 'health-potion',
            name: 'Health Potion',
            type: 'consumable',
            rarity: 'common',
            effect: 'heal',
            value: 30,
            quantity: 3
        });
        
        this.addItem({
            id: 'mana-potion',
            name: 'Mana Potion',
            type: 'consumable',
            rarity: 'common',
            effect: 'mana',
            value: 20,
            quantity: 2
        });
        
        this.updateUI();
    }

    addItem(item) {
        // Check if item already exists and is stackable
        const existingItem = this.inventory.find(invItem => 
            invItem && invItem.id === item.id && invItem.type === 'consumable'
        );
        
        if (existingItem) {
            existingItem.quantity += item.quantity || 1;
        } else {
            // Find empty slot
            const emptySlot = this.inventory.findIndex(slot => slot === null);
            if (emptySlot !== -1) {
                this.inventory[emptySlot] = { ...item, quantity: item.quantity || 1 };
            } else if (this.inventory.length < this.maxSlots) {
                this.inventory.push({ ...item, quantity: item.quantity || 1 });
            } else {
                console.log('Inventory full!');
                return false;
            }
        }
        
        this.updateUI();
        return true;
    }

    removeItem(slotIndex, quantity = 1) {
        if (this.inventory[slotIndex]) {
            const item = this.inventory[slotIndex];
            item.quantity -= quantity;
            
            if (item.quantity <= 0) {
                this.inventory[slotIndex] = null;
            }
            
            this.updateUI();
            return item;
        }
        return null;
    }

    useItem(slotIndex) {
        const item = this.inventory[slotIndex];
        if (!item || item.type !== 'consumable') return false;
        
        switch (item.effect) {
            case 'heal':
                this.scene.player.heal(item.value);
                break;
            case 'mana':
                this.scene.player.restoreMana(item.value);
                break;
        }
        
        this.removeItem(slotIndex, 1);
        return true;
    }

    equipItem(slotIndex) {
        const item = this.inventory[slotIndex];
        if (!item || !['weapon', 'armor', 'helmet', 'boots'].includes(item.type)) {
            return false;
        }
        
        // Unequip current item if any
        const currentEquipped = this.scene.player.equipment[item.type];
        if (currentEquipped) {
            this.addItem(currentEquipped);
        }
        
        // Equip new item
        this.scene.player.equipItem(item);
        this.removeItem(slotIndex, 1);
        
        return true;
    }

    handleEnemyLoot(enemy) {
        // Generate random loot
        const lootTable = this.generateLootTable(enemy.enemyType);
        
        lootTable.forEach(loot => {
            if (Math.random() < loot.chance) {
                const item = this.generateItem(loot);
                this.addItem(item);
            }
        });
        
        // Always drop some gold
        this.gold += enemy.stats.goldReward;
        this.updateUI();
    }

    generateLootTable(enemyType) {
        const baseLoot = [
            { type: 'gold', chance: 1.0 },
            { type: 'health-potion', chance: 0.3 },
            { type: 'mana-potion', chance: 0.2 }
        ];
        
        const rareLoot = {
            goblin: [
                { type: 'weapon', subtype: 'sword', rarity: 'common', chance: 0.1 }
            ],
            wolf: [
                { type: 'armor', subtype: 'leather', rarity: 'common', chance: 0.15 }
            ],
            skeleton: [
                { type: 'weapon', subtype: 'sword', rarity: 'rare', chance: 0.05 },
                { type: 'helmet', subtype: 'bone', rarity: 'uncommon', chance: 0.08 }
            ]
        };
        
        return [...baseLoot, ...(rareLoot[enemyType] || [])];
    }

    generateItem(lootData) {
        const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
        const rarity = lootData.rarity || Phaser.Utils.Array.GetRandom(rarities);
        
        const rarityMultipliers = {
            common: 1,
            uncommon: 1.2,
            rare: 1.5,
            epic: 2,
            legendary: 3
        };
        
        const multiplier = rarityMultipliers[rarity];
        
        switch (lootData.type) {
            case 'weapon':
                return {
                    id: `${rarity}-${lootData.subtype}`,
                    name: `${rarity.charAt(0).toUpperCase() + rarity.slice(1)} ${lootData.subtype}`,
                    type: 'weapon',
                    rarity: rarity,
                    damage: Math.floor(15 * multiplier),
                    attackSpeed: 1.0
                };
                
            case 'armor':
                return {
                    id: `${rarity}-${lootData.subtype}`,
                    name: `${rarity.charAt(0).toUpperCase() + rarity.slice(1)} ${lootData.subtype} Armor`,
                    type: 'armor',
                    rarity: rarity,
                    defense: Math.floor(5 * multiplier)
                };
                
            default:
                return {
                    id: lootData.type,
                    name: lootData.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    type: 'consumable',
                    rarity: 'common',
                    effect: lootData.type === 'health-potion' ? 'heal' : 'mana',
                    value: lootData.type === 'health-potion' ? 30 : 20,
                    quantity: 1
                };
        }
    }

    updateUI() {
        if (window.uiManager) {
            window.uiManager.updateInventory(this.inventory, this.gold);
        }
    }
}