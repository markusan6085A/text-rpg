/**
 * Єдина перевірка "герой мертвий".
 * Якщо hero.hp > 0 — завжди живий (щоб реген/збереження не обнуляли HP, навіть якщо heroJson.isDead ще не скинуто).
 * Інакше — за heroJson.isDead / deadAt.
 */
export function isHeroDead(hero: any): boolean {
  if (Number(hero?.hp ?? 0) > 0) return false;
  const hj = hero?.heroJson || {};
  return Boolean(hj.isDead) || Number(hj.deadAt || 0) > 0;
}
