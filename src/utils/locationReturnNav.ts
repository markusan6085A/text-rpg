/**
 * Якщо гравець на /location і переходить на інший екран — зберігаємо повний шлях,
 * щоб показати кнопку «Окрестности» для повернення.
 */
const KEY = "l2_return_from_location_v1";

export function rememberLocationIfLeaving(
  pathname: string,
  search: string,
  targetPath: string,
): void {
  const norm = (pathname || "/").replace(/\/+$/, "") || "/";
  if (norm !== "/location") return;
  const t = (targetPath || "").split("?")[0]?.replace(/\/+$/, "") || "";
  if (t === "/location" || targetPath.startsWith("/location?")) return;
  try {
    const full = `${pathname}${search || ""}`;
    sessionStorage.setItem(KEY, full);
  } catch {
    /* ignore */
  }
}

export function peekLocationReturnHref(): string | null {
  try {
    const v = sessionStorage.getItem(KEY);
    return v && v.startsWith("/") ? v : null;
  } catch {
    return null;
  }
}

export function clearLocationReturnHref(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** Повернути збережений шлях і видалити (після навігації назад). */
export function consumeLocationReturnHref(): string | null {
  const v = peekLocationReturnHref();
  if (v) clearLocationReturnHref();
  return v;
}
