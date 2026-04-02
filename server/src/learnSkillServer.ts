import skillLearnCosts from "./skillLearnCosts.json";
import allowlist from "./professionSkillAllowlist.json";
import { maxSkillTierAllowedForPlayerLevel } from "./clampHeroSkillsToLevel";
import {
  heroLooksMystic,
  mysticSpellbookGuildKey,
  MYSTIC_SPELLBOOK_TURNIN,
} from "./mysticSpellbookServer";
import { normalizeProfessionIdForLearn } from "./normalizeProfessionIdServer";

type LearnRow = { tier: number; req: number; sp: number };
const COSTS = skillLearnCosts as Record<string, LearnRow[]>;
const BY_PROF = allowlist.byProfessionId as Record<string, string[]>;
const ADDITIONAL = new Set((allowlist.additionalSkillIds as string[]) || []);

function readEffectiveLevelSp(existing: {
  level: number;
  sp: number;
  heroJson: unknown;
}): { level: number; sp: number } {
  const hj = (existing.heroJson && typeof existing.heroJson === "object"
    ? existing.heroJson
    : {}) as Record<string, unknown>;
  const levelCol = Math.max(1, Number(existing.level) || 1);
  const spCol = Math.max(0, Math.floor(Number(existing.sp) || 0));
  const lj = hj.level != null && hj.level !== "" ? Number(hj.level) : NaN;
  const sj = hj.sp != null && hj.sp !== "" ? Number(hj.sp) : NaN;
  // Не дозволяти застарілому heroJson.level (нижчому за колонку Character.level) блокувати learn-skill / tier caps.
  const levelFromJson =
    Number.isFinite(lj) && lj > 0 ? Math.max(1, Math.floor(lj)) : 0;
  const level = Math.max(levelCol, levelFromJson);
  const spFromHj = Number.isFinite(sj) && sj >= 0 ? Math.floor(sj) : null;
  const sp = spFromHj !== null ? Math.max(spFromHj, spCol) : spCol;
  return { level, sp };
}

function readEffectiveAdena(existing: { adena: bigint | number | string; heroJson: unknown }): bigint {
  const hj = (existing.heroJson && typeof existing.heroJson === "object"
    ? existing.heroJson
    : {}) as Record<string, unknown>;
  const col = BigInt(
    typeof existing.adena === "bigint" ? existing.adena : Math.floor(Number(existing.adena ?? 0) || 0)
  );
  const j = hj.adena != null && hj.adena !== "" ? BigInt(Math.floor(Number(hj.adena) || 0)) : 0n;
  return col > j ? col : j;
}

function getProfessionRaw(heroJson: any, classId: string): unknown {
  return heroJson?.profession ?? heroJson?.klass ?? heroJson?.classId ?? classId ?? "";
}

export type LearnSkillServerFail = { ok: false; status: 400 | 403; error: string };

export type LearnProfessionSkillOk = {
  ok: true;
  newSp: number;
  newSkills: { id: number; level: number }[];
  mergedHeroJsonRaw: Record<string, unknown>;
};

/**
 * Одне підвищення скілу гільдії за SP (професійний whitelist, tier/level/sp — з JSON).
 */
export function computeProfessionSkillLearn(
  existing: { level: number; sp: number; heroJson: any; classId: string },
  skillId: number
): LearnProfessionSkillOk | LearnSkillServerFail {
  if (!Number.isInteger(skillId) || skillId <= 0) {
    return { ok: false, status: 400, error: "invalid input" };
  }

  const tiers = COSTS[String(skillId)];
  if (!tiers?.length) {
    return { ok: false, status: 400, error: "invalid input" };
  }

  const professionId = normalizeProfessionIdForLearn(getProfessionRaw(existing.heroJson, existing.classId));
  if (!professionId) {
    return { ok: false, status: 403, error: "forbidden" };
  }

  const allowed = BY_PROF[professionId];
  if (!allowed || !allowed.includes(String(skillId))) {
    return { ok: false, status: 403, error: "forbidden" };
  }

  if (ADDITIONAL.has(String(skillId))) {
    return { ok: false, status: 403, error: "forbidden" };
  }

  const { level: playerLevel, sp: playerSp } = readEffectiveLevelSp(existing);
  const oldHeroJson = existing.heroJson && typeof existing.heroJson === "object" ? existing.heroJson : {};
  const skillsIn = Array.isArray((oldHeroJson as any).skills) ? [...(oldHeroJson as any).skills] : [];
  const row = skillsIn.find((x: any) => Number(x?.id) === skillId);
  const currentLevel = row ? Math.max(0, Math.floor(Number(row.level) || 0)) : 0;

  const sorted = [...tiers].sort((a, b) => a.tier - b.tier);
  const nextRow = sorted.find((t) => t.tier > currentLevel);
  if (!nextRow) {
    return { ok: false, status: 400, error: "invalid input" };
  }

  const nextTier = nextRow.tier;
  const reqLvl = Math.max(1, Math.floor(Number(nextRow.req) || 1));
  const cost = Math.max(0, Math.floor(Number(nextRow.sp) || 0));

  if (playerLevel < reqLvl) {
    return { ok: false, status: 400, error: "invalid input" };
  }

  const maxTier = maxSkillTierAllowedForPlayerLevel(skillId, playerLevel);
  if (maxTier >= 0 && nextTier > maxTier) {
    return { ok: false, status: 400, error: "invalid input" };
  }

  const hj = oldHeroJson as any;
  if (heroLooksMystic(hj)) {
    const turn = MYSTIC_SPELLBOOK_TURNIN[skillId];
    if (turn && currentLevel === 0 && nextTier === turn.targetLevel) {
      const gKey = mysticSpellbookGuildKey(skillId, turn.targetLevel);
      const guild =
        hj.spellbookGuild && typeof hj.spellbookGuild === "object" ? hj.spellbookGuild : {};
      if (!guild[gKey]) {
        return { ok: false, status: 400, error: "invalid input" };
      }
    }
  }

  if (playerSp < cost) {
    return { ok: false, status: 400, error: "invalid input" };
  }

  const newSp = playerSp - cost;
  const newSkills: { id: number; level: number }[] = skillsIn.map((x: any) => ({
    id: Number(x.id),
    level: Math.max(0, Math.floor(Number(x.level) || 0)),
  }));
  const idx = newSkills.findIndex((x) => x.id === skillId);
  if (idx >= 0) newSkills[idx] = { id: skillId, level: nextTier };
  else newSkills.push({ id: skillId, level: nextTier });

  const mergedHeroJsonRaw = {
    ...(oldHeroJson as Record<string, unknown>),
    skills: newSkills,
    sp: newSp,
  };

  return { ok: true, newSp, newSkills, mergedHeroJsonRaw };
}

export type LearnAdditionalSkillOk = {
  ok: true;
  newAdena: bigint;
  newSkills: { id: number; level: number }[];
  mergedHeroJsonRaw: Record<string, unknown>;
};

/** Перший рівень додаткового скілу за «адену» (сума з поля sp у даних рівня, як на клієнті). */
export function computeAdditionalSkillLearn(
  existing: { adena: bigint | number | string; level: number; heroJson: any; classId: string },
  skillId: number
): LearnAdditionalSkillOk | LearnSkillServerFail {
  if (!Number.isInteger(skillId) || skillId <= 0) {
    return { ok: false, status: 400, error: "invalid input" };
  }

  if (!ADDITIONAL.has(String(skillId))) {
    return { ok: false, status: 403, error: "forbidden" };
  }

  const tiers = COSTS[String(skillId)];
  if (!tiers?.length) {
    return { ok: false, status: 400, error: "invalid input" };
  }

  const sorted = [...tiers].sort((a, b) => a.tier - b.tier);
  const first = sorted[0];
  if (!first) return { ok: false, status: 400, error: "invalid input" };

  const { level: playerLevel } = readEffectiveLevelSp({
    level: existing.level,
    sp: 0,
    heroJson: existing.heroJson,
  });
  const reqLvl = Math.max(1, Math.floor(Number(first.req) || 1));
  if (playerLevel < reqLvl) {
    return { ok: false, status: 400, error: "invalid input" };
  }

  const adenaCost = BigInt(Math.max(0, Math.floor(Number(first.sp) || 0)));
  const playerAdena = readEffectiveAdena(existing);
  if (playerAdena < adenaCost) {
    return { ok: false, status: 400, error: "invalid input" };
  }

  const oldHeroJson = existing.heroJson && typeof existing.heroJson === "object" ? existing.heroJson : {};
  const skillsIn = Array.isArray((oldHeroJson as any).skills) ? [...(oldHeroJson as any).skills] : [];
  const row = skillsIn.find((x: any) => Number(x?.id) === skillId);
  const currentLevel = row ? Math.max(0, Math.floor(Number(row.level) || 0)) : 0;
  if (currentLevel > 0) {
    return { ok: false, status: 400, error: "invalid input" };
  }

  const nextTier = first.tier;
  const newAdena = playerAdena - adenaCost;

  const newSkills: { id: number; level: number }[] = skillsIn.map((x: any) => ({
    id: Number(x.id),
    level: Math.max(0, Math.floor(Number(x.level) || 0)),
  }));
  newSkills.push({ id: skillId, level: nextTier });

  const mergedHeroJsonRaw = {
    ...(oldHeroJson as Record<string, unknown>),
    skills: newSkills,
    adena: Number(newAdena),
  };

  return { ok: true, newAdena, newSkills, mergedHeroJsonRaw };
}
