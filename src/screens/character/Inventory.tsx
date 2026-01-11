import React, { useEffect, useState, useMemo } from "react";
import { itemsDB } from "../../data/items/itemsDB";
import { useHeroStore } from "../../state/heroStore";
import { INVENTORY_MAX_ITEMS } from "../../state/heroStore";
import Equipment from "./Equipment";

const CATEGORIES = [
  { key: "all", label: "Все", test: () => true },
  { key: "weapon", label: "Оружие", test: (item: any) => item.slot === "weapon" },
  { key: "armor", label: "Броня", test: (item: any) => ["head", "armor", "legs", "gloves", "boots", "belt"].includes(item.slot) },
  { key: "bijou", label: "Биж", test: (item: any) => ["necklace", "earring_left", "earring_right", "ring_left", "ring_right", "jewelry"].includes(item.slot) },
  { key: "resource", label: "Рес", test: (item: any) => item.slot === "resource" },
  { key: "recipe", label: "Рецепты", test: (item: any) => item.slot === "recipe" },
  { key: "quest", label: "Квест", test: (item: any) => item.slot === "quest" },
  { key: "book", label: "Книги", test: (item: any) => item.slot === "book" },
];

const ITEMS_PER_PAGE = 10;

export default function Inventory() {
  const hero = useHeroStore((s) => s.hero);
  const loadHero = useHeroStore((s) => s.loadHero);
  const updateHero = useHeroStore((s) => s.updateHero);
  const equipItem = useHeroStore((s) => s.equipItem);
  const unequipItem = useHeroStore((s) => s.unequipItem);

  const [currentCategory, setCurrentCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadHero();
  }, [loadHero]);

  // Фільтрація предметів
  const filteredItems = useMemo(() => {
    if (!hero || !hero.inventory) return [];
    const category = CATEGORIES.find((c) => c.key === currentCategory) || CATEGORIES[0];
    return hero.inventory.filter((item: any) => item && category.test(item));
  }, [hero, currentCategory]);

  // Пагінація
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Кількість зайнятих слотів
  const itemsUsed = hero?.inventory?.filter(Boolean).length ?? 0;

  // Обробка дій
  const handleAction = (item: any, action: "equip" | "use" | "unequip") => {
    if (!hero || !item) return;

    if (action === "equip") {
      const slot = item.slot;
      if (["all", "consumable", "resource", "quest", "book", "recipe"].includes(slot)) {
        alert("Этот предмет нельзя одеть");
        return;
      }
      equipItem(item);
    } else if (action === "use") {
      // Використання предмета (потрібно буде реалізувати)
      alert("Функція використання в розробці");
    } else if (action === "unequip") {
      // Зняття екіпіровки
      const slot = item.slot;
      unequipItem(slot);
    }
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
        {/* Equipment вікно зверху */}
        <Equipment compact={true} />

        {/* Інвентар нижче */}
        {/* Верхня частина: кількість слотів */}
        <div className="flex justify-end items-center mb-2 text-white">
          <div className="text-xs">{itemsUsed}/{INVENTORY_MAX_ITEMS}</div>
        </div>

        {/* Фільтри з розділювачами */}
        <div className="flex items-center gap-0 mb-3 text-[10px] text-white border-b border-[#5a4424] pb-1">
          {CATEGORIES.map((cat, idx) => (
            <React.Fragment key={cat.key}>
              <button
                onClick={() => {
                  setCurrentCategory(cat.key);
                  setCurrentPage(1);
                }}
                className={`px-1.5 py-0.5 ${
                  currentCategory === cat.key
                    ? "text-[#f5d7a1] font-semibold"
                    : "text-white"
                }`}
              >
                {cat.label}
              </button>
              {idx < CATEGORIES.length - 1 && (
                <span className="text-[#5a4424]">|</span>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Список предметів */}
        <div className="space-y-0 mb-3">
          {paginatedItems.length === 0 ? (
            <div className="text-center text-gray-400 py-4 text-[10px]">Пусто</div>
          ) : (
            paginatedItems.map((item: any, idx: number) => {
              const iconPath = item.icon?.startsWith("/") ? item.icon : `/items/${item.icon}`;
              const isEquipable = !["all", "consumable", "resource", "quest", "book", "recipe"].includes(item.slot);
              const isConsumable = item.slot === "consumable";
              const isEquipped = hero.equipment?.[item.slot] === item.id;
              const actionLabel = isEquipped
                ? "[Снять]"
                : isEquipable
                ? "[Надеть]"
                : isConsumable
                ? "[Использовать]"
                : "";

                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 px-2 py-1 border-b border-[#2a2a2a] text-[10px] text-white"
                      style={{
                        backgroundColor: "#0f0f0f",
                        borderBottom: "1px solid #2a2a2a",
                      }}
                    >
                  <img
                    src={iconPath}
                    alt={item.name}
                    className="w-5 h-5 object-contain flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-[10px]">
                      {item.name}
                      {item.count && item.count > 1 ? ` (x${item.count})` : ""}
                    </div>
                    {actionLabel && (
                      <button
                        onClick={() =>
                          handleAction(
                            item,
                            isEquipped ? "unequip" : isEquipable ? "equip" : "use"
                          )
                        }
                        className="text-white hover:text-[#f5d7a1] text-[9px] mt-0.5"
                      >
                        {actionLabel}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Пагінація */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-1 text-white text-[10px]">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-1.5 py-0.5 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              &lt;&lt;
            </button>
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-1.5 py-0.5 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              &lt;
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-1.5 py-0.5 ${
                  currentPage === page
                    ? "bg-[#5a4424] text-[#f5d7a1] font-semibold"
                    : "text-white"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-1.5 py-0.5 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              &gt;
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-1.5 py-0.5 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              &gt;&gt;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
