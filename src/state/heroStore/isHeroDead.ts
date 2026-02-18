/**
 * Єдина перевірка "герой мертвий" тільки з heroJson (НЕ hp<=0), щоб короткий "0" під час апдейтів
 * не закріплював себе. Для тіків (idle regen, regenTick, processMobAttack) та load.
 */
export function isHeroDead(hero: any): boolean {
  const hj = hero?.heroJson || {};
  return Boolean(hj.isDead) || Number(hj.deadAt || 0) > 0;
}
