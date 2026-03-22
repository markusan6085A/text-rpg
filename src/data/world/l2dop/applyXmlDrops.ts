// l2dop_<npcId> моби: тиерний дроп/спойл ресурсів (див. tieredResourceLoot.ts).
export { l2NpcTemplateIdFromMobId, applyL2dopTieredLootToMob } from "./tieredResourceLoot";

import type { Mob } from "../types";
import { applyL2dopTieredLootToMob } from "./tieredResourceLoot";

/** @param zoneId — id зони (для пулу спойлу та стабільного сіду) */
export function applyL2XmlDropsToMob<T extends Mob>(mob: T, zoneId: string, slotIndex = 0): T {
  return applyL2dopTieredLootToMob(mob, zoneId, slotIndex);
}
