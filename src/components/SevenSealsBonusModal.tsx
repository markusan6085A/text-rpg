import React from "react";

// Бонуси за 1, 2, 3 місце в Seven Seals (для модалки)
const SEVEN_SEALS_REWARDS: Record<number, string> = {
  1: `1 место:
Физ/Маг атака: 125-750
Физ/Маг защита: 154-456
Кол: 5-20`,
  2: `2 место:
Физ/Маг атака: 100-500
Физ/Маг защита: 100-400
Кол: 5-15`,
  3: `3 место:
Физ/Маг атака: 80-300
Физ/Маг защита: 80-300
Кол: 5-10`,
};

interface SevenSealsBonusModalProps {
  rank: 1 | 2 | 3;
  playerName?: string;
  /** Реальні отримані стати (якщо вже отримано нагороду) */
  bonus?: { pAtk: number; mAtk: number; pDef: number; mDef: number };
  onClose: () => void;
}

export default function SevenSealsBonusModal({ rank, playerName, bonus, onClose }: SevenSealsBonusModalProps) {
  const rangesText = SEVEN_SEALS_REWARDS[rank];
  const titleColor =
    rank === 1 ? "text-yellow-400" : rank === 2 ? "text-gray-300" : "text-orange-400";
  const hasBonus = bonus && typeof bonus.pAtk === "number";

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-[#1a1510] border border-white/50 rounded-lg p-4 max-w-[280px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`font-bold text-sm mb-2 ${titleColor}`}>
          Победитель 7 печатей — {rank} место
          {playerName && <div className="text-gray-400 text-xs mt-1">{playerName}</div>}
        </div>
        <div className="text-gray-300 text-xs whitespace-pre-line leading-relaxed">
          {hasBonus ? (
            <>
              <div className="text-green-400 font-semibold mb-1">Ваш бонус:</div>
              <div>Физ/Маг атака: +{bonus!.pAtk} / +{bonus!.mAtk}</div>
              <div>Физ/Маг защита: +{bonus!.pDef} / +{bonus!.mDef}</div>
            </>
          ) : (
            rangesText
          )}
        </div>
        <div className="mt-4 flex justify-center">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#5b4726] text-white text-xs rounded hover:bg-[#6b5736]"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
