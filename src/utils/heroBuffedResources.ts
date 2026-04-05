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

  /** У бою: merge як у scalePve (heroJson → battle, dedupe з пріоритетом json). Інакше maxHp у HUD був вищий за max
   * у scalePveSnapshot — той самий hero.hp виглядав як «мінус пів смуги» при дрібному уроні в логу.
   */
  if (inBattleNow) {
    const merged = mergeServerAndClientBuffsForResourceScaling(heroJsonBuffs, battleBuffs);
    return filterBuffsForHeroProfession(hero, cleanupBuffs(merged, now));
  }

  const activeHeroJsonBuffs = heroJsonBuffs.filter((b: any) => b?.expiresAt && b.expiresAt > now);
  const all = [...savedBuffs, ...activeHeroJsonBuffs];
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

/** Повний набір бафів для cap HP/MP при PvE snapshot (сервер + попередній heroJson + бойовий стор). */
export function mergeHeroBuffsForPveResourceScaling(
  serverBuffs: any[] | undefined,
  prevHeroJsonBuffs: any[] | undefined,
  clientBattleBuffs: any[],
): any[] {
  const prev = Array.isArray(prevHeroJsonBuffs) ? prevHeroJsonBuffs : [];
  const step = mergeServerAndClientBuffsForResourceScaling(serverBuffs, prev);
  return mergeServerAndClientBuffsForResourceScaling(step, clientBattleBuffs);
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

function normalizeStoredResourcePercent(raw: unknown): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return NaN;
  if (n > 1 && n <= 100) return clamp01(n / 100);
  return clamp01(n);
}

/**
 * Доля поточних hp/mp/cp у base-просторі. Абсолюти зі snapshot мають пріоритет над hpPercent/mpPercent:
 * після витрат MP/скилів відсотки в БД часто лишаються старими → інакше кожен pve-battle-tick «ріжe» MP/CP у HUD.
 */
function resourceFillRatio(currentRaw: unknown, baseMax: number, storedPercentRaw: unknown): number {
  const bm = Math.max(1, Math.floor(baseMax));
  const cur = Number(currentRaw);
  if (Number.isFinite(cur) && bm > 0) return clamp01(cur / bm);
  const p = normalizeStoredResourcePercent(storedPercentRaw);
  return Number.isFinite(p) ? p : 1;
}

function pickBaseMaxFromSnapshot(
  fromHero: number | undefined,
  hjBaseKey: unknown,
  hjMaxKey: unknown
): number {
  if (typeof fromHero === "number" && Number.isFinite(fromHero) && fromHero > 0) {
    return Math.max(1, Math.floor(fromHero));
  }
  const b = Number(hjBaseKey);
  if (Number.isFinite(b) && b > 0) return Math.max(1, Math.floor(b));
  const m = Number(hjMaxKey);
  return Math.max(1, Math.floor(Number.isFinite(m) && m > 0 ? m : 1));
}

/**
 * Сервер зберігає hp/mp/cp у heroJson у масштабі base max (див. heroPersistence).
 * Після applyServerSync клієнтський max з buffs вищий — без масштабування смуги HUD показують ~половину після PvE snapshot.
 *
 * `baseCaps` з getMaxResources(hero) — коли hj.maxHp у знімку вже «бафнутий» з PUT, а hp лишився базовим (типово після pve-battle-tick).
 */
export function scalePveSnapshotHpMpCpToBuffed(
  hj: Record<string, any>,
  buffsForScaling: any[],
  now = Date.now(),
  baseCaps?: { maxHp: number; maxMp: number; maxCp: number } | null,
): { hp: number; mp: number; cp: number } {
  const cleaned = cleanupBuffs(buffsForScaling, now);
  const bmh = pickBaseMaxFromSnapshot(baseCaps?.maxHp, hj.baseMaxHp, hj.maxHp);
  const bmm = pickBaseMaxFromSnapshot(baseCaps?.maxMp, hj.baseMaxMp, hj.maxMp);
  const bmc = pickBaseMaxFromSnapshot(baseCaps?.maxCp, hj.baseMaxCp, hj.maxCp);
  const buffed = computeBuffedMaxResources(
    { maxHp: bmh, maxMp: bmm, maxCp: bmc },
    cleaned as any,
  );
  const hpPct = resourceFillRatio(hj.hp, bmh, hj.hpPercent);
  const mpPct = resourceFillRatio(hj.mp, bmm, hj.mpPercent);
  const cpPct = resourceFillRatio(hj.cp, bmc, hj.cpPercent);
  return {
    hp: Math.min(buffed.maxHp, Math.max(0, Math.round(hpPct * buffed.maxHp))),
    mp: Math.min(buffed.maxMp, Math.max(0, Math.round(mpPct * buffed.maxMp))),
    cp: Math.min(buffed.maxCp, Math.max(0, Math.round(cpPct * buffed.maxCp))),
  };
}
