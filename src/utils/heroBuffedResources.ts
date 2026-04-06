import { loadBattle } from "../state/battle/persist";
import { cleanupBuffs, computeBuffedMaxResources } from "../state/battle/helpers";
import { getMaxResources } from "../state/battle/helpers/getMaxResources";
import {
  filterBuffsForHeroProfession,
  getSkillDef,
  getSkillDefForBattle,
} from "../state/battle/loadout";
import { processSkillEffects } from "../state/battle/actions/useSkill/buffHelpers";
import { useBattleStore } from "../state/battle/store";
import { useAuthStore } from "../state/authStore";
import { useCharacterStore } from "../state/characterStore";
import type { Hero } from "../types/Hero";

/** Якщо в snapshot немає `effects` (серіалізація / старі записи) — підставляємо з клиєнтського skill DB, інакше стати не змінюються. */
function hydrateEmptyBuffEffectsFromSkillDef(buff: any, hero: Hero): any {
  if (!buff || typeof buff !== "object") return buff;
  const eff = Array.isArray(buff.effects) ? buff.effects : [];
  if (eff.length > 0) return buff;
  const sidRaw = buff.id;
  const sid = typeof sidRaw === "number" ? sidRaw : Number(sidRaw);
  if (!Number.isFinite(sid) || sid <= 0) return buff;
  const learned = (hero.skills || []).find((s: any) => Number(s?.id) === sid);
  const lv = Math.max(1, Math.floor(Number((learned as any)?.level ?? 1)));
  const def =
    getSkillDefForBattle(hero.profession ?? null, hero.klass, hero.race, sid) ?? getSkillDef(sid);
  if (!def) return buff;
  if (def.category === "physical_attack" || def.category === "magic_attack") return buff;
  const levelDef = def.levels.find((l) => l.level === lv) ?? def.levels[0];
  if (!levelDef) return buff;
  let effects: any[];
  try {
    effects = processSkillEffects(def, levelDef);
  } catch {
    return buff;
  }
  if (!Array.isArray(effects) || effects.length === 0) return buff;
  return { ...buff, effects };
}

function finalizeBuffListForHero(hero: Hero, rawBuffs: any[], now: number): any[] {
  return filterBuffsForHeroProfession(hero, cleanupBuffs(rawBuffs, now)).map((b) =>
    hydrateEmptyBuffEffectsFromSkillDef(b, hero),
  );
}

/**
 * Онлайн-сесія: єдине джерело правди для бафів у UI — `hero.heroJson.heroBuffs`
 * після optimistic update / `applyCharacterSnapshotFromApi` / hero-buffs-sync.
 * Не змішуємо loadBattle + battle store + heroJson (звідси «не знімається / не дає»).
 */
export function isOnlineHeroBuffsJsonCanonical(): boolean {
  try {
    const auth = useAuthStore.getState();
    const cid = String(useCharacterStore.getState().characterId ?? "").trim();
    return Boolean(auth.isAuthenticated && !auth.sessionExpired && cid.length > 0);
  } catch {
    return false;
  }
}

/** Ті самі бафи, що й у StatusBars. Офлайн: merge loadBattle + battle + heroJson. Онлайн: лише heroJson.heroBuffs. */
export function getCombinedHeroBuffs(
  hero: Hero | null | undefined,
  inBattleNow: boolean,
): any[] {
  if (!hero?.name) return [];
  const now = Date.now();
  const heroJson = (hero as any)?.heroJson || {};
  const heroJsonBuffs = Array.isArray(heroJson.heroBuffs) ? heroJson.heroBuffs : [];

  if (isOnlineHeroBuffsJsonCanonical()) {
    return finalizeBuffListForHero(hero, heroJsonBuffs, now);
  }

  const savedBattle = loadBattle(hero.name);
  const savedBuffs = cleanupBuffs(savedBattle?.heroBuffs || [], now);
  const battleBuffs = cleanupBuffs(useBattleStore.getState().heroBuffs || [], now);

  /** У бою: merge як у scalePve (heroJson → battle, dedupe з пріоритетом json). Інакше maxHp у HUD був вищий за max
   * у scalePveSnapshot — той самий hero.hp виглядав як «мінус пів смуги» при дрібному уроні в логу.
   */
  if (inBattleNow) {
    const merged = mergeServerAndClientBuffsForResourceScaling(heroJsonBuffs, battleBuffs);
    return finalizeBuffListForHero(hero, merged, now);
  }

  const activeHeroJsonBuffs = heroJsonBuffs.filter((b: any) => b?.expiresAt && b.expiresAt > now);
  const all = [...savedBuffs, ...activeHeroJsonBuffs];
  const deduped = all.filter((buff, index, self) =>
    index ===
    self.findIndex((b) =>
      (b.id && buff.id && b.id === buff.id) || (!b.id && !buff.id && b.name === buff.name),
    ),
  );
  return finalizeBuffListForHero(hero, deduped, now);
}

/**
 * Зіпсований snapshot (після невдалого PUT/local merge) часто має displayResources 1/1/1 при нормальних baseMax*.
 * Такі значення не використовуємо — інакше HUD/стати залишаються на 1 HP назавжди.
 */
export function trustHeroJsonDisplayResources(
  dr: unknown,
  heroJson: Record<string, unknown>,
  level: number,
): boolean {
  if (!dr || typeof dr !== "object") return false;
  const d = dr as Record<string, unknown>;
  const mh = Math.floor(Number(d.maxHp));
  const mm = Math.floor(Number(d.maxMp));
  const mc = Math.floor(Number(d.maxCp));
  if (!Number.isFinite(mh) || !Number.isFinite(mm) || !Number.isFinite(mc)) return false;
  if (mh < 1 || mm < 1 || mc < 1) return false;
  const lv = Math.max(1, Math.floor(Number(level)));
  if (lv > 1 && mh <= 1 && mm <= 1 && mc <= 1) return false;
  const bhp = Math.floor(Number(heroJson.baseMaxHp ?? 0));
  const bmp = Math.floor(Number(heroJson.baseMaxMp ?? 0));
  const bcp = Math.floor(Number(heroJson.baseMaxCp ?? 0));
  if (Number.isFinite(bhp) && bhp > 1 && mh < bhp) return false;
  if (Number.isFinite(bmp) && bmp > 1 && mm < bmp) return false;
  if (Number.isFinite(bcp) && bcp > 1 && mc < bcp) return false;
  return true;
}

export function getHeroBuffedResourceCaps(hero: Hero, inBattle: boolean) {
  const hj = ((hero as any)?.heroJson || {}) as Record<string, any>;
  const dr = hj.displayResources;
  const buffs = getCombinedHeroBuffs(hero, inBattle);
  let baseMax = getMaxResources(hero);
  if (
    dr &&
    typeof dr === "object" &&
    trustHeroJsonDisplayResources(dr, hj, Number(hero.level ?? 1))
  ) {
    const mh = Math.floor(Number(dr.maxHp));
    const mm = Math.floor(Number(dr.maxMp));
    const mc = Math.floor(Number(dr.maxCp));
    if (Number.isFinite(mh) && mh > 0 && Number.isFinite(mm) && mm > 0 && Number.isFinite(mc) && mc > 0) {
      baseMax = { maxHp: mh, maxMp: mm, maxCp: mc };
    }
  }
  return computeBuffedMaxResources(baseMax, buffs);
}

/** Поточні HP/MP/CP і max з урахуванням бафів — одна логіка для HUD і екранів. */
export function getHeroResourceValues(hero: Hero, inBattle: boolean) {
  const caps = getHeroBuffedResourceCaps(hero, inBattle);
  const hj = ((hero as any)?.heroJson || {}) as Record<string, any>;
  const dr = hj.displayResources;
  if (
    dr &&
    typeof dr === "object" &&
    trustHeroJsonDisplayResources(dr, hj, Number(hero.level ?? 1))
  ) {
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

