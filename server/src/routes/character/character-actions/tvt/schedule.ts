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

/** Один щоденний слот: реєстрація 17:20–17:25, старт 17:25 (синхронно з клієнтом). */
export const TVT_DAILY_SLOTS: TvtDailySlot[] = [
  { id: "daily", label: "TvT", registrationOpen: { h: 17, m: 20 }, battleStart: { h: 17, m: 25 } },
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

/** Хвилини від півночі (для API / діагностики). */
export function minutesSinceMidnight(d: Date): number {
  return Math.floor(secondsSinceMidnightGame(d) / 60);
}

/**
 * Реєстрація відкрита: ті самі межі, що `getSlotStatusFromMinutes` на клієнті — [regOpen, battleStart) по **хвилинах** доби.
 * Перевірка по секундах давала роз’їзд із показом «ігрових хвилин» (floor) і з API-знімком serverMinutes.
 */
export function isRegistrationOpenForSlot(now: Date, slot: TvtDailySlot): boolean {
  const mins = minutesSinceMidnight(now);
  const regOpen = slot.registrationOpen.h * 60 + slot.registrationOpen.m;
  const battle = slot.battleStart.h * 60 + slot.battleStart.m;
  return mins >= regOpen && mins < battle;
}

/**
 * Вікно спроб старту матчу: [battleStart, battleStart + 15 хв) — як фаза «бій» у клієнта.
 * Раніше було 3 хв; перший тик з 0 учасниками міг позначити слот «вже стартанув» без матчу — гонка з KV.
 */
export function isBattleStartWindow(now: Date, slot: TvtDailySlot): boolean {
  const mins = minutesSinceMidnight(now);
  const battle = slot.battleStart.h * 60 + slot.battleStart.m;
  const battleEnd = battle + 15;
  return mins >= battle && mins < battleEnd;
}

/** Календарний день у ігровій зоні (для реєстрацій / матчів «сьогодні»). */
export function dayKeyFromDate(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: GAME_TZ });
}
