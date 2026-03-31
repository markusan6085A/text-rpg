import React from "react";
import { type ClanWarehouseItem } from "../../utils/api";
import { itemsDB, itemsDBWithStarter } from "../../data/items/itemsDB";
import { isWarmCityUi, getCityUiVariant } from "../../utils/cityUiVariant";

interface ClanStorageProps {
  items: ClanWarehouseItem[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onDepositClick: () => void;
  onWithdrawClick: () => void;
}

export default function ClanStorage({
  items,
  page,
  totalPages,
  onPageChange,
  onDepositClick,
  onWithdrawClick,
}: ClanStorageProps) {
  const isL2 = isWarmCityUi(getCityUiVariant());
  const panel = isL2
    ? "bg-black/25 border border-[#5c4a32]/55 rounded p-2 max-h-64 overflow-y-auto space-y-1"
    : "bg-[#1a1a1a] border border-white/40 rounded p-2 max-h-64 overflow-y-auto space-y-1";
  const topBtn = isL2
    ? "flex-1 text-[11px] text-[#c9a44c] hover:text-[#e8c56e] transition-colors"
    : "flex-1 text-[11px] text-[#c7ad80] hover:text-white transition-colors";
  const pgBtn = (disabled: boolean) =>
    disabled
      ? "text-gray-500 cursor-not-allowed"
      : isL2
        ? "text-[#c9a44c] hover:text-[#e8c56e]"
        : "text-[#c7ad80] hover:text-[#f4e2b8]";

  return (
    <div className="space-y-2">
      <div className={isL2 ? "text-[12px] text-[#e8c56e] mb-2" : "text-[12px] text-[#c7ad80] mb-2"}>
        Склад клана ({items.length}/200):
      </div>
      <div className="flex gap-2 mb-2">
        <button onClick={onDepositClick} className={topBtn}>
          положить вещи
        </button>
        <button onClick={onWithdrawClick} className={topBtn}>
          забрать вещи
        </button>
      </div>
      <div className={panel}>
        {items.length === 0 ? (
          <div className={isL2 ? "text-[11px] text-[#8a7a60]" : "text-[11px] text-[#9f8d73]"}>Склад пуст</div>
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
                className={
                  isL2
                    ? "flex items-center gap-2 text-[11px] text-[#e8dcc8] border-b border-solid border-[#5c4a32]/35 pb-1"
                    : "flex items-center gap-2 text-[11px] text-white border-b border-solid border-white/40 pb-1"
                }
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
                    <span className="text-[#b8860b]"> +{enchantLevel}</span>
                  )}{" "}
                  x{item.qty || 1}
                </span>
              </div>
            );
          })
        )}
      </div>
      {/* Пагінація складу */}
      {totalPages > 1 && (
        <div className={isL2 ? "flex justify-center items-center gap-2 text-[11px] text-[#c9a44c]" : "flex justify-center items-center gap-2 text-[11px] text-[#c7ad80]"}>
          <button
            onClick={() => {
              if (page > 1) {
                onPageChange(page - 1);
              }
            }}
            disabled={page === 1}
            className={`px-2 py-1 ${pgBtn(page === 1)}`}
          >
            &lt;
          </button>
          <span className={isL2 ? "text-[#e8dcc8]" : "text-white"}>
            {page} / {totalPages}
          </span>
          <button
            onClick={() => {
              if (page < totalPages) {
                onPageChange(page + 1);
              }
            }}
            disabled={page === totalPages}
            className={`px-2 py-1 ${pgBtn(page === totalPages)}`}
          >
            &gt;
          </button>
        </div>
      )}
    </div>
  );
}
