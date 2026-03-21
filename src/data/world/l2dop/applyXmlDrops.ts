// Підставляє дроп/спойл з L2 XML (l2XmlDrops.generated.ts) для мобів id виду l2dop_<npcId>…
import type { Mob } from "../types";
import { L2_XML_DROPS_BY_NPC, type L2XmlNpcDrops } from "./l2XmlDrops.generated";

const L2DOP_NUMERIC_ID = /^l2dop_(\d+)/;

export function l2NpcTemplateIdFromMobId(mobId: string): number | undefined {
  const m = L2DOP_NUMERIC_ID.exec(mobId);
  return m ? parseInt(m[1], 10) : undefined;
}

function getPack(npcId: number): L2XmlNpcDrops | undefined {
  const raw = L2_XML_DROPS_BY_NPC as unknown as Record<number | string, L2XmlNpcDrops>;
  return raw[npcId] ?? raw[String(npcId)];
}

/** Клонує моба з дропом з XML; не чіпає рейд-босів / мобів без шаблону в таблиці. */
export function applyL2XmlDropsToMob<T extends Mob>(mob: T): T {
  const nid = l2NpcTemplateIdFromMobId(mob.id);
  if (nid === undefined) return mob;
  const pack = getPack(nid);
  if (!pack?.drops?.length && !pack?.spoil?.length) return mob;
  const spoil = pack.spoil?.length ? [...pack.spoil] : undefined;
  return {
    ...mob,
    drops: pack.drops?.length ? [...pack.drops] : mob.drops,
    spoil,
    dropChance: 1,
  };
}
