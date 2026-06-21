// ===== UI Controller =====

class UIController {
    constructor() {
        this.currentTab = 'guild';
        this.selectedItem = null;
        this.selectedAdventurer = null;
    }

    initialize() {
        this.setupNavigation();
        this.setupModal();
        this.setupEventListeners();
        this.updateNavVisibility();
    }

    setupNavigation() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });
    }

    setupModal() {
        document.getElementById('modal-close').addEventListener('click', () => this.closeModal());
        document.getElementById('modal-overlay').addEventListener('click', (e) => {
            if (e.target.id === 'modal-overlay') this.closeModal();
        });
    }

    setupEventListeners() {
        document.getElementById('btn-recruit')?.addEventListener('click', () => this.showRecruitModal());
        document.getElementById('btn-refresh-quests')?.addEventListener('click', () => {
            if (window.game) { window.game.refreshQuests(); this.renderQuests(); }
        });
        document.getElementById('quest-filter')?.addEventListener('change', (e) => this.renderQuests(e.target.value));
        document.getElementById('inventory-filter')?.addEventListener('change', (e) => this.renderInventory(e.target.value));
    }

    updateNavVisibility() {
        if (!window.game) return;
        const g = window.game.guild;
        const craftingNav = document.getElementById('nav-crafting');
        if (craftingNav) {
            const show = g.unlockedFeatures.includes('blacksmith') || g.unlockedFeatures.includes('ancient_forge');
            craftingNav.style.display = show ? '' : 'none';
        }
        const shopNav = document.getElementById('nav-shop');
        if (shopNav) {
            const showShop = g.unlockedFeatures.includes('merchant');
            shopNav.style.display = showShop ? '' : 'none';
        }
    }

    switchTab(tabName) {
        this.currentTab = tabName;
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabName));
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.toggle('active', tab.id === 'tab-' + tabName));
        this.renderCurrentTab();
    }

    renderCurrentTab() {
        const renderers = { guild: 'renderGuildHall', adventurers: 'renderAdventurers', quests: 'renderQuests', inventory: 'renderInventory', crafting: 'renderCrafting', shop: 'renderShop' };
        if (renderers[this.currentTab]) this[renderers[this.currentTab]]();
    }

    updateResources() {
        if (!window.game) return;
        const g = window.game.guild;
        document.getElementById('gold').textContent = g.gold;
        document.getElementById('materials').textContent = g.materials;
        document.getElementById('reputation').textContent = g.reputation;
        document.getElementById('guild-rank').textContent = g.rank;
        document.getElementById('guild-rank').className = 'rank-' + g.rank;
        const nextRank = RANKS[RANKS.indexOf(g.rank) + 1];
        const prev = RANK_REQUIREMENTS[g.rank] || 0;
        const next = RANK_REQUIREMENTS[nextRank] || g.reputation + 100;
        document.getElementById('rank-progress-bar').style.width = Math.min(100, ((g.reputation - prev) / (next - prev)) * 100) + '%';

        // Update date display
        const dateEl = document.getElementById('date-display');
        if (dateEl) dateEl.textContent = g.dateDisplay;

        this.updateNavVisibility();
    }

    renderGuildHall() {
        if (!window.game) return;
        const g = window.game.guild;
        const hall = g.guildHall;
        document.getElementById('building-name').textContent = hall.name;
        document.getElementById('building-desc').textContent = hall.description;
        document.getElementById('guild-art').textContent = hall.ascii;
        document.getElementById('stat-adventurers').textContent = g.adventurers.length;
        document.getElementById('stat-quests-completed').textContent = g.totalQuestsCompleted;
        document.getElementById('stat-quests-failed').textContent = g.totalQuestsFailed;

        // Render rank-up progress
        this.renderRankUpProgress(g);

        // Render upgrades
        const list = document.getElementById('upgrade-list');
        list.innerHTML = '';
        if (hall.upgrades.length === 0) { list.innerHTML = '<p style="color:var(--text-secondary)">No upgrades available.</p>'; return; }
        hall.upgrades.forEach(up => {
            const bought = g.purchasedUpgrades.includes(up.id);
            const canAfford = g.gold >= up.cost.gold && g.materials >= up.cost.materials;
            const card = document.createElement('div');
            card.className = 'upgrade-card';
            card.innerHTML = '<h4>' + up.name + '</h4><p style="color:var(--text-secondary);font-size:0.9em">' + (up.effect ? 'Effect: ' + up.effect.replace(/_/g,' ') : '') + '</p><p>+' + up.reputationGain + ' Reputation</p><div class="upgrade-cost"><span class="cost-item">Gold ' + up.cost.gold + '</span><span class="cost-item">Materials ' + up.cost.materials + '</span></div><button class="upgrade-btn" ' + (bought || !canAfford ? 'disabled' : '') + '>' + (bought ? 'Purchased' : 'Purchase') + '</button>';
            if (!bought && canAfford) {
                card.querySelector('.upgrade-btn').addEventListener('click', () => {
                    const r = g.purchaseUpgrade(up.id);
                    this.showNotification(r.message, r.success ? 'success' : 'error');
                    if (r.success) { this.updateResources(); this.renderGuildHall(); }
                });
            }
            list.appendChild(card);
        });
    }

    renderRankUpProgress(g) {
        // Remove existing rank-up section if any
        const existing = document.getElementById('rank-up-section');
        if (existing) existing.remove();

        const progress = g.getRankUpProgress();
        const section = document.createElement('div');
        section.id = 'rank-up-section';
        section.style.cssText = 'margin-top:20px;padding:15px;background:var(--bg-dark);border-radius:10px;border:1px solid var(--border)';

        if (!progress) {
            section.innerHTML = '<h3>Guild Rank: MAX</h3><p style="color:var(--text-secondary)">Your guild has reached the highest rank!</p>';
        } else {
            const questPct = Math.min(100, Math.round((progress.questsCompleted / progress.questsRequired) * 100));
            const hasAdv = progress.hasAdventurerOfRank;
            const canAfford = progress.canAfford;
            const rankUpQuestDone = g.isRankUpQuestCompleted(progress.nextRank);
            const rankUpQuestExists = g.availableQuests.some(q => q.isRankUpQuest && q.targetRank === progress.nextRank) ||
                                       g.activeQuests.some(q => q.isRankUpQuest && q.targetRank === progress.nextRank);

            let html = '<h3>Rank Up to ' + progress.nextRank + '</h3>';
            html += '<div style="margin:10px 0;font-size:0.9em">';
            html += '<div style="display:flex;justify-content:space-between;margin:5px 0"><span>Quests at ' + g.rank + ' rank:</span><span class="' + (questPct >= 100 ? 'text-success' : '') + '">' + progress.questsCompleted + ' / ' + progress.questsRequired + '</span></div>';
            html += '<div style="display:flex;justify-content:space-between;margin:5px 0"><span>Adventurer at ' + progress.adventurerRankNeeded + '-Rank:</span><span class="' + (hasAdv ? 'text-success' : 'text-danger') + '">' + (hasAdv ? 'Yes' : 'No') + '</span></div>';
            html += '<div style="display:flex;justify-content:space-between;margin:5px 0"><span>Reputation:</span><span class="' + (progress.hasEnoughReputation ? 'text-success' : 'text-danger') + '">' + progress.reputation + ' / ' + progress.reputationRequired + '</span></div>';
            html += '<div style="display:flex;justify-content:space-between;margin:5px 0"><span>Gold Cost:</span><span class="' + (canAfford ? '' : 'text-danger') + '">' + progress.goldCost + ' Gold</span></div>';
            html += '<div style="display:flex;justify-content:space-between;margin:5px 0"><span>Material Cost:</span><span class="' + (canAfford ? '' : 'text-danger') + '">' + progress.materialCost + ' Materials</span></div>';
            html += '<div style="display:flex;justify-content:space-between;margin:5px 0"><span>Promotion Quest:</span><span class="' + (rankUpQuestDone ? 'text-success' : (rankUpQuestExists ? 'text-warning' : 'text-danger')) + '">' + (rankUpQuestDone ? 'Completed' : (rankUpQuestExists ? 'On Quest Board' : 'Pending')) + '</span></div>';
            html += '<div style="display:flex;justify-content:space-between;margin:5px 0;color:var(--accent)"><span>Unlocks:</span><span>' + progress.unlocksLabel + '</span></div>';
            html += '</div>';

            if (progress.allMet) {
                html += '<button id="btn-rank-up" class="action-btn" style="width:100%;background:var(--success);margin-top:10px">Rank Up Guild to ' + progress.nextRank + '</button>';
            } else if (!rankUpQuestDone && rankUpQuestExists) {
                html += '<p style="margin-top:10px;padding:8px;background:rgba(255,215,0,0.1);border:1px solid var(--gold);border-radius:5px;text-align:center;color:var(--gold)">Complete the Promotion Quest on the Quest Board!</p>';
            } else if (!rankUpQuestDone && !rankUpQuestExists && questPct >= 100 && hasAdv && canAfford) {
                html += '<p style="margin-top:10px;padding:8px;background:rgba(255,152,0,0.1);border:1px solid var(--warning);border-radius:5px;text-align:center;color:var(--warning)">Promotion Quest will appear on the board soon...</p>';
            } else {
                html += '<button class="action-btn" disabled style="width:100%;margin-top:10px;opacity:0.5">Prerequisites Not Met</button>';
            }

            section.innerHTML = html;

            // Add rank-up button handler
            if (progress.allMet) {
                setTimeout(() => {
                    const btn = document.getElementById('btn-rank-up');
                    if (btn) {
                        btn.addEventListener('click', () => {
                            const result = g.performRankUp();
                            this.showNotification(result.message, result.success ? 'success' : 'error');
                            if (result.success) {
                                this.updateResources();
                                this.updateNavVisibility();
                                this.renderGuildHall();
                                g.refreshQuests();
                            }
                        });
                    }
                }, 0);
            }
        }

        // Insert after guild-stats
        const statsDiv = document.querySelector('.guild-stats');
        if (statsDiv) {
            statsDiv.parentNode.insertBefore(section, statsDiv.nextSibling);
        }
    }

    renderAdventurers() {
        if (!window.game) return;
        const list = document.getElementById('adventurer-list');
        const advs = window.game.guild.adventurers;
        if (advs.length === 0) { list.innerHTML = '<div class="empty-state"><h3>No Adventurers</h3><p>Recruit some adventurers!</p></div>'; return; }
        list.innerHTML = '';
        advs.forEach(adv => list.appendChild(this.createAdventurerCard(adv)));
    }

    createAdventurerCard(adv) {
        const card = document.createElement('div');
        card.className = 'adventurer-card';
        const icons = { melee: '⚔️', ranged: '🏹', magic: '✨', support: '🎒', crafting: '⚒️' };
        const icon = icons[adv.classType] || '👤';
        const canEvolve = adv.canEvolve();
        let html = '<div class="adventurer-header"><div><div class="adventurer-name">' + icon + ' ' + adv.name + '</div><div class="adventurer-class">' + adv.className + '</div></div><span class="adventurer-rank rank-' + adv.rank + '">' + adv.rank + '</span></div>';
        html += '<div class="adventurer-stats">';
        const s = adv.totalStats;
        ['str','agi','int','cha','con'].forEach(st => { html += '<div class="stat-item"><span class="stat-label">' + st.toUpperCase() + '</span><span class="stat-value">' + s[st] + '</span></div>'; });
        html += '<div class="stat-item"><span class="stat-label">Power</span><span class="stat-value">' + adv.combatPower + '</span></div></div>';

        // Equipment slots
        html += '<div class="adventurer-equipment">';
        const slotIcons = { weapon: '⚔️', armor: '🛡️', accessory: '💍' };
        const slotNames = { weapon: 'Weapon', armor: 'Armor', accessory: 'Acc.' };
        ['weapon', 'armor', 'accessory'].forEach(slot => {
            const item = adv.equipment[slot];
            if (item) {
                let statsText = item.stats ? Object.entries(item.stats).filter(([,v]) => v !== 0).map(([k,v]) => (v>0?'+':'') + v + ' ' + k.toUpperCase()).join(' ') : '';
                html += '<div class="equip-slot" data-slot="' + slot + '" title="' + item.name + '">';
                html += '<span class="equip-slot-icon">' + (item.icon || slotIcons[slot]) + '</span>';
                html += '<span class="equip-slot-name">' + item.name + '</span>';
                if (statsText) html += '<span class="equip-slot-stats">' + statsText + '</span>';
                html += '</div>';
            } else {
                html += '<div class="equip-slot empty" data-slot="' + slot + '">';
                html += '<span class="equip-slot-icon">' + slotIcons[slot] + '</span>';
                html += '<span class="equip-slot-label">' + slotNames[slot] + '</span>';
                html += '</div>';
            }
        });
        html += '</div>';

        html += '<div class="adventurer-vitals"><div class="vital-bar"><span class="vital-label">Stamina</span><div class="vital-progress"><div class="vital-fill stamina-fill" style="width:' + (adv.stamina / adv.maxStamina * 100) + '%"></div></div><span class="vital-value">' + adv.stamina + '/' + adv.maxStamina + '</span></div>';
        html += '<div class="vital-bar"><span class="vital-label">EXP</span><div class="vital-progress"><div class="vital-fill exp-fill" style="width:' + (adv.expToPromote === Infinity ? 0 : (adv.experience / adv.expToPromote * 100)) + '%"></div></div><span class="vital-value">' + adv.experience + '/' + (adv.expToPromote === Infinity ? 'MAX' : adv.expToPromote) + '</span></div>';
        html += '<div class="ap-display' + (adv.actionPoints <= 0 ? ' ap-depleted' : '') + '">⚡ AP: ' + adv.actionPoints + '/' + adv.maxActionPoints + '</div></div>';
        html += '<div class="adventurer-skills">' + adv.skills.map(sk => '<span class="skill-tag">' + sk.replace(/_/g,' ') + '</span>').join('') + '</div>';
        if (adv.injury) html += '<div style="margin-top:10px;padding:8px;background:rgba(244,67,54,0.2);border:1px solid var(--danger);border-radius:5px"><strong>Injured:</strong> ' + adv.injury.type.replace(/_/g,' ') + ' (' + adv.injury.daysToHeal + ' days)</div>';
        html += '<div class="adventurer-status status-' + adv.status + '">' + adv.status.charAt(0).toUpperCase() + adv.status.slice(1) + (adv.status === 'busy' ? ' - ' + (adv.currentQuest ? adv.currentQuest.name : 'Quest') : '') + '</div>';
        html += '<div style="margin-top:15px;display:flex;gap:5px;flex-wrap:wrap">';
        html += '<button class="action-btn btn-rest"' + (adv.status === 'busy' || !adv.hasActionPoint() ? ' disabled' : '') + ' style="flex:1">Rest</button>';
        html += '<button class="action-btn btn-heal"' + (!adv.injury || !adv.hasActionPoint() ? ' disabled' : '') + ' style="flex:1">Heal</button>';
        html += '<button class="action-btn btn-dismiss"' + (adv.status === 'busy' ? ' disabled' : '') + ' style="flex:1;background:var(--danger)">Dismiss</button>';
        if (canEvolve) html += '<button class="action-btn btn-promote" style="flex:1;background:var(--gold);color:#1a1a2e">Promote</button>';
        html += '</div>';
        card.innerHTML = html;

        // Equipment slot click handlers
        card.querySelectorAll('.equip-slot').forEach(slot => {
            slot.addEventListener('click', () => {
                this.selectedAdventurer = adv;
                this.showEquipModal(adv, slot.dataset.slot);
            });
        });

        card.querySelector('.btn-rest')?.addEventListener('click', () => {
            const result = adv.rest();
            this.showNotification(result.message, result.success ? 'success' : 'error');
            this.renderAdventurers();
        });
        card.querySelector('.btn-heal')?.addEventListener('click', () => {
            if (adv.injury && adv.hasActionPoint()) {
                this.showHealModal(adv);
            }
        });
        card.querySelector('.btn-dismiss')?.addEventListener('click', () => {
            if (confirm('Dismiss ' + adv.name + '?')) { const r = window.game.guild.dismissAdventurer(adv.id); this.showNotification(r.message, r.success ? 'success' : 'error'); if (r.success) { this.renderAdventurers(); this.updateResources(); } }
        });
        card.querySelector('.btn-promote')?.addEventListener('click', () => this.showEvolutionModal(adv));
        return card;
    }

    renderQuests(filter) {
        if (!filter) filter = 'all';
        if (!window.game) return;
        const g = window.game.guild;

        // Render available adventurers panel
        this.renderAvailableAdventurers(g);

        const list = document.getElementById('quest-list');
        let quests;
        switch (filter) {
            case 'available': quests = g.availableQuests; break;
            case 'active': quests = g.activeQuests; break;
            case 'completed': quests = g.completedQuests.slice(-10); break;
            default: quests = [...g.availableQuests, ...g.activeQuests];
        }
        if (quests.length === 0) { list.innerHTML = '<div class="empty-state"><h3>No Quests</h3><p>Refresh or check back later.</p></div>'; return; }
        list.innerHTML = '';
        quests.forEach(q => list.appendChild(this.createQuestCard(q)));
    }

    renderAvailableAdventurers(g) {
        const panel = document.getElementById('available-adventurers-panel');
        if (!panel) return;

        const available = g.adventurers.filter(a => a.status === 'available' && a.stamina > 0 && !a.injury);

        if (available.length === 0) {
            panel.innerHTML = '<div class="available-adventurers-box"><h4>Available Adventurers</h4><p style="color:var(--text-secondary)">No adventurers available. <button class="action-btn btn-recruit-inline" style="font-size:0.85em;padding:4px 10px;margin-left:5px">Recruit</button></p></div>';
            panel.querySelector('.btn-recruit-inline')?.addEventListener('click', () => this.showRecruitModal());
            return;
        }

        let html = '<div class="available-adventurers-box"><h4>Available Adventurers (' + available.length + ')</h4><div class="available-adventurers-list">';
        available.forEach(a => {
            html += '<div class="available-adv-item">';
            html += '<span class="available-adv-name">' + a.name + '</span>';
            html += '<span class="rank-' + a.rank + ' available-adv-rank">' + a.rank + '</span>';
            html += '<span class="available-adv-class">' + a.className + '</span>';
            html += '<span class="available-adv-stamina">Stamina: ' + a.stamina + '/' + a.maxStamina + '</span>';
            html += '</div>';
        });
        html += '</div></div>';
        panel.innerHTML = html;
    }

    createQuestCard(quest) {
        const card = document.createElement('div');
        card.className = 'quest-card' + (quest.isRankUpQuest ? ' rank-up-quest' : '');
        const qt = QUEST_TYPES[quest.type];
        const isAvail = quest.status === 'available';
        let html = '<div class="quest-header"><div class="quest-name">' + qt.icon + ' ' + quest.name + '</div><span class="quest-rank rank-' + QUEST_DIFFICULTIES[quest.difficulty].minRank + '">' + quest.difficulty.replace(/_/g,' ') + '</span></div>';
        html += '<p class="quest-description">' + quest.description + '</p>';
        html += '<div class="quest-requirements"><h4>Details</h4>';
        html += '<div class="requirement-item"><span>Type:</span><span>' + qt.name + '</span></div>';
        html += '<div class="requirement-item"><span>Primary Stat:</span><span>' + qt.primaryStat.toUpperCase() + '</span></div>';
        html += '<div class="requirement-item"><span>Stamina Cost:</span><span>' + quest.staminaCost + ' per member</span></div>';
        html += '<div class="requirement-item"><span>Days:</span><span>' + (quest.assignedAdventurer ? quest.daysRemaining + '/' + quest.maxDays : quest.maxDays) + '</span></div>';

        // Party size info
        if (quest.maxPartySize > 1) {
            html += '<div class="requirement-item"><span>Party Size:</span><span>' + quest.maxPartySize + ' adventurers</span></div>';
        }

        // Show assigned party
        if (quest.assignedParty && quest.assignedParty.length > 0) {
            html += '<div class="requirement-item"><span>Party:</span><span>' + quest.assignedParty.map(a => a.name).join(', ') + '</span></div>';
        }

        if (quest.recommendedTraits && quest.recommendedTraits.length > 0) {
            html += '<div class="requirement-item"><span>Recommended:</span><span>' + quest.recommendedTraits.map(t => t.replace(/_/g,' ')).join(', ') + '</span></div>';
        }
        if (quest.assignedAdventurer && quest.status !== 'available') {
            html += '<div class="requirement-item"><span>Success:</span><span>' + Math.round(quest.successChance * 100) + '%</span></div>';
        }
        html += '</div>';
        html += '<div class="quest-rewards"><span class="reward-item">Gold ' + quest.goldReward + '</span><span class="reward-item">Rep ' + quest.reputationReward + '</span><span class="reward-item">EXP ' + quest.baseExp + ' base</span></div>';
        if (isAvail) html += '<button class="quest-btn" style="margin-top:15px;width:100%">' + (quest.maxPartySize > 1 ? 'Assemble Party' : 'Assign Adventurer') + '</button>';
        if (isAvail) html += '<button class="action-btn btn-dismiss-quest" style="margin-top:8px;width:100%;background:var(--border);font-size:0.85em">Dismiss Quest</button>';
        card.innerHTML = html;
        if (isAvail) {
            card.querySelector('.quest-btn').addEventListener('click', () => this.showAssignQuestModal(quest));
            card.querySelector('.btn-dismiss-quest').addEventListener('click', () => {
                const r = window.game.guild.dismissQuest(quest.id);
                this.showNotification(r.message, r.success ? 'success' : 'error');
                if (r.success) this.renderQuests();
            });
        }
        return card;
    }

    renderInventory(filter) {
        if (!filter) filter = 'all';
        if (!window.game) return;
        const inv = window.game.guild.inventory;
        const grid = document.getElementById('inventory-grid');
        const items = inv.getItemsByType(filter);
        grid.innerHTML = '';
        for (let i = 0; i < inv.maxSize; i++) {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            if (items[i]) {
                const it = items[i];
                slot.innerHTML = '<span class="item-icon">' + (it.icon || '?') + '</span>' + (it.quantity > 1 ? '<span class="item-count">' + it.quantity + '</span>' : '');
                slot.title = it.name;
                if (this.selectedItem && this.selectedItem.instanceId === it.instanceId) slot.classList.add('selected');
                slot.addEventListener('click', () => { this.selectedItem = it; this.renderItemDetails(it); this.renderInventory(filter); });
            }
            grid.appendChild(slot);
        }
    }

    renderItemDetails(item) {
        const d = document.getElementById('item-details');
        if (!item) { d.innerHTML = '<h3>Select an item</h3>'; return; }
        let extra = '';
        if (item.type === 'consumable' && item.effect) {
            extra = '<p><strong>Effect:</strong></p><ul>';
            if (item.effect.heal) extra += '<li>Heals ' + item.effect.heal + ' HP</li>';
            if (item.effect.fatigue) extra += '<li>Restores stamina</li>';
            if (item.effect.tempStr) extra += '<li>+' + item.effect.tempStr + ' STR (temp)</li>';
            if (item.effect.tempAgi) extra += '<li>+' + item.effect.tempAgi + ' AGI (temp)</li>';
            if (item.effect.tempInt) extra += '<li>+' + item.effect.tempInt + ' INT (temp)</li>';
            extra += '</ul>';
        } else if (item.type === 'equipment' && item.stats) {
            extra = '<p><strong>Stats:</strong></p><ul>' + Object.entries(item.stats).map(([k,v]) => '<li>' + (v>0?'+':'') + v + ' ' + k.toUpperCase() + '</li>').join('') + '</ul><p><strong>Slot:</strong> ' + item.slot + '</p>';
        }
        d.innerHTML = '<h3>' + (item.icon||'') + ' ' + item.name + '</h3><p><strong>Type:</strong> ' + item.type + '</p>' + extra + '<p><strong>Qty:</strong> ' + item.quantity + '</p><div style="margin-top:15px"><button class="action-btn btn-use-item"' + (item.type !== 'consumable' && item.type !== 'equipment' ? ' disabled' : '') + '>' + (item.type === 'equipment' ? 'Equip' : 'Use') + '</button><button class="action-btn btn-drop-item" style="margin-left:10px;background:var(--danger)">Drop</button></div>';
        d.querySelector('.btn-use-item')?.addEventListener('click', () => { if (item.type === 'equipment') this.showEquipModal(this.selectedAdventurer, item); else this.showUseItemModal(item); });
        d.querySelector('.btn-drop-item')?.addEventListener('click', () => { if (confirm('Drop ' + item.name + '?')) { window.game.guild.inventory.removeItem(item.instanceId); this.selectedItem = null; this.renderItemDetails(null); this.renderInventory(); } });
    }

    renderShop() {
        if (!window.game) return;
        const list = document.getElementById('shop-inventory');
        list.innerHTML = '';
        SHOP_ITEMS.forEach(item => {
            const card = document.createElement('div');
            card.className = 'shop-item';
            const can = window.game.guild.gold >= item.cost;
            card.innerHTML = '<div class="quest-header"><div class="quest-name">' + (item.icon||'?') + ' ' + item.name + '</div><span class="quest-rank rank-E">' + item.type + '</span></div><div class="shop-price">Gold ' + item.cost + '</div><button class="quest-btn" style="margin-top:10px;width:100%"' + (can ? '' : ' disabled') + '>Buy</button>';
            card.querySelector('.quest-btn').addEventListener('click', () => this.buyItem(item));
            list.appendChild(card);
        });
    }

    renderCrafting() {
        if (!window.game) return;
        const g = window.game.guild;
        const list = document.getElementById('crafting-list');
        const recipes = g.getAvailableRecipes();

        if (recipes.length === 0) {
            list.innerHTML = '<div class="empty-state"><h3>No Recipes Available</h3><p>Unlock the Blacksmith to craft equipment.</p></div>';
            return;
        }

        if (!this.craftingCategory) this.craftingCategory = 'weapon';

        const categories = [
            { key: 'weapon', label: 'Weapons', icon: '⚔️' },
            { key: 'armor', label: 'Armor', icon: '🛡️' },
            { key: 'accessory', label: 'Accessories', icon: '💍' }
        ];

        let tabsHtml = '<div class="crafting-categories">';
        categories.forEach(cat => {
            tabsHtml += '<button class="crafting-cat-btn' + (this.craftingCategory === cat.key ? ' active' : '') + '" data-cat="' + cat.key + '">' + cat.icon + ' ' + cat.label + '</button>';
        });
        tabsHtml += '</div>';

        const filtered = recipes.filter(r => r.slot === this.craftingCategory);

        let html = tabsHtml;
        if (filtered.length === 0) {
            html += '<div class="empty-state"><p>No recipes in this category yet.</p></div>';
            list.innerHTML = html;
            return;
        }

        filtered.forEach(recipe => {
            const card = document.createElement('div');
            card.className = 'crafting-card';
            const canCraft = g.canCraft(recipe.id);

            let cardHtml = '<div class="crafting-card-header">';
            cardHtml += '<span class="crafting-card-name">' + recipe.name + '</span>';
            cardHtml += '<span class="crafting-card-icon">' + recipe.icon + '</span>';
            cardHtml += '</div>';

            cardHtml += '<div class="crafting-materials">';
            recipe.materials.forEach(mat => {
                const owned = g.inventory.items.find(i => i.id === mat.id);
                const ownedQty = owned ? owned.quantity : 0;
                const enough = ownedQty >= mat.quantity;
                const matName = mat.id.replace(/_/g, ' ');
                cardHtml += '<span class="material-req ' + (enough ? 'material-owned' : 'material-missing') + '">' + matName + ': ' + ownedQty + '/' + mat.quantity + '</span>';
            });
            cardHtml += '</div>';

            cardHtml += '<div class="crafting-cost"><span>Gold: ' + recipe.goldCost + '</span></div>';
            cardHtml += '<button class="action-btn craft-btn"' + (canCraft ? '' : ' disabled') + '>Craft</button>';

            card.innerHTML = cardHtml;

            if (canCraft) {
                card.querySelector('.craft-btn').addEventListener('click', () => {
                    const result = g.craftItem(recipe.id);
                    this.showNotification(result.message, result.success ? 'success' : 'error');
                    if (result.success) {
                        this.updateResources();
                        this.renderCrafting();
                    }
                });
            }

            list.appendChild(card);
        });

        list.querySelectorAll('.crafting-cat-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.craftingCategory = btn.dataset.cat;
                this.renderCrafting();
            });
        });
    }

    buyItem(si) {
        const g = window.game.guild;
        if (g.gold < si.cost) { this.showNotification('Not enough gold!', 'error'); return; }
        if (g.inventory.isFull) { this.showNotification('Inventory full!', 'error'); return; }
        const item = ItemFactory.createItem(si.id);
        if (g.inventory.addItem(item)) { g.spendGold(si.cost); this.updateResources(); this.renderShop(); this.showNotification('Bought ' + si.name + '!', 'success'); }
    }

    showRecruitModal() {
        const g = window.game.guild;
        if (g.gold < RECRUIT_COST) { this.showNotification('Not enough gold!', 'error'); return; }
        if (g.adventurers.length >= g.maxAdventurers) { this.showNotification('Guild full!', 'error'); return; }
        const body = document.getElementById('modal-body');
        body.innerHTML = '<h3>Choose a Recruit</h3><p style="margin-bottom:20px;color:var(--text-secondary)">Cost: ' + RECRUIT_COST + ' Gold</p><div class="card-list" id="candidate-list"></div>';
        const list = document.getElementById('candidate-list');
        [Adventurer.createRandom(g.rank), Adventurer.createRandom(g.rank), Adventurer.createRandom(g.rank)].forEach(adv => {
            const card = this.createAdventurerCard(adv);
            const btn = document.createElement('button');
            btn.className = 'action-btn';
            btn.style.cssText = 'margin-top:10px;width:100%';
            btn.textContent = 'Recruit';
            btn.addEventListener('click', () => { const r = g.recruitAdventurer(adv); this.showNotification(r.message, r.success ? 'success' : 'error'); if (r.success) { this.closeModal(); this.updateResources(); this.renderAdventurers(); } });
            card.appendChild(btn);
            list.appendChild(card);
        });
        document.getElementById('modal-overlay').classList.remove('hidden');
    }

    showHealModal(patient) {
        const g = window.game.guild;
        const healers = g.adventurers.filter(a => a.isHealer && a.status === 'available' && a.hasActionPoint());
        const body = document.getElementById('modal-body');

        let html = '<h3>Heal ' + patient.name + '</h3>';
        html += '<p style="margin-bottom:5px;color:var(--text-secondary)">Injury: ' + patient.injury.type.replace(/_/g, ' ') + ' (' + patient.injury.daysToHeal + ' days)</p>';
        html += '<p style="margin-bottom:15px;color:var(--text-secondary)">Cost: ' + g.healCost + ' Gold + 1 AP (healer) + 1 AP (patient)</p>';

        if (healers.length === 0) {
            html += '<p style="color:var(--danger)">No healers available! You need a Medic class adventurer with an action point.</p>';
        } else {
            html += '<div class="healer-select-list">';
            healers.forEach(healer => {
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

                html += '<div class="healer-select-card" data-healer-id="' + healer.id + '">';
                html += '<div class="healer-select-info">';
                html += '<span class="healer-select-name">' + healer.name + '</span>';
                html += '<span class="healer-select-class">' + healer.className + ' (Rank ' + healer.rank + ')</span>';
                html += '<span class="healer-select-exp">+' + expGained + ' EXP</span>';
                html += '</div>';
                html += '</div>';
            });
            html += '</div>';
        }

        html += '<div style="margin-top:15px;text-align:right"><button class="action-btn" id="heal-cancel-btn" style="background:var(--border)">Cancel</button></div>';

        body.innerHTML = html;

        // Add click handlers
        body.querySelectorAll('.healer-select-card').forEach(card => {
            card.addEventListener('click', () => {
                const healerId = card.dataset.healerId;
                const result = g.healAdventurer(patient.id, healerId);
                this.showNotification(result.message, result.success ? 'success' : 'error');
                if (result.success) {
                    this.closeModal();
                    this.updateResources();
                    this.renderAdventurers();
                }
            });
        });

        body.querySelector('#heal-cancel-btn')?.addEventListener('click', () => this.closeModal());

        document.getElementById('modal-overlay').classList.remove('hidden');
    }

    showAssignQuestModal(quest) {
        const g = window.game.guild;
        const canParty = quest.maxPartySize > 1;
        const available = g.adventurers.filter(a => a.canTakeQuestObj(quest));
        const body = document.getElementById('modal-body');

        if (canParty) {
            // Party selection mode
            let html = '<h3>Assemble Party for "' + quest.name + '"</h3>';
            html += '<p style="margin-bottom:15px;color:var(--text-secondary)">Party size: ' + quest.maxPartySize + ' | Stamina cost per member: ' + quest.staminaCost + '</p>';
            html += '<div class="party-selection">';
            html += '<div class="party-counter"><span class="party-counter-text">Party: <span id="party-count">0</span>/' + quest.maxPartySize + '</span><span id="party-success"></span></div>';
            html += '<div id="party-members"></div>';
            html += '<button id="btn-confirm-party" class="action-btn party-confirm-btn" disabled>Confirm Party</button>';
            html += '</div>';

            body.innerHTML = html;

            const list = document.getElementById('party-members');
            const selectedIds = [];

            const updatePartyUI = () => {
                document.getElementById('party-count').textContent = selectedIds.length;
                const confirmBtn = document.getElementById('btn-confirm-party');
                confirmBtn.disabled = selectedIds.length === 0;

                // Calculate estimated success
                if (selectedIds.length > 0) {
                    const party = selectedIds.map(id => available.find(a => a.id === id)).filter(Boolean);
                    const estSuccess = quest.calculatePartySuccessChance(party);
                    document.getElementById('party-success').textContent = 'Est. Success: ' + Math.round(estSuccess * 100) + '%';
                } else {
                    document.getElementById('party-success').textContent = '';
                }

                // Update checkboxes
                list.querySelectorAll('.party-member-check').forEach(el => {
                    const id = el.dataset.id;
                    const isSelected = selectedIds.includes(id);
                    el.classList.toggle('selected', isSelected);
                    el.querySelector('input').checked = isSelected;
                });
            };

            available.forEach(adv => {
                const div = document.createElement('div');
                div.className = 'party-member-check';
                div.dataset.id = adv.id;
                const sc = quest.calculateSingleSuccessChance(adv);
                div.innerHTML = '<input type="checkbox"><div class="party-member-info"><div class="party-member-name">' + adv.name + '</div><div class="party-member-class">' + adv.className + ' (' + adv.rank + '-Rank)</div></div><div class="party-member-contribution">' + Math.round(sc * 100) + '% success</div>';

                div.addEventListener('click', (e) => {
                    if (e.target.tagName === 'INPUT') return;
                    const idx = selectedIds.indexOf(adv.id);
                    if (idx === -1) {
                        if (selectedIds.length < quest.maxPartySize) selectedIds.push(adv.id);
                    } else {
                        selectedIds.splice(idx, 1);
                    }
                    updatePartyUI();
                });

                div.querySelector('input').addEventListener('change', (e) => {
                    const idx = selectedIds.indexOf(adv.id);
                    if (e.target.checked && idx === -1) {
                        if (selectedIds.length < quest.maxPartySize) selectedIds.push(adv.id);
                    } else if (!e.target.checked && idx !== -1) {
                        selectedIds.splice(idx, 1);
                    }
                    updatePartyUI();
                });

                list.appendChild(div);
            });

            document.getElementById('btn-confirm-party').addEventListener('click', () => {
                if (selectedIds.length === 0) return;
                const result = g.assignQuestToParty(quest.id, selectedIds);
                this.showNotification(result.message, result.success ? 'success' : 'error');
                if (result.success) {
                    this.closeModal();
                    this.renderQuests();
                    this.renderAdventurers();
                }
            });

        } else {
            // Solo assignment mode (existing logic)
            body.innerHTML = '<h3>Assign to "' + quest.name + '"</h3><p style="margin-bottom:20px;color:var(--text-secondary)">Select an adventurer for this ' + quest.type + ' quest. Stamina cost: ' + quest.staminaCost + '</p><div class="card-list" id="avail-advs"></div>';
            const list = document.getElementById('avail-advs');
            if (available.length === 0) {
                list.innerHTML = '<div class="empty-state"><h3>No Available Adventurers</h3><p>None meet the requirements. Need stamina ' + quest.staminaCost + '+ and rank ' + QUEST_DIFFICULTIES[quest.difficulty].minRank + '+.</p></div>';
            } else {
                available.sort((a, b) => quest.getAdventurerCompatibility(b) - quest.getAdventurerCompatibility(a));
                available.forEach(adv => {
                    const card = document.createElement('div');
                    card.className = 'adventurer-card';
                    const sc = quest.calculateSuccessChance(adv);
                    const qt = QUEST_TYPES[quest.type];
                    card.innerHTML = '<div class="adventurer-header"><div><div class="adventurer-name">' + adv.name + '</div><div class="adventurer-class">' + adv.className + '</div></div><span class="adventurer-rank rank-' + adv.rank + '">' + adv.rank + '</span></div><div style="margin:10px 0;padding:10px;background:var(--bg-medium);border-radius:8px"><p><strong>' + qt.primaryStat.toUpperCase() + ':</strong> ' + adv.totalStats[qt.primaryStat] + ' | <strong>' + qt.secondaryStat.toUpperCase() + ':</strong> ' + adv.totalStats[qt.secondaryStat] + '</p><p><strong>Success Chance:</strong> ' + Math.round(sc * 100) + '%</p><p><strong>Stamina:</strong> ' + adv.stamina + '/' + adv.maxStamina + ' (costs ' + quest.staminaCost + ')</p></div><button class="action-btn" style="width:100%">Assign</button>';
                    card.querySelector('.action-btn').addEventListener('click', () => { const r = g.assignQuest(quest.id, adv.id); this.showNotification(r.message, r.success ? 'success' : 'error'); if (r.success) { this.closeModal(); this.renderQuests(); this.renderAdventurers(); } });
                    list.appendChild(card);
                });
            }
        }

        document.getElementById('modal-overlay').classList.remove('hidden');
    }

    showEvolutionModal(adv) {
        const evolutions = adv.getAvailableEvolutions();
        if (evolutions.length === 0) return;

        // Single path — auto-evolve
        if (evolutions.length === 1) {
            const r = adv.evolve(evolutions[0].id);
            this.showNotification(r.message, r.success ? 'success' : 'error');
            if (r.success) this.renderAdventurers();
            return;
        }

        // Multiple paths — show choice modal
        const body = document.getElementById('modal-body');
        body.innerHTML = '<h3>Promote ' + adv.name + '</h3><p style="margin-bottom:20px;color:var(--text-secondary)">Current: ' + adv.className + ' (' + adv.rank + '-Rank)</p><div class="card-list" id="evo-list"></div>';
        const list = document.getElementById('evo-list');
        evolutions.forEach(evo => {
            const card = document.createElement('div');
            card.className = 'adventurer-card';
            card.innerHTML = '<div class="adventurer-header"><div><div class="adventurer-name">' + evo.name + '</div><div class="adventurer-class">' + evo.description + '</div></div><span class="adventurer-rank rank-' + evo.rank + '">' + evo.rank + '</span></div><div style="margin:10px 0;padding:10px;background:var(--bg-medium);border-radius:8px"><p><strong>Type:</strong> ' + evo.type + '</p><p><strong>Skills:</strong> ' + evo.skills.join(', ').replace(/_/g, ' ') + '</p></div><button class="action-btn" style="width:100%;background:var(--gold);color:#1a1a2e">Promote to ' + evo.name + '</button>';
            card.querySelector('.action-btn').addEventListener('click', () => { const r = adv.evolve(evo.id); this.showNotification(r.message, r.success ? 'success' : 'error'); if (r.success) { this.closeModal(); this.renderAdventurers(); } });
            list.appendChild(card);
        });
        document.getElementById('modal-overlay').classList.remove('hidden');
    }

    showEquipModal(adv, slotFilter) {
        if (!adv) { this.showNotification('Select an adventurer first!', 'error'); return; }
        const g = window.game.guild;
        const body = document.getElementById('modal-body');

        let html = '<h3>Equip ' + adv.name + '</h3>';

        // Show current equipment
        html += '<div style="margin-bottom:20px"><h4 style="margin-bottom:10px;color:var(--text-secondary)">Current Equipment</h4>';
        html += '<div class="adventurer-equipment" style="margin:0">';
        const slotIcons = { weapon: '⚔️', armor: '🛡️', accessory: '💍' };
        const slotNames = { weapon: 'Weapon', armor: 'Armor', accessory: 'Accessory' };
        ['weapon', 'armor', 'accessory'].forEach(slot => {
            const item = adv.equipment[slot];
            const isActive = !slotFilter || slotFilter === slot;
            const borderStyle = isActive ? 'border-color:var(--accent)' : '';
            if (item) {
                let statsText = item.stats ? Object.entries(item.stats).filter(([,v]) => v !== 0).map(([k,v]) => (v>0?'+':'') + v + ' ' + k.toUpperCase()).join(' ') : '';
                html += '<div class="equip-slot" style="' + borderStyle + 'cursor:default">';
                html += '<span class="equip-slot-icon">' + (item.icon || slotIcons[slot]) + '</span>';
                html += '<span class="equip-slot-name">' + item.name + '</span>';
                if (statsText) html += '<span class="equip-slot-stats">' + statsText + '</span>';
                html += '</div>';
            } else {
                html += '<div class="equip-slot empty" style="' + borderStyle + 'cursor:default">';
                html += '<span class="equip-slot-icon">' + slotIcons[slot] + '</span>';
                html += '<span class="equip-slot-label">' + slotNames[slot] + '</span>';
                html += '</div>';
            }
        });
        html += '</div></div>';

        // Show available equipment filtered by slot
        const filterSlot = slotFilter || null;
        const items = g.inventory.getItemsByType('equipment').filter(item => !filterSlot || item.slot === filterSlot);

        html += '<h4 style="margin-bottom:10px;color:var(--text-secondary)">Available ' + (filterSlot ? slotNames[filterSlot] : 'Equipment') + '</h4>';
        html += '<div class="card-list" id="equip-list"></div>';

        body.innerHTML = html;

        const list = document.getElementById('equip-list');
        if (items.length === 0) {
            list.innerHTML = '<div class="empty-state"><h3>No Equipment</h3><p>Buy or craft items from the shop/blacksmith!</p></div>';
        } else {
            items.forEach(ei => {
                const card = document.createElement('div');
                card.className = 'shop-item';
                let statsText = ei.stats ? Object.entries(ei.stats).filter(([,v]) => v !== 0).map(([k,v]) => (v>0?'+':'') + v + ' ' + k.toUpperCase()).join(', ') : '';
                const isEquipped = adv.equipment[ei.slot]?.instanceId === ei.instanceId;
                card.innerHTML = '<div class="quest-header"><div class="quest-name">' + (ei.icon||'?') + ' ' + ei.name + '</div></div><p style="font-size:0.9em;color:var(--text-secondary)">' + statsText + '</p><p style="font-size:0.85em">Slot: ' + ei.slot + '</p><button class="action-btn" style="width:100%;margin-top:10px"' + (isEquipped ? ' disabled' : '') + '>' + (isEquipped ? 'Equipped' : 'Equip') + '</button>';
                if (!isEquipped) {
                    card.querySelector('.action-btn').addEventListener('click', () => {
                        const oldItem = adv.equip(ei);
                        g.inventory.removeItem(ei.instanceId);
                        if (oldItem) g.inventory.addItem(oldItem);
                        this.showNotification(adv.name + ' equipped ' + ei.name + '!', 'success');
                        this.closeModal();
                        this.renderAdventurers();
                        this.renderInventory();
                    });
                }
                list.appendChild(card);
            });
        }

        document.getElementById('modal-overlay').classList.remove('hidden');
    }

    showUseItemModal(item) {
        if (!item) return;
        const g = window.game.guild;
        const body = document.getElementById('modal-body');
        body.innerHTML = '<h3>Use ' + item.name + '</h3><p style="margin-bottom:20px;color:var(--text-secondary)">Select a target.</p><div class="card-list" id="use-list"></div>';
        const list = document.getElementById('use-list');
        g.adventurers.forEach(adv => {
            const card = this.createAdventurerCard(adv);
            const btn = document.createElement('button');
            btn.className = 'action-btn';
            btn.style.cssText = 'margin-top:10px;width:100%';
            btn.textContent = 'Use on ' + adv.name;
            btn.addEventListener('click', () => { const r = g.inventory.useItem(item.instanceId, adv); this.showNotification(r.message, r.success ? 'success' : 'error'); if (r.success) { this.closeModal(); this.selectedItem = null; this.renderItemDetails(null); this.renderInventory(); this.renderAdventurers(); } });
            card.appendChild(btn);
            list.appendChild(card);
        });
        document.getElementById('modal-overlay').classList.remove('hidden');
    }

    showNotification(message, type) {
        const container = document.getElementById('notifications');
        const n = document.createElement('div');
        n.className = 'notification ' + (type || 'info');
        n.textContent = message;
        container.appendChild(n);
        setTimeout(() => { n.style.opacity = '0'; setTimeout(() => n.remove(), 300); }, 3000);
    }

    closeModal() { document.getElementById('modal-overlay').classList.add('hidden'); }

    showEventModal(event) {
        const body = document.getElementById('modal-body');
        body.innerHTML = '<h3>' + event.name + '</h3><p style="margin:15px 0;color:var(--text-secondary)">' + event.description + '</p><p style="padding:10px;background:var(--bg-dark);border-radius:8px">' + event.message + '</p><button class="action-btn" style="margin-top:20px;width:100%" onclick="document.getElementById(\'modal-overlay\').classList.add(\'hidden\')">OK</button>';
        document.getElementById('modal-overlay').classList.remove('hidden');
    }
}
