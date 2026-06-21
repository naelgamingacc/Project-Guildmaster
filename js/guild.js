// ===== Guild Class =====

class Guild {
    constructor(name = 'Shadowmere Guild') {
        this.name = name;
        this.rank = 'E';
        this.reputation = 0;
        this.reputationToNextRank = RANK_REQUIREMENTS.D;

        // Resources
        this.gold = 100;
        this.materials = 50;

        // Members
        this.adventurers = [];
        this.maxAdventurers = 5;

        // Quests
        this.availableQuests = [];
        this.activeQuests = [];
        this.completedQuests = [];
        this.failedQuests = [];
        this.maxAvailableQuests = 5;

        // Guild hall
        this.guildHallStage = 0;
        this.purchasedUpgrades = [];

        // Statistics
        this.totalQuestsCompleted = 0;
        this.totalQuestsFailed = 0;
        this.totalGoldEarned = 0;

        // Inventory
        this.maxInventorySize = 20;
        this.inventory = new Inventory(this.maxInventorySize);

        // Day/Week/Year counter
        this.day = 1;
        this.week = 1;
        this.year = 1;

        // Heal cost constant
        this.healCost = 30;

        // Rank-up tracking
        this.questsCompletedByRank = { E: 0, D: 0, C: 0, B: 0, A: 0, S: 0 };
        this.unlockedFeatures = [];
        this.rankUpQuestActive = false;
    }

    get guildHall() {
        return GUILD_HALL_STAGES[this.guildHallStage];
    }

    get nextGuildHall() {
        if (this.guildHallStage < GUILD_HALL_STAGES.length - 1) {
            return GUILD_HALL_STAGES[this.guildHallStage + 1];
        }
        return null;
    }

    get rankIndex() {
        return RANKS.indexOf(this.rank);
    }

    get dateDisplay() {
        return `Year ${this.year}, Week ${this.week}, Day ${this.day}`;
    }

    addGold(amount) {
        this.gold += amount;
        this.totalGoldEarned += amount;
    }

    spendGold(amount) {
        if (this.gold >= amount) {
            this.gold -= amount;
            return true;
        }
        return false;
    }

    addMaterials(amount) {
        this.materials += amount;
    }

    spendMaterials(amount) {
        if (this.materials >= amount) {
            this.materials -= amount;
            return true;
        }
        return false;
    }

    addReputation(amount) {
        this.reputation += amount;
    }

    // ===== RANK-UP PREREQUISITE SYSTEM =====

    canRankUp() {
        const currentIndex = RANKS.indexOf(this.rank);
        if (currentIndex >= RANKS.length - 1) return false;

        const nextRank = RANKS[currentIndex + 1];
        const req = GUILD_RANK_UP[nextRank];
        if (!req) return false;

        // Check: completed quests at previous rank
        const questsCompleted = this.questsCompletedByRank[this.rank] || 0;
        if (questsCompleted < req.completedQuestsAtPreviousRank) return false;

        // Check: adventurer of target rank exists
        const hasAdventurerOfRank = this.adventurers.some(a => a.rank === req.adventurerOfRank);
        if (!hasAdventurerOfRank) return false;

        // Check: reputation requirement
        if (this.reputation < req.requiredReputation) return false;

        // Check: gold and materials
        if (this.gold < req.costs.gold || this.materials < req.costs.materials) return false;

        // Check: rank-up quest completed
        if (!this.isRankUpQuestCompleted(nextRank)) return false;

        return true;
    }

    getRankUpProgress() {
        const currentIndex = RANKS.indexOf(this.rank);
        if (currentIndex >= RANKS.length - 1) return null;

        const nextRank = RANKS[currentIndex + 1];
        const req = GUILD_RANK_UP[nextRank];
        if (!req) return null;

        const questsCompleted = this.questsCompletedByRank[this.rank] || 0;
        const hasAdventurerOfRank = this.adventurers.some(a => a.rank === req.adventurerOfRank);

        return {
            nextRank,
            questsCompleted,
            questsRequired: req.completedQuestsAtPreviousRank,
            hasAdventurerOfRank,
            adventurerRankNeeded: req.adventurerOfRank,
            reputation: this.reputation,
            reputationRequired: req.requiredReputation,
            hasEnoughReputation: this.reputation >= req.requiredReputation,
            goldCost: req.costs.gold,
            materialCost: req.costs.materials,
            canAfford: this.gold >= req.costs.gold && this.materials >= req.costs.materials,
            unlocksLabel: req.unlocksLabel,
            allMet: this.canRankUp()
        };
    }

    performRankUp() {
        if (!this.canRankUp()) {
            return { success: false, message: 'Prerequisites not met!' };
        }

        const currentIndex = RANKS.indexOf(this.rank);
        const nextRank = RANKS[currentIndex + 1];
        const req = GUILD_RANK_UP[nextRank];

        // Deduct costs
        this.gold -= req.costs.gold;
        this.materials -= req.costs.materials;

        // Rank up
        const result = this.rankUp(nextRank);

        // Unlock feature
        if (req.unlocksFeature && !this.unlockedFeatures.includes(req.unlocksFeature)) {
            this.unlockedFeatures.push(req.unlocksFeature);
        }

        // Reset rank-specific quest counter for new rank
        this.questsCompletedByRank[nextRank] = 0;

        return {
            success: true,
            message: `Guild ranked up to ${nextRank}! Unlocked: ${req.unlocksLabel}`,
            ...result
        };
    }

    // Legacy checkRankUp for backward compatibility
    checkRankUp() {
        return this.canRankUp();
    }

    rankUp(newRank) {
        const oldRank = this.rank;
        this.rank = newRank;

        // Update guild hall if needed
        const stageIndex = GUILD_HALL_STAGES.findIndex(s => s.rank === newRank);
        if (stageIndex > this.guildHallStage) {
            this.guildHallStage = stageIndex;
        }

        // Increase max adventurers
        this.maxAdventurers = 5 + RANKS.indexOf(newRank) * 2;

        // Increase max quests
        this.maxAvailableQuests = 5 + RANKS.indexOf(newRank) * 2;

        return {
            oldRank,
            newRank,
            guildHall: this.guildHall
        };
    }

    recruitAdventurer(adventurer) {
        if (this.adventurers.length >= this.maxAdventurers) {
            return { success: false, message: 'Guild is full!' };
        }

        if (this.gold < RECRUIT_COST) {
            return { success: false, message: 'Not enough gold!' };
        }

        this.spendGold(RECRUIT_COST);
        this.adventurers.push(adventurer);

        return { success: true, message: `${adventurer.name} has joined the guild!` };
    }

    dismissAdventurer(adventurerId) {
        const index = this.adventurers.findIndex(a => a.id === adventurerId);
        if (index !== -1) {
            const adventurer = this.adventurers[index];
            if (adventurer.status === 'busy') {
                return { success: false, message: 'Cannot dismiss adventurer on a quest!' };
            }
            this.adventurers.splice(index, 1);
            return { success: true, message: `${adventurer.name} has left the guild.` };
        }
        return { success: false, message: 'Adventurer not found!' };
    }

    addQuest(quest) {
        if (this.availableQuests.length >= this.maxAvailableQuests) {
            return false;
        }
        this.availableQuests.push(quest);
        return true;
    }

    dismissQuest(questId) {
        const index = this.availableQuests.findIndex(q => q.id === questId);
        if (index !== -1) {
            this.availableQuests.splice(index, 1);
            return { success: true, message: 'Quest dismissed.' };
        }
        return { success: false, message: 'Quest not found.' };
    }

    refreshQuests() {
        // Clear all available quests (except rank-up quests)
        this.availableQuests = this.availableQuests.filter(q => q.isRankUpQuest);

        // Generate new quests
        const newQuests = Quest.generateQuests(3, this.rank);
        newQuests.forEach(q => this.addQuest(q));
        return newQuests;
    }

    assignQuest(questId, adventurerId) {
        const quest = this.availableQuests.find(q => q.id === questId);
        const adventurer = this.adventurers.find(a => a.id === adventurerId);

        if (!quest || !adventurer) {
            return { success: false, message: 'Quest or adventurer not found!' };
        }

        if (!adventurer.canTakeQuestObj(quest)) {
            return { success: false, message: `${adventurer.name} cannot take this quest!` };
        }

        if (!adventurer.hasActionPoint()) {
            return { success: false, message: `${adventurer.name} has no action point!` };
        }

        // Consume action point
        adventurer.useActionPoint();

        quest.assign(adventurer);
        this.availableQuests = this.availableQuests.filter(q => q.id !== questId);
        this.activeQuests.push(quest);

        return { success: true, message: `${adventurer.name} has been assigned to "${quest.name}"` };
    }

    assignQuestToParty(questId, adventurerIds) {
        const quest = this.availableQuests.find(q => q.id === questId);
        if (!quest) {
            return { success: false, message: 'Quest not found!' };
        }

        const adventurers = adventurerIds
            .map(id => this.adventurers.find(a => a.id === id))
            .filter(a => a !== undefined);

        if (adventurers.length === 0) {
            return { success: false, message: 'No valid adventurers selected!' };
        }

        if (adventurers.length > quest.maxPartySize) {
            return { success: false, message: `Party too large! Max ${quest.maxPartySize} members.` };
        }

        // Check AP for all party members
        for (const adv of adventurers) {
            if (!adv.hasActionPoint()) {
                return { success: false, message: `${adv.name} has no action point!` };
            }
        }

        // Consume AP from all party members
        for (const adv of adventurers) {
            adv.useActionPoint();
        }

        const result = quest.assignParty(adventurers);
        if (result.success) {
            this.availableQuests = this.availableQuests.filter(q => q.id !== questId);
            this.activeQuests.push(quest);
        }

        return result;
    }

    processTurn() {
        const results = [];

        // Process active quests
        for (let i = this.activeQuests.length - 1; i >= 0; i--) {
            const quest = this.activeQuests[i];
            const result = quest.processTurn();

            if (result) {
                results.push({ quest, ...result });

                if (result.type === 'resolved') {
                    this.activeQuests.splice(i, 1);

                    if (result.success) {
                        this.addGold(result.goldReward);
                        this.addReputation(result.reputationReward);

                        // Material reward based on quest difficulty
                        const materialRewards = { E: 5, D: 10, C: 15, B: 25, A: 40, S: 60 };
                        this.addMaterials(materialRewards[quest.difficulty] || 5);

                        this.completedQuests.push(quest);
                        this.totalQuestsCompleted++;

                        // Track rank-specific quest completion for rank-up prerequisites
                        this.questsCompletedByRank[this.rank] = (this.questsCompletedByRank[this.rank] || 0) + 1;
                    } else {
                        this.addGold(result.goldReward); // Small consolation
                        this.failedQuests.push(quest);
                        this.totalQuestsFailed++;
                    }
                }
            }
        }

        // Random events
        if (Math.random() < 0.1) {
            results.push(this.triggerRandomEvent());
        }

        return results;
    }

    // ===== ACTION POINT SYSTEM =====

    refreshAllActionPoints() {
        this.adventurers.forEach(adv => adv.refreshActionPoints());
    }

    applyDefaultStaminaRecovery() {
        this.adventurers.forEach(adv => {
            if (adv.status !== 'busy' && adv.status !== 'exhausted') {
                adv.stamina = Math.min(adv.maxStamina, adv.stamina + 20);
                if (adv.status === 'exhausted' && adv.stamina > 0) {
                    adv.status = 'available';
                }
            }
        });
    }

    healAdventurer(patientId, healerId) {
        const healer = this.adventurers.find(a => a.id === healerId);
        const patient = this.adventurers.find(a => a.id === patientId);

        if (!healer || !patient) {
            return { success: false, message: 'Adventurer not found!' };
        }

        if (!healer.isHealer) {
            return { success: false, message: `${healer.name} is not a healer!` };
        }

        if (healer.status !== 'available') {
            return { success: false, message: `${healer.name} is not available!` };
        }

        if (!healer.hasActionPoint()) {
            return { success: false, message: `${healer.name} has no action point!` };
        }

        if (patient.status !== 'available' && patient.status !== 'injured') {
            return { success: false, message: `${patient.name} is not available!` };
        }

        if (!patient.hasActionPoint()) {
            return { success: false, message: `${patient.name} has no action point!` };
        }

        if (!patient.injury) {
            return { success: false, message: `${patient.name} is not injured!` };
        }

        if (this.gold < this.healCost) {
            return { success: false, message: `Not enough gold! Need ${this.healCost}.` };
        }

        // Deduct resources and AP
        this.spendGold(this.healCost);
        healer.useActionPoint();
        patient.useActionPoint();

        // Remove injury
        patient.healInjury();

        // Calculate healing EXP for healer
        const patientRankIndex = RANKS.indexOf(patient.rank);
        const healerRankIndex = RANKS.indexOf(healer.rank);
        const rankDiff = healerRankIndex - patientRankIndex;

        const baseExpValues = { E: 30, D: 40, C: 50, B: 60, A: 70, S: 80 };
        const baseExp = baseExpValues[patient.rank] || 30;

        let expMultiplier = 1.0;
        if (rankDiff === 0) expMultiplier = 1.0;
        else if (rankDiff === 1) expMultiplier = 0.5;
        else if (rankDiff >= 2) expMultiplier = 0.25;
        else if (rankDiff === -1) expMultiplier = 1.2;
        else if (rankDiff <= -2) expMultiplier = 1.5;

        const expGained = Math.floor(baseExp * expMultiplier);
        healer.gainExperience(expGained);

        return {
            success: true,
            message: `${healer.name} healed ${patient.name}! +${expGained} EXP`,
            healerName: healer.name,
            patientName: patient.name,
            expGained
        };
    }

    // ===== CRAFTING SYSTEM =====

    craftItem(recipeId) {
        const recipe = CRAFTING_RECIPES.find(r => r.id === recipeId);
        if (!recipe) {
            return { success: false, message: 'Recipe not found!' };
        }

        // Check if feature is unlocked
        if (recipe.requiredFeature && !this.unlockedFeatures.includes(recipe.requiredFeature)) {
            return { success: false, message: 'Required feature not unlocked!' };
        }

        // Check gold
        if (this.gold < recipe.goldCost) {
            return { success: false, message: 'Not enough gold!' };
        }

        // Check materials
        for (const mat of recipe.materials) {
            const owned = this.inventory.items.find(i => i.id === mat.id);
            if (!owned || owned.quantity < mat.quantity) {
                return { success: false, message: `Not enough ${mat.id.replace(/_/g, ' ')}!` };
            }
        }

        // Deduct resources
        this.gold -= recipe.goldCost;
        for (const mat of recipe.materials) {
            this.inventory.removeItem(mat.id, mat.quantity);
        }

        // Create the equipment item
        const template = SHOP_ITEMS.find(i => i.id === recipe.resultItem);
        if (!template) {
            return { success: false, message: 'Item template not found!' };
        }

        const item = { ...template };
        if (recipe.overrides) {
            Object.assign(item, recipe.overrides);
        }
        item.instanceId = Date.now() + Math.random().toString(36).substr(2, 9);

        this.inventory.addItem(item);

        return { success: true, message: `Crafted ${item.name}!` };
    }

    getAvailableRecipes() {
        return CRAFTING_RECIPES.filter(recipe => {
            if (recipe.requiredFeature && !this.unlockedFeatures.includes(recipe.requiredFeature)) {
                return false;
            }
            return true;
        });
    }

    canCraft(recipeId) {
        const recipe = CRAFTING_RECIPES.find(r => r.id === recipeId);
        if (!recipe) return false;

        if (recipe.requiredFeature && !this.unlockedFeatures.includes(recipe.requiredFeature)) {
            return false;
        }

        if (this.gold < recipe.goldCost) return false;

        for (const mat of recipe.materials) {
            const owned = this.inventory.items.find(i => i.id === mat.id);
            if (!owned || owned.quantity < mat.quantity) return false;
        }

        return true;
    }

    // ===== RANK-UP QUEST SYSTEM =====

    generateRankUpQuest() {
        const currentIndex = RANKS.indexOf(this.rank);
        if (currentIndex >= RANKS.length - 1) return null;

        const nextRank = RANKS[currentIndex + 1];
        const template = RANK_UP_QUESTS[nextRank];
        if (!template) return null;

        // Check if rank-up quest already exists
        const existing = this.availableQuests.find(q => q.isRankUpQuest && q.targetRank === nextRank);
        if (existing) return existing;

        // Also check active quests
        const active = this.activeQuests.find(q => q.isRankUpQuest && q.targetRank === nextRank);
        if (active) return active;

        const quest = new Quest(template, template.difficulty);
        this.addQuest(quest);
        return quest;
    }

    checkAndGenerateRankUpQuest() {
        const currentIndex = RANKS.indexOf(this.rank);
        if (currentIndex >= RANKS.length - 1) return null;

        const nextRank = RANKS[currentIndex + 1];
        const req = GUILD_RANK_UP[nextRank];
        if (!req) return null;

        // Check prerequisites (except the quest itself)
        const questsCompleted = this.questsCompletedByRank[this.rank] || 0;
        if (questsCompleted < req.completedQuestsAtPreviousRank) return null;

        const hasAdventurerOfRank = this.adventurers.some(a => a.rank === req.adventurerOfRank);
        if (!hasAdventurerOfRank) return null;

        if (this.gold < req.costs.gold || this.materials < req.costs.materials) return null;

        // All prerequisites met, generate rank-up quest
        return this.generateRankUpQuest();
    }

    isRankUpQuestCompleted(targetRank) {
        return this.completedQuests.some(q => q.isRankUpQuest && q.targetRank === targetRank);
    }

    triggerRandomEvent() {
        const events = [
            {
                name: 'Traveling Merchant',
                description: 'A merchant passes by with rare goods.',
                effect: () => {
                    this.materials += 20;
                    return 'Received 20 materials from the merchant.';
                }
            },
            {
                name: 'Celebration',
                description: 'The town celebrates a festival.',
                effect: () => {
                    this.adventurers.forEach(a => {
                        a.morale = Math.min(100, a.morale + 10);
                    });
                    return 'Guild morale increased!';
                }
            },
            {
                name: 'Storm',
                description: 'A severe storm damages the guild.',
                effect: () => {
                    const damage = Math.floor(Math.random() * 30) + 10;
                    this.gold = Math.max(0, this.gold - damage);
                    return `Storm damage cost ${damage} gold.`;
                }
            },
            {
                name: 'New Recruits',
                description: 'Adventurers seek to join the guild.',
                effect: () => {
                    this.maxAdventurers++;
                    return 'Guild capacity increased by 1!';
                }
            }
        ];

        const event = events[Math.floor(Math.random() * events.length)];
        const message = event.effect();

        return {
            type: 'event',
            name: event.name,
            description: event.description,
            message
        };
    }

    purchaseUpgrade(upgradeId) {
        const stage = this.guildHall;
        const upgrade = stage.upgrades.find(u => u.id === upgradeId);

        if (!upgrade) {
            return { success: false, message: 'Upgrade not found!' };
        }

        if (this.purchasedUpgrades.includes(upgradeId)) {
            return { success: false, message: 'Already purchased!' };
        }

        if (this.gold < upgrade.cost.gold || this.materials < upgrade.cost.materials) {
            return { success: false, message: 'Not enough resources!' };
        }

        this.spendGold(upgrade.cost.gold);
        this.spendMaterials(upgrade.cost.materials);
        this.addReputation(upgrade.reputationGain);
        this.purchasedUpgrades.push(upgradeId);

        return { success: true, message: `Upgraded: ${upgrade.name}!` };
    }

    upgradeGuild() {
        const nextHall = this.nextGuildHall;
        if (!nextHall) {
            return { success: false, message: 'Guild is already at maximum rank!' };
        }

        const requiredReputation = RANK_REQUIREMENTS[nextHall.rank];
        if (this.reputation < requiredReputation) {
            return { success: false, message: `Need ${requiredReputation} reputation to upgrade!` };
        }

        this.rankUp(nextHall.rank);
        return { success: true, message: `Guild upgraded to ${nextHall.name}!` };
    }

    getSaveData() {
        return {
            version: 2,
            name: this.name,
            rank: this.rank,
            reputation: this.reputation,
            gold: this.gold,
            materials: this.materials,
            adventurers: this.adventurers.map(a => a.getSaveData()),
            availableQuests: this.availableQuests.map(q => q.getSaveData()),
            activeQuests: this.activeQuests.map(q => q.getSaveData()),
            completedQuests: this.completedQuests.map(q => q.getSaveData()),
            failedQuests: this.failedQuests.map(q => q.getSaveData()),
            guildHallStage: this.guildHallStage,
            purchasedUpgrades: [...this.purchasedUpgrades],
            totalQuestsCompleted: this.totalQuestsCompleted,
            totalQuestsFailed: this.totalQuestsFailed,
            totalGoldEarned: this.totalGoldEarned,
            inventory: this.inventory.items.map(i => ({...i})),
            day: this.day,
            week: this.week,
            year: this.year,
            maxAdventurers: this.maxAdventurers,
            maxAvailableQuests: this.maxAvailableQuests,
            questsCompletedByRank: { ...this.questsCompletedByRank },
            unlockedFeatures: [...this.unlockedFeatures],
            rankUpQuestActive: this.rankUpQuestActive
        };
    }

    static fromSaveData(data) {
        const guild = new Guild(data.name);
        Object.assign(guild, data);

        // Backward compat: convert old turn to day
        if (data.day === undefined && data.turn !== undefined) {
            guild.day = data.turn;
            guild.week = 1;
            guild.year = 1;
        }

        // Restore inventory as Inventory object
        guild.inventory = new Inventory(data.maxInventorySize || 20);
        if (data.inventory && Array.isArray(data.inventory)) {
            data.inventory.forEach(item => guild.inventory.addItem(item, item.quantity || 1));
        }

        // Restore adventurers
        guild.adventurers = data.adventurers.map(a => Adventurer.fromSaveData(a));

        // Restore quests
        guild.availableQuests = data.availableQuests.map(q => Quest.fromSaveData(q));
        guild.activeQuests = data.activeQuests.map(q => Quest.fromSaveData(q));
        guild.completedQuests = data.completedQuests.map(q => Quest.fromSaveData(q));
        guild.failedQuests = data.failedQuests.map(q => Quest.fromSaveData(q));

        // Re-link adventurer references in active quests
        guild.activeQuests.forEach(quest => {
            if (quest.assignedAdventurer) {
                const adv = guild.adventurers.find(a => a.id === quest.assignedAdventurer);
                if (adv) {
                    quest.assignedAdventurer = adv;
                }
            }
            // Re-link party members
            if (quest.assignedParty && quest.assignedParty.length > 0) {
                quest.assignedParty = quest.assignedParty.map(id => {
                    const adv = guild.adventurers.find(a => a.id === id);
                    return adv || id;
                }).filter(a => typeof a !== 'string');
            }
        });

        return guild;
    }
}
