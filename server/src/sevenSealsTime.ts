/**
 * Час і межі тижня «7 Печатей» за календарем Europe/Warsaw.
 * Збір медалей: понеділок–субота; підсумок і листи — у неділю; нова доба з понеділка.
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
} {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
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
 * Останній повністю закритий період Пн–Сб: понеділок того тижня.
 * У неділю — щойно закінчений тиждень (той самий понеділок, що й ISO-тиждень).
 * Пн–Сб — попередній повний тиждень (ще не підбитий поточний).
 */
export function getLastCompletedSevenSealsWeekMondayStart(now: Date = new Date()): Date {
  const { y, m, d } = warsawMondayYMD(now);
  const { dow } = getWarsawCalendarParts(now);
  const thisMon = zonedWallMidnightToUtc(y, m, d, TZ);
  if (dow === 0) return thisMon;
  const prev = addCalendarDaysYMD(y, m, d, -7);
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

/** Чи зараз можна добувати медалі (пн–сб за Варшавою) */
export function isSevenSealsFarmWindowActive(now: Date = new Date()): boolean {
  const { dow } = getWarsawCalendarParts(now);
  return dow >= 1 && dow <= 6;
}

/** Неділя за Варшавою — день підсумку тижня */
export function isSundayPoland(now: Date = new Date()): boolean {
  return getWarsawCalendarParts(now).dow === 0;
}

/** Ключ тижня YYYY-MM-DD за календарем Варшави (не UTC ISO-день) */
export function weekStartKey(d: Date): string {
  const { y, m, day } = getWarsawCalendarParts(d);
  return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
