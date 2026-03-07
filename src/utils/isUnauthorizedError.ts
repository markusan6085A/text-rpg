/** Перевірка, чи помилка означає неавторизований доступ (401 / session expired) */
export function isUnauthorizedError(err: any): boolean {
  const msg = String(err?.message || err?.error || "").toLowerCase();
  return err?.unauthorized === true || err?.status === 401 || msg.includes("unauthorized");
}
