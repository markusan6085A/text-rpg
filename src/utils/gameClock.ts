/**
 * «Ігровий» час — той самий, що блок «Игровое время» на сторінці Новини (News.tsx).
 * Не локальний час ПК і не UTC сервера.
 */
export const GAME_TIMEZONE = "Europe/Warsaw";

/** Хвилини від півночі в ігровій зоні (0..1439). */
export function getGameMinutesSinceMidnight(now: Date = new Date()): number {
  const w = new Date(now.toLocaleString("en-US", { timeZone: GAME_TIMEZONE }));
  return w.getHours() * 60 + w.getMinutes();
}

/** Рядок HH:MM для відображення (як у новинах). */
export function formatGameClockHHMM(now: Date = new Date()): string {
  const m = getGameMinutesSinceMidnight(now);
  const h = Math.floor(m / 60) % 24;
  const min = m % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}
