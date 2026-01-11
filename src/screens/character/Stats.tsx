import React, { useState, useEffect } from "react";
import { itemsDB } from "../../data/items/itemsDB";
import { getBaseStats } from "../../data/baseStatsTable";

export default function Stats() {
  const [hero, setHero] = useState<any>(null);
  const [baseStats, setBaseStats] = useState<any>(null);
  const [combatStats, setCombatStats] = useState<any>(null);

  useEffect(() => {
    const accounts = JSON.parse(localStorage.getItem("l2_accounts_v2") || "[]");
    const h = accounts.length > 0 ? accounts[0].hero : null;

    if (h) {
      setHero(h);

      // Отримуємо базові стати
      const base = getBaseStats(h.race || "Человек", h.profession || "Воин");
      setBaseStats(base || { STR: 10, DEX: 10, CON: 10, INT: 10, WIT: 10, MEN: 10 });

      // Обчислюємо бойові характеристики
      const stats = calculateCombatStats(h, base || { STR: 10, DEX: 10, CON: 10, INT: 10, WIT: 10, MEN: 10 });
      setCombatStats(stats);
    }
  }, []);

  // Функція для обчислення бойових характеристик
  const calculateCombatStats = (hero: any, base: any) => {
    const level = hero.level || 1;
    
    // Базові значення з урахуванням рівня
    let pAtk = Math.max(1, Math.round((base.STR * 1.5 + base.DEX * 0.5) * (1 + level * 0.1)));
    let mAtk = Math.max(1, Math.round((base.INT * 1.2 + base.WIT * 0.8) * (1 + level * 0.1)));
    let pDef = Math.max(1, Math.round((base.CON * 1.8 + base.DEX * 0.3) * (1 + level * 0.08)));
    let mDef = Math.max(1, Math.round((base.MEN * 1.5 + base.WIT * 0.5) * (1 + level * 0.08)));
    let accuracy = Math.max(1, Math.round((base.DEX * 2.5 + base.WIT * 0.5) * (1 + level * 0.05)));
    let evasion = Math.max(1, Math.round((base.DEX * 2.5 + base.WIT * 0.5) * (1 + level * 0.05)));
    let crit = Math.max(1, Math.round((base.DEX * 2.5 + base.STR * 0.3) * (1 + level * 0.05)));
    let mCrit = Math.max(1, Math.round((base.WIT * 2.0 + base.INT * 0.5) * (1 + level * 0.05)));
    let attackSpeed = Math.max(1, Math.round(600 - base.DEX * 3 - level * 2));
    let castSpeed = Math.max(1, Math.round(800 - base.WIT * 3 - level * 2));
    let hpRegen = Math.max(1, Math.round(base.CON * 0.5 + level * 0.5));
    let mpRegen = Math.max(1, Math.round(base.MEN * 0.5 + level * 0.5));
    let cpRegen = Math.max(1, Math.round(base.CON * 0.4 + level * 0.4));
    let critPower = 0; // Сила крита

    // Додаємо бонуси від екіпіровки
    if (hero.equipment) {
      Object.values(hero.equipment).forEach((itemId: any) => {
        if (itemId && itemsDB[itemId] && itemsDB[itemId].stats) {
          const itemStats = itemsDB[itemId].stats;
          if (itemStats.pAtk) pAtk += itemStats.pAtk;
          if (itemStats.mAtk) mAtk += itemStats.mAtk;
          if (itemStats.pDef) pDef += itemStats.pDef;
          if (itemStats.mDef) mDef += itemStats.mDef;
        }
      });
    }

    // Конвертуємо в відсотки для деяких статів
    const accuracyPercent = Math.min(100, Math.round((accuracy / 100) * 10));
    const evasionPercent = Math.min(100, Math.round((evasion / 100) * 10));
    const critPercent = Math.min(100, Math.round((crit / 10)));
    const mCritPercent = Math.min(100, Math.round((mCrit / 10)));

    return {
      pAtk,
      mAtk,
      pDef,
      mDef,
      accuracy: accuracyPercent,
      evasion: evasionPercent,
      crit: critPercent,
      mCrit: mCritPercent,
      critPower,
      attackSpeed,
      castSpeed,
      hpRegen,
      mpRegen,
      cpRegen,
    };
  };

  if (!hero || !baseStats || !combatStats) {
    return <div className="text-white text-center mt-10">Загрузка...</div>;
  }

  const race = hero.race || "Человек";
  const profession = hero.profession || "Воин";
  const level = hero.level || 1;
  const adena = hero.adena || 0;
  const coin = hero.coinOfLuck || 0;

  return (
    <div className="w-full flex flex-col items-center text-white px-4 py-2">
      <div className="w-full max-w-[360px]">
        {/* Інформація про персонажа */}
        <div className="mb-4 text-center">
          <div className="text-white font-semibold text-base mb-1">
            {hero.name || "Без имени"}
          </div>
          <div className="text-[#d8c598] text-sm mb-2">
            {level} ур. — {race} / {profession}
          </div>
          <div className="text-[#d8c598] text-xs space-y-1">
            <div>Adena: {adena.toLocaleString("ru-RU")}</div>
            <div>Coin: {coin}</div>
          </div>
        </div>

        {/* Базовые характеристики */}
        <div className="mb-4">
          <div className="text-white font-semibold text-sm mb-2">
            Базовые характеристики
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-[#d8c598]">STR:</span>
              <span className="text-white">{baseStats.STR}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#d8c598]">DEX:</span>
              <span className="text-white">{baseStats.DEX}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#d8c598]">CON:</span>
              <span className="text-white">{baseStats.CON}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#d8c598]">INT:</span>
              <span className="text-white">{baseStats.INT}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#d8c598]">WIT:</span>
              <span className="text-white">{baseStats.WIT}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#d8c598]">MEN:</span>
              <span className="text-white">{baseStats.MEN}</span>
            </div>
          </div>
        </div>

        {/* Боевые параметры */}
        <div>
          <div className="text-white font-semibold text-sm mb-2">
            Боевые параметры
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
            {/* Ліва колонка */}
            <div className="flex flex-col space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#c88a5c]">Физ. атака</span>
                <span className="text-white">{combatStats.pAtk}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#c88a5c]">Физ. защ</span>
                <span className="text-white">{combatStats.pDef}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#c88a5c]">Точность</span>
                <span className="text-white">{combatStats.accuracy}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#c88a5c]">Крит</span>
                <span className="text-white">{combatStats.crit}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#c88a5c]">Скор. атаки</span>
                <span className="text-white">{combatStats.attackSpeed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#c88a5c]">НР реген</span>
                <span className="text-white">{combatStats.hpRegen}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#c88a5c]">СР реген</span>
                <span className="text-white">{combatStats.cpRegen}</span>
              </div>
            </div>

            {/* Права колонка */}
            <div className="flex flex-col space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#c88a5c]">Маг. атака</span>
                <span className="text-white">{combatStats.mAtk}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#c88a5c]">Маг. защ</span>
                <span className="text-white">{combatStats.mDef}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#c88a5c]">Уклонение</span>
                <span className="text-white">{combatStats.evasion}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#c88a5c]">Маг. крит</span>
                <span className="text-white">{combatStats.mCrit}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#c88a5c]">Сила крита</span>
                <span className="text-white">{combatStats.critPower}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#c88a5c]">Скор. каста</span>
                <span className="text-white">{combatStats.castSpeed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#c88a5c]">МР реген</span>
                <span className="text-white">{combatStats.mpRegen}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
