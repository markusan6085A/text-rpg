import { loadBattle } from "../state/battle/persist";
import { cleanupBuffs, computeBuffedMaxResources } from "../state/battle/helpers";
import { getMaxResources } from "../state/battle/helpers/getMaxResources";
import { filterBuffsForHeroProfession } from "../state/battle/loadout";
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
  const deduped = all.filter((buff, index, self) =>
    index ===
    self.findIndex((b) =>
      (b.id && buff.id && b.id === buff.id) || (!b.id && !buff.id && b.name === buff.name),
    ),
  );
  return filterBuffsForHeroProfession(hero, deduped);
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

/**
 * Серверний heroBuffs може бути «урезаний» vs клієнт (місто/скроли/паті лише локально).
 * Для caps HP при PvE snapshot об’єднуємо списки (dedupe), інакше buffed max занижується → смуги «падають».
 */
export function mergeServerAndClientBuffsForResourceScaling(
  serverBuffs: any[] | undefined,
  clientBuffs: any[],
): any[] {
  const merged = [...(Array.isArray(serverBuffs) ? serverBuffs : []), ...clientBuffs];
  return merged.filter(
    (buff, i, arr) =>
      arr.findIndex((b) =>
        (b.id && buff.id && b.id === buff.id) || (!b.id && !buff.id && b.name === buff.name),
      ) === i,
  );
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

function normalizeStoredResourcePercent(raw: unknown): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return NaN;
  if (n > 1 && n <= 100) return clamp01(n / 100);
  return clamp01(n);
}

/**
 * Сервер зберігає hp/mp/cp у heroJson у масштабі base max (див. heroPersistence).
 * Після applyServerSync клієнтський max з buffs вищий — без масштабування смуги HUD показують ~половину після PvE snapshot.
 */
export function scalePveSnapshotHpMpCpToBuffed(
  hj: Record<string, any>,
  buffsForScaling: any[],
  now = Date.now(),
): { hp: number; mp: number; cp: number } {
  const cleaned = cleanupBuffs(buffsForScaling, now);
  const bmh = Math.max(1, Math.floor(Number(hj.maxHp ?? 1)));
  const bmm = Math.max(1, Math.floor(Number(hj.maxMp ?? 1)));
  const bmc = Math.max(1, Math.floor(Number(hj.maxCp ?? 1)));
  const buffed = computeBuffedMaxResources(
    { maxHp: bmh, maxMp: bmm, maxCp: bmc },
    cleaned as any,
  );
  const hpPctRaw = normalizeStoredResourcePercent(hj.hpPercent);
  const mpPctRaw = normalizeStoredResourcePercent(hj.mpPercent);
  const cpPctRaw = normalizeStoredResourcePercent(hj.cpPercent);
  const hpPct = Number.isFinite(hpPctRaw) ? hpPctRaw : (bmh > 0 ? clamp01(Number(hj.hp ?? 0) / bmh) : 1);
  const mpPct = Number.isFinite(mpPctRaw) ? mpPctRaw : (bmm > 0 ? clamp01(Number(hj.mp ?? 0) / bmm) : 1);
  const cpPct = Number.isFinite(cpPctRaw) ? cpPctRaw : (bmc > 0 ? clamp01(Number(hj.cp ?? 0) / bmc) : 1);
  return {
    hp: Math.min(buffed.maxHp, Math.max(0, Math.round(hpPct * buffed.maxHp))),
    mp: Math.min(buffed.maxMp, Math.max(0, Math.round(mpPct * buffed.maxMp))),
    cp: Math.min(buffed.maxCp, Math.max(0, Math.round(cpPct * buffed.maxCp))),
  };
}
