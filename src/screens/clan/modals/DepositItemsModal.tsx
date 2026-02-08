import React from "react";
import { useHeroStore } from "../../../state/heroStore";
import { type Clan } from "../../../utils/api";
import { depositClanWarehouseItem } from "../../../utils/api";
import { CATEGORIES } from "../../character/InventoryFilters";
import { itemsDB, itemsDBWithStarter } from "../../../data/items/itemsDB";

interface DepositItemsModalProps {
  clan: Clan;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  onClose: () => void;
  onDepositSuccess: () => void;
}

export default function DepositItemsModal({
  clan,
  selectedCategory,
  onCategoryChange,
  onClose,
  onDepositSuccess,
}: DepositItemsModalProps) {
  const hero = useHeroStore((s) => s.hero);
  const heroStore = useHeroStore();

  const handleDeposit = async (item: any) => {
    if (!clan) return;
    try {
      const response = await depositClanWarehouseItem(
        clan.id,
        item.id,
        item.count || 1,
        { name: item.name, slot: item.slot }
      );
      if (response.ok) {
        onClose();
        // Оновлюємо інвентар гравця (забрати предмет)
        if (heroStore.hero && heroStore.hero.inventory) {
          const depositCount = item.count || 1;
          const updatedInventory = heroStore.hero.inventory
            .map((invItem: any) => {
              if (invItem.id === item.id) {
                const newCount = (invItem.count || 1) - depositCount;
                if (newCount <= 0) {
                  return null; // Видаляємо предмет
                }
                return { ...invItem, count: newCount };
              }
              return invItem;
            })
            .filter((invItem: any) => invItem !== null);
          heroStore.updateHero({ inventory: updatedInventory });
        }
        onDepositSuccess();
      }
    } catch (err: any) {
      console.error("[DepositItemsModal] Failed to deposit item:", err);
      alert(err.message || "Ошибка при пополнении склада");
    }
  };

  const category = CATEGORIES.find((c) => c.key === selectedCategory) || CATEGORIES[0];
  const filteredItems = hero?.inventory?.filter((item: any) => item && category.test(item)) || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] border border-white/50 rounded p-4 max-w-[360px] w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="text-[14px] text-[#f4e2b8] mb-3">Выберите категорию:</div>
        <div className="flex flex-wrap gap-2 mb-4">
          {CATEGORIES.map((category) => (
            <button
              key={category.key}
              onClick={() => onCategoryChange(category.key)}
              className={`px-3 py-1 text-[11px] rounded transition-colors ${
                selectedCategory === category.key
                  ? "bg-[#5a4424] text-[#f4e2b8]"
                  : "bg-[#2a2a2a] text-[#c7ad80] hover:bg-[#3a3a3a]"
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
        <div className="text-[12px] text-[#c7ad80] mb-2">Выберите предмет:</div>
        <div className="bg-[#2a2a2a] border border-white/40 rounded p-2 max-h-64 overflow-y-auto space-y-1 mb-4">
          {filteredItems.length === 0 ? (
            <div className="text-[11px] text-[#9f8d73]">Нет предметов в этой категории</div>
          ) : (
            filteredItems.map((item: any) => {
              const itemDef = itemsDBWithStarter[item.id] || itemsDB[item.id];
              const iconPath = item.icon || itemDef?.icon || "/items/drops/Weapon_squires_sword_i00_0.jpg";
              const finalIconPath = iconPath.startsWith("/") ? iconPath : `/items/${iconPath}`;
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-2 text-[11px] text-[#c7ad80] border-b border-dotted border-white/40 pb-1 cursor-pointer hover:bg-[#3a3a3a] p-1 rounded"
                  onClick={() => handleDeposit(item)}
                >
                  <img
                    src={finalIconPath}
                    alt={item.name || item.id}
                    className="w-6 h-6 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/items/drops/Weapon_squires_sword_i00_0.jpg";
                    }}
                  />
                  <span>{item.name || item.id} x{item.count || 1}</span>
                </div>
              );
            })
          )}
        </div>
        <button
          onClick={onClose}
          className="w-full text-[12px] text-red-600 hover:text-red-500 transition-colors"
        >
          Отмена
        </button>
      </div>
    </div>
  );
}
