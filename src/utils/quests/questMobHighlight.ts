/**
 * Підсвітка мобів на екрані локації для активних квестів (лише цілі вбивств — сірий текст).
 */
import type { Quest, QuestKillTarget } from "../../data/quests";

export interface ActiveQuestLike {
  questId: string;
  progress?: Record<string, number>;
}

export function mobMatchesKillTarget(
  mob: {
    name: string;
    id: string;
    aggressivePatrol?: boolean;
    aggressiveGroup?: string;
    isRaidBoss?: boolean;
  },
  target: QuestKillTarget,
  zoneId?: string | null
): boolean {
  if (target.raidBossKillInZone) {
    if (!zoneId || zoneId !== target.raidBossKillInZone) return false;
    return mob.isRaidBoss === true;
  }
  if (target.aggressiveKillsInZone) {
    if (!zoneId || zoneId !== target.aggressiveKillsInZone) return false;
    if (mob.isRaidBoss) return false;
    return !!(mob.aggressivePatrol || mob.aggressiveGroup);
  }
  if (target.mobIdPrefix && mob.id.startsWith(target.mobIdPrefix)) return true;
  if (mob.name === target.mobName) return true;
  return false;
}

export function getQuestMobHighlightForMob(
  mob: {
    name: string;
    id: string;
    aggressivePatrol?: boolean;
    aggressiveGroup?: string;
    isRaidBoss?: boolean;
  },
  activeQuests: ActiveQuestLike[],
  allQuests: Quest[],
  zoneId?: string | null
): "kill" | null {
  const questById = new Map(allQuests.map((q) => [q.id, q]));
  for (const aq of activeQuests) {
    const quest = questById.get(aq.questId);
    if (!quest?.questKillTargets?.length) continue;
    for (const kt of quest.questKillTargets) {
      if (mobMatchesKillTarget(mob, kt, zoneId)) return "kill";
    }
  }
  return null;
}
