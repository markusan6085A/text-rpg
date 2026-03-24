import { L2DOP_CITIES } from "./l2dop/cities";
import { GK_ZONE_TP_COSTS_GENERATED } from "./gkZoneTpCosts.generated";

/** Поріг безкоштовних телепортів GK (включно) — має збігатися з сервером (gkTeleportResolve). */
export const GK_FREE_TELEPORT_MAX_LEVEL = 40;

export const GK_TELEPORT_CITY_COSTS: Readonly<Record<string, number>> = Object.fromEntries(
  L2DOP_CITIES.map((c) => [c.id, c.tpCost ?? 0]),
);

export const GK_TELEPORT_ZONE_COSTS = GK_ZONE_TP_COSTS_GENERATED;

export function resolveGkTeleportAdenaCharge(params: {
  heroLevel: number;
  kind: "city" | "zone";
  targetId: string;
}): number | null {
  const lvl = Math.max(1, Math.floor(Number(params.heroLevel)));
  const table = params.kind === "city" ? GK_TELEPORT_CITY_COSTS : GK_TELEPORT_ZONE_COSTS;
  const raw = table[params.targetId];
  if (raw === undefined) return null;
  if (lvl <= GK_FREE_TELEPORT_MAX_LEVEL) return 0;
  return Math.max(0, raw);
}
