import React, { useState } from "react";
import type { Hero, HeroInventoryItem } from "../../../types/Hero";
import { itemsDB } from "../../../data/items/itemsDB";
import { useHeroStore } from "../../../state/heroStore";

interface TreasureBoxModalProps {
  item: HeroInventoryItem;
  hero: Hero;
  onClose: () => void;
  onDelete: (amount: number) => void;
  onTransfer: (amount: number) => void;
  updateHero: (partial: Partial<Hero>) => void;
}

// Функція відкриття скарбнички з дропом
function processTreasureBox(): {
  type: "adena" | "coinOfLuck" | "coins_silver";
  adena?: number;
  coinOfLuck?: number;
  coins_silver?: number;
} {
  const roll = Math.random();
  
  // 60% шанс - 10,000 adena
  if (roll < 0.6) {
    return { type: "adena", adena: 10000 };
  }
  // 20% шанс - 1 Coin of Luck (наступні 20%, тобто 0.6-0.8)
  else if (roll < 0.8) {
    return { type: "coinOfLuck", coinOfLuck: 1 };
  }
  // 20% шанс - 1 Серебряные Монеты (останні 20%, тобто 0.8-1.0)
  else {
    return { type: "coins_silver", coins_silver: 1 };
  }
}

export default function TreasureBoxModal({
  item,
  hero,
  onClose,
  onDelete,
  onTransfer,
  updateHero,
}: TreasureBoxModalProps) {
  const maxCount = item.count ?? 1;
  const [openAmount, setOpenAmount] = useState(1);
  const [deleteAmount, setDeleteAmount] = useState(1);
  const [transferAmount, setTransferAmount] = useState(1);
  const [showOpenResult, setShowOpenResult] = useState(false);
  const [openResult, setOpenResult] = useState<ReturnType<typeof processTreasureBox> | null>(null);

  const handleTransfer = () => {
    if (transferAmount < 1 || transferAmount > maxCount) return;
    onTransfer(transferAmount);
  };

  const handleDelete = () => {
    if (deleteAmount < 1 || deleteAmount > maxCount) return;
    onDelete(deleteAmount);
  };

  const handleOpen = () => {
    if (openAmount < 1 || openAmount > maxCount) return;

    const currentHero = useHeroStore.getState().hero;
    if (!currentHero) return;

    const inventory = currentHero.inventory || [];
    const invItem = inventory.find((i: HeroInventoryItem) => i.id === item.id);
    if (!invItem || (invItem.count ?? 0) < openAmount) return;

    // Обробляємо кожну скарбничку окремо
    let totalAdena = 0;
    let totalCoinOfLuck = 0;
    let totalCoinsSilver = 0;

    for (let i = 0; i < openAmount; i++) {
      const result = processTreasureBox();
      
      if (result.type === "adena" && result.adena) {
        totalAdena += result.adena;
      } else if (result.type === "coinOfLuck" && result.coinOfLuck) {
        totalCoinOfLuck += result.coinOfLuck;
      } else if (result.type === "coins_silver" && result.coins_silver) {
        totalCoinsSilver += result.coins_silver;
      }
    }

    // Оновлюємо інвентар: видаляємо скарбнички
    let updatedInventory = inventory.map((i: HeroInventoryItem) => {
      if (i.id === item.id) {
        const newCount = (i.count ?? 1) - openAmount;
        return newCount > 0 ? { ...i, count: newCount } : null;
      }
      return i;
    }).filter(Boolean) as HeroInventoryItem[];

    // Додаємо adena
    const newAdena = (currentHero.adena || 0) + totalAdena;

    // Додаємо Coin of Luck (окреме поле в Hero)
    const newCoinOfLuck = (currentHero.coinOfLuck || 0) + totalCoinOfLuck;

    // Додаємо coins_silver до інвентаря
    if (totalCoinsSilver > 0) {
      const coinsSilverId = "coins_silver";
      const coinsSilverDef = itemsDB[coinsSilverId];
      if (coinsSilverDef) {
        const existingCoinsIndex = updatedInventory.findIndex((i) => i.id === coinsSilverId);
        if (existingCoinsIndex >= 0) {
          updatedInventory = updatedInventory.map((i) =>
            i.id === coinsSilverId ? { ...i, count: (i.count ?? 1) + totalCoinsSilver } : i
          );
        } else {
          updatedInventory.push({
            id: coinsSilverId,
            name: coinsSilverDef.name,
            icon: coinsSilverDef.icon,
            slot: coinsSilverDef.slot,
            count: totalCoinsSilver,
            description: coinsSilverDef.description,
          });
        }
      }
    }

    // Оновлюємо героя
    updateHero({
      adena: newAdena,
      coinOfLuck: newCoinOfLuck,
      inventory: updatedInventory,
    });

    // Показуємо результат (сумарний для всіх відкритих скарбничок)
    setOpenResult({
      type: totalAdena > 0 ? "adena" : totalCoinOfLuck > 0 ? "coinOfLuck" : "coins_silver", // Для типу, але відображаємо всі
      adena: totalAdena,
      coinOfLuck: totalCoinOfLuck,
      coins_silver: totalCoinsSilver,
    });
    setShowOpenResult(true);
  };

  const itemDef = itemsDB[item.id];

  if (showOpenResult && openResult) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={() => { setShowOpenResult(false); setOpenResult(null); onClose(); }}>
        <div
          className="bg-[#1a0b0b] border border-[#5c1a1a]/70 rounded-lg p-4 max-w-md w-full max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#b8860b]">Результат відкриття</h2>
            <button
              className="text-gray-400 hover:text-white text-xl"
              onClick={() => { setShowOpenResult(false); setOpenResult(null); onClose(); }}
            >
              ×
            </button>
          </div>

          <div className="space-y-3 text-xs mb-4">
            {openResult.adena !== undefined && openResult.adena > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Адена:</span>
                <span className="text-yellow-400">{openResult.adena.toLocaleString()}</span>
              </div>
            )}

            {openResult.coinOfLuck !== undefined && openResult.coinOfLuck > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Coin of Luck:</span>
                <span className="text-[#e0c68a]">{openResult.coinOfLuck}</span>
              </div>
            )}

            {openResult.coins_silver !== undefined && openResult.coins_silver > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Серебряные Монеты:</span>
                <span className="text-gray-300">{openResult.coins_silver}</span>
              </div>
            )}
          </div>

          <button
            className="w-full bg-[#7c6847] hover:bg-[#8b7756] text-white py-2 px-4 rounded transition-colors"
            onClick={() => { setShowOpenResult(false); setOpenResult(null); onClose(); }}
          >
            Закрити
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
      <div
        className="bg-[#1a1a1a] border border-[#7c6847] rounded-lg p-4 max-w-md w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#b8860b]">{itemDef?.name || item.name}</h2>
          <button
            className="text-gray-400 hover:text-white text-xl"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {itemDef?.icon && (
          <div className="flex justify-center mb-4">
            <img src={itemDef.icon} alt={itemDef.name} className="w-16 h-16 object-contain" />
          </div>
        )}

        {itemDef?.description && (
          <p className="text-sm text-gray-300 mb-4">{itemDef.description}</p>
        )}

        <div className="space-y-4">
          {/* Відкриття скарбнички */}
          <div className="border border-[#7c6847] rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-[#b8860b]">Відкрити</span>
              <span className="text-xs text-gray-400">Кількість: {maxCount}</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="number"
                min="1"
                max={maxCount}
                value={openAmount}
                onChange={(e) => setOpenAmount(Math.max(1, Math.min(maxCount, parseInt(e.target.value) || 1)))}
                className="w-20 px-2 py-1 bg-[#2a2a2a] border border-[#7c6847] rounded text-white text-sm"
              />
              <button
                onClick={handleOpen}
                className="flex-1 bg-[#7c6847] hover:bg-[#8b7756] text-white py-1 px-3 rounded transition-colors text-sm"
              >
                Відкрити
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Дроп: 60% - 10,000 Adena, 20% - 1 Coin of Luck, 20% - 1 Серебряные Монеты
            </p>
          </div>

          {/* Передача на склад */}
          <div className="border border-[#7c6847] rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-[#b8860b]">Передати на склад</span>
              <span className="text-xs text-gray-400">Кількість: {maxCount}</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="number"
                min="1"
                max={maxCount}
                value={transferAmount}
                onChange={(e) => setTransferAmount(Math.max(1, Math.min(maxCount, parseInt(e.target.value) || 1)))}
                className="w-20 px-2 py-1 bg-[#2a2a2a] border border-[#7c6847] rounded text-white text-sm"
              />
              <button
                onClick={handleTransfer}
                className="flex-1 bg-[#7c6847] hover:bg-[#8b7756] text-white py-1 px-3 rounded transition-colors text-sm"
              >
                Передати
              </button>
            </div>
          </div>

          {/* Видалити */}
          <div className="border border-red-700 rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-red-400">Видалити</span>
              <span className="text-xs text-gray-400">Кількість: {maxCount}</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="number"
                min="1"
                max={maxCount}
                value={deleteAmount}
                onChange={(e) => setDeleteAmount(Math.max(1, Math.min(maxCount, parseInt(e.target.value) || 1)))}
                className="w-20 px-2 py-1 bg-[#2a2a2a] border border-red-700 rounded text-white text-sm"
              />
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-700 hover:bg-red-800 text-white py-1 px-3 rounded transition-colors text-sm"
              >
                Видалити
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
