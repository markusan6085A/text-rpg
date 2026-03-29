import React from "react";
import type { RecalculatedStats } from "../utils/stats/recalculateAllStats";
import { hasShieldEquipped, getTotalShieldDefense } from "../utils/shield/shieldDefense";
import { getCityUiVariant } from "../utils/cityUiVariant";

const formatStatValue = (v: number) => {
  if (v === Math.floor(v)) return String(Math.round(v));
  return v.toFixed(1);
};

const formatResource = (n: number) => Math.max(0, Math.round(Number(n) || 0)).toLocaleString("ru-RU");

interface PlayerStatsModalProps {
  playerName: string;
  stats: RecalculatedStats;
  hero: any;
  onClose: () => void;
}

export default function PlayerStatsModal({ playerName, stats, hero, onClose }: PlayerStatsModalProps) {
  const { baseStats, finalStats } = stats;
  const isL2 = getCityUiVariant() === "l2";
  const l2Shell =
    "bg-[radial-gradient(ellipse_100%_50%_at_50%_-8%,rgba(120,90,45,0.22)_0%,transparent_50%),linear-gradient(180deg,#1c1812_0%,#0c0a08_100%)] border border-[#c7ad80]/40 shadow-[0_0_0_1px_rgba(0,0,0,0.85),0_16px_48px_rgba(0,0,0,0.55)]";
  const sectionTitle = isL2 ? "text-[#7d9b7a] font-semibold text-sm mb-2" : "text-green-500 font-semibold text-sm mb-2";
  const labelC = isL2 ? "text-[#c88a5c]" : "text-orange-300";
  const valC = isL2 ? "text-[#f0d78c]" : "text-white";

  const hp = hero?.hp ?? 0;
  const maxHp = hero?.maxHp ?? stats.resources.maxHp ?? 1;
  const mp = hero?.mp ?? 0;
  const maxMp = hero?.maxMp ?? stats.resources.maxMp ?? 1;
  const cp = hero?.cp ?? 0;
  const maxCp = hero?.maxCp ?? stats.resources.maxCp ?? 0;
  const sp = Number(hero?.sp ?? 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-[2px]"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-4 ${
          isL2 ? `${l2Shell} text-[#e8dcc8]` : "bg-[#14110c] border-2 border-[#c7ad80] rounded-lg text-white"
        }`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="player-stats-modal-title"
      >
        <div className="flex justify-between items-start gap-2 mb-3 pb-2 border-b border-[#c7ad80]/25">
          <h2
            id="player-stats-modal-title"
            className={`text-base font-semibold leading-tight pr-2 ${isL2 ? "text-[#e8c56e] [text-shadow:0_1px_2px_rgba(0,0,0,0.85)]" : "text-[#c7ad80]"}`}
          >
            Характеристики {playerName}
          </h2>
          <button
            type="button"
            className={`shrink-0 w-8 h-8 rounded-md border flex items-center justify-center leading-none transition-colors ${
              isL2
                ? "border-[#5c4a32]/60 text-[#d4c4a8] hover:bg-black/30 hover:text-[#f0d78c]"
                : "border-gray-600 text-gray-400 hover:text-white hover:bg-white/10"
            }`}
            onClick={onClose}
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>

        {/* Ресурси (збережені в heroJson глядача) */}
        <div className="mb-4">
          <div className={sectionTitle}>Ресурсы</div>
          <div
            className={
              isL2
                ? "grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg border border-[#5c4a32]/45 bg-black/20 px-3 py-2.5 text-xs"
                : "grid grid-cols-2 gap-x-4 gap-y-2 rounded border border-[#c7ad80]/25 bg-black/30 px-3 py-2.5 text-xs"
            }
          >
            <div className="flex justify-between gap-2">
              <span className={isL2 ? "text-[#c45c5c]" : "text-red-400"}>HP</span>
              <span className={`${valC} tabular-nums`}>
                {formatResource(hp)} / {formatResource(maxHp)}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className={isL2 ? "text-[#6b8cc9]" : "text-sky-400"}>MP</span>
              <span className={`${valC} tabular-nums`}>
                {formatResource(mp)} / {formatResource(maxMp)}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className={isL2 ? "text-[#7d9b7a]" : "text-emerald-400"}>CP</span>
              <span className={`${valC} tabular-nums`}>
                {formatResource(cp)} / {formatResource(maxCp)}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className={isL2 ? "text-[#9ed686]" : "text-lime-400"}>SP</span>
              <span className={`${valC} tabular-nums`}>{formatResource(sp)}</span>
            </div>
          </div>
        </div>

        {/* Базовые характеристики */}
        <div className="mb-4">
          <div className={sectionTitle}>Базовые характеристики</div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-red-500">STR:</span>
              <span className={valC}>{baseStats.STR}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-500">DEX:</span>
              <span className={valC}>{baseStats.DEX}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-500">CON:</span>
              <span className={valC}>{baseStats.CON}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-500">INT:</span>
              <span className={valC}>{baseStats.INT}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-500">WIT:</span>
              <span className={valC}>{baseStats.WIT}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-500">MEN:</span>
              <span className={valC}>{baseStats.MEN}</span>
            </div>
          </div>
        </div>

        {/* Боевые параметры */}
        <div>
          <div className={sectionTitle}>Боевые параметры</div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
            <div className="flex flex-col space-y-1.5">
              <div className="flex justify-between gap-1">
                <span className={labelC}>Физ. атака</span>
                <span className={valC}>{formatStatValue(finalStats.pAtk)}</span>
              </div>
              <div className="flex justify-between gap-1">
                <span className={labelC}>Физ. защ</span>
                <span className={valC}>{formatStatValue(finalStats.pDef)}</span>
              </div>
              {hero && hasShieldEquipped(hero) && (
                <div className="flex justify-between gap-1">
                  <span className={labelC}>Защ. щитом</span>
                  <span className={valC}>+{formatStatValue(getTotalShieldDefense(hero, finalStats))}</span>
                </div>
              )}
              <div className="flex justify-between gap-1">
                <span className={labelC}>Точность</span>
                <span className={valC}>{formatStatValue(finalStats.accuracy)}%</span>
              </div>
              <div className="flex justify-between gap-1">
                <span className={labelC}>Крит</span>
                <span className={valC}>
                  {formatStatValue((finalStats as any).critFlat ?? finalStats.crit * 10)} ({finalStats.crit}%)
                </span>
              </div>
              <div className="flex justify-between gap-1">
                <span className={labelC}>Скор. атаки</span>
                <span className={valC}>{formatStatValue(finalStats.attackSpeed)}</span>
              </div>
              <div className="flex justify-between gap-1">
                <span className={labelC}>НР реген</span>
                <span className={valC}>{formatStatValue(finalStats.hpRegen)}</span>
              </div>
              <div className="flex justify-between gap-1">
                <span className={labelC}>СР реген</span>
                <span className={valC}>{formatStatValue(finalStats.cpRegen)}</span>
              </div>
            </div>
            <div className="flex flex-col space-y-1.5">
              <div className="flex justify-between gap-1">
                <span className={labelC}>Маг. атака</span>
                <span className={valC}>{formatStatValue(finalStats.mAtk)}</span>
              </div>
              <div className="flex justify-between gap-1">
                <span className={labelC}>Маг. защ</span>
                <span className={valC}>{formatStatValue(finalStats.mDef)}</span>
              </div>
              <div className="flex justify-between gap-1">
                <span className={labelC}>Уклонение</span>
                <span className={valC}>{formatStatValue(finalStats.evasion)}%</span>
              </div>
              <div className="flex justify-between gap-1">
                <span className={labelC}>Маг. крит</span>
                <span className={valC}>
                  {formatStatValue((finalStats as any).mCritFlat ?? finalStats.mCrit * 10)} ({finalStats.mCrit}%)
                </span>
              </div>
              <div className="flex justify-between gap-1">
                <span className={labelC}>Сила крита</span>
                <span className={valC}>
                  {formatStatValue(finalStats.critPower)} (×
                  {Math.min(2.0, 1.5 + (finalStats.critPower ?? 0) / 5000).toFixed(2)} атака / ×
                  {Math.min(3.0, 2.0 + (finalStats.critPower ?? 0) / 1500).toFixed(2)} скіли)
                </span>
              </div>
              <div className="flex justify-between gap-1">
                <span className={labelC}>Скор. каста</span>
                <span className={valC}>{formatStatValue(finalStats.castSpeed)}</span>
              </div>
              <div className="flex justify-between gap-1">
                <span className={labelC}>МР реген</span>
                <span className={valC}>{formatStatValue(finalStats.mpRegen)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-[#c7ad80]/25">
          <button
            type="button"
            onClick={onClose}
            className={
              isL2
                ? "w-full py-2.5 rounded-lg bg-gradient-to-b from-[#3a3020] to-[#1a1510] border border-[#5c4a32]/65 text-[#e8c56e] text-sm font-medium hover:border-[#c7ad80]/45 hover:brightness-105 transition-[filter,border-color]"
                : "w-full py-2 rounded bg-[#2a2a2a] text-[#c7ad80] hover:bg-[#3a3a3a] text-sm"
            }
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
