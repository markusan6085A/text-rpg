import React from "react";
import { itemsDB, itemsDBWithStarter } from "../data/items/itemsDB";

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
  if (!itemId) {
    return null;
  }

  const itemDef = itemsDBWithStarter[itemId] || itemsDB[itemId];
  
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

  // Витягуємо характеристики
  const stats = itemDef.stats || {};
  const description = itemDef.description || "";

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
          {stats.pAtk && (
            <div className="flex justify-between">
              <span className="text-gray-400">Физ. атака:</span>
              <span className="text-yellow-300">+{stats.pAtk}</span>
            </div>
          )}
          {stats.mAtk && (
            <div className="flex justify-between">
              <span className="text-gray-400">Маг. атака:</span>
              <span className="text-yellow-300">+{stats.mAtk}</span>
            </div>
          )}
          {stats.pDef && (
            <div className="flex justify-between">
              <span className="text-gray-400">Физ. защита:</span>
              <span className="text-yellow-300">+{stats.pDef}</span>
            </div>
          )}
          {stats.mDef && (
            <div className="flex justify-between">
              <span className="text-gray-400">Маг. защита:</span>
              <span className="text-yellow-300">+{stats.mDef}</span>
            </div>
          )}
          {stats.STR && (
            <div className="flex justify-between">
              <span className="text-gray-400">STR:</span>
              <span className="text-yellow-300">+{stats.STR}</span>
            </div>
          )}
          {stats.DEX && (
            <div className="flex justify-between">
              <span className="text-gray-400">DEX:</span>
              <span className="text-yellow-300">+{stats.DEX}</span>
            </div>
          )}
          {stats.CON && (
            <div className="flex justify-between">
              <span className="text-gray-400">CON:</span>
              <span className="text-yellow-300">+{stats.CON}</span>
            </div>
          )}
          {stats.INT && (
            <div className="flex justify-between">
              <span className="text-gray-400">INT:</span>
              <span className="text-yellow-300">+{stats.INT}</span>
            </div>
          )}
          {stats.WIT && (
            <div className="flex justify-between">
              <span className="text-gray-400">WIT:</span>
              <span className="text-yellow-300">+{stats.WIT}</span>
            </div>
          )}
          {stats.MEN && (
            <div className="flex justify-between">
              <span className="text-gray-400">MEN:</span>
              <span className="text-yellow-300">+{stats.MEN}</span>
            </div>
          )}
          {stats.hp && (
            <div className="flex justify-between">
              <span className="text-gray-400">HP:</span>
              <span className="text-green-300">+{stats.hp}</span>
            </div>
          )}
          {stats.mp && (
            <div className="flex justify-between">
              <span className="text-gray-400">MP:</span>
              <span className="text-blue-300">+{stats.mp}</span>
            </div>
          )}
          {stats.cp && (
            <div className="flex justify-between">
              <span className="text-gray-400">CP:</span>
              <span className="text-yellow-300">+{stats.cp}</span>
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
