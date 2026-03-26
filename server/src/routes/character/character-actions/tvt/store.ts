import type { TvtMatchState } from "./types";

/** characterId -> slotId (один слот на персонажа на день) */
export const tvtRegistrations = new Map<string, { dayKey: string; slotId: string }>();

export const tvtMatches = new Map<string, TvtMatchState>();

/** `${dayKey}_${slotId}` — матч уже стартував сьогодні */
export const tvtStartedSlots = new Set<string>();

export function regKey(dayKey: string, slotId: string): string {
  return `${dayKey}_${slotId}`;
}
