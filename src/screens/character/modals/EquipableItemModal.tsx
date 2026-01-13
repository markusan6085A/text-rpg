import React from "react";
import { calculateEnchantedStats, getSetInfo } from "../inventoryUtils";
import type { HeroInventoryItem } from "../../../types/Hero";

interface EquipableItemModalProps {
  item: HeroInventoryItem;
  onClose: () => void;
  onDelete: () => void;
  onTransfer: () => void;
}

export default function EquipableItemModal({
  item,
  onClose,
  onDelete,
  onTransfer,
}: EquipableItemModalProps) {
  const enchantedStats = calculateEnchantedStats(item);
  const { pAtk, mAtk, pDef, mDef, baseStats, enchantLevel, isWeapon, isArmor, enchantMultiplier, armorEnchantMultiplier } = enchantedStats;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
      <div
        className="bg-[#1a1a1a] border border-[#7c6847] rounded-lg p-4 max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#b8860b]">
            {item.name}
          </h2>
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
              (e.target as HTMLImageElement).src = "/items/drops/Weapon_squires_sword_i00_0.jpg";
            }}
          />
          <div className="flex-1 space-y-1 text-xs">
            {item.enchantLevel !== undefined && item.enchantLevel > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Заточка:</span>
                <span className="text-[#b8860b]">+{item.enchantLevel}</span>
              </div>
            )}
            {item.count && item.count > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Количество:</span>
                <span className="text-green-400">{item.count}</span>
              </div>
            )}
          </div>
        </div>

        {/* Стати */}
        {item.stats && (
          <div className="border-t border-gray-700 pt-2 mt-2 mb-4">
            <div className="text-sm font-semibold text-[#b8860b] mb-2">Стати:</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {pAtk !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Физ. атака:</span>
                  <span className="text-red-400">
                    {pAtk}
                    {enchantLevel > 0 && isWeapon && baseStats.pAtk && (
                      <span className="text-[#b8860b] ml-1">(+{Math.round(baseStats.pAtk * (enchantMultiplier - 1))})</span>
                    )}
                  </span>
                </div>
              )}
              {mAtk !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Маг. атака:</span>
                  <span className="text-purple-400">
                    {mAtk}
                    {enchantLevel > 0 && isWeapon && baseStats.mAtk && (
                      <span className="text-[#b8860b] ml-1">(+{Math.round(baseStats.mAtk * (enchantMultiplier - 1))})</span>
                    )}
                  </span>
                </div>
              )}
              {pDef !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Физ. захист:</span>
                  <span className="text-blue-400">
                    {pDef}
                    {enchantLevel > 0 && isArmor && baseStats.pDef && (
                      <span className="text-[#b8860b] ml-1">(+{Math.round(baseStats.pDef * (armorEnchantMultiplier - 1))})</span>
                    )}
                  </span>
                </div>
              )}
              {mDef !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Маг. захист:</span>
                  <span className="text-cyan-400">
                    {mDef}
                    {enchantLevel > 0 && isArmor && baseStats.mDef && (
                      <span className="text-[#b8860b] ml-1">(+{Math.round(baseStats.mDef * (armorEnchantMultiplier - 1))})</span>
                    )}
                  </span>
                </div>
              )}
              {item.stats.rCrit !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Крит:</span>
                  <span className="text-purple-400">{item.stats.rCrit}</span>
                </div>
              )}
              {item.stats.pAtkSpd !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Скорость боя:</span>
                  <span className="text-yellow-400">{item.stats.pAtkSpd}</span>
                </div>
              )}
              {item.stats.maxHp !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Max HP:</span>
                  <span className="text-red-400">+{item.stats.maxHp}</span>
                </div>
              )}
              {item.stats.maxMp !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Max MP:</span>
                  <span className="text-blue-400">+{item.stats.maxMp}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Опис предмета */}
        {item.description && (
          <div className="border-t border-gray-700 pt-2 mt-2 mb-4">
            <div className="text-sm font-semibold text-[#b8860b] mb-2">Описание:</div>
            <div className="text-gray-300 text-xs italic">
              {item.description}
            </div>
          </div>
        )}

        {/* Інформація про сет */}
        {getSetInfo(item) && (
          <div className="border-t border-gray-700 pt-2 mt-2 mb-4">
            <div className="text-sm font-semibold text-[#b8860b] mb-2">Сет:</div>
            <div className="text-yellow-400 text-xs whitespace-pre-line">{getSetInfo(item)}</div>
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
            className="text-xs text-[#b8860b] hover:text-[#d4af37]"
          >
            Закрити
          </button>
        </div>
      </div>
    </div>
  );
}










