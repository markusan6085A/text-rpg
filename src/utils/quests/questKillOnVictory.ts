import type { Mob } from "../../data/world/types";
import type { Quest } from "../../data/quests";
import { mobMatchesKillTarget } from "./questMobHighlight";

/**
 * Оновлення прогресу лічильників вбивств у активних квестах після смерті моба.
 */
export function applyQuestKillProgressOnVictory(
  mob: Mob,
  activeQuests: Array<{ questId: string; progress: Record<string, number> }>,
  allQuests: Quest[],
  zoneId?: string | null,
  heroLevel?: number
): Array<{ questId: string; progress: Record<string, number> }> | null {
  if (!activeQuests?.length) return null;
  const questById = new Map(allQuests.map((q) => [q.id, q]));
  const mobForMatch = mob as Mob & { isRaidBoss?: boolean };
  let changed = false;
  const next = activeQuests.map((aq) => {
    const def = questById.get(aq.questId);
    if (!def?.questKillTargets?.length) return aq;
    const prog = { ...(aq.progress || {}) };
    let touched = false;
    for (const kt of def.questKillTargets) {
      if (!mobMatchesKillTarget(mobForMatch, kt, zoneId, heroLevel)) continue;
      const cur = prog[kt.progressKey] ?? 0;
      if (cur >= kt.requiredCount) continue;
      prog[kt.progressKey] = cur + 1;
      touched = true;
    }
    if (touched) {
      changed = true;
      return { ...aq, progress: prog };
    }
    return aq;
  });
  return changed ? next : null;
}
