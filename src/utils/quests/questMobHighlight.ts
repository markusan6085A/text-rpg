/**
 * Підсвітка мобів на екрані локації для активних квестів:
 * - цілі вбивств (сірий текст + «квест · цель»);
 * - квестовий дроп (сірий текст + «квест · добыча»), поки не набрано requiredCount для цього itemId у парі mob+зона.
 */
import { QUEST_ITEM_TURN_IN_ALIASES, type Quest, type QuestKillTarget } from "../../data/quests";

function countQuestItemInInventory(
  inv: { id: string; count?: number }[] | undefined,
  questItemId: string
): number {
  const aliases = QUEST_ITEM_TURN_IN_ALIASES[questItemId];
  const ids = aliases ? new Set<string>([questItemId, ...aliases]) : new Set<string>([questItemId]);
  let sum = 0;
  for (const it of inv ?? []) {
    if (ids.has(it.id)) sum += it.count ?? 1;
  }
  return sum;
}

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
  if (target.killInZoneId && (!zoneId || zoneId !== target.killInZoneId)) return false;
  if (target.mobNamePrefix && mob.name.startsWith(target.mobNamePrefix)) return true;
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
  zoneId?: string | null,
  inventory?: { id: string; count?: number }[] | null
): "kill" | "drop" | null {
  const questById = new Map(allQuests.map((q) => [q.id, q]));
  for (const aq of activeQuests) {
    const quest = questById.get(aq.questId);
    if (!quest) continue;

    if (quest.questDrops?.length && inventory) {
      for (const qd of quest.questDrops) {
        if (qd.mobName !== mob.name) continue;
        if (
          qd.dropZoneIdPrefix &&
          (!zoneId || !String(zoneId).startsWith(qd.dropZoneIdPrefix))
        ) {
          continue;
        }
        const have = countQuestItemInInventory(inventory, qd.itemId);
        if (have < qd.requiredCount) return "drop";
      }
    }

    if (quest.questKillTargets?.length) {
      for (const kt of quest.questKillTargets) {
        if (mobMatchesKillTarget(mob, kt, zoneId)) return "kill";
      }
    }
  }
  return null;
}
