import React from "react";

interface SevenSealsBonusModalProps {
  rank: 1 | 2 | 3;
  playerName?: string;
  /** Реальні отримані стати (якщо вже отримано нагороду) */
  bonus?: {
    pAtk?: number | string;
    mAtk?: number | string;
    pDef?: number | string;
    mDef?: number | string;
    coinLuck?: number | string;
  };
  onClose: () => void;
}

export default function SevenSealsBonusModal({ rank, playerName, bonus, onClose }: SevenSealsBonusModalProps) {
  const titleColor =
    rank === 1 ? "text-yellow-400" : rank === 2 ? "text-gray-300" : "text-orange-400";
  const pAtk = Number(bonus?.pAtk);
  const mAtk = Number(bonus?.mAtk);
  const pDef = Number(bonus?.pDef);
  const mDef = Number(bonus?.mDef);
  const coinLuck = bonus?.coinLuck != null ? Number(bonus.coinLuck) : undefined;
  const hasBonus =
    Number.isFinite(pAtk) &&
    Number.isFinite(mAtk) &&
    Number.isFinite(pDef) &&
    Number.isFinite(mDef);

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
              <div>Физ/Маг атака: +{pAtk} / +{mAtk}</div>
              <div>Физ/Маг защита: +{pDef} / +{mDef}</div>
              {coinLuck != null && Number.isFinite(coinLuck) && <div>Кол (Coin of Luck): +{coinLuck}</div>}
            </>
          ) : (
            <>
              <div className="text-yellow-300">
                Для цього гравця немає зафіксованих чисел нагороди 7 печатей.
              </div>
              <div className="mt-1 text-gray-400">
                Показуються тільки фактично отримані значення, без випадкових діапазонів.
              </div>
            </>
          )}
        </div>
        <div className="mt-4 flex justify-center">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#5b4726] text-white text-xs rounded hover:bg-[#6b5736]"
          >
            Закрити
          </button>
        </div>
      </div>
    </div>
  );
}
