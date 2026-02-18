/**
 * Єдина перевірка "герой мертвий" для всіх тіків (idle regen, regenTick, processMobAttack)
 * та load — щоб не перезаписувати hp/mp/cp і не персистити snapshot поверх оживлення.
 */
export function isHeroDead(hero: any): boolean {
  const hj = hero?.heroJson || {};
  return Boolean(hj.isDead) || Number(hj.deadAt || 0) > 0 || Number(hero?.hp ?? 0) <= 0;
}
