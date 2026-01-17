import React from "react";
import { itemsDB, itemsDBWithStarter } from "../../data/items/itemsDB";

export const CATEGORIES = [
  { key: "all", label: "Все", test: () => true },
  { key: "weapon", label: "Оружие", test: (item: any) => {
    // Перевіряємо стандартний слот зброї
    if (item.slot === "weapon") return true;
    // Перевіряємо слот lrhand (дворучна зброя, включаючи удочки)
    if (item.slot === "lrhand") {
      const itemDef = itemsDB[item.id] || itemsDBWithStarter[item.id];
      return itemDef?.kind === "weapon";
    }
    return false;
  }},
  { key: "armor", label: "Броня", test: (item: any) => ["head", "armor", "legs", "gloves", "boots", "belt", "shield"].includes(item.slot) },
  { key: "bijou", label: "Биж", test: (item: any) => {
    const slot = item.slot || "";
    // Перевіряємо стандартні слоти
    if (["necklace", "earring", "earring_left", "earring_right", "ring", "ring_left", "ring_right", "jewelry", "tattoo"].includes(slot)) {
      return true;
    }
    // Перевіряємо XML формат слотів (rear;lear для earring, rfinger;lfinger для ring)
    if (slot.includes("rear") || slot.includes("lear") || slot === "rear;lear") {
      return true; // earring
    }
    if (slot.includes("rfinger") || slot.includes("lfinger") || slot === "rfinger;lfinger") {
      return true; // ring
    }
    return false;
  }},
  { key: "consumable", label: "Расходники", test: (item: any) => item.slot === "consumable" },
  { key: "resource", label: "Рес", test: (item: any) => item.slot === "resource" },
  { key: "recipe", label: "Рецепты", test: (item: any) => item.slot === "recipe" },
  { key: "quest", label: "Квест", test: (item: any) => item.slot === "quest" },
  { key: "book", label: "Книги", test: (item: any) => item.slot === "book" },
];

interface InventoryFiltersProps {
  currentCategory: string;
  onCategoryChange: (category: string) => void;
}

export default function InventoryFilters({
  currentCategory,
  onCategoryChange,
}: InventoryFiltersProps) {
  // Розділяємо таби на 2 ряди
  const firstRow = CATEGORIES.slice(0, 5); // Перші 5 табів
  const secondRow = CATEGORIES.slice(5); // Решта табів

  return (
    <div className="flex flex-col gap-1 mb-3 text-[10px] border-b border-[#5a4424] pb-1" style={{ color: "#d9d9d9" }}>
      {/* Перший ряд */}
      <div className="flex items-center gap-0">
        {firstRow.map((cat, idx) => (
          <React.Fragment key={cat.key}>
            <button
              onClick={() => onCategoryChange(cat.key)}
              className={`px-1.5 py-0.5 ${
                currentCategory === cat.key
                  ? "text-[#b8860b] font-semibold"
                  : "text-[#d9d9d9] hover:text-[#f5d7a1]"
              }`}
            >
              {cat.label}
            </button>
            {idx < firstRow.length - 1 && (
              <span className="text-[#5a4424] mx-0.5">|</span>
            )}
          </React.Fragment>
        ))}
      </div>
      {/* Другий ряд */}
      <div className="flex items-center gap-0">
        {secondRow.map((cat, idx) => (
          <React.Fragment key={cat.key}>
            <button
              onClick={() => onCategoryChange(cat.key)}
              className={`px-1.5 py-0.5 ${
                currentCategory === cat.key
                  ? "text-[#b8860b] font-semibold"
                  : "text-[#d9d9d9] hover:text-[#f5d7a1]"
              }`}
            >
              {cat.label}
            </button>
            {idx < secondRow.length - 1 && (
              <span className="text-[#5a4424] mx-0.5">|</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}






