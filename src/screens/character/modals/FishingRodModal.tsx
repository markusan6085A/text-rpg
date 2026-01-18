import React, { useState } from "react";
import type { Hero, HeroInventoryItem } from "../../../types/Hero";
import { itemsDB } from "../../../data/items/itemsDB";
import { useHeroStore } from "../../../state/heroStore";

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
    
    // Обчислюємо нові значення HP, MP, CP
    const maxHp = hero.maxHp || 1000;
    const currentHp = Math.min(maxHp, hero.hp ?? maxHp);
    const newHp = itemDef.restoreHp ? Math.min(maxHp, currentHp + itemDef.restoreHp) : hero.hp;
    
    const maxMp = hero.maxMp || 500;
    const currentMp = Math.min(maxMp, hero.mp ?? maxMp);
    const newMp = itemDef.restoreMp ? Math.min(maxMp, currentMp + itemDef.restoreMp) : hero.mp;
    
    const maxCp = hero.maxCp || 500;
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
        className="bg-[#14110c] border border-[#3b2614] rounded-lg p-4 max-w-md w-full"
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
        
        <div className="border-t border-gray-700 pt-2 mt-2 mb-4">
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
              onChange={(e) => setTransferAmount(Math.max(1, Math.min(maxCount, parseInt(e.target.value) || 1)))}
              className="flex-1 px-2 py-1 bg-[#2a2a2a] border border-gray-700 text-white rounded text-xs"
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
              onChange={(e) => setDeleteAmount(Math.max(1, Math.min(maxCount, parseInt(e.target.value) || 1)))}
              className="flex-1 px-2 py-1 bg-[#2a2a2a] border border-gray-700 text-white rounded text-xs"
            />
            <button
              onClick={handleDelete}
              className="text-xs text-red-400 hover:text-red-300"
            >
              Удалить
            </button>
          </div>
        </div>
        
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
        className="bg-[#14110c] border border-[#3b2614] rounded-lg p-4 max-w-md w-full max-h-[90vh] overflow-y-auto"
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
        className="bg-[#14110c] border border-[#3b2614] rounded-lg p-4 max-w-md w-full max-h-[90vh] overflow-y-auto"
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
        className="bg-[#14110c] border border-[#3b2614] rounded-lg p-4 max-w-md w-full max-h-[90vh] overflow-y-auto"
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

import React, { useState } from "react";
import type { Hero, HeroInventoryItem } from "../../../types/Hero";
import { itemsDB } from "../../../data/items/itemsDB";
import { useHeroStore } from "../../../state/heroStore";
import type { ItemDefinition } from "../../../data/items/itemsDB.types";

interface FishItemModalProps {
  item: HeroInventoryItem;
  hero: Hero;
  onClose: () => void;
  onDelete: (amount: number) => void;
  onTransfer: (amount: number) => void;
  updateHero: (partial: Partial<Hero>) => void;
}

// Функція для отримання всіх D і C грід зброї
function getDAndCGradeWeapons(): ItemDefinition[] {
  const weapons: ItemDefinition[] = [];
  Object.values(itemsDB).forEach((item) => {
    if (item.kind === "weapon" && (item.grade === "D" || item.grade === "C")) {
      weapons.push(item);
    }
  });
  return weapons;
}

// Функція для отримання всіх D і C грід частинок броні
function getDAndCGradeArmorPieces(): ItemDefinition[] {
  const armorPieces: ItemDefinition[] = [];
  Object.values(itemsDB).forEach((item) => {
    if (
      (item.kind === "armor" ||
        item.kind === "helmet" ||
        item.kind === "boots" ||
        item.kind === "gloves" ||
        item.kind === "shield") &&
      (item.grade === "D" || item.grade === "C")
    ) {
      armorPieces.push(item);
    }
  });
  return armorPieces;
}

// Функція для отримання всіх ресурсів (без квестових)
function getAllResources(): ItemDefinition[] {
  const resources: ItemDefinition[] = [];
  Object.values(itemsDB).forEach((item) => {
    // Виключаємо рибу та квестові ресурси
    if (
      item.kind === "resource" &&
      !item.id.startsWith("fish_") &&
      !item.id.startsWith("quest_") &&
      !item.description?.toLowerCase().includes("квестовий предмет") &&
      !item.description?.toLowerCase().includes("квест") &&
      item.slot !== "quest"
    ) {
      resources.push(item);
    }
  });
  return resources;
}

// Функція розділки риби з дропом
function processFishDrop(fishCount: number): {
  adena: number;
  weapons: Array<{ id: string; count: number }>;
  armorPieces: Array<{ id: string; count: number }>;
  resources: Array<{ id: string; count: number }>;
} {
  let totalAdena = 0;
  const weapons: Record<string, number> = {};
  const armorPieces: Record<string, number> = {};
  const resources: Record<string, number> = {};

  const allWeapons = getDAndCGradeWeapons();
  const allArmorPieces = getDAndCGradeArmorPieces();
  const allResources = getAllResources();

  // Обробляємо кожну рибу
  for (let i = 0; i < fishCount; i++) {
    // Адена: 1000-100000 з шансом 2%
    if (Math.random() * 100 < 2) {
      const adena = Math.floor(1000 + Math.random() * (100000 - 1000 + 1));
      totalAdena += adena;
    }

    // Зброя D і C грід: шанс 1%
    if (Math.random() * 100 < 1 && allWeapons.length > 0) {
      const randomWeapon = allWeapons[Math.floor(Math.random() * allWeapons.length)];
      weapons[randomWeapon.id] = (weapons[randomWeapon.id] || 0) + 1;
    }

    // Частинки броні D і C грід: шанс 2%
    if (Math.random() * 100 < 2 && allArmorPieces.length > 0) {
      const randomArmor = allArmorPieces[Math.floor(Math.random() * allArmorPieces.length)];
      armorPieces[randomArmor.id] = (armorPieces[randomArmor.id] || 0) + 1;
    }

    // Ресурси: шанс 4% кожен (незалежно)
    allResources.forEach((resource) => {
      if (Math.random() * 100 < 4) {
        resources[resource.id] = (resources[resource.id] || 0) + 1;
      }
    });
  }

  return {
    adena: totalAdena,
    weapons: Object.entries(weapons).map(([id, count]) => ({ id, count })),
    armorPieces: Object.entries(armorPieces).map(([id, count]) => ({ id, count })),
    resources: Object.entries(resources).map(([id, count]) => ({ id, count })),
  };
}

export default function FishItemModal({
  item,
  hero,
  onClose,
  onDelete,
  onTransfer,
  updateHero,
}: FishItemModalProps) {
  const maxCount = item.count ?? 1;
  const [transferAmount, setTransferAmount] = useState(1);
  const [deleteAmount, setDeleteAmount] = useState(1);
  const [dismantleAmount, setDismantleAmount] = useState(1);
  const [showDismantleResult, setShowDismantleResult] = useState(false);
  const [dismantleResult, setDismantleResult] = useState<ReturnType<typeof processFishDrop> | null>(null);

  const handleTransfer = () => {
    if (transferAmount < 1 || transferAmount > maxCount) return;
    onTransfer(transferAmount);
  };

  const handleDelete = () => {
    if (deleteAmount < 1 || deleteAmount > maxCount) return;
    onDelete(deleteAmount);
  };

  const handleDismantle = () => {
    if (dismantleAmount < 1 || dismantleAmount > maxCount) return;

    const currentHero = useHeroStore.getState().hero;
    if (!currentHero) return;

    const inventory = currentHero.inventory || [];
    const invItem = inventory.find((i: HeroInventoryItem) => i.id === item.id);
    if (!invItem || (invItem.count ?? 0) < dismantleAmount) return;

    // Обробляємо розділку
    const result = processFishDrop(dismantleAmount);

    // Оновлюємо інвентар: видаляємо рибу
    let updatedInventory = inventory.map((i: HeroInventoryItem) => {
      if (i.id === item.id) {
        const newCount = (i.count ?? 1) - dismantleAmount;
        return newCount > 0 ? { ...i, count: newCount } : null;
      }
      return i;
    }).filter(Boolean) as HeroInventoryItem[];

    // Додаємо адену
    const newAdena = (currentHero.adena || 0) + result.adena;

    // Додаємо зброю
    result.weapons.forEach(({ id, count }) => {
      const existingItem = updatedInventory.find((i) => i.id === id);
      if (existingItem) {
        updatedInventory = updatedInventory.map((i) =>
          i.id === id ? { ...i, count: (i.count ?? 1) + count } : i
        );
      } else {
        const itemDef = itemsDB[id];
        if (itemDef) {
          updatedInventory.push({
            id,
            name: itemDef.name,
            icon: itemDef.icon,
            slot: itemDef.slot,
            count,
            description: itemDef.description,
          });
        }
      }
    });

    // Додаємо частинки броні
    result.armorPieces.forEach(({ id, count }) => {
      const existingItem = updatedInventory.find((i) => i.id === id);
      if (existingItem) {
        updatedInventory = updatedInventory.map((i) =>
          i.id === id ? { ...i, count: (i.count ?? 1) + count } : i
        );
      } else {
        const itemDef = itemsDB[id];
        if (itemDef) {
          updatedInventory.push({
            id,
            name: itemDef.name,
            icon: itemDef.icon,
            slot: itemDef.slot,
            count,
            description: itemDef.description,
          });
        }
      }
    });

    // Додаємо ресурси
    result.resources.forEach(({ id, count }) => {
      const existingItem = updatedInventory.find((i) => i.id === id);
      if (existingItem) {
        updatedInventory = updatedInventory.map((i) =>
          i.id === id ? { ...i, count: (i.count ?? 1) + count } : i
        );
      } else {
        const itemDef = itemsDB[id];
        if (itemDef) {
          updatedInventory.push({
            id,
            name: itemDef.name,
            icon: itemDef.icon,
            slot: itemDef.slot,
            count,
            description: itemDef.description,
          });
        }
      }
    });

    // Оновлюємо героя
    updateHero({
      adena: newAdena,
      inventory: updatedInventory,
    });

    // Показуємо результат
    setDismantleResult(result);
    setShowDismantleResult(true);
  };

  const itemDef = itemsDB[item.id];

  if (showDismantleResult && dismantleResult) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={() => { setShowDismantleResult(false); setDismantleResult(null); onClose(); }}>
        <div
          className="bg-[#14110c] border border-[#3b2614] rounded-lg p-4 max-w-md w-full max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#b8860b]">Результат розділки</h2>
            <button
              className="text-gray-400 hover:text-white text-xl"
              onClick={() => { setShowDismantleResult(false); setDismantleResult(null); onClose(); }}
            >
              ×
            </button>
          </div>

          <div className="space-y-3 text-xs mb-4">
            {dismantleResult.adena > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Адена:</span>
                <span className="text-yellow-400">{dismantleResult.adena.toLocaleString()}</span>
              </div>
            )}

            {dismantleResult.weapons.length > 0 && (
              <div>
                <div className="text-sm font-semibold text-[#b8860b] mb-2">Зброя:</div>
                <div className="space-y-2">
                  {dismantleResult.weapons.map(({ id, count }) => {
                    const weaponDef = itemsDB[id];
                    const stats = weaponDef?.stats || {};
                    return (
                      <div key={id} className="border border-gray-700 rounded p-2 bg-[#1a1a1a]">
                        <div className="flex items-center gap-2 mb-1">
                          {weaponDef?.icon && (
                            <img
                              src={weaponDef.icon.startsWith("/") ? weaponDef.icon : `/items/${weaponDef.icon}`}
                              alt={weaponDef.name}
                              className="w-5 h-5 object-contain"
                            />
                          )}
                          <span className="text-gray-300 font-semibold">{weaponDef?.name || id}</span>
                          <span className="text-green-400 ml-auto">x{count}</span>
                        </div>
                        {Object.keys(stats).length > 0 && (
                          <div className="pl-7 space-y-0.5 text-xs">
                            {stats.pAtk !== undefined && stats.pAtk !== null && (
                              <div className="flex justify-between">
                                <span className="text-gray-400">Физ. атака:</span>
                                <span className="text-red-400">+{stats.pAtk}</span>
                              </div>
                            )}
                            {stats.mAtk !== undefined && stats.mAtk !== null && (
                              <div className="flex justify-between">
                                <span className="text-gray-400">Маг. атака:</span>
                                <span className="text-purple-400">+{stats.mAtk}</span>
                              </div>
                            )}
                            {stats.rCrit !== undefined && stats.rCrit !== null && (
                              <div className="flex justify-between">
                                <span className="text-gray-400">Крит:</span>
                                <span className="text-purple-400">+{stats.rCrit}</span>
                              </div>
                            )}
                            {stats.pAtkSpd !== undefined && stats.pAtkSpd !== null && (
                              <div className="flex justify-between">
                                <span className="text-gray-400">Скорость боя:</span>
                                <span className="text-yellow-400">+{stats.pAtkSpd}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {dismantleResult.armorPieces.length > 0 && (
              <div>
                <div className="text-sm font-semibold text-[#b8860b] mb-2">Частинки броні:</div>
                <div className="space-y-2">
                  {dismantleResult.armorPieces.map(({ id, count }) => {
                    const armorDef = itemsDB[id];
                    const stats = armorDef?.stats || {};
                    return (
                      <div key={id} className="border border-gray-700 rounded p-2 bg-[#1a1a1a]">
                        <div className="flex items-center gap-2 mb-1">
                          {armorDef?.icon && (
                            <img
                              src={armorDef.icon.startsWith("/") ? armorDef.icon : `/items/${armorDef.icon}`}
                              alt={armorDef.name}
                              className="w-5 h-5 object-contain"
                            />
                          )}
                          <span className="text-gray-300 font-semibold">{armorDef?.name || id}</span>
                          <span className="text-green-400 ml-auto">x{count}</span>
                        </div>
                        {(stats.pDef || stats.mDef || stats.maxHp || stats.maxMp) && (
                          <div className="pl-7 space-y-0.5 text-xs">
                            {stats.pDef && (
                              <div className="flex justify-between">
                                <span className="text-gray-400">Физ. защита:</span>
                                <span className="text-blue-400">+{stats.pDef}</span>
                              </div>
                            )}
                            {stats.mDef && (
                              <div className="flex justify-between">
                                <span className="text-gray-400">Маг. защита:</span>
                                <span className="text-cyan-400">+{stats.mDef}</span>
                              </div>
                            )}
                            {stats.maxHp && (
                              <div className="flex justify-between">
                                <span className="text-gray-400">Max HP:</span>
                                <span className="text-red-400">+{stats.maxHp}</span>
                              </div>
                            )}
                            {stats.maxMp && (
                              <div className="flex justify-between">
                                <span className="text-gray-400">Max MP:</span>
                                <span className="text-blue-400">+{stats.maxMp}</span>
                              </div>
                            )}
                            {(stats.STR || stats.DEX || stats.CON || stats.INT || stats.WIT || stats.MEN) && (
                              <>
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
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {dismantleResult.resources.length > 0 && (
              <div>
                <div className="text-sm font-semibold text-[#b8860b] mb-2">Ресурси:</div>
                <div className="space-y-1">
                  {dismantleResult.resources.map(({ id, count }) => {
                    const resourceDef = itemsDB[id];
                    return (
                      <div key={id} className="flex items-center gap-2">
                        {resourceDef?.icon && (
                          <img
                            src={resourceDef.icon.startsWith("/") ? resourceDef.icon : `/items/${resourceDef.icon}`}
                            alt={resourceDef.name}
                            className="w-5 h-5 object-contain"
                          />
                        )}
                        <span className="text-gray-400">{resourceDef?.name || id}:</span>
                        <span className="text-green-400">x{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {dismantleResult.adena === 0 &&
              dismantleResult.weapons.length === 0 &&
              dismantleResult.armorPieces.length === 0 &&
              dismantleResult.resources.length === 0 && (
                <div className="text-gray-400 text-center py-4">Нічого не випало</div>
              )}
          </div>

          <div className="flex justify-center pt-2 border-t border-gray-700">
            <button
              onClick={() => { setShowDismantleResult(false); setDismantleResult(null); onClose(); }}
              className="px-4 py-2 rounded-md bg-[#2a2a2a] ring-1 ring-white/10 text-xs text-[#b8860b] hover:bg-[#3a3a3a]"
            >
              Закрити
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
      <div
        className="bg-[#14110c] border border-[#3b2614] rounded-lg p-4 max-w-md w-full"
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

        <div className="space-y-3 text-xs mb-4">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Кількість:</span>
            <span className="text-green-400">{maxCount}</span>
          </div>
          {itemDef?.description && (
            <div>
              <div className="text-sm font-semibold text-[#b8860b] mb-2">Опис:</div>
              <div className="text-gray-300">{itemDef.description}</div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-700 pt-2 mt-2 mb-4 space-y-3">
          <div>
            <div className="text-sm font-semibold text-[#b8860b] mb-2">Передати:</div>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                max={maxCount}
                value={transferAmount}
                onChange={(e) => setTransferAmount(Math.max(1, Math.min(maxCount, parseInt(e.target.value) || 1)))}
                className="flex-1 px-2 py-1 bg-[#2a2a2a] border border-gray-700 text-white rounded text-xs"
              />
              <button
                onClick={handleTransfer}
                className="px-3 py-1 text-xs text-[#b8860b] hover:text-[#d4af37] bg-[#2a2a2a] rounded"
              >
                Передати
              </button>
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-[#b8860b] mb-2">Удалити:</div>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                max={maxCount}
                value={deleteAmount}
                onChange={(e) => setDeleteAmount(Math.max(1, Math.min(maxCount, parseInt(e.target.value) || 1)))}
                className="flex-1 px-2 py-1 bg-[#2a2a2a] border border-gray-700 text-white rounded text-xs"
              />
              <button
                onClick={handleDelete}
                className="px-3 py-1 text-xs text-red-400 hover:text-red-300 bg-[#2a2a2a] rounded"
              >
                Удалить
              </button>
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-[#b8860b] mb-2">Разделать:</div>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                max={maxCount}
                value={dismantleAmount}
                onChange={(e) => setDismantleAmount(Math.max(1, Math.min(maxCount, parseInt(e.target.value) || 1)))}
                className="flex-1 px-2 py-1 bg-[#2a2a2a] border border-gray-700 text-white rounded text-xs"
              />
              <button
                onClick={handleDismantle}
                className="px-3 py-1 text-xs text-blue-400 hover:text-blue-300 bg-[#2a2a2a] rounded"
              >
                Разделать
              </button>
            </div>
          </div>
        </div>

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

import React from "react";
import type { Hero, HeroInventoryItem } from "../../../types/Hero";
import { itemsDB, itemsDBWithStarter } from "../../../data/items/itemsDB";
import EnchantScrollModal from "./EnchantScrollModal";
import ConsumableItemModal from "./ConsumableItemModal";
import EquipableItemModal from "./EquipableItemModal";
import QuestItemModal from "./QuestItemModal";
import FishItemModal from "./FishItemModal";
import FishingRodModal from "./FishingRodModal";
import TreasureBoxModal from "./TreasureBoxModal";
import { QUESTS } from "../../../data/quests";

interface InventoryItemModalProps {
  item: HeroInventoryItem;
  hero: Hero;
  inventory: HeroInventoryItem[];
  onClose: () => void;
  onDelete: (item: HeroInventoryItem, amount: number) => void;
  onTransfer: (item: HeroInventoryItem, amount: number) => void;
  onDeleteRequest: (item: HeroInventoryItem, amount: number) => void;
  updateHero: (partial: Partial<Hero>) => void;
}

export default function InventoryItemModal({
  item,
  hero,
  inventory,
  onClose,
  onDelete,
  onTransfer,
  onDeleteRequest,
  updateHero,
}: InventoryItemModalProps) {
  const isEnchantScroll = item.id?.includes("enchant_weapon_scroll") || item.id?.includes("enchant_armor_scroll");
  const isConsumable = item.slot === "consumable";
  // Перевіряємо, чи це риба
  const isFish = item.id?.startsWith("fish_") || item.id === "fish_tuna" || item.id === "fish_seawater" || item.id === "fish_bream" || item.id === "fish_angler";
  // Перевіряємо, чи це удочка (для спеціальної заточки)
  const isFishingRod = item.id === "baby_duck_rod";
  // Перевіряємо, чи це скарбничка
  const isTreasureBox = item.id === "treasure_box";
  // Нормалізуємо слот для щитів (lhand -> shield) та зброї (lrhand -> weapon)
  let normalizedSlot = item.slot;
  if (item.slot === "lhand") {
    const itemDef = itemsDB[item.id] || itemsDBWithStarter[item.id];
    if (itemDef && (itemDef.kind === "shield" || itemDef.kind === "armor")) {
      normalizedSlot = "shield";
    }
  } else if (item.slot === "lrhand") {
    // Перевіряємо, чи це зброя (включаючи удочки)
    const itemDef = itemsDB[item.id] || itemsDBWithStarter[item.id];
    if (itemDef && itemDef.kind === "weapon") {
      normalizedSlot = "weapon";
    }
  }
  
  const isEquipable = !["all", "consumable", "resource", "quest", "book", "recipe"].includes(normalizedSlot);
  
  // Перевіряємо, чи це квестовий предмет
  const isQuestItem = QUESTS.some((q) =>
    q.questDrops?.some((drop) => drop.itemId === item.id)
  );

  // Модалка для заточок
  if (isEnchantScroll) {
    return (
      <EnchantScrollModal
        scrollItem={item}
        hero={hero}
        inventory={inventory}
        onClose={onClose}
        onEnchantSuccess={onClose}
        updateHero={updateHero}
      />
    );
  }

  // Модалка для удочки (з функцією заточки за Coin of Luck)
  if (isFishingRod) {
    return (
      <FishingRodModal
        item={item}
        hero={hero}
        inventory={inventory}
        onClose={onClose}
        onDelete={() => onDeleteRequest(item, 1)}
        onTransfer={() => onTransfer(item, 1)}
        updateHero={updateHero}
      />
    );
  }

  // Модалка для риби
  if (isFish) {
    return (
      <FishItemModal
        item={item}
        hero={hero}
        onClose={onClose}
        onDelete={(amount) => onDeleteRequest(item, amount)}
        onTransfer={(amount) => onTransfer(item, amount)}
        updateHero={updateHero}
      />
    );
  }

  // Модалка для скарбнички
  if (isTreasureBox) {
    return (
      <TreasureBoxModal
        item={item}
        hero={hero}
        onClose={onClose}
        onDelete={(amount) => onDeleteRequest(item, amount)}
        onTransfer={(amount) => onTransfer(item, amount)}
        updateHero={updateHero}
      />
    );
  }

  // Модалка для расходників
  if (isConsumable) {
    return (
      <ConsumableItemModal
        item={item}
        hero={hero}
        onClose={onClose}
        onDelete={(amount) => onDeleteRequest(item, amount)}
        onTransfer={(amount) => onTransfer(item, amount)}
        updateHero={updateHero}
      />
    );
  }

  // Модалка для екіпіруємих предметів
  if (isEquipable) {
    return (
      <EquipableItemModal
        item={item}
        onClose={onClose}
        onDelete={() => onDeleteRequest(item, 1)}
        onTransfer={() => onTransfer(item, 1)}
      />
    );
  }

  // Модалка для квестових предметів
  if (isQuestItem) {
    return (
      <QuestItemModal
        item={item}
        hero={hero}
        onClose={onClose}
      />
    );
  }

  // Модалка для інших предметів (за замовчуванням)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
      <div
        className="bg-[#14110c] border border-[#3b2614] rounded-lg p-4 max-w-md w-full"
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
          {item.description && (
            <div>
              <div className="text-sm font-semibold text-[#b8860b] mb-2">Описание:</div>
              <div className="text-gray-300">{item.description}</div>
            </div>
          )}
        </div>
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






import React from "react";
import type { HeroInventoryItem } from "../../../types/Hero";
import { QUESTS } from "../../../data/quests";
import { itemsDB } from "../../../data/items/itemsDB";

interface QuestItemModalProps {
  item: HeroInventoryItem;
  hero: any;
  onClose: () => void;
}

export default function QuestItemModal({
  item,
  hero,
  onClose,
}: QuestItemModalProps) {
  // Знаходимо квест, який використовує цей предмет
  const quest = QUESTS.find((q) =>
    q.questDrops?.some((drop) => drop.itemId === item.id)
  );

  const activeQuests = hero?.activeQuests || [];
  const isQuestActive = quest && activeQuests.some((aq: any) => aq.questId === quest.id);

  // Отримуємо прогрес для цього квесту
  let currentProgress = 0;
  let requiredCount = 0;
  let mobNames: string[] = [];

  if (quest && isQuestActive) {
    const activeQuest = activeQuests.find((aq: any) => aq.questId === quest.id);
    const questDrop = quest.questDrops?.find((drop) => drop.itemId === item.id);
    
    if (questDrop) {
      requiredCount = questDrop.requiredCount;
      mobNames = quest.questDrops
        ?.filter((drop) => drop.itemId === item.id)
        .map((drop) => drop.mobName) || [];
      
      // Перевіряємо інвентар для точного прогресу
      const inventoryItem = hero?.inventory?.find((invItem: any) => invItem.id === item.id);
      const itemCount = inventoryItem?.count || 0;
      currentProgress = Math.min(itemCount, requiredCount);
    }
  } else if (quest) {
    const questDrop = quest.questDrops?.find((drop) => drop.itemId === item.id);
    if (questDrop) {
      requiredCount = questDrop.requiredCount;
      mobNames = quest.questDrops
        ?.filter((drop) => drop.itemId === item.id)
        .map((drop) => drop.mobName) || [];
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
      <div
        className="bg-[#14110c] border border-[#3b2614] rounded-lg p-4 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {item.icon && (
              <img
                src={item.icon}
                alt={item.name}
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
            <h2 className="text-lg font-semibold text-[#b8860b]">
              {item.name}
            </h2>
          </div>
          <button
            className="text-gray-400 hover:text-white text-xl"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="space-y-3 text-xs mb-4">
          {item.description && (
            <div>
              <div className="text-sm font-semibold text-[#b8860b] mb-2">Опис:</div>
              <div className="text-gray-300">{item.description}</div>
            </div>
          )}

          {quest && (
            <div>
              <div className="text-sm font-semibold text-[#b8860b] mb-2">Квест:</div>
              <div className="text-green-400 font-semibold mb-1">{quest.name}</div>
              <div className="text-gray-300 text-[11px] mb-2">{quest.description}</div>
              
              {requiredCount > 0 && (
                <div className="mt-2">
                  <div className="text-sm font-semibold text-[#b8860b] mb-1">Потрібно зібрати:</div>
                  <div className="text-gray-300 text-[11px]">
                    {requiredCount}x {item.name}
                  </div>
                  {mobNames.length > 0 && (
                    <div className="text-gray-400 text-[10px] mt-1">
                      З мобів: {mobNames.join(", ")}
                    </div>
                  )}
                </div>
              )}

              {isQuestActive && requiredCount > 0 && (
                <div className="mt-2">
                  <div className="text-sm font-semibold text-[#b8860b] mb-1">Прогрес:</div>
                  <div className="text-gray-300 text-[11px]">
                    {currentProgress} / {requiredCount}
                  </div>
                  {currentProgress >= requiredCount && (
                    <div className="text-green-400 text-[10px] mt-1">✓ Завершено</div>
                  )}
                </div>
              )}

              {!isQuestActive && (
                <div className="mt-2">
                  <div className="text-yellow-400 text-[11px]">
                    Квест не активний. Прийміть квест, щоб почати збирати предмети.
                  </div>
                </div>
              )}
            </div>
          )}

          {!quest && (
            <div className="text-gray-400 text-[11px]">
              Цей предмет не пов'язаний з жодним квестом.
            </div>
          )}

          {item.count && item.count > 1 && (
            <div className="text-gray-300 text-[11px]">
              Кількість: {item.count}
            </div>
          )}
        </div>

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
          className="bg-[#14110c] border border-[#3b2614] rounded-lg p-4 max-w-md w-full max-h-[80vh] overflow-y-auto"
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
        className="bg-[#14110c] border border-[#3b2614] rounded-lg p-4 max-w-md w-full max-h-[80vh] overflow-y-auto"
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

