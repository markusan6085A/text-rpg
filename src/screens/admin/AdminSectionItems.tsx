import React, { useState, useMemo, useEffect } from "react";
import { adminFindPlayerByName, adminGiveItem, adminTakeItem, adminGetPlayerInventory } from "../../utils/api";
import { itemsDB } from "../../data/items/itemsDB";
import { useCharacterStore } from "../../state/characterStore";
import { useHeroStore } from "../../state/heroStore";
import { loadHeroFromAPI } from "../../state/heroStore/heroLoadAPI";

const style = { color: "#c7ad80" };

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

const ADMIN_NO_GIVE_IDS = new Set([
  "adena", "coin_of_luck", "coins_silver", "ancient_adena",
  "overflow_chest", "current_character_id",
]);

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
  const [showPlayerInv, setShowPlayerInv] = useState(false);
  const [playerInv, setPlayerInv] = useState<any[]>([]);
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
      if (ADMIN_NO_GIVE_IDS.has(id)) continue;
      if (!def?.name && !def?.id) continue;
      const cat = getCategory(def.kind || def.slot || "other");
      if (!map[cat]) map[cat] = [];
      map[cat].push({ id, name: def.name, grade: def.grade, icon: def.icon });
    }
    for (const arr of Object.values(map)) arr.sort((a, b) => (a.grade || "").localeCompare(b.grade || "") || a.name.localeCompare(b.name));
    return map;
  }, []);

  const playerInvByCategory = useMemo(() => {
    const map: Record<string, Array<{ id: string; name: string; count: number; icon?: string }>> = {};
    for (const item of playerInv) {
      if (!item) continue;
      const def = itemsDB[item.id || item.itemId];
      const cat = getCategory(def?.kind || def?.slot || item.type || "other");
      if (!map[cat]) map[cat] = [];
      map[cat].push({
        id: item.id || item.itemId,
        name: def?.name || item.name || item.id,
        count: item.count || 1,
        icon: def?.icon || item.icon,
      });
    }
    for (const arr of Object.values(map)) arr.sort((a, b) => a.name.localeCompare(b.name));
    return map;
  }, [playerInv]);

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
      const data = await adminFindPlayerByName(nick.trim());
      if (!data?.character?.id) {
        setMessage("Персонажа не знайдено");
        return;
      }
      const character = data.character;
      const def = itemsDB[itemId.trim()];
      const slot = def?.slot || def?.kind || "other";
      await adminGiveItem(character.id, itemId.trim(), num, slot);
      setMessage(`Видано: ${itemId} x${num}`);
      if (useCharacterStore.getState().characterId === character.id) {
        const loaded = await loadHeroFromAPI();
        if (loaded) useHeroStore.getState().setHero(loaded);
      }
      if (showPlayerInv) handleLoadInv(character.id).catch(() => {});
    } catch (err: any) {
      setMessage(err?.message || "Помилка");
    } finally {
      setLoading(false);
    }
  };

  const handleTake = async (e?: React.FormEvent, directItemId?: string, directQty?: number) => {
    if (e) e.preventDefault();
    setMessage(null);
    const targetItemId = directItemId || itemId.trim();
    const num = directQty ?? Math.max(1, Math.floor(Number(qty)));
    if (!nick.trim() || !targetItemId) {
      setMessage("Введіть нік та id предмета");
      return;
    }
    setLoading(true);
    try {
      const data = await adminFindPlayerByName(nick.trim());
      if (!data?.character?.id) {
        setMessage("Персонажа не знайдено");
        return;
      }
      await adminTakeItem(data.character.id, targetItemId, num);
      setMessage(`Забрано: ${targetItemId} x${num}`);
      if (showPlayerInv) handleLoadInv(data.character.id).catch(() => {});
    } catch (err: any) {
      setMessage(err?.message || "Помилка");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadInvBtn = async () => {
    if (!nick.trim()) {
      setMessage("Введіть нік гравця");
      return;
    }
    if (showPlayerInv) {
      setShowPlayerInv(false);
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const data = await adminFindPlayerByName(nick.trim());
      if (!data?.character?.id) {
        setMessage("Персонажа не знайдено");
        return;
      }
      await handleLoadInv(data.character.id);
      setShowPlayerInv(true);
      setShowPicker(false);
    } catch (err: any) {
      setMessage(err?.message || "Помилка");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadInv = async (characterId: string) => {
    const invData = await adminGetPlayerInventory(characterId);
    setPlayerInv(invData.inventory || []);
  };

  const inputCl = "text-sm py-1 px-2 rounded bg-black/40 border border-[#c7ad80]/30 text-white placeholder-gray-500 w-32";
  const btnCl = "text-sm py-1 px-2 rounded bg-[#c7ad80]/20 text-[#c7ad80] hover:bg-[#c7ad80]/30 disabled:opacity-50";
  const btnDanger = "text-sm py-1 px-2 rounded bg-red-900/40 text-red-300 hover:bg-red-900/60 disabled:opacity-50";
  const btnGreen = "text-sm py-1 px-2 rounded bg-green-900/40 text-green-300 hover:bg-green-900/60 disabled:opacity-50";

  return (
    <section className="border-t border-[#c7ad80]/30 pt-3 pb-3 first:border-t-0 first:pt-0">
      <h2 className="text-sm font-semibold mb-2" style={style}>Видати предмет / Забрати предмет</h2>
      <p className="text-xs text-gray-500 mb-2">Выдача или изъятие предмета из инвентаря игрока. Выбор предмета — кнопка «Вибір предметів».</p>
      <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <input type="text" value={nick} onChange={(e) => setNick(e.target.value)} placeholder="Нік" className={inputCl} />
          <input type="text" value={itemId} onChange={(e) => setItemId(e.target.value)} placeholder="ID предмета" className={`${inputCl} w-40`} />
          <input type="number" min={1} max={999} value={qty} onChange={(e) => setQty(e.target.value)} placeholder="К-сть" className={`${inputCl} w-14`} />
          <button type="button" onClick={() => navigate("/admin/items")} className={btnCl}>Вибір предметів</button>
          <button type="button" onClick={() => { setShowPicker((s) => !s); setShowPlayerInv(false); }} className={btnCl}>{showPicker ? "Сховати предмети" : "Всі предмети"}</button>
          <button type="button" onClick={handleLoadInvBtn} className={btnCl}>{showPlayerInv ? "Сховати інвентар" : "Інвентар гравця"}</button>
          <button type="button" onClick={handleGive} disabled={loading} className={btnGreen}>Видати</button>
          <button type="button" onClick={(e) => handleTake(e)} disabled={loading} className={btnDanger}>Забрати</button>
        </div>
        {showPicker && (
          <div className="max-h-48 overflow-y-auto rounded bg-black/30 p-2 text-xs border border-[#c7ad80]/20">
            {Object.entries(itemsByCategory).map(([cat, list]) => (
              <div key={cat} className="mb-1.5">
                <div className="font-medium mb-0.5 text-[#c7ad80]" style={style}>{cat}</div>
                <div className="flex flex-wrap gap-0.5">
                  {list.map((item) => (
                    <button key={item.id} type="button" onClick={() => setItemId(item.id)} className="flex items-center gap-0.5 py-0.5 px-1 rounded bg-[#c7ad80]/10 text-gray-300 hover:bg-[#c7ad80]/20 text-xs" title={`${item.name}${item.grade ? ` (${item.grade})` : ""}`}>
                      <img src={getItemIcon(item.icon)} alt="" className="w-4 h-4 object-contain" onError={(e) => { (e.target as HTMLImageElement).src = "/items/drops/Weapon_squires_sword_i00_0.jpg"; }} />
                      <span className="truncate max-w-[100px]">{item.name || item.id}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        {showPlayerInv && (
          <div className="max-h-64 overflow-y-auto rounded bg-black/30 p-2 text-xs border border-[#c7ad80]/20">
            {Object.keys(playerInvByCategory).length === 0 ? (
              <div className="text-gray-400">Інвентар порожній</div>
            ) : (
              Object.entries(playerInvByCategory).map(([cat, list]) => (
                <div key={cat} className="mb-3">
                  <div className="font-medium mb-1 border-b border-[#c7ad80]/20 pb-0.5" style={style}>{cat}</div>
                  <div className="flex flex-col gap-1">
                    {list.map((item, idx) => (
                      <div key={`${item.id}-${idx}`} className="flex items-center justify-between py-1 px-2 rounded bg-black/40 border border-white/5 hover:border-white/10">
                        <div className="flex items-center gap-2">
                          <img src={getItemIcon(item.icon)} alt="" className="w-6 h-6 object-contain" onError={(e) => { (e.target as HTMLImageElement).src = "/items/drops/Weapon_squires_sword_i00_0.jpg"; }} />
                          <div className="flex flex-col">
                            <span className="text-[#e0c68a] text-sm">{item.name}</span>
                            <span className="text-gray-400 text-[10px]">ID: {item.id}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-white">x{item.count}</span>
                          <button 
                            type="button" 
                            onClick={(e) => {
                              const amount = window.prompt(`Скільки ${item.name} забрати? (макс ${item.count})`, String(item.count));
                              if (amount && !isNaN(Number(amount))) {
                                handleTake(e, item.id, Number(amount));
                              }
                            }}
                            disabled={loading} 
                            className="px-2 py-1 rounded bg-red-900/60 hover:bg-red-800 text-white text-[10px]"
                          >
                            Забрати
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </form>
      {message && <p className="mt-1 text-xs text-gray-500">{message}</p>}
    </section>
  );
}
