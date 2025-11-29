// src/utils/news.ts

export type NewsType = "register" | "login" | "bossKill";

export interface BaseNewsItem {
  type: NewsType;
  user: string;
  time: string; // игровое время "HH:MM"
  boss?: string;
  level?: number;
}

// Добавление новости в localStorage (держим только 100)
export function addNews(item: BaseNewsItem) {
  try {
    const raw = localStorage.getItem("news");
    let list: BaseNewsItem[] = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) list = [];
    list.push(item);
    if (list.length > 100) {
      list = list.slice(-100);
    }
    localStorage.setItem("news", JSON.stringify(list));
  } catch {
    // ignore
  }
}

// Взять текущий игровой таймер и вернуть строку "HH:MM"
export function getGameTimeTag(): string {
  try {
    const raw = localStorage.getItem("gameTimeMinutes") || "0";
    const minutes = parseInt(raw, 10) || 0;
    const h = Math.floor(minutes / 60) % 24;
    const m = minutes % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}`;
  } catch {
    return "00:00";
  }
}
