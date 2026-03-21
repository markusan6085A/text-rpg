import tierData from "./skillTierRequirements.json";

export type HeroSkillRow = { id: number; level: number };

type TierRow = { tier: number; req: number };

const DB = tierData as Record<string, TierRow[]>;

/**
 * Найвищий tier скіла, дозволений при заданому рівні героя (requiredLevel у даних).
 * 0 — жоден tier не доступний (скіл прибрати).
 * -1 — скіла немає в таблиці (не чіпаємо).
 */
export function maxSkillTierAllowedForPlayerLevel(skillId: number, playerLevel: number): number {
  const tiers = DB[String(skillId)];
  if (!tiers || tiers.length === 0) return -1;
  let maxTier = 0;
  for (const row of tiers) {
    const t = Number(row.tier) || 0;
    const req = Number(row.req ?? 1);
    if (playerLevel >= req && t > maxTier) maxTier = t;
  }
  return maxTier;
}

/** Обрізає / прибирає скіли, для яких поточний tier вимагає вищий рівень героя. */
export function clampHeroSkillsToPlayerLevel(
  skills: HeroSkillRow[] | undefined | null,
  playerLevel: number
): HeroSkillRow[] {
  if (!Array.isArray(skills)) return [];
  const out: HeroSkillRow[] = [];
  for (const s of skills) {
    const id = Number(s.id);
    const learned = Math.max(1, Number(s.level) || 1);
    if (!id) continue;
    const maxTier = maxSkillTierAllowedForPlayerLevel(id, playerLevel);
    if (maxTier < 0) {
      out.push({ id, level: learned });
      continue;
    }
    if (maxTier <= 0) continue;
    out.push({ id, level: Math.min(learned, maxTier) });
  }
  return out;
}
