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

// Тут будуть зберігатися всі квести (зараз порожньо — видалено Floran Forest/Valley/Hills/Highlands тощо)
export const QUESTS: Quest[] = [];

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

