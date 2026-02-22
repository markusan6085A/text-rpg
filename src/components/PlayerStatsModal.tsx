import React from "react";
import type { RecalculatedStats } from "../utils/stats/recalculateAllStats";
import { hasShieldEquipped, getTotalShieldDefense } from "../utils/shield/shieldDefense";

const formatStatValue = (v: number) => {
  if (v === Math.floor(v)) return String(Math.round(v));
  return v.toFixed(1);
};

interface PlayerStatsModalProps {
  playerName: string;
  stats: RecalculatedStats;
  hero: any;
  onClose: () => void;
}

export default function PlayerStatsModal({ playerName, stats, hero, onClose }: PlayerStatsModalProps) {
  const { baseStats, finalStats } = stats;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
      <div
        className="bg-[#14110c] border-2 border-[#c7ad80] rounded-lg p-4 max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold text-[#c7ad80]">
            Характеристики {playerName}
          </h2>
          <button
            className="text-gray-400 hover:text-white text-xl leading-none"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {/* Базовые характеристики */}
        <div className="mb-4">
          <div className="text-green-500 font-semibold text-sm mb-2">Базовые характеристики</div>
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
          <div className="text-green-500 font-semibold text-sm mb-2">Боевые параметры</div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
            <div className="flex flex-col space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#c88a5c]">Физ. атака</span>
                <span className="text-white">{formatStatValue(finalStats.pAtk)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#c88a5c]">Физ. защ</span>
                <span className="text-white">{formatStatValue(finalStats.pDef)}</span>
              </div>
              {hero && hasShieldEquipped(hero) && (
                <div className="flex justify-between">
                  <span className="text-[#c88a5c]">Защ. щитом</span>
                  <span className="text-white">+{formatStatValue(getTotalShieldDefense(hero, finalStats))}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#c88a5c]">Точность</span>
                <span className="text-white">{formatStatValue(finalStats.accuracy)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#c88a5c]">Крит</span>
                <span className="text-white">{formatStatValue(finalStats.crit)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#c88a5c]">Скор. атаки</span>
                <span className="text-white">{formatStatValue(finalStats.attackSpeed)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#c88a5c]">НР реген</span>
                <span className="text-white">{formatStatValue(finalStats.hpRegen)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#c88a5c]">СР реген</span>
                <span className="text-white">{formatStatValue(finalStats.cpRegen)}</span>
              </div>
            </div>
            <div className="flex flex-col space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#c88a5c]">Маг. атака</span>
                <span className="text-white">{formatStatValue(finalStats.mAtk)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#c88a5c]">Маг. защ</span>
                <span className="text-white">{formatStatValue(finalStats.mDef)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#c88a5c]">Уклонение</span>
                <span className="text-white">{formatStatValue(finalStats.evasion)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#c88a5c]">Маг. крит</span>
                <span className="text-white">{formatStatValue(finalStats.mCrit)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#c88a5c]">Сила крита</span>
                <span className="text-white">{formatStatValue(finalStats.critPower)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#c88a5c]">Скор. каста</span>
                <span className="text-white">{formatStatValue(finalStats.castSpeed)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#c88a5c]">МР реген</span>
                <span className="text-white">{formatStatValue(finalStats.mpRegen)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-2 border-t border-[#c7ad80]/50">
          <button
            onClick={onClose}
            className="w-full py-2 rounded bg-[#2a2a2a] text-[#c7ad80] hover:bg-[#3a3a3a] text-sm"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
