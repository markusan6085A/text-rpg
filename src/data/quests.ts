// src/data/quests.ts
// Файл для зберігання даних квестів

export interface Quest {
  id: string;
  name: string;
  description: string;
  level: number;
  location?: string; // Локація квесту (наприклад, "Floran Outskirts")
  locationLevel?: string; // Рівні локації (наприклад, "1-6")
  rewards?: {
    exp?: number;
    adena?: number;
    items?: Array<{ id: string; count: number }>;
  };
  requirements?: {
    level?: number;
    items?: Array<{ id: string; count: number }>;
  };
  status?: "available" | "in_progress" | "completed";
  // Прогрес квесту (скільки зібрано предметів)
  progress?: Record<string, number>;
  // Моби, з яких падають квестові предмети
  questDrops?: Array<{
    mobName: string;
    itemId: string;
    requiredCount: number;
    location?: string; // Локація моба
  }>;
}

// Тут будуть зберігатися всі квести
export const QUESTS: Quest[] = [
  {
    id: "quest_floran_collection",
    name: "Збір Ресурсів Floran",
    description: "Зберіть квестові предмети з мобів у Floran Outskirts. Потрібно: 20 Чорних Черепів з Floran Bandit, Floran Warrior або Floran Cleric та 5 Кігтів з [Champion] Floran Elite Warrior.",
    level: 1,
    location: "Floran Outskirts",
    locationLevel: "1-6",
    rewards: {
      items: [{ id: "coins_silver", count: 15 }],
    },
    requirements: {
      level: 1,
    },
    status: "available",
    progress: {
      quest_skull_black: 0,
      quest_claw: 0,
    },
    questDrops: [
      {
        mobName: "Floran Bandit",
        itemId: "quest_skull_black",
        requiredCount: 20,
        location: "Floran Outskirts",
      },
      {
        mobName: "Floran Warrior",
        itemId: "quest_skull_black",
        requiredCount: 20,
        location: "Floran Outskirts",
      },
      {
        mobName: "Floran Cleric",
        itemId: "quest_skull_black",
        requiredCount: 20,
        location: "Floran Outskirts",
      },
      {
        mobName: "[Champion] Floran Elite Warrior",
        itemId: "quest_claw",
        requiredCount: 5,
        location: "Floran Outskirts",
      },
    ],
  },
  {
    id: "quest_floran_plains_hunt",
    name: "Полювання на Plains",
    description: "Вбийте мобів у Floran Plains. Потрібно: 20 Plains Wanderer, 10 Plains Traveler, 10 Plains Rover та 1 [Champion] Plains Commander.",
    level: 1,
    location: "Floran Plains",
    locationLevel: "3-10",
    rewards: {
      items: [{ id: "coins_silver", count: 10 }],
    },
    requirements: {
      level: 1,
    },
    status: "available",
    progress: {
      quest_plains_wanderer_token: 0,
      quest_plains_traveler_token: 0,
      quest_plains_rover_token: 0,
      quest_plains_commander_token: 0,
    },
    questDrops: [
      {
        mobName: "Plains Wanderer",
        itemId: "quest_plains_wanderer_token",
        requiredCount: 20,
        location: "Floran Plains",
      },
      {
        mobName: "Plains Traveler",
        itemId: "quest_plains_traveler_token",
        requiredCount: 10,
        location: "Floran Plains",
      },
      {
        mobName: "Plains Rover",
        itemId: "quest_plains_rover_token",
        requiredCount: 10,
        location: "Floran Plains",
      },
      {
        mobName: "[Champion] Plains Commander",
        itemId: "quest_plains_commander_token",
        requiredCount: 1,
        location: "Floran Plains",
      },
    ],
  },
  {
    id: "quest_floran_forest_hunt",
    name: "Полювання в Forest",
    description: "Вбийте мобів у Floran Forest. Потрібно: 40 Forest Stalker, 40 Forest Predator, 1 [Champion] Forest Master та 1 [Champion] Forest Lord.",
    level: 1,
    location: "Floran Forest",
    locationLevel: "7-16",
    rewards: {
      items: [{ id: "coins_silver", count: 10 }],
    },
    requirements: {
      level: 1,
    },
    status: "available",
    progress: {
      quest_forest_stalker_token: 0,
      quest_forest_predator_token: 0,
      quest_forest_master_token: 0,
      quest_forest_lord_token: 0,
    },
    questDrops: [
      {
        mobName: "Forest Stalker",
        itemId: "quest_forest_stalker_token",
        requiredCount: 40,
        location: "Floran Forest",
      },
      {
        mobName: "Forest Predator",
        itemId: "quest_forest_predator_token",
        requiredCount: 40,
        location: "Floran Forest",
      },
      {
        mobName: "[Champion] Forest Master",
        itemId: "quest_forest_master_token",
        requiredCount: 1,
        location: "Floran Forest",
      },
      {
        mobName: "[Champion] Forest Lord",
        itemId: "quest_forest_lord_token",
        requiredCount: 1,
        location: "Floran Forest",
      },
    ],
  },
  {
    id: "quest_floran_valley_hunt",
    name: "Полювання в Valley",
    description: "Вбийте мобів у Floran Valley. Потрібно: 50 Valley Dweller/Resident/Native/Citizen/Commoner/Farmer, 40 Valley Inhabitant/Settler/Local/Villager/Peasant/Worker та 5 [Champion] Valley Warlord/Chieftain/Captain/Leader/Commander.",
    level: 6,
    location: "Floran Valley",
    locationLevel: "6-20",
    rewards: {
      items: [{ id: "coins_silver", count: 10 }],
    },
    requirements: {
      level: 6,
    },
    status: "available",
    progress: {
      quest_valley_dweller_token: 0,
      quest_valley_inhabitant_token: 0,
      quest_valley_warlord_token: 0,
    },
    questDrops: [
      {
        mobName: "Valley Dweller",
        itemId: "quest_valley_dweller_token",
        requiredCount: 50,
        location: "Floran Valley",
      },
      {
        mobName: "Valley Resident",
        itemId: "quest_valley_dweller_token",
        requiredCount: 50,
        location: "Floran Valley",
      },
      {
        mobName: "Valley Native",
        itemId: "quest_valley_dweller_token",
        requiredCount: 50,
        location: "Floran Valley",
      },
      {
        mobName: "Valley Citizen",
        itemId: "quest_valley_dweller_token",
        requiredCount: 50,
        location: "Floran Valley",
      },
      {
        mobName: "Valley Commoner",
        itemId: "quest_valley_dweller_token",
        requiredCount: 50,
        location: "Floran Valley",
      },
      {
        mobName: "Valley Farmer",
        itemId: "quest_valley_dweller_token",
        requiredCount: 50,
        location: "Floran Valley",
      },
      {
        mobName: "Valley Inhabitant",
        itemId: "quest_valley_inhabitant_token",
        requiredCount: 40,
        location: "Floran Valley",
      },
      {
        mobName: "Valley Settler",
        itemId: "quest_valley_inhabitant_token",
        requiredCount: 40,
        location: "Floran Valley",
      },
      {
        mobName: "Valley Local",
        itemId: "quest_valley_inhabitant_token",
        requiredCount: 40,
        location: "Floran Valley",
      },
      {
        mobName: "Valley Villager",
        itemId: "quest_valley_inhabitant_token",
        requiredCount: 40,
        location: "Floran Valley",
      },
      {
        mobName: "Valley Peasant",
        itemId: "quest_valley_inhabitant_token",
        requiredCount: 40,
        location: "Floran Valley",
      },
      {
        mobName: "Valley Worker",
        itemId: "quest_valley_inhabitant_token",
        requiredCount: 40,
        location: "Floran Valley",
      },
      {
        mobName: "[Champion] Valley Warlord",
        itemId: "quest_valley_warlord_token",
        requiredCount: 5,
        location: "Floran Valley",
      },
      {
        mobName: "[Champion] Valley Chieftain",
        itemId: "quest_valley_warlord_token",
        requiredCount: 5,
        location: "Floran Valley",
      },
      {
        mobName: "[Champion] Valley Captain",
        itemId: "quest_valley_warlord_token",
        requiredCount: 5,
        location: "Floran Valley",
      },
      {
        mobName: "[Champion] Valley Leader",
        itemId: "quest_valley_warlord_token",
        requiredCount: 5,
        location: "Floran Valley",
      },
      {
        mobName: "[Champion] Valley Commander",
        itemId: "quest_valley_warlord_token",
        requiredCount: 5,
        location: "Floran Valley",
      },
    ],
  },
  {
    id: "quest_floran_hills_hunt",
    name: "Полювання в Hills",
    description: "Вбийте мобів у Floran Hills. Потрібно: 30 Hills Raider, 30 Hills Bandit та 30 Hills Reaver.",
    level: 12,
    location: "Floran Hills",
    locationLevel: "12-24",
    rewards: {
      items: [{ id: "coins_silver", count: 10 }],
    },
    requirements: {
      level: 12,
    },
    status: "available",
    progress: {
      quest_hills_raider_token: 0,
      quest_hills_bandit_token: 0,
      quest_hills_reaver_token: 0,
    },
    questDrops: [
      { mobName: "Hills Raider", itemId: "quest_hills_raider_token", requiredCount: 30, location: "Floran Hills" },
      { mobName: "Hills Bandit", itemId: "quest_hills_bandit_token", requiredCount: 30, location: "Floran Hills" },
      { mobName: "Hills Reaver", itemId: "quest_hills_reaver_token", requiredCount: 30, location: "Floran Hills" },
    ],
  },
  {
    id: "quest_floran_highlands_hunt",
    name: "Полювання в Highlands",
    description: "Вбийте мобів та рейд-боса у Floran Highlands. Потрібно: 100 Highlands Warrior та 1 рейд-бос.",
    level: 20,
    location: "Floran Highlands",
    locationLevel: "20-28",
    rewards: {
      items: [{ id: "coins_silver", count: 20 }],
    },
    requirements: {
      level: 20,
    },
    status: "available",
    progress: {
      quest_highlands_warrior_token: 0,
      quest_highlands_rb_token: 0,
    },
    questDrops: [
      { mobName: "Highlands Warrior", itemId: "quest_highlands_warrior_token", requiredCount: 100, location: "Floran Highlands" },
      { mobName: "Raid Boss: Ancient Highlands Guardian", itemId: "quest_highlands_rb_token", requiredCount: 1, location: "Floran Highlands" },
      { mobName: "Raid Boss: Ancient Highlands Warlord", itemId: "quest_highlands_rb_token", requiredCount: 1, location: "Floran Highlands" },
      { mobName: "Raid Boss: Ancient Highlands Overlord", itemId: "quest_highlands_rb_token", requiredCount: 1, location: "Floran Highlands" },
      { mobName: "Raid Boss: Ancient Highlands Titan", itemId: "quest_highlands_rb_token", requiredCount: 1, location: "Floran Highlands" },
    ],
  },
  {
    id: "quest_floran_peaks_hunt",
    name: "Полювання в Peaks",
    description: "Вбийте мобів та чемпіонів у Floran Peaks. Потрібно: 40 Peaks Climber, 30 Peaks Explorer та 5 чемпіонів.",
    level: 25,
    location: "Floran Peaks",
    locationLevel: "25-36",
    rewards: {
      items: [{ id: "coins_silver", count: 15 }],
    },
    requirements: {
      level: 25,
    },
    status: "available",
    progress: {
      quest_peaks_climber_token: 0,
      quest_peaks_explorer_token: 0,
      quest_peaks_champion_token: 0,
    },
    questDrops: [
      { mobName: "Peaks Climber", itemId: "quest_peaks_climber_token", requiredCount: 40, location: "Floran Peaks" },
      { mobName: "Peaks Explorer", itemId: "quest_peaks_explorer_token", requiredCount: 30, location: "Floran Peaks" },
      { mobName: "[Champion] Peaks Warlord", itemId: "quest_peaks_champion_token", requiredCount: 5, location: "Floran Peaks" },
      { mobName: "[Champion] Peaks Chieftain", itemId: "quest_peaks_champion_token", requiredCount: 5, location: "Floran Peaks" },
      { mobName: "[Champion] Peaks Captain", itemId: "quest_peaks_champion_token", requiredCount: 5, location: "Floran Peaks" },
      { mobName: "[Champion] Peaks Leader", itemId: "quest_peaks_champion_token", requiredCount: 5, location: "Floran Peaks" },
      { mobName: "[Champion] Peaks Commander", itemId: "quest_peaks_champion_token", requiredCount: 5, location: "Floran Peaks" },
    ],
  },
];

// Групування квестів по локаціях
export const QUESTS_BY_LOCATION: Record<string, Quest[]> = {};
QUESTS.forEach((quest) => {
  if (quest.location) {
    if (!QUESTS_BY_LOCATION[quest.location]) {
      QUESTS_BY_LOCATION[quest.location] = [];
    }
    QUESTS_BY_LOCATION[quest.location].push(quest);
  }
});

