// src/screens/Warehouse.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useHeroStore } from "../state/heroStore";
import { INVENTORY_MAX_ITEMS } from "../state/heroStore";
import type { HeroInventoryItem } from "../types/Hero";
import {
  loadWarehouse,
  saveItemToWarehouse,
  loadItemFromWarehouse,
} from "../state/warehouse/warehousePersistence";
import { CATEGORIES } from "./character/InventoryFilters";
import { itemsDB } from "../data/items/itemsDB";

interface WarehouseProps {
  navigate: (path: string) => void;
}

const WAREHOUSE_MAX_SLOTS = 10;
const DEFAULT_WAREHOUSE_CAPACITY = 100;
const MAX_WAREHOUSE_CAPACITY = 100;
const LOG_MAX_ENTRIES = 10;

interface LogEntry {
  id: string;
  message: string;
  timestamp: number;
}

export default function Warehouse({ navigate }: WarehouseProps) {
  const hero = useHeroStore((s) => s.hero);
  const updateHero = useHeroStore((s) => s.updateHero);

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

  // Завантажуємо склад при монтуванні компонента
  useEffect(() => {
    if (hero?.name) {
      const loadedWarehouse = loadWarehouse(hero.name);
      // Переконаємося, що всі предмети мають icon (якщо відсутній, беремо з itemsDB)
      const warehouseWithIcons = loadedWarehouse.map((item) => {
        if (item && !item.icon) {
          return {
            ...item,
            icon: itemsDB[item.id]?.icon,
          };
        }
        return item;
      });
      setWarehouse(warehouseWithIcons);
    }
  }, [hero?.name]);

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

  if (!hero) {
    return (
      <div className="flex items-center justify-center text-xs text-gray-400">
        Загрузка персонажа...
      </div>
    );
  }

  const warehouseCapacity = Math.min(
    hero.warehouseCapacity || DEFAULT_WAREHOUSE_CAPACITY,
    MAX_WAREHOUSE_CAPACITY
  );
  
  // Рахуємо реальну кількість предметів на складі (сума всіх count)
  const warehouseUsed = warehouse.reduce((total, item) => {
    if (item) {
      return total + (item.count || 1);
    }
    return total;
  }, 0);

  // Фільтрація предметів інвентаря
  const filteredInventoryItems = useMemo(() => {
    if (!hero || !hero.inventory) return [];
    const category = CATEGORIES.find((c) => c.key === currentCategory) || CATEGORIES[0];
    return hero.inventory.filter((item: any) => item && category.test(item));
  }, [hero, currentCategory]);

  // Пагінація: показуємо 10 предметів на сторінку
  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(filteredInventoryItems.length / ITEMS_PER_PAGE);
  const paginatedItems = useMemo(() => {
    const start = (inventoryPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredInventoryItems.slice(start, end);
  }, [filteredInventoryItems, inventoryPage]);

  // Скидаємо сторінку при зміні категорії
  useEffect(() => {
    setInventoryPage(1);
  }, [currentCategory]);

  // Функція для покладення предмета на склад
  const handlePutToWarehouse = (item: HeroInventoryItem, count?: number) => {
    if (!hero.name) return;

    const itemCount = count || 1;
    const maxCount = item.count || 1;

    if (itemCount > maxCount) {
      alert(`У вас только ${maxCount} ${item.name}`);
      return;
    }

    // Перевіряємо місткість складу
    if (warehouseUsed + itemCount > warehouseCapacity) {
      alert(
        `Склад переповнений! Вместимость: ${warehouseUsed}/${warehouseCapacity}. Недостаточно места для ${itemCount} предметов.`
      );
      return;
    }

    // Знаходимо вільний слот або існуючий слот з таким же предметом (якщо це ресурс)
    let targetSlotIndex = -1;
    const isResource = item.slot === "resource" || item.slot === "consumable";
    
    if (isResource) {
      // Шукаємо існуючий слот з таким же предметом
      for (let i = 0; i < WAREHOUSE_MAX_SLOTS; i++) {
        const existingItem = warehouse[i];
        if (existingItem && existingItem.id === item.id) {
          targetSlotIndex = i;
          break;
        }
      }
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
      alert("Склад переповнений! Максимум 10 слотів.");
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

      // Зберігаємо на склад
      saveItemToWarehouse(hero.name, targetSlotIndex, itemToStore);

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
    const isResource = item.slot === "resource" || item.slot === "consumable";
    const hasCount = (item.count || 1) > 1;

    if (isResource && hasCount) {
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
    if (!hero.name) return;

    const item = warehouse[slotIndex];
    if (!item) return;

    // Перевіряємо, чи є місце в інвентарі
    const inventorySize = (hero.inventory || []).length;
    if (inventorySize >= INVENTORY_MAX_ITEMS) {
      alert(`Инвентарь переполнен! Максимум ${INVENTORY_MAX_ITEMS} слотов.`);
      return;
    }

    // Додаємо предмет до інвентаря
    const newInventory = [...(hero.inventory || [])];
    const existingItemIndex = newInventory.findIndex((invItem) => invItem.id === item.id);

    if (existingItemIndex >= 0) {
      // Якщо предмет вже є в інвентарі, збільшуємо count
      const existingItem = newInventory[existingItemIndex];
      newInventory[existingItemIndex] = {
        ...existingItem,
        count: (existingItem.count || 1) + (item.count || 1),
      };
    } else {
      // Якщо предмета немає, додаємо новий
      newInventory.push(item);
    }

    // Видаляємо предмет зі складу
    saveItemToWarehouse(hero.name, slotIndex, null);

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
      alert(`Максимальная вместимость склада: ${MAX_WAREHOUSE_CAPACITY}`);
    }
  };

  return (
    <div className="w-full flex items-start justify-center">
      <div className="w-full max-w-md mt-5 mb-10 px-3">
        {/* Зображення складу */}
        <div className="px-4 py-3 border-b border-black/70">
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
        <div className="px-4 py-3 border-b border-black/70 text-[12px] text-[#cfcfcc]">
          <div className="mb-2">Приветствую тебя!</div>
          <div className="text-gray-400">
            Здесь ты можешь хранить свои вещи, чтобы не заполнялся твой инвентарь.
          </div>
        </div>

        {/* Заголовок з перемиканням */}
        <div className="px-4 py-2 border-b border-black/70">
          <div className="flex items-center gap-2 text-[12px]">
            <button
              onClick={() => setView("inventory")}
              className={`px-2 py-1 ${
                view === "inventory"
                  ? "text-white font-semibold border-b border-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Инвентарь
            </button>
            <span className="text-gray-500">|</span>
            <button
              onClick={() => setView("warehouse")}
              className={`px-2 py-1 ${
                view === "warehouse"
                  ? "text-white font-semibold border-b border-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Склад
            </button>
          </div>
        </div>

        {/* Вместимость */}
        <div className="px-4 py-2 border-b border-black/70 text-[12px] text-[#cfcfcc] flex items-center justify-between">
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
          <div className="px-4 py-2 border-b border-black/70">
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
        <div className="px-4 py-2 border-b border-black/70">
          {view === "inventory" ? (
            <>
              {/* Інвентар */}
              <div className="space-y-2">
                {paginatedItems.length > 0 ? (
                  paginatedItems.map((item, index) => (
                    <div
                      key={`${item.id}-${index}`}
                      className="flex items-center gap-2 py-1 border-b border-dotted border-white/30"
                    >
                      <img
                        src={
                          item.icon?.startsWith("/") 
                            ? item.icon 
                            : item.icon 
                            ? `/items/${item.icon}` 
                            : itemsDB[item.id]?.icon || "/items/drops/Weapon_squires_sword_i00_0.jpg"
                        }
                        alt={item.name}
                        className="w-6 h-6 object-contain"
                        onError={(e) => {
                          // Якщо іконка не завантажилась, спробуємо отримати з itemsDB
                          const itemDef = itemsDB[item.id];
                          if (itemDef?.icon && (e.target as HTMLImageElement).src !== itemDef.icon) {
                            (e.target as HTMLImageElement).src = itemDef.icon;
                          } else {
                            (e.target as HTMLImageElement).src = "/items/drops/Weapon_squires_sword_i00_0.jpg";
                          }
                        }}
                      />
                      <div className="flex-1 text-[12px] text-[#cfcfcc]">
                        <div>{item.name}</div>
                        {item.count && item.count > 1 && (
                          <div className="text-[10px] text-gray-400">x{item.count}</div>
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
                  <div className="flex items-center justify-center gap-2 mt-3 pt-2 border-t border-black/70">
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
            // Склад - показуємо тільки 10 предметів
            <div className="space-y-2">
              {(() => {
                const warehouseItems = warehouse.filter(item => item !== null).slice(0, 10);
                return warehouseItems.length > 0 ? (
                  warehouseItems.map((item, idx) => {
                    const slotIndex = warehouse.findIndex(w => w !== null && w.id === item.id);
                    return (
                      <div
                        key={slotIndex}
                        className="flex items-center gap-2 py-1 border-b border-dotted border-white/30"
                      >
                        <img
                          src={
                            item.icon?.startsWith("/") 
                              ? item.icon 
                              : item.icon 
                              ? `/items/${item.icon}` 
                              : itemsDB[item.id]?.icon || "/items/drops/Weapon_squires_sword_i00_0.jpg"
                          }
                          alt={item.name}
                          className="w-6 h-6 object-contain"
                          onError={(e) => {
                            const itemDef = itemsDB[item.id];
                            if (itemDef?.icon && (e.target as HTMLImageElement).src !== itemDef.icon) {
                              (e.target as HTMLImageElement).src = itemDef.icon;
                            } else {
                              (e.target as HTMLImageElement).src = "/items/drops/Weapon_squires_sword_i00_0.jpg";
                            }
                          }}
                        />
                        <div className="flex-1 text-[12px] text-[#cfcfcc]">
                          <div>{item.name}</div>
                          {item.count && item.count > 1 && (
                            <div className="text-[10px] text-gray-400">x{item.count}</div>
                          )}
                        </div>
                        <button
                          onClick={() => handleTakeFromWarehouse(slotIndex)}
                          className="text-[10px] text-[#3b82f6] hover:text-[#60a5fa] underline px-2 py-1"
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
        <div className="px-4 py-2 border-b border-black/70">
          <div className="text-[11px] text-[#cfcfcc] mb-2 font-semibold">Лог операций:</div>
          <div className="space-y-1">
            {Array.from({ length: LOG_MAX_ENTRIES }, (_, index) => {
              const entry = log[index];
              return (
                <div key={entry?.id || `log-empty-${index}`} className="text-[10px] text-gray-400 min-h-[14px]">
                  {entry ? entry.message : "\u00A0"}
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
            className="bg-[#14110c] border border-white/40 rounded-lg p-4 max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Заголовок */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#b8860b]">
                Положить на склад: {quantityModal.item.name}
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
                src={quantityModal.item.icon?.startsWith("/") ? quantityModal.item.icon : `/items/${quantityModal.item.icon}`}
                alt={quantityModal.item.name}
                className="w-16 h-16 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/items/drops/Weapon_squires_sword_i00_0.jpg";
                }}
              />
              <div className="flex-1">
                <div className="text-white text-base font-semibold mb-1">
                  {quantityModal.item.name}
                </div>
                {quantityModal.item.count && quantityModal.item.count > 1 && (
                  <div className="text-gray-400 text-sm">
                    У вас: {quantityModal.item.count}
                  </div>
                )}
              </div>
            </div>

            {/* Поле вводу кількості */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-[#b8860b] mb-2">
                Количество (макс: {quantityModal.maxCount}):
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
                onFocus={(e) => {
                  if (e.target.value === "0") {
                    e.target.select();
                  }
                }}
                className="w-full px-3 py-2 bg-[#2a2a2a] border border-white/50 text-sm text-[#cfcfcc] rounded focus:outline-none focus:ring-1 focus:ring-[#b8860b]"
                autoFocus
              />
            </div>

            {/* Кнопки */}
            <div className="flex gap-2 pt-2 border-t border-white/40">
              <button
                onClick={() => {
                  const count = Number(quantityInput) || 1;
                  if (count >= 1 && count <= quantityModal.maxCount) {
                    handlePutToWarehouse(quantityModal.item, count);
                  } else {
                    alert(`Введите число от 1 до ${quantityModal.maxCount}`);
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
