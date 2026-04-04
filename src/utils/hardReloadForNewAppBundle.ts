/**
 * Після деплою або довгої паузи браузер може тримати старий index.html/чанки.
 * Один жорсткий перехід за сесію вкладки після появи сесії — підтягує свіжий бандл (аналог «нового входу»).
 */
const STORAGE_KEY = "l2_hard_reload_after_auth_done";

/** Викликати з logout — щоб наступний вхід знову зробив hard reload. */
export function clearHardReloadAfterAuthGate(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Якщо для цієї вкладки ще не робили — location.replace з cache-bust query.
 * @param redirectPath шлях після перезавантаження (напр. "/city"), інакше поточний URL.
 * @returns true якщо перезавантаження запущено (подальший код у виклику не потрібен)
 */
export function hardReloadOnceAfterAuth(redirectPath?: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (sessionStorage.getItem(STORAGE_KEY) === "1") return false;
    sessionStorage.setItem(STORAGE_KEY, "1");
    const path = redirectPath?.trim() || window.location.pathname + window.location.search;
    const url = new URL(path.startsWith("/") ? path : `/${path}`, window.location.origin);
    url.searchParams.set("_l2fr", String(Date.now()));
    window.location.replace(url.toString());
    return true;
  } catch {
    try {
      window.location.reload();
      return true;
    } catch {
      return false;
    }
  }
}

/** Прибрати службовий query з адресного рядка після завантаження. */
export function stripHardReloadQueryParam(): void {
  if (typeof window === "undefined") return;
  try {
    const u = new URL(window.location.href);
    if (!u.searchParams.has("_l2fr")) return;
    u.searchParams.delete("_l2fr");
    const q = u.searchParams.toString();
    window.history.replaceState(null, "", u.pathname + (q ? `?${q}` : "") + u.hash);
  } catch {
    /* ignore */
  }
}
