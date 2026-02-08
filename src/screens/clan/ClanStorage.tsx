import React from "react";
import { type ClanWarehouseItem } from "../../utils/api";
import { itemsDB, itemsDBWithStarter } from "../../data/items/itemsDB";

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
  return (
    <div className="space-y-2">
      <div className="text-[12px] text-[#c7ad80] mb-2">Склад клана ({items.length}/200):</div>
      <div className="flex gap-2 mb-2">
        <button
          onClick={onDepositClick}
          className="flex-1 text-[11px] text-[#c7ad80] hover:text-white transition-colors"
        >
          положить вещи
        </button>
        <button
          onClick={onWithdrawClick}
          className="flex-1 text-[11px] text-[#c7ad80] hover:text-white transition-colors"
        >
          забрать вещи
        </button>
      </div>
      <div className="bg-[#1a1a1a] border border-white/40 rounded p-2 max-h-64 overflow-y-auto space-y-1">
        {items.length === 0 ? (
          <div className="text-[11px] text-[#9f8d73]">Склад пуст</div>
        ) : (
          items.map((item) => {
            const itemDef = itemsDBWithStarter[item.itemId] || itemsDB[item.itemId];
            const itemName = item.meta?.name || itemDef?.name || item.itemId;
            const iconPath = item.meta?.icon || itemDef?.icon || "/items/drops/Weapon_squires_sword_i00_0.jpg";
            const finalIconPath = iconPath.startsWith("/") ? iconPath : `/items/${iconPath}`;
            return (
              <div key={item.id} className="flex items-center gap-2 text-[11px] text-white border-b border-dotted border-white/40 pb-1">
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
      {/* Пагінація складу */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 text-[11px] text-[#c7ad80]">
          <button
            onClick={() => {
              if (page > 1) {
                onPageChange(page - 1);
              }
            }}
            disabled={page === 1}
            className={`px-2 py-1 ${page === 1 ? "text-gray-500 cursor-not-allowed" : "text-[#c7ad80] hover:text-[#f4e2b8]"}`}
          >
            &lt;
          </button>
          <span className="text-white">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => {
              if (page < totalPages) {
                onPageChange(page + 1);
              }
            }}
            disabled={page === totalPages}
            className={`px-2 py-1 ${page === totalPages ? "text-gray-500 cursor-not-allowed" : "text-[#c7ad80] hover:text-[#f4e2b8]"}`}
          >
            &gt;
          </button>
        </div>
      )}
    </div>
  );
}
