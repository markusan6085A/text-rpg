import React, { useState } from "react";
import type { Hero, HeroInventoryItem } from "../../../types/Hero";
import { itemsDB } from "../../../data/items/itemsDB";
import { useHeroStore } from "../../../state/heroStore";
import { loadBattle } from "../../../state/battle/persist";
import { cleanupBuffs, computeBuffedMaxResources } from "../../../state/battle/helpers";

interface ConsumableItemModalProps {
  item: HeroInventoryItem;
  hero: Hero;
  onClose: () => void;
  onDelete: (amount: number) => void;
  onTransfer: (amount: number) => void;
  updateHero: (partial: Partial<Hero>) => void;
}

export default function ConsumableItemModal({
  item,
  hero,
  onClose,
  onDelete,
  onTransfer,
  updateHero,
}: ConsumableItemModalProps) {
  const maxCount = item.count ?? 1;
  const [transferAmount, setTransferAmount] = useState(1);
  const [deleteAmount, setDeleteAmount] = useState(1);
  
  const itemDef = itemsDB[item.id];
  const isPotion = itemDef && (itemDef.restoreHp || itemDef.restoreMp || itemDef.restoreCp);
  const isEnchantScroll = item.id?.includes("enchant_weapon_scroll") || item.id?.includes("enchant_armor_scroll");

  const handleTransfer = () => {
    if (transferAmount < 1 || transferAmount > maxCount) return;
    onTransfer(transferAmount);
  };

  const handleDelete = () => {
    if (deleteAmount < 1 || deleteAmount > maxCount) return;
    onDelete(deleteAmount);
  };

  const handleUsePotion = () => {
    if (!itemDef || !hero) return;

    const currentHero = useHeroStore.getState().hero;
    if (!currentHero) return;

    const inventory = currentHero.inventory || [];
    const invItem = inventory.find((i: HeroInventoryItem) => i.id === item.id);
    if (!invItem || (invItem.count ?? 0) <= 0) return;

    // 🔥 КРИТИЧНО: використовуємо max З БАФАМИ (статуя/місто), інакше банка обрізає hp до базового max і hp "падає"
    const now = Date.now();
    const saved = loadBattle(hero.name);
    const buffs = cleanupBuffs(saved?.heroBuffs || [], now);
    const baseMax = {
      maxHp: hero.maxHp || 1000,
      maxMp: hero.maxMp || 500,
      maxCp: hero.maxCp ?? Math.round((hero.maxHp || 1000) * 0.6),
    };
    const { maxHp: buffedMaxHp, maxMp: buffedMaxMp, maxCp: buffedMaxCp } = computeBuffedMaxResources(baseMax, buffs);

    const maxHp = buffedMaxHp;
    const currentHp = Math.min(maxHp, hero.hp ?? maxHp);
    const newHp = itemDef.restoreHp ? Math.min(maxHp, currentHp + itemDef.restoreHp) : hero.hp;

    const maxMp = buffedMaxMp;
    const currentMp = Math.min(maxMp, hero.mp ?? maxMp);
    const newMp = itemDef.restoreMp ? Math.min(maxMp, currentMp + itemDef.restoreMp) : hero.mp;

    const maxCp = buffedMaxCp;
    const currentCp = Math.min(maxCp, hero.cp ?? maxCp);
    const newCp = itemDef.restoreCp ? Math.min(maxCp, currentCp + itemDef.restoreCp) : hero.cp;
    
    // Зменшуємо кількість в інвентарі
    const updatedInventory = inventory.map((i: HeroInventoryItem) => {
      if (i.id === item.id) {
        const newCount = (i.count ?? 1) - 1;
        return newCount > 0 ? { ...i, count: newCount } : null;
      }
      return i;
    }).filter(Boolean) as HeroInventoryItem[];
    
    // Оновлюємо всі значення одночасно
    updateHero({ 
      hp: newHp, 
      mp: newMp, 
      cp: newCp,
      inventory: updatedInventory 
    });
    
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
      <div
        className="bg-[#14110c] border border-white/40 rounded-lg p-4 max-w-md w-full"
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
        
        <div className="space-y-3 text-xs mb-4">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Количество:</span>
            <span className="text-green-400">{maxCount}</span>
          </div>
          {itemDef && (
            <>
              {itemDef.restoreHp && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Восстанавливает HP:</span>
                  <span className="text-red-400">+{itemDef.restoreHp}</span>
                </div>
              )}
              {itemDef.restoreMp && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Восстанавливает MP:</span>
                  <span className="text-blue-400">+{itemDef.restoreMp}</span>
                </div>
              )}
              {itemDef.restoreCp && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Восстанавливает CP:</span>
                  <span className="text-yellow-400">+{itemDef.restoreCp}</span>
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="border-t border-white/50 pt-2 mt-2 mb-4">
          {isPotion && !isEnchantScroll && (
            <div className="mb-3">
              <button
                onClick={handleUsePotion}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-semibold"
              >
                Использовать
              </button>
            </div>
          )}
          <div className="text-sm font-semibold text-[#b8860b] mb-2">Передать:</div>
          <div className="flex gap-2 mb-3">
            <input
              type="number"
              min="1"
              max={maxCount}
              value={transferAmount}
              onChange={(e) => {
                let val = e.target.value;
                // Видаляємо початковий "0" якщо вводиться число
                if (val.startsWith("0") && val.length > 1) {
                  val = val.replace(/^0+/, "") || "1";
                }
                const numVal = parseInt(val) || 1;
                setTransferAmount(Math.max(1, Math.min(maxCount, numVal)));
              }}
              onFocus={(e) => {
                if (e.target.value === "0") {
                  e.target.select();
                }
              }}
              className="flex-1 px-2 py-1 bg-[#2a2a2a] border border-white/50 text-white rounded text-xs"
            />
            <button
              onClick={handleTransfer}
              className="text-xs text-[#b8860b] hover:text-[#d4af37]"
            >
              Передать
            </button>
          </div>
          
          <div className="text-sm font-semibold text-[#b8860b] mb-2">Удалить:</div>
          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              max={maxCount}
              value={deleteAmount}
              onChange={(e) => {
                let val = e.target.value;
                // Видаляємо початковий "0" якщо вводиться число
                if (val.startsWith("0") && val.length > 1) {
                  val = val.replace(/^0+/, "") || "1";
                }
                const numVal = parseInt(val) || 1;
                setDeleteAmount(Math.max(1, Math.min(maxCount, numVal)));
              }}
              onFocus={(e) => {
                if (e.target.value === "0") {
                  e.target.select();
                }
              }}
              className="flex-1 px-2 py-1 bg-[#2a2a2a] border border-white/50 text-white rounded text-xs"
            />
            <button
              onClick={handleDelete}
              className="text-xs text-red-400 hover:text-red-300"
            >
              Удалить
            </button>
          </div>
        </div>
        
        <div className="flex justify-center pt-2 border-t border-white/50">
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
