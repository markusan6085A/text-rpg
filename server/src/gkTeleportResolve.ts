import { GK_TELEPORT_CITY_COSTS, GK_TELEPORT_ZONE_COSTS } from "./gkTeleportCosts.generated";

/** Поріг безкоштовних телепортів GK (включно) — має збігатися з клієнтом. */
export const GK_FREE_TELEPORT_MAX_LEVEL = 40;

/** Дубль costs Ancient Tomb (tools/buildGkTeleportCosts.mjs) — якщо API зібрано без оновлення *.generated.ts. */
const ANCIENT_TOMB_CITY_ID = "ancient_tomb_fields";
const ANCIENT_TOMB_CITY_COST = 62_000;
const ANCIENT_TOMB_ZONE_COSTS: Readonly<Record<string, number>> = {
  ancient_tomb_fields_01: 32_000,
  ancient_tomb_fields_02: 34_500,
  ancient_tomb_fields_03: 37_000,
  ancient_tomb_fields_04: 39_500,
  ancient_tomb_fields_05: 42_000,
  ancient_tomb_fields_06: 44_500,
  ancient_tomb_fields_07: 47_000,
  ancient_tomb_fields_08: 49_500,
  ancient_tomb_fields_09: 52_000,
  ancient_tomb_fields_10: 54_500,
};

function resolveRawTeleportCost(kind: "city" | "zone", targetId: string): number | undefined {
  const table = kind === "city" ? GK_TELEPORT_CITY_COSTS : GK_TELEPORT_ZONE_COSTS;
  const fromTable = table[targetId];
  if (fromTable !== undefined) return fromTable;
  if (kind === "city" && targetId === ANCIENT_TOMB_CITY_ID) return ANCIENT_TOMB_CITY_COST;
  if (kind === "zone") {
    const z = ANCIENT_TOMB_ZONE_COSTS[targetId];
    if (z !== undefined) return z;
  }
  return undefined;
}

export function resolveGkTeleportAdenaCharge(params: {
  heroLevel: number;
  kind: "city" | "zone";
  targetId: string;
}): number | null {
  const lvl = Math.max(1, Math.floor(Number(params.heroLevel)));
  const raw = resolveRawTeleportCost(params.kind, params.targetId);
  if (raw === undefined) return null;
  if (lvl <= GK_FREE_TELEPORT_MAX_LEVEL) return 0;
  return Math.max(0, raw);
}
