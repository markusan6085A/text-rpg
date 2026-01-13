import React, { useState, useMemo } from "react";
import { itemsDB } from "../../../data/items/itemsDB";
import { getGradeFromScrollId, getGradeFromItemId } from "../../../utils/enchantHelpers";
import { handleEnchantScroll } from "../../../state/battle/actions/enchantScroll";
import type { BattleState } from "../../../state/battle/types";
import type { Hero, HeroInventoryItem } from "../../../types/Hero";

interface EnchantScrollModalProps {
  scrollItem: HeroInventoryItem;
  hero: Hero;
  inventory: HeroInventoryItem[];
  onClose: () => void;
  onEnchantSuccess: () => void;
  updateHero: (partial: Partial<Hero>) => void;
}

export default function EnchantScrollModal({
  scrollItem,
  hero,
  inventory,
  onClose,
  onEnchantSuccess,
  updateHero,
}: EnchantScrollModalProps) {
  const [enchantTargetItem, setEnchantTargetItem] = useState<HeroInventoryItem | null>(null);

  const scrollGrade = getGradeFromScrollId(scrollItem.id);
  const isWeaponScroll = scrollItem.id?.includes("weapon");
  const isArmorScroll = scrollItem.id?.includes("armor");

  // Знаходимо підходящі предмети для заточки
  const suitableItems = useMemo(() => {
    return inventory.filter((item: any) => {
      if (!item || !item.id) return false;
      const itemDef = itemsDB[item.id];
      if (!itemDef) return false;
      
      const itemGrade = getGradeFromItemId(item.id);
      if (itemGrade !== scrollGrade) return false;
      
      if (isWeaponScroll && itemDef.kind === "weapon") return true;
      // Заточки для броні працюють з: бронею, шоломом, рукавицями, чоботами, щитом, біжутерією, поясом, плащем
      if (isArmorScroll && (
        ["armor", "helmet", "boots", "gloves", "shield", "necklace", "ring", "earring", "jewelry", "belt", "cloak"].includes(itemDef.kind || "") ||
        ["necklace", "ring", "earring", "jewelry", "belt", "cloak"].includes(itemDef.slot || "")
      )) return true;
      
      return false;
    });
  }, [inventory, scrollGrade, isWeaponScroll, isArmorScroll]);

  const handleEnchant = () => {
    if (!enchantTargetItem || !hero) return;
    
    // Створюємо фейковий BattleState для handleEnchantScroll
    const fakeState: BattleState = {
      log: [],
      cooldowns: {},
      heroBuffs: [],
    } as BattleState;
    
    const success = handleEnchantScroll(
      scrollItem.id,
      enchantTargetItem.id,
      null, // Предмет в інвентарі
      fakeState,
      hero,
      () => {}, // setAndPersist - не потрібен для інвентаря
      (partial) => updateHero(partial)
    );
    
    if (success) {
      onEnchantSuccess();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
      <div
        className="bg-[#1a1a1a] border border-[#7c6847] rounded-lg p-4 max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#b8860b]">
            {scrollItem.name}
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
            <span className="text-gray-400">Грейд:</span>
            <span className="text-[#b8860b]">{scrollGrade}-grade</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Тип:</span>
            <span className="text-[#b8860b]">{isWeaponScroll ? "Зброя" : "Броня"}</span>
          </div>
        </div>
        
        <div className="border-t border-gray-700 pt-2 mt-2 mb-4">
          <div className="text-sm font-semibold text-[#b8860b] mb-2">Оберіть предмет для заточки:</div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {suitableItems.length === 0 ? (
              <div className="text-gray-400 text-sm text-center py-4">
                Немає підходящих предметів
              </div>
            ) : (
              suitableItems.map((item: any, idx: number) => {
                const iconPath = item.icon?.startsWith("/") ? item.icon : `/items/${item.icon}`;
                const currentEnchant = item.enchantLevel ?? 0;
                return (
                  <button
                    key={idx}
                    onClick={() => setEnchantTargetItem(item)}
                    className={`w-full flex items-center gap-2 p-2 border rounded ${
                      enchantTargetItem?.id === item.id
                        ? "border-[#b8860b] bg-[#2a2a2a]"
                        : "border-gray-700 bg-[#1a1a1a]"
                    }`}
                  >
                    <img src={iconPath} alt={item.name} className="w-8 h-8 object-contain" />
                    <div className="flex-1 text-left">
                      <div className="text-white text-sm">{item.name}</div>
                      <div className="text-gray-400 text-xs">Заточка: +{currentEnchant}</div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
        
        <div className="flex justify-center gap-2 pt-2 border-t border-gray-700">
          {enchantTargetItem && (
            <button
              onClick={handleEnchant}
              className="px-4 py-2 rounded-md bg-[#2a2a2a] ring-1 ring-white/10 text-xs text-[#b8860b] hover:bg-[#3a3a3a]"
            >
              Заточить
            </button>
          )}
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










