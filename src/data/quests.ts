// src/data/quests.ts
// Файл для зберігання даних квестів

export type QuestKillTarget = {
  /** Канонічна назва моба (як у даних зони) */
  mobName: string;
  /** Лічильник за id (наприклад l2dop_20120 для Волка, включно з чемпіонами) */
  mobIdPrefix?: string;
  requiredCount: number;
  progressKey: string;
};

export interface Quest {
  id: string;
  name: string;
  description: string;
  level: number;
  /** Іконка у вкладці квестів (наприклад /nps/6.png) */
  icon?: string;
  location?: string; // Локація квесту
  locationLevel?: string; // Рівні локації (наприклад, "1-5")
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
  progress?: Record<string, number>;
  questDrops?: Array<{
    mobName: string;
    itemId: string;
    requiredCount: number;
    location?: string;
  }>;
  /** Лічильники вбивств (оновлюються при перемозі над мобом) */
  questKillTargets?: QuestKillTarget[];
}

export const QUESTS: Quest[] = [
  {
    id: "gludio_outskirts_wolf_charcoal",
    icon: "/nps/6.png",
    name: "Окраина Глудио: волки и уголь",
    description:
      "Убейте 5 волков в окрестностях Глудио. Соберите 5 кусков угля (Charcoal) с разных мобов зоны. После выполнения условий сдайте уголь через вкладку «Квесты» персонажа.",
    level: 1,
    location: "Глудио — Окраина",
    locationLevel: "1–5",
    requirements: { level: 1 },
    rewards: { adena: 100_000, exp: 50_000 },
    questKillTargets: [
      {
        mobName: "Волк",
        mobIdPrefix: "l2dop_20120",
        requiredCount: 5,
        progressKey: "gludio_wolf_kills",
      },
    ],
    questDrops: [
      { mobName: "Гоблин", itemId: "quest_gludio_charcoal", requiredCount: 5 },
      { mobName: "Материй Кельтир", itemId: "quest_gludio_charcoal", requiredCount: 5 },
      { mobName: "Молодой Шакал", itemId: "quest_gludio_charcoal", requiredCount: 5 },
      { mobName: "Бородатий Шакал", itemId: "quest_gludio_charcoal", requiredCount: 5 },
    ],
  },
];

export const QUESTS_BY_LOCATION: Record<string, Quest[]> = {};
QUESTS.forEach((quest) => {
  if (quest.location) {
    if (!QUESTS_BY_LOCATION[quest.location]) {
      QUESTS_BY_LOCATION[quest.location] = [];
    }
    QUESTS_BY_LOCATION[quest.location].push(quest);
  }
});
