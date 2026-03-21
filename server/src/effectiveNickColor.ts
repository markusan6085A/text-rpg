/** Єдиний колір ніка для API: PK-тимчасові → heroJson → колонка Character.nickColor */
export function getEffectiveNickColor(
  heroJson: any,
  columnNick?: string | null
): string | undefined {
  const now = Date.now();
  const forced = String(heroJson?.pkForcedNickColor ?? "").trim();
  const forcedUntil = Number(heroJson?.pkForcedNickColorUntil);
  if (forced && (!Number.isFinite(forcedUntil) || forcedUntil > now)) return forced;
  const combat = String(heroJson?.pkCombatNickColor ?? "").trim();
  const combatUntil = Number(heroJson?.pkCombatNickColorUntil);
  if (combat && Number.isFinite(combatUntil) && combatUntil > now) return combat;
  // Порожній рядок у heroJson не має блокувати колонку Character.nickColor (?? не замінює "")
  const fromJson = String(heroJson?.nickColor ?? "").trim();
  const fromCol = String(columnNick ?? "").trim();
  const base = fromJson || fromCol;
  return base || undefined;
}
