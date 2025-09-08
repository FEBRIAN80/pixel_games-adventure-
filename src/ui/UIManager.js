export class UIManager {
    constructor() {
        this.panels = {
            inventory: null,
            character: null,
            quest: null
        };
        
        this.statusBars = {
            health: null,
            mana: null,
            xp: null
        };
        
        this.hotbar = null;
        this.isInitialized = false;
        this.currentPlayer = null;
    }

    init() {
        this.setupStatusBars();
        this.setupHotbar();
        this.setupPanels();
        this.setupEventListeners();
        this.isInitialized = true;
        console.log('UI Manager initialized successfully!');
    }

    setupStatusBars() {
        this.statusBars.health = {
            bar: document.getElementById('health-bar'),
            text: document.getElementById('health-text')
        };
        
        this.statusBars.mana = {
            bar: document.getElementById('mana-bar'),
            text: document.getElementById('mana-text')
        };
        
        this.statusBars.xp = {
            bar: document.getElementById('xp-bar'),
            text: document.getElementById('level-text')
        };
    }

    setupHotbar() {
        this.hotbar = {
            slots: document.querySelectorAll('.hotbar-slot'),
            activeSlot: 0
        };
        
        // Set up hotbar click events
        this.hotbar.slots.forEach((slot, index) => {
            slot.addEventListener('click', () => {
                this.selectHotbarSlot(index);
            });
            
            slot.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.clearHotbarSlot(index);
            });
        });
    }

    setupPanels() {
        this.panels.inventory = {
            element: document.getElementById('inventory-panel'),
            grid: document.getElementById('inventory-grid'),
            isOpen: false
        };
        
        this.panels.character = {
            element: document.getElementById('character-panel'),
            isOpen: false
        };
        
        this.panels.quest = {
            element: document.getElementById('quest-panel'),
            list: document.getElementById('quest-list'),
            isOpen: false
        };
        
        // Create inventory grid
        this.createInventoryGrid();
    }

    setupEventListeners() {
        // Panel close buttons
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const panel = e.target.closest('.panel');
                this.closePanel(panel.id);
            });
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            switch(e.code) {
                case 'KeyI':
                    this.toggleInventory();
                    break;
                case 'KeyC':
                    this.toggleCharacterPanel();
                    break;
                case 'KeyQ':
                    if (!e.repeat) {
                        this.toggleQuestPanel();
                    }
                    break;
                case 'Digit1':
                    this.selectHotbarSlot(0);
                    break;
                case 'Digit2':
                    this.selectHotbarSlot(1);
                    break;
                case 'Digit3':
                    this.selectHotbarSlot(2);
                    break;
            }
        });
    }

    createInventoryGrid() {
        const grid = this.panels.inventory.grid;
        grid.innerHTML = '';
        
        for (let i = 0; i < 48; i++) {
            const slot = document.createElement('div');
            slot.className = 'inv-slot';
            slot.dataset.slot = i;
            
            slot.addEventListener('click', () => {
                this.handleInventoryClick(i);
            });
            
            slot.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.handleInventoryRightClick(i);
            });
            
            // Drag and drop
            slot.addEventListener('dragover', (e) => e.preventDefault());
            slot.addEventListener('drop', (e) => {
                e.preventDefault();
                this.handleInventoryDrop(i, e);
            });
            
            grid.appendChild(slot);
        }
    }

    updatePlayerStats(stats) {
        if (!this.isInitialized || !stats) return;
        
        // Update health bar
        const healthPercent = (stats.hp / stats.maxHp) * 100;
        this.statusBars.health.bar.style.width = `${healthPercent}%`;
        this.statusBars.health.text.textContent = `${stats.hp}/${stats.maxHp}`;
        
        // Update mana bar
        const manaPercent = (stats.mp / stats.maxMp) * 100;
        this.statusBars.mana.bar.style.width = `${manaPercent}%`;
        this.statusBars.mana.text.textContent = `${stats.mp}/${stats.maxMp}`;
        
        // Update XP bar
        const xpPercent = (stats.xp / stats.xpToNext) * 100;
        this.statusBars.xp.bar.style.width = `${xpPercent}%`;
        this.statusBars.xp.text.textContent = `Lv.${stats.level}`;
        
        // Update character panel stats
        if (this.panels.character.isOpen) {
            document.getElementById('char-level').textContent = stats.level;
            document.getElementById('char-str').textContent = stats.strength;
            document.getElementById('char-dex').textContent = stats.dexterity;
            document.getElementById('char-int').textContent = stats.intelligence;
            document.getElementById('char-def').textContent = stats.defense;
        }
        
        this.currentPlayer = stats;
    }

    updateInventory(inventory, gold) {
        if (!this.isInitialized) return;
        
        const slots = this.panels.inventory.grid.children;
        
        for (let i = 0; i < slots.length; i++) {
            const slot = slots[i];
            const item = inventory[i];
            
            if (item) {
                slot.classList.add('occupied');
                slot.innerHTML = this.createItemHTML(item);
                slot.classList.add(`rarity-${item.rarity}`);
            } else {
                slot.classList.remove('occupied');
                slot.innerHTML = '';
                slot.className = 'inv-slot';
            }
        }
        
        // Update gold display (if exists)
        const goldDisplay = document.getElementById('gold-display');
        if (goldDisplay) {
            goldDisplay.textContent = `Gold: ${gold}`;
        }
    }

    updateQuests(quests) {
        if (!this.isInitialized) return;
        
        const questList = this.panels.quest.list;
        questList.innerHTML = '';
        
        quests.forEach(quest => {
            const questElement = document.createElement('div');
            questElement.className = 'quest-item';
            questElement.innerHTML = `
                <div class="quest-title">${quest.title}</div>
                <div class="quest-desc">${quest.description}</div>
                <div class="quest-progress" style="color: #888; font-size: 8px;">
                    Progress: ${quest.current}/${quest.required}
                </div>
            `;
            
            questList.appendChild(questElement);
        });
    }

    createItemHTML(item) {
        let icon = '';
        
        // Determine item icon based on type
        switch(item.type) {
            case 'weapon':
                icon = '⚔️';
                break;
            case 'armor':
                icon = '🛡️';
                break;
            case 'helmet':
                icon = '⛑️';
                break;
            case 'boots':
                icon = '🥾';
                break;
            case 'consumable':
                icon = item.effect === 'heal' ? '🧪' : '💙';
                break;
            default:
                icon = '📦';
        }
        
        let quantityText = '';
        if (item.quantity && item.quantity > 1) {
            quantityText = `<div class="item-quantity">${item.quantity}</div>`;
        }
        
        return `
            <div class="item-icon">${icon}</div>
            ${quantityText}
            <div class="item-tooltip" style="display: none;">
                <div class="tooltip-title ${item.rarity}">${item.name}</div>
                <div class="tooltip-stats">
                    ${item.damage ? `Damage: ${item.damage}<br>` : ''}
                    ${item.defense ? `Defense: ${item.defense}<br>` : ''}
                    ${item.effect ? `Effect: ${item.effect}<br>` : ''}
                    ${item.value ? `Value: ${item.value}<br>` : ''}
                </div>
                <div class="tooltip-rarity">${item.rarity.toUpperCase()}</div>
            </div>
        `;
    }

    selectHotbarSlot(index) {
        // Remove active class from all slots
        this.hotbar.slots.forEach(slot => slot.classList.remove('active'));
        
        // Add active class to selected slot
        this.hotbar.slots[index].classList.add('active');
        this.hotbar.activeSlot = index;
    }

    clearHotbarSlot(index) {
        const slot = this.hotbar.slots[index];
        slot.querySelector('.slot-content').innerHTML = '';
    }

    handleInventoryClick(slotIndex) {
        // Handle item use/equip logic
        console.log(`Inventory slot ${slotIndex} clicked`);
    }

    handleInventoryRightClick(slotIndex) {
        // Handle item context menu
        console.log(`Inventory slot ${slotIndex} right-clicked`);
    }

    handleInventoryDrop(slotIndex, event) {
        // Handle drag and drop
        console.log(`Item dropped on slot ${slotIndex}`);
    }

    toggleInventory() {
        this.togglePanel('inventory-panel');
    }

    toggleCharacterPanel() {
        this.togglePanel('character-panel');
    }

    toggleQuestPanel() {
        this.togglePanel('quest-panel');
    }

    togglePanel(panelId) {
        const panel = document.getElementById(panelId);
        const isHidden = panel.classList.contains('hidden');
        
        if (isHidden) {
            this.openPanel(panelId);
        } else {
            this.closePanel(panelId);
        }
    }

    openPanel(panelId) {
        const panel = document.getElementById(panelId);
        panel.classList.remove('hidden');
        
        // Update panel state
        Object.keys(this.panels).forEach(key => {
            if (this.panels[key].element && this.panels[key].element.id === panelId) {
                this.panels[key].isOpen = true;
            }
        });
        
        // Add opening animation
        panel.style.transform = 'scale(0.8)';
        panel.style.opacity = '0';
        
        requestAnimationFrame(() => {
            panel.style.transition = 'all 0.2s ease';
            panel.style.transform = 'scale(1)';
            panel.style.opacity = '1';
        });
    }

    closePanel(panelId) {
        const panel = document.getElementById(panelId);
        
        // Add closing animation
        panel.style.transition = 'all 0.2s ease';
        panel.style.transform = 'scale(0.8)';
        panel.style.opacity = '0';
        
        setTimeout(() => {
            panel.classList.add('hidden');
            panel.style.transition = '';
            panel.style.transform = '';
            panel.style.opacity = '';
            
            // Update panel state
            Object.keys(this.panels).forEach(key => {
                if (this.panels[key].element && this.panels[key].element.id === panelId) {
                    this.panels[key].isOpen = false;
                }
            });
        }, 200);
    }

    showLevelUp(newLevel) {
        const levelUpNotification = document.createElement('div');
        levelUpNotification.className = 'level-up-notification';
        levelUpNotification.innerHTML = `
            <div class="level-up-content">
                <h2>LEVEL UP!</h2>
                <p>You reached level ${newLevel}!</p>
            </div>
        `;
        
        levelUpNotification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(45deg, #FFD700, #FFA500);
            border: 3px solid #FFD700;
            border-radius: 10px;
            padding: 20px;
            text-align: center;
            font-family: 'Press Start 2P', monospace;
            color: #000;
            z-index: 1000;
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
            animation: levelUpPulse 2s ease;
        `;
        
        document.body.appendChild(levelUpNotification);
        
        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes levelUpPulse {
                0%, 100% { transform: translate(-50%, -50%) scale(1); }
                50% { transform: translate(-50%, -50%) scale(1.1); }
            }
        `;
        document.head.appendChild(style);
        
        // Remove notification after animation
        setTimeout(() => {
            levelUpNotification.remove();
            style.remove();
        }, 2000);
        
        // Add glow effect to XP bar
        const xpBar = this.statusBars.xp.bar;
        if (xpBar) {
            xpBar.parentElement.classList.add('levelup-glow');
            setTimeout(() => {
                xpBar.parentElement.classList.remove('levelup-glow');
            }, 3000);
        }
    }

    showDamageFlash() {
        const overlay = document.getElementById('ui-overlay');
        if (overlay) {
            overlay.classList.add('damage-flash');
            setTimeout(() => {
                overlay.classList.remove('damage-flash');
            }, 300);
        }
    }

    showQuestComplete(quest) {
        const questNotification = document.createElement('div');
        questNotification.className = 'quest-complete-notification';
        questNotification.innerHTML = `
            <div class="quest-complete-content">
                <h3>Quest Complete!</h3>
                <p>${quest.title}</p>
                <div class="quest-rewards">
                    ${quest.rewards.xp ? `+${quest.rewards.xp} XP` : ''}
                    ${quest.rewards.gold ? ` +${quest.rewards.gold} Gold` : ''}
                </div>
            </div>
        `;
        
        questNotification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 100, 0, 0.9);
            border: 2px solid #00FF00;
            border-radius: 5px;
            padding: 15px;
            font-family: 'Press Start 2P', monospace;
            color: #FFF;
            font-size: 10px;
            z-index: 1000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        document.body.appendChild(questNotification);
        
        // Slide in animation
        requestAnimationFrame(() => {
            questNotification.style.transform = 'translateX(0)';
        });
        
        // Remove after delay
        setTimeout(() => {
            questNotification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                questNotification.remove();
            }, 300);
        }, 3000);
    }

    showDamageNumber(x, y, damage, isCritical = false) {
        // This would typically be called from the game scene
        // For now, just log it
        console.log(`Damage: ${damage}${isCritical ? ' CRIT!' : ''} at (${x}, ${y})`);
    }

    showTooltip(element, item) {
        const tooltip = element.querySelector('.item-tooltip');
        if (tooltip) {
            tooltip.style.display = 'block';
            tooltip.style.position = 'absolute';
            tooltip.style.background = 'rgba(0, 0, 0, 0.9)';
            tooltip.style.color = '#FFF';
            tooltip.style.padding = '8px';
            tooltip.style.borderRadius = '4px';
            tooltip.style.fontSize = '8px';
            tooltip.style.zIndex = '1000';
            tooltip.style.pointerEvents = 'none';
            tooltip.style.whiteSpace = 'nowrap';
        }
    }

    hideTooltip(element) {
        const tooltip = element.querySelector('.item-tooltip');
        if (tooltip) {
            tooltip.style.display = 'none';
        }
    }

    updateMiniMap(playerPos, enemies, items) {
        // Mini-map functionality could be added here
        // For now, this is a placeholder
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        const colors = {
            info: '#4CAF50',
            warning: '#FF9800',
            error: '#F44336',
            success: '#00E676'
        };
        
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${colors[type] || colors.info};
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            font-family: 'Press Start 2P', monospace;
            font-size: 8px;
            z-index: 1000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
        });
        
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }
}