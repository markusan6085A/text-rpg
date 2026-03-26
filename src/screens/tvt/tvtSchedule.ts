/**
 * Розклад TvT: один щоденний слот (синхронно з сервером `server/.../tvt/schedule.ts`).
 * Реєстрація 17:00–17:05, старт 17:05. Фази = ігровий час як у новинах (`gameClock.ts`), синхронно з сервером.
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
    registrationOpen: { h: 17, m: 0 },
    battleStart: { h: 17, m: 5 },
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

/** Відображення «ігрового» часу (хвилини від півночі, як на сервері). */
export function formatMinutesAsClock(minutesSinceMidnight: number): string {
  const x = ((Math.floor(minutesSinceMidnight) % 1440) + 1440) % 1440;
  const h = Math.floor(x / 60);
  const min = x % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
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

export function minutesSinceMidnightFromDate(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

/**
 * Фаза слоту за «хвилинами від півночі» (0..1439) — на клієнті використовуй хвилини сервера з API.
 * Реєстрація: [regOpen, battleStart), бій: [battleStart, battleStart + BATTLE_WINDOW).
 */
export function getSlotStatusFromMinutes(nowMinutes: number, slot: TvtDailySlot): TvtSlotStatus {
  const nowM = ((Math.floor(nowMinutes) % 1440) + 1440) % 1440;
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

/** Локальний час браузера (fallback до першого відповіді API). */
export function getSlotStatus(now: Date, slot: TvtDailySlot): TvtSlotStatus {
  return getSlotStatusFromMinutes(minutesSinceMidnightFromDate(now), slot);
}

/** Найближчий слот за часом (для підказки «наступний TvT»). */
export function getNextSlotHint(now: Date): { slot: TvtDailySlot; message: string } | null {
  const nowM = minutesSinceMidnightFromDate(now);
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
