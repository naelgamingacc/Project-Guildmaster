// ===== Game Class =====

class Game {
    constructor() {
        this.guild = null;
        this.ui = new UIController();
        this.isRunning = false;
        this.autoSaveInterval = null;
    }

    initialize() {
        // Try to load saved game
        const savedGame = localStorage.getItem('guildSimulatorSave');

        if (savedGame) {
            try {
                const data = JSON.parse(savedGame);
                if (!data.version || data.version < 2) {
                    localStorage.removeItem('guildSimulatorSave');
                    throw new Error('Save data incompatible (v1), starting fresh');
                }
                this.guild = Guild.fromSaveData(data);
                this.ui.showNotification('Game loaded successfully!', 'success');
            } catch (e) {
                console.error('Failed to load save:', e);
                this.startNewGame();
            }
        } else {
            this.startNewGame();
        }

        // Initialize UI
        this.ui.initialize();
        this.ui.updateResources();
        this.ui.renderCurrentTab();

        // Check for rank-up quest on load
        this.guild.checkAndGenerateRankUpQuest();

        // Setup game loop
        this.setupGameLoop();

        this.isRunning = true;
    }

    startNewGame() {
        this.guild = new Guild('Shadowmere Guild');

        // Add starting adventurers
        const starter1 = new Adventurer('Aldric', 'combatant', 'E');
        const starter2 = new Adventurer('Lyra', 'academist', 'E');

        this.guild.adventurers.push(starter1, starter2);

        // Add starting quests
        this.guild.refreshQuests();

        this.ui.showNotification('Welcome to Shadowmere Guild! Start by recruiting adventurers and accepting quests.', 'info');
    }

    setupGameLoop() {
        // Auto-save every 60 seconds
        this.autoSaveInterval = setInterval(() => {
            this.saveGame();
        }, 60000);
    }

    nextDay() {
        const g = this.guild;

        // Advance day/week/year
        g.day++;
        if (g.day > 7) {
            g.day = 1;
            g.week++;
        }
        if (g.week > 52) {
            g.week = 1;
            g.year++;
        }

        // Process quest expiry
        const expiryResults = g.processQuestExpiry();

        // Process active quests
        const results = g.processTurn();

        // Free adventurers with unused AP get default stamina recovery
        g.applyDefaultStaminaRecovery();

        // Refresh all AP for next day
        g.refreshAllActionPoints();

        // Consume AP for adventurers still on quests
        g.adventurers.forEach(adv => {
            if (adv.status === 'busy' && adv.currentQuest) {
                adv.actionPoints = 0;
            }
        });

        // Reset daily refresh count
        g.refreshesToday = 0;

        // Process expiry results
        expiryResults.forEach(result => {
            if (result.isUrgent) {
                this.ui.showNotification(
                    `🚨 URGENT quest "${result.quest.name}" expired! Lost ${result.repPenalty} reputation!`,
                    'error'
                );
            } else {
                this.ui.showNotification(
                    `⚠️ Quest "${result.quest.name}" expired! Lost ${result.repPenalty} reputation.`,
                    'warning'
                );
            }
        });

        // Process quest results
        results.forEach(result => {
            if (result.type === 'resolved') {
                if (result.success) {
                    const partyNames = result.party ? result.party.map(a => a.name).join(', ') : result.adventurer.name;
                    this.ui.showNotification(
                        `${partyNames} completed "${result.quest.name}"! +${result.goldReward} Gold, +${result.reputationReward} Rep, +${result.experience} EXP`,
                        'success'
                    );

                    // Generate loot
                    const loot = ItemFactory.createRandomLoot(result.quest.difficulty);
                    loot.forEach(item => {
                        if (this.guild.inventory.addItem(item)) {
                            this.ui.showNotification(`Found: ${item.name} x${item.quantity}`, 'info');
                        }
                    });

                    // Check if rank-up quest was completed
                    if (result.quest.isRankUpQuest) {
                        this.ui.showNotification(
                            `Promotion Quest completed! You can now rank up the guild.`,
                            'success'
                        );
                    }
                } else {
                    const partyNames = result.party ? result.party.map(a => a.name).join(', ') : result.adventurer.name;
                    this.ui.showNotification(
                        `${partyNames} failed "${result.quest.name}"...`,
                        'error'
                    );
                }
            } else if (result.type === 'event') {
                this.ui.showEventModal(result);
            }
        });

        // Check for rank-up quest generation
        this.guild.checkAndGenerateRankUpQuest();

        // Chance for urgent quest to appear
        const urgentQuest = this.guild.trySpawnUrgentQuest();
        if (urgentQuest) {
            this.ui.showNotification(
                `🚨 URGENT: ${urgentQuest.name}! Assign someone within 1 day!`,
                'error'
            );
        }

        // Auto-replenish empty quest board
        if (g.availableQuests.length === 0) {
            const numToGen = Math.floor(Math.random() * 2) + 1;
            const newQuests = Quest.generateQuests(numToGen, g.rank);
            newQuests.forEach(q => g.addQuest(q));
        }

        // Update UI
        this.ui.updateResources();
        this.ui.renderCurrentTab();

        // Auto-save
        this.saveGame();
    }

    checkGuildRankUp() {
        if (this.guild.canRankUp()) {
            this.ui.showNotification(
                'Guild is ready to rank up! Visit Guild Hall to promote.',
                'success'
            );
        }
    }

    refreshQuests() {
        const result = this.guild.refreshQuests();
        if (result.success) {
            let msg = `Refreshed! Paid ${result.cost}g. ${result.remaining} refreshes left today.`;
            this.ui.showNotification(msg, 'info');
            if (result.urgentQuest) {
                this.ui.showNotification(
                    `🚨 URGENT: ${result.urgentQuest.name}! ${result.urgentQuest.expiresIn} days to respond!`,
                    'error'
                );
            }
        } else {
            this.ui.showNotification(result.message, 'error');
        }
        this.ui.updateResources();
    }

    saveGame() {
        try {
            const data = this.guild.getSaveData();
            localStorage.setItem('guildSimulatorSave', JSON.stringify(data));
        } catch (e) {
            console.error('Failed to save:', e);
        }
    }

    loadGame() {
        const savedGame = localStorage.getItem('guildSimulatorSave');
        if (savedGame) {
            try {
                const data = JSON.parse(savedGame);
                this.guild = Guild.fromSaveData(data);
                this.ui.updateResources();
                this.ui.updateNavVisibility();
                this.ui.renderCurrentTab();
                this.ui.showNotification('Game loaded!', 'success');
            } catch (e) {
                console.error('Failed to load save:', e);
            }
        } else {
            this.ui.showNotification('No save found!', 'warning');
        }
    }

    resetGame() {
        localStorage.removeItem('guildSimulatorSave');
        this.guild = null;
        this.startNewGame();
        this.ui.updateResources();
        this.ui.renderCurrentTab();
        this.ui.showNotification('Game reset!', 'warning');
    }

    destroy() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        this.saveGame();
    }
}
