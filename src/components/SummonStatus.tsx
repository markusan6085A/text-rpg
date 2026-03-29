import React from "react";
import { useBattleStore } from "../state/battle/store";
import { persistSnapshot } from "../state/battle/helpers";
import { persistBattle } from "../state/battle/persist";
import { cleanupSummonBuffs } from "../state/battle/helpers/summonBuffs";

/**
 * Панель призваної істоти: HP/MP, відклик.
 * Рендериться всередині HeroStatusStrip під барами героя — нормально на вузькому екрані.
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
      className="w-full mt-1.5 pt-1.5 border-t border-[#5c4030]/55 pointer-events-auto"
      style={{ zIndex: 1 }}
    >
      <div className="flex flex-col gap-1 w-full min-w-0">
        {/* Ряд 1: бафи + іконка + ім’я (рівень у рядку зі статами/барами) */}
        <div className="flex items-center gap-1 min-w-0 w-full">
          {activeSummonBuffs.length > 0 && (
            <div className="flex flex-wrap gap-0.5 shrink-0">
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
          <span className="text-[10px] font-semibold text-[#ffe9c0] truncate flex-1 min-w-0">{name}</span>
        </div>

        {/* Ряд 2: стати зліва | короткі HP/MP по центру | Lv + відклик справа (items-start — не тягнути вниз при переносі статів) */}
        <div className="flex items-start gap-1.5 min-w-0 w-full">
          <div className="flex flex-wrap gap-x-1 gap-y-0 leading-tight text-[7px] text-[#caa777] min-w-0 flex-1 content-start">
            <span>
              П-Урон: <span className="text-white">{pAtk}</span>
            </span>
            <span>
              М-Урон: <span className="text-white">{mAtk}</span>
            </span>
            <span>
              П-Деф: <span className="text-white">{pDef}</span>
            </span>
            <span>
              М-Деф: <span className="text-white">{mDef}</span>
            </span>
          </div>
          <div className="flex items-start gap-1.5 shrink-0 -mt-0.5">
            <div className="flex flex-col gap-[2px] w-[5.5rem] sm:w-[6.25rem] max-w-[42%]">
              <div className="w-full h-[0.32rem] rounded-[2px] overflow-hidden relative bg-gradient-to-b from-[#4a0b13] to-[#2c070c]">
                <div
                  className="h-full bg-gradient-to-r from-[#4b0b0b] via-[#7f1919] to-[#a12a2a]"
                  style={{ width: `${hpPercent}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-between px-0.5 text-[5px] font-semibold text-[#ffecec] leading-none">
                  <span>HP</span>
                  <span className="tabular-nums truncate max-w-[70%] text-right">
                    {hp}/{maxHp}
                  </span>
                </div>
              </div>
              <div className="w-full h-[0.32rem] rounded-[2px] overflow-hidden relative bg-gradient-to-b from-[#0d2f4e] to-[#081b2c]">
                <div
                  className="h-full bg-gradient-to-r from-[#4488ff] via-[#2e8bff] to-[#1160c5]"
                  style={{ width: `${mpPercent}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-between px-0.5 text-[5px] font-semibold text-[#e6f3ff] leading-none">
                  <span>MP</span>
                  <span className="tabular-nums truncate max-w-[70%] text-right">
                    {mp}/{maxMp}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-[9px] text-[#e8c56e] font-semibold tabular-nums whitespace-nowrap">
                Lv {level}
              </span>
              <button
                type="button"
                onClick={handleDismiss}
                className="px-1.5 py-0.5 bg-red-600/80 hover:bg-red-700 text-white text-[8px] font-semibold rounded border border-red-800 whitespace-nowrap"
              >
                Відкликати
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

