/**
 * Підсвітка мобів на екрані локації для активних квестів:
 * — «drop» (помаранчевий): моб дає квестовий ресурс;
 * — «kill» (сірий): моб рахується в лічильник вбивств.
 * Пріоритет: drop > kill.
 */
import type { Quest, QuestKillTarget } from "../../data/quests";

export interface ActiveQuestLike {
  questId: string;
  progress?: Record<string, number>;
}

export function mobMatchesKillTarget(
  mob: { name: string; id: string },
  target: QuestKillTarget
): boolean {
  if (target.mobIdPrefix && mob.id.startsWith(target.mobIdPrefix)) return true;
  if (mob.name === target.mobName) return true;
  return false;
}

export function getQuestMobHighlightForMob(
  mob: { name: string; id: string },
  activeQuests: ActiveQuestLike[],
  allQuests: Quest[]
): "drop" | "kill" | null {
  const questById = new Map(allQuests.map((q) => [q.id, q]));
  let hasKill = false;
  let hasDrop = false;
  for (const aq of activeQuests) {
    const quest = questById.get(aq.questId);
    if (!quest) continue;
    if (quest.questDrops?.length) {
      for (const d of quest.questDrops) {
        if (d.mobName && mob.name === d.mobName) hasDrop = true;
      }
    }
    if (quest.questKillTargets?.length) {
      for (const kt of quest.questKillTargets) {
        if (mobMatchesKillTarget(mob, kt)) hasKill = true;
      }
    }
  }
  if (hasDrop) return "drop";
  if (hasKill) return "kill";
  return null;
}
