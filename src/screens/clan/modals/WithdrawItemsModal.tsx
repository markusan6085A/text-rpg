import React from "react";
import { useHeroStore } from "../../../state/heroStore";
import { type Clan, type ClanWarehouseItem } from "../../../utils/api";
import { withdrawClanWarehouseItem } from "../../../utils/api";
import { itemsDB, itemsDBWithStarter } from "../../../data/items/itemsDB";

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

  const handleWithdraw = async (item: ClanWarehouseItem) => {
    if (!clan) return;
    try {
      const response = await withdrawClanWarehouseItem(clan.id, item.id);
      if (response.ok) {
        onClose();
        // Додаємо предмет в інвентар гравця
        if (heroStore.hero) {
          heroStore.addItemToInventory(item.itemId, item.qty || 1);
        }
        onWithdrawSuccess();
      }
    } catch (err: any) {
      console.error("[WithdrawItemsModal] Failed to withdraw item:", err);
      alert(err.message || "Ошибка при выводе предмета");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] border border-white/50 rounded p-4 max-w-[360px] w-full mx-4">
        <div className="text-[14px] text-[#f4e2b8] mb-3">Выберите предмет для вывода:</div>
        <div className="bg-[#2a2a2a] border border-white/40 rounded p-2 max-h-64 overflow-y-auto space-y-1 mb-4">
          {items.length === 0 ? (
            <div className="text-[11px] text-[#9f8d73]">Склад пуст</div>
          ) : (
            items.map((item) => {
              const itemDef = itemsDBWithStarter[item.itemId] || itemsDB[item.itemId];
              const itemName = item.meta?.name || itemDef?.name || item.itemId;
              const iconPath = item.meta?.icon || itemDef?.icon || "/items/drops/Weapon_squires_sword_i00_0.jpg";
              const finalIconPath = iconPath.startsWith("/") ? iconPath : `/items/${iconPath}`;
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-2 text-[11px] text-white border-b border-dotted border-white/40 pb-1 cursor-pointer hover:bg-[#3a3a3a] p-1 rounded"
                  onClick={() => handleWithdraw(item)}
                >
                  <img
                    src={finalIconPath}
                    alt={itemName}
                    className="w-6 h-6 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/items/drops/Weapon_squires_sword_i00_0.jpg";
                    }}
                  />
                  <span>{itemName} x{item.qty || 1}</span>
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
