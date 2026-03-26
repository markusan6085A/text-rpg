/** Синхронно з клієнтом `src/screens/tvt/tvtSchedule.ts` (локальний час процесу сервера). */

export type TimeHM = { h: number; m: number };

export type TvtDailySlot = {
  id: string;
  label: string;
  registrationOpen: TimeHM;
  battleStart: TimeHM;
};

export const TVT_DAILY_SLOTS: TvtDailySlot[] = [
  { id: "morning", label: "Утро", registrationOpen: { h: 13, m: 40 }, battleStart: { h: 13, m: 45 } },
  { id: "day", label: "День", registrationOpen: { h: 18, m: 40 }, battleStart: { h: 18, m: 45 } },
  { id: "evening", label: "Вечер", registrationOpen: { h: 21, m: 40 }, battleStart: { h: 21, m: 45 } },
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
