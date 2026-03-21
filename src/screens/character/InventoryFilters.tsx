import React from "react";
import { itemsDB, itemsDBWithStarter } from "../../data/items/itemsDB";

/** Розширені ключі для пошуку в itemsDB (shop_, quest_ і т.д. можуть не знаходитися напряму) */
function resolveLookupIds(item: any): string[] {
  const ids: string[] = [];
  const id = item?.id || item?.itemId;
  if (id) ids.push(String(id));
  if (item?.itemId && typeof item.itemId === "string") ids.push(item.itemId);
  // shop_armor_d_stockings_of_knowledge -> спробувати stockings_of_knowledge
  if (typeof id === "string" && id.startsWith("shop_")) {
    const match = id.match(/^shop_(?:weapon|armor|shield|jewelry)_[a-z]+_(.+)$/);
    if (match) ids.push(match[1].trim());
  }
  // quest_shop_* -> спробувати без префіксу
  if (typeof id === "string" && id.startsWith("quest_shop_")) {
    ids.push(id.replace(/^quest_shop_/, ""));
  }
  return [...new Set(ids)];
}

function getItemSlotAndKind(item: any): { slot: string; kind: string } {
  const ids = resolveLookupIds(item);
  let itemDef = null;
  for (const lookupId of ids) {
    itemDef = itemsDB[lookupId] || itemsDBWithStarter[lookupId];
    if (itemDef) break;
  }
  // Пріоритет itemsDB — надійніше для категорій, ніж slot/kind з інвентаря
  let slot = itemDef?.slot ?? item?.slot ?? "";
  let kind = itemDef?.kind ?? item?.kind ?? "";
  // Fallback: визначити з id за префіксом, якщо itemsDB не знайшов
  const itemIdStr = (item?.id || item?.itemId)?.toString?.();
  if (!slot && !kind && typeof itemIdStr === "string") {
    if (itemIdStr.startsWith("shop_armor") || itemIdStr.includes("_armor_") || itemIdStr.includes("stockings") || itemIdStr.includes("gauntlets") || itemIdStr.includes("helmet") || itemIdStr.includes("boots")) {
      kind = "armor";
      slot = "armor";
    } else if (itemIdStr.startsWith("shop_weapon") || itemIdStr.includes("_weapon_")) {
      kind = "weapon";
      slot = "weapon";
    } else if (itemIdStr.startsWith("shop_shield")) {
      kind = "shield";
      slot = "shield";
    } else if (itemIdStr.startsWith("shop_jewelry") || itemIdStr.includes("ring") || itemIdStr.includes("earring") || itemIdStr.includes("necklace")) {
      kind = "jewelry";
      slot = "ring";
    }
  }
  return { slot, kind };
}

function getItemDef(item: any) {
  for (const id of resolveLookupIds(item)) {
    const def = itemsDB[id] || itemsDBWithStarter[id];
    if (def) return def;
  }
  return null;
}

export const CATEGORIES = [
  { key: "all", label: "Все", test: () => true },
  { key: "weapon", label: "Оружие", test: (item: any) => {
    const { slot, kind } = getItemSlotAndKind(item);
    if (slot === "weapon" || kind === "weapon") return true;
    if (slot === "lrhand") return getItemDef(item)?.kind === "weapon";
    return false;
  }},
  { key: "armor", label: "Броня", test: (item: any) => {
    const { slot, kind } = getItemSlotAndKind(item);
    const armorSlots = ["head", "armor", "chest", "legs", "gloves", "boots", "belt", "shield"];
    const armorKinds = ["armor", "helmet", "boots", "gloves", "shield", "belt"];
    if (armorSlots.includes(slot) || armorKinds.includes(kind)) return true;
    if (slot === "lhand") return getItemDef(item)?.kind === "shield";
    return false;
  }},
  { key: "bijou", label: "Биж", test: (item: any) => {
    const { slot, kind } = getItemSlotAndKind(item);
    const jewelrySlots = ["necklace", "earring", "earring_left", "earring_right", "ring", "ring_left", "ring_right", "jewelry", "tattoo"];
    if (jewelrySlots.includes(slot)) return true;
    if (slot?.includes("rear") || slot?.includes("lear") || slot === "rear;lear") return true;
    if (slot?.includes("rfinger") || slot?.includes("lfinger") || slot === "rfinger;lfinger") return true;
    const defKind = kind || getItemDef(item)?.kind || "";
    return ["necklace", "ring", "earring", "jewelry", "cloak"].includes(defKind);
  }},
  { key: "enchantment", label: "Заточки", test: (item: any) => {
    const id = String(item?.id || item?.itemId || "");
    return (
      id.includes("enchant_weapon_scroll") ||
      id.includes("enchant_armor_scroll") ||
      id.includes("blessed_scroll_enchant")
    );
  }},
  { key: "consumable", label: "Расходники", test: (item: any) => {
    const { slot } = getItemSlotAndKind(item);
    const id = item?.id || item?.itemId;
    if (slot === "consumable") return true;
    if (id === "treasure_box") return true;
    if (typeof id === "string" && id.startsWith("fish_")) return true;
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
  /** Теплий L2-стиль (як Місто / Персонаж) */
  isL2?: boolean;
}

export default function InventoryFilters({
  currentCategory,
  currentGrade,
  onCategoryChange,
  onGradeChange,
  isL2 = false,
}: InventoryFiltersProps) {
  const firstRow = CATEGORIES.slice(0, 5);
  const secondRow = CATEGORIES.slice(5);
  const showGradeSub = GRADE_CATEGORIES.includes(currentCategory);

  const active = isL2 ? "text-[#e8c56e] font-semibold" : "text-[#b8860b] font-semibold";
  const idle = isL2 ? "text-[#a89878] hover:text-[#f4e2b8]" : "text-[#d9d9d9] hover:text-[#f5d7a1]";
  const sep = isL2 ? "text-[#5c4a32]/80" : "text-[#5a4424]";
  const borderB = isL2 ? "border-b border-[#5c4a32]/40 pb-2" : "border-b border-white/50 pb-1";
  const subBorder = isL2 ? "border-t border-[#5c4a32]/35" : "border-t border-white/20";
  const gradeIdle = isL2 ? "text-[#8a7a60] hover:text-[#d4c4a8]" : "text-[#9a9a9a] hover:text-[#d9d9d9]";

  return (
    <div
      className={
        isL2
          ? "flex flex-col gap-1.5 mb-3 text-[10px] rounded-lg border border-[#5c4a32]/45 bg-black/22 p-2 shadow-[inset_0_1px_0_rgba(199,173,128,0.06)]"
          : `flex flex-col gap-1 mb-3 text-[10px] ${borderB}`
      }
      style={isL2 ? { color: "#d4c4a8" } : { color: "#d9d9d9" }}
    >
      {/* Перший ряд */}
      <div className="flex flex-wrap items-center gap-0">
        {firstRow.map((cat, idx) => (
          <React.Fragment key={cat.key}>
            <button
              type="button"
              onClick={() => onCategoryChange(cat.key)}
              className={`px-1.5 py-0.5 rounded-sm transition-colors ${
                currentCategory === cat.key ? active : idle
              }`}
            >
              {cat.label}
            </button>
            {idx < firstRow.length - 1 && (
              <span className={`${sep} mx-0.5`}>|</span>
            )}
          </React.Fragment>
        ))}
      </div>
      {/* Другий ряд */}
      <div className="flex flex-wrap items-center gap-0">
        {secondRow.map((cat, idx) => (
          <React.Fragment key={cat.key}>
            <button
              type="button"
              onClick={() => onCategoryChange(cat.key)}
              className={`px-1.5 py-0.5 rounded-sm transition-colors ${
                currentCategory === cat.key ? active : idle
              }`}
            >
              {cat.label}
            </button>
            {idx < secondRow.length - 1 && (
              <span className={`${sep} mx-0.5`}>|</span>
            )}
          </React.Fragment>
        ))}
      </div>
      {/* Підкатегорії ng d c b a s для Оружие, Броня, Биж */}
      {showGradeSub && (
        <div className={`flex flex-wrap items-center gap-0 mt-1 pt-1 ${subBorder}`}>
          {GRADE_KEYS.map((g, idx) => (
            <React.Fragment key={g}>
              <button
                type="button"
                onClick={() => onGradeChange(currentGrade === g ? "" : g)}
                className={`px-1.5 py-0.5 rounded-sm transition-colors ${
                  currentGrade === g ? active : gradeIdle
                }`}
              >
                {g.toUpperCase()}
              </button>
              {idx < GRADE_KEYS.length - 1 && (
                <span className={`${sep} mx-0.5`}>|</span>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}






