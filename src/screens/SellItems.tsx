// src/screens/SellItems.tsx
// Сторінка продажу предметів з інвентаря

import React, { useState, useMemo } from "react";
import { useHeroStore } from "../state/heroStore";
import InventoryFilters, { CATEGORIES } from "./character/InventoryFilters";
import { itemsDB, itemsDBWithStarter } from "../data/items/itemsDB";
import { getSellPrice } from "../utils/sellPrices";

type Navigate = (path: string) => void;

const ITEMS_PER_PAGE = 10;
const CURRENCY_IDS = new Set(["adena", "coin_of_luck", "coins_silver", "ancient_adena"]);

interface SellItemsProps {
  navigate: Navigate;
}

export default function SellItems({ navigate }: SellItemsProps) {
  const hero = useHeroStore((s) => s.hero);
  const updateHero = useHeroStore((s) => s.updateHero);

  const [currentCategory, setCurrentCategory] = useState("all");
  const [currentGrade, setCurrentGrade] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredItems = useMemo(() => {
    if (!hero || !hero.inventory) return [];
    const category = CATEGORIES.find((c) => c.key === currentCategory) || CATEGORIES[0];
    let items = hero.inventory.filter(
      (item: any) => item && !CURRENCY_IDS.has(item.id) && category.test(item)
    );
    if (currentGrade) {
      const gradeUpper = currentGrade.toUpperCase();
      items = items.filter((item: any) => {
        const def = itemsDB[item.id] || itemsDBWithStarter[item.id];
        return def?.grade?.toUpperCase() === gradeUpper;
      });
    }
    return items;
  }, [hero, currentCategory, currentGrade]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleSell = (item: any, amount: number) => {
    if (!hero || !hero.inventory) return;
    const price = getSellPrice(item.id, itemsDB[item.id] || itemsDBWithStarter[item.id]);
    if (price == null || price <= 0) return;

    const totalGain = price * amount;
    const inv = [...hero.inventory];
    let toRemove = amount;

    for (let i = 0; i < inv.length && toRemove > 0; i++) {
      const invItem = inv[i];
      if (!invItem || invItem.id !== item.id) continue;
      const cnt = invItem.count ?? 1;
      if (cnt <= toRemove) {
        inv[i] = null;
        toRemove -= cnt;
      } else {
        inv[i] = { ...invItem, count: cnt - toRemove };
        toRemove = 0;
      }
    }

    const updatedInventory = inv.filter(Boolean) as typeof hero.inventory;
    const newAdena = (hero.adena || 0) + totalGain;

    updateHero({ inventory: updatedInventory, adena: newAdena });
  };

  if (!hero) {
    return (
      <div className="text-white text-center pt-20">Загрузка...</div>
    );
  }

  const adena = hero.adena || 0;

  return (
    <div className="w-full flex flex-col items-center px-4 py-2">
      <div className="w-full max-w-[360px]">
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-lg font-bold text-[#b8860b]">Продать вещи</h1>
          <button
            onClick={() => navigate("/shop")}
            className="text-xs text-[#99e074] hover:text-[#bbff97]"
          >
            ← Магазин
          </button>
        </div>

        <div className="text-sm text-gray-300 mb-2">
          У вас: <span className="text-yellow-400">{adena.toLocaleString()}</span> Adena
        </div>

        <InventoryFilters
          currentCategory={currentCategory}
          currentGrade={currentGrade}
          onCategoryChange={(cat) => { setCurrentCategory(cat); setCurrentGrade(""); setCurrentPage(1); }}
          onGradeChange={(g) => { setCurrentGrade(g); setCurrentPage(1); }}
        />

        <div
          className="space-y-1 mb-3 rounded-xl border-2 overflow-y-auto"
          style={{
            backgroundColor: "#0f0c08",
            borderColor: "rgba(255,255,255,0.5)",
            minHeight: "280px",
            maxHeight: "400px",
          }}
        >
          {paginatedItems.length === 0 ? (
            <div className="text-center text-gray-400 py-8 text-sm">Нет предметов для продажи</div>
          ) : (
            paginatedItems.map((item: any, idx: number) => {
              const def = itemsDB[item.id] || itemsDBWithStarter[item.id];
              const sellPrice = getSellPrice(item.id, def);
              const count = item.count ?? 1;
              const canSell = sellPrice != null && sellPrice > 0;

              return (
                <div
                  key={`${item.id}-${idx}-${startIndex}`}
                  className="flex items-center gap-2 py-2 px-2 border-b border-white/10 last:border-0"
                >
                  <img
                    src={(item.icon || def?.icon || "").startsWith("/") ? (item.icon || def?.icon) : `/items/${item.icon || def?.icon}`}
                    alt=""
                    className="w-10 h-10 object-contain flex-shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).src = "/items/drops/Weapon_squires_sword_i00_0.jpg"; }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm truncate">{item.name || def?.name}</div>
                    <div className="text-gray-400 text-xs">
                      {count > 1 ? `x${count}` : ""}
                      {canSell && (
                        <span className="text-yellow-400 ml-1">
                          {sellPrice.toLocaleString()} Adena {count > 1 ? `(всего ${(sellPrice * count).toLocaleString()})` : ""}
                        </span>
                      )}
                    </div>
                  </div>
                  {canSell && (
                    <div className="flex flex-col gap-0.5 flex-shrink-0">
                      <button
                        onClick={() => handleSell(item, 1)}
                        className="px-2 py-1 bg-[#7c6847] hover:bg-[#8b7756] text-white text-[10px] rounded"
                      >
                        Продать
                      </button>
                      {count > 1 && (
                        <button
                          onClick={() => handleSell(item, count)}
                          className="px-2 py-1 bg-[#5a4a35] hover:bg-[#6b5a45] text-[#c9b896] text-[10px] rounded"
                        >
                          Всё
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 mb-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-2 py-1 disabled:opacity-30 text-[10px] text-[#d9d9d9]"
            >
              &lt;&lt;
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2 py-1 disabled:opacity-30 text-[10px] text-[#d9d9d9]"
            >
              &lt;
            </button>
            <span className="px-2 text-[10px] text-[#d9d9d9]">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2 py-1 disabled:opacity-30 text-[10px] text-[#d9d9d9]"
            >
              &gt;
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-2 py-1 disabled:opacity-30 text-[10px] text-[#d9d9d9]"
            >
              &gt;&gt;
            </button>
          </div>
        )}

        <button
          onClick={() => navigate("/shop")}
          className="w-full py-2 text-sm text-[#99e074] hover:text-[#bbff97] border border-[#99e074]/50 rounded"
        >
          Вернуться в магазин
        </button>
      </div>
    </div>
  );
}
