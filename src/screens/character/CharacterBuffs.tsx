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
    <div className="mt-2 border-t border-dotted border-separator pt-2">
      <div className="flex flex-wrap gap-1.5">
        {uniqueBuffs.map((buff: any, idx: number) => {
          let iconSrc = buff.icon?.startsWith("/") ? buff.icon : `/skills/${buff.icon || ""}`;
          
          return (
            <img
              key={idx}
              src={iconSrc}
              alt={buff.name || "Buff"}
              className="w-5 h-5 object-contain"
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
