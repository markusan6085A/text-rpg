import React, { useState, useEffect } from "react";
import { useHeroStore } from "../../state/heroStore";
import { useBattleStore } from "../../state/battle/store";
import { loadBattle } from "../../state/battle/persist";
import { cleanupBuffs } from "../../state/battle/helpers";
import { filterBuffsForHeroProfession } from "../../state/battle/loadout";
import { getCharacter } from "../../utils/api";
import { isWarmCityUi, getCityUiVariant } from "../../utils/cityUiVariant";

/** Як у loadHeroFromAPI: не підміняти локальні бафи (GM-скроли, статуя) застарілим GET, коли на сервері їх ще нема. */
function mergeHeroJsonBuffsPreferLatest(localArr: any[], serverArr: any[], now: number): any[] {
  const byKey = (b: any) => `${b.id ?? ""}_${b.stackType ?? ""}_${b.name ?? ""}`;
  const raw = [...(Array.isArray(localArr) ? localArr : []), ...(Array.isArray(serverArr) ? serverArr : [])];
  const best = new Map<string, any>();
  for (const b of raw) {
    const k = byKey(b);
    const cur = best.get(k);
    const ex = Number(b.expiresAt) || 0;
    if (!cur || ex > (Number(cur.expiresAt) || 0)) best.set(k, b);
  }
  return cleanupBuffs([...best.values()], now);
}

export default function CharacterBuffs() {
  const hero = useHeroStore((s) => s.hero);
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
        const merged = mergeHeroJsonBuffsPreferLatest(localBuffs, serverBuffs, now);
        const localClean = cleanupBuffs(localBuffs, now);
        if (!disposed && JSON.stringify(merged) !== JSON.stringify(localClean)) {
          useHeroStore.getState().updateHero({ heroJson: { heroBuffs: merged } }, { persist: true });
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
  const displayBuffs = filterBuffsForHeroProfession(hero, uniqueBuffs);

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
                (e.target as HTMLImageElement).src = "/skills/skill0000.gif";
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
