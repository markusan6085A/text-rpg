import React, { useState, useMemo, useEffect } from "react";
import { adminFindPlayerByName, adminGiveItem, adminTakeItem } from "../../utils/api";
import { itemsDB } from "../../data/items/itemsDB";

const style = { color: "#c7ad80" };

const CATEGORY_LABELS: Record<string, string> = {
  weapon: "Оружие",
  armor: "Броня",
  helmet: "Броня",
  gloves: "Броня",
  boots: "Броня",
  shield: "Броня",
  jewel: "Биж",
  quest: "Материалы",
  material: "Материалы",
  consumable: "Расходники",
  other: "Інше",
};

function getCategory(kind: string): string {
  return CATEGORY_LABELS[kind] || CATEGORY_LABELS.other || "Інше";
}

function getItemIcon(icon: string | undefined): string {
  if (!icon) return "/items/drops/Weapon_squires_sword_i00_0.jpg";
  return icon.startsWith("/") ? icon : `/items/${icon}`;
}

interface AdminSectionItemsProps {
  navigate: (path: string) => void;
}

export function AdminSectionItems({ navigate }: AdminSectionItemsProps) {
  const [nick, setNick] = useState("");
  const [itemId, setItemId] = useState("");
  const [qty, setQty] = useState("1");
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("adminSelectedItemId");
      if (saved) {
        setItemId(saved);
        sessionStorage.removeItem("adminSelectedItemId");
      }
    } catch (_) {}
  }, []);

  const itemsByCategory = useMemo(() => {
    const map: Record<string, Array<{ id: string; name: string; grade?: string; icon?: string }>> = {};
    for (const [id, def] of Object.entries(itemsDB)) {
      const cat = getCategory(def.kind || def.slot || "other");
      if (!map[cat]) map[cat] = [];
      map[cat].push({ id, name: def.name, grade: def.grade, icon: def.icon });
    }
    for (const arr of Object.values(map)) arr.sort((a, b) => (a.grade || "").localeCompare(b.grade || "") || a.name.localeCompare(b.name));
    return map;
  }, []);

  const handleGive = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const num = Math.max(1, Math.min(999, Math.floor(Number(qty))));
    if (!nick.trim() || !itemId.trim()) {
      setMessage("Введіть нік та id предмета");
      return;
    }
    setLoading(true);
    try {
      const { character } = await adminFindPlayerByName(nick.trim());
      await adminGiveItem(character.id, itemId.trim(), num);
      setMessage(`Видано: ${itemId} x${num}`);
    } catch (err: any) {
      setMessage(err?.message || "Помилка");
    } finally {
      setLoading(false);
    }
  };

  const handleTake = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const num = Math.max(1, Math.floor(Number(qty)));
    if (!nick.trim() || !itemId.trim()) {
      setMessage("Введіть нік та id предмета");
      return;
    }
    setLoading(true);
    try {
      const { character } = await adminFindPlayerByName(nick.trim());
      await adminTakeItem(character.id, itemId.trim(), num);
      setMessage(`Забрано: ${itemId} x${num}`);
    } catch (err: any) {
      setMessage(err?.message || "Помилка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="border-b border-[#c7ad80]/30 pb-4 mb-4">
      <h2 className="text-lg font-semibold mb-2" style={style}>Видати предмет / Забрати предмет</h2>
      <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-2">
        <input
          type="text"
          value={nick}
          onChange={(e) => setNick(e.target.value)}
          placeholder="Нік гравця"
          className="w-full px-3 py-2 rounded bg-black/40 border border-[#c7ad80]/40 text-white placeholder-gray-500"
        />
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="text"
            value={itemId}
            onChange={(e) => setItemId(e.target.value)}
            placeholder="ID предмета (наприклад shadow_helm)"
            className="flex-1 min-w-[140px] px-3 py-2 rounded bg-black/40 border border-[#c7ad80]/40 text-white placeholder-gray-500"
          />
          <button
            type="button"
            onClick={() => navigate("/admin/items")}
            className="px-3 py-2 rounded bg-[#c7ad80]/20 border border-[#c7ad80]/60 text-[#c7ad80] text-sm whitespace-nowrap"
          >
            Відкрити вибір предметів
          </button>
          <button
            type="button"
            onClick={() => setShowPicker((s) => !s)}
            className="px-3 py-2 rounded bg-[#c7ad80]/10 border border-[#c7ad80]/40 text-[#c7ad80] text-sm whitespace-nowrap"
          >
            {showPicker ? "Сховати список" : "Список тут"}
          </button>
        </div>
        {showPicker && (
          <div className="max-h-64 overflow-y-auto rounded bg-black/40 border border-[#c7ad80]/30 p-2 text-sm">
            {Object.entries(itemsByCategory).map(([cat, list]) => (
              <div key={cat} className="mb-2">
                <div className="font-semibold mb-1" style={style}>{cat}</div>
                <div className="flex flex-wrap gap-1">
                  {list.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setItemId(item.id)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#c7ad80]/10 border border-[#c7ad80]/30 text-gray-300 hover:bg-[#c7ad80]/20 text-xs"
                      title={item.name}
                    >
                      <img
                        src={getItemIcon(item.icon)}
                        alt=""
                        className="w-4 h-4 object-contain flex-shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).src = "/items/drops/Weapon_squires_sword_i00_0.jpg"; }}
                      />
                      <span className="truncate max-w-[100px]">{item.id}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        <input
          type="number"
          min={1}
          max={999}
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          placeholder="Кількість"
          className="w-full px-3 py-2 rounded bg-black/40 border border-[#c7ad80]/40 text-white"
        />
        <div className="flex gap-2">
          <button type="button" onClick={handleGive} disabled={loading} className="px-4 py-2 rounded bg-green-900/40 border border-green-500/60 text-green-300 hover:bg-green-900/60 disabled:opacity-50">
            Видати
          </button>
          <button type="button" onClick={handleTake} disabled={loading} className="px-4 py-2 rounded bg-red-900/40 border border-red-500/60 text-red-300 hover:bg-red-900/60 disabled:opacity-50">
            Забрати
          </button>
        </div>
      </form>
      {message && <p className="mt-2 text-sm text-gray-400">{message}</p>}
    </section>
  );
}
