import React, { useState } from "react";
import { useHeroStore } from "../../../state/heroStore";
import { INVENTORY_MAX_ITEMS, INVENTORY_ABSOLUTE_MAX, getInventoryMax } from "../../../state/heroStore";
import { getCityUiVariant } from "../../../utils/cityUiVariant";

const COST_PER_SLOT = 1; // 1 Coin of Luck = +1 слот

interface IncreaseInventoryModalProps {
  onClose: () => void;
}

export default function IncreaseInventoryModal({ onClose }: IncreaseInventoryModalProps) {
  const isL2 = getCityUiVariant() === "l2";
  const hero = useHeroStore((s) => s.hero);
  const updateHero = useHeroStore((s) => s.updateHero);
  const [quantity, setQuantity] = useState(1);

  const maxSlots = getInventoryMax(hero);
  const coins = hero?.coinOfLuck ?? 0;
  const totalCost = quantity * COST_PER_SLOT;
  const canBuy = quantity >= 1 && coins >= totalCost;

  const handleBuy = () => {
    if (!hero || !canBuy) return;
    const currentCap = hero.inventoryCapacity ?? INVENTORY_MAX_ITEMS;
    const slotsToAdd = Math.min(quantity, INVENTORY_ABSOLUTE_MAX - currentCap);
    if (slotsToAdd <= 0) return;
    const actualCost = slotsToAdd * COST_PER_SLOT;
    if ((hero.coinOfLuck ?? 0) < actualCost) return;
    updateHero({
      inventoryCapacity: currentCap + slotsToAdd,
      coinOfLuck: (hero.coinOfLuck ?? 0) - actualCost,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className={
          isL2
            ? "bg-[#1a1510] border border-[#c7ad80]/60 rounded-xl p-4 max-w-[280px] w-full shadow-[0_16px_48px_rgba(0,0,0,0.55)]"
            : "bg-[#14110c] border border-white/40 rounded-lg p-4 max-w-[280px] w-full shadow-xl"
        }
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={
            isL2
              ? "text-[#e8c56e] font-semibold text-sm border-b border-[#c7ad80]/50 pb-1 pt-0.5 -mx-4 px-4 mb-2"
              : "text-[#b8860b] font-semibold text-sm border-b border-white/30 pb-1 pt-0.5 -mx-4 px-4 mb-2"
          }
        >
          Увеличить вместимость инвентаря
        </div>
        <p className={isL2 ? "text-[#d4c4a8] text-xs mb-2" : "text-[#d9d9d9] text-xs mb-2"}>
          +1 слот = 1 Coin of Luck.
        </p>
        <p className={isL2 ? "text-[#8a7a60] text-[11px] mb-2 text-left" : "text-[#b0a090] text-[11px] mb-2 text-left"}>
          Сейчас: <span className={isL2 ? "text-[#e8dcc8]" : "text-gray-300"}>{maxSlots}</span> слотов. У вас:{" "}
          <span className="text-yellow-400">{coins}</span> Coin of Luck.
        </p>
        <div className="flex items-center gap-2 mb-4 text-left">
          <label className={isL2 ? "text-[11px] text-[#c9a44c]" : "text-[11px] text-[#c7ad80]"}>
            Количество слотов:
          </label>
          <input
            type="number"
            min={1}
            max={Math.max(1, Math.min(Math.floor(coins / COST_PER_SLOT), INVENTORY_ABSOLUTE_MAX - maxSlots))}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Math.min(coins, parseInt(e.target.value, 10) || 1)))}
            className={
              isL2
                ? "w-14 py-0.5 px-1 text-xs rounded-md bg-[#0d0a06] text-[#d4c4a8] border border-[#5c4a32]/60"
                : "w-14 py-0.5 px-1 text-xs rounded bg-[#0d0a06] text-gray-300 border border-[#4a4a4a]"
            }
          />
        </div>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className={
              isL2
                ? "px-2.5 py-1 rounded-md text-[11px] border border-[#5c4a32]/70 bg-gradient-to-b from-[#2e2619] to-[#14110c] text-[#d4c4a8] hover:border-[#c7ad80]/40"
                : "px-2.5 py-1 rounded text-[11px] bg-[#4a4a4a] text-gray-300 hover:bg-[#5a5a5a]"
            }
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleBuy}
            disabled={!canBuy}
            className="px-2.5 py-1 rounded text-[11px] bg-[#2d4a2d] text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#3d5a3d]"
          >
            Купить слот{quantity > 1 ? ` (${quantity})` : ""} (−{totalCost} Coin of Luck)
          </button>
        </div>
      </div>
    </div>
  );
}
