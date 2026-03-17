/**
 * Централізований баланс для допа-сервера.
 * Цілі: тяжкі моби (не з одного удару), повільна прокачка, збалансований PvP, різні ролі класів.
 */

/** Множник HP мобів — вищий = моби живучіші, більше хітів для вбивства */
export const MOB_HP_MULTIPLIER = 2.5;

/** Множник захисту мобів (pDef, mDef) — вищий = менше урону по мобах */
export const MOB_DEFENSE_MULTIPLIER = 1.8;

/** Швидкість отримання EXP (1 = норма, 0.5 = вдвічі повільніше, 0.7 = не качнешся за місяць до 80) */
export const EXP_GAIN_RATE = 0.65;

/** Швидкість отримання SP — окремо від EXP */
export const SP_GAIN_RATE = 0.75;

/** Поріг різниці рівнів (моб — герой): якщо mobLevel - heroLevel > цей поріг — застосовується пенальті до EXP (щоб не качитися за один кіл) */
export const EXP_LEVEL_DIFF_THRESHOLD = 5;

/** Коефіцієнт пеналті: mult = 1 / (1 + (diff - threshold) * FACTOR). При diff=10, threshold=5: mult ≈ 0.57 */
export const EXP_LEVEL_DIFF_PENALTY_FACTOR = 0.15;

/** Фізичний урон героя vs моб: множник ефективного pDef моба (вищий = моб живучіший) */
export const HERO_VS_MOB_DEFENSE_FACTOR = 0.65;

/** Множник базових бойових статів героя (0.5 = слабкі, 0.8 = сильніші, різниця між класами помітніша) */
export const HERO_STAT_MULTIPLIER = 0.75;

/** Вплив pAtk/mAtk на урон скілів: 0.2 = майже тільки power, 0.6 = зброя/стат мають значення */
export const SKILL_PHYSICAL_ATK_FACTOR = 0.5;
export const SKILL_MAGIC_ATK_FACTOR = 0.7;

/** L2-стиль: коефіцієнт фізичного урону (70 = класична L2 формула damage = 70*pAtk/pDef) */
export const L2_PHYSICAL_COEFFICIENT = 70;

/** L2-стиль: коефіцієнт магічного урону — damage = C * (mAtk + 2*power) / mDef */
export const L2_MAGIC_COEFFICIENT = 70;

/** Множник PvE для збалансування L2 формули під наші моби (MOB_HP_MULTIPLIER, тощо) */
export const L2_PVE_DAMAGE_MULTIPLIER = 2.8;

/**
 * Пенальті EXP за різницю рівнів: якщо моб значно вищий за героя — зменшуємо exp.
 * Запобігає "1 моб = 5 лвл" на L2DOP та mix-spawn зонах.
 */
export function getExpLevelDiffMultiplier(heroLevel: number, mobLevel: number): number {
  const hero = Math.max(1, Number(heroLevel) || 1);
  const mob = Math.max(1, Number(mobLevel) || 1);
  const diff = Math.max(0, mob - hero);
  if (diff <= EXP_LEVEL_DIFF_THRESHOLD) return 1;
  return 1 / (1 + (diff - EXP_LEVEL_DIFF_THRESHOLD) * EXP_LEVEL_DIFF_PENALTY_FACTOR);
}
