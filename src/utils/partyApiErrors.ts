/** Людські тексти для кодів помилок `/parties/*` (тіло `{ error: string }`). */
export function formatPartyApiError(err: unknown): string {
  const e = err as { message?: string; body?: { error?: string } };
  const code = String(e?.body?.error ?? e?.message ?? "").trim();
  if (code === "already_in_party") return "Игрок уже в пати";
  if (code === "party_full") return "У групі вже максимум учасників (5).";
  if (code === "invalid input") return "Некоректний запит.";
  if (code === "not found") return "Не знайдено.";
  if (code === "rate limited") return "Занадто часто. Спробуйте пізніше.";
  return code && code !== "forbidden" ? code : "Помилка";
}
