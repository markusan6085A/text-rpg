import React from "react";
import { itemsDB, itemsDBWithStarter } from "../../data/items/itemsDB";

function getItemSlotAndKind(item: any): { slot: string; kind: string } {
  const itemDef = itemsDB[item?.id] || itemsDBWithStarter[item?.id];
  return {
    slot: item?.slot ?? itemDef?.slot ?? "",
    kind: item?.kind ?? itemDef?.kind ?? "",
  };
}

export const CATEGORIES = [
  { key: "all", label: "Все", test: () => true },
  { key: "weapon", label: "Оружие", test: (item: any) => {
    const { slot, kind } = getItemSlotAndKind(item);
    if (slot === "weapon" || kind === "weapon") return true;
    if (slot === "lrhand") {
      const itemDef = itemsDB[item.id] || itemsDBWithStarter[item.id];
      return itemDef?.kind === "weapon";
    }
    return false;
  }},
  { key: "armor", label: "Броня", test: (item: any) => {
    const { slot, kind } = getItemSlotAndKind(item);
    const armorSlots = ["head", "armor", "legs", "gloves", "boots", "belt", "shield"];
    const armorKinds = ["armor", "helmet", "boots", "gloves", "shield", "belt"];
    if (armorSlots.includes(slot) || armorKinds.includes(kind)) return true;
    if (slot === "lhand") {
      const itemDef = itemsDB[item.id] || itemsDBWithStarter[item.id];
      return itemDef?.kind === "shield";
    }
    return false;
  }},
  { key: "bijou", label: "Биж", test: (item: any) => {
    const { slot } = getItemSlotAndKind(item);
    const jewelrySlots = ["necklace", "earring", "earring_left", "earring_right", "ring", "ring_left", "ring_right", "jewelry", "tattoo"];
    if (jewelrySlots.includes(slot)) return true;
    if (slot.includes("rear") || slot.includes("lear") || slot === "rear;lear") return true;
    if (slot.includes("rfinger") || slot.includes("lfinger") || slot === "rfinger;lfinger") return true;
    const itemDef = itemsDB[item.id] || itemsDBWithStarter[item.id];
    return ["necklace", "ring", "earring", "jewelry", "cloak"].includes(itemDef?.kind || "");
  }},
  { key: "enchantment", label: "Заточки", test: (item: any) => {
    const id = item.id || "";
    return (
      id.includes("enchant_weapon_scroll") ||
      id.includes("enchant_armor_scroll") ||
      id.includes("blessed_scroll_enchant")
    );
  }},
  { key: "consumable", label: "Расходники", test: (item: any) => {
    const { slot } = getItemSlotAndKind(item);
    if (slot === "consumable") return true;
    if (item.id === "treasure_box") return true;
    if (typeof item.id === "string" && item.id.startsWith("fish_")) return true;
    return false;
  }},
  { key: "resource", label: "Рес", test: (item: any) => {
    const { slot } = getItemSlotAndKind(item);
    return slot === "resource";
  }},
  { key: "recipe", label: "Рецепты", test: (item: any) => {
    const { slot } = getItemSlotAndKind(item);
    return slot === "recipe";
  }},
  { key: "quest", label: "Квест", test: (item: any) => {
    const { slot } = getItemSlotAndKind(item);
    return slot === "quest";
  }},
  { key: "book", label: "Книги", test: (item: any) => {
    const { slot } = getItemSlotAndKind(item);
    return slot === "book";
  }},
];

const GRADE_KEYS = ["ng", "d", "c", "b", "a", "s"] as const;
const GRADE_CATEGORIES = ["weapon", "armor", "bijou", "enchantment"];

interface InventoryFiltersProps {
  currentCategory: string;
  currentGrade: string;
  onCategoryChange: (category: string) => void;
  onGradeChange: (grade: string) => void;
}

export default function InventoryFilters({
  currentCategory,
  currentGrade,
  onCategoryChange,
  onGradeChange,
}: InventoryFiltersProps) {
  const firstRow = CATEGORIES.slice(0, 5);
  const secondRow = CATEGORIES.slice(5);
  const showGradeSub = GRADE_CATEGORIES.includes(currentCategory);

  return (
    <div className="flex flex-col gap-1 mb-3 text-[10px] border-b border-white/50 pb-1" style={{ color: "#d9d9d9" }}>
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
      {/* Підкатегорії ng d c b a s для Оружие, Броня, Биж */}
      {showGradeSub && (
        <div className="flex items-center gap-0 mt-1 pt-1 border-t border-white/20">
          {GRADE_KEYS.map((g, idx) => (
            <React.Fragment key={g}>
              <button
                onClick={() => onGradeChange(currentGrade === g ? "" : g)}
                className={`px-1.5 py-0.5 ${
                  currentGrade === g
                    ? "text-[#b8860b] font-semibold"
                    : "text-[#9a9a9a] hover:text-[#d9d9d9]"
                }`}
              >
                {g.toUpperCase()}
              </button>
              {idx < GRADE_KEYS.length - 1 && (
                <span className="text-[#5a4424] mx-0.5">|</span>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}






