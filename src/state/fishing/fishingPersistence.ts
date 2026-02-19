// Персистенція сесії рибалки: 1 година, потім можна забрати улов (100–300 риб)
import { getJSON, setJSON } from "../persistence";

const FISHING_KEY_PREFIX = "l2_fishing_";

export interface FishingSession {
  startedAt: number;
  fishCount?: number; // встановлюється після закінчення години
}

function getKey(characterId: string): string {
  return `${FISHING_KEY_PREFIX}${characterId}`;
}

export function getFishingSession(characterId: string): FishingSession | null {
  if (!characterId) return null;
  return getJSON<FishingSession | null>(getKey(characterId), null);
}

export function setFishingSession(characterId: string, session: FishingSession | null): void {
  if (!characterId) return;
  if (session === null) {
    try {
      localStorage.removeItem(getKey(characterId));
    } catch {
      /* ignore */
    }
    return;
  }
  setJSON(getKey(characterId), session);
}

const FISHING_DURATION_MS = 60 * 60 * 1000; // 1 година
const FISH_MIN = 100;
const FISH_MAX = 300;

export function isFishingReady(session: FishingSession | null): boolean {
  if (!session) return false;
  const elapsed = Date.now() - session.startedAt;
  return elapsed >= FISHING_DURATION_MS;
}

/** Повертає кількість риб для видачі (100–300). Якщо сесія ще не «готова», повертає 0. */
export function getOrRollFishCount(characterId: string): number {
  const session = getFishingSession(characterId);
  if (!session) return 0;
  const elapsed = Date.now() - session.startedAt;
  if (elapsed < FISHING_DURATION_MS) return 0;
  if (session.fishCount != null) return session.fishCount;
  const count = FISH_MIN + Math.floor(Math.random() * (FISH_MAX - FISH_MIN + 1));
  setFishingSession(characterId, { ...session, fishCount: count });
  return count;
}
