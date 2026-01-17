import React, { useState, useEffect } from "react";
import { recalculateAllStats } from "../../utils/stats/recalculateAllStats";
import { calcBaseStats } from "../../utils/stats/calcBaseStats";
import { useHeroStore } from "../../state/heroStore";
import { useBattleStore } from "../../state/battle/store";
import { loadBattle } from "../../state/battle/persist";
import { cleanupBuffs } from "../../state/battle/helpers";
import { hasShieldEquipped, getTotalShieldDefense } from "../../utils/shield/shieldDefense";

export default function Stats() {
  const hero = useHeroStore((s) => s.hero);
  const battleBuffs = useBattleStore((s) => s.heroBuffs || []);
  const battleStatus = useBattleStore((s) => s.status);
  const [baseStats, setBaseStats] = useState<any>(null);
  const [combatStats, setCombatStats] = useState<any>(null);

  useEffect(() => {
    if (!hero) return;

    // Використовуємо централізовану функцію для перерахунку всіх статів
    const now = Date.now();
    // Завантажуємо бафи з battle state (включаючи бафи статуї) навіть поза боєм
    const savedBattle = loadBattle(hero.name);
    const savedBuffs = cleanupBuffs(savedBattle?.heroBuffs || [], now);
    const activeBuffs = battleStatus === "fighting" 
      ? cleanupBuffs(battleBuffs, now) 
      : savedBuffs;
    
    const recalculated = recalculateAllStats(hero, activeBuffs);
    
    setBaseStats(recalculated.baseStats);
    setCombatStats(recalculated.finalStats);
  }, [hero, battleBuffs, battleStatus]);

  if (!hero || !baseStats || !combatStats) {
    return <div className="text-white text-center mt-10">Загрузка...</div>;
  }

  // Функція для форматування чисел
  const formatStatValue = (value: number): string => {
    if (value >= 1000) {
      // Для чисел >= 1000: 1093.576 → округлюємо до цілого → 1094 → "1.094"
      const rounded = Math.round(value);
      // Форматуємо як тисяча з крапкою як роздільником
      return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    } else {
      // Для чисел < 1000: округлюємо до цілого (86.0 → 86, 152.6 → 153)
      return Math.round(value).toString();
    }
  };

  const race = hero.race || "Human";
  const level = hero.level || 1;
  
  // Визначаємо відображення професії
  let professionDisplay = "";
  const profession = hero.profession || "";
  
  if (!profession || profession === "") {
    // Якщо тільки створив героя - показуємо тільки расу
    professionDisplay = race;
  } else if (profession.includes("_")) {
    // Якщо є підкреслення (human_mystic_necromancer)
    const parts = profession.split("_");
    if (parts.length === 2) {
      // Перша профа: Human Mystic
      professionDisplay = `${race} ${parts[1].charAt(0).toUpperCase() + parts[1].slice(1)}`;
    } else if (parts.length >= 3) {
      // Друга профа: Necromancer
      professionDisplay = parts[parts.length - 1].charAt(0).toUpperCase() + parts[parts.length - 1].slice(1);
    } else {
      professionDisplay = profession;
    }
  } else {
    professionDisplay = profession;
  }

  return (
    <div className="w-full flex flex-col items-center text-white px-4 py-2">
      <div className="w-full max-w-[360px] bg-[#1a1a1a] border border-[#7c6847] rounded-lg p-4">
        {/* Інформація про персонажа */}
        <div className="mb-4 text-center">
          <div className="text-white font-semibold text-base mb-1">
            {hero.name || "Без имени"}
          </div>
          <div className="text-red-500 text-sm">
            {level} ур. — {professionDisplay}
          </div>
        </div>

        {/* Базовые характеристики */}
        <div className="mb-4">
          <div className="text-green-500 font-semibold text-sm mb-2">
            Базовые характеристики
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-red-500">STR:</span>
              <span className="text-white">{baseStats.STR}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-500">DEX:</span>
              <span className="text-white">{baseStats.DEX}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-500">CON:</span>
              <span className="text-white">{baseStats.CON}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-500">INT:</span>
              <span className="text-white">{baseStats.INT}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-500">WIT:</span>
              <span className="text-white">{baseStats.WIT}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-500">MEN:</span>
              <span className="text-white">{baseStats.MEN}</span>
            </div>
          </div>
        </div>

        {/* Боевые параметры */}
        <div>
          <div className="text-green-500 font-semibold text-sm mb-2">
            Боевые параметры
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
            {/* Ліва колонка */}
            <div className="flex flex-col space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#c88a5c]">Физ. атака</span>
                <span className="text-white">{formatStatValue(combatStats.pAtk)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#c88a5c]">Физ. защ</span>
                <span className="text-white">{formatStatValue(combatStats.pDef)}</span>
              </div>
              {hasShieldEquipped(hero) && (
                <>
                  <div className="flex justify-between">
                    <span className="text-[#c88a5c]">Защ. щитом</span>
                    <span className="text-white">+{formatStatValue(getTotalShieldDefense(hero, combatStats))}</span>
                  </div>
                  {combatStats.shieldBlockRate && combatStats.shieldBlockRate > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[#c88a5c]">Шанс блоку щита</span>
                      <span className="text-white">{formatStatValue(combatStats.shieldBlockRate)}%</span>
                    </div>
                  )}
                </>
              )}
              <div className="flex justify-between">
                <span className="text-[#c88a5c]">Точность</span>
                <span className="text-white">{formatStatValue(combatStats.accuracy)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#c88a5c]">Крит</span>
                <span className="text-white">{formatStatValue(combatStats.crit)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#c88a5c]">Скор. атаки</span>
                <span className="text-white">{formatStatValue(combatStats.attackSpeed)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#c88a5c]">НР реген</span>
                <span className="text-white">{formatStatValue(combatStats.hpRegen)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#c88a5c]">СР реген</span>
                <span className="text-white">{formatStatValue(combatStats.cpRegen)}</span>
              </div>
            </div>

            {/* Права колонка */}
            <div className="flex flex-col space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#c88a5c]">Маг. атака</span>
                <span className="text-white">{formatStatValue(combatStats.mAtk)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#c88a5c]">Маг. защ</span>
                <span className="text-white">{formatStatValue(combatStats.mDef)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#c88a5c]">Уклонение</span>
                <span className="text-white">{formatStatValue(combatStats.evasion)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#c88a5c]">Маг. крит</span>
                <span className="text-white">{formatStatValue(combatStats.mCrit)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#c88a5c]">Сила крита</span>
                <span className="text-white">{formatStatValue(combatStats.critPower)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#c88a5c]">Скор. каста</span>
                <span className="text-white">{formatStatValue(combatStats.castSpeed)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#c88a5c]">МР реген</span>
                <span className="text-white">{formatStatValue(combatStats.mpRegen)}</span>
              </div>
            </div>
          </div>
          {/* Риска від краю до краю під останніми рядками */}
          <div className="border-t border-gray-500 mt-1.5"></div>
        </div>
      </div>
    </div>
  );
}

