/** Sync heroJson.level vs Character.level for display (client may update JSON before column catches up). */
export function effectiveCharacterLevel(char: { level?: number | null; heroJson?: unknown }): number {
  const hj = (char.heroJson as Record<string, unknown>) || {};
  const fromCol = Number(char.level);
  const fromJson = Number(hj.level);
  const a = Number.isFinite(fromCol) && fromCol > 0 ? fromCol : 0;
  const b = Number.isFinite(fromJson) && fromJson > 0 ? fromJson : 0;
  const m = Math.max(a, b);
  return m > 0 ? m : 1;
}
