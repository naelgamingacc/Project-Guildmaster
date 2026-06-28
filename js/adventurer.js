// ===== Adventurer Class =====

class Adventurer {
    constructor(name, classId, rank = 'E') {
        this.id = Date.now() + Math.random().toString(36).substr(2, 9);
        this.name = name;
        this.classId = classId;
        this.rank = rank;
        this.experience = 0;

        // EXP needed to promote to next rank
        const nextRankIndex = RANKS.indexOf(rank) + 1;
        const nextRank = nextRankIndex < RANKS.length ? RANKS[nextRankIndex] : null;
        this.expToPromote = nextRank ? (EVOLUTION_REQUIREMENTS[nextRank]?.exp || Infinity) : Infinity;

        // Stats based on class
        const classData = CLASS_TREE[classId];
        this.stats = { ...classData.baseStats };
        this.skills = [...classData.skills];

        // Status
        this.status = 'available'; // available, busy, exhausted, injured
        this.currentQuest = null;
        this.questsCompleted = 0;
        this.questsFailed = 0;

        // Vitality system
        this.maxStamina = 100;
        this.stamina = 100;
        this.morale = 80;
        this.injury = null; // null or { type, severity, daysToHeal }

        // Action points
        this.actionPoints = 1;
        this.maxActionPoints = 1;

        // Equipment
        this.equipment = {
            weapon: null,
            armor: null,
            accessory: null
        };

        // Stat modifiers from equipment
        this.statModifiers = { str: 0, agi: 0, int: 0, cha: 0, con: 0 };

        // Class evolution tracking
        this.evolutionHistory = [classId];
    }

    get classData() {
        return CLASS_TREE[this.classId];
    }

    get className() {
        return this.classData.name;
    }

    get classType() {
        return this.classData.type;
    }

    get isHealer() {
        return ['medic', 'doctor', 'healer', 'enchanter', 'grand_enchanter'].includes(this.classId);
    }

    get totalStats() {
        return {
            str: this.stats.str + this.statModifiers.str,
            agi: this.stats.agi + this.statModifiers.agi,
            int: this.stats.int + this.statModifiers.int,
            cha: this.stats.cha + this.statModifiers.cha,
            con: this.stats.con + this.statModifiers.con
        };
    }

    get combatPower() {
        const stats = this.totalStats;
        const rankMultiplier = this.getRankMultiplier();
        return Math.floor((stats.str * 2 + stats.agi * 1.5 + stats.int + stats.cha * 0.5 + stats.con * 1.2) * rankMultiplier);
    }

    getRankMultiplier() {
        const multipliers = { E: 1, D: 1.2, C: 1.5, B: 1.8, A: 2.2, S: 3 };
        return multipliers[this.rank] || 1;
    }

    getRankIndex() {
        return RANKS.indexOf(this.rank);
    }

    canTakeQuest(questDifficulty) {
        if (this.status !== 'available') return false;
        if (this.stamina < 10) return false;
        if (this.injury) return false;

        const questRankIndex = RANKS.indexOf(QUEST_DIFFICULTIES[questDifficulty].minRank);
        return this.getRankIndex() >= questRankIndex;
    }

    canTakeQuestObj(quest) {
        if (!quest) return false;
        if (this.status !== 'available') return false;
        if (this.stamina < quest.staminaCost) return false;
        if (this.injury) return false;
        if (!this.hasActionPoint()) return false;

        const questRankIndex = RANKS.indexOf(QUEST_DIFFICULTIES[quest.difficulty].minRank);
        return this.getRankIndex() >= questRankIndex;
    }

    assignQuest(quest) {
        this.status = 'busy';
        this.currentQuest = quest;
        // Use quest's stamina cost
        const staminaCost = quest.staminaCost || 15;
        this.stamina = Math.max(0, this.stamina - staminaCost);
    }

    completeQuest(success, questExperience = 0) {
        this.status = 'available';
        this.currentQuest = null;

        if (success) {
            this.questsCompleted++;
            this.gainExperience(questExperience || 30);
            this.morale = Math.min(100, this.morale + 5);
        } else {
            this.questsFailed++;
            this.gainExperience(Math.floor((questExperience || 30) * 0.1));
            this.morale = Math.max(0, this.morale - 15);

            // Check for injury on failure
            if (Math.random() < 0.3) {
                this.receiveInjury();
            }
        }

        // Additional stamina cost from quest
        this.stamina = Math.max(0, this.stamina - 10);

        if (this.stamina <= 0) {
            this.status = 'exhausted';
        }
    }

    gainExperience(amount) {
        this.experience += amount;
        if (this.experience > this.expToPromote) {
            this.experience = this.expToPromote;
        }
    }

    // ===== CLASS EVOLUTION SYSTEM =====

    canEvolve() {
        const classData = this.classData;
        if (!classData.evolutions || classData.evolutions.length === 0) return false;

        const nextRankIndex = this.getRankIndex() + 1;
        if (nextRankIndex >= RANKS.length) return false;

        return this.experience >= this.expToPromote && this.hasActionPoint();
    }

    getAvailableEvolutions() {
        if (!this.canEvolve()) return [];

        const classData = this.classData;
        return classData.evolutions
            .filter(evoId => {
                const evoClass = CLASS_TREE[evoId];
                if (!evoClass.prerequisites) return true;
                return evoClass.prerequisites.class === this.classId;
            })
            .map(evoId => ({
                id: evoId,
                ...CLASS_TREE[evoId]
            }));
    }

    evolve(newClassId) {
        if (!this.canEvolve()) {
            return { success: false, message: 'Cannot evolve yet!' };
        }

        const availableEvolutions = this.getAvailableEvolutions();
        if (!availableEvolutions.find(e => e.id === newClassId)) {
            return { success: false, message: 'Invalid evolution path!' };
        }

        // Consume action point
        this.useActionPoint();

        const oldClass = this.classData.name;
        this.classId = newClassId;
        this.evolutionHistory.push(newClassId);

        // Update rank to match class rank
        const newClassData = this.classData;
        if (RANKS.indexOf(newClassData.rank) > this.getRankIndex()) {
            this.rank = newClassData.rank;
        }

        // Update skills
        this.skills = [...newClassData.skills];

        // Apply stat bonuses based on new rank
        const rankIndex = this.getRankIndex();
        const statBonus = 3 + rankIndex * 2; // E=3, D=5, C=7, B=9, A=11, S=13
        this.stats.str += statBonus;
        this.stats.agi += statBonus;
        this.stats.int += statBonus;
        this.stats.cha += statBonus;
        this.stats.con += statBonus;

        // Increase max stamina on promotion
        this.maxStamina += 20 + rankIndex * 5;
        this.stamina = this.maxStamina;

        // Reset EXP and update threshold for next rank
        this.experience = 0;
        const nextRankIdx = RANKS.indexOf(this.rank) + 1;
        const nextRank = nextRankIdx < RANKS.length ? RANKS[nextRankIdx] : null;
        this.expToPromote = nextRank ? (EVOLUTION_REQUIREMENTS[nextRank]?.exp || Infinity) : Infinity;

        return {
            success: true,
            message: `${this.name} evolved from ${oldClass} to ${newClassData.name}!`,
            newClass: newClassData
        };
    }

    // ===== VITALITY SYSTEM =====

    useActionPoint() {
        if (this.actionPoints > 0) {
            this.actionPoints--;
            return true;
        }
        return false;
    }

    hasActionPoint() {
        return this.actionPoints > 0;
    }

    refreshActionPoints() {
        this.actionPoints = this.maxActionPoints;
    }

    rest() {
        if (!this.hasActionPoint()) {
            return { success: false, message: `${this.name} has no action point!` };
        }

        this.useActionPoint();

        const staminaRecovery = 30 + (this.stats.con / 2);
        this.stamina = Math.min(this.maxStamina, this.stamina + staminaRecovery);
        this.morale = Math.min(100, this.morale + 10);

        if (this.status === 'exhausted') {
            this.status = 'available';
        }

        // Reduce injury heal time if resting
        if (this.injury) {
            this.injury.daysToHeal--;
            if (this.injury.daysToHeal <= 0) {
                this.injury = null;
                if (this.status === 'injured') this.status = 'available';
            }
        }

        return { success: true, message: `${this.name} is resting.` };
    }

    receiveInjury() {
        const injuries = [
            { type: 'sprain', severity: 1, daysToHeal: 2, statPenalty: { agi: -2 } },
            { type: 'wound', severity: 2, daysToHeal: 3, statPenalty: { str: -3 } },
            { type: 'concussion', severity: 2, daysToHeal: 3, statPenalty: { int: -2 } },
            { type: 'broken_bone', severity: 3, daysToHeal: 5, statPenalty: { agi: -4, str: -2 } }
        ];

        this.injury = injuries[Math.floor(Math.random() * injuries.length)];
        this.status = 'injured';
    }

    healInjury() {
        if (this.injury) {
            this.injury = null;
            this.status = 'available';
            return true;
        }
        return false;
    }

    getEffectiveStats() {
        const stats = { ...this.totalStats };

        // Apply injury penalties
        if (this.injury && this.injury.statPenalty) {
            for (const [stat, penalty] of Object.entries(this.injury.statPenalty)) {
                stats[stat] = Math.max(1, stats[stat] + penalty);
            }
        }

        // Apply fatigue penalty
        if (this.stamina < 30) {
            const fatigueMultiplier = 0.7 + (this.stamina / 100) * 0.3;
            for (const stat of Object.keys(stats)) {
                stats[stat] = Math.floor(stats[stat] * fatigueMultiplier);
            }
        }

        return stats;
    }

    // ===== EQUIPMENT SYSTEM =====

    equip(item) {
        if (!item || !item.slot) return false;

        const oldItem = this.equipment[item.slot];
        this.equipment[item.slot] = item;

        // Remove old modifiers
        if (oldItem && oldItem.stats) {
            for (const [stat, value] of Object.entries(oldItem.stats)) {
                if (this.statModifiers[stat] !== undefined) {
                    this.statModifiers[stat] -= value;
                }
            }
        }

        // Apply new modifiers
        if (item.stats) {
            for (const [stat, value] of Object.entries(item.stats)) {
                if (this.statModifiers[stat] !== undefined) {
                    this.statModifiers[stat] += value;
                }
            }
        }

        return oldItem;
    }

    unequip(slot) {
        const item = this.equipment[slot];
        if (!item) return null;

        this.equipment[slot] = null;

        // Remove modifiers
        if (item.stats) {
            for (const [stat, value] of Object.entries(item.stats)) {
                if (this.statModifiers[stat] !== undefined) {
                    this.statModifiers[stat] -= value;
                }
            }
        }

        return item;
    }

    // ===== SAVE/LOAD =====

    getSaveData() {
        return {
            id: this.id,
            name: this.name,
            classId: this.classId,
            rank: this.rank,
            experience: this.experience,
            expToPromote: this.expToPromote,
            stats: { ...this.stats },
            skills: [...this.skills],
            status: this.status,
            currentQuest: this.currentQuest ? this.currentQuest.id : null,
            questsCompleted: this.questsCompleted,
            questsFailed: this.questsFailed,
            maxStamina: this.maxStamina,
            stamina: this.stamina,
            morale: this.morale,
            injury: this.injury ? { ...this.injury } : null,
            actionPoints: this.actionPoints,
            maxActionPoints: this.maxActionPoints,
            equipment: { ...this.equipment },
            statModifiers: { ...this.statModifiers },
            evolutionHistory: [...this.evolutionHistory]
        };
    }

    static createRandom(rank = 'E') {
        const names = SAMPLE_NAMES;
        const name = names[Math.floor(Math.random() * names.length)];

        // Get available classes for this rank
        const availableClasses = Object.entries(CLASS_TREE)
            .filter(([id, data]) => data.rank === rank && !data.isSpecial)
            .map(([id]) => id);

        const classId = availableClasses[Math.floor(Math.random() * availableClasses.length)];
        return new Adventurer(name, classId, rank);
    }

    static createSpecial(classId) {
        const classData = CLASS_TREE[classId];
        if (!classData || !classData.isSpecial) return null;

        const names = SAMPLE_NAMES;
        const name = names[Math.floor(Math.random() * names.length)];
        return new Adventurer(name, classId, classData.rank);
    }

    static fromSaveData(data) {
        const adv = new Adventurer(data.name, data.classId, data.rank);
        Object.assign(adv, data);
        // Ensure expToPromote is set for loaded saves
        if (adv.expToPromote === undefined || adv.expToPromote === Infinity) {
            const nextRankIndex = RANKS.indexOf(adv.rank) + 1;
            const nextRank = nextRankIndex < RANKS.length ? RANKS[nextRankIndex] : null;
            adv.expToPromote = nextRank ? (EVOLUTION_REQUIREMENTS[nextRank]?.exp || Infinity) : Infinity;
        }
        // Backward compat: convert old turnsToHeal to daysToHeal
        if (adv.injury && adv.injury.turnsToHeal !== undefined && adv.injury.daysToHeal === undefined) {
            adv.injury.daysToHeal = adv.injury.turnsToHeal;
            delete adv.injury.turnsToHeal;
        }
        // Ensure action points exist for old saves
        if (adv.actionPoints === undefined) {
            adv.actionPoints = 1;
            adv.maxActionPoints = 1;
        }
        return adv;
    }
}
