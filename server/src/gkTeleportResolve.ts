import { GK_TELEPORT_CITY_COSTS, GK_TELEPORT_ZONE_COSTS } from "./gkTeleportCosts.generated";

/** Поріг безкоштовних телепортів GK (включно) — має збігатися з клієнтом. */
export const GK_FREE_TELEPORT_MAX_LEVEL = 40;

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
