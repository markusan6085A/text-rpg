/**
 * Книги заклинань для перших рівнів магічних скілів (наближено до L2 Interlude).
 * Дроп тільки з убитих мобів, поки скіл ще не вивчений (0 → перший рівень).
 */
import { MYSTIC_SPELLBOOK_TIERS, type MysticSpellbookTierConfig } from "./mysticSpellbookTiers";

export type { MysticSpellbookTierConfig };
export { MYSTIC_SPELLBOOK_TIERS };

const bySkill = new Map<number, MysticSpellbookTierConfig>();
for (const row of MYSTIC_SPELLBOOK_TIERS) {
  bySkill.set(row.skillId, row);
}

export function mysticSpellbookGuildKey(skillId: number, targetLevel: number): string {
  return `${skillId}_${targetLevel}`;
}

export function getMysticSpellbookTier(skillId: number): MysticSpellbookTierConfig | null {
  return bySkill.get(skillId) ?? null;
}

/** Книга потрібна лише для першого вивчення скілу (поточний рівень 0). */
export function getActiveMysticSpellbookRequirement(
  skillId: number,
  currentSkillLevel: number,
  nextLevel: number
): MysticSpellbookTierConfig | null {
  if (currentSkillLevel !== 0) return null;
  const row = bySkill.get(skillId);
  if (!row || row.targetLevel !== nextLevel) return null;
  return row;
}

export function mobMatchesMysticSpellbook(mobId: string, mobName: string, row: MysticSpellbookTierConfig): boolean {
  const hay = `${mobId} ${mobName}`.toLowerCase();
  return row.mobPatterns.some((p) => hay.includes(p.toLowerCase()));
}
