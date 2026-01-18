import React from "react";
import { useBattleStore } from "../state/battle/store";
import { persistSnapshot } from "../state/battle/helpers";
import { persistBattle } from "../state/battle/persist";
import { cleanupSummonBuffs } from "../state/battle/helpers/summonBuffs";

/**
 * Summon Status Component
 * Displays summon information (icon, HP, MP) in a compact card
 * Positioned in the right top corner, HP/MP bars on the left opposite to player bars
 */
export default function SummonStatus() {
  const summon = useBattleStore((s) => s.summon);
  const summonBuffs = useBattleStore((s) => s.summonBuffs || []);

  // Only show if summon exists and is alive
  // Show always when summon is alive, regardless of battle status
  if (!summon || summon.hp <= 0) {
    return null;
  }

  // Очищаємо застарілі бафи для відображення
  const now = Date.now();
  const activeSummonBuffs = cleanupSummonBuffs(summonBuffs, now);

  const hp = summon.hp ?? 0;
  const mp = summon.mp ?? 0;
  const maxHp = summon.maxHp ?? 1;
  const maxMp = summon.maxMp ?? 1;
  const level = summon.level ?? 1;
  const name = summon.name || "Призвана істота";
  const icon = summon.icon || "/skills/skill1128.gif"; // Default icon

  const hpPercent = maxHp > 0 ? Math.min(100, Math.floor((hp / maxHp) * 100)) : 0;
  const mpPercent = maxMp > 0 ? Math.min(100, Math.floor((mp / maxMp) * 100)) : 0;

  const handleDismiss = () => {
    const state = useBattleStore.getState();
    const newLog = [`${name} відкликано.`, ...state.log].slice(0, 30);
    const updates: Partial<any> = {
      summon: null,
      summonBuffs: [],
      log: newLog,
    };
    useBattleStore.setState(updates);
    persistSnapshot(() => useBattleStore.getState(), persistBattle, updates);
  };

  // Округлюємо стати для відображення
  const pAtk = Math.round(summon.pAtk ?? 0);
  const mAtk = Math.round(summon.mAtk ?? 0);
  const pDef = Math.round(summon.pDef ?? 0);
  const mDef = Math.round(summon.mDef ?? 0);

  return (
    <div
      className="absolute top-2 z-[100]"
      style={{
        right: '0.5rem', // 8px - right-2 в Tailwind
        pointerEvents: "auto",
      }}
    >
      <div className="flex items-start">
        {/* Right side: name, stats in row, bars, button */}
        <div className="flex flex-col items-end gap-1">
          {/* Name and level with icon */}
          <div className="flex items-center gap-0.5">
            {/* Бафи сумону - маленькі іконки зліва від іконки сумону */}
            {activeSummonBuffs.length > 0 && (
              <div className="flex flex-wrap gap-0.5" style={{ maxWidth: "40px" }}>
                {activeSummonBuffs.slice(0, 4).map((buff, idx) => (
                  <img
                    key={idx}
                    src={buff.icon || "/skills/attack.jpg"}
                    alt={buff.name || "Buff"}
                    className="w-3 h-3 object-contain border border-yellow-500/50 rounded"
                    title={buff.name || "Buff"}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ))}
                {activeSummonBuffs.length > 4 && (
                  <div className="w-3 h-3 bg-yellow-500/50 rounded text-[6px] flex items-center justify-center text-white font-bold">
                    +{activeSummonBuffs.length - 4}
                  </div>
                )}
              </div>
            )}
            {icon && (
              <img
                src={icon}
                alt={name}
                className="w-5 h-5 object-contain flex-shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
            <div className="flex flex-col items-end gap-0.5">
              <div className="text-[8px] font-semibold text-[#ffe9c0] text-right">
                {name}
              </div>
              <div className="text-[7px] text-[#caa777] text-right">Lv {level}</div>
            </div>
          </div>

          {/* Stats in row (horizontal) */}
          <div className="flex gap-2 text-[7px] text-[#caa777]">
            <div>П-Урон: <span className="text-white">{pAtk}</span></div>
            <div>М-Урон: <span className="text-white">{mAtk}</span></div>
            <div>П-Деф: <span className="text-white">{pDef}</span></div>
            <div>М-Деф: <span className="text-white">{mDef}</span></div>
          </div>

          {/* HP/MP bars with dismiss button */}
          <div className="flex items-center gap-1">
            <div className="flex flex-col gap-0.5 w-[90px]">
              {/* HP Bar */}
              <div className="w-full h-[0.4rem] rounded-[2px] overflow-hidden relative bg-gradient-to-bottom from-[#4a0b13] to-[#2c070c]">
                <div
                  className="h-full bg-gradient-to-r from-[#4b0b0b] via-[#7f1919] to-[#a12a2a]"
                  style={{ width: `${hpPercent}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-between px-0.5 text-[7px] font-semibold text-[#ffecec]">
                  <span>HP</span>
                  <span>{hp}/{maxHp}</span>
                </div>
              </div>

              {/* MP Bar */}
              <div className="w-full h-[0.4rem] rounded-[2px] overflow-hidden relative bg-gradient-to-bottom from-[#0d2f4e] to-[#081b2c]">
                <div
                  className="h-full bg-gradient-to-r from-[#4488ff] via-[#2e8bff] to-[#1160c5]"
                  style={{ width: `${mpPercent}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-between px-0.5 text-[7px] font-semibold text-[#e6f3ff]">
                  <span>MP</span>
                  <span>{mp}/{maxMp}</span>
                </div>
              </div>
            </div>

            {/* Dismiss button - smaller, next to bars */}
            <button
              onClick={handleDismiss}
              className="px-1 py-0.5 bg-red-600/80 hover:bg-red-700 text-white text-[7px] font-semibold rounded border border-red-800 flex-shrink-0"
              style={{ pointerEvents: "auto" }}
            >
              Відкликати
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

