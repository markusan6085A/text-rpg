/**
 * Час циклу «7 Печатей» (Europe/Warsaw):
 * - Збір медалей: понеділок 00:00 … субота < 22:00
 * - Пауза / фіксація: субота 22:00 … неділя 23:59 (медалі не випадають)
 * - Новий цикл: понеділок 00:00 — новий weekStart, лідерборд обнуляється для нового тижня
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

export function getWarsawCalendarParts(d: Date): {
  y: number;
  m: number;
  day: number;
  dow: number;
  hour: number;
  minute: number;
} {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
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
    y: parseInt(g("year"), 10),
    m: parseInt(g("month"), 10),
    day: parseInt(g("day"), 10),
    dow: DOW_MAP[wk] ?? 0,
    hour: parseInt(g("hour"), 10) || 0,
    minute: parseInt(g("minute"), 10) || 0,
  };
}

/** Додати дні до Y-M-D (григоріанський календар) */
function addCalendarDaysYMD(
  y: number,
  m: number,
  d: number,
  delta: number
): { y: number; m: number; d: number } {
  const x = new Date(Date.UTC(y, m - 1, d + delta));
  return { y: x.getUTCFullYear(), m: x.getUTCMonth() + 1, d: x.getUTCDate() };
}

/** Понеділок (Y-M-D у Варшаві) тижня, в якому знаходиться `now` */
function warsawMondayYMD(now: Date): { y: number; m: number; d: number } {
  const { y, m, day, dow } = getWarsawCalendarParts(now);
  const daysBack = dow === 0 ? 6 : dow - 1;
  return addCalendarDaysYMD(y, m, day, -daysBack);
}

/**
 * UTC-момент понеділка 00:00:00 за годинником у Europe/Warsaw
 * для тижня збору, в якому зараз `now`.
 */
export function getSevenSealsWeekMondayStart(now: Date = new Date()): Date {
  const { y, m, d } = warsawMondayYMD(now);
  return zonedWallMidnightToUtc(y, m, d, TZ);
}

/**
 * Останній тиждень збору, що вже закрився (субота 22:00 за Варшавою минула)
 * відносно поточного `now`.
 * - Неділя: понеділок тижня, який щойно «закрився».
 * - Пн–Пт: попередній повний тиждень (поточний ще триває).
 * - Субота до 22:00: як Пн–Пт (останній закритий — минулий тиждень).
 * - Субота з 22:00: тиждень, що щойно закрився (цей понеділок).
 */
export function getLastCompletedSevenSealsWeekMondayStart(now: Date = new Date()): Date {
  const { y, m, day, dow, hour, minute } = getWarsawCalendarParts(now);
  const thisMonYmd = warsawMondayYMD(now);
  const thisMon = zonedWallMidnightToUtc(thisMonYmd.y, thisMonYmd.m, thisMonYmd.d, TZ);

  if (dow === 0) {
    return thisMon;
  }
  if (dow === 6) {
    const mins = hour * 60 + minute;
    if (mins >= 22 * 60) {
      return thisMon;
    }
  }
  const prev = addCalendarDaysYMD(y, m, day, -7);
  return zonedWallMidnightToUtc(prev.y, prev.m, prev.d, TZ);
}

/** UTC instant: на стіні годинника в `timeZone` дата Y-M-D і година 00:00 */
export function zonedWallMidnightToUtc(
  y: number,
  m: number,
  d: number,
  timeZone: string
): Date {
  const targetStr = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const anchor = Date.UTC(y, m - 1, d, 12, 0, 0, 0);
  let found = -1;
  for (let off = -40 * 3600000; off <= 40 * 3600000; off += 5 * 60 * 1000) {
    const guess = anchor + off;
    const ds = new Date(guess).toLocaleDateString("en-CA", { timeZone });
    if (ds !== targetStr) continue;
    const hour = parseInt(
      new Intl.DateTimeFormat("en-US", {
        timeZone,
        hour: "numeric",
        hour12: false,
      }).format(new Date(guess)),
      10
    );
    if (hour === 0) found = guess;
  }
  if (found < 0) return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
  let g = found;
  for (let i = 0; i < 200; i++) {
    const prev = g - 60 * 1000;
    const dsP = new Date(prev).toLocaleDateString("en-CA", { timeZone });
    const hP = parseInt(
      new Intl.DateTimeFormat("en-US", {
        timeZone,
        hour: "numeric",
        hour12: false,
      }).format(new Date(prev)),
      10
    );
    if (dsP !== targetStr || hP !== 0) break;
    g = prev;
  }
  return new Date(g);
}

/** UTC instant для Y-M-D HH:MM на стіні годинника в timeZone */
export function zonedWallClockToUtc(
  y: number,
  m: number,
  d: number,
  hour: number,
  minute: number,
  timeZone: string
): Date {
  const targetStr = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const anchor = Date.UTC(y, m - 1, d, 12, 0, 0, 0);
  let found = -1;
  for (let off = -40 * 3600000; off <= 40 * 3600000; off += 60 * 1000) {
    const guess = anchor + off;
    const ds = new Date(guess).toLocaleDateString("en-CA", { timeZone });
    if (ds !== targetStr) continue;
    const h = parseInt(
      new Intl.DateTimeFormat("en-US", {
        timeZone,
        hour: "numeric",
        hour12: false,
      }).format(new Date(guess)),
      10
    );
    const min = parseInt(
      new Intl.DateTimeFormat("en-US", {
        timeZone,
        minute: "numeric",
      }).format(new Date(guess)),
      10
    );
    if (h === hour && min === minute) found = guess;
  }
  if (found < 0) {
    return new Date(Date.UTC(y, m - 1, d, hour - 1, minute, 0));
  }
  return new Date(found);
}

/** Чи минув кінець івенту для тижня, що починається в weekMondayStartUtc (пн 00:00 Варшава) */
export function isSevenSealsWeekClosed(weekMondayStartUtc: Date, now: Date = new Date()): boolean {
  const { y, m, day } = getWarsawCalendarParts(weekMondayStartUtc);
  const satYmd = addCalendarDaysYMD(y, m, day, 5);
  const closeUtc = zonedWallClockToUtc(satYmd.y, satYmd.m, satYmd.d, 22, 0, TZ);
  return now.getTime() >= closeUtc.getTime();
}

/**
 * Тиждень (його понеділок), який потрібно зафіксувати зараз, або null.
 * Повертає weekStart лищ eякщо для нього вже настав субот 22:00 і він ще не обов'язково оброблений (перевірка KV — зовні).
 */
export function getSevenSealsWeekPendingFinalization(now: Date = new Date()): Date | null {
  const thisWeekMon = getSevenSealsWeekMondayStart(now);
  if (isSevenSealsWeekClosed(thisWeekMon, now)) {
    return thisWeekMon;
  }
  const { y, m, day } = getWarsawCalendarParts(thisWeekMon);
  const prevYmd = addCalendarDaysYMD(y, m, day, -7);
  const prevWeekMon = zonedWallMidnightToUtc(prevYmd.y, prevYmd.m, prevYmd.d, TZ);
  if (isSevenSealsWeekClosed(prevWeekMon, now)) {
    return prevWeekMon;
  }
  return null;
}

/**
 * Наступний момент «субота 22:00» за Варшавою строго після `from`
 * (кінець дії бонусу переможця — до наступного фіналу).
 */
export function getNextSevenSealsSaturday22UtcAfter(from: Date = new Date()): Date {
  const fromMs = from.getTime();
  const { y, m, day, dow } = getWarsawCalendarParts(from);
  const daysToSat = (6 - dow + 7) % 7;
  let sat = addCalendarDaysYMD(y, m, day, daysToSat);
  let closeUtc = zonedWallClockToUtc(sat.y, sat.m, sat.d, 22, 0, TZ);
  if (closeUtc.getTime() <= fromMs) {
    sat = addCalendarDaysYMD(sat.y, sat.m, sat.d, 7);
    closeUtc = zonedWallClockToUtc(sat.y, sat.m, sat.d, 22, 0, TZ);
  }
  return closeUtc;
}

/** Чи зараз можна добувати медалі: понеділок–субота до 22:00 (Варшава), неділя — ні, субота 22:00+ — ні */
export function isSevenSealsFarmWindowActive(now: Date = new Date()): boolean {
  const { dow, hour, minute } = getWarsawCalendarParts(now);
  if (dow === 0) return false;
  if (dow === 6) {
    return hour * 60 + minute < 22 * 60;
  }
  return dow >= 1 && dow <= 5;
}

/** Технічна пауза (без дропу медалей): неділя або субота з 22:00 */
export function isSevenSealsTechnicalPause(now: Date = new Date()): boolean {
  return !isSevenSealsFarmWindowActive(now);
}

/** Неділя за Варшавою — день підсумку тижня */
export function isSundayPoland(now: Date = new Date()): boolean {
  return getWarsawCalendarParts(now).dow === 0;
}

/** Ключ тижня YYYY-MM-DD за календарем Варшави (понеділок циклу) */
export function weekStartKey(d: Date): string {
  const { y, m, day } = getWarsawCalendarParts(d);
  return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
