// src/screens/Warehouse.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useHeroStore } from "../state/heroStore";
import { useCharacterStore } from "../state/characterStore";
import { getInventoryMax } from "../state/heroStore";
import type { HeroInventoryItem } from "../types/Hero";
import {
  loadWarehouse,
  saveItemToWarehouse,
  loadItemFromWarehouse,
  WAREHOUSE_MAX_SLOTS,
} from "../state/warehouse/warehousePersistence";
import { isStackableHeroItem } from "../state/heroStore/inventoryOverflow";
import { L2_WARM_OUTER_FRAME } from "../utils/l2WarmLayoutClassNames";
import { CATEGORIES } from "./character/InventoryFilters";
import { itemsDB } from "../data/items/itemsDB";
import { showToast } from "../state/toastStore";
import { isWarmCityUi, getCityUiVariant } from "../utils/cityUiVariant";

interface WarehouseProps {
  navigate: (path: string) => void;
}

const DEFAULT_WAREHOUSE_CAPACITY = 100;
const MAX_WAREHOUSE_CAPACITY = 100;
const LOG_MAX_ENTRIES = 10;
// Валюта — показується в балансі персонажа, не в інвентарі/складі
const CURRENCY_IDS = new Set(["adena", "coin_of_luck", "coins_silver", "ancient_adena"]);

/** Безпечний текст для рендеру: дані з localStorage/API можуть бути об'єктом — React не приймає об'єкти як child. */
function safeText(val: unknown): string {
  if (val == null) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number") return String(val);
  return String(val);
}

interface LogEntry {
  id: string;
  message: string;
  timestamp: number;
}

export default function Warehouse({ navigate }: WarehouseProps) {
  const hero = useHeroStore((s) => s.hero);
  const updateHero = useHeroStore((s) => s.updateHero);
  const characterId = useCharacterStore((s) => s.characterId);
  const activeCharacterId = characterId || hero?.id || null;

  const [view, setView] = useState<"inventory" | "warehouse">("inventory");
  const [warehouse, setWarehouse] = useState<(HeroInventoryItem | null)[]>([]);
  const [currentCategory, setCurrentCategory] = useState("all");
  const [log, setLog] = useState<LogEntry[]>([]);
  const [inventoryPage, setInventoryPage] = useState(1);
  const [quantityModal, setQuantityModal] = useState<{
    item: HeroInventoryItem;
    maxCount: number;
  } | null>(null);
  const [quantityInput, setQuantityInput] = useState<string>("1");

  // Завантажуємо склад по characterId (не по імені), щоб не губити при зміні ніка
  useEffect(() => {
    if (!activeCharacterId) return;
    try {
      const loadedWarehouse = loadWarehouse(activeCharacterId, hero?.name);
      const list = Array.isArray(loadedWarehouse) ? loadedWarehouse : [];
      const warehouseWithIcons = list.map((item) => {
        if (!item) return null;
        try {
          const iconVal = item.icon ?? (itemsDB && itemsDB[item.id]?.icon);
          const iconStr = typeof iconVal === "string" ? iconVal : undefined;
          const nameStr = typeof item.name === "string" ? item.name : (item.name != null ? String(item.name) : "Предмет");
          return { ...item, name: nameStr, icon: iconStr };
        } catch {
          return { ...item, name: safeText(item.name), icon: undefined };
        }
      });
      setWarehouse(warehouseWithIcons);
    } catch (e) {
      if (import.meta.env.DEV) console.warn("[Warehouse] loadWarehouse failed:", e);
      setWarehouse([]);
    }
  }, [activeCharacterId, hero?.name]);

  // Усі хуки обов'язково викликаються до будь-якого return (Rules of Hooks)
  const warehouseArr = Array.isArray(warehouse) ? warehouse : [];
  const warehouseCapacity = hero
    ? Math.min(Number(hero.warehouseCapacity) || DEFAULT_WAREHOUSE_CAPACITY, MAX_WAREHOUSE_CAPACITY)
    : MAX_WAREHOUSE_CAPACITY;

  const filteredInventoryItems = useMemo(() => {
    if (!hero) return [];
    const inv = Array.isArray(hero.inventory) ? hero.inventory : [];
    const category = CATEGORIES.find((c) => c.key === currentCategory) || CATEGORIES[0];
    const withoutCurrency = inv.filter((item: any) => item && !CURRENCY_IDS.has(item.id));
    if (!category || typeof category.test !== "function") return withoutCurrency;
    return withoutCurrency.filter((item: any) => category.test(item));
  }, [hero, currentCategory]);

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.max(1, Math.ceil(filteredInventoryItems.length / ITEMS_PER_PAGE));
  const paginatedItems = useMemo(() => {
    const start = (inventoryPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredInventoryItems.slice(start, end);
  }, [filteredInventoryItems, inventoryPage]);

  useEffect(() => {
    setInventoryPage(1);
  }, [currentCategory]);

  const isL2 = isWarmCityUi(getCityUiVariant());
  const l2Frame = L2_WARM_OUTER_FRAME;
  const borderB = isL2 ? "border-b border-[#5c4a32]/45" : "border-b border-black/70";
  const borderT = isL2 ? "border-t border-[#5c4a32]/45" : "border-t border-black/70";
  const rowL2 =
    "flex items-center gap-2 py-2 px-2 mb-1 rounded-md bg-gradient-to-b from-[#2e2619] to-[#14110c] border border-[#5c4a32]/75 shadow-[inset_0_1px_0_rgba(199,173,128,0.12)]";
  const modalPanel = isL2
    ? "bg-[#14110c] border border-[#5c4a32] rounded-lg p-4 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
    : "bg-[#14110c] border border-white/40 rounded-lg p-4 max-w-md w-full max-h-[90vh] overflow-y-auto";

  // Додаємо запис до логу
  const addLogEntry = (message: string) => {
    const newEntry: LogEntry = {
      id: Date.now().toString(),
      message,
      timestamp: Date.now(),
    };
    setLog((prev) => {
      const updated = [newEntry, ...prev].slice(0, LOG_MAX_ENTRIES);
      return updated;
    });
  };

  // Після всіх хуків — умовні return
  if (!hero) {
    return (
      <div
        className={
          isL2
            ? `${l2Frame} w-full min-w-0 my-1 flex items-center justify-center py-12 text-[#8a7a60] text-xs gap-2`
            : "flex items-center justify-center text-xs text-gray-400"
        }
      >
        {isL2 && (
          <span className="w-4 h-4 border-2 border-[#5c4a32] border-t-[#c7ad80] rounded-full animate-spin shrink-0" />
        )}
        Загрузка персонажа...
      </div>
    );
  }

  if (!activeCharacterId) {
    return (
      <div
        className={
          isL2
            ? `${l2Frame} w-full min-w-0 my-1 flex flex-col items-center justify-center gap-2 text-center p-4 text-[#8a7a60]`
            : "flex flex-col items-center justify-center gap-2 text-center p-4 text-gray-400"
        }
      >
        <p className="text-sm">Склад недоступний.</p>
        <p className="text-xs">Увійдіть у гру з головної сторінки та оберіть персонажа.</p>
      </div>
    );
  }

  // Кількість зайнятих СЛОТІВ (не кількість предметів): кожен слот = 1, незалежно від item.count
  const warehouseUsed = warehouseArr.filter(Boolean).length;

  // Функція для покладення предмета на склад
  const handlePutToWarehouse = (item: HeroInventoryItem, count?: number) => {
    if (!activeCharacterId) return;

    if ((item as any).meta?.hasLSPassive) {
      showToast("Нельзя положить на склад камень с пассивным эффектом (ЛС)", "error");
      return;
    }

    const itemCount = count || 1;
    const maxCount = item.count || 1;

    if (itemCount > maxCount) {
      showToast(`У вас только ${maxCount} ${item.name}`, "error");
      return;
    }

    // Стак: шукаємо спочатку існуючий слот з таким же стакованим предметом
    let targetSlotIndex = -1;
    const canMergeStacks = isStackableHeroItem(item);

    if (canMergeStacks) {
      const normId = (s: string) => String(s ?? "").replace(/^shop_/i, "").toLowerCase();
      for (let i = 0; i < WAREHOUSE_MAX_SLOTS; i++) {
        const existingItem = warehouse[i];
        if (existingItem && normId(existingItem.id) === normId(item.id)) {
          targetSlotIndex = i;
          break;
        }
      }
    }

    // Перевіряємо місткість складу:
    // Якщо item стакується і вже є в складі — нового слоту не потрібно
    const needsNewSlot = targetSlotIndex === -1;
    const slotsNeeded = canMergeStacks ? (needsNewSlot ? 1 : 0) : itemCount;
    if (warehouseUsed + slotsNeeded > warehouseCapacity) {
      showToast(
        `Склад переповнений! Вместимость: ${warehouseUsed}/${warehouseCapacity}.`,
        "error"
      );
      return;
    }

    // Якщо не знайшли існуючий слот, шукаємо вільний
    if (targetSlotIndex === -1) {
      for (let i = 0; i < WAREHOUSE_MAX_SLOTS; i++) {
        if (warehouse[i] === null) {
          targetSlotIndex = i;
          break;
        }
      }
    }

    if (targetSlotIndex === -1) {
      showToast(`Склад переповнений! Нема вільної комірки (${WAREHOUSE_MAX_SLOTS} слотів).`, "error");
      return;
    }

    // Видаляємо предмет з інвентаря
    const newInventory = [...(hero.inventory || [])];
    const itemIndex = newInventory.findIndex((invItem) => invItem.id === item.id);

    if (itemIndex >= 0) {
      const existingItem = newInventory[itemIndex];
      const newCount = (existingItem.count || 1) - itemCount;

      if (newCount <= 0) {
        // Видаляємо предмет повністю
        newInventory.splice(itemIndex, 1);
      } else {
        // Зменшуємо count
        newInventory[itemIndex] = { ...existingItem, count: newCount };
      }

      // Додаємо предмет на склад
      const existingWarehouseItem = warehouse[targetSlotIndex];
      let itemToStore: HeroInventoryItem;

      if (existingWarehouseItem && existingWarehouseItem.id === item.id) {
        // Об'єднуємо з існуючим предметом
        itemToStore = {
          ...existingWarehouseItem,
          count: (existingWarehouseItem.count || 1) + itemCount,
          // Переконаємося, що icon зберігається
          icon: existingWarehouseItem.icon || item.icon || itemsDB[item.id]?.icon,
        };
      } else {
        // Створюємо новий предмет
        itemToStore = {
          ...item,
          count: itemCount,
          // Переконаємося, що icon зберігається
          icon: item.icon || itemsDB[item.id]?.icon,
        };
      }

      // Зберігаємо на склад (по characterId)
      saveItemToWarehouse(activeCharacterId, targetSlotIndex, itemToStore);

      // Оновлюємо стан
      const newWarehouse = [...warehouse];
      newWarehouse[targetSlotIndex] = itemToStore;
      setWarehouse(newWarehouse);

      // Оновлюємо інвентар героя
      updateHero({ inventory: newInventory });

      // Додаємо запис до логу
      addLogEntry(`Положено на склад: ${item.name} x${itemCount}`);
    }

    // Закриваємо модальне вікно
    setQuantityModal(null);
    setQuantityInput("1");
  };

  // Функція для відкриття модального вікна вибору кількості
  const handlePutToWarehouseClick = (item: HeroInventoryItem) => {
    const stackItem = isStackableHeroItem(item);
    const hasCount = (item.count || 1) > 1;

    if (stackItem && hasCount) {
      // Показуємо модальне вікно для вибору кількості
      setQuantityModal({
        item,
        maxCount: item.count || 1,
      });
      setQuantityInput("1");
    } else {
      // Покладаємо одразу
      handlePutToWarehouse(item, 1);
    }
  };

  // Функція для взяття предмета зі складу
  const handleTakeFromWarehouse = (slotIndex: number) => {
    if (!activeCharacterId) return;

    const item = warehouse[slotIndex];
    if (!item) return;

    const canStack = isStackableHeroItem(item);
    const slotsNeeded = canStack ? 1 : (item.count || 1);
    const inventorySize = (hero.inventory || []).length;
    const maxSlots = getInventoryMax(hero);
    if (inventorySize + slotsNeeded > maxSlots) {
      showToast(`Инвентарь переполнен! Нужно ${slotsNeeded} слотов, свободно ${maxSlots - inventorySize}.`, "error");
      return;
    }

    // Додаємо предмет до інвентаря (stackable: false — кожен окремим слотом)
    const newInventory = [...(hero.inventory || [])];
    const existingItemIndex = canStack ? newInventory.findIndex((invItem) => invItem.id === item.id && !(invItem as any).meta?.hasLSPassive) : -1;

    if (existingItemIndex >= 0) {
      const existingItem = newInventory[existingItemIndex];
      newInventory[existingItemIndex] = {
        ...existingItem,
        count: (existingItem.count || 1) + (item.count || 1),
      };
    } else {
      const cnt = item.count || 1;
      if (canStack) {
        newInventory.push(item);
      } else {
        for (let i = 0; i < cnt; i++) {
          newInventory.push({ ...item, count: 1 });
        }
      }
    }

    // Видаляємо предмет зі складу
    saveItemToWarehouse(activeCharacterId, slotIndex, null);

    // Оновлюємо стан
    const newWarehouse = [...warehouse];
    newWarehouse[slotIndex] = null;
    setWarehouse(newWarehouse);

    // Оновлюємо інвентар героя
    updateHero({ inventory: newInventory });

    // Додаємо запис до логу
    addLogEntry(`Взято со склада: ${item.name} x${item.count || 1}`);
  };

  // Функція для збільшення місткості складу
  const handleIncreaseCapacity = () => {
    const newCapacity = Math.min(warehouseCapacity + 10, MAX_WAREHOUSE_CAPACITY);
    if (newCapacity > warehouseCapacity) {
      updateHero({ warehouseCapacity: newCapacity });
      addLogEntry(`Вместимость склада увеличена до ${newCapacity}`);
    } else {
      showToast(`Максимальная вместимость склада: ${MAX_WAREHOUSE_CAPACITY}`, "info");
    }
  };

  return (
    <div
      className={
        isL2
          ? `${l2Frame} w-full min-w-0 my-1 px-3 py-3 text-[#d4c4a8] flex items-start justify-center`
          : "w-full flex items-start justify-center"
      }
    >
      <div className={isL2 ? "w-full max-w-[420px] mx-auto" : "w-full max-w-md mt-5 mb-10 px-3"}>
        {/* Зображення складу */}
        <div className={`px-4 py-3 ${borderB}`}>
          <img
            src="/items/drops/item/sklad2.jpg"
            alt="Склад"
            className="w-full h-auto object-contain mb-3"
            style={{
              boxShadow: "inset 0 0 60px 25px rgba(0, 0, 0, 1), inset 0 0 100px 50px rgba(0, 0, 0, 1)",
            }}
            onError={(e) => {
              console.warn("Failed to load sklad2.jpg");
            }}
          />
        </div>

        {/* Привітальне повідомлення */}
        <div className={`px-4 py-3 ${borderB} text-[12px] ${isL2 ? "text-[#d4c4a8]" : "text-[#cfcfcc]"}`}>
          <div className="mb-2">Приветствую тебя!</div>
          <div className={isL2 ? "text-[#a89878]" : "text-gray-400"}>
            Здесь ты можешь хранить свои вещи, чтобы не заполнялся твой инвентарь.
          </div>
        </div>

        {/* Заголовок з перемиканням */}
        <div className={`px-4 py-2 ${borderB}`}>
          <div className="flex items-center gap-2 text-[12px]">
            <button
              onClick={() => setView("inventory")}
              className={`px-2 py-1 ${
                view === "inventory"
                  ? isL2
                    ? "text-[#e8c56e] font-semibold border-b border-[#c9a44c]"
                    : "text-white font-semibold border-b border-white"
                  : isL2
                    ? "text-[#a89878] hover:text-[#d4c4a8]"
                    : "text-gray-400 hover:text-white"
              }`}
            >
              Инвентарь
            </button>
            <span className={isL2 ? "text-[#6b5c42]" : "text-gray-500"}>|</span>
            <button
              onClick={() => setView("warehouse")}
              className={`px-2 py-1 ${
                view === "warehouse"
                  ? isL2
                    ? "text-[#e8c56e] font-semibold border-b border-[#c9a44c]"
                    : "text-white font-semibold border-b border-white"
                  : isL2
                    ? "text-[#a89878] hover:text-[#d4c4a8]"
                    : "text-gray-400 hover:text-white"
              }`}
            >
              Склад
            </button>
          </div>
        </div>

        {/* Вместимость */}
        <div className={`px-4 py-2 ${borderB} text-[12px] flex items-center justify-between ${isL2 ? "text-[#d4c4a8]" : "text-[#cfcfcc]"}`}>
          <span>
            Вместимость: {warehouseUsed}/{warehouseCapacity}
          </span>
          <button
            onClick={handleIncreaseCapacity}
            className="text-[#ff8c00] hover:text-[#ffa500] underline"
          >
            Увеличить (+)
          </button>
        </div>

        {/* Категорії (тільки для інвентаря) */}
        {view === "inventory" && (
          <div className={`px-4 py-2 ${borderB}`}>
            <div className="flex flex-col gap-1 mb-3 text-[10px] border-b border-white/50 pb-1" style={{ color: "#d9d9d9" }}>
              {/* Перший ряд - перші 5 табів */}
              <div className="flex items-center gap-0">
                {CATEGORIES.slice(0, 5).map((cat, idx) => (
                  <React.Fragment key={cat.key}>
                    <button
                      onClick={() => setCurrentCategory(cat.key)}
                      className={`px-1.5 py-0.5 ${
                        currentCategory === cat.key
                          ? "text-[#b8860b] font-semibold"
                          : "text-[#d9d9d9] hover:text-[#f5d7a1]"
                      }`}
                    >
                      {cat.label}
                    </button>
                    {idx < 4 && (
                      <span className="text-[#5a4424] mx-0.5">|</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
              {/* Другий ряд - решта табів */}
              <div className="flex items-center gap-0">
                {CATEGORIES.slice(5).map((cat, idx) => (
                  <React.Fragment key={cat.key}>
                    <button
                      onClick={() => setCurrentCategory(cat.key)}
                      className={`px-1.5 py-0.5 ${
                        currentCategory === cat.key
                          ? "text-[#b8860b] font-semibold"
                          : "text-[#d9d9d9] hover:text-[#f5d7a1]"
                      }`}
                    >
                      {cat.label}
                    </button>
                    {idx < CATEGORIES.slice(5).length - 1 && (
                      <span className="text-[#5a4424] mx-0.5">|</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Список предметів */}
        <div className={`px-4 py-2 ${borderB}`}>
          {view === "inventory" ? (
            <>
              {/* Інвентар */}
              <div className="space-y-2">
                {paginatedItems.length > 0 ? (
                  paginatedItems.map((item, index) => (
                    <div
                      key={`${item.id}-${index}`}
                      className={
                        isL2
                          ? rowL2
                          : "flex items-center gap-2 py-1 border-b border-solid border-white/30"
                      }
                    >
                      <img
                        src={
                          (() => {
                            const iconVal = item.icon ?? itemsDB[item.id]?.icon;
                            const s = typeof iconVal === "string" ? iconVal : "";
                            if (!s) return "/items/drops/Weapon_squires_sword_i00_0.jpg";
                            return s.startsWith("/") ? s : `/items/${s}`;
                          })()
                        }
                        alt={safeText(item.name)}
                        className="w-6 h-6 object-contain"
                        onError={(e) => {
                          // Якщо іконка не завантажилась, спробуємо отримати з itemsDB
                          const itemDef = itemsDB[item.id];
                          const icon = itemDef?.icon;
                          const iconStr = typeof icon === "string" ? icon : "";
                          if (iconStr && (e.target as HTMLImageElement).src !== iconStr) {
                            (e.target as HTMLImageElement).src = iconStr.startsWith("/") ? iconStr : `/items/${iconStr}`;
                          } else {
                            (e.target as HTMLImageElement).src = "/items/drops/Weapon_squires_sword_i00_0.jpg";
                          }
                        }}
                      />
                      <div className="flex-1 text-[12px] text-[#cfcfcc]">
                        <div>{safeText(item.name || itemsDB[item.id]?.name || item.id)}</div>
                        {item.count != null && Number(item.count) > 1 && (
                          <div className="text-[10px] text-gray-400">x{Number(item.count)}</div>
                        )}
                      </div>
                      <button
                        onClick={() => handlePutToWarehouseClick(item)}
                        className="text-[10px] text-[#ff8c00] hover:text-[#ffa500] underline px-2 py-1"
                      >
                        [Положить на склад]
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-400 text-[12px] py-4">
                    Инвентарь пуст
                  </div>
                )}
                
                {/* Пагінація */}
                {filteredInventoryItems.length > ITEMS_PER_PAGE && (
                  <div className={`flex items-center justify-center gap-2 mt-3 pt-2 ${borderT}`}>
                    <button
                      onClick={() => setInventoryPage(prev => Math.max(1, prev - 1))}
                      disabled={inventoryPage === 1}
                      className="text-[10px] text-[#ff8c00] hover:text-[#ffa500] underline disabled:text-gray-600 disabled:no-underline px-2"
                    >
                      ← Назад
                    </button>
                    <span className="text-[10px] text-gray-400">
                      Сторінка {inventoryPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setInventoryPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={inventoryPage >= totalPages}
                      className="text-[10px] text-[#ff8c00] hover:text-[#ffa500] underline disabled:text-gray-600 disabled:no-underline px-2"
                    >
                      Вперед →
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            // Склад — усі зайняті комірки за реальним індексом (0…WAREHOUSE_MAX_SLOTS-1)
            <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
              {(() => {
                const rows = warehouseArr
                  .map((item, slotIndex) => (item ? { item, slotIndex } : null))
                  .filter(Boolean) as { item: HeroInventoryItem; slotIndex: number }[];
                return rows.length > 0 ? (
                  rows.map(({ item, slotIndex }) => {
                    const iconVal = item.icon ?? itemsDB[item.id]?.icon;
                    const iconStr = typeof iconVal === "string" ? iconVal : "/items/drops/Weapon_squires_sword_i00_0.jpg";
                    const src = iconStr.startsWith("/") ? iconStr : `/items/${iconStr}`;
                    return (
                      <div
                        key={`wh-slot-${slotIndex}`}
                        className={
                          isL2
                            ? rowL2
                            : "flex items-center gap-2 py-1 border-b border-solid border-white/30"
                        }
                      >
                        <img
                          src={src}
                          alt={safeText(item.name)}
                          className="w-6 h-6 object-contain"
                          onError={(e) => {
                            const itemDef = itemsDB[item.id];
                            const fallback = typeof itemDef?.icon === "string"
                              ? (itemDef.icon.startsWith("/") ? itemDef.icon : `/items/${itemDef.icon}`)
                              : "/items/drops/Weapon_squires_sword_i00_0.jpg";
                            (e.target as HTMLImageElement).src = fallback;
                          }}
                        />
                        <div className="flex-1 text-[12px] text-[#cfcfcc]">
                          <div>{safeText(item.name || itemsDB[item.id]?.name || item.id)}</div>
                          {item.count != null && Number(item.count) > 1 && (
                            <div className="text-[10px] text-gray-400">x{Number(item.count)}</div>
                          )}
                        </div>
                        <button
                          onClick={() => handleTakeFromWarehouse(slotIndex)}
                          className={
                            isL2
                              ? "text-[10px] text-[#9d8265] hover:text-[#c9a44c] underline px-2 py-1"
                              : "text-[10px] text-[#3b82f6] hover:text-[#60a5fa] underline px-2 py-1"
                          }
                        >
                          [Взять]
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-gray-400 text-[12px] py-4">
                    Склад пуст
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Лог операцій */}
        <div className={`px-4 py-2 ${borderB}`}>
          <div className={`text-[11px] mb-2 font-semibold ${isL2 ? "text-[#e8c56e]" : "text-[#cfcfcc]"}`}>Лог операций:</div>
          <div className="space-y-1">
            {Array.from({ length: LOG_MAX_ENTRIES }, (_, index) => {
              const entry = log[index];
              return (
                <div key={entry?.id || `log-empty-${index}`} className="text-[10px] text-gray-400 min-h-[14px]">
                  {entry ? safeText(entry.message) : "\u00A0"}
                </div>
              );
            })}
          </div>
        </div>

        {/* Кнопка назад */}
        <div className="px-4 py-2">
          <button
            onClick={() => navigate("/city")}
            className="w-full text-center text-[12px] text-[#ff8c00] hover:text-[#ffa500] underline py-2"
          >
            Назад
          </button>
        </div>
      </div>

      {/* Модальне вікно для вибору кількості */}
      {quantityModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={() => {
            setQuantityModal(null);
            setQuantityInput("1");
          }}
        >
          <div
            className={modalPanel}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Заголовок */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#b8860b]">
                Положить на склад: {safeText(quantityModal.item.name)}
              </h2>
              <button
                className="text-gray-400 hover:text-white text-xl"
                onClick={() => {
                  setQuantityModal(null);
                  setQuantityInput("1");
                }}
              >
                ×
              </button>
            </div>

            {/* Іконка предмета */}
            <div className="flex items-center gap-3 mb-4">
              <img
                src={
                  typeof quantityModal.item.icon === "string"
                    ? quantityModal.item.icon.startsWith("/")
                      ? quantityModal.item.icon
                      : `/items/${quantityModal.item.icon}`
                    : "/items/drops/Weapon_squires_sword_i00_0.jpg"
                }
                alt={safeText(quantityModal.item.name)}
                className="w-16 h-16 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/items/drops/Weapon_squires_sword_i00_0.jpg";
                }}
              />
              <div className="flex-1">
                <div className="text-white text-base font-semibold mb-1">
                  {safeText(quantityModal.item.name)}
                </div>
                {quantityModal.item.count != null && Number(quantityModal.item.count) > 1 && (
                  <div className="text-gray-400 text-sm">
                    У вас: {Number(quantityModal.item.count)}
                  </div>
                )}
              </div>
            </div>

            {/* Поле вводу кількості */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-[#b8860b] mb-2">
                Количество (макс: {Number(quantityModal.maxCount)}):
              </label>
              <input
                type="number"
                min="1"
                max={quantityModal.maxCount}
                value={quantityInput}
                onChange={(e) => {
                  let val = e.target.value;
                  // Видаляємо початковий "0" якщо вводиться число
                  if (val.startsWith("0") && val.length > 1) {
                    val = val.replace(/^0+/, "") || "1";
                  }
                  if (val === "" || (Number(val) >= 1 && Number(val) <= quantityModal.maxCount)) {
                    setQuantityInput(val);
                  }
                }}
                onFocus={(e) => e.target.select()}
                className="w-full px-3 py-2 bg-[#2a2a2a] border border-white/50 text-sm text-[#cfcfcc] rounded focus:outline-none focus:ring-1 focus:ring-[#b8860b]"
                autoFocus
              />
            </div>

            {/* Кнопки */}
            <div className={`flex gap-2 pt-2 border-t ${isL2 ? "border-[#5c4a32]/50" : "border-white/40"}`}>
              <button
                onClick={() => {
                  const count = Number(quantityInput) || 1;
                  if (count >= 1 && count <= quantityModal.maxCount) {
                    handlePutToWarehouse(quantityModal.item, count);
                  } else {
                    showToast(`Введите число от 1 до ${quantityModal.maxCount}`, "error");
                  }
                }}
                className="flex-1 px-4 py-2 rounded-md bg-[#2a2a2a] ring-1 ring-white/10 text-xs text-[#b8860b] hover:bg-[#3a3a3a]"
              >
                Положить
              </button>
              <button
                onClick={() => {
                  setQuantityModal(null);
                  setQuantityInput("1");
                }}
                className="flex-1 px-4 py-2 rounded-md bg-[#2a2a2a] ring-1 ring-white/10 text-xs text-gray-300 hover:bg-[#3a3a3a]"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
