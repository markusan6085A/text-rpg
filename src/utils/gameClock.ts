/**
 * «Ігровий» час — той самий, що блок «Игровое время» на сторінці Новини (News.tsx).
 * Не локальний час ПК і не UTC сервера.
 */
export const GAME_TIMEZONE = "Europe/Warsaw";

/** Хвилини від півночі в ігровій зоні (0..1439). Intl — узгоджено з сервером TvT (`schedule.minutesSinceMidnight`). */
export function getGameMinutesSinceMidnight(now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: GAME_TIMEZONE,
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

/** Рядок HH:MM для відображення (як у новинах). */
export function formatGameClockHHMM(now: Date = new Date()): string {
  const m = getGameMinutesSinceMidnight(now);
  const h = Math.floor(m / 60) % 24;
  const min = m % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}
