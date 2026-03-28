import { loadBattle } from "../state/battle/persist";
import { cleanupBuffs, computeBuffedMaxResources } from "../state/battle/helpers";
import { getMaxResources } from "../state/battle/helpers/getMaxResources";
import { useBattleStore } from "../state/battle/store";
import type { Hero } from "../types/Hero";

/** Ті самі об’єднані бафи, що й у StatusBars (статуя / бій / heroJson). */
export function getCombinedHeroBuffs(
  hero: Hero | null | undefined,
  inBattleNow: boolean,
): any[] {
  if (!hero?.name) return [];
  const now = Date.now();
  const savedBattle = loadBattle(hero.name);
  const savedBuffs = cleanupBuffs(savedBattle?.heroBuffs || [], now);
  const battleBuffs = cleanupBuffs(useBattleStore.getState().heroBuffs || [], now);
  const heroJson = (hero as any)?.heroJson || {};
  const heroJsonBuffs = Array.isArray(heroJson.heroBuffs) ? heroJson.heroBuffs : [];
  const activeHeroJsonBuffs = heroJsonBuffs.filter((b: any) => b?.expiresAt && b.expiresAt > now);

  const baseBuffs = inBattleNow ? battleBuffs : savedBuffs;
  const all = [...baseBuffs, ...activeHeroJsonBuffs];
  return all.filter((buff, index, self) =>
    index ===
    self.findIndex((b) =>
      (b.id && buff.id && b.id === buff.id) || (!b.id && !buff.id && b.name === buff.name),
    ),
  );
}

export function getHeroBuffedResourceCaps(hero: Hero, inBattle: boolean) {
  const baseMax = getMaxResources(hero);
  const buffs = getCombinedHeroBuffs(hero, inBattle);
  return computeBuffedMaxResources(baseMax, buffs);
}

/** Поточні HP/MP/CP і max з урахуванням бафів — одна логіка для HUD і екранів. */
export function getHeroResourceValues(hero: Hero, inBattle: boolean) {
  const { maxHp, maxMp, maxCp } = getHeroBuffedResourceCaps(hero, inBattle);
  return {
    hp: hero.hp ?? maxHp,
    mp: hero.mp ?? maxMp,
    cp: hero.cp ?? maxCp,
    maxHp,
    maxMp,
    maxCp,
  };
}
