import React, { useMemo, useState } from "react";
import { INVENTORY_MAX_ITEMS, useHeroStore } from "../state/heroStore";
import { itemsDB } from "../data/items/itemsDB";

type InventoryPanelProps = {
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  maxWidth?: string;
  framed?: boolean;
};

type InvItem = {
  id: string;
  name: string;
  slot: string;
  icon: string;
  description: string;
  stats?: Record<string, any>;
  count?: number;
  kind?: string;
  type: string;
};

const armorSlots = new Set(["head", "armor", "legs", "gloves", "boots", "belt", "cloak"]);
const jewelrySlots = new Set([
  "jewelry",
  "necklace",
  "earring_left",
  "earring_right",
  "ring_left",
  "ring_right",
  "tattoo",
]);

const categories: { key: string; label: string; test: (item: InvItem) => boolean }[] = [
  { key: "all", label: "Р’СЃРµ", test: () => true },
  { key: "weapon", label: "РћСЂСѓР¶РёРµ", test: (i) => i.slot === "weapon" },
  { key: "armor", label: "Р‘СЂРѕРЅСЏ", test: (i) => armorSlots.has(i.slot) },
  { key: "jewelry", label: "Р‘РёР¶", test: (i) => jewelrySlots.has(i.slot) },
  { key: "consumable", label: "Р Р°СЃС…РѕРґ", test: (i) => i.slot === "consumable" },
  { key: "resource", label: "Р РµСЃ", test: (i) => i.slot === "resource" },
  { key: "recipe", label: "Р РµС†РµРїС‚С‹", test: (i) => i.slot === "recipe" },
  { key: "quest", label: "РљРІРµСЃС‚", test: (i) => i.slot === "quest" },
  { key: "book", label: "РљРЅРёРіРё", test: (i) => i.slot === "book" },
];

const isEquipable = (slot: string) =>
  armorSlots.has(slot) ||
  jewelrySlots.has(slot) ||
  ["weapon", "shield"].includes(slot);

const formatActionLabel = (slot: string) => {
  if (slot === "consumable" || slot === "resource" || slot === "quest" || slot === "book") {
    return "[РСЃРїРѕР»СЊР·РѕРІР°С‚СЊ]";
  }
  if (isEquipable(slot)) return "[РќР°РґРµС‚СЊ]";
  return "[РСЃРїРѕР»СЊР·РѕРІР°С‚СЊ]";
};

export default function InventoryPanel({
  title = "РРЅРІРµРЅС‚Р°СЂСЊ",
  showBackButton = false,
  onBack,
  maxWidth = "min(96vw, 520px)",
  framed = true,
}: InventoryPanelProps) {
  const hero = useHeroStore((s) => s.hero);
  const equipItem = useHeroStore((s) => s.equipItem);
  const updateHero = useHeroStore((s) => s.updateHero);

  const [activeCat, setActiveCat] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<InvItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // 🔥 НЕ викликати loadHero() тут — воно перезаписує store з localStorage і дає миттєвий відкат
  // після вбивства моба (store оновлений, save ще async/429, loadHero() читає старий localStorage → set(hero) → відкат).
  // Герой вже завантажений при ініціалізації App.

  const items = useMemo(() => {
    if (!hero?.inventory) return [];
    const cat = categories.find((c) => c.key === activeCat) || categories[0];
    return hero.inventory.filter((i: any) => i && cat.test(i));
  }, [hero, activeCat]);

  const itemsUsed = hero?.inventory?.filter(Boolean).length ?? 0;

  const handleEquip = () => {
    if (!hero || !selectedItem) return;
    if (!isEquipable(selectedItem.slot)) {
      alert("Р­С‚РѕС‚ РїСЂРµРґРјРµС‚ РЅРµР»СЊР·СЏ СЌРєРёРїРёСЂРѕРІР°С‚СЊ");
      return;
    }
    equipItem(selectedItem);
    setSelectedItem(null);
  };

  const handleDeleteItem = () => {
    if (!hero || !selectedItem) return;
    const idx = hero.inventory.findIndex((i: any) => i.id === selectedItem.id);
    if (idx === -1) return;

    const current = hero.inventory[idx];
    const updatedInventory = [...hero.inventory];

    if (typeof current.count === "number" && current.count > 1) {
      updatedInventory[idx] = { ...current, count: current.count - 1 };
    } else {
      updatedInventory.splice(idx, 1);
    }

    updateHero({ inventory: updatedInventory });
    setConfirmDelete(false);
    setSelectedItem(null);
  };

  if (!hero) {
    return (
      <div
        className="rounded-xl border-2 p-3 text-center text-white"
        style={{ width: maxWidth, backgroundColor: "#141414", borderColor: "rgba(255,255,255,0.5)" }}
      >
        Р—Р°РіСЂСѓР·РєР°...
      </div>
    );
  }

  return (
    <div
      className={`${framed ? "rounded-xl border-2" : ""} p-3 flex flex-col items-center relative`}
      style={{
        width: maxWidth,
        backgroundColor: framed ? "#141414" : "transparent",
        borderColor: framed ? "#5b4726" : "transparent",
      }}
    >
      {showBackButton && (
        <button
          onClick={onBack}
          className="absolute top-2 right-2 bg-red-600 text-white text-[11px] px-3 py-[3px] rounded-md"
        >
          РќР°Р·Р°Рґ
        </button>
      )}

      <div className="w-full flex flex-col gap-1 mb-3">
        <div className="text-center font-bold text-yellow-400 text-base">{title}</div>
        <div className="flex justify-between text-[12px] text-[#d9caa3]">
          <span>РџСЂРµРґРјРµС‚РѕРІ: {itemsUsed}/{INVENTORY_MAX_ITEMS}</span>
          <span>РђРґРµРЅР°: {hero.adena ?? 0}</span>
        </div>
      </div>

      <div className="w-full text-[12px] text-[#d9caa3] mb-2 flex flex-wrap gap-2 justify-start">
        {categories.map((cat) => (
          <button
            key={cat.key}
            className="px-2 py-1 rounded-sm border border-white/40"
            style={{
              backgroundColor: activeCat === cat.key ? "#2a1f14" : "transparent",
              color: activeCat === cat.key ? "#f5d7a1" : "#e7e0d0",
            }}
            onClick={() => setActiveCat(cat.key)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="w-full bg-[#0f0c08] border-y border-white/40 rounded-none overflow-hidden">
        {items.length === 0 ? (
          <div className="text-center text-gray-400 py-3 text-[13px]">РџСѓСЃС‚Рѕ</div>
        ) : (
          items.map((invItem: any, idx: number) => (
            <div key={`${invItem.id}-${idx}`}>
              <div
                className="flex items-center gap-2 px-2 py-2 hover:bg-[#1c150d] cursor-pointer"
                onClick={() => setSelectedItem(invItem)}
              >
                <img
                  src={invItem.icon || itemsDB[invItem.id]?.icon || "/items/drops/Weapon_squires_sword_i00_0.jpg"}
                  alt={invItem.name}
                  className="w-7 h-7 border border-white/50 bg-black/40 object-contain"
                  onError={(e) => {
                    // Якщо іконка не завантажилась, спробуємо отримати з itemsDB
                    const itemDef = itemsDB[invItem.id];
                    if (itemDef?.icon && (e.target as HTMLImageElement).src !== itemDef.icon) {
                      (e.target as HTMLImageElement).src = itemDef.icon;
                    } else {
                      // Якщо і в itemsDB немає, використовуємо дефолтну
                      (e.target as HTMLImageElement).src = "/items/drops/Weapon_squires_sword_i00_0.jpg";
                    }
                  }}
                />
                <div className="flex-1">
                  <div className="text-[13px] text-[#f5d7a1] leading-tight">
                    {invItem.name}
                    {!invItem.name.includes("(NG)") && !invItem.name.includes("(D)") && !invItem.name.includes("(C)") && !invItem.name.includes("(B)") && !invItem.name.includes("(A)") && !invItem.name.includes("(S)") && invItem.grade && (
                      <span className="text-[11px] text-[#9ca3af] ml-1">({invItem.grade})</span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#c0b084]">{formatActionLabel(invItem.slot)}</div>
                </div>
                {invItem.count && invItem.count > 1 && (
                  <div className="text-[11px] text-gray-300">x{invItem.count}</div>
                )}
              </div>
              {idx < items.length - 1 && <div className="w-full h-[1px] bg-white/20"></div>}
            </div>
          ))
        )}
      </div>

      {selectedItem && !confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div
            className="bg-[#1a1208] border border-white/50 rounded-lg p-4 text-center"
            style={{ width: "260px" }}
          >
            <img
              src={selectedItem.icon || itemsDB[selectedItem.id]?.icon || "/items/drops/Weapon_squires_sword_i00_0.jpg"}
              alt={selectedItem.name}
              className="w-12 h-12 mx-auto mb-2"
              onError={(e) => {
                const itemDef = itemsDB[selectedItem.id];
                if (itemDef?.icon && (e.target as HTMLImageElement).src !== itemDef.icon) {
                  (e.target as HTMLImageElement).src = itemDef.icon;
                } else {
                  (e.target as HTMLImageElement).src = "/items/drops/Weapon_squires_sword_i00_0.jpg";
                }
              }}
            />

            <div className="text-yellow-400 font-bold text-sm mb-1">
              {selectedItem.name}
            </div>

            {selectedItem.stats && (
              <div className="text-white text-[11px] mb-2">
                {(Object.entries(selectedItem.stats) as [string, any][]).map(
                  ([key, value]) => (
                    <div key={key}>
                      {key}: {String(value)}
                    </div>
                  )
                )}
              </div>
            )}

            {selectedItem.count && selectedItem.count > 1 && (
              <div className="text-gray-300 text-[11px] mb-2">
                РљРѕР»РёС‡РµСЃС‚РІРѕ: {selectedItem.count}
              </div>
            )}

            <div className="flex flex-col gap-1 mt-2">
              <button
                className="bg-green-700 text-white text-[11px] py-1 rounded"
                onClick={handleEquip}
              >
                РћРґРµС‚СЊ
              </button>
              <button className="bg-blue-700 text-white text-[11px] py-1 rounded">
                РСЃРїРѕР»СЊР·РѕРІР°С‚СЊ
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="bg-red-700 text-white text-[11px] py-1 rounded"
              >
                РЈРґР°Р»РёС‚СЊ
              </button>
              <button
                onClick={() => setSelectedItem(null)}
                className="bg-gray-600 text-white text-[11px] py-1 rounded"
              >
                Р—Р°РєСЂС‹С‚СЊ
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div
            className="bg-[#1a1208] border border-white/50 rounded-lg p-4 text-center"
            style={{ width: "230px" }}
          >
            <div className="text-yellow-400 font-bold text-sm mb-3">
              РЈРґР°Р»РёС‚СЊ РїСЂРµРґРјРµС‚?
            </div>

            <div className="flex justify-center gap-2">
              <button
                className="bg-red-700 text-white text-[11px] py-1 px-3 rounded"
                onClick={handleDeleteItem}
              >
                Р”Р°
              </button>

              <button
                className="bg-gray-600 text-white text-[11px] py-1 px-3 rounded"
                onClick={() => setConfirmDelete(false)}
              >
                РќРµС‚
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

