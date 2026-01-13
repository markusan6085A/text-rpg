// src/data/dailyQuests.ts
// Файл для зберігання даних щоденних завдань

export interface DailyQuest {
  id: string;
  name: string;
  description: string;
  icon?: string;
  type: "adena" | "damage" | "exchange" | "kills" | "chat";
  target: number; // Цільове значення
  rewards: {
    exp?: number;
    adena?: number;
    sp?: number;
    coinOfLuck?: number;
  };
}

export const DAILY_QUESTS: DailyQuest[] = [
  {
    id: "daily_adena_farm",
    name: "Фарм адени",
    description: "Зібрати 100 000 адени",
    type: "adena",
    target: 100000,
    rewards: {
      sp: 50000,
    },
  },
  {
    id: "daily_damage",
    name: "Воїн",
    description: "Нанести 500 000 урону",
    type: "damage",
    target: 500000,
    rewards: {
      coinOfLuck: 1,
      exp: 100000,
    },
  },
  {
    id: "daily_exchange",
    name: "Торговець",
    description: "Обміняти 20 Quest Items",
    type: "exchange",
    target: 20,
    rewards: {
      sp: 50000,
      exp: 100000,
    },
  },
  {
    id: "daily_kills",
    name: "Винищення мобів",
    description: "Вбити 1000 мобів",
    type: "kills",
    target: 1000,
    rewards: {
      coinOfLuck: 1,
      adena: 15000,
    },
  },
  {
    id: "daily_chat",
    name: "Болтун",
    description: "Написати 10 повідомлень в чаті",
    type: "chat",
    target: 10,
    rewards: {
      adena: 10000,
    },
  },
];

