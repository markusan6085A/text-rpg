import type { ProfessionId } from "../data/skills/professionTypes";
import { getSkillsForProfession, normalizeProfessionId } from "../data/skills";

/**
 * Скіли нової професії з максимальним рівнем, дозволеним поточним рівнем персонажа (адмін-видача класу).
 */
export function buildLearnedSkillsForProfessionAtCharacterLevel(
  professionRaw: ProfessionId | string,
  characterLevel: number
): Array<{ id: number; level: number }> {
  const pid = normalizeProfessionId(professionRaw);
  if (!pid) return [];

  const charLvl = Math.max(1, Math.min(80, Math.floor(Number(characterLevel) || 1)));
  const defs = getSkillsForProfession(pid);
  const out: Array<{ id: number; level: number }> = [];

  for (const def of defs) {
    const levels = def.levels ?? [];
    let best: number | null = null;
    for (const lv of levels) {
      const rl = Number((lv as { requiredLevel?: number }).requiredLevel ?? 1);
      const ln = Number((lv as { level?: number }).level);
      if (!Number.isFinite(ln) || ln < 1) continue;
      if (rl <= charLvl && (best === null || ln > best)) best = ln;
    }
    if (best !== null) out.push({ id: def.id, level: best });
  }

  return out.sort((a, b) => a.id - b.id);
}
