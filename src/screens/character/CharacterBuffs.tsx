import React from "react";
import { useHeroStore } from "../../state/heroStore";
import { useBattleStore } from "../../state/battle/store";
import { loadBattle } from "../../state/battle/persist";
import { cleanupBuffs } from "../../state/battle/helpers";

export default function CharacterBuffs() {
  const hero = useHeroStore((s) => s.hero);
  const battleStatus = useBattleStore((s) => s.status);
  const battleBuffs = useBattleStore((s) => s.heroBuffs || []);

  if (!hero) return null;

  // Завантажуємо бафи з battle state (включаючи бафи статуї) навіть поза боєм
  const now = Date.now();
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

  return (
    <div className="mt-2 border-t border-dotted border-[#6f5a35] pt-2">
      <div className="text-[11px] text-yellow-300 font-semibold mb-1">
        Мої бафи ({uniqueBuffs.length})
      </div>
      <div className="space-y-1.5">
        {uniqueBuffs.map((buff: any, idx: number) => {
          const timeLeft = Math.max(0, Math.floor((buff.expiresAt - now) / 1000));
          const minutes = Math.floor(timeLeft / 60);
          const seconds = timeLeft % 60;
          const timeLeftStr = minutes > 0 ? `${minutes}м ${seconds}с` : `${seconds}с`;
          
          let iconSrc = buff.icon?.startsWith("/") ? buff.icon : `/skills/${buff.icon || ""}`;
          
          return (
            <div key={idx} className="flex items-start gap-2">
              <img
                src={iconSrc}
                alt={buff.name || "Buff"}
                className="w-4 h-4 object-contain flex-shrink-0 mt-0.5"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/skills/skill0000.gif";
                }}
              />
              <div className="flex-1">
                <div className="text-[10px] text-gray-300">
                  {buff.name || "Невідомий баф"}
                </div>
                <div className="text-[9px] text-green-400 mt-0.5">
                  {timeLeftStr}
                </div>
                {buff.source === "skill" && (
                  <div className="text-[9px] text-blue-400 mt-0.5">
                    (Від гравця)
                  </div>
                )}
                {buff.source === "buffer" && (
                  <div className="text-[9px] text-yellow-400 mt-0.5">
                    (Городський баф)
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
