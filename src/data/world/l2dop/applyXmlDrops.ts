// Підставляє дроп/спойл з L2 XML (l2XmlDrops.generated.ts) для мобів id виду l2dop_<npcId>…
import type { Mob } from "../types";
import type { DropEntry } from "../../combat/types";
import { L2_XML_DROPS_BY_NPC, type L2XmlNpcDrops } from "./l2XmlDrops.generated";
import {
  USE_CORE_RESOURCE_LOOT_ONLY,
  getCoreResourceDrops,
  getCoreResourceSpoil,
} from "./coreL2ResourceLoot";

function keepL2DropRow(d: DropEntry): boolean {
  if (d.kind === "equipment" || d.kind === "other") return false;
  return d.kind === "adena" || d.kind === "resource";
}

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
  if (USE_CORE_RESOURCE_LOOT_ONLY && nid !== undefined) {
    return {
      ...mob,
      drops: getCoreResourceDrops(),
      spoil: getCoreResourceSpoil(),
      dropChance: 1,
    };
  }
  if (nid === undefined) return mob;
  const pack = getPack(nid);
  const rawDrops = pack?.drops ?? [];
  const rawSpoil = pack?.spoil ?? [];
  if (!rawDrops.length && !rawSpoil.length) return mob;

  const drops = rawDrops.filter(keepL2DropRow);
  const spoilFiltered = rawSpoil.filter(keepL2DropRow);

  return {
    ...mob,
    drops: rawDrops.length ? drops : mob.drops,
    spoil: rawSpoil.length ? (spoilFiltered.length ? spoilFiltered : undefined) : undefined,
    dropChance: 1,
  };
}
