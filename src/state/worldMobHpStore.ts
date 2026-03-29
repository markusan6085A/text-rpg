import {
  fetchWorldZoneMobStateApi,
  getAccessToken,
  putWorldMobHp,
} from "../utils/api";

type ZoneEntry = {
  fetchedAt: number;
  hp: Record<number, { currentHp: number; maxHp: number }>;
  respawnUntil: Record<number, number>;
};

const zoneCache = new Map<string, ZoneEntry>();
const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
const DEBOUNCE_MS = 1200;
const CACHE_TTL_MS = 20000;

function mergeZonePayload(
  zoneId: string,
  rawHp: Record<string, { currentHp: number; maxHp: number }>,
  rawRespawn: Record<string, string>
) {
  const hp: Record<number, { currentHp: number; maxHp: number }> = {};
  for (const k of Object.keys(rawHp || {})) {
    const idx = Number(k);
    const v = rawHp[k];
    if (!Number.isFinite(idx) || !v || typeof v.currentHp !== "number" || typeof v.maxHp !== "number") continue;
    hp[idx] = { currentHp: v.currentHp, maxHp: v.maxHp };
  }
  const respawnUntil: Record<number, number> = {};
  for (const k of Object.keys(rawRespawn || {})) {
    const idx = Number(k);
    const iso = rawRespawn[k];
    const t = typeof iso === "string" ? Date.parse(iso) : NaN;
    if (!Number.isFinite(idx) || !Number.isFinite(t)) continue;
    if (t > Date.now()) respawnUntil[idx] = t;
  }
  zoneCache.set(zoneId, { fetchedAt: Date.now(), hp, respawnUntil });
}

/**
 * Підвантажує HP/респавн з сервера в кеш. Без токена — no-op.
 * @param force якщо true — ігнорує TTL (наприклад перед боєм).
 */
export async function ensureWorldZoneLoaded(
  zoneId: string,
  opts?: { force?: boolean }
): Promise<void> {
  const force = opts?.force === true;
  const cur = zoneCache.get(zoneId);
  if (!force && cur && Date.now() - cur.fetchedAt < CACHE_TTL_MS) return;

  const token = getAccessToken();
  if (!token) return;

  try {
    const data = await fetchWorldZoneMobStateApi(zoneId);
    if (!data || (data as any).error || data.ok === false) return;
    mergeZonePayload(zoneId, data.hp || {}, data.respawn || {});
  } catch {
    /* offline */
  }
}

export function getWorldMobHpForSlot(
  zoneId: string,
  mobIndex: number
): { currentHp: number; maxHp: number } | null {
  const c = zoneCache.get(zoneId);
  if (!c) return null;
  return c.hp[mobIndex] ?? null;
}

/** Timestamp ms, коли моб знову доступний; null якщо немає активного респавну в кеші. */
export function getWorldRespawnUntilMs(zoneId: string, mobIndex: number): number | null {
  const c = zoneCache.get(zoneId);
  if (!c) return null;
  const t = c.respawnUntil[mobIndex];
  if (typeof t === "number" && t > Date.now()) return t;
  return null;
}

export function scheduleWorldMobHpSync(
  zoneId: string,
  mobIndex: number,
  currentHp: number,
  maxHp: number
): void {
  const token = getAccessToken();
  if (!token) return;
  if (currentHp < 1 || maxHp < 1 || currentHp > maxHp) return;

  const k = `${zoneId}_${mobIndex}`;
  const existing = debounceTimers.get(k);
  if (existing) clearTimeout(existing);
  debounceTimers.set(
    k,
    setTimeout(() => {
      debounceTimers.delete(k);
      void putWorldMobHp(zoneId, mobIndex, currentHp, maxHp).catch(() => {});
    }, DEBOUNCE_MS)
  );
}

/** Після успішного POST /kill — оновити кеш локально. */
export function applyWorldMobKillLocal(
  zoneId: string,
  mobIndex: number,
  respawnDelayMs: number,
  respawnAtIso?: string
): void {
  let cur = zoneCache.get(zoneId);
  if (!cur) {
    cur = { fetchedAt: Date.now(), hp: {}, respawnUntil: {} };
    zoneCache.set(zoneId, cur);
  }
  delete cur.hp[mobIndex];
  const until = respawnAtIso ? Date.parse(respawnAtIso) : Date.now() + respawnDelayMs;
  if (Number.isFinite(until) && until > Date.now()) {
    cur.respawnUntil[mobIndex] = until as number;
  } else {
    delete cur.respawnUntil[mobIndex];
  }
  cur.fetchedAt = Date.now();
}
