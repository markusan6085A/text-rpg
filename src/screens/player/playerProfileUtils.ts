import type { Character } from "../../utils/api";
import type { BattleBuff } from "../../state/battle/types";
import { effectiveCharacterLevel } from "../../utils/effectiveCharacterLevel";

/** ISO / рядок expiresAt інакше cleanupBuffs відсіює всі бафи (рядок > number → false). */
export function coerceBuffExpiresAtMs(expiresAt: unknown): number {
  if (expiresAt === Number.MAX_SAFE_INTEGER) return Number.MAX_SAFE_INTEGER;
  if (typeof expiresAt === "number" && Number.isFinite(expiresAt)) return expiresAt;
  if (typeof expiresAt === "string") {
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

/** Той самий merge root/nested heroJson, що на сервері в buildPublicHeroJson — для профілю іншого гравця. */
export function getMergedHeroJsonFromCharacter(character: { heroJson?: unknown } | null | undefined): Record<string, any> {
  const rootHeroJson = parseMaybeJsonObject(character?.heroJson);
  const nestedHeroJson = parseMaybeJsonObject((rootHeroJson as any).heroJson);
  return Object.keys(nestedHeroJson).length > 0
    ? { ...(rootHeroJson as Record<string, any>), ...(nestedHeroJson as Record<string, any>) }
    : (rootHeroJson as Record<string, any>);
}

function parseMaybeJsonMap(raw: unknown): Record<string, any> {
  return parseMaybeJsonObject(raw) as Record<string, any>;
}

/** Об'єкт як Hero для екіпу / recalculateAllStats; має містити baseStats з heroJson (інакше стати — дефолтні). */
export function characterToProfileHeroData(character: Character) {
  const rootHeroJson = parseMaybeJsonObject((character as any).heroJson);
  const nestedHeroJson = parseMaybeJsonObject((rootHeroJson as any).heroJson);
  // Legacy compatibility: some rows keep payload under heroJson.heroJson.
  const heroJson = Object.keys(nestedHeroJson).length > 0
    ? { ...rootHeroJson, ...nestedHeroJson }
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
    mobsKilled: heroJson.mobsKilled ?? heroJson.mobs_killed ?? heroJson.killedMobs ?? heroJson.totalKills ?? undefined,
    nickColor,
  };
}
