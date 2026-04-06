import type { Character } from "../../utils/api";
import type { BattleBuff } from "../../state/battle/types";
import type { Hero } from "../../types/Hero";
import { cleanupBuffs, computeBuffedMaxResources } from "../../state/battle/helpers";
import { filterBuffsForHeroProfession } from "../../state/battle/loadout";
import { effectiveCharacterLevel } from "../../utils/effectiveCharacterLevel";

/** ISO / рядок expiresAt інакше cleanupBuffs відсіює всі бафи (рядок > number → false). */
export function coerceBuffExpiresAtMs(expiresAt: unknown): number {
  if (expiresAt === Number.MAX_SAFE_INTEGER) return Number.MAX_SAFE_INTEGER;
  if (typeof expiresAt === "number" && Number.isFinite(expiresAt)) return expiresAt;
  if (typeof expiresAt === "string") {
    if (/^\d+$/.test(expiresAt)) {
      const n = Number(expiresAt);
      return Number.isFinite(n) ? n : 0;
    }
    const t = Date.parse(expiresAt);
    return Number.isFinite(t) ? t : 0;
  }
  if (expiresAt == null) return Number.MAX_SAFE_INTEGER;
  return 0;
}

export function prepareBuffsForStatsView(raw: any[]): BattleBuff[] {
  return raw.map((b) => ({
    ...b,
    expiresAt: coerceBuffExpiresAtMs(b?.expiresAt),
    effects: Array.isArray(b?.effects) ? b.effects : [],
  })) as BattleBuff[];
}

/** Бафи/тоггли з id скіла: показуємо лише якщо скіл ще у списку вивчених (після зміни класу в адмінці). */
export function filterProfileBuffsByLearnedSkills(
  buffs: any[],
  learnedSkills: Array<{ id: number; level?: number }> | undefined
): any[] {
  const ids = new Set(
    (Array.isArray(learnedSkills) ? learnedSkills : [])
      .map((s) => Number(s?.id))
      .filter((n) => Number.isFinite(n) && n > 0)
  );
  if (ids.size === 0) return buffs;
  return buffs.filter((b) => {
    const bid = b?.id != null ? Number(b.id) : NaN;
    if (!Number.isFinite(bid) || bid <= 0) return true;
    return ids.has(bid);
  });
}

function parseMaybeJsonObject(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) return raw as Record<string, unknown>;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
    } catch {
      // malformed legacy payload
    }
  }
  return {};
}

function pickMergedHeroBuffs(
  root: Record<string, unknown>,
  nested: Record<string, unknown>
): unknown {
  const a = root.heroBuffs;
  const b = nested.heroBuffs;
  const ar = Array.isArray(a) ? a.length : 0;
  const br = Array.isArray(b) ? b.length : 0;
  if (ar === 0) return Array.isArray(b) ? b : a;
  if (br === 0) return a;
  return ar >= br ? a : b;
}

/** Той самий merge root/nested heroJson, що на сервері в normalizeHeroJsonForPublic — для профілю іншого гравця. */
export function getMergedHeroJsonFromCharacter(character: { heroJson?: unknown } | null | undefined): Record<string, any> {
  const rootHeroJson = parseMaybeJsonObject(character?.heroJson);
  const nestedHeroJson = parseMaybeJsonObject((rootHeroJson as any).heroJson);
  if (Object.keys(nestedHeroJson).length === 0) return rootHeroJson as Record<string, any>;
  const merged = {
    ...(rootHeroJson as Record<string, any>),
    ...(nestedHeroJson as Record<string, any>),
  };
  merged.heroBuffs = pickMergedHeroBuffs(rootHeroJson, nestedHeroJson);
  return merged;
}

function parseMaybeJsonMap(raw: unknown): Record<string, any> {
  return parseMaybeJsonObject(raw) as Record<string, any>;
}

/**
 * Для UI перегляду чужого персонажа (модалка стати, підписи): знімок базовий, бафи з heroJson.
 * Не підміняти ним поля в characterToProfileHeroData для recalculateAllStats — там потрібна база.
 */
export function profileBuffedResourcesForView(
  character: Character,
  heroJson: Record<string, any>,
): { hp: number; mp: number; cp: number; maxHp: number; maxMp: number; maxCp: number } {
  const dr = heroJson.displayResources;
  if (dr && typeof dr === "object") {
    const mh = Math.floor(Number(dr.maxHp));
    const mm = Math.floor(Number(dr.maxMp));
    const mc = Math.floor(Number(dr.maxCp));
    if (Number.isFinite(mh) && mh > 0 && Number.isFinite(mm) && mm > 0 && Number.isFinite(mc) && mc > 0) {
      const h = Number(dr.hp);
      const m = Number(dr.mp);
      const c = Number(dr.cp);
      return {
        hp: Number.isFinite(h) && h >= 0 ? h : Number(heroJson.hp ?? 0),
        mp: Number.isFinite(m) && m >= 0 ? m : Number(heroJson.mp ?? 0),
        cp: Number.isFinite(c) && c >= 0 ? c : Number(heroJson.cp ?? 0),
        maxHp: mh,
        maxMp: mm,
        maxCp: mc,
      };
    }
  }

  const baseMaxHp = Math.max(
    1,
    Math.floor(
      Number((character as any).baseMaxHp ?? heroJson.baseMaxHp ?? heroJson.maxHp ?? 1) || 1,
    ),
  );
  const baseMaxMp = Math.max(
    1,
    Math.floor(
      Number((character as any).baseMaxMp ?? heroJson.baseMaxMp ?? heroJson.maxMp ?? 1) || 1,
    ),
  );
  const baseMaxCp = Math.max(
    1,
    Math.floor(
      Number(
        (character as any).baseMaxCp ??
          heroJson.baseMaxCp ??
          heroJson.maxCp ??
          Math.round(baseMaxHp * 0.6),
      ) || 1,
    ),
  );

  const baseHp =
    heroJson.hp !== undefined && heroJson.hp !== null ? Number(heroJson.hp) : baseMaxHp;
  const baseMp = Number(heroJson.mp ?? heroJson.maxMp ?? baseMaxMp);
  const baseCp = Number(heroJson.cp ?? heroJson.maxCp ?? baseMaxCp);

  const now = Date.now();
  const rawBuffs = Array.isArray(heroJson.heroBuffs) ? heroJson.heroBuffs : [];
  const heroStub = {
    name: String(heroJson.name ?? character.name ?? "x"),
    profession: heroJson.profession,
    klass: heroJson.klass,
    race: heroJson.race,
  } as Hero;
  const buffs = filterBuffsForHeroProfession(
    heroStub,
    cleanupBuffs(prepareBuffsForStatsView(rawBuffs), now),
  );
  const baseCaps = { maxHp: baseMaxHp, maxMp: baseMaxMp, maxCp: baseMaxCp };
  const buffed = computeBuffedMaxResources(baseCaps, buffs);
  const ratioH = baseHp / Math.max(1, baseMaxHp);
  const ratioM = baseMp / Math.max(1, baseMaxMp);
  const ratioC = baseCp / Math.max(1, baseMaxCp);
  return {
    hp: Math.min(buffed.maxHp, Math.max(0, Math.round(ratioH * buffed.maxHp))),
    mp: Math.min(buffed.maxMp, Math.max(0, Math.round(ratioM * buffed.maxMp))),
    cp: Math.min(buffed.maxCp, Math.max(0, Math.round(ratioC * buffed.maxCp))),
    maxHp: buffed.maxHp,
    maxMp: buffed.maxMp,
    maxCp: buffed.maxCp,
  };
}

/** Об'єкт як Hero для екіпу / recalculateAllStats; має містити baseStats з heroJson (інакше стати — дефолтні). */
export function characterToProfileHeroData(character: Character) {
  const rootHeroJson = parseMaybeJsonObject((character as any).heroJson);
  const nestedHeroJson = parseMaybeJsonObject((rootHeroJson as any).heroJson);
  // Legacy compatibility: some rows keep payload under heroJson.heroJson.
  const heroJson =
    Object.keys(nestedHeroJson).length > 0
      ? (() => {
          const m = { ...rootHeroJson, ...nestedHeroJson };
          m.heroBuffs = pickMergedHeroBuffs(rootHeroJson, nestedHeroJson);
          return m;
        })()
      : rootHeroJson;
  const equipment = parseMaybeJsonMap((heroJson as any).equipment);
  const equipmentEnchantLevels = parseMaybeJsonMap((heroJson as any).equipmentEnchantLevels);
  const equipmentInserts = parseMaybeJsonMap((heroJson as any).equipmentInserts);
  const professionRaw = String((heroJson as any).profession ?? character.classId ?? "");
  const status = String((heroJson as any).status ?? "");
  const location =
    typeof (heroJson as any).location === "string"
      ? (heroJson as any).location
      : typeof (heroJson as any).currentLocation === "string"
        ? (heroJson as any).currentLocation
        : typeof (heroJson as any).zone === "string"
          ? (heroJson as any).zone
          : undefined;
  const nickColor =
    typeof (heroJson as any).nickColor === "string" ? (heroJson as any).nickColor : undefined;
  return {
    id: character.id,
    name: character.name,
    username: character.name,
    race: heroJson.race || character.race,
    klass: heroJson.klass || heroJson.classId || character.classId,
    gender: character.sex,
    level: effectiveCharacterLevel(character),
    profession: professionRaw,
    status,
    ...(heroJson.baseStats && typeof heroJson.baseStats === "object"
      ? { baseStats: heroJson.baseStats }
      : {}),
    ...(heroJson.baseStatsInitial && typeof heroJson.baseStatsInitial === "object"
      ? { baseStatsInitial: heroJson.baseStatsInitial }
      : {}),
    equipment,
    equipmentEnchantLevels,
    equipmentInserts,
    activeDyes: heroJson.activeDyes || [],
    skills: Array.isArray(heroJson.skills) ? heroJson.skills : [],
    heroJson,
    inventory: heroJson.inventory || [],
    adena: character.adena,
    coinOfLuck: character.coinLuck,
    exp: character.exp,
    sp: character.sp,
    hp: heroJson.hp !== undefined && heroJson.hp !== null ? Number(heroJson.hp) : (heroJson.maxHp ?? 100),
    maxHp:
      heroJson.maxHp && Number(heroJson.maxHp) > 0
        ? Number(heroJson.maxHp)
        : Math.max(100, 150 + effectiveCharacterLevel(character) * 12),
    mp: heroJson.mp || heroJson.maxMp || 100,
    maxMp: heroJson.maxMp || 100,
    cp: heroJson.cp || heroJson.maxCp || 0,
    maxCp: heroJson.maxCp || 0,
    location,
    mobsKilled:
      (character as any).mobsKilled ??
      heroJson.mobsKilled ??
      heroJson.mobs_killed ??
      heroJson.killedMobs ??
      heroJson.totalKills ??
      undefined,
    nickColor,
  };
}
