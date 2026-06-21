// ===== Quest Class =====

class Quest {
    constructor(template, difficulty = 'D') {
        this.id = Date.now() + Math.random().toString(36).substr(2, 9);
        this.template = template;
        this.type = template.type;
        this.name = template.name;
        this.description = template.description;
        this.difficulty = difficulty;

        // Recommended traits/skills for bonus success rate
        this.recommendedTraits = template.recommendedTraits || [];
        this.recommendedType = template.recommendedType || null;

        // Party system
        this.maxPartySize = template.partySize || QUEST_DIFFICULTIES[difficulty].partySize || 1;

        // Rank-up quest fields
        this.isRankUpQuest = template.isRankUpQuest || false;
        this.targetRank = template.targetRank || null;

        // Calculate rewards based on difficulty
        const diffData = QUEST_DIFFICULTIES[difficulty];
        this.goldReward = Math.floor(template.baseGold * diffData.multiplier);
        this.reputationReward = Math.floor(template.baseRep * diffData.multiplier);
        this.baseExp = template.baseExp || 30;
        this.staminaCost = diffData.staminaCost;

        // Status
        this.status = 'available'; // available, assigned, in_progress, completed, failed
        this.assignedAdventurer = null;
        this.assignedParty = [];

        // Day-based processing
        this.daysRemaining = this.getDaysForDifficulty();
        this.maxDays = this.daysRemaining;
        this.currentDay = 0;

        // Success tracking
        this.baseSuccessRate = this.calculateBaseSuccessRate();
        this.successChance = 0;

        // Event log
        this.eventLog = [];
    }

    getDaysForDifficulty() {
        const days = { E: 2, D: 3, C: 4, B: 5, A: 7, S: 10 };
        return days[this.difficulty] || 3;
    }

    calculateBaseSuccessRate() {
        const rates = { E: 0.9, D: 0.75, C: 0.6, B: 0.45, A: 0.3, S: 0.2 };
        return rates[this.difficulty] || 0.75;
    }

    calculateExperienceForAdventurer(adventurer) {
        const questRankIndex = RANKS.indexOf(QUEST_DIFFICULTIES[this.difficulty].minRank);
        const advRankIndex = adventurer.getRankIndex();
        const rankDiff = advRankIndex - questRankIndex;

        let expMultiplier = 1.0;
        if (rankDiff === 0) expMultiplier = 1.0;       // Same rank: full EXP
        else if (rankDiff === 1) expMultiplier = 0.5;   // Quest 1 rank below: 50%
        else if (rankDiff >= 2) expMultiplier = 0.25;   // Quest 2+ ranks below: 25%
        else if (rankDiff === -1) expMultiplier = 1.2;  // Quest 1 rank above: 120%
        else if (rankDiff <= -2) expMultiplier = 1.5;   // Quest 2+ ranks above: 150%

        return Math.floor(this.baseExp * expMultiplier);
    }

    calculateSuccessChance(adventurer) {
        if (!adventurer) return 0;

        const questType = QUEST_TYPES[this.type];
        const advStats = adventurer.getEffectiveStats();

        // Primary stat contribution (60%)
        const primaryStat = advStats[questType.primaryStat];
        const secondaryStat = advStats[questType.secondaryStat];

        // Calculate effective power
        const effectivePower = (primaryStat * 0.6 + secondaryStat * 0.4) * adventurer.getRankMultiplier();

        // Required power based on difficulty
        const requiredPower = 20 * QUEST_DIFFICULTIES[this.difficulty].multiplier;

        // Base success rate modified by power ratio
        const powerRatio = effectivePower / requiredPower;
        let successChance = this.baseSuccessRate + (powerRatio - 1) * 0.3;

        // Morale modifier
        successChance += (adventurer.morale - 50) / 200;

        // Fatigue/stamina modifier
        successChance -= (100 - adventurer.stamina) / 300;

        // Class type bonus (matching recommended type)
        if (this.recommendedType && adventurer.classType === this.recommendedType) {
            successChance += 0.1;
        }

        // Recommended traits bonus (check if adventurer has any)
        if (this.recommendedTraits.length > 0) {
            const matchingTraits = this.recommendedTraits.filter(trait =>
                adventurer.skills.includes(trait)
            );
            successChance += matchingTraits.length * 0.05; // +5% per matching trait
        }

        // Legacy class type bonuses
        if (this.type === 'combat' && adventurer.classType === 'melee') {
            successChance += 0.05;
        } else if (this.type === 'exploration' && adventurer.classType === 'ranged') {
            successChance += 0.05;
        } else if (this.type === 'investigation' && adventurer.classType === 'magic') {
            successChance += 0.05;
        } else if (this.type === 'social' && adventurer.classData.isSpecial) {
            successChance += 0.08;
        } else if (this.type === 'crafting' && (adventurer.classId === 'smith' || adventurer.classId === 'alchemist')) {
            successChance += 0.1;
        }

        // Clamp between 0.05 and 0.95
        this.successChance = Math.max(0.05, Math.min(0.95, successChance));
        return this.successChance;
    }

    assign(adventurer) {
        this.status = 'assigned';
        this.assignedAdventurer = adventurer;
        this.assignedParty = [adventurer];
        this.calculateSuccessChance(adventurer);
        adventurer.assignQuest(this);
    }

    assignParty(adventurers) {
        if (adventurers.length === 0 || adventurers.length > this.maxPartySize) {
            return { success: false, message: `Party must have 1-${this.maxPartySize} members!` };
        }

        // Validate all adventurers
        for (const adv of adventurers) {
            if (!this.canAdventurerTakeQuest(adv)) {
                return { success: false, message: `${adv.name} cannot take this quest!` };
            }
        }

        this.status = 'assigned';
        this.assignedParty = [...adventurers];
        this.assignedAdventurer = adventurers[0]; // Primary for compatibility

        // Calculate party success chance
        this.successChance = this.calculatePartySuccessChance(adventurers);

        // Assign quest to all party members
        for (const adv of adventurers) {
            adv.assignQuest(this);
        }

        return { success: true, message: `Party assigned! Success chance: ${Math.round(this.successChance * 100)}%` };
    }

    calculatePartySuccessChance(party) {
        if (party.length === 0) return 0;
        if (party.length === 1) return this.calculateSuccessChance(party[0]);

        // Calculate individual success chances
        const chances = party.map(adv => this.calculateSingleSuccessChance(adv));

        // Primary contributor gets full weight, others get diminishing returns
        const sorted = [...chances].sort((a, b) => b - a);
        let combined = sorted[0]; // Primary gets full

        for (let i = 1; i < sorted.length; i++) {
            combined += sorted[i] * 0.3; // Each additional member adds 30% of their chance
        }

        // Cap at 0.95
        return Math.min(0.95, combined);
    }

    calculateSingleSuccessChance(adventurer) {
        if (!adventurer) return 0;

        const questType = QUEST_TYPES[this.type];
        const advStats = adventurer.getEffectiveStats();

        const primaryStat = advStats[questType.primaryStat];
        const secondaryStat = advStats[questType.secondaryStat];

        const effectivePower = (primaryStat * 0.6 + secondaryStat * 0.4) * adventurer.getRankMultiplier();
        const requiredPower = 20 * QUEST_DIFFICULTIES[this.difficulty].multiplier;

        const powerRatio = effectivePower / requiredPower;
        let successChance = this.baseSuccessRate + (powerRatio - 1) * 0.3;

        // Morale modifier
        successChance += (adventurer.morale - 50) / 200;

        // Fatigue modifier
        successChance -= (100 - adventurer.stamina) / 300;

        // Recommended type bonus
        if (this.recommendedType && adventurer.classType === this.recommendedType) {
            successChance += 0.1;
        }

        // Recommended traits bonus
        if (this.recommendedTraits.length > 0) {
            const matchingTraits = this.recommendedTraits.filter(trait => adventurer.skills.includes(trait));
            successChance += matchingTraits.length * 0.05;
        }

        return Math.max(0.05, Math.min(0.95, successChance));
    }

    canAdventurerTakeQuest(adventurer) {
        if (!adventurer) return false;
        if (adventurer.status !== 'available') return false;
        if (adventurer.stamina < this.staminaCost) return false;
        if (adventurer.injury) return false;

        // Check rank requirement
        const questRankIndex = RANKS.indexOf(QUEST_DIFFICULTIES[this.difficulty].minRank);
        return adventurer.getRankIndex() >= questRankIndex;
    }

    // ===== TURN-BASED PROCESSING =====

    processTurn() {
        if (this.status !== 'assigned') return null;

        this.currentDay++;
        this.daysRemaining--;

        // Generate event for this day
        const event = this.generateTurnEvent();
        this.eventLog.push(event);

        // Check if quest is complete
        if (this.daysRemaining <= 0) {
            return this.resolve();
        }

        return {
            type: 'progress',
            day: this.currentDay,
            maxDays: this.maxDays,
            daysRemaining: this.daysRemaining,
            event: event,
            successChance: this.successChance
        };
    }

    generateTurnEvent() {
        const events = {
            combat: [
                'Encountered a group of enemies!',
                'Found a strategic advantage point.',
                'Ambushed by hostile creatures.',
                'Successfully cleared a path forward.',
                'Discovered enemy weakness.'
            ],
            exploration: [
                'Mapped a new area successfully.',
                'Encountered rough terrain.',
                'Found useful landmarks.',
                'Weather conditions worsening.',
                'Discovered ancient markings.'
            ],
            investigation: [
                'Gathered important clues.',
                'Witnessed suspicious activity.',
                'Interviewed a witness.',
                'Found contradictory evidence.',
                'Narrowed down suspects.'
            ],
            social: [
                'Made progress in negotiations.',
                'Gained trust of locals.',
                'Encountered political resistance.',
                'Built valuable connections.',
                'Resolved a diplomatic tension.'
            ],
            crafting: [
                'Completed a phase of work.',
                'Sourced quality materials.',
                'Encountered a technical challenge.',
                'Refined a key component.',
                'Applied finishing touches.'
            ]
        };

        const typeEvents = events[this.type] || events.combat;
        const baseEvent = typeEvents[Math.floor(Math.random() * typeEvents.length)];

        // Add success/failure flavor based on current success chance
        const roll = Math.random();
        if (roll < this.successChance * 0.3) {
            return { text: baseEvent, outcome: 'positive', bonus: 0.05 };
        } else if (roll > 0.8) {
            return { text: 'Things did not go as planned...', outcome: 'negative', penalty: -0.05 };
        }

        return { text: baseEvent, outcome: 'neutral', bonus: 0 };
    }

    resolve() {
        if (this.assignedParty.length === 0 && !this.assignedAdventurer) return null;

        // Final success check with accumulated modifiers
        let finalSuccessChance = this.successChance;
        for (const event of this.eventLog) {
            if (event.bonus) finalSuccessChance += event.bonus;
            if (event.penalty) finalSuccessChance += event.penalty;
        }

        finalSuccessChance = Math.max(0.05, Math.min(0.95, finalSuccessChance));

        const roll = Math.random();
        const success = roll < finalSuccessChance;

        this.status = success ? 'completed' : 'failed';

        // Process all party members with individual EXP
        const members = this.assignedParty.length > 0 ? this.assignedParty : [this.assignedAdventurer];
        let totalExperience = 0;
        for (const member of members) {
            const memberExp = this.calculateExperienceForAdventurer(member);
            const actualExp = success ? memberExp : Math.floor(memberExp * 0.1);
            member.completeQuest(success, actualExp);
            totalExperience += actualExp;
        }

        // Calculate final rewards
        const goldReward = success ? this.goldReward : Math.floor(this.goldReward * 0.1);
        const reputationReward = success ? this.reputationReward : 0;

        return {
            type: 'resolved',
            success: success,
            quest: this,
            adventurer: this.assignedAdventurer,
            party: [...members],
            goldReward: goldReward,
            reputationReward: reputationReward,
            experience: totalExperience,
            eventLog: this.eventLog,
            finalSuccessChance: finalSuccessChance
        };
    }

    getAdventurerCompatibility(adventurer) {
        const questType = QUEST_TYPES[this.type];
        const stats = adventurer.getEffectiveStats();

        let score = 0;
        score += stats[questType.primaryStat] * 2;
        score += stats[questType.secondaryStat];

        // Rank compatibility
        const questRankIndex = RANKS.indexOf(QUEST_DIFFICULTIES[this.difficulty].minRank);
        const advRankIndex = adventurer.getRankIndex();
        const rankDiff = questRankIndex - advRankIndex;

        if (rankDiff <= -2) score *= 0.7; // Overqualified
        if (rankDiff >= 2) score *= 0.5; // Underqualified

        // Class type bonus
        if (this.type === 'combat' && adventurer.classType === 'melee') score *= 1.2;
        if (this.type === 'exploration' && adventurer.classType === 'ranged') score *= 1.2;
        if (this.type === 'investigation' && adventurer.classType === 'magic') score *= 1.2;

        return score;
    }

    // ===== SAVE/LOAD =====

    getSaveData() {
        return {
            id: this.id,
            template: this.template,
            type: this.type,
            name: this.name,
            description: this.description,
            difficulty: this.difficulty,
            goldReward: this.goldReward,
            reputationReward: this.reputationReward,
            baseExp: this.baseExp,
            staminaCost: this.staminaCost,
            maxPartySize: this.maxPartySize,
            isRankUpQuest: this.isRankUpQuest,
            targetRank: this.targetRank,
            recommendedTraits: [...this.recommendedTraits],
            recommendedType: this.recommendedType,
            status: this.status,
            assignedAdventurer: this.assignedAdventurer ? this.assignedAdventurer.id : null,
            assignedParty: this.assignedParty.map(a => a.id),
            daysRemaining: this.daysRemaining,
            maxDays: this.maxDays,
            currentDay: this.currentDay,
            baseSuccessRate: this.baseSuccessRate,
            successChance: this.successChance,
            eventLog: this.eventLog
        };
    }

    static fromSaveData(data) {
        const quest = new Quest(data.template, data.difficulty);
        Object.assign(quest, data);
        // Restore arrays
        if (data.recommendedTraits) quest.recommendedTraits = [...data.recommendedTraits];
        if (data.eventLog) quest.eventLog = [...data.eventLog];
        // Ensure baseExp is set for loaded saves
        if (quest.baseExp === undefined) {
            quest.baseExp = data.template?.baseExp || 30;
        }
        // Backward compat: convert old turn fields to day fields
        if (data.turnsRemaining !== undefined && data.daysRemaining === undefined) {
            quest.daysRemaining = data.turnsRemaining;
        }
        if (data.maxTurns !== undefined && data.maxDays === undefined) {
            quest.maxDays = data.maxTurns;
        }
        if (data.currentTurn !== undefined && data.currentDay === undefined) {
            quest.currentDay = data.currentTurn;
        }
        return quest;
    }

    static generateQuest(guildRank) {
        const guildIndex = RANKS.indexOf(guildRank);

        // Available difficulties: up to 1 rank above guild rank
        const availableDifficulties = RANKS.slice(0, guildIndex + 2);

        // Filter templates by available difficulties
        const availableTemplates = QUEST_TEMPLATES.filter(template => {
            return availableDifficulties.includes(template.difficulty);
        });

        if (availableTemplates.length === 0) return null;

        // Weighted difficulty selection - higher chance for quests matching guild rank
        const weights = {};
        availableDifficulties.forEach((diff, i) => {
            const distFromGuild = Math.abs(RANKS.indexOf(diff) - guildIndex);
            if (distFromGuild === 0) weights[diff] = 50;       // Same rank: 50%
            else if (distFromGuild === 1) weights[diff] = 30;   // 1 rank away: 30%
            else weights[diff] = 20;                             // 2+ ranks away: 20%
        });

        // Normalize weights
        const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
        let roll = Math.random() * totalWeight;
        let selectedDifficulty = availableDifficulties[0];
        for (const diff of availableDifficulties) {
            roll -= weights[diff];
            if (roll <= 0) { selectedDifficulty = diff; break; }
        }

        // Pick a template matching the selected difficulty
        const matchingTemplates = availableTemplates.filter(t => t.difficulty === selectedDifficulty);
        const template = matchingTemplates.length > 0
            ? matchingTemplates[Math.floor(Math.random() * matchingTemplates.length)]
            : availableTemplates[Math.floor(Math.random() * availableTemplates.length)];

        return new Quest(template, template.difficulty);
    }

    static generateQuests(count, guildRank) {
        const quests = [];
        for (let i = 0; i < count; i++) {
            const quest = Quest.generateQuest(guildRank);
            if (quest) quests.push(quest);
        }
        return quests;
    }
}
