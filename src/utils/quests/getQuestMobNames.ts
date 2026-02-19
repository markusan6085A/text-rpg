/**
 * Повертає множину імен мобів, яких треба вбити для активних квестів.
 * Використовується для підсвітки цих мобів сірим текстом на екрані локації.
 */
import type { Quest } from "../../data/quests";

export interface ActiveQuestLike {
  questId: string;
  progress?: Record<string, number>;
}

export function getQuestMobNames(
  activeQuests: ActiveQuestLike[],
  allQuests: Quest[]
): Set<string> {
  const names = new Set<string>();
  if (!activeQuests?.length || !allQuests?.length) return names;

  const questById = new Map(allQuests.map((q) => [q.id, q]));

  for (const aq of activeQuests) {
    const quest = questById.get(aq.questId);
    if (!quest?.questDrops?.length) continue;
    for (const drop of quest.questDrops) {
      if (drop.mobName) names.add(drop.mobName);
    }
  }

  return names;
}
