// ===== Inventory Class =====

class Inventory {
    constructor(maxSize = 20) {
        this.items = [];
        this.maxSize = maxSize;
    }

    get size() {
        return this.items.length;
    }

    get isFull() {
        return this.items.length >= this.maxSize;
    }

    addItem(item, quantity = 1) {
        // Check if stackable item exists
        const existingIndex = this.items.findIndex(i => i.id === item.id && i.stackable);

        if (existingIndex !== -1) {
            this.items[existingIndex].quantity += quantity;
            return true;
        }

        // Check capacity
        if (this.items.length >= this.maxSize) {
            return false;
        }

        // Add new item
        const inventoryItem = {
            ...item,
            quantity: quantity,
            stackable: item.type === 'consumable' || item.type === 'material'
        };

        this.items.push(inventoryItem);
        return true;
    }

    removeItem(itemId, quantity = 1) {
        const index = this.items.findIndex(i => i.id === itemId);
        if (index === -1) return false;

        const item = this.items[index];
        if (item.quantity < quantity) return false;

        item.quantity -= quantity;
        if (item.quantity <= 0) {
            this.items.splice(index, 1);
        }

        return true;
    }

    getItem(itemId) {
        return this.items.find(i => i.id === itemId);
    }

    hasItem(itemId, quantity = 1) {
        const item = this.getItem(itemId);
        return item && item.quantity >= quantity;
    }

    getItemsByType(type) {
        if (type === 'all') return this.items;
        return this.items.filter(i => i.type === type);
    }

    useItem(itemId, adventurer) {
        const item = this.getItem(itemId);
        if (!item) return { success: false, message: 'Item not found!' };

        if (item.type === 'consumable') {
            return this.useConsumable(item, adventurer);
        } else if (item.type === 'equipment') {
            return this.equipItem(item, adventurer);
        }

        return { success: false, message: 'Cannot use this item!' };
    }

    useConsumable(item, adventurer) {
        if (!adventurer) {
            return { success: false, message: 'No adventurer selected!' };
        }

        if (item.effect) {
            if (item.effect.heal) {
                adventurer.morale = Math.min(100, adventurer.morale + item.effect.heal);
            }
            if (item.effect.mana) {
                // Could add mana system later
            }
            if (item.effect.fatigue) {
                adventurer.fatigue = Math.max(0, adventurer.fatigue - item.effect.fatigue);
            }
        }

        this.removeItem(item.id, 1);
        return { success: true, message: `Used ${item.name} on ${adventurer.name}!` };
    }

    equipItem(item, adventurer) {
        if (!adventurer) {
            return { success: false, message: 'No adventurer selected!' };
        }

        if (!item.slot) {
            return { success: false, message: 'This item cannot be equipped!' };
        }

        const oldItem = adventurer.equip(item);
        this.removeItem(item.id, 1);

        if (oldItem) {
            this.addItem(oldItem);
        }

        return { success: true, message: `${adventurer.name} equipped ${item.name}!` };
    }

    sortItems() {
        const typeOrder = { equipment: 0, consumable: 1, material: 2, quest: 3 };
        this.items.sort((a, b) => {
            const typeDiff = typeOrder[a.type] - typeOrder[b.type];
            if (typeDiff !== 0) return typeDiff;
            return a.name.localeCompare(b.name);
        });
    }

    getSaveData() {
        return this.items.map(item => ({ ...item }));
    }

    static fromSaveData(data, maxSize = 20) {
        const inv = new Inventory(maxSize);
        inv.items = data.map(item => ({ ...item }));
        return inv;
    }
}

// ===== Item Factory =====

class ItemFactory {
    static createItem(templateId, overrides = {}) {
        const template = SHOP_ITEMS.find(i => i.id === templateId);
        if (!template) return null;

        return {
            ...template,
            ...overrides,
            instanceId: Date.now() + Math.random().toString(36).substr(2, 9)
        };
    }

    static createRandomLoot(difficulty) {
        const lootTables = {
            E: [
                { id: 'health_potion', chance: 0.5 },
                { id: 'healing_herb', chance: 0.7 },
                { id: 'sticks', chance: 0.8 },
                { id: 'fiber', chance: 0.6 }
            ],
            D: [
                { id: 'health_potion', chance: 0.4 },
                { id: 'mana_potion', chance: 0.3 },
                { id: 'iron_ore', chance: 0.5 },
                { id: 'metal_scrap', chance: 0.6 },
                { id: 'fiber', chance: 0.4 }
            ],
            C: [
                { id: 'strength_scroll', chance: 0.3 },
                { id: 'iron_sword', chance: 0.2 },
                { id: 'crystal_shard', chance: 0.4 }
            ],
            B: [
                { id: 'magic_staff', chance: 0.25 },
                { id: 'crystal_shard', chance: 0.5 },
                { id: 'leather_armor', chance: 0.2 }
            ],
            A: [
                { id: 'magic_staff', chance: 0.4 },
                { id: 'crystal_shard', chance: 0.6 }
            ],
            S: [
                { id: 'magic_staff', chance: 0.5 },
                { id: 'crystal_shard', chance: 0.7 },
                { id: 'dragon_scale', chance: 0.3 }
            ]
        };

        const table = lootTables[difficulty] || lootTables.E;
        const loot = [];

        table.forEach(entry => {
            if (Math.random() < entry.chance) {
                const item = ItemFactory.createItem(entry.id);
                if (item) {
                    item.quantity = Math.floor(Math.random() * 3) + 1;
                    loot.push(item);
                }
            }
        });

        return loot;
    }
}
