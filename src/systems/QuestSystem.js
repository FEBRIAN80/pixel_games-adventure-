import Phaser from 'phaser';

export class QuestSystem extends Phaser.Events.EventEmitter {
    constructor(scene) {
        super();
        this.scene = scene;
        this.activeQuests = [];
        this.completedQuests = [];
        this.questId = 0;
    }

    startInitialQuests() {
        // Add starter quests
        this.addQuest({
            title: 'First Blood',
            description: 'Defeat your first enemy',
            type: 'kill',
            target: 'any',
            required: 1,
            current: 0,
            rewards: {
                xp: 50,
                gold: 25,
                items: ['health-potion']
            }
        });
        
        this.addQuest({
            title: 'Level Up',
            description: 'Reach level 2',
            type: 'level',
            target: 2,
            required: 1,
            current: 0,
            rewards: {
                xp: 100,
                gold: 50
            }
        });
        
        this.addQuest({
            title: 'Goblin Hunter',
            description: 'Defeat 5 goblins',
            type: 'kill',
            target: 'goblin',
            required: 5,
            current: 0,
            rewards: {
                xp: 200,
                gold: 100,
                items: ['uncommon-sword']
            }
        });
        
        this.updateUI();
    }

    addQuest(questData) {
        const quest = {
            id: this.questId++,
            ...questData,
            isActive: true,
            isCompleted: false
        };
        
        this.activeQuests.push(quest);
        this.updateUI();
    }

    checkQuestProgress(type, value) {
        this.activeQuests.forEach(quest => {
            if (quest.type === type && !quest.isCompleted) {
                if (quest.target === value || quest.target === 'any') {
                    quest.current = Math.min(quest.current + 1, quest.required);
                    
                    if (quest.current >= quest.required) {
                        this.completeQuest(quest);
                    }
                } else if (type === 'level' && value >= quest.target) {
                    quest.current = quest.required;
                    this.completeQuest(quest);
                }
            }
        });
        
        this.updateUI();
    }

    completeQuest(quest) {
        quest.isCompleted = true;
        quest.isActive = false;
        
        // Move to completed quests
        this.completedQuests.push(quest);
        const activeIndex = this.activeQuests.findIndex(q => q.id === quest.id);
        if (activeIndex !== -1) {
            this.activeQuests.splice(activeIndex, 1);
        }
        
        // Give rewards
        this.giveRewards(quest.rewards);
        
        // Emit completion event
        this.emit('questCompleted', quest);
        
        // Potentially start follow-up quests
        this.checkForFollowUpQuests(quest);
    }

    giveRewards(rewards) {
        if (rewards.xp) {
            this.scene.player.gainXP(rewards.xp);
        }
        
        if (rewards.gold) {
            this.scene.inventorySystem.gold += rewards.gold;
        }
        
        if (rewards.items) {
            rewards.items.forEach(itemId => {
                const item = this.createRewardItem(itemId);
                this.scene.inventorySystem.addItem(item);
            });
        }
    }

    createRewardItem(itemId) {
        // Create items based on ID
        const itemTemplates = {
            'health-potion': {
                id: 'health-potion',
                name: 'Health Potion',
                type: 'consumable',
                rarity: 'common',
                effect: 'heal',
                value: 30
            },
            'uncommon-sword': {
                id: 'uncommon-sword',
                name: 'Sharp Sword',
                type: 'weapon',
                rarity: 'uncommon',
                damage: 20,
                attackSpeed: 1.1
            }
        };
        
        return itemTemplates[itemId] || itemTemplates['health-potion'];
    }

    checkForFollowUpQuests(completedQuest) {
        // Add follow-up quests based on completed quest
        if (completedQuest.title === 'First Blood') {
            this.addQuest({
                title: 'Veteran Fighter',
                description: 'Defeat 10 enemies',
                type: 'kill',
                target: 'any',
                required: 10,
                current: 1, // Already killed one
                rewards: {
                    xp: 300,
                    gold: 150
                }
            });
        }
        
        if (completedQuest.title === 'Goblin Hunter') {
            this.addQuest({
                title: 'Wolf Pack',
                description: 'Defeat 3 wolves',
                type: 'kill',
                target: 'wolf',
                required: 3,
                current: 0,
                rewards: {
                    xp: 400,
                    gold: 200,
                    items: ['rare-armor']
                }
            });
        }
    }

    update(delta) {
        // Could add time-based quests here
    }

    updateUI() {
        if (window.uiManager) {
            window.uiManager.updateQuests(this.activeQuests);
        }
    }
}