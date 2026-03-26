/** Синхронно з клієнтом `src/screens/tvt/tvtSchedule.ts` (локальний час процесу сервера). */

export type TimeHM = { h: number; m: number };

export type TvtDailySlot = {
  id: string;
  label: string;
  registrationOpen: TimeHM;
  battleStart: TimeHM;
};

/** Максимальна тривалість матчу TvT (мс): далі — таймаут або раніше — повна перемога команди. */
export const TVT_MATCH_MAX_MS = 15 * 60 * 1000;

/** Один щоденний слот: реєстрація 14:05, старт 14:10 (локальний час процесу сервера). */
export const TVT_DAILY_SLOTS: TvtDailySlot[] = [
  { id: "daily", label: "TvT", registrationOpen: { h: 14, m: 5 }, battleStart: { h: 14, m: 10 } },
];

function toMinutes(t: TimeHM): number {
  return t.h * 60 + t.m;
}

export function minutesSinceMidnight(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

/** Реєстрація відкрита: [regOpen, battleStart) */
export function isRegistrationOpenForSlot(now: Date, slot: TvtDailySlot): boolean {
  const n = minutesSinceMidnight(now);
  const a = toMinutes(slot.registrationOpen);
  const b = toMinutes(slot.battleStart);
  return n >= a && n < b;
}

/** Вікно старту матчу: перша хвилина battleStart (щоб тик не пропустив) */
export function isBattleStartWindow(now: Date, slot: TvtDailySlot): boolean {
  const n = minutesSinceMidnight(now);
  const b = toMinutes(slot.battleStart);
  return n >= b && n <= b + 1;
}

export function dayKeyFromDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
