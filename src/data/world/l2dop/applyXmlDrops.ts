// l2dop_<npcId> моби: дроп/спойл з XML (l2XmlDrops.generated.ts) не підставляються — порожні таблиці в об'єкті моба.
import type { Mob } from "../types";

const L2DOP_NUMERIC_ID = /^l2dop_(\d+)/;

export function l2NpcTemplateIdFromMobId(mobId: string): number | undefined {
  const m = L2DOP_NUMERIC_ID.exec(mobId);
  return m ? parseInt(m[1], 10) : undefined;
}

export function applyL2XmlDropsToMob<T extends Mob>(mob: T): T {
  const nid = l2NpcTemplateIdFromMobId(mob.id);
  if (nid === undefined) return mob;
  return {
    ...mob,
    drops: [],
    spoil: undefined,
  };
}
