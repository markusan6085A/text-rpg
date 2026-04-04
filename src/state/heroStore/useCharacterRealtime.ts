// Supabase Realtime subscription for Character table — замість polling GET /characters/:id
// Коли Character оновлюється в БД (fishing, battle, інший пристрій), отримуємо подію і синкаємо serverState.
// Реалтайм не гарантує порядок: застарілий рядок з нижчою heroRevision не має відкочувати адену/exp (як heartbeat + updatedAt).
import { useEffect, useRef } from "react";
import { getSupabaseClient } from "../../utils/supabase";
import { useCharacterStore } from "../characterStore";
import { useHeroStore } from "../heroStore";
import { saveHeroToLocalStorageOnly } from "./heroPersistence";

function num(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === "bigint") return Number(v);
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function parseHeroJsonField(raw: unknown): Record<string, unknown> | null {
  if (raw == null) return null;
  if (typeof raw === "object" && !Array.isArray(raw)) return raw as Record<string, unknown>;
  if (typeof raw === "string") {
    try {
      const p = JSON.parse(raw);
      return p != null && typeof p === "object" && !Array.isArray(p) ? p : null;
    } catch {
      return null;
    }
  }
  return null;
}

/** Вирівняно з heroLoadAPI: heroJson.meta.__heroRevision або heroJson.heroRevision */
function parseHeroRevision(hj: Record<string, unknown> | null): number {
  if (!hj) return 0;
  const meta = hj.meta;
  if (meta && typeof meta === "object" && !Array.isArray(meta)) {
    const fromMeta = (meta as Record<string, unknown>).__heroRevision;
    if (typeof fromMeta === "number" && Number.isFinite(fromMeta)) return fromMeta;
  }
  const r = num(hj.heroRevision);
  return r;
}

function localHeroRevisionFromStore(): number {
  const { hero, serverState } = useHeroStore.getState();
  const fromState = num(serverState?.heroRevision);
  const hj = hero ? parseHeroJsonField((hero as any).heroJson) : null;
  const fromHeroJson = parseHeroRevision(hj);
  const fromHeroTop = num((hero as any)?.heroRevision);
  return Math.max(fromState, fromHeroJson, fromHeroTop);
}

export function useCharacterRealtime() {
  const characterId = useCharacterStore((s) => s.characterId);
  const channelRef = useRef<ReturnType<ReturnType<typeof getSupabaseClient>["channel"]> | null>(null);

  useEffect(() => {
    if (!characterId) return;

    const supabase = getSupabaseClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`character:${characterId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "Character",
          filter: `id=eq.${characterId}`,
        },
        (payload) => {
          const newRow = payload.new as Record<string, unknown> | null;
          if (!newRow) return;

          const hero = useHeroStore.getState().hero;
          if (!hero) return;

          const heroJson = parseHeroJsonField(newRow.heroJson ?? newRow.hero_json);
          const incomingRev = parseHeroRevision(heroJson);
          const localRev = localHeroRevisionFromStore();

          if (incomingRev > 0 && localRev > 0 && incomingRev < localRev) {
            if (import.meta.env.DEV) {
              console.log("[CharacterRealtime] Skip stale row (revision)", { incomingRev, localRev });
            }
            return;
          }

          if (incomingRev === 0 && localRev > 0) {
            if (import.meta.env.DEV) {
              console.log("[CharacterRealtime] Skip row without revision (local has lock)", { localRev });
            }
            return;
          }

          const revAdvanced = incomingRev > 0 && localRev > 0 && incomingRev > localRev;
          const revCatchUp = incomingRev > 0 && localRev === 0;
          const authoritativeRevOpts = revAdvanced || revCatchUp ? { revisionFromAuthoritativeGet: true as const } : undefined;

          const hjExp = heroJson ? num(heroJson.exp) : 0;
          const hjLevel = heroJson ? num(heroJson.level) : 0;
          const hjSp = heroJson ? num(heroJson.sp) : 0;
          const hjAdena = heroJson ? num(heroJson.adena) : 0;
          const hjCoin = heroJson ? num(heroJson.coinOfLuck) : 0;

          const serverExp = num(newRow.exp ?? hjExp);
          const serverLevelRaw = num(newRow.level ?? hjLevel);
          const level = serverLevelRaw >= 1 ? serverLevelRaw : 1;
          const serverSp = num(newRow.sp ?? hjSp);
          const serverAdena = num(newRow.adena ?? hjAdena);
          const serverCoinLuck = num(newRow.coinLuck ?? newRow.coin_luck ?? hjCoin);

          const exp = serverExp;
          const sp = serverSp;
          const adena = serverAdena;
          const coinLuck = serverCoinLuck;

          const heroRevisionForState =
            incomingRev > 0 ? incomingRev : undefined;

          useHeroStore.getState().updateServerState(
            {
              exp,
              level,
              sp,
              adena,
              coinLuck,
              heroRevision: heroRevisionForState,
              updatedAt: Date.now(),
            },
            authoritativeRevOpts
          );

          // Без persist: інакше кожен real-time UPDATE → debouncedSave / PUT шторм і гонки з optimistic save.
          useHeroStore.getState().updateHero(
            {
              adena,
              exp,
              level,
              sp,
              coinOfLuck: coinLuck,
            } as any,
            { persist: false }
          );
          const h = useHeroStore.getState().hero;
          if (h) saveHeroToLocalStorageOnly(h);

          if (import.meta.env.DEV) {
            console.log("[CharacterRealtime] Character updated from DB:", {
              exp,
              level,
              sp,
              adena,
              incomingRev,
              localRev,
              authoritative: !!authoritativeRevOpts,
            });
          }
        }
      )
      .subscribe((status) => {
        if (import.meta.env.DEV && status === "SUBSCRIBED") {
          console.log("[CharacterRealtime] Subscribed to Character updates for", characterId);
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [characterId]);
}
