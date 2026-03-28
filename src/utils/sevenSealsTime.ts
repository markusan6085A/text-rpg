/**
 * Клієнтські перевірки циклу 7 Печатей (Europe/Warsaw) — узгоджено з server/src/sevenSealsTime.ts
 * Збір медалей: понеділок 00:00 … субота < 22:00; пауза: субота 22:00+ та неділя.
 */

const TZ = "Europe/Warsaw";

const DOW_MAP: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function getWarsawCalendarParts(d: Date): {
  dow: number;
  hour: number;
  minute: number;
} {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(d);
  const g = (t: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === t)?.value ?? "";
  const wk = g("weekday");
  return {
    dow: DOW_MAP[wk] ?? 0,
    hour: parseInt(g("hour"), 10) || 0,
    minute: parseInt(g("minute"), 10) || 0,
  };
}

/** Понеділок–субота до 22:00 — медалі можуть падати з мобів */
export function isSevenSealsFarmWindowActive(now: Date = new Date()): boolean {
  const { dow, hour, minute } = getWarsawCalendarParts(now);
  if (dow === 0) return false;
  if (dow === 6) {
    return hour * 60 + minute < 22 * 60;
  }
  return dow >= 1 && dow <= 5;
}

/** Неділя — день паузи (прибирання медалей з відображення інвентаря тощо) */
export function isSevenSealsInventoryClearDay(now: Date = new Date()): boolean {
  return getWarsawCalendarParts(now).dow === 0;
}

/** Пауза івенту: неділя або субота 22:00+ */
export function isSevenSealsTechnicalPause(now: Date = new Date()): boolean {
  return !isSevenSealsFarmWindowActive(now);
}
