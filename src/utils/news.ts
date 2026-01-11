// src/utils/news.ts

export type NewsType = "register" | "login" | "bossKill";

export interface BaseNewsItem {
  type: NewsType;
  user: string;
  time: string; // игровое время "HH:MM"
  boss?: string;
  level?: number;
}

import { getJSON, setJSON } from "../state/persistence";

// Добавление новости в localStorage (держим только 100)
export function addNews(item: BaseNewsItem) {
  try {
    let list: BaseNewsItem[] = getJSON<BaseNewsItem[]>("news", []);
    if (!Array.isArray(list)) list = [];
    list.push(item);
    if (list.length > 100) {
      list = list.slice(-100);
    }
    setJSON("news", list);
  } catch {
    // ignore
  }
}

import { getString } from "../state/persistence";

// Взять текущий игровой таймер и вернуть строку "HH:MM"
export function getGameTimeTag(): string {
  try {
    const raw = getString("gameTimeMinutes", "0");
    const minutes = parseInt(raw || "0", 10) || 0;
    const h = Math.floor(minutes / 60) % 24;
    const m = minutes % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}`;
  } catch {
    return "00:00";
  }
}
