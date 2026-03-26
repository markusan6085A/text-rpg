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

/** Один щоденний слот: реєстрація 15:45–15:50, старт 15:50 (як у клієнта). */
export const TVT_DAILY_SLOTS: TvtDailySlot[] = [
  { id: "daily", label: "TvT", registrationOpen: { h: 15, m: 45 }, battleStart: { h: 15, m: 50 } },
];

/** Секунди від півночі в ігровій зоні — однакова межа з клієнтом (gameClock). Формат sv-SE стабільний у Node. */
function secondsSinceMidnightGame(d: Date): number {
  const s = d.toLocaleString("sv-SE", { timeZone: GAME_TZ });
  const m = s.match(/\s(\d{1,2}):(\d{2}):(\d{2})/);
  if (!m) return 0;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  const ss = Number(m[3]);
  return (hh % 24) * 3600 + (mm % 60) * 60 + (ss % 60);
}

function toSecondsHM(t: TimeHM): number {
  return t.h * 3600 + t.m * 60;
}

/** Хвилини від півночі (для API / діагностики). */
export function minutesSinceMidnight(d: Date): number {
  return Math.floor(secondsSinceMidnightGame(d) / 60);
}

/** Реєстрація відкрита: [regOpen, battleStart) по секундах — без зсуву на межі хвилини. */
export function isRegistrationOpenForSlot(now: Date, slot: TvtDailySlot): boolean {
  const n = secondsSinceMidnightGame(now);
  const a = toSecondsHM(slot.registrationOpen);
  const b = toSecondsHM(slot.battleStart);
  return n >= a && n < b;
}

/**
 * Вікно спроб старту матчу: [battleStart, battleStart + 15 хв) — як фаза «бій» у клієнта.
 * Раніше було 3 хв; перший тик з 0 учасниками міг позначити слот «вже стартанув» без матчу — гонка з KV.
 */
export function isBattleStartWindow(now: Date, slot: TvtDailySlot): boolean {
  const n = secondsSinceMidnightGame(now);
  const b = toSecondsHM(slot.battleStart);
  return n >= b && n < b + 15 * 60;
}

/** Календарний день у ігровій зоні (для реєстрацій / матчів «сьогодні»). */
export function dayKeyFromDate(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: GAME_TZ });
}
