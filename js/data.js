// ===== Game Data Constants =====

const RANKS = ['E', 'D', 'C', 'B', 'A', 'S'];

// Legacy reputation requirements (kept for backward compatibility)
const RANK_REQUIREMENTS = {
    E: 0,
    D: 100,
    C: 300,
    B: 600,
    A: 1000,
    S: 1500
};

// ===== Quest Board Refresh System =====
const REFRESH_COSTS = [100, 300, 500];
const MAX_REFRESHES_PER_DAY = 3;
const URGENT_QUEST_CHANCE = 0.3;

// ===== Urgent Quest Templates =====
const URGENT_QUEST_TEMPLATES = [
    // E-Rank Urgent
    { type: 'combat', name: 'Help Stuck Merchant Cart', description: 'A merchant\'s cart is stuck in the mud on the road. Lend your strength to free it before bandits arrive!', baseGold: 60, baseRep: 12, baseExp: 40, difficulty: 'E', recommendedTraits: ['melee_attack'], recommendedType: 'melee', partySize: 1, expiryDays: 1, repPenalty: 15, isUrgent: true },
    { type: 'exploration', name: 'Supplies Delivery', description: 'An urgent supply run to the village before nightfall. Speed is essential — lives depend on it!', baseGold: 55, baseRep: 10, baseExp: 35, difficulty: 'E', recommendedTraits: ['scouting', 'tracking'], recommendedType: 'ranged', partySize: 1, expiryDays: 1, repPenalty: 15, isUrgent: true },
    { type: 'crafting', name: 'Jumpstart Magic Device', description: 'An ancient magical device has activated and is causing chaos! Someone with arcane knowledge must shut it down.', baseGold: 50, baseRep: 10, baseExp: 35, difficulty: 'E', recommendedTraits: ['arcane_knowledge'], recommendedType: 'magic', partySize: 1, expiryDays: 1, repPenalty: 15, isUrgent: true },

    // D-Rank Urgent
    { type: 'combat', name: 'Break Up Bar Fight', description: 'A brawl has erupted at the tavern and it\'s getting out of hand. Restore order before someone gets hurt!', baseGold: 80, baseRep: 15, baseExp: 45, difficulty: 'D', recommendedTraits: ['melee_attack', 'taunt'], recommendedType: 'melee', partySize: 1, expiryDays: 1, repPenalty: 25, isUrgent: true },
    { type: 'exploration', name: 'Find Lost Child', description: 'A child has wandered into the woods and hasn\'t returned. Track them down quickly before nightfall!', baseGold: 70, baseRep: 12, baseExp: 40, difficulty: 'D', recommendedTraits: ['scouting', 'tracking'], recommendedType: 'ranged', partySize: 1, expiryDays: 1, repPenalty: 25, isUrgent: true },
    { type: 'social', name: 'Substitute Teacher', description: 'The guild master is needed to teach a class of young recruits. Keep them engaged and inspired!', baseGold: 65, baseRep: 10, baseExp: 35, difficulty: 'D', recommendedTraits: ['inspire', 'trade_network'], recommendedType: 'support', partySize: 1, expiryDays: 1, repPenalty: 25, isUrgent: true },

    // C-Rank Urgent
    { type: 'combat', name: 'Defend City Gate', description: 'A group of hostile creatures is approaching the city gate! Defend the entrance at all costs!', baseGold: 150, baseRep: 25, baseExp: 55, difficulty: 'C', recommendedTraits: ['melee_attack', 'shield_block'], recommendedType: 'melee', partySize: 2, expiryDays: 1, repPenalty: 40, isUrgent: true },
    { type: 'exploration', name: 'Chase the Thief', description: 'A thief has stolen valuable goods and is fleeing through the city! Catch them before they escape!', baseGold: 130, baseRep: 20, baseExp: 50, difficulty: 'C', recommendedTraits: ['stealth', 'scouting'], recommendedType: 'ranged', partySize: 1, expiryDays: 1, repPenalty: 35, isUrgent: true },

    // B-Rank Urgent
    { type: 'combat', name: 'Tavern on Fire', description: 'A fire has broken out at the tavern! Help people extinguish it and rescue those trapped inside!', baseGold: 250, baseRep: 40, baseExp: 65, difficulty: 'B', recommendedTraits: ['elemental_magic', 'shield_block'], recommendedType: 'magic', partySize: 2, expiryDays: 1, repPenalty: 60, isUrgent: true },
    { type: 'social', name: 'Help Poisoned Merchant', description: 'A merchant has been poisoned and needs immediate aid! Find a way to cure them before it\'s too late.', baseGold: 220, baseRep: 35, baseExp: 60, difficulty: 'B', recommendedTraits: ['diagnose'], recommendedType: 'support', partySize: 1, expiryDays: 1, repPenalty: 55, isUrgent: true },
    { type: 'combat', name: 'Hunt Horned Rabbit', description: 'A giant horned rabbit is terrorizing the farmlands! Track and defeat this elusive beast.', baseGold: 200, baseRep: 30, baseExp: 55, difficulty: 'B', recommendedTraits: ['ranged_attack', 'tracking'], recommendedType: 'ranged', partySize: 1, expiryDays: 1, repPenalty: 55, isUrgent: true },

    // A-Rank Urgent
    { type: 'social', name: 'King\'s Envoy', description: 'The king requires immediate diplomatic assistance. A party of diverse skills must respond to the royal summons!', baseGold: 400, baseRep: 60, baseExp: 80, difficulty: 'A', recommendedTraits: ['arcane_knowledge', 'trade_network', 'inspire'], recommendedType: 'support', partySize: 3, expiryDays: 1, repPenalty: 80, isUrgent: true },
    { type: 'combat', name: 'Ambush Bandit Ringleader', description: 'The bandit ringleader has been spotted! A precise strike team is needed to eliminate this threat.', baseGold: 450, baseRep: 70, baseExp: 85, difficulty: 'A', recommendedTraits: ['stealth', 'backstab', 'ranged_attack'], recommendedType: 'melee', partySize: 2, expiryDays: 1, repPenalty: 85, isUrgent: true }
];

// ===== Guild Rank-Up Prerequisite System =====
// Each rank requires: completed quests at previous rank + adventurer of target rank + reputation + rank-up quest + gold/materials
const GUILD_RANK_UP = {
    D: {
        completedQuestsAtPreviousRank: 20,
        adventurerOfRank: 'D',
        rankUpQuest: true,
        requiredReputation: 100,
        costs: { gold: 200, materials: 50 },
        unlocksFeature: 'blacksmith',
        unlocksLabel: 'Blacksmith'
    },
    C: {
        completedQuestsAtPreviousRank: 15,
        adventurerOfRank: 'C',
        rankUpQuest: true,
        requiredReputation: 300,
        costs: { gold: 500, materials: 150 },
        unlocksFeature: 'merchant',
        unlocksLabel: 'Merchant'
    },
    B: {
        completedQuestsAtPreviousRank: 12,
        adventurerOfRank: 'B',
        rankUpQuest: true,
        requiredReputation: 600,
        costs: { gold: 1000, materials: 300 },
        unlocksFeature: 'alchemist',
        unlocksLabel: 'Alchemist'
    },
    A: {
        completedQuestsAtPreviousRank: 10,
        adventurerOfRank: 'A',
        rankUpQuest: true,
        requiredReputation: 1000,
        costs: { gold: 2000, materials: 600 },
        unlocksFeature: 'drill_instructor',
        unlocksLabel: 'Drill Instructor'
    },
    S: {
        completedQuestsAtPreviousRank: 8,
        adventurerOfRank: 'S',
        rankUpQuest: true,
        requiredReputation: 1500,
        costs: { gold: 5000, materials: 1500 },
        unlocksFeature: 'ancient_forge',
        unlocksLabel: 'Ancient Forge'
    }
};

// ===== Class Progression Tree =====
// Each class has exactly 2 evolutions (except S-rank endpoints)
// Combatant: Combatant -> Knight/Swordsman -> Guardsman/Mercenary -> Bannerman/Marshall -> Shieldbearer/Captain -> Rook/Commander
// Scout:     Scout -> Archer/Rogue -> Ranger/Assassin -> Bowman/Stalker -> Longbowman/Shadow Stalker -> Sharpshooter/Reaper
// Academist: Academist -> Spellslinger/Medic -> Elemental Mage/Doctor -> Dual Elemental/Healer -> Magus/Enchanter -> Archmagus/Grand Enchanter

const CLASS_TREE = {
    // ===== E-RANK BASE CLASSES =====
    combatant: {
        name: 'Combatant',
        description: 'Melee fighter, the backbone of any party.',
        rank: 'E',
        type: 'melee',
        baseStats: { str: 12, agi: 8, int: 6, cha: 7, con: 10 },
        skills: ['melee_attack', 'heavy_armor'],
        evolutions: ['knight', 'swordsman']
    },
    scout: {
        name: 'Scout',
        description: 'Ranged fighter, skilled in reconnaissance.',
        rank: 'E',
        type: 'ranged',
        baseStats: { str: 8, agi: 12, int: 7, cha: 6, con: 8 },
        skills: ['ranged_attack', 'scouting'],
        evolutions: ['archer', 'rogue']
    },
    academist: {
        name: 'Academist',
        description: 'Magic user, harnesses arcane forces.',
        rank: 'E',
        type: 'magic',
        baseStats: { str: 5, agi: 7, int: 14, cha: 8, con: 6 },
        skills: ['magic_attack', 'arcane_knowledge'],
        evolutions: ['spellslinger', 'medic']
    },

    // ===== D-RANK CLASSES =====
    // Combatant D-Rank
    knight: {
        name: 'Knight',
        description: 'CON-focused tank with heavy armor and shield.',
        rank: 'D',
        type: 'melee',
        baseStats: { str: 11, agi: 7, int: 6, cha: 8, con: 14 },
        skills: ['shield_block', 'taunt', 'heavy_armor'],
        evolutions: ['guardsman', 'bannerman'],
        prerequisites: { class: 'combatant' }
    },
    swordsman: {
        name: 'Swordsman',
        description: 'STR-focused damage dealer with 2-handed sword.',
        rank: 'D',
        type: 'melee',
        baseStats: { str: 15, agi: 9, int: 5, cha: 6, con: 9 },
        skills: ['great_weapon', 'cleave', 'melee_attack'],
        evolutions: ['mercenary', 'marshall'],
        prerequisites: { class: 'combatant' }
    },
    // Scout D-Rank
    archer: {
        name: 'Archer',
        description: 'Ranged specialist with constant DPS.',
        rank: 'D',
        type: 'ranged',
        baseStats: { str: 8, agi: 14, int: 7, cha: 6, con: 8 },
        skills: ['bow_mastery', 'rapid_fire', 'ranged_attack'],
        evolutions: ['ranger', 'assassin'],
        prerequisites: { class: 'scout' }
    },
    rogue: {
        name: 'Rogue',
        description: 'Stealthy fighter with high burst damage.',
        rank: 'D',
        type: 'melee',
        baseStats: { str: 10, agi: 14, int: 7, cha: 7, con: 8 },
        skills: ['stealth', 'dagger_mastery', 'pick_lock'],
        evolutions: ['assassin', 'ranger'],
        prerequisites: { class: 'scout' }
    },
    // Academist D-Rank
    spellslinger: {
        name: 'Spellslinger',
        description: 'Fast-casting offensive mage.',
        rank: 'D',
        type: 'magic',
        baseStats: { str: 5, agi: 8, int: 15, cha: 8, con: 7 },
        skills: ['quick_cast', 'fire_magic', 'magic_attack'],
        evolutions: ['elemental_mage', 'dual_elemental'],
        prerequisites: { class: 'academist' }
    },
    medic: {
        name: 'Medic',
        description: 'Support magic user focused on restoration.',
        rank: 'D',
        type: 'magic',
        baseStats: { str: 5, agi: 6, int: 13, cha: 12, con: 8 },
        skills: ['healing_magic', 'buff', 'purify'],
        evolutions: ['doctor', 'healer'],
        prerequisites: { class: 'academist' }
    },

    // ===== C-RANK CLASSES =====
    // Combatant C-Rank
    guardsman: {
        name: 'Guardsman',
        description: 'Defensive specialist, protects the party.',
        rank: 'C',
        type: 'melee',
        baseStats: { str: 12, agi: 7, int: 6, cha: 9, con: 16 },
        skills: ['fortify', 'shield_wall', 'protect_ally'],
        evolutions: ['bannerman', 'shieldbearer'],
        prerequisites: { class: 'knight' }
    },
    mercenary: {
        name: 'Mercenary',
        description: 'Versatile fighter for hire with broad skills.',
        rank: 'C',
        type: 'melee',
        baseStats: { str: 14, agi: 10, int: 7, cha: 7, con: 12 },
        skills: ['versatile_strike', 'adaptable', 'trade_skills'],
        evolutions: ['marshall', 'captain'],
        prerequisites: { class: 'swordsman' }
    },
    // Scout C-Rank
    ranger: {
        name: 'Ranger',
        description: 'Versatile woodsman with survival skills.',
        rank: 'C',
        type: 'ranged',
        baseStats: { str: 10, agi: 14, int: 8, cha: 7, con: 10 },
        skills: ['tracking', 'survival', 'bow_mastery'],
        evolutions: ['bowman', 'longbowman'],
        prerequisites: { class: 'archer' }
    },
    assassin: {
        name: 'Assassin',
        description: 'Lethal killer with poison and stealth.',
        rank: 'C',
        type: 'melee',
        baseStats: { str: 12, agi: 15, int: 8, cha: 6, con: 8 },
        skills: ['backstab', 'poison_blade', 'shadow_step'],
        evolutions: ['stalker', 'shadow_stalker'],
        prerequisites: { class: 'rogue' }
    },
    // Academist C-Rank
    elemental_mage: {
        name: 'Elemental Mage',
        description: 'Specialist in offensive elemental magic.',
        rank: 'C',
        type: 'magic',
        baseStats: { str: 5, agi: 7, int: 16, cha: 8, con: 7 },
        skills: ['elemental_magic', 'aoe_attack', 'magic_attack'],
        evolutions: ['dual_elemental', 'magus'],
        prerequisites: { class: 'spellslinger' }
    },
    doctor: {
        name: 'Doctor',
        description: 'Advanced healer with medical expertise.',
        rank: 'C',
        type: 'magic',
        baseStats: { str: 5, agi: 7, int: 15, cha: 11, con: 9 },
        skills: ['diagnose', 'treatment', 'surgery'],
        evolutions: ['healer', 'enchanter'],
        prerequisites: { class: 'medic' }
    },

    // ===== B-RANK CLASSES =====
    // Combatant B-Rank
    bannerman: {
        name: 'Bannerman',
        description: 'Standard-bearer who bolsters allied morale.',
        rank: 'B',
        type: 'melee',
        baseStats: { str: 13, agi: 8, int: 7, cha: 12, con: 15 },
        skills: ['war_banner', 'rally_cry', 'inspire'],
        evolutions: ['shieldbearer', 'captain'],
        prerequisites: { class: 'guardsman' }
    },
    marshall: {
        name: 'Marshall',
        description: 'Battle commander who coordinates the party.',
        rank: 'B',
        type: 'melee',
        baseStats: { str: 14, agi: 10, int: 9, cha: 13, con: 12 },
        skills: ['war_cry', 'rally', 'tactical_strike'],
        evolutions: ['captain', 'shieldbearer'],
        prerequisites: { class: 'mercenary' }
    },
    // Scout B-Rank
    bowman: {
        name: 'Bowman',
        description: 'Expert marksman with precision shots.',
        rank: 'B',
        type: 'ranged',
        baseStats: { str: 9, agi: 16, int: 8, cha: 6, con: 9 },
        skills: ['precise_shot', 'piercing_arrow', 'rapid_fire'],
        evolutions: ['longbowman', 'shadow_stalker'],
        prerequisites: { class: 'ranger' }
    },
    stalker: {
        name: 'Stalker',
        description: 'Patient hunter who strikes from the shadows.',
        rank: 'B',
        type: 'melee',
        baseStats: { str: 12, agi: 16, int: 9, cha: 6, con: 8 },
        skills: ['stealth_mastery', 'ambush', 'poison_expert'],
        evolutions: ['shadow_stalker', 'longbowman'],
        prerequisites: { class: 'assassin' }
    },
    // Academist B-Rank
    dual_elemental: {
        name: 'Dual Elemental',
        description: 'Master of two magical elements.',
        rank: 'B',
        type: 'magic',
        baseStats: { str: 5, agi: 8, int: 17, cha: 9, con: 8 },
        skills: ['dual_cast', 'elemental_fusion', 'magic_burst'],
        evolutions: ['magus', 'enchanter'],
        prerequisites: { class: 'elemental_mage' }
    },
    healer: {
        name: 'Healer',
        description: 'Dedicated restoration specialist.',
        rank: 'B',
        type: 'magic',
        baseStats: { str: 5, agi: 7, int: 14, cha: 14, con: 9 },
        skills: ['group_heal', 'regeneration', 'divine_magic'],
        evolutions: ['enchanter', 'magus'],
        prerequisites: { class: 'doctor' }
    },

    // ===== A-RANK CLASSES =====
    // Combatant A-Rank
    shieldbearer: {
        name: 'Shieldbearer',
        description: 'Ultimate defensive tank, nearly unbreakable.',
        rank: 'A',
        type: 'melee',
        baseStats: { str: 14, agi: 7, int: 7, cha: 10, con: 18 },
        skills: ['impenetrable', 'counter_stance', 'ally_shield'],
        evolutions: ['rook', 'commander'],
        prerequisites: { class: 'bannerman' }
    },
    captain: {
        name: 'Captain',
        description: 'Party leader who commands respect.',
        rank: 'A',
        type: 'melee',
        baseStats: { str: 15, agi: 11, int: 10, cha: 14, con: 12 },
        skills: ['battle_command', 'inspire', 'tactical_mastery'],
        evolutions: ['commander', 'rook'],
        prerequisites: { class: 'marshall' }
    },
    // Scout A-Rank
    longbowman: {
        name: 'Longbowman',
        description: 'Extreme range sniper with devastating shots.',
        rank: 'A',
        type: 'ranged',
        baseStats: { str: 10, agi: 18, int: 9, cha: 6, con: 10 },
        skills: ['snipe', 'arrow_rain', 'headshot'],
        evolutions: ['sharpshooter', 'reaper'],
        prerequisites: { class: 'bowman' }
    },
    shadow_stalker: {
        name: 'Shadow Stalker',
        description: 'Master of stealth and assassination.',
        rank: 'A',
        type: 'melee',
        baseStats: { str: 13, agi: 18, int: 10, cha: 7, con: 9 },
        skills: ['shadow_step', 'execute', 'vanish'],
        evolutions: ['reaper', 'sharpshooter'],
        prerequisites: { class: 'stalker' }
    },
    // Academist A-Rank
    magus: {
        name: 'Magus',
        description: 'Arcane scholar with supreme magical power.',
        rank: 'A',
        type: 'magic',
        baseStats: { str: 6, agi: 9, int: 20, cha: 10, con: 9 },
        skills: ['arcane_mastery', 'reality_warp', 'metamagic'],
        evolutions: ['archmagus', 'grand_enchanter'],
        prerequisites: { class: 'dual_elemental' }
    },
    enchanter: {
        name: 'Enchanter',
        description: 'Support specialist with powerful buffs.',
        rank: 'A',
        type: 'magic',
        baseStats: { str: 5, agi: 7, int: 16, cha: 16, con: 9 },
        skills: ['enchant_weapon', 'barrier', 'time_magic'],
        evolutions: ['grand_enchanter', 'archmagus'],
        prerequisites: { class: 'healer' }
    },

    // ===== S-RANK CLASSES =====
    // Combatant S-Rank
    rook: {
        name: 'Rook',
        description: 'Fortified defender, immovable as a castle tower.',
        rank: 'S',
        type: 'melee',
        baseStats: { str: 15, agi: 8, int: 8, cha: 11, con: 20 },
        skills: ['fortress', 'absolute_defense', 'unbreakable'],
        evolutions: [],
        prerequisites: { class: 'shieldbearer' }
    },
    commander: {
        name: 'Commander',
        description: 'Supreme battlefield leader, inspires legends.',
        rank: 'S',
        type: 'melee',
        baseStats: { str: 16, agi: 12, int: 11, cha: 16, con: 13 },
        skills: ['legendary_command', 'war_master', 'rally_supreme'],
        evolutions: [],
        prerequisites: { class: 'captain' }
    },
    // Scout S-Rank
    sharpshooter: {
        name: 'Sharpshooter',
        description: 'Legendary marksman, never misses.',
        rank: 'S',
        type: 'ranged',
        baseStats: { str: 11, agi: 22, int: 10, cha: 7, con: 10 },
        skills: ['perfect_aim', 'piercing_shot', 'dead_eye'],
        evolutions: [],
        prerequisites: { class: 'longbowman' }
    },
    reaper: {
        name: 'Reaper',
        description: 'Lethal assassin who harvests souls.',
        rank: 'S',
        type: 'melee',
        baseStats: { str: 14, agi: 20, int: 12, cha: 8, con: 10 },
        skills: ['soul_reap', 'death_mark', 'shadow_dance'],
        evolutions: [],
        prerequisites: { class: 'shadow_stalker' }
    },
    // Academist S-Rank
    archmagus: {
        name: 'Archmagus',
        description: 'Greatest magical authority, commands reality itself.',
        rank: 'S',
        type: 'magic',
        baseStats: { str: 8, agi: 10, int: 25, cha: 12, con: 10 },
        skills: ['absolute_magic', 'time_stop', 'dimensional_rift'],
        evolutions: [],
        prerequisites: { class: 'magus' }
    },
    grand_enchanter: {
        name: 'Grand Enchanter',
        description: 'Master of all enchantment arts, reality bends to their will.',
        rank: 'S',
        type: 'magic',
        baseStats: { str: 7, agi: 9, int: 18, cha: 20, con: 10 },
        skills: ['grand_enchantment', 'reality_shift', 'arcane_apotheosis'],
        evolutions: [],
        prerequisites: { class: 'enchanter' }
    },

    // ===== SPECIAL ROLES =====
    porter: {
        name: 'Porter',
        description: 'Increases item collection during quests.',
        rank: 'E',
        type: 'support',
        baseStats: { str: 10, agi: 8, int: 6, cha: 10, con: 12 },
        skills: ['extra_carry', 'loot_bonus', 'trade'],
        evolutions: [],
        isSpecial: true
    },
    beast_tamer: {
        name: 'Beast Tamer',
        description: 'Tames beasts to fight or assist in quests.',
        rank: 'D',
        type: 'support',
        baseStats: { str: 9, agi: 10, int: 8, cha: 14, con: 10 },
        skills: ['tame_beast', 'beast_strike', 'animal_empathy'],
        evolutions: [],
        isSpecial: true
    },
    smith: {
        name: 'Smith',
        description: 'Crafts and repairs equipment.',
        rank: 'D',
        type: 'crafting',
        baseStats: { str: 14, agi: 7, int: 8, cha: 6, con: 12 },
        skills: ['forge_weapon', 'repair', 'enhance'],
        evolutions: [],
        isSpecial: true
    },
    merchant: {
        name: 'Merchant',
        description: 'Buys and sells items at better prices.',
        rank: 'D',
        type: 'crafting',
        baseStats: { str: 6, agi: 8, int: 10, cha: 16, con: 8 },
        skills: ['haggle', 'appraise', 'trade_network'],
        evolutions: [],
        isSpecial: true
    },
    alchemist: {
        name: 'Alchemist',
        description: 'Creates potions and magical items.',
        rank: 'D',
        type: 'crafting',
        baseStats: { str: 6, agi: 8, int: 15, cha: 8, con: 8 },
        skills: ['brew_potion', 'transmute', 'experiment'],
        evolutions: [],
        isSpecial: true
    }
};

// Simplified class lookup for backward compatibility
const ADVENTURER_CLASSES = {};
for (const [key, data] of Object.entries(CLASS_TREE)) {
    ADVENTURER_CLASSES[key] = data;
}

const QUEST_TYPES = {
    combat: {
        name: 'Combat',
        icon: '⚔️',
        primaryStat: 'str',
        secondaryStat: 'agi'
    },
    exploration: {
        name: 'Exploration',
        icon: '🗺️',
        primaryStat: 'agi',
        secondaryStat: 'int'
    },
    investigation: {
        name: 'Investigation',
        icon: '🔍',
        primaryStat: 'int',
        secondaryStat: 'cha'
    },
    social: {
        name: 'Social',
        icon: '🎭',
        primaryStat: 'cha',
        secondaryStat: 'int'
    },
    crafting: {
        name: 'Crafting',
        icon: '⚒️',
        primaryStat: 'int',
        secondaryStat: 'str'
    }
};

const QUEST_DIFFICULTIES = {
    E: { multiplier: 0.8, minRank: 'E', name: 'E', staminaCost: 10, expMultiplier: 1, partySize: 1 },
    D: { multiplier: 1.0, minRank: 'D', name: 'D', staminaCost: 15, expMultiplier: 1.2, partySize: 1 },
    C: { multiplier: 1.5, minRank: 'C', name: 'C', staminaCost: 25, expMultiplier: 1.5, partySize: 1 },
    B: { multiplier: 2.0, minRank: 'B', name: 'B', staminaCost: 35, expMultiplier: 2, partySize: 2 },
    A: { multiplier: 3.0, minRank: 'A', name: 'A', staminaCost: 50, expMultiplier: 3, partySize: 3 },
    S: { multiplier: 4.0, minRank: 'S', name: 'S', staminaCost: 70, expMultiplier: 4, partySize: 3 }
};

const GUILD_HALL_STAGES = [
    {
        rank: 'E',
        name: 'Tattered Guild Hall',
        description: 'A run-down building that barely stands. The roof leaks, the walls are crumbling, but it has a certain charm.',
        ascii: `
    ___________
   /           \\
  /  _______    \\
 |  |  _  |     |
 |  | |_| |     |
 |__|_____|_____|
 |   |     |    |
 |___|_____|____|`,
        upgrades: [
            { id: 'roof_repair', name: 'Repair Roof', cost: { gold: 50, materials: 30 }, reputationGain: 10 },
            { id: 'wall_fix', name: 'Fix Walls', cost: { gold: 75, materials: 40 }, reputationGain: 15 }
        ]
    },
    {
        rank: 'D',
        name: 'Modest Guild Hall',
        description: 'A functional building that provides shelter and basic amenities. Adventurers can rest here between quests.',
        ascii: `
    ___________
   /|\\       /|\\
  / | \\_____/ | \\
 /  |  _____  |  \\
|   | |  _  | |   |
|   | | |_| | |   |
|___|_|_____|_|___|`,
        upgrades: [
            { id: 'training_room', name: 'Training Room', cost: { gold: 150, materials: 80 }, reputationGain: 25, effect: 'training' },
            { id: 'bedroom', name: 'Add Bedrooms', cost: { gold: 120, materials: 60 }, reputationGain: 20, effect: 'rest_bonus' }
        ]
    },
    {
        rank: 'C',
        name: 'Renovated Guild Hall',
        description: 'A well-maintained building with proper facilities. The guild is gaining recognition in the region.',
        ascii: `
    ___________
   /|\\       /|\\
  / | \\_____/ | \\
 /  |  _____  |  \\
|   | |  _  | |   |
|   | | |_| | |   |
|___|_|_____|_|___|
|     |       |   |
|_____|_______|___|`,
        upgrades: [
            { id: 'workshop', name: 'Crafting Workshop', cost: { gold: 300, materials: 150 }, reputationGain: 40, effect: 'crafting' },
            { id: 'library', name: 'Research Library', cost: { gold: 250, materials: 120 }, reputationGain: 35, effect: 'learning' }
        ]
    },
    {
        rank: 'B',
        name: 'Grand Guild Hall',
        description: 'An impressive headquarters befitting a respected guild. Many adventurers aspire to join.',
        ascii: `
        ___________
       /|\\       /|\\
      / | \\_____/ | \\
     /  |  _____  |  \\
    |   | |  _  | |   |
    |   | | |_| | |   |
    |___|_|_____|_|___|
    |     |       |   |
    |_____|_______|___|
   /                   \\
  /_____________________\\`,
        upgrades: [
            { id: 'armory', name: 'Guild Armory', cost: { gold: 500, materials: 250 }, reputationGain: 60, effect: 'equipment' },
            { id: 'arena', name: 'Battle Arena', cost: { gold: 600, materials: 300 }, reputationGain: 70, effect: 'training' }
        ]
    },
    {
        rank: 'A',
        name: 'Legendary Guild Hall',
        description: 'A fortress of adventure and commerce. The guild is known throughout the land.',
        ascii: `
           ___________
          /|\\       /|\\
         / | \\_____/ | \\
        /  |  _____  |  \\
       |   | |  _  | |   |
       |   | | |_| | |   |
       |___|_|_____|_|___|
       |     |       |   |
       |_____|_______|___|
      /                   \\
     /                     \\
    |   ___________________  |
    |  |                   | |
    |__|___________________|_|`,
        upgrades: [
            { id: 'portal', name: 'Teleportation Circle', cost: { gold: 1000, materials: 500 }, reputationGain: 100, effect: 'travel' },
            { id: 'treasury', name: 'Secure Treasury', cost: { gold: 800, materials: 400 }, reputationGain: 80, effect: 'storage' }
        ]
    },
    {
        rank: 'S',
        name: 'Mythic Guild Citadel',
        description: 'The pinnacle of guild halls. A majestic citadel that stands as a beacon of hope for all adventurers.',
        ascii: `
              ___________
             /|\\       /|\\
            / | \\_____/ | \\
           /  |  _____  |  \\
          |   | |  _  | |   |
          |   | | |_| | |   |
          |___|_|_____|_|___|
          |     |       |   |
          |_____|_______|___|
         /                   \\
        /                     \\
       |   ___________________  |
       |  |                   | |
       |__|___________________|_|
      |                         |
      |_________________________|`,
        upgrades: []
    }
];

const SAMPLE_NAMES = [
    'Aldric', 'Brenna', 'Cedric', 'Daria', 'Edric', 'Fiona', 'Gareth', 'Helena',
    'Ivan', 'Jenna', 'Kael', 'Lyra', 'Marcus', 'Nadia', 'Oscar', 'Petra',
    'Quinn', 'Raven', 'Silas', 'Tara', 'Ulric', 'Vera', 'Walter', 'Xena',
    'Yuri', 'Zara', 'Asher', 'Brynn', 'Damon', 'Elara', 'Finn', 'Gwen',
    'Theron', 'Mira', 'Roland', 'Isolde', 'Garrick', 'Elysia', 'Bram', 'Lyanna'
];

const QUEST_TEMPLATES = [
    // Combat Quests
    { type: 'combat', name: 'Goblin Patrol', description: 'Clear out goblins terrorizing a nearby village.', baseGold: 30, baseRep: 5, baseExp: 30, difficulty: 'E', recommendedTraits: ['melee_attack', 'heavy_armor'], recommendedType: 'melee' },
    { type: 'combat', name: 'Wolf Pack', description: 'A pack of wolves has been attacking travelers on the main road.', baseGold: 45, baseRep: 8, baseExp: 30, difficulty: 'E', recommendedTraits: ['melee_attack', 'ranged_attack'], recommendedType: 'melee' },
    { type: 'combat', name: 'Bandit Camp', description: 'Locate and dismantle a bandit camp in the northern forests.', baseGold: 80, baseRep: 15, baseExp: 40, difficulty: 'D', recommendedTraits: ['stealth', 'melee_attack'], recommendedType: 'melee' },
    { type: 'combat', name: 'Ogre Trouble', description: 'An ogre has claimed a cave near the trade route. Deal with it.', baseGold: 120, baseRep: 25, baseExp: 50, difficulty: 'C', recommendedTraits: ['heavy_armor', 'shield_block'], recommendedType: 'melee' },
    { type: 'combat', name: 'Dragon Sighting', description: 'A young dragon has been spotted in the mountains. Investigate and eliminate if necessary.', baseGold: 300, baseRep: 60, baseExp: 70, difficulty: 'A', recommendedTraits: ['elemental_magic', 'great_weapon'], recommendedType: 'melee' },
    { type: 'combat', name: 'Demon Lord', description: 'An ancient demon has awakened. Only the strongest can face this threat.', baseGold: 500, baseRep: 100, baseExp: 80, difficulty: 'S', recommendedTraits: ['arcane_mastery', 'battle_command'], recommendedType: 'magic' },

    // Exploration Quests
    { type: 'exploration', name: 'Map the Wilderness', description: 'Create a detailed map of the uncharted eastern forests.', baseGold: 40, baseRep: 8, baseExp: 30, difficulty: 'E', recommendedTraits: ['scouting', 'tracking'], recommendedType: 'ranged' },
    { type: 'exploration', name: 'Ruins Discovery', description: 'Explore the ancient ruins discovered near the river.', baseGold: 70, baseRep: 12, baseExp: 40, difficulty: 'D', recommendedTraits: ['arcane_knowledge', 'scouting'], recommendedType: 'ranged' },
    { type: 'exploration', name: 'Cave Network', description: 'Map the extensive cave network beneath the mountains.', baseGold: 150, baseRep: 30, baseExp: 50, difficulty: 'C', recommendedTraits: ['survival', 'tracking'], recommendedType: 'ranged' },
    { type: 'exploration', name: 'Lost Temple', description: 'Find the legendary temple said to hold ancient artifacts.', baseGold: 250, baseRep: 50, baseExp: 60, difficulty: 'B', recommendedTraits: ['arcane_knowledge', 'elemental_magic'], recommendedType: 'magic' },

    // Investigation Quests
    { type: 'investigation', name: 'Missing Merchants', description: 'Three merchants have disappeared on the trade road. Find out why.', baseGold: 60, baseRep: 10, baseExp: 40, difficulty: 'D', recommendedTraits: ['scouting', 'haggle'], recommendedType: 'magic' },
    { type: 'investigation', name: 'Thief Ring', description: 'An organized theft ring is operating in the city. Infiltrate and expose them.', baseGold: 100, baseRep: 20, baseExp: 50, difficulty: 'C', recommendedTraits: ['stealth', 'backstab'], recommendedType: 'melee' },
    { type: 'investigation', name: 'Noble Secrets', description: 'A noble hires you discreetly. Investigate whispers of a conspiracy.', baseGold: 180, baseRep: 35, baseExp: 60, difficulty: 'B', recommendedTraits: ['arcane_knowledge', 'diagnose'], recommendedType: 'magic' },
    { type: 'investigation', name: 'Spy Network', description: 'Uncover a foreign spy network operating within the kingdom.', baseGold: 350, baseRep: 70, baseExp: 70, difficulty: 'A', recommendedTraits: ['stealth', 'shadow_step'], recommendedType: 'melee' },

    // Social Quests
    { type: 'social', name: 'Diplomatic Mission', description: 'Negotiate a trade agreement with a neighboring settlement.', baseGold: 50, baseRep: 10, baseExp: 40, difficulty: 'D', recommendedTraits: ['haggle', 'trade_network'], recommendedType: 'support' },
    { type: 'social', name: 'Festival Security', description: 'Provide security and manage crowds during the annual harvest festival.', baseGold: 40, baseRep: 8, baseExp: 30, difficulty: 'E', recommendedTraits: ['taunt', 'shield_block'], recommendedType: 'melee' },
    { type: 'social', name: 'Noble Reception', description: 'Attend a high-society gathering and gather information.', baseGold: 120, baseRep: 25, baseExp: 50, difficulty: 'C', recommendedTraits: ['trade_network', 'appraise'], recommendedType: 'support' },
    { type: 'social', name: 'Royal Audience', description: 'Present the guild before the king and secure a royal charter.', baseGold: 400, baseRep: 80, baseExp: 80, difficulty: 'S', recommendedTraits: ['battle_command', 'inspire'], recommendedType: 'melee' },

    // Crafting Quests
    { type: 'crafting', name: 'Tool Repair', description: 'The village needs new farming tools crafted.', baseGold: 35, baseRep: 6, baseExp: 30, difficulty: 'E', recommendedTraits: ['forge_weapon', 'repair'], recommendedType: 'crafting' },
    { type: 'crafting', name: 'Enchant Weapons', description: 'Enchant weapons for the town guard.', baseGold: 100, baseRep: 18, baseExp: 50, difficulty: 'C', recommendedTraits: ['enchant_weapon', 'elemental_magic'], recommendedType: 'magic' },
    { type: 'crafting', name: 'Magical Artifacts', description: 'Craft powerful magical artifacts for a wizard\'s collection.', baseGold: 250, baseRep: 50, baseExp: 60, difficulty: 'B', recommendedTraits: ['arcane_mastery', 'enchant_weapon'], recommendedType: 'magic' },
    { type: 'crafting', name: 'Legendary Forging', description: 'Forge a legendary weapon said to slay dragons.', baseGold: 600, baseRep: 120, baseExp: 80, difficulty: 'S', recommendedTraits: ['forge_weapon', 'elemental_fusion'], recommendedType: 'crafting' }
];

const SHOP_ITEMS = [
    // Consumables
    { id: 'health_potion', name: 'Health Potion', icon: '🧪', type: 'consumable', cost: 25, effect: { heal: 50 } },
    { id: 'mana_potion', name: 'Mana Potion', icon: '💧', type: 'consumable', cost: 30, effect: { mana: 40 } },
    { id: 'stamina_elixir', name: 'Stamina Elixir', icon: '⚡', type: 'consumable', cost: 35, effect: { fatigue: -30 } },
    { id: 'strength_scroll', name: 'Strength Scroll', icon: '📜', type: 'consumable', cost: 50, effect: { tempStr: 5 } },
    { id: 'agi_scroll', name: 'Agility Scroll', icon: '📜', type: 'consumable', cost: 50, effect: { tempAgi: 5 } },
    { id: 'int_scroll', name: 'Intelligence Scroll', icon: '📜', type: 'consumable', cost: 50, effect: { tempInt: 5 } },

    // Equipment - Weapons
    { id: 'iron_sword', name: 'Iron Sword', icon: '⚔️', type: 'equipment', cost: 80, slot: 'weapon', stats: { str: 3 }, reqClass: 'melee' },
    { id: 'steel_sword', name: 'Steel Sword', icon: '⚔️', type: 'equipment', cost: 180, slot: 'weapon', stats: { str: 6 }, reqClass: 'melee' },
    { id: 'long_bow', name: 'Long Bow', icon: '🏹', type: 'equipment', cost: 90, slot: 'weapon', stats: { agi: 4 }, reqClass: 'ranged' },
    { id: 'magic_staff', name: 'Magic Staff', icon: '🪄', type: 'equipment', cost: 120, slot: 'weapon', stats: { int: 5 }, reqClass: 'magic' },
    { id: 'dagger', name: 'Shadow Dagger', icon: '🗡️', type: 'equipment', cost: 100, slot: 'weapon', stats: { agi: 5, str: 2 }, reqClass: 'melee' },

    // Equipment - Armor
    { id: 'leather_armor', name: 'Leather Armor', icon: '🛡️', type: 'equipment', cost: 100, slot: 'armor', stats: { agi: 2, con: 2 } },
    { id: 'chain_mail', name: 'Chain Mail', icon: '🛡️', type: 'equipment', cost: 200, slot: 'armor', stats: { con: 5, str: 1 } },
    { id: 'plate_armor', name: 'Plate Armor', icon: '🛡️', type: 'equipment', cost: 400, slot: 'armor', stats: { con: 8, agi: -2 } },
    { id: 'mage_robe', name: 'Mage Robe', icon: '👘', type: 'equipment', cost: 150, slot: 'armor', stats: { int: 4, cha: 2 } },
    { id: 'shadow_cloak', name: 'Shadow Cloak', icon: '🧥', type: 'equipment', cost: 180, slot: 'armor', stats: { agi: 4, int: 1 } },

    // Equipment - Accessories
    { id: 'ring_strength', name: 'Ring of Strength', icon: '💍', type: 'equipment', cost: 200, slot: 'accessory', stats: { str: 3 } },
    { id: 'ring_agility', name: 'Ring of Agility', icon: '💍', type: 'equipment', cost: 200, slot: 'accessory', stats: { agi: 3 } },
    { id: 'amulet_wisdom', name: 'Amulet of Wisdom', icon: '📿', type: 'equipment', cost: 250, slot: 'accessory', stats: { int: 4 } },
    { id: 'amulet_charisma', name: 'Amulet of Charisma', icon: '📿', type: 'equipment', cost: 250, slot: 'accessory', stats: { cha: 4 } },

    // Materials
    { id: 'healing_herb', name: 'Healing Herb', icon: '🌿', type: 'material', cost: 15 },
    { id: 'iron_ore', name: 'Iron Ore', icon: '⛏️', type: 'material', cost: 20 },
    { id: 'crystal_shard', name: 'Crystal Shard', icon: '💎', type: 'material', cost: 50 },
    { id: 'magic_essence', name: 'Magic Essence', icon: '✨', type: 'material', cost: 75 },
    { id: 'dragon_scale', name: 'Dragon Scale', icon: '🐉', type: 'material', cost: 200 },
    { id: 'metal_scrap', name: 'Metal Scrap', icon: '🔩', type: 'material', cost: 10 },
    { id: 'fiber', name: 'Plant Fiber', icon: '🌾', type: 'material', cost: 8 },
    { id: 'sticks', name: 'Wooden Sticks', icon: '🪵', type: 'material', cost: 5 }
];

const RECRUIT_COST = 50;

const RANK_NAMES = {
    E: 'Novice',
    D: 'Apprentice',
    C: 'Journeyman',
    B: 'Expert',
    A: 'Master',
    S: 'Legendary'
};

// Evolution requirements - EXP needed to promote to next rank
const EVOLUTION_REQUIREMENTS = {
    D: { exp: 100 },
    C: { exp: 150 },
    B: { exp: 250 },
    A: { exp: 400 },
    S: { exp: 600 }
};

// ===== Rank-Up Promotion Quests =====
const RANK_UP_QUESTS = {
    D: {
        type: 'combat',
        name: 'Fire Up the Forge',
        description: 'The guild has been granted a chance to promote to D-rank, but the local Blacksmith needs his heirloom hammer back. A band of thieves has stolen it and is hiding in the old mines. Assemble a party and clear them out!',
        baseGold: 200,
        baseRep: 50,
        baseExp: 150,
        difficulty: 'D',
        recommendedTraits: ['melee_attack', 'shield_block'],
        recommendedType: 'melee',
        partySize: 3,
        isRankUpQuest: true,
        targetRank: 'D'
    },
    C: {
        type: 'exploration',
        name: 'Map the Trade Route',
        description: 'To prove the guild deserves C-rank, map the dangerous new trade route through the Whispering Woods. Strange creatures have been spotted - bring a capable party.',
        baseGold: 400,
        baseRep: 80,
        baseExp: 250,
        difficulty: 'C',
        recommendedTraits: ['tracking', 'survival', 'scouting'],
        recommendedType: 'ranged',
        partySize: 3,
        isRankUpQuest: true,
        targetRank: 'C'
    },
    B: {
        type: 'investigation',
        name: 'The Merchant Conspiracy',
        description: 'A high-ranking merchant guild suspects a conspiracy within their ranks. Infiltrate their gala and uncover the truth. Failure is not an option.',
        baseGold: 800,
        baseRep: 150,
        baseExp: 400,
        difficulty: 'B',
        recommendedTraits: ['stealth', 'arcane_knowledge', 'haggle'],
        recommendedType: 'magic',
        partySize: 3,
        isRankUpQuest: true,
        targetRank: 'B'
    },
    A: {
        type: 'combat',
        name: 'Dragon\'s Gate',
        description: 'The legendary Dragon\'s Gate pass is under siege by a dragon cult. Only by defeating their champion can the guild earn A-rank status.',
        baseGold: 1500,
        baseRep: 250,
        baseExp: 600,
        difficulty: 'A',
        recommendedTraits: ['great_weapon', 'elemental_magic', 'battle_command'],
        recommendedType: 'melee',
        partySize: 3,
        isRankUpQuest: true,
        targetRank: 'A'
    },
    S: {
        type: 'combat',
        name: 'The Void Incursion',
        description: 'A rift has opened in the ancient catacombs, pouring forth creatures of shadow. Seal the rift and defeat the Void Commander to earn legendary S-rank.',
        baseGold: 3000,
        baseRep: 500,
        baseExp: 1000,
        difficulty: 'S',
        recommendedTraits: ['arcane_mastery', 'absolute_defense', 'shadow_step'],
        recommendedType: 'magic',
        partySize: 3,
        isRankUpQuest: true,
        targetRank: 'S'
    }
};

// ===== Crafting Recipes =====
const CRAFTING_RECIPES = [
    // === E-Rank Recipes ===
    // Combatant E-Rank
    { id: 'craft_wooden_sword', name: 'Wooden Sword', icon: '🗡️', resultItem: 'iron_sword', slot: 'weapon',
      materials: [{ id: 'sticks', quantity: 3 }, { id: 'fiber', quantity: 2 }], goldCost: 15, requiredFeature: 'blacksmith',
      overrides: { name: 'Wooden Sword', stats: { str: 2 } } },
    { id: 'craft_wooden_shield', name: 'Wooden Shield', icon: '🛡️', resultItem: 'leather_armor', slot: 'armor',
      materials: [{ id: 'sticks', quantity: 4 }, { id: 'fiber', quantity: 2 }], goldCost: 20, requiredFeature: 'blacksmith',
      overrides: { name: 'Wooden Shield', stats: { con: 2 } } },
    { id: 'craft_leather_vest', name: 'Leather Vest', icon: '🛡️', resultItem: 'leather_armor', slot: 'armor',
      materials: [{ id: 'fiber', quantity: 3 }, { id: 'healing_herb', quantity: 2 }], goldCost: 20, requiredFeature: 'blacksmith',
      overrides: { name: 'Leather Vest', stats: { con: 1, agi: 1 } } },
    // Scout E-Rank
    { id: 'craft_simple_bow', name: 'Simple Bow', icon: '🏹', resultItem: 'long_bow', slot: 'weapon',
      materials: [{ id: 'sticks', quantity: 3 }, { id: 'fiber', quantity: 3 }], goldCost: 15, requiredFeature: 'blacksmith',
      overrides: { name: 'Simple Bow', stats: { agi: 2 } } },
    { id: 'craft_leather_cap', name: 'Leather Cap', icon: '🪖', resultItem: 'leather_armor', slot: 'armor',
      materials: [{ id: 'fiber', quantity: 3 }], goldCost: 10, requiredFeature: 'blacksmith',
      overrides: { name: 'Leather Cap', stats: { agi: 1, con: 1 } } },
    { id: 'craft_fiber_cloak', name: 'Fiber Cloak', icon: '🧥', resultItem: 'shadow_cloak', slot: 'armor',
      materials: [{ id: 'fiber', quantity: 4 }, { id: 'healing_herb', quantity: 1 }], goldCost: 15, requiredFeature: 'blacksmith',
      overrides: { name: 'Fiber Cloak', stats: { agi: 2 } } },
    // Academist E-Rank
    { id: 'craft_stick_wand', name: 'Stick Wand', icon: '🪄', resultItem: 'magic_staff', slot: 'weapon',
      materials: [{ id: 'sticks', quantity: 3 }, { id: 'healing_herb', quantity: 1 }], goldCost: 15, requiredFeature: 'blacksmith',
      overrides: { name: 'Stick Wand', stats: { int: 2 } } },
    { id: 'craft_cloth_robe', name: 'Cloth Robe', icon: '👘', resultItem: 'mage_robe', slot: 'armor',
      materials: [{ id: 'fiber', quantity: 4 }, { id: 'healing_herb', quantity: 2 }], goldCost: 20, requiredFeature: 'blacksmith',
      overrides: { name: 'Cloth Robe', stats: { int: 1, cha: 1 } } },
    { id: 'craft_beginner_trinket', name: 'Beginner Trinket', icon: '📿', resultItem: 'amulet_wisdom', slot: 'accessory',
      materials: [{ id: 'sticks', quantity: 2 }, { id: 'healing_herb', quantity: 2 }], goldCost: 10, requiredFeature: 'blacksmith',
      overrides: { name: 'Beginner Trinket', stats: { int: 1 } } },

    // === D-Rank Recipes ===
    // Combatant D-Rank
    { id: 'craft_scrap_blade', name: 'Scrap Blade', icon: '⚔️', resultItem: 'iron_sword', slot: 'weapon',
      materials: [{ id: 'metal_scrap', quantity: 3 }, { id: 'sticks', quantity: 2 }], goldCost: 40, requiredFeature: 'blacksmith',
      overrides: { name: 'Scrap Blade', stats: { str: 4 } } },
    { id: 'craft_reinforced_shield', name: 'Reinforced Shield', icon: '🛡️', resultItem: 'chain_mail', slot: 'armor',
      materials: [{ id: 'metal_scrap', quantity: 4 }, { id: 'sticks', quantity: 3 }], goldCost: 50, requiredFeature: 'blacksmith',
      overrides: { name: 'Reinforced Shield', stats: { con: 4 } } },
    { id: 'craft_chain_vest', name: 'Chain Vest', icon: '🛡️', resultItem: 'chain_mail', slot: 'armor',
      materials: [{ id: 'metal_scrap', quantity: 5 }, { id: 'iron_ore', quantity: 2 }], goldCost: 55, requiredFeature: 'blacksmith',
      overrides: { name: 'Chain Vest', stats: { con: 3, str: 1 } } },
    // Scout D-Rank
    { id: 'craft_composite_bow', name: 'Composite Bow', icon: '🏹', resultItem: 'long_bow', slot: 'weapon',
      materials: [{ id: 'sticks', quantity: 3 }, { id: 'metal_scrap', quantity: 2 }, { id: 'fiber', quantity: 2 }], goldCost: 40, requiredFeature: 'blacksmith',
      overrides: { name: 'Composite Bow', stats: { agi: 4 } } },
    { id: 'craft_studded_armor', name: 'Studded Armor', icon: '🛡️', resultItem: 'leather_armor', slot: 'armor',
      materials: [{ id: 'fiber', quantity: 3 }, { id: 'metal_scrap', quantity: 3 }], goldCost: 45, requiredFeature: 'blacksmith',
      overrides: { name: 'Studded Armor', stats: { agi: 3, con: 1 } } },
    { id: 'craft_shadow_cloak_d', name: 'Shadow Cloak', icon: '🧥', resultItem: 'shadow_cloak', slot: 'armor',
      materials: [{ id: 'fiber', quantity: 4 }, { id: 'metal_scrap', quantity: 2 }, { id: 'healing_herb', quantity: 2 }], goldCost: 40, requiredFeature: 'blacksmith',
      overrides: { name: 'Shadow Cloak', stats: { agi: 4 } } },
    // Academist D-Rank
    { id: 'craft_arcane_staff', name: 'Arcane Staff', icon: '🪄', resultItem: 'magic_staff', slot: 'weapon',
      materials: [{ id: 'sticks', quantity: 2 }, { id: 'crystal_shard', quantity: 1 }, { id: 'magic_essence', quantity: 1 }], goldCost: 50, requiredFeature: 'blacksmith',
      overrides: { name: 'Arcane Staff', stats: { int: 4 } } },
    { id: 'craft_enchanted_robe', name: 'Enchanted Robe', icon: '👘', resultItem: 'mage_robe', slot: 'armor',
      materials: [{ id: 'fiber', quantity: 3 }, { id: 'crystal_shard', quantity: 1 }, { id: 'magic_essence', quantity: 1 }], goldCost: 50, requiredFeature: 'blacksmith',
      overrides: { name: 'Enchanted Robe', stats: { int: 3, cha: 1 } } },
    { id: 'craft_magic_ring', name: 'Magic Ring', icon: '💍', resultItem: 'ring_agility', slot: 'accessory',
      materials: [{ id: 'crystal_shard', quantity: 2 }, { id: 'metal_scrap', quantity: 1 }], goldCost: 45, requiredFeature: 'blacksmith',
      overrides: { name: 'Magic Ring', stats: { int: 3 } } },

    // === C-Rank Recipes ===
    // Combatant C-Rank
    { id: 'craft_crystal_blade', name: 'Crystal Blade', icon: '⚔️', resultItem: 'steel_sword', slot: 'weapon',
      materials: [{ id: 'iron_ore', quantity: 4 }, { id: 'crystal_shard', quantity: 2 }], goldCost: 85, requiredFeature: 'blacksmith',
      overrides: { name: 'Crystal Blade', stats: { str: 6 } } },
    { id: 'craft_crystal_shield', name: 'Crystal Shield', icon: '🛡️', resultItem: 'chain_mail', slot: 'armor',
      materials: [{ id: 'iron_ore', quantity: 5 }, { id: 'crystal_shard', quantity: 2 }], goldCost: 90, requiredFeature: 'blacksmith',
      overrides: { name: 'Crystal Shield', stats: { con: 6 } } },
    { id: 'craft_plate_vest', name: 'Plate Vest', icon: '🛡️', resultItem: 'plate_armor', slot: 'armor',
      materials: [{ id: 'iron_ore', quantity: 6 }, { id: 'crystal_shard', quantity: 1 }, { id: 'metal_scrap', quantity: 3 }], goldCost: 95, requiredFeature: 'blacksmith',
      overrides: { name: 'Plate Vest', stats: { con: 5, str: 1 } } },
    // Scout C-Rank
    { id: 'craft_longbow_c', name: 'Longbow', icon: '🏹', resultItem: 'long_bow', slot: 'weapon',
      materials: [{ id: 'iron_ore', quantity: 3 }, { id: 'sticks', quantity: 2 }, { id: 'crystal_shard', quantity: 1 }], goldCost: 80, requiredFeature: 'blacksmith',
      overrides: { name: 'Longbow', stats: { agi: 6 } } },
    { id: 'craft_ranger_armor', name: 'Ranger Armor', icon: '🛡️', resultItem: 'leather_armor', slot: 'armor',
      materials: [{ id: 'iron_ore', quantity: 3 }, { id: 'fiber', quantity: 3 }, { id: 'crystal_shard', quantity: 1 }], goldCost: 85, requiredFeature: 'blacksmith',
      overrides: { name: 'Ranger Armor', stats: { agi: 5, con: 1 } } },
    { id: 'craft_assassin_cloak', name: 'Assassin Cloak', icon: '🧥', resultItem: 'shadow_cloak', slot: 'armor',
      materials: [{ id: 'crystal_shard', quantity: 2 }, { id: 'magic_essence', quantity: 1 }, { id: 'fiber', quantity: 2 }], goldCost: 80, requiredFeature: 'blacksmith',
      overrides: { name: 'Assassin Cloak', stats: { agi: 6 } } },
    // Academist C-Rank
    { id: 'craft_arcane_focus', name: 'Arcane Focus', icon: '🪄', resultItem: 'magic_staff', slot: 'weapon',
      materials: [{ id: 'crystal_shard', quantity: 3 }, { id: 'magic_essence', quantity: 2 }], goldCost: 90, requiredFeature: 'blacksmith',
      overrides: { name: 'Arcane Focus', stats: { int: 6 } } },
    { id: 'craft_mystic_robe', name: 'Mystic Robe', icon: '👘', resultItem: 'mage_robe', slot: 'armor',
      materials: [{ id: 'crystal_shard', quantity: 2 }, { id: 'magic_essence', quantity: 2 }, { id: 'healing_herb', quantity: 2 }], goldCost: 95, requiredFeature: 'blacksmith',
      overrides: { name: 'Mystic Robe', stats: { int: 5, cha: 1 } } },
    { id: 'craft_wise_amulet', name: 'Wise Amulet', icon: '📿', resultItem: 'amulet_wisdom', slot: 'accessory',
      materials: [{ id: 'crystal_shard', quantity: 2 }, { id: 'magic_essence', quantity: 2 }], goldCost: 85, requiredFeature: 'blacksmith',
      overrides: { name: 'Wise Amulet', stats: { int: 5 } } },

    // === Existing D-Rank Recipes (kept for progression) ===
    { id: 'craft_iron_sword', name: 'Iron Sword', icon: '⚔️', resultItem: 'iron_sword', slot: 'weapon',
      materials: [{ id: 'iron_ore', quantity: 3 }], goldCost: 30, requiredFeature: 'blacksmith' },
    { id: 'craft_steel_sword', name: 'Steel Sword', icon: '⚔️', resultItem: 'steel_sword', slot: 'weapon',
      materials: [{ id: 'iron_ore', quantity: 5 }, { id: 'crystal_shard', quantity: 1 }], goldCost: 80, requiredFeature: 'blacksmith' },
    { id: 'craft_long_bow', name: 'Long Bow', icon: '🏹', resultItem: 'long_bow', slot: 'weapon',
      materials: [{ id: 'iron_ore', quantity: 2 }, { id: 'healing_herb', quantity: 2 }], goldCost: 40, requiredFeature: 'blacksmith' },
    { id: 'craft_magic_staff', name: 'Magic Staff', icon: '🪄', resultItem: 'magic_staff', slot: 'weapon',
      materials: [{ id: 'crystal_shard', quantity: 2 }, { id: 'magic_essence', quantity: 1 }], goldCost: 60, requiredFeature: 'blacksmith' },
    { id: 'craft_dagger', name: 'Shadow Dagger', icon: '🗡️', resultItem: 'dagger', slot: 'weapon',
      materials: [{ id: 'iron_ore', quantity: 2 }, { id: 'crystal_shard', quantity: 1 }], goldCost: 50, requiredFeature: 'blacksmith' },

    // === Armor ===
    { id: 'craft_leather_armor', name: 'Leather Armor', icon: '🛡️', resultItem: 'leather_armor', slot: 'armor',
      materials: [{ id: 'healing_herb', quantity: 3 }], goldCost: 40, requiredFeature: 'blacksmith' },
    { id: 'craft_chain_mail', name: 'Chain Mail', icon: '🛡️', resultItem: 'chain_mail', slot: 'armor',
      materials: [{ id: 'iron_ore', quantity: 5 }], goldCost: 100, requiredFeature: 'blacksmith' },
    { id: 'craft_plate_armor', name: 'Plate Armor', icon: '🛡️', resultItem: 'plate_armor', slot: 'armor',
      materials: [{ id: 'iron_ore', quantity: 8 }, { id: 'crystal_shard', quantity: 2 }], goldCost: 200, requiredFeature: 'blacksmith' },
    { id: 'craft_mage_robe', name: 'Mage Robe', icon: '👘', resultItem: 'mage_robe', slot: 'armor',
      materials: [{ id: 'healing_herb', quantity: 2 }, { id: 'magic_essence', quantity: 2 }], goldCost: 75, requiredFeature: 'blacksmith' },
    { id: 'craft_shadow_cloak', name: 'Shadow Cloak', icon: '🧥', resultItem: 'shadow_cloak', slot: 'armor',
      materials: [{ id: 'magic_essence', quantity: 2 }, { id: 'crystal_shard', quantity: 1 }], goldCost: 90, requiredFeature: 'blacksmith' },

    // === Accessories ===
    { id: 'craft_ring_strength', name: 'Ring of Strength', icon: '💍', resultItem: 'ring_strength', slot: 'accessory',
      materials: [{ id: 'iron_ore', quantity: 3 }, { id: 'crystal_shard', quantity: 2 }], goldCost: 100, requiredFeature: 'blacksmith' },
    { id: 'craft_ring_agility', name: 'Ring of Agility', icon: '💍', resultItem: 'ring_agility', slot: 'accessory',
      materials: [{ id: 'crystal_shard', quantity: 3 }], goldCost: 100, requiredFeature: 'blacksmith' },
    { id: 'craft_amulet_wisdom', name: 'Amulet of Wisdom', icon: '📿', resultItem: 'amulet_wisdom', slot: 'accessory',
      materials: [{ id: 'magic_essence', quantity: 3 }], goldCost: 125, requiredFeature: 'blacksmith' },
    { id: 'craft_amulet_charisma', name: 'Amulet of Charisma', icon: '📿', resultItem: 'amulet_charisma', slot: 'accessory',
      materials: [{ id: 'magic_essence', quantity: 2 }, { id: 'healing_herb', quantity: 3 }], goldCost: 125, requiredFeature: 'blacksmith' },

    // === Legendary (Ancient Forge) ===
    { id: 'craft_dragon_plate', name: 'Dragon Plate Armor', icon: '🐉', resultItem: 'plate_armor', slot: 'armor',
      materials: [{ id: 'dragon_scale', quantity: 3 }, { id: 'iron_ore', quantity: 10 }, { id: 'magic_essence', quantity: 5 }],
      goldCost: 500, requiredFeature: 'ancient_forge',
      overrides: { name: 'Dragon Plate Armor', stats: { con: 15, str: 5, agi: -2 } } },
    { id: 'craft_void_blade', name: 'Void Blade', icon: '⚔️', resultItem: 'steel_sword', slot: 'weapon',
      materials: [{ id: 'dragon_scale', quantity: 2 }, { id: 'crystal_shard', quantity: 5 }, { id: 'magic_essence', quantity: 3 }],
      goldCost: 600, requiredFeature: 'ancient_forge',
      overrides: { name: 'Void Blade', stats: { str: 12, agi: 5 } } }
];
