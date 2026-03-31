import type { Quest } from "../../data/quests";

export type ActiveQuestWithDropRolls = {
  questId: string;
  progress?: Record<string, number>;
  rolledQuestDropNeeds?: Record<string, number>;
  rolledRewardBonus?: { adena: number; exp: number; coins_silver: number };
};

export type QuestDropRow = NonNullable<Quest["questDrops"]>[number];

/** Потрібна кількість для здачі/дропа: з activeQuest після роллу або статична з визначення квесту. */
export function getEffectiveQuestDropNeed(
  questDrop: QuestDropRow,
  activeEntry: ActiveQuestWithDropRolls | undefined
): number {
  const rolled = activeEntry?.rolledQuestDropNeeds?.[questDrop.itemId];
  if (typeof rolled === "number" && rolled > 0) return rolled;
  return questDrop.requiredCount;
}
