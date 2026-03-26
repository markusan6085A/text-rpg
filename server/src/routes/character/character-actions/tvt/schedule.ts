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

/** Один щоденний слот: реєстрація 16:05–16:10, старт 16:10 (як у клієнта). */
export const TVT_DAILY_SLOTS: TvtDailySlot[] = [
  { id: "daily", label: "TvT", registrationOpen: { h: 16, m: 5 }, battleStart: { h: 16, m: 10 } },
];

/** Секунди від півночі в ігровій зоні — однакова межа з клієнтом (gameClock). Intl надійніший за regex по sv-SE (Node без ICU → match null → 0 → реєстрація завжди закрита). */
function secondsSinceMidnightGame(d: Date): number {
  try {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: GAME_TZ,
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false,
    });
    let hh = 0;
    let mm = 0;
    let ss = 0;
    for (const p of fmt.formatToParts(d)) {
      if (p.type === "hour") hh = Number(p.value) || 0;
      if (p.type === "minute") mm = Number(p.value) || 0;
      if (p.type === "second") ss = Number(p.value) || 0;
    }
    return (hh % 24) * 3600 + (mm % 60) * 60 + (ss % 60);
  } catch {
    const s = d.toLocaleString("sv-SE", { timeZone: GAME_TZ });
    const m = s.match(/\s(\d{1,2}):(\d{2}):(\d{2})/);
    if (!m) return 0;
    const hh = Number(m[1]);
    const mm = Number(m[2]);
    const sec = Number(m[3]);
    return (hh % 24) * 3600 + (mm % 60) * 60 + (sec % 60);
  }
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
