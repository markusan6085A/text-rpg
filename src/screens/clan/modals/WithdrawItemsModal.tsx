import React from "react";
import { useHeroStore } from "../../../state/heroStore";
import { type Clan, type ClanWarehouseItem } from "../../../utils/api";
import { withdrawClanWarehouseItem } from "../../../utils/api";
import { itemsDB, itemsDBWithStarter } from "../../../data/items/itemsDB";
import { showToast } from "../../../state/toastStore";
import {
  clanModalBackdropClass,
  clanModalCancelLinkClass,
  clanModalEnchantClass,
  clanModalInnerListClass,
  clanModalItemRowClass,
  clanModalMutedClass,
  clanModalPanelClass,
  clanModalTitleClass,
} from "./clanModalL2";

interface WithdrawItemsModalProps {
  clan: Clan;
  items: ClanWarehouseItem[];
  onClose: () => void;
  onWithdrawSuccess: () => void;
}

export default function WithdrawItemsModal({
  clan,
  items,
  onClose,
  onWithdrawSuccess,
}: WithdrawItemsModalProps) {
  const heroStore = useHeroStore();
  const enchantCls = clanModalEnchantClass();

  const handleWithdraw = async (item: ClanWarehouseItem) => {
    if (!clan) return;
    try {
      const response = await withdrawClanWarehouseItem(clan.id, item.id);
      if (response.ok) {
        onClose();
        if (heroStore.hero) {
          heroStore.addItemToInventory(item.itemId, item.qty || 1);
        }
        onWithdrawSuccess();
      }
    } catch (err: any) {
      console.error("[WithdrawItemsModal] Failed to withdraw item:", err);
      showToast(err.message || "Ошибка при выводе предмета", "error");
    }
  };

  return (
    <div className={clanModalBackdropClass()} onClick={onClose}>
      <div className={clanModalPanelClass("max-w-[360px] mx-auto")} onClick={(e) => e.stopPropagation()}>
        <div className={clanModalTitleClass()}>Выберите предмет для вывода:</div>
        <div className={`${clanModalInnerListClass()} mb-4`}>
          {items.length === 0 ? (
            <div className={`text-[11px] ${clanModalMutedClass()}`}>Склад пуст</div>
          ) : (
            items.map((item) => {
              const itemDef = itemsDBWithStarter[item.itemId] || itemsDB[item.itemId];
              const itemName = item.meta?.name || itemDef?.name || item.itemId;
              const enchantLevel = (item.meta as any)?.enchantLevel ?? 0;
              const iconPath = item.meta?.icon || itemDef?.icon || "/items/drops/Weapon_squires_sword_i00_0.jpg";
              const finalIconPath = iconPath.startsWith("/") ? iconPath : `/items/${iconPath}`;
              return (
                <div
                  key={item.id}
                  className={clanModalItemRowClass()}
                  onClick={() => handleWithdraw(item)}
                  onKeyDown={(e) => e.key === "Enter" && handleWithdraw(item)}
                  role="button"
                  tabIndex={0}
                >
                  <img
                    src={finalIconPath}
                    alt={itemName}
                    className="w-6 h-6 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/items/drops/Weapon_squires_sword_i00_0.jpg";
                    }}
                  />
                  <span>
                    {itemName}
                    {enchantLevel > 0 && (
                      <span className={enchantCls}> +{enchantLevel}</span>
                    )}{" "}
                    x{item.qty || 1}
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
