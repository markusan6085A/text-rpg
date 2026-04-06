/**
 * Плоский бонус до рейтингу точності за грейдом зброї (однаково для звичайного та квест-магазину).
 * Застосовується в calcCombatStats для всіх kind === "weapon".
 */
export const WEAPON_GRADE_ACCURACY_BONUS: Record<string, number> = {
  D: 24,
  C: 38,
  B: 52,
  A: 68,
  S: 102,
};

export function getWeaponAccuracyBonusByGrade(grade: string | null | undefined): number {
  if (grade == null || grade === "") return 0;
  const k = String(grade).trim().toUpperCase();
  return WEAPON_GRADE_ACCURACY_BONUS[k] ?? 0;
}
