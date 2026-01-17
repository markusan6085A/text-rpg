import React from "react";
import type { Hero, HeroInventoryItem } from "../../types/Hero";
import { itemsDB, itemsDBWithStarter } from "../../data/items/itemsDB";

interface InventoryItemListProps {
  items: HeroInventoryItem[];
  hero: Hero;
  onItemClick: (item: HeroInventoryItem) => void;
  onEquipItem: (item: HeroInventoryItem) => void;
}

export default function InventoryItemList({
  items,
  hero,
  onItemClick,
  onEquipItem,
}: InventoryItemListProps) {
  return (
    <div 
      className="space-y-0 mb-3 rounded-xl border-2"
      style={{
        backgroundColor: "#0f0c08",
        borderColor: "#5b4726",
        minHeight: "200px",
      }}
    >
      {items.length === 0 ? (
        <div className="text-center text-gray-400 py-4 text-[10px]">Пусто</div>
      ) : (
        items.map((item: any, idx: number) => {
          const itemDef = itemsDBWithStarter[item.id] || itemsDB[item.id];
          const iconPath = item.icon || itemDef?.icon || "/items/drops/Weapon_squires_sword_i00_0.jpg";
          const finalIconPath = iconPath.startsWith("/") ? iconPath : `/items/${iconPath}`;
          // Конвертуємо XML формат слотів для перевірки
          let normalizedSlot = item.slot;
          if (item.slot && (item.slot.includes("rear") || item.slot.includes("lear") || item.slot === "rear;lear")) {
            normalizedSlot = "earring";
          } else if (item.slot && (item.slot.includes("rfinger") || item.slot.includes("lfinger") || item.slot === "rfinger;lfinger")) {
            normalizedSlot = "ring";
          } else if (item.slot === "lhand") {
            // Перевіряємо, чи це щит
            const itemDef = itemsDB[item.id] || itemsDBWithStarter[item.id];
            if (itemDef && (itemDef.kind === "shield" || itemDef.kind === "armor")) {
              normalizedSlot = "shield";
            }
          } else if (item.slot === "lrhand") {
            // Перевіряємо, чи це зброя (включаючи удочки)
            const itemDef = itemsDB[item.id] || itemsDBWithStarter[item.id];
            if (itemDef && itemDef.kind === "weapon") {
              normalizedSlot = "weapon";
            }
          }
          
          const isEquipable = !["all", "consumable", "resource", "quest", "book", "recipe"].includes(normalizedSlot);
          
          // Перевірка чи одягнутий предмет (враховуємо як slot, так і slot_left/slot_right для earring/ring)
          // Для earring та ring перевіряємо, чи обидва слоти зайняті (тоді не показуємо кнопку "Одеть")
          // Для XML формату слотів (rear;lear, rfinger;lfinger) не перевіряємо item.slot напряму
          let isEquipped = false;
          if (normalizedSlot !== "earring" && normalizedSlot !== "ring") {
            // Для інших слотів перевіряємо стандартним способом
            // Використовуємо normalizedSlot замість item.slot для правильного визначення щитів та зброї
            isEquipped = hero.equipment?.[normalizedSlot] === item.id;
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
            const leftHasThisItem = leftEquipped === item.id;
            const rightHasThisItem = rightEquipped === item.id;
            
            // Якщо обидва слоти зайняті цим предметом, вважаємо одягнутим
            isEquipped = leftHasThisItem && rightHasThisItem;
            
            // Якщо обидва слоти зайняті іншими предметами (не цим), також не показуємо кнопку
            if (!isEquipped && leftEquipped && rightEquipped && leftEquipped !== item.id && rightEquipped !== item.id) {
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

          return (
            <div
              key={idx}
              className="flex items-center gap-1.5 px-2 py-1 border-b border-[#2a2a2a] text-[10px]"
              style={{
                borderBottom: "1px solid #2a2a2a",
                color: "#d9d9d9",
              }}
            >
              <div className="relative flex-shrink-0">
                <img
                  src={finalIconPath}
                  alt={item.name}
                  className="w-5 h-5 object-contain"
                  onError={(e) => {
                    // Якщо іконка не завантажилась, спробуємо отримати з itemsDB
                    if (itemDef?.icon && (e.target as HTMLImageElement).src !== itemDef.icon) {
                      (e.target as HTMLImageElement).src = itemDef.icon;
                    } else {
                      (e.target as HTMLImageElement).src = "/items/drops/Weapon_squires_sword_i00_0.jpg";
                    }
                  }}
                />
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
                  onClick={() => onItemClick(item)}
                  className="text-[#d9d9d9] hover:text-[#f5d7a1] text-[10px] text-left flex-1"
                >
                  {item.name}
                  {!item.name.includes("(NG)") && !item.name.includes("(D)") && !item.name.includes("(C)") && !item.name.includes("(B)") && !item.name.includes("(A)") && !item.name.includes("(S)") && item.grade && (
                    <span className="text-[#9ca3af] ml-1">({item.grade})</span>
                  )}
                  {item.enchantLevel !== undefined && item.enchantLevel > 0 && ` +${item.enchantLevel}`}
                  {item.count && item.count > 1 ? ` (x${item.count})` : ""}
                </button>
                {isEquipable && !isEquipped && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEquipItem(item);
                    }}
                    className="text-[#b8860b] hover:text-[#d4af37] text-[9px] font-semibold px-2 py-0.5 border border-[#7c6847] rounded bg-[#2a2a2a] hover:bg-[#3a3a3a] whitespace-nowrap"
                  >
                    Одеть
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

