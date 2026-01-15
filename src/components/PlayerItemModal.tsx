import React, { useMemo } from "react";
import { itemsDB, itemsDBWithStarter } from "../data/items/itemsDB";
import { calculateEnchantedStats } from "../screens/character/inventoryUtils";
import type { HeroInventoryItem } from "../types/Hero";

interface PlayerItemModalProps {
  itemId: string | null;
  slot: string;
  enchantLevel?: number;
  onClose: () => void;
}

export default function PlayerItemModal({
  itemId,
  slot,
  enchantLevel = 0,
  onClose,
}: PlayerItemModalProps) {
  const itemDef = useMemo(() => {
    if (!itemId) return null;
    return itemsDBWithStarter[itemId] || itemsDB[itemId];
  }, [itemId]);

  const item = useMemo((): HeroInventoryItem | null => {
    if (!itemDef) return null;
    return {
      ...itemDef,
      enchantLevel,
      slot,
      count: 1,
    } as HeroInventoryItem;
  }, [itemDef, enchantLevel, slot]);

  const enchantedStats = useMemo(() => {
    if (!item) return null;
    return calculateEnchantedStats(item);
  }, [item]);

  if (!itemId) {
    return null;
  }

  if (!itemDef) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
        <div
          className="bg-[#1a0b0b] border border-[#5c1a1a]/70 rounded-lg p-4 max-w-[360px] w-full text-white"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-[#ffe9c0]">Предмет</div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-xl"
            >
              ×
            </button>
          </div>
          <div className="w-full h-px bg-gray-600 mb-3"></div>
          <div className="text-xs text-gray-400 mb-3">Предмет не знайдено</div>
          <div className="w-full h-px bg-gray-600 mb-3"></div>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-xs"
            >
              Закрити
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Формуємо назву з урахуванням заточки
  const itemName = enchantLevel > 0 
    ? `${itemDef.name} +${enchantLevel}` 
    : itemDef.name;

  // Витягуємо характеристики з урахуванням заточки
  const stats = enchantedStats ? {
    ...enchantedStats,
    ...(itemDef.stats || {}), // Додаємо інші стати, які не враховуються в calculateEnchantedStats
  } : (itemDef.stats || {});
  const description = itemDef.description || "";
  const { pAtk, mAtk, pDef, mDef, baseStats, isWeapon, isArmor, enchantMultiplier, armorEnchantMultiplier } = enchantedStats || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
      <div
        className="bg-[#1a0b0b] border border-[#5c1a1a]/70 rounded-lg p-4 max-w-[360px] w-full text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Заголовок */}
        <div className="flex items-baseline justify-start gap-2 mb-3">
          <div className="text-sm font-semibold text-[#ffe9c0]">{itemName}</div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl ml-auto"
          >
            ×
          </button>
        </div>

        {/* Риска */}
        <div className="w-full h-px bg-gray-600 mb-3"></div>

        {/* Опис */}
        {description && (
          <>
            <div className="mb-2 text-xs text-gray-400">{description}</div>
            <div className="w-full h-px bg-gray-600 mb-3"></div>
          </>
        )}

        {/* Характеристики */}
        <div className="space-y-1 mb-3 text-xs">
          {pAtk !== undefined && pAtk > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-400">Физ. атака:</span>
              <span className="text-red-400">
                {pAtk}
                {enchantLevel > 0 && isWeapon && baseStats?.pAtk && (
                  <span className="text-[#b8860b] ml-1">(+{Math.round(baseStats.pAtk * (enchantMultiplier! - 1))})</span>
                )}
              </span>
            </div>
          )}
          {mAtk !== undefined && mAtk > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-400">Маг. атака:</span>
              <span className="text-purple-400">
                {mAtk}
                {enchantLevel > 0 && isWeapon && baseStats?.mAtk && (
                  <span className="text-[#b8860b] ml-1">(+{Math.round(baseStats.mAtk * (enchantMultiplier! - 1))})</span>
                )}
              </span>
            </div>
          )}
          {pDef !== undefined && pDef > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-400">Физ. защита:</span>
              <span className="text-blue-400">
                {pDef}
                {enchantLevel > 0 && isArmor && baseStats?.pDef && (
                  <span className="text-[#b8860b] ml-1">(+{Math.round(baseStats.pDef * (armorEnchantMultiplier! - 1))})</span>
                )}
              </span>
            </div>
          )}
          {mDef !== undefined && mDef > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-400">Маг. защита:</span>
              <span className="text-cyan-400">
                {mDef}
                {enchantLevel > 0 && isArmor && baseStats?.mDef && (
                  <span className="text-[#b8860b] ml-1">(+{Math.round(baseStats.mDef * (armorEnchantMultiplier! - 1))})</span>
                )}
              </span>
            </div>
          )}
          {itemDef.stats?.STR && (
            <div className="flex justify-between">
              <span className="text-gray-400">STR:</span>
              <span className="text-yellow-300">+{itemDef.stats.STR}</span>
            </div>
          )}
          {itemDef.stats?.DEX && (
            <div className="flex justify-between">
              <span className="text-gray-400">DEX:</span>
              <span className="text-yellow-300">+{itemDef.stats.DEX}</span>
            </div>
          )}
          {itemDef.stats?.CON && (
            <div className="flex justify-between">
              <span className="text-gray-400">CON:</span>
              <span className="text-yellow-300">+{itemDef.stats.CON}</span>
            </div>
          )}
          {itemDef.stats?.INT && (
            <div className="flex justify-between">
              <span className="text-gray-400">INT:</span>
              <span className="text-yellow-300">+{itemDef.stats.INT}</span>
            </div>
          )}
          {itemDef.stats?.WIT && (
            <div className="flex justify-between">
              <span className="text-gray-400">WIT:</span>
              <span className="text-yellow-300">+{itemDef.stats.WIT}</span>
            </div>
          )}
          {itemDef.stats?.MEN && (
            <div className="flex justify-between">
              <span className="text-gray-400">MEN:</span>
              <span className="text-yellow-300">+{itemDef.stats.MEN}</span>
            </div>
          )}
          {itemDef.stats?.hp && (
            <div className="flex justify-between">
              <span className="text-gray-400">HP:</span>
              <span className="text-green-300">+{itemDef.stats.hp}</span>
            </div>
          )}
          {itemDef.stats?.mp && (
            <div className="flex justify-between">
              <span className="text-gray-400">MP:</span>
              <span className="text-blue-300">+{itemDef.stats.mp}</span>
            </div>
          )}
          {itemDef.stats?.cp && (
            <div className="flex justify-between">
              <span className="text-gray-400">CP:</span>
              <span className="text-yellow-300">+{itemDef.stats.cp}</span>
            </div>
          )}
          {itemDef.stats?.rCrit && (
            <div className="flex justify-between">
              <span className="text-gray-400">Крит:</span>
              <span className="text-purple-400">+{itemDef.stats.rCrit}</span>
            </div>
          )}
          {itemDef.stats?.pAtkSpd && (
            <div className="flex justify-between">
              <span className="text-gray-400">Скорость боя:</span>
              <span className="text-yellow-400">+{itemDef.stats.pAtkSpd}</span>
            </div>
          )}
        </div>

        {/* Риска */}
        <div className="w-full h-px bg-gray-600 mb-3"></div>

        {/* Кнопка закриття */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-xs"
          >
            Закрити
          </button>
        </div>
      </div>
    </div>
  );
}
