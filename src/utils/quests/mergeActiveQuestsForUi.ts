import type { Hero } from "../../types/Hero";

type AQ = NonNullable<Hero["activeQuests"]>[number];

/**
 * Об'єднує activeQuests з hero та heroJson (після гідрації/мерджу з API),
 * щоб не губити rolledQuestDropNeeds / progress у підказках і дропі.
 * Поля з hero перекривають json.
 */
export function mergeActiveQuestsForUi(
  fromHero: unknown,
  fromJson: unknown
): NonNullable<Hero["activeQuests"]> {
  const a = Array.isArray(fromHero) ? (fromHero as Partial<AQ>[]) : [];
  const b = Array.isArray(fromJson) ? (fromJson as Partial<AQ>[]) : [];
  const map = new Map<string, AQ>();

  for (const x of b) {
    const id = x?.questId;
    if (typeof id === "string" && id) {
      map.set(id, {
        questId: id,
        progress: { ...(x.progress ?? {}) },
        ...(x.rolledQuestDropNeeds ? { rolledQuestDropNeeds: { ...x.rolledQuestDropNeeds } } : {}),
        ...(x.rolledRewardBonus ? { rolledRewardBonus: x.rolledRewardBonus } : {}),
      });
    }
  }
  for (const x of a) {
    const id = x?.questId;
    if (typeof id !== "string" || !id) continue;
    const j = map.get(id);
    if (!j) {
      map.set(id, {
        questId: id,
        progress: { ...(x.progress ?? {}) },
        ...(x.rolledQuestDropNeeds ? { rolledQuestDropNeeds: { ...x.rolledQuestDropNeeds } } : {}),
        ...(x.rolledRewardBonus ? { rolledRewardBonus: x.rolledRewardBonus } : {}),
      });
    } else {
      map.set(id, {
        questId: id,
        progress: { ...j.progress, ...(x.progress ?? {}) },
        rolledQuestDropNeeds: { ...j.rolledQuestDropNeeds, ...x.rolledQuestDropNeeds },
        rolledRewardBonus: x.rolledRewardBonus ?? j.rolledRewardBonus,
      });
    }
  }
  return Array.from(map.values());
}
