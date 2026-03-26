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

/** Без вибору цілі в фазі pick — авто-вибір противника (15 хв). */
export const TVT_PICK_AFK_MS = 15 * 60 * 1000;

/** Один щоденний слот: реєстрація 15:30–15:32 (2 хв), старт 15:32. */
export const TVT_DAILY_SLOTS: TvtDailySlot[] = [
  { id: "daily", label: "TvT", registrationOpen: { h: 15, m: 30 }, battleStart: { h: 15, m: 32 } },
];

function toMinutes(t: TimeHM): number {
  return t.h * 60 + t.m;
}

/** Хвилини від півночі в ігровій зоні (як у новинах). Intl — без парсингу toLocaleString (на Node/VPS надійніше). */
export function minutesSinceMidnight(d: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: GAME_TZ,
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(d);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

/** Реєстрація відкрита: [regOpen, battleStart) */
export function isRegistrationOpenForSlot(now: Date, slot: TvtDailySlot): boolean {
  const n = minutesSinceMidnight(now);
  const a = toMinutes(slot.registrationOpen);
  const b = toMinutes(slot.battleStart);
  return n >= a && n < b;
}

/**
 * Вікно спроб старту матчу: [battleStart, battleStart + 15 хв) — як фаза «бій» у клієнта.
 * Раніше було 3 хв; перший тик з 0 учасниками міг позначити слот «вже стартанув» без матчу — гонка з KV.
 */
export function isBattleStartWindow(now: Date, slot: TvtDailySlot): boolean {
  const n = minutesSinceMidnight(now);
  const b = toMinutes(slot.battleStart);
  return n >= b && n < b + 15;
}

/** Календарний день у ігровій зоні (для реєстрацій / матчів «сьогодні»). */
export function dayKeyFromDate(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: GAME_TZ });
}
