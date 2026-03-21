import React, { useState } from "react";
import { useHeroStore } from "../../../state/heroStore";
import { type Clan } from "../../../utils/api";
import { depositClanWarehouseItem } from "../../../utils/api";
import { CATEGORIES } from "../../character/InventoryFilters";
import { itemsDB, itemsDBWithStarter } from "../../../data/items/itemsDB";
import { showToast } from "../../../state/toastStore";
import {
  clanModalBackdropClass,
  clanModalCancelLinkClass,
  clanModalChipClass,
  clanModalEnchantClass,
  clanModalInnerListClass,
  clanModalItemRowClass,
  clanModalMutedClass,
  clanModalPanelClass,
  clanModalTitleClass,
  clanModalIsL2,
} from "./clanModalL2";

interface DepositItemsModalProps {
  clan: Clan;
  onClose: () => void;
  onDepositSuccess: () => void;
}

export default function DepositItemsModal({
  clan,
  onClose,
  onDepositSuccess,
}: DepositItemsModalProps) {
  const hero = useHeroStore((s) => s.hero);
  const heroStore = useHeroStore();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const isL2 = clanModalIsL2();
  const subLbl = isL2 ? "text-[12px] text-[#a89470] mb-2" : "text-[12px] text-[#c7ad80] mb-2";

  const handleDeposit = async (item: any) => {
    if (!clan) return;
    try {
      const itemId = item.id || item.itemId;
      const response = await depositClanWarehouseItem(
        clan.id,
        itemId,
        item.count || 1,
        { name: item.name, slot: item.slot, icon: item.icon, kind: item.kind, enchantLevel: item.enchantLevel ?? 0 }
      );
      if (response.ok) {
        onClose();
        if (heroStore.hero && heroStore.hero.inventory) {
          const depositCount = item.count || 1;
          const updatedInventory = heroStore.hero.inventory
            .map((invItem: any) => {
              const invId = invItem.id || invItem.itemId;
              if (invId === itemId) {
                const newCount = (invItem.count || 1) - depositCount;
                if (newCount <= 0) {
                  return null;
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
      showToast(err.message || "Ошибка при пополнении склада", "error");
    }
  };

  const category = CATEGORIES.find((c) => c.key === selectedCategory) || CATEGORIES[0];
  const filteredItems = hero?.inventory?.filter((item: any) => item && category.test(item)) || [];
  const enchantCls = clanModalEnchantClass();

  return (
    <div className={clanModalBackdropClass()} onClick={onClose}>
      <div
        className={clanModalPanelClass("max-w-[360px] mx-auto max-h-[80vh] overflow-y-auto")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={clanModalTitleClass()}>Выберите категорию:</div>
        <div className="flex flex-wrap gap-2 mb-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setSelectedCategory(cat.key)}
              className={clanModalChipClass(selectedCategory === cat.key)}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <div className={subLbl}>Выберите предмет:</div>
        <div className={`${clanModalInnerListClass()} mb-4`}>
          {filteredItems.length === 0 ? (
            <div className={`text-[11px] ${clanModalMutedClass()}`}>Нет предметов в этой категории</div>
          ) : (
            filteredItems.map((item: any, idx: number) => {
              const itemId = item.id || item.itemId;
              const itemDef = itemsDBWithStarter[itemId] || itemsDB[itemId];
              const iconPath = item.icon || itemDef?.icon || "/items/drops/Weapon_squires_sword_i00_0.jpg";
              const finalIconPath = iconPath.startsWith("/") ? iconPath : `/items/${iconPath}`;
              return (
                <div
                  key={`${itemId}-${idx}`}
                  className={clanModalItemRowClass()}
                  onClick={() => handleDeposit(item)}
                  onKeyDown={(e) => e.key === "Enter" && handleDeposit(item)}
                  role="button"
                  tabIndex={0}
                >
                  <img
                    src={finalIconPath}
                    alt={item.name || item.id}
                    className="w-6 h-6 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/items/drops/Weapon_squires_sword_i00_0.jpg";
                    }}
                  />
                  <span>
                    {item.name || item.id}
                    {(item.enchantLevel ?? 0) > 0 && (
                      <span className={enchantCls}> +{item.enchantLevel}</span>
                    )}{" "}
                    x{item.count || 1}
                  </span>
                </div>
              );
            })
          )}
        </div>
        <button type="button" onClick={onClose} className={clanModalCancelLinkClass()}>
          Отмена
        </button>
      </div>
    </div>
  );
}
