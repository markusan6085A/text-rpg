// src/screens/SellItems.tsx
// Сторінка продажу предметів з інвентаря

import React, { useState, useMemo } from "react";
import { useHeroStore } from "../state/heroStore";
import InventoryFilters, { CATEGORIES } from "./character/InventoryFilters";
import { itemsDB, itemsDBWithStarter } from "../data/items/itemsDB";
import { getSellPrice } from "../utils/sellPrices";
import { getCityUiVariant } from "../utils/cityUiVariant";

type Navigate = (path: string) => void;

const ITEMS_PER_PAGE = 25;
const CURRENCY_IDS = new Set(["adena", "coin_of_luck", "coins_silver", "ancient_adena"]);
const NO_SELL_IDS = new Set(["seven_seals_medal", "coin_of_fair", "overflow_chest"]);

interface SellItemsProps {
  navigate: Navigate;
}

export default function SellItems({ navigate }: SellItemsProps) {
  const hero = useHeroStore((s) => s.hero);
  const updateHero = useHeroStore((s) => s.updateHero);

  const [currentCategory, setCurrentCategory] = useState("all");
  const [currentGrade, setCurrentGrade] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const isL2 = getCityUiVariant() === "l2";
  const l2Frame =
    "rounded-xl overflow-hidden border border-[#c7ad80]/35 shadow-[0_0_0_1px_rgba(0,0,0,0.85),0_16px_48px_rgba(0,0,0,0.65)] bg-[radial-gradient(ellipse_100%_50%_at_50%_-8%,rgba(120,90,45,0.28)_0%,transparent_50%),linear-gradient(180deg,#1c1812_0%,#0c0a08_100%)]";
  const modalPanel = isL2
    ? "bg-[#14110c] border border-[#5c4a32] rounded-lg p-4 w-full shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
    : "bg-[#14110c] border border-white/40 rounded-lg p-4 w-full";

  const [confirmSell, setConfirmSell] = useState<{
    type: "single" | "all" | "batch";
    item?: any;
    amount?: number;
    totalPrice?: number;
    onConfirm: () => void;
  } | null>(null);

  const filteredItems = useMemo(() => {
    if (!hero || !hero.inventory) return [];
    const category = CATEGORIES.find((c) => c.key === currentCategory) || CATEGORIES[0];
    let items = hero.inventory.filter(
      (item: any) => item && !CURRENCY_IDS.has(item.id) && !NO_SELL_IDS.has(item.id) && category.test(item)
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

  const toggleSelect = (globalIndex: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(globalIndex)) next.delete(globalIndex);
      else next.add(globalIndex);
      return next;
    });
  };

  const doSellSelected = () => {
    if (!hero || !hero.inventory || selectedIndices.size === 0) return;
    const indices = Array.from(selectedIndices).sort((a, b) => a - b);
    let totalAdena = 0;
    const toRemove: { id: string; enchantLevel: number; amount: number }[] = [];
    indices.forEach((idx) => {
      const item = filteredItems[idx];
      if (!item) return;
      const price = getSellPrice(item.id, itemsDB[item.id] || itemsDBWithStarter[item.id]);
      const amount = item.count ?? 1;
      const enchantLevel = item.enchantLevel || 0;
      if (price != null && price > 0) {
        totalAdena += price * amount;
        toRemove.push({ id: item.id, enchantLevel, amount });
      }
    });
    if (totalAdena === 0) return;
    const inv = [...hero.inventory];
    const remaining = new Map<string, number>();
    toRemove.forEach(({ id, enchantLevel, amount }) => {
      const key = `${id}_${enchantLevel}`;
      remaining.set(key, (remaining.get(key) ?? 0) + amount);
    });
    const newInv = inv.map((i: any) => {
      if (!i) return i;
      const key = `${i.id}_${i.enchantLevel || 0}`;
      const need = remaining.get(key);
      if (need == null || need <= 0) return i;
      const cnt = i.count ?? 1;
      if (cnt <= need) {
        remaining.set(key, need - cnt);
        return null;
      }
      remaining.set(key, 0);
      return { ...i, count: cnt - need };
    }).filter(Boolean) as typeof hero.inventory;
    const currentAdena = Number(useHeroStore.getState().hero?.adena ?? 0);
    updateHero({ inventory: newInv, adena: currentAdena + totalAdena });
    setSelectedIndices(new Set());
    setSelectMode(false);
    setConfirmSell(null);
  };

  const showSellSelectedConfirm = () => {
    if (!hero || selectedIndices.size === 0) return;
    const indices = Array.from(selectedIndices).sort((a, b) => a - b);
    let totalAdena = 0;
    indices.forEach((idx) => {
      const item = filteredItems[idx];
      if (!item) return;
      const price = getSellPrice(item.id, itemsDB[item.id] || itemsDBWithStarter[item.id]);
      const amount = item.count ?? 1;
      if (price != null && price > 0) totalAdena += price * amount;
    });
    if (totalAdena === 0) return;
    setConfirmSell({
      type: "batch",
      totalPrice: totalAdena,
      onConfirm: doSellSelected,
    });
  };

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
    const currentAdena = Number(useHeroStore.getState().hero?.adena ?? 0);
    const newAdena = currentAdena + totalGain;

    updateHero({ inventory: updatedInventory, adena: newAdena });
    setConfirmSell(null);
  };

  const showSellConfirm = (item: any, amount: number) => {
    const price = getSellPrice(item.id, itemsDB[item.id] || itemsDBWithStarter[item.id]);
    if (price == null || price <= 0) return;
    const totalPrice = price * amount;
    const def = itemsDB[item.id] || itemsDBWithStarter[item.id];
    const name = def?.name || item.name || item.id;
    setConfirmSell({
      type: amount > 1 ? "all" : "single",
      item: { ...item, name },
      amount,
      totalPrice,
      onConfirm: () => handleSell(item, amount),
    });
  };

  if (!hero) {
    return (
      <div
        className={
          isL2
            ? `${l2Frame} w-full min-w-0 my-1 flex items-center justify-center py-16 text-[#8a7a60] text-sm gap-2`
            : "text-white text-center pt-20"
        }
      >
        {isL2 && (
          <span className="w-4 h-4 border-2 border-[#5c4a32] border-t-[#c7ad80] rounded-full animate-spin shrink-0" />
        )}
        Загрузка...
      </div>
    );
  }

  const adena = hero.adena || 0;

  return (
    <div
      className={
        isL2
          ? `${l2Frame} w-full min-w-0 my-1 px-3 py-3 text-[#d4c4a8]`
          : "w-full flex flex-col items-center px-4 py-2"
      }
    >
      <div className={isL2 ? "max-w-[420px] mx-auto w-full" : "w-full max-w-[360px]"}>
        <div className="flex justify-between items-center mb-3">
          <h1
            className={
              isL2
                ? "text-lg font-bold text-[#e8c56e] [text-shadow:0_1px_2px_rgba(0,0,0,0.85)]"
                : "text-lg font-bold text-[#b8860b]"
            }
          >
            Продать вещи
          </h1>
          <button
            onClick={() => navigate("/shop")}
            className={
              isL2
                ? "text-xs text-[#7d9b7a] hover:text-[#9bc49a]"
                : "text-xs text-[#99e074] hover:text-[#bbff97]"
            }
          >
            ← Магазин
          </button>
        </div>

        <div className={isL2 ? "text-sm text-[#a89878] mb-2" : "text-sm text-gray-300 mb-2"}>
          У вас: <span className="text-yellow-400">{adena.toLocaleString()}</span> Adena
        </div>

        <InventoryFilters
          currentCategory={currentCategory}
          currentGrade={currentGrade}
          onCategoryChange={(cat) => { setCurrentCategory(cat); setCurrentGrade(""); setCurrentPage(1); setSelectedIndices(new Set()); }}
          onGradeChange={(g) => { setCurrentGrade(g); setCurrentPage(1); setSelectedIndices(new Set()); }}
        />

        <div className="flex gap-2 mb-2">
          <button
            onClick={() => { setSelectMode(!selectMode); if (selectMode) setSelectedIndices(new Set()); }}
            className={`px-2 py-1 text-xs rounded ${selectMode ? "bg-[#b8860b] text-white" : "bg-[#5a4a35] text-[#c9b896]"}`}
          >
            {selectMode ? "Отменить" : "Выбрать предмет"}
          </button>
          {selectMode && selectedIndices.size > 0 && (
            <button
              onClick={showSellSelectedConfirm}
              className="px-2 py-1 text-xs rounded bg-[#7c6847] text-white"
            >
              Продать выбранные ({selectedIndices.size})
            </button>
          )}
        </div>

        <div
          className={`space-y-1 mb-3 rounded-xl border-2 overflow-y-auto ${
            isL2 ? "border-[#5c4a32]/85 bg-[#0c0a08]" : ""
          }`}
          style={
            isL2
              ? { minHeight: "420px", maxHeight: "580px" }
              : {
                  backgroundColor: "#0f0c08",
                  borderColor: "rgba(255,255,255,0.5)",
                  minHeight: "420px",
                  maxHeight: "580px",
                }
          }
        >
          {paginatedItems.length === 0 ? (
            <div className="text-center text-gray-400 py-8 text-sm">Нет предметов для продажи</div>
          ) : (
            paginatedItems.map((item: any, idx: number) => {
              const globalIdx = startIndex + idx;
              const def = itemsDB[item.id] || itemsDBWithStarter[item.id];
              const sellPrice = getSellPrice(item.id, def);
              const count = item.count ?? 1;
              const canSell = sellPrice != null && sellPrice > 0;
              const isSelected = selectMode && selectedIndices.has(globalIdx);

              return (
                <div
                  key={`${item.id}-${idx}-${startIndex}`}
                  className={`flex items-center gap-2 py-1.5 px-2 border-b border-white/10 last:border-0 ${isSelected ? "bg-[#b8860b]/30" : ""}`}
                >
                  {selectMode && canSell && (
                    <button
                      onClick={() => toggleSelect(globalIdx)}
                      className={`w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center ${isSelected ? "bg-[#b8860b] border-[#b8860b]" : "border-white/50"}`}
                    >
                      {isSelected && <span className="text-white text-xs">✓</span>}
                    </button>
                  )}
                  <img
                    src={(item.icon || def?.icon || "").startsWith("/") ? (item.icon || def?.icon) : `/items/${item.icon || def?.icon}`}
                    alt=""
                    className="w-5 h-5 object-contain flex-shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).src = "/items/drops/Weapon_squires_sword_i00_0.jpg"; }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm truncate">
                      {def?.name || item.name}
                      {(def?.grade || item.grade) && (
                        <span className="text-[#9ca3af] ml-1">({def?.grade || item.grade})</span>
                      )}
                      {(item.enchantLevel ?? 0) > 0 && (
                        <span className="text-[#b8860b]"> +{item.enchantLevel}</span>
                      )}
                    </div>
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
                        onClick={() => showSellConfirm(item, 1)}
                        className="px-2 py-1 bg-[#7c6847] hover:bg-[#8b7756] text-white text-[10px] rounded"
                      >
                        Продать
                      </button>
                      {count > 1 && (
                        <button
                          onClick={() => showSellConfirm(item, count)}
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
          className={
            isL2
              ? "w-full py-2 text-sm rounded border border-[#5c4a32] text-[#7d9b7a] hover:border-[#c7ad80]/45 hover:text-[#9bc49a] bg-gradient-to-b from-[#2e2619]/50 to-transparent"
              : "w-full py-2 text-sm text-[#99e074] hover:text-[#bbff97] border border-[#99e074]/50 rounded"
          }
        >
          Вернуться в магазин
        </button>
      </div>

      {confirmSell && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={() => setConfirmSell(null)}
        >
          <div
            className={`${modalPanel} max-w-[280px]`}
            onClick={(e) => e.stopPropagation()}
          >
            <p className={`text-sm mb-3 ${isL2 ? "text-[#d4c4a8]" : "text-gray-200"}`}>
              {confirmSell.type === "batch" ? (
                <>Вы уверены, что хотите продать эти предметы?<br />Итого: <span className="text-yellow-400 font-semibold">{confirmSell.totalPrice?.toLocaleString()}</span> Adena</>
              ) : (
                <>Вы уверены, что хотите продать <span className="text-[#e0c68a]">{confirmSell.item?.name}{(confirmSell.item?.enchantLevel ?? 0) > 0 && <span className="text-[#b8860b]"> +{confirmSell.item.enchantLevel}</span>}</span>{confirmSell.amount && confirmSell.amount > 1 ? ` x${confirmSell.amount}` : ""} за <span className="text-yellow-400 font-semibold">{(confirmSell.totalPrice ?? 0).toLocaleString()}</span> Adena?</>
              )}
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmSell(null)}
                className="px-3 py-1.5 text-sm rounded bg-[#5a4a35] text-gray-300 hover:bg-[#6b5a45]"
              >
                Нет
              </button>
              <button
                onClick={() => confirmSell.onConfirm()}
                className="px-3 py-1.5 text-sm rounded bg-[#7c6847] text-white hover:bg-[#8b7756]"
              >
                Продать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
