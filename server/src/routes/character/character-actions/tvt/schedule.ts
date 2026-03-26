/**
 * Той самий «ігровий» час, що на клієнті в новинах (`Europe/Warsaw`), не UTC і не локальний час VPS.
 */

export type TimeHM = { h: number; m: number };

export type TvtDailySlot = {
  id: string;
  label: string;
  registrationOpen: TimeHM;
  battleStart: TimeHM;
};

const GAME_TZ = "Europe/Warsaw";

/** Максимальна тривалість матчу TvT (мс): далі — таймаут або раніше — повна перемога команди. */
export const TVT_MATCH_MAX_MS = 15 * 60 * 1000;

/** Один щоденний слот: реєстрація 15:00–15:05 (5 хв), старт 15:05. */
export const TVT_DAILY_SLOTS: TvtDailySlot[] = [
  { id: "daily", label: "TvT", registrationOpen: { h: 15, m: 0 }, battleStart: { h: 15, m: 5 } },
];

function toMinutes(t: TimeHM): number {
  return t.h * 60 + t.m;
}

/** Хвилини від півночі в ігровій зоні (як у новинах). */
export function minutesSinceMidnight(d: Date): number {
  const w = new Date(d.toLocaleString("en-US", { timeZone: GAME_TZ }));
  return w.getHours() * 60 + w.getMinutes();
}

/** Реєстрація відкрита: [regOpen, battleStart) */
export function isRegistrationOpenForSlot(now: Date, slot: TvtDailySlot): boolean {
  const n = minutesSinceMidnight(now);
  const a = toMinutes(slot.registrationOpen);
  const b = toMinutes(slot.battleStart);
  return n >= a && n < b;
}

/** Вікно старту матчу: кілька хвилин після battleStart (тик 15 с не пропустить). */
export function isBattleStartWindow(now: Date, slot: TvtDailySlot): boolean {
  const n = minutesSinceMidnight(now);
  const b = toMinutes(slot.battleStart);
  return n >= b && n <= b + 2;
}

/** Календарний день у ігровій зоні (для реєстрацій / матчів «сьогодні»). */
export function dayKeyFromDate(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: GAME_TZ });
}
