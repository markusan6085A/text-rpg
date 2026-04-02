import React from "react";
import {
  locations as WORLD_LOCATIONS,
  cities as WORLD_CITIES,
} from "../../data/world";
import type { City, Zone, Mob } from "../../data/world/types";
import { getWorldMobHpForSlot } from "../../state/worldMobHpStore";
import { getL2DropEntryByItemIdPath } from "../../data/world/l2dop/droplistMapping";
import { resolveLootIconPathFromItemId } from "../../utils/lootIconPath";
import type { DropEntry } from "../../data/combat/types";
import { getMobEffectiveMaxHp } from "../../utils/mobs/mobEffectiveMaxHp";

export function formatDropChanceLabel(d: Pick<DropEntry, "chance" | "chancePerMillion">): string {
  if (d.chancePerMillion != null && d.chancePerMillion > 0) {
    const pct = (d.chancePerMillion / 1_000_000) * 100;
    return `${pct >= 0.01 ? pct.toFixed(2) : pct.toFixed(4)}%`;
  }
  return `${Math.round((d.chance ?? 0) * 100)}%`;
}

export function dropLineIconPath(entry: DropEntry): string {
  const fromId = resolveLootIconPathFromItemId(entry.id);
  if (fromId !== "/items/default_item.png") return fromId;
  const byItem = getL2DropEntryByItemIdPath(entry);
  if (byItem) return byItem;
  return "/items/default_item.png";
}

/** l2dop-by-itemid: спочатку .jpg, якщо немає — одна спроба .png (після sync скрипта) */
export function onL2ResourceIconImgError(e: React.SyntheticEvent<HTMLImageElement>) {
  const el = e.currentTarget;
  if (el.dataset.l2Png === "1") {
    el.style.display = "none";
    return;
  }
  if (/\.jpg($|\?)/i.test(el.src)) {
    el.dataset.l2Png = "1";
    el.src = el.src.replace(/\.jpg($|\?)/i, ".png$1");
    return;
  }
  el.style.display = "none";
}

export function useLocationSearchParams() {
  return React.useMemo(() => new URLSearchParams(location.search), []);
}

/** Поточне HP зі світового кешу (сервер/local patch) або повний max, якщо запису ще немає */
export function getMobWorldHpDisplay(
  zoneId: string,
  globalIndex: number,
  mob: Mob
): { current: number; max: number } {
  const max = getMobEffectiveMaxHp(mob);
  if (!zoneId) return { current: max, max };
  const slot = getWorldMobHpForSlot(zoneId, globalIndex);
  if (!slot || !Number.isFinite(slot.currentHp)) return { current: max, max };
  const cur = Math.max(0, Math.min(Math.round(slot.currentHp), max));
  return { current: cur, max };
}

export function findZoneById(zoneId: string): { zone: Zone; city: City } | undefined {
  const zone = WORLD_LOCATIONS.find((z) => z.id === zoneId);
  if (!zone) return undefined;
  const city = WORLD_CITIES.find((c) => c.id === zone.cityId);
  if (!city) return undefined;
  return { zone, city };
}
