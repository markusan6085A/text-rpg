/**
 * «Ігровий» час — той самий, що блок «Игровое время» на сторінці Новини (News.tsx).
 * Не локальний час ПК і не UTC сервера.
 */
export const GAME_TIMEZONE = "Europe/Warsaw";

/** Секунди від півночі в ігровій зоні — та сама логіка, що `server/.../tvt/schedule.ts` (sv-SE + Europe/Warsaw). */
function gameSecondsSinceMidnight(now: Date): number {
  const s = now.toLocaleString("sv-SE", { timeZone: GAME_TIMEZONE });
  const m = s.match(/\s(\d{1,2}):(\d{2}):(\d{2})/);
  if (!m) return 0;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  const ss = Number(m[3]);
  return (hh % 24) * 3600 + (mm % 60) * 60 + (ss % 60);
}

/** Хвилини від півночі (0..1439), floor — узгоджено з сервером TvT. */
export function getGameMinutesSinceMidnight(now: Date = new Date()): number {
  return Math.floor(gameSecondsSinceMidnight(now) / 60);
}

/** Рядок HH:MM для відображення (як у новинах). */
export function formatGameClockHHMM(now: Date = new Date()): string {
  const m = getGameMinutesSinceMidnight(now);
  const h = Math.floor(m / 60) % 24;
  const min = m % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}
