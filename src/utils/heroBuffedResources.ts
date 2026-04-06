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
  const hj = ((hero as any)?.heroJson || {}) as Record<string, any>;
  const dr = hj.displayResources;
  if (dr && typeof dr === "object") {
    const mh = Math.floor(Number(dr.maxHp));
    const mm = Math.floor(Number(dr.maxMp));
    const mc = Math.floor(Number(dr.maxCp));
    if (Number.isFinite(mh) && mh > 0 && Number.isFinite(mm) && mm > 0 && Number.isFinite(mc) && mc > 0) {
      return { maxHp: mh, maxMp: mm, maxCp: mc };
    }
  }
  const baseMax = getMaxResources(hero);
  const buffs = getCombinedHeroBuffs(hero, inBattle);
  return computeBuffedMaxResources(baseMax, buffs);
}

/** Поточні HP/MP/CP і max з урахуванням бафів — одна логіка для HUD і екранів. */
export function getHeroResourceValues(hero: Hero, inBattle: boolean) {
  const caps = getHeroBuffedResourceCaps(hero, inBattle);
  const hj = ((hero as any)?.heroJson || {}) as Record<string, any>;
  const dr = hj.displayResources;
  if (dr && typeof dr === "object") {
    const mh = Math.floor(Number(dr.maxHp));
    const mm = Math.floor(Number(dr.maxMp));
    const mc = Math.floor(Number(dr.maxCp));
    if (mh === caps.maxHp && mm === caps.maxMp && mc === caps.maxCp) {
      const h = Number(dr.hp);
      const m = Number(dr.mp);
      const c = Number(dr.cp);
      return {
        hp: Number.isFinite(h) && h >= 0 ? h : hero.hp ?? caps.maxHp,
        mp: Number.isFinite(m) && m >= 0 ? m : hero.mp ?? caps.maxMp,
        cp: Number.isFinite(c) && c >= 0 ? c : hero.cp ?? caps.maxCp,
        maxHp: caps.maxHp,
        maxMp: caps.maxMp,
        maxCp: caps.maxCp,
      };
    }
  }
  return {
    hp: hero.hp ?? caps.maxHp,
    mp: hero.mp ?? caps.maxMp,
    cp: hero.cp ?? caps.maxCp,
    maxHp: caps.maxHp,
    maxMp: caps.maxMp,
    maxCp: caps.maxCp,
  };
}

/**
 * У консолі: serverBaseHp, serverBaseMaxHp, buffedMaxHp (+ computedBuffedHp).
 * Увімкнути в проді: `localStorage.setItem("debugPveHp","1")` або `sessionStorage` з тим самим ключем, потім F5.
 */
export function logPveBuffedResourceDebug(tag: string, info: Record<string, unknown>): void {
  try {
    if (typeof window === "undefined") return;
    const on =
      import.meta.env.DEV ||
      localStorage.getItem("debugPveHp") === "1" ||
      sessionStorage.getItem("debugPveHp") === "1";
    if (!on) return;
    console.log(`[PVE HP] ${tag}`, info);
  } catch {
    /* ignore */
  }
}

export type PveBuffedFromServerResult = {
  hp: number;
  mp: number;
  cp: number;
  buffedCaps: { maxHp: number; maxMp: number; maxCp: number };
  baseCaps: { maxHp: number; maxMp: number; maxCp: number };
  rawBase: { hp: number; mp: number; cp: number };
};

/**
 * Один шлях після онлайн PvE: base hp/mp/cp і base max з heroJson сервера → buffed абсолюти через **той самий**
 * getHeroBuffedResourceCaps, що й StatusBars (inBattle). Без окремих списків buffsForScale / computeBuffedMaxResources(recalc).
 */
export function buffedResourcesFromPveServerSnapshot(args: {
  hj: Record<string, any>;
  liveHero: Hero | null | undefined;
  mergedHeroBuffs: any[];
  fallbackBase?: { maxHp: number; maxMp: number; maxCp: number } | null;
}): PveBuffedFromServerResult {
  const h = args.hj && typeof args.hj === "object" ? args.hj : {};
  const fallback = args.fallbackBase ?? (args.liveHero ? getMaxResources(args.liveHero) : null);
  const baseCaps = pveSnapshotBaseCaps(h, fallback);
  const heroHud =
    args.liveHero && (args.liveHero as any).name
      ? ({
          ...args.liveHero,
          heroJson: { ...((args.liveHero as any).heroJson || {}), heroBuffs: args.mergedHeroBuffs },
        } as Hero)
      : null;
  const buffedCaps = heroHud
    ? getHeroBuffedResourceCaps(heroHud, true)
    : {
        maxHp: baseCaps.maxHp,
        maxMp: baseCaps.maxMp,
        maxCp: baseCaps.maxCp,
      };

  const bmh = baseCaps.maxHp;
  const bmm = baseCaps.maxMp;
  const bmc = baseCaps.maxCp;
  const hpPct = resourceFillRatio(h.hp, bmh, h.hpPercent);
  const mpPct = resourceFillRatio(h.mp, bmm, h.mpPercent);
  const cpPct = resourceFillRatio(h.cp, bmc, h.cpPercent);

  const hp = Math.min(buffedCaps.maxHp, Math.max(0, Math.round(hpPct * buffedCaps.maxHp)));
  const mp = Math.min(buffedCaps.maxMp, Math.max(0, Math.round(mpPct * buffedCaps.maxMp)));
  const cp = Math.min(buffedCaps.maxCp, Math.max(0, Math.round(cpPct * buffedCaps.maxCp)));

  return {
    hp,
    mp,
    cp,
    buffedCaps,
    baseCaps,
    rawBase: {
      hp: Math.floor(Number(h.hp ?? 0)),
      mp: Math.floor(Number(h.mp ?? 0)),
      cp: Math.floor(Number(h.cp ?? 0)),
    },
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

/**
 * Після онлайн PvE-мутації сервер клампить heroJson до base max із БД (див. attachBaseResources).
 * Для resourceFillRatio знаменник має збігатися з цим hp/mp/cp — інакше root hero.baseMaxHp, що роз’їхався
 * з колонками, дає «провал» смуги (~половина HP після тіку).
 */
export function pveSnapshotBaseCaps(
  hj: Record<string, any> | null | undefined,
  fallback: { maxHp: number; maxMp: number; maxCp: number } | null | undefined,
): { maxHp: number; maxMp: number; maxCp: number } {
  const f = fallback ?? { maxHp: 1, maxMp: 1, maxCp: 1 };
  const h = hj && typeof hj === "object" ? hj : {};
  const pick = (baseKey: unknown, maxKey: unknown, fb: number) => {
    const a = Math.floor(Number(baseKey));
    if (Number.isFinite(a) && a > 0) return Math.max(1, a);
    const b = Math.floor(Number(maxKey));
    if (Number.isFinite(b) && b > 0) return Math.max(1, b);
    const c = Math.floor(Number(fb));
    return Math.max(1, Number.isFinite(c) && c > 0 ? c : 1);
  };
  return {
    maxHp: pick(h.baseMaxHp, h.maxHp, f.maxHp),
    maxMp: pick(h.baseMaxMp, h.maxMp, f.maxMp),
    maxCp: pick(h.baseMaxCp, h.maxCp, f.maxCp),
  };
}

