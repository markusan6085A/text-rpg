// Персистенція сесії рибалки: тепер на сервері (heroJson.fishingSession)
// Один акаунт = одна сесія на всіх пристроях
import * as api from "../../utils/api";

export type FishingSession = api.FishingSession;

const FISHING_DURATION_MS = 60 * 60 * 1000;

/** Завантажує сесію з сервера */
export async function fetchFishingSession(
  characterId: string
): Promise<api.FishingSessionResponse> {
  if (!characterId) {
    return { ok: true, session: null, serverNow: Date.now() };
  }
  return api.getFishingSession(characterId);
}

/** Чи пройшла година з початку сесії */
export function isFishingReady(session: FishingSession | null, nowMs: number = Date.now()): boolean {
  if (!session) return false;
  return nowMs - session.startedAt >= FISHING_DURATION_MS;
}
