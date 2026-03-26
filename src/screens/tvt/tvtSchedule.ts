/**
 * Розклад TvT: один щоденний слот (синхронно з сервером `server/.../tvt/schedule.ts`).
 * Реєстрація 14:05, старт 14:10; фаза бою до 15 хв або до повної перемоги команди.
 */

export type TimeHM = { h: number; m: number };

export type TvtDailySlot = {
  id: string;
  label: string;
  /** Початок вікна реєстрації */
  registrationOpen: TimeHM;
  /** Старт бою */
  battleStart: TimeHM;
};

export const TVT_DAILY_SLOTS: TvtDailySlot[] = [
  {
    id: "daily",
    label: "TvT",
    registrationOpen: { h: 14, m: 5 },
    battleStart: { h: 14, m: 10 },
  },
];

/** Тривалість фази «бої» для UI (хвилини) — макс. тривалість матчу на сервері. */
const BATTLE_WINDOW_MIN = 15;

function toMinutes(t: TimeHM): number {
  return t.h * 60 + t.m;
}

function formatHM(t: TimeHM): string {
  return `${String(t.h).padStart(2, "0")}:${String(t.m).padStart(2, "0")}`;
}

export function formatSlotSchedule(slot: TvtDailySlot): string {
  return `${formatHM(slot.registrationOpen)} — регистрация · ${formatHM(slot.battleStart)} — старт`;
}

export type TvtPhase = "idle" | "registration" | "battle" | "ended";

export type TvtSlotStatus = {
  slot: TvtDailySlot;
  phase: TvtPhase;
  /** Хвилина доби зараз (0..1439) */
  nowMinutes: number;
  minutesUntilRegistration: number | null;
  minutesUntilBattle: number | null;
};

function minutesSinceMidnight(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

/**
 * Фаза для слоту в межах одного дня (локальний час браузера).
 * Реєстрація: [regOpen, battleStart), бій: [battleStart, battleStart + BATTLE_WINDOW).
 */
export function getSlotStatus(now: Date, slot: TvtDailySlot): TvtSlotStatus {
  const nowM = minutesSinceMidnight(now);
  const regOpen = toMinutes(slot.registrationOpen);
  const battle = toMinutes(slot.battleStart);
  const battleEnd = battle + BATTLE_WINDOW_MIN;

  let phase: TvtPhase = "idle";
  if (nowM < regOpen) phase = "idle";
  else if (nowM < battle) phase = "registration";
  else if (nowM < battleEnd) phase = "battle";
  else phase = "ended";

  const minutesUntilRegistration = nowM < regOpen ? regOpen - nowM : null;
  const minutesUntilBattle = nowM < battle ? battle - nowM : null;

  return {
    slot,
    phase,
    nowMinutes: nowM,
    minutesUntilRegistration,
    minutesUntilBattle,
  };
}

/** Найближчий слот за часом (для підказки «наступний TvT»). */
export function getNextSlotHint(now: Date): { slot: TvtDailySlot; message: string } | null {
  const nowM = minutesSinceMidnight(now);
  const ordered = [...TVT_DAILY_SLOTS].sort((a, b) => toMinutes(a.battleStart) - toMinutes(b.battleStart));

  for (const slot of ordered) {
    const battle = toMinutes(slot.battleStart);
    if (nowM < battle) {
      const reg = toMinutes(slot.registrationOpen);
      return {
        slot,
        message:
          nowM < reg
            ? `Регистрация с ${formatHM(slot.registrationOpen)}, бой в ${formatHM(slot.battleStart)}`
            : `Регистрация до ${formatHM(slot.battleStart)}, затем бой`,
      };
    }
  }
  return null;
}

export { formatHM, BATTLE_WINDOW_MIN };
