import React, { useState } from "react";
import { itemsDB } from "../../../data/items/itemsDB";
import { useHeroStore } from "../../../state/heroStore";
import type { Hero, HeroInventoryItem } from "../../../types/Hero";

interface FishingRodModalProps {
  item: HeroInventoryItem;
  hero: Hero;
  inventory: HeroInventoryItem[];
  onClose: () => void;
  onDelete: () => void;
  onTransfer: () => void;
  updateHero: (partial: Partial<Hero>) => void;
}

export default function FishingRodModal({
  item,
  hero,
  inventory,
  onClose,
  onDelete,
  onTransfer,
  updateHero,
}: FishingRodModalProps) {
  const [enchantAmount, setEnchantAmount] = useState(1);
  const currentEnchantLevel = item.enchantLevel || 0;
  const maxEnchantLevel = 1000;

  // Перевіряємо наявність Coin of Luck
  const coinOfLuck = inventory.find((i) => i.id === "coin_of_luck");
  const coinOfLuckCount = coinOfLuck?.count || 0;

  // Розраховуємо стати з урахуванням заточки
  const basePAtk = item.stats?.pAtk || 1;
  const baseMAtk = item.stats?.mAtk || 1;
  const currentPAtk = basePAtk + currentEnchantLevel;
  const currentMAtk = baseMAtk + currentEnchantLevel;

  const canEnchant = coinOfLuckCount > 0 && currentEnchantLevel < maxEnchantLevel;

  const handleEnchant = () => {
    if (!canEnchant) return;

    const currentHero = useHeroStore.getState().hero;
    if (!currentHero) return;

    // Перевіряємо, чи достатньо Coin of Luck
    if (coinOfLuckCount < enchantAmount) {
      alert(`Недостатньо Coin of Luck! Потрібно: ${enchantAmount}, у вас: ${coinOfLuckCount}`);
      return;
    }

    // Перевіряємо максимальну заточку
    const newEnchantLevel = Math.min(currentEnchantLevel + enchantAmount, maxEnchantLevel);
    if (newEnchantLevel === currentEnchantLevel) {
      alert(`Досягнуто максимальної заточки +${maxEnchantLevel}!`);
      return;
    }

    const actualEnchantAmount = newEnchantLevel - currentEnchantLevel;

    // Оновлюємо інвентар: видаляємо Coin of Luck
    let updatedInventory = currentHero.inventory.map((i: HeroInventoryItem) => {
      if (i.id === "coin_of_luck") {
        const newCount = (i.count || 0) - actualEnchantAmount;
        return newCount > 0 ? { ...i, count: newCount } : null;
      }
      if (i.id === item.id) {
        // Оновлюємо рівень заточки та стати
        return {
          ...i,
          enchantLevel: newEnchantLevel,
          stats: {
            ...i.stats,
            pAtk: basePAtk + newEnchantLevel,
            mAtk: baseMAtk + newEnchantLevel,
          },
        };
      }
      return i;
    }).filter(Boolean) as HeroInventoryItem[];

    // Якщо удочка екіпірована, оновлюємо її заточку в equipmentEnchantLevels
    let updatedEquipmentEnchantLevels = currentHero.equipmentEnchantLevels || {};
    const weaponSlot = "weapon";
    const shieldSlot = "shield";
    
    if (currentHero.equipment?.[weaponSlot] === item.id) {
      updatedEquipmentEnchantLevels = {
        ...updatedEquipmentEnchantLevels,
        [weaponSlot]: newEnchantLevel,
      };
    }
    if (currentHero.equipment?.[shieldSlot] === item.id) {
      updatedEquipmentEnchantLevels = {
        ...updatedEquipmentEnchantLevels,
        [shieldSlot]: newEnchantLevel,
      };
    }

    // Оновлюємо героя
    updateHero({
      inventory: updatedInventory,
      equipmentEnchantLevels: updatedEquipmentEnchantLevels,
    });

    alert(`✅ Заточка успішна! ${item.name} тепер +${newEnchantLevel}\nВитрачено ${actualEnchantAmount} Coin of Luck`);
    
    // Закриваємо модалку після успішної заточки
    if (newEnchantLevel >= maxEnchantLevel) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
      <div
        className="bg-[#1a1a1a] border border-[#7c6847] rounded-lg p-4 max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#b8860b]">{item.name}</h2>
          <button
            className="text-gray-400 hover:text-white text-xl"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {/* Іконка та основна інформація */}
        <div className="flex items-center gap-3 mb-4">
          <img
            src={item.icon?.startsWith("/") ? item.icon : `/items/${item.icon}`}
            alt={item.name}
            className="w-16 h-16 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/items/drops/resources/Baby_Duck_Rod.jpg";
            }}
          />
          <div className="flex-1 space-y-1 text-xs">
            {currentEnchantLevel > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Заточка:</span>
                <span className="text-[#b8860b]">+{currentEnchantLevel}</span>
                {currentEnchantLevel >= maxEnchantLevel && (
                  <span className="text-green-400 ml-1">(Максимум)</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Стати */}
        <div className="border-t border-gray-700 pt-2 mt-2 mb-4">
          <div className="text-sm font-semibold text-[#b8860b] mb-2">Стати:</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Физ. атака:</span>
              <span className="text-red-400">
                {currentPAtk}
                {currentEnchantLevel > 0 && (
                  <span className="text-[#b8860b] ml-1">(+{currentEnchantLevel})</span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Маг. атака:</span>
              <span className="text-purple-400">
                {currentMAtk}
                {currentEnchantLevel > 0 && (
                  <span className="text-[#b8860b] ml-1">(+{currentEnchantLevel})</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Опис */}
        {item.description && (
          <div className="border-t border-gray-700 pt-2 mt-2 mb-4">
            <div className="text-sm font-semibold text-[#b8860b] mb-2">Описание:</div>
            <div className="text-gray-300 text-xs italic">{item.description}</div>
          </div>
        )}

        {/* Заточка */}
        {currentEnchantLevel < maxEnchantLevel && (
          <div className="border-t border-gray-700 pt-2 mt-2 mb-4">
            <div className="text-sm font-semibold text-[#b8860b] mb-2">Заточка (Coin of Luck):</div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Поточна заточка:</span>
                <span className="text-[#b8860b]">+{currentEnchantLevel}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Максимальна заточка:</span>
                <span className="text-green-400">+{maxEnchantLevel}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Coin of Luck:</span>
                <span className={coinOfLuckCount > 0 ? "text-yellow-400" : "text-red-400"}>
                  {coinOfLuckCount}
                </span>
              </div>
              <div className="flex gap-2 items-center">
                <span className="text-gray-400">Кількість:</span>
                <input
                  type="number"
                  min="1"
                  max={Math.min(
                    coinOfLuckCount,
                    maxEnchantLevel - currentEnchantLevel
                  )}
                  value={enchantAmount}
                  onChange={(e) => {
                    const val = Math.max(
                      1,
                      Math.min(
                        parseInt(e.target.value) || 1,
                        Math.min(coinOfLuckCount, maxEnchantLevel - currentEnchantLevel)
                      )
                    );
                    setEnchantAmount(val);
                  }}
                  className="w-20 px-2 py-1 bg-[#2a2a2a] border border-gray-700 text-white rounded text-xs"
                />
                <span className="text-gray-400 text-xs">
                  (Буде +{Math.min(currentEnchantLevel + enchantAmount, maxEnchantLevel)})
                </span>
              </div>
              <button
                onClick={handleEnchant}
                disabled={!canEnchant}
                className={`w-full px-4 py-2 rounded text-sm font-semibold ${
                  canEnchant
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-gray-600 text-gray-400 cursor-not-allowed"
                }`}
              >
                {canEnchant
                  ? `Заточити +${enchantAmount} (Витратить ${enchantAmount} Coin of Luck)`
                  : coinOfLuckCount === 0
                  ? "Немає Coin of Luck"
                  : "Досягнуто максимальної заточки"}
              </button>
            </div>
          </div>
        )}

        {/* Кнопки дій */}
        <div className="border-t border-gray-700 pt-2 mt-2 mb-4">
          <div className="flex justify-center gap-2">
            <button
              onClick={onTransfer}
              className="text-xs text-[#b8860b] hover:text-[#d4af37]"
            >
              Передать
            </button>
            <button
              onClick={onDelete}
              className="text-xs text-red-400 hover:text-red-300"
            >
              Удалить
            </button>
          </div>
        </div>

        {/* Кнопка закриття */}
        <div className="flex justify-center pt-2 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-[#2a2a2a] ring-1 ring-white/10 text-xs text-[#b8860b] hover:bg-[#3a3a3a]"
          >
            Закрити
          </button>
        </div>
      </div>
    </div>
  );
}
