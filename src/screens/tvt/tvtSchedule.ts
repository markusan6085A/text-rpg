/**
 * Розклад TvT: 3 слоти на день.
 * Реєстрація — 5 хв до старту бою (як у ТЗ: 13:40 реєстрація, 13:45 старт).
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

/** За замовчуванням — три слоти; час можна змінити тут або винести в конфіг/API. */
export const TVT_DAILY_SLOTS: TvtDailySlot[] = [
  {
    id: "morning",
    label: "Утро",
    registrationOpen: { h: 13, m: 40 },
    battleStart: { h: 13, m: 45 },
  },
  {
    id: "day",
    label: "День",
    registrationOpen: { h: 18, m: 40 },
    battleStart: { h: 18, m: 45 },
  },
  {
    id: "evening",
    label: "Вечер",
    registrationOpen: { h: 21, m: 40 },
    battleStart: { h: 21, m: 45 },
  },
];

/** Тривалість «бою» у хвилинах для відображення фази (до наступного слоту або кінця доби). */
const BATTLE_WINDOW_MIN = 45;

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
