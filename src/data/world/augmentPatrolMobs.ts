// Патрульні моби в кожній зоні: 1–3 на «сторінку» (розмір з getGameSettings().mobsPerPage).
// Стати: pAtk×2, mAtk×4. На списку локації з 4-ї сторінки — періодичні маг-удари (див. Location.tsx).
// У бої — фізичний урон (processMobAttack).

import type { Mob, Zone } from "./types";
import { getGameSettings } from "../../state/gameSettings";

/** Перші N сторінок: патруль не б'є магією по герою на екрані локації */
export const AGGRESSIVE_PATROL_SAFE_PAGES = 3;

function seededUnit(zoneId: string, page: number, salt: number): number {
  let h = 0;
  const s = `${zoneId}:${page}:${salt}`;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (h >>> 0) / 0xffffffff;
}

function skipPatrolCandidate(mob: Mob): boolean {
  if ((mob as { isRaidBoss?: boolean }).isRaidBoss === true) return true;
  if (mob.aggressivePatrol) return true;
  const n = mob.name;
  if (n.startsWith("[Champion]") || n.startsWith("[Чемпион]") || n.startsWith("[Чемпіон]")) return true;
  if (n.startsWith("Raid Boss:")) return true;
  return false;
}

function scalePatrolMob(mob: Mob): Mob {
  return {
    ...mob,
    pAtk: Math.round(mob.pAtk * 2),
    mAtk: Math.round((mob.mAtk ?? 0) * 4),
    aggressivePatrol: true,
  };
}

function pickPatrolIndices(zoneId: string, page: number, available: number[], take: number): number[] {
  const arr = [...available];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(seededUnit(zoneId, page, i * 7919 + 17) * (i + 1));
    const t = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = t;
  }
  return arr.slice(0, take);
}

function augmentZoneMobs(zone: Zone, pageSize: number): Zone {
  const mobs = zone.mobs.map((m) => ({ ...m }));
  let p = 0;
  while (p * pageSize < mobs.length) {
    const start = p * pageSize;
    const end = Math.min(start + pageSize, mobs.length);
    const available: number[] = [];
    for (let i = start; i < end; i++) {
      if (!skipPatrolCandidate(mobs[i]!)) available.push(i);
    }
    if (available.length > 0) {
      const r = seededUnit(zone.id, p, 404);
      const want = 1 + Math.floor(r * 3);
      const take = Math.min(want, available.length);
      const chosen = pickPatrolIndices(zone.id, p, available, take);
      for (const idx of chosen) {
        mobs[idx] = scalePatrolMob(mobs[idx]!);
      }
    }
    p++;
  }
  return { ...zone, mobs };
}

export function augmentAllZonesWithPatrolMobs(zones: Zone[]): Zone[] {
  const pageSize = getGameSettings().mobsPerPage ?? 15;
  return zones.map((z) => augmentZoneMobs(z, pageSize));
}
