// Персистенція сесії рибалки: тепер на сервері (heroJson.fishingSession)
// Один акаунт = одна сесія на всіх пристроях
import * as api from "../../utils/api";

export type FishingSession = api.FishingSession;

const FISHING_DURATION_MS = 60 * 60 * 1000;

/** Завантажує сесію з сервера */
export async function fetchFishingSession(
  characterId: string
): Promise<FishingSession | null> {
  if (!characterId) return null;
  return api.getFishingSession(characterId);
}

/** Чи пройшла година з початку сесії */
export function isFishingReady(session: FishingSession | null): boolean {
  if (!session) return false;
  return Date.now() - session.startedAt >= FISHING_DURATION_MS;
}
