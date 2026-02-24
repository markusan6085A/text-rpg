import React from "react";
import { useHeroStore } from "../../../state/heroStore";
import { INVENTORY_MAX_ITEMS, getInventoryMax } from "../../../state/heroStore";

const COST_PER_SLOT = 1; // 1 Coin of Luck = +1 слот

interface IncreaseInventoryModalProps {
  onClose: () => void;
}

export default function IncreaseInventoryModal({ onClose }: IncreaseInventoryModalProps) {
  const hero = useHeroStore((s) => s.hero);
  const updateHero = useHeroStore((s) => s.updateHero);

  const maxSlots = getInventoryMax(hero);
  const coins = hero?.coinOfLuck ?? 0;
  const canBuy = coins >= COST_PER_SLOT;

  const handleBuy = () => {
    if (!hero || !canBuy) return;
    const currentCap = hero.inventoryCapacity ?? INVENTORY_MAX_ITEMS;
    updateHero({
      inventoryCapacity: currentCap + 1,
      coinOfLuck: (hero.coinOfLuck ?? 0) - COST_PER_SLOT,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-[#1a1510] border border-[#c7ad80]/60 rounded-lg p-4 max-w-[280px] w-full shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-[#dec28e] font-semibold mb-2 border-b border-[#c7ad80]/50 pb-2">
          Увеличить вместимость инвентаря
        </div>
        <p className="text-[#d9d9d9] text-sm mb-3">
          +1 слот стоит <span className="text-yellow-400">1 Coin of Luck</span>.
        </p>
        <p className="text-[#b0a090] text-xs mb-4">
          Сейчас: <span className="text-white">{maxSlots}</span> слотов. У вас:{" "}
          <span className="text-yellow-400">{coins}</span> Coin of Luck.
        </p>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded border border-[#c7ad80]/50 text-[#c7ad80] text-sm hover:bg-white/5"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleBuy}
            disabled={!canBuy}
            className="px-3 py-1.5 rounded bg-[#5a4a3a] text-[#f5d7a1] text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#6a5a4a]"
          >
            Купить слот (−1 Coin of Luck)
          </button>
        </div>
      </div>
    </div>
  );
}
