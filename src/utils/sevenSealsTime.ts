/** Клієнтські перевірки календаря 7 Печатей (Europe/Warsaw) — узгоджено з сервером */

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

function warsawDayOfWeek(now: Date): number {
  const fmt = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short" });
  const wk = fmt.format(now);
  return DOW_MAP[wk] ?? 0;
}

/** Понеділок–субота — медалі падають з мобів */
export function isSevenSealsFarmWindowActive(now: Date = new Date()): boolean {
  const d = warsawDayOfWeek(now);
  return d >= 1 && d <= 6;
}

/** Неділя — прибираємо медалі з відображення інвентаря (тиждень закрито) */
export function isSevenSealsInventoryClearDay(now: Date = new Date()): boolean {
  return warsawDayOfWeek(now) === 0;
}
