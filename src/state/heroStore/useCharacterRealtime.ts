// Supabase Realtime subscription for Character table — замість polling GET /characters/:id
// Коли Character оновлюється в БД (fishing, battle, інший пристрій), отримуємо подію і синкаємо serverState
import { useEffect, useRef } from "react";
import { getSupabaseClient } from "../../utils/supabase";
import { useCharacterStore } from "../characterStore";
import { useHeroStore } from "../heroStore";

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
          const newRow = payload.new as Record<string, unknown>;
          if (!newRow) return;

          const exp = Number(newRow.exp ?? 0);
          const level = Number(newRow.level ?? 1);
          const sp = Number(newRow.sp ?? 0);
          const heroJson = newRow.heroJson as Record<string, unknown> | undefined;
          const heroRevision = heroJson && typeof heroJson === "object" ? (heroJson as any).heroRevision : undefined;

          useHeroStore.getState().updateServerState({
            exp,
            level,
            sp,
            coinLuck: Number(newRow.coinLuck ?? 0),
            heroRevision,
            updatedAt: Date.now(),
          });

          if (import.meta.env.DEV) {
            console.log("[CharacterRealtime] Character updated from DB:", { exp, level, sp });
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
