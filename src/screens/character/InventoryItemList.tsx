import React from "react";
import type { Hero, HeroInventoryItem } from "../../types/Hero";
import { itemsDB, itemsDBWithStarter } from "../../data/items/itemsDB";
import { OVERFLOW_CHEST_ID } from "../../state/heroStore";
import { normalizeIconPath, handleResourceIconError, FALLBACK_ICON } from "../../utils/itemIcon";
import { isWarmCityUi, getCityUiVariant } from "../../utils/cityUiVariant";
import { isGmBlessSoulScrollItem } from "../../data/items/gmBlessSoulScrollBuffs";
import { applyGmBlessSoulScrollFromInventory } from "../../utils/gmBlessSoulScrollApply";
import { showToast } from "../../state/toastStore";
import { resolveDisplayGrade } from "../../utils/itemGrade";
import { isAdminEnchantableInventoryItem, maxEnchantLevelForItemId } from "../../utils/adminInventoryEnchant";

interface InventoryItemListProps {
  items: HeroInventoryItem[];
  hero: Hero;
  onItemClick: (item: HeroInventoryItem) => void;
  onEquipItem: (item: HeroInventoryItem) => void;
  /** Лише після adminCheck + isAdmin — заточка 100%, max +40 / +30 */
  showAdminEnchant?: boolean;
  filteredBaseIndex?: number;
  adminEnchantDraft?: Record<number, string>;
  onAdminEnchantDraftChange?: (filteredIndex: number, value: string) => void;
  onAdminEnchantApply?: (item: HeroInventoryItem, pageLocalIndex: number) => void;
}

export default function InventoryItemList({
  items,
  hero,
  onItemClick,
  onEquipItem,
  showAdminEnchant = false,
  filteredBaseIndex = 0,
  adminEnchantDraft = {},
  onAdminEnchantDraftChange,
  onAdminEnchantApply,
}: InventoryItemListProps) {
  const isL2 = isWarmCityUi(getCityUiVariant());
  const listShell = isL2
    ? "space-y-0 mb-3 rounded-lg border border-[#5c4a32]/65 min-h-[200px] bg-[radial-gradient(ellipse_100%_40%_at_50%_0%,rgba(120,90,45,0.15)_0%,transparent_45%),linear-gradient(180deg,#1a1610_0%,#0c0a08_100%)] shadow-[inset_0_1px_0_rgba(199,173,128,0.08),0_4px_14px_rgba(0,0,0,0.45)] overflow-hidden"
    : "space-y-0 mb-3 rounded-xl border-2";

  const listShellStyle = isL2
    ? undefined
    : {
        backgroundColor: "#0f0c08",
        borderColor: "rgba(255,255,255,0.5)",
        minHeight: "200px",
      };

  return (
    <div className={listShell} style={listShellStyle}>
      {items.length === 0 ? (
        <div
          className={
            isL2
              ? "text-center text-[#8a7a60] py-4 text-[10px]"
              : "text-center text-gray-400 py-4 text-[10px]"
          }
        >
          Пусто
        </div>
      ) : (
        items.map((item: any, idx: number) => {
          const rawKey = item.id ?? item.itemId;
          const itemKey = String(rawKey ?? "")
            .trim()
            .toLowerCase();
          const normEq = (x: string | null | undefined) => String(x ?? "").trim().toLowerCase();
          const itemDef = itemsDBWithStarter[itemKey] || itemsDB[itemKey];
          const finalIconPath = normalizeIconPath(item.icon || itemDef?.icon) || FALLBACK_ICON;
          // Конвертуємо XML формат слотів для перевірки (chest -> armor для збігу з equipment)
          let normalizedSlot = item.slot;
          if (item.slot === "chest") {
            normalizedSlot = "armor";
          } else if (item.slot && (item.slot.includes("rear") || item.slot.includes("lear") || item.slot === "rear;lear")) {
            normalizedSlot = "earring";
          } else if (item.slot && (item.slot.includes("rfinger") || item.slot.includes("lfinger") || item.slot === "rfinger;lfinger")) {
            normalizedSlot = "ring";
          } else if (item.slot === "lhand") {
            // Перевіряємо, чи це щит
            const slotDef = itemsDB[itemKey] || itemsDBWithStarter[itemKey];
            if (slotDef && (slotDef.kind === "shield" || slotDef.kind === "armor")) {
              normalizedSlot = "shield";
            }
          } else if (item.slot === "lrhand") {
            // Перевіряємо, чи це зброя (включаючи удочки)
            const weaponDef = itemsDB[itemKey] || itemsDBWithStarter[itemKey];
            if (weaponDef && weaponDef.kind === "weapon") {
              normalizedSlot = "weapon";
            }
          }
          
          const isEquipable = itemKey !== OVERFLOW_CHEST_ID && !["all", "consumable", "resource", "quest", "book", "recipe"].includes(normalizedSlot);
          
          // Перевірка чи одягнутий предмет (враховуємо як slot, так і slot_left/slot_right для earring/ring)
          // Для earring та ring перевіряємо, чи обидва слоти зайняті (тоді не показуємо кнопку "Одеть")
          // Для XML формату слотів (rear;lear, rfinger;lfinger) не перевіряємо item.slot напряму
          let isEquipped = false;
          if (normalizedSlot !== "earring" && normalizedSlot !== "ring") {
            // Для інших слотів перевіряємо стандартним способом
            // Використовуємо normalizedSlot замість item.slot для правильного визначення щитів та зброї
            isEquipped = normEq(hero.equipment?.[normalizedSlot] as string) === itemKey;
          }
          
          // Діагностика для S-grade кілець
          if (item.id === "tateossian_ring" || (item.grade === "S" && normalizedSlot === "ring")) {
            console.log(`[InventoryItemList] 🔍 S-GRADE RING CHECK:`, {
              itemId: item.id,
              itemName: item.name,
              itemSlot: item.slot,
              normalizedSlot,
              heroEquipment: {
                ring_left: hero.equipment?.ring_left,
                ring_right: hero.equipment?.ring_right,
              },
            });
          }
          
          if (!isEquipped && (normalizedSlot === "earring" || normalizedSlot === "ring")) {
            // Для earring та ring перевіряємо, чи обидва слоти зайняті
            const leftSlot = `${normalizedSlot}_left` as keyof typeof hero.equipment;
            const rightSlot = `${normalizedSlot}_right` as keyof typeof hero.equipment;
            const leftEquipped = hero.equipment?.[leftSlot];
            const rightEquipped = hero.equipment?.[rightSlot];
            
            // Перевіряємо, чи предмет вже одягнутий в обидва слоти (тоді не показуємо кнопку)
            // Дозволяємо одягати однакові предмети в різні слоти (наприклад, два однакові кільця)
            // Кнопка "Одеть" зникає тільки якщо обидва слоти зайняті цим предметом
            const leftHasThisItem = normEq(leftEquipped as string) === itemKey;
            const rightHasThisItem = normEq(rightEquipped as string) === itemKey;
            
            // Якщо обидва слоти зайняті цим предметом, вважаємо одягнутим
            isEquipped = leftHasThisItem && rightHasThisItem;
            
            // Якщо обидва слоти зайняті іншими предметами (не цим), також не показуємо кнопку
            if (
              !isEquipped &&
              leftEquipped &&
              rightEquipped &&
              normEq(leftEquipped as string) !== itemKey &&
              normEq(rightEquipped as string) !== itemKey
            ) {
              isEquipped = true;
            }
            
            // Діагностика для S-grade кілець
            if (item.id === "tateossian_ring" || (item.grade === "S" && normalizedSlot === "ring")) {
              console.log(`[InventoryItemList] 🔍 S-GRADE RING EQUIP CHECK:`, {
                itemId: item.id,
                leftEquipped,
                rightEquipped,
                leftHasThisItem,
                rightHasThisItem,
                isEquipped,
                willShowButton: isEquipable && !isEquipped,
              });
            }
          }

          const hasLSPassive = !!(item as any).meta?.hasLSPassive;
          return (
            <div
              key={idx}
              className={
                isL2
                  ? "flex items-center gap-1.5 px-2 py-1.5 border-b border-[#5c4a32]/35 text-[10px] text-[#d4c4a8]"
                  : "flex items-center gap-1.5 px-2 py-1 border-b border-white/30 text-[10px]"
              }
              style={
                isL2
                  ? undefined
                  : {
                      borderBottom: "1px solid #2a2a2a",
                      color: "#d9d9d9",
                    }
              }
            >
              <div className="relative flex-shrink-0">
                <img
                  src={finalIconPath}
                  alt={itemDef?.name || item.name || itemKey}
                  className={`w-5 h-5 object-contain ${hasLSPassive ? "ring-1 ring-green-500" : ""}`}
                  onError={handleResourceIconError}
                />
                {hasLSPassive && (
                  <span className="absolute -top-0.5 -right-0.5 bg-green-500 text-black text-[7px] font-bold px-0.5 rounded leading-none">ЛС</span>
                )}
                {item.enchantLevel !== undefined && item.enchantLevel > 0 && (
                  <div 
                    className="absolute -bottom-0.5 -right-0.5 bg-[#b8860b] text-black text-[8px] font-bold px-0.5 rounded leading-none"
                    style={{ minWidth: "12px", textAlign: "center" }}
                  >
                    +{item.enchantLevel}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onItemClick(item)}
                  className={
                    isL2
                      ? "text-[#e8dcc8] hover:text-[#f4e2b8] text-[10px] text-left flex-1"
                      : "text-[#d9d9d9] hover:text-[#f5d7a1] text-[10px] text-left flex-1"
                  }
                >
                  {itemDef?.name || item.name || itemKey}
                  {resolveDisplayGrade(item, itemDef) && (
                    <span
                      className={
                        isL2 ? "text-[#8a7a60] ml-1" : "text-[#9ca3af] ml-1"
                      }
                    >
                      ({resolveDisplayGrade(item, itemDef)})
                    </span>
                  )}
                  {item.enchantLevel !== undefined && item.enchantLevel > 0 && ` +${item.enchantLevel}`}
                  {item.count && item.count > 1 ? ` (x${item.count})` : ""}
                </button>
                {isGmBlessSoulScrollItem(String(itemKey)) && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const r = applyGmBlessSoulScrollFromInventory(String(itemKey));
                      if (!r.ok) {
                        showToast(r.message ?? "Не вдалося використати скрол", "error");
                        return;
                      }
                      showToast(`Використано: ${itemDef?.name ?? itemKey}`, "success");
                    }}
                    className={
                      isL2
                        ? "text-[#7ec97e] hover:text-[#a8e6a8] text-[9px] font-semibold px-2 py-0.5 rounded-md border border-[#3d5c3d]/80 bg-gradient-to-b from-[#1a2619] to-[#0c140c] shadow-[inset_0_1px_0_rgba(150,200,150,0.12)] hover:border-[#7ec97e]/45 hover:brightness-110 whitespace-nowrap transition-[border-color,filter] duration-150"
                        : "text-[#6bc06b] hover:text-[#8fd98f] text-[9px] font-semibold px-2 py-0.5 border border-white/50 rounded bg-[#1a2a1a] hover:bg-[#243824] whitespace-nowrap"
                    }
                  >
                    Использовать
                  </button>
                )}
                {isEquipable && !isEquipped && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEquipItem(item);
                    }}
                    className={
                      isL2
                        ? "text-[#c9a44c] hover:text-[#f4e2b8] text-[9px] font-semibold px-2 py-0.5 rounded-md border border-[#5c4a32]/80 bg-gradient-to-b from-[#2e2619] to-[#14110c] shadow-[inset_0_1px_0_rgba(199,173,128,0.1)] hover:border-[#c7ad80]/45 hover:brightness-110 whitespace-nowrap transition-[border-color,filter] duration-150"
                        : "text-[#b8860b] hover:text-[#d4af37] text-[9px] font-semibold px-2 py-0.5 border border-white/50 rounded bg-[#2a2a2a] hover:bg-[#3a3a3a] whitespace-nowrap"
                    }
                  >
                    Одеть
                  </button>
                )}
                {showAdminEnchant &&
                  itemKey !== OVERFLOW_CHEST_ID &&
                  isAdminEnchantableInventoryItem(itemKey) && (
                    <div
                      className="flex items-center gap-0.5 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {(() => {
                        const filteredIndex = filteredBaseIndex + idx;
                        const maxEnc = maxEnchantLevelForItemId(itemKey);
                        const draftVal = adminEnchantDraft[filteredIndex];
                        const inputVal =
                          draftVal !== undefined ? draftVal : String(item.enchantLevel ?? 0);
                        return (
                          <>
                            <input
                              type="number"
                              min={0}
                              max={maxEnc}
                              title={`Заточка 0–${maxEnc} (адмін)`}
                              value={inputVal}
                              onChange={(e) =>
                                onAdminEnchantDraftChange?.(filteredIndex, e.target.value)
                              }
                              className={
                                isL2
                                  ? "w-9 rounded border border-[#5c4a32]/70 bg-[#14110c] text-[#e8dcc8] text-[9px] px-0.5 py-0.5"
                                  : "w-9 rounded border border-white/25 bg-[#1a1a1a] text-[10px] px-0.5 py-0.5"
                              }
                            />
                            <button
                              type="button"
                              title="Адмін: застосувати заточку (100%)"
                              onClick={() => onAdminEnchantApply?.(item, idx)}
                              className={
                                isL2
                                  ? "text-[#7ec97e] hover:text-[#a8e6a8] text-[9px] font-semibold px-1.5 py-0.5 rounded-md border border-[#3d5c3d]/80 bg-gradient-to-b from-[#1a2619] to-[#0c140c] whitespace-nowrap"
                                  : "text-[#6bc06b] text-[9px] font-semibold px-1.5 py-0.5 border border-white/40 rounded bg-[#1a2a1a] whitespace-nowrap"
                              }
                            >
                              Заточити
                            </button>
                          </>
                        );
                      })()}
                    </div>
                  )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

