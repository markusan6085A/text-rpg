import React, { useState, useEffect } from "react";
import { useHeroStore } from "../../state/heroStore";
import { useBattleStore } from "../../state/battle/store";
import { loadBattle } from "../../state/battle/persist";
import { cleanupBuffs } from "../../state/battle/helpers";
import { getCharacter } from "../../utils/api";
import { getCityUiVariant } from "../../utils/cityUiVariant";

export default function CharacterBuffs() {
  const hero = useHeroStore((s) => s.hero);
  const updateHero = useHeroStore((s) => s.updateHero);
  const battleStatus = useBattleStore((s) => s.status);
  const battleBuffs = useBattleStore((s) => s.heroBuffs || []);
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
    const syncFromServer = async () => {
      try {
        const data = await getCharacter(hero.id);
        const serverBuffs = Array.isArray((data as any)?.heroJson?.heroBuffs)
          ? (data as any).heroJson.heroBuffs
          : [];
        const localBuffs = Array.isArray((hero as any)?.heroJson?.heroBuffs)
          ? (hero as any).heroJson.heroBuffs
          : [];

        if (!disposed && JSON.stringify(serverBuffs) !== JSON.stringify(localBuffs)) {
          // Use current state to avoid stale closures
          useHeroStore.getState().updateHero({ heroJson: { heroBuffs: serverBuffs } }, { persist: false });
        }
      } catch {
        // ignore
      }
    };

    syncFromServer();
    const t = setInterval(syncFromServer, 5000);
    return () => {
      disposed = true;
      clearInterval(t);
    };
  }, [hero?.id]);

  if (!hero) return null;

  // Завантажуємо бафи з battle state (включаючи бафи статуї) навіть поза боєм
  const savedBattle = loadBattle(hero.name);
  const savedBuffs = cleanupBuffs(savedBattle?.heroBuffs || [], now);
  const activeBuffs = battleStatus === "fighting" 
    ? cleanupBuffs(battleBuffs, now) 
    : savedBuffs;

  // Також перевіряємо heroJson.heroBuffs (якщо є)
  const heroJson = (hero as any)?.heroJson || {};
  const heroJsonBuffs = Array.isArray(heroJson.heroBuffs) ? heroJson.heroBuffs : [];
  const activeHeroJsonBuffs = heroJsonBuffs.filter((b: any) => {
    if (!b.expiresAt) return false;
    return b.expiresAt > now;
  });

  // Об'єднуємо бафи з обох джерел (уникаємо дублікатів)
  const allActiveBuffs = [...activeBuffs, ...activeHeroJsonBuffs];
  
  // Видаляємо дублікати за id або name
  const uniqueBuffs = allActiveBuffs.filter((buff, index, self) => 
    index === self.findIndex((b) => 
      (b.id && buff.id && b.id === buff.id) || 
      (!b.id && !buff.id && b.name === buff.name)
    )
  );

  if (uniqueBuffs.length === 0) return null;

  const isL2 = getCityUiVariant() === "l2";

  return (
    <div
      className={
        isL2
          ? "mt-2 border-t border-solid border-[#5c4a32]/45 pt-2"
          : "mt-2 border-t border-solid border-white/25 pt-2"
      }
    >
      <div className="flex flex-wrap gap-1.5">
        {uniqueBuffs.map((buff: any) => {
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
                (e.target as HTMLImageElement).src = "/skills/skill0000.gif";
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
