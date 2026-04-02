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

/** Об'єкт як Hero для екіпу / recalculateAllStats; має містити baseStats з heroJson (інакше стати — дефолтні). */
export function characterToProfileHeroData(character: Character) {
  const heroJson = character.heroJson || {};
  const professionRaw = heroJson.profession || character.classId || "";
  return {
    id: character.id,
    name: character.name,
    username: character.name,
    race: heroJson.race || character.race,
    klass: heroJson.klass || heroJson.classId || character.classId,
    gender: character.sex,
    level: effectiveCharacterLevel(character),
    profession: professionRaw,
    status: heroJson.status || "",
    ...(heroJson.baseStats && typeof heroJson.baseStats === "object"
      ? { baseStats: heroJson.baseStats }
      : {}),
    ...(heroJson.baseStatsInitial && typeof heroJson.baseStatsInitial === "object"
      ? { baseStatsInitial: heroJson.baseStatsInitial }
      : {}),
    equipment: heroJson.equipment || {},
    equipmentEnchantLevels: heroJson.equipmentEnchantLevels || {},
    equipmentInserts:
      heroJson.equipmentInserts && typeof heroJson.equipmentInserts === "object"
        ? heroJson.equipmentInserts
        : {},
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
    location: heroJson.location || heroJson.currentLocation || heroJson.zone || undefined,
    mobsKilled: heroJson.mobsKilled ?? heroJson.mobs_killed ?? heroJson.killedMobs ?? heroJson.totalKills ?? undefined,
    nickColor: heroJson.nickColor || undefined,
  };
}
