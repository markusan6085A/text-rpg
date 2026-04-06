import React, { useState, useEffect } from "react";
import { useHeroStore } from "../../state/heroStore";
import { useBattleStore } from "../../state/battle/store";
import { cleanupBuffs } from "../../state/battle/helpers";
import { getCharacter } from "../../utils/api";
import { isWarmCityUi, getCityUiVariant } from "../../utils/cityUiVariant";
import { SKILL_ICON_ERROR_FALLBACK } from "../../utils/skillIconUrls";
import { getCombinedHeroBuffs } from "../../utils/heroBuffedResources";

export default function CharacterBuffs() {
  const hero = useHeroStore((s) => s.hero);
  const battleStatus = useBattleStore((s) => s.status);
  // 🔥 Таймер — перерендер кожну секунду, щоб зникали прострочені бафи
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // 🔥 Синхронізуємо heroJson.heroBuffs із сервера (коли бафають інші гравці)
  useEffect(() => {
    if (!hero?.id) return;

    let disposed = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    const syncFromServer = async () => {
      const hid = useHeroStore.getState().hero?.id;
      if (!hid || disposed) return;
      try {
        const data = await getCharacter(hid);
        const serverBuffs = Array.isArray((data as any)?.heroJson?.heroBuffs)
          ? (data as any).heroJson.heroBuffs
          : [];
        const cur = useHeroStore.getState().hero;
        const localBuffs = Array.isArray((cur as any)?.heroJson?.heroBuffs)
          ? (cur as any).heroJson.heroBuffs
          : [];

        const now = Date.now();
        const serverRev = Number((data as any)?.heroJson?.heroRevision ?? 0);
        const localRev = Number((cur as any)?.heroJson?.heroRevision ?? 0);
        // При однаковій ревізії GET не застосовуємо: merge з сервером постійно повертав зняті бафи зі статуї/скролів.
        if (!Number.isFinite(serverRev) || !Number.isFinite(localRev) || serverRev <= localRev) {
          return;
        }

        // Один канон після підтверджено новішої ревізії: список з БД, без merge з локалкою.
        const serverClean = cleanupBuffs(serverBuffs, now);
        const localClean = cleanupBuffs(localBuffs, now);
        if (!disposed && JSON.stringify(serverClean) !== JSON.stringify(localClean)) {
          useHeroStore.getState().updateHero({ heroJson: { heroBuffs: serverClean } }, { persist: true });
        }
      } catch (e: unknown) {
        if ((e as { status?: number })?.status === 404 && intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }
    };

    syncFromServer();
    // Рідше за 5 с — менше PUT-навантаження; злиття бафів не вимагає такого частого опитування.
    intervalId = setInterval(syncFromServer, 30_000);
    return () => {
      disposed = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [hero?.id]);

  if (!hero) return null;

  const displayBuffs = getCombinedHeroBuffs(hero, battleStatus === "fighting");

  if (displayBuffs.length === 0) return null;

  const isL2 = isWarmCityUi(getCityUiVariant());

  return (
    <div
      className={
        isL2
          ? "mt-2 border-t border-solid border-[#5c4a32]/45 pt-2"
          : "mt-2 border-t border-solid border-white/25 pt-2"
      }
    >
      <div className="flex flex-wrap gap-1.5">
        {displayBuffs.map((buff: any) => {
          let iconSrc = buff.icon?.startsWith("/") ? buff.icon : `/skills/${buff.icon || ""}`;
          
          return (
            <img
              key={buff.id ? `id_${buff.id}` : `name_${buff.name}_${buff.expiresAt}`}
              src={iconSrc}
              alt={buff.name || "Buff"}
              className={
                isL2
                  ? "w-5 h-5 object-contain rounded border border-[#5c4a32]/55 bg-black/30 shadow-[inset_0_1px_0_rgba(199,173,128,0.06)]"
                  : "w-5 h-5 object-contain"
              }
              title={buff.name || "Buff"}
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.onerror = null;
                img.src = SKILL_ICON_ERROR_FALLBACK;
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
