import React, { useMemo, useState } from "react";
import { itemsDB } from "../../data/items/itemsDB";
import type { ItemDefinition } from "../../data/items/itemsDB.types";
import { adminItemPickerButtonClass, isAdminItemOnVendorLists } from "../../utils/adminItemSourceSets";
import { handleResourceIconError, normalizeIconPath } from "../../utils/itemIcon";

const style = { color: "#c7ad80" };

const CATEGORY_ORDER = [
  "Оружие",
  "Броня",
  "Биж",
  "Материалы",
  "Расходники",
  "Інше",
];

const CATEGORY_LABELS: Record<string, string> = {
  weapon: "Оружие",
  armor: "Броня",
  helmet: "Броня",
  gloves: "Броня",
  boots: "Броня",
  shield: "Броня",
  jewelry: "Биж",
  jewel: "Биж",
  ring: "Биж",
  earring: "Биж",
  necklace: "Биж",
  quest: "Материалы",
  material: "Материалы",
  resource: "Материалы",
  consumable: "Расходники",
  other: "Інше",
};

/** Предмети, які не можна видавати через адмінку (валюти, системні) */
const ADMIN_NO_GIVE_IDS = new Set([
  "adena", "coin_of_luck", "coins_silver", "ancient_adena",
  "overflow_chest", "current_character_id",
]);

const GRADE_ORDER = ["NG", "D", "C", "B", "A", "S"];

function getCategory(def: ItemDefinition): string {
  const k = def.kind || def.slot || "";
  return CATEGORY_LABELS[k] || CATEGORY_LABELS.other || "Інше";
}

function getItemIcon(def: ItemDefinition): string {
  const p = normalizeIconPath(def.icon);
  return p || "/items/drops/Weapon_squires_sword_i00_0.jpg";
}

interface AdminItemPickerPageProps {
  navigate: (path: string) => void;
}

export function AdminItemPickerPage({ navigate }: AdminItemPickerPageProps) {
  const [search, setSearch] = useState("");
  const [filterGrade, setFilterGrade] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  /** За замовчуванням лише вітрини (магазин + квест-шоп) — без риби/дропів поза продажем */
  const [showEntireItemsDb, setShowEntireItemsDb] = useState(false);

  const itemsByCategory = useMemo(() => {
    const map: Record<string, Array<{ id: string; def: ItemDefinition }>> = {};
    const searchLower = search.trim().toLowerCase();
    for (const [id, def] of Object.entries(itemsDB)) {
      if (ADMIN_NO_GIVE_IDS.has(id)) continue;
      if (!showEntireItemsDb && !isAdminItemOnVendorLists(id)) continue;
      if (!def?.name && !def?.id) continue;
      if (searchLower && !id.toLowerCase().includes(searchLower) && !(def.name || "").toLowerCase().includes(searchLower)) continue;
      if (filterGrade && (def.grade || "") !== filterGrade) continue;
      const cat = getCategory(def);
      if (filterCategory && cat !== filterCategory) continue;
      if (!map[cat]) map[cat] = [];
      map[cat].push({ id, def });
    }
    for (const arr of Object.values(map)) {
      arr.sort((a, b) => {
        const ga = GRADE_ORDER.indexOf(a.def.grade || "");
        const gb = GRADE_ORDER.indexOf(b.def.grade || "");
        if (ga !== gb) return ga - gb;
        return (a.def.name || a.id).localeCompare(b.def.name || b.id);
      });
    }
    return map;
  }, [search, filterGrade, filterCategory, showEntireItemsDb]);

  const categories = useMemo(() => {
    const list = Object.keys(itemsByCategory);
    list.sort((a, b) => {
      const ia = CATEGORY_ORDER.indexOf(a);
      const ib = CATEGORY_ORDER.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.localeCompare(b);
    });
    return list;
  }, [itemsByCategory]);

  const handleSelect = (id: string) => {
    try {
      sessionStorage.setItem("adminSelectedItemId", id);
    } catch (_) {}
    navigate("/admin");
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-[#c7ad80] p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4 border-b border-[#c7ad80]/40 pb-4">
          <h1 className="text-xl font-bold" style={style}>
            Вибір предмета
          </h1>
          <button
            type="button"
            onClick={() => navigate("/admin")}
            className="px-4 py-2 rounded bg-[#c7ad80]/20 border border-[#c7ad80]/60 hover:bg-[#c7ad80]/30"
          >
            Назад в адмінку
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <label className="flex items-center gap-2 text-[11px] text-gray-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showEntireItemsDb}
              onChange={(e) => setShowEntireItemsDb(e.target.checked)}
              className="rounded border-[#c7ad80]/50 bg-black/40"
            />
            Показати весь itemsDB (дропи, риба, ресурси поза вітринами)
          </label>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Пошук за назвою або ID..."
            className="flex-1 min-w-[200px] px-3 py-2 rounded bg-black/40 border border-[#c7ad80]/40 text-white placeholder-gray-500"
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 rounded bg-black/40 border border-[#c7ad80]/40 text-[#c7ad80]"
          >
            <option value="">Всі категорії</option>
            {CATEGORY_ORDER.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={filterGrade}
            onChange={(e) => setFilterGrade(e.target.value)}
            className="px-3 py-2 rounded bg-black/40 border border-[#c7ad80]/40 text-[#c7ad80]"
          >
            <option value="">Всі грейди</option>
            {GRADE_ORDER.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <div className="space-y-6 max-h-[calc(100vh-220px)] overflow-y-auto">
          {categories.map((cat) => (
            <div key={cat} className="rounded bg-black/30 border border-[#c7ad80]/20 p-3">
              <h2 className="text-base font-semibold mb-3 pb-2 border-b border-[#c7ad80]/30" style={style}>
                {cat}
              </h2>
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {itemsByCategory[cat].map(({ id, def }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleSelect(id)}
                    className={adminItemPickerButtonClass()}
                    title={`${def.name}${def.grade ? ` (${def.grade})` : ""}`}
                  >
                    <img
                      src={getItemIcon(def)}
                      alt={def.name}
                      className="w-10 h-10 object-contain mb-1"
                      onError={handleResourceIconError}
                    />
                    <span className="text-[10px] text-gray-400 truncate w-full text-center" title={id}>
                      {def.name || id}
                    </span>
                    {def.grade && (
                      <span className="text-[9px] text-[#c7ad80]/80">{def.grade}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
