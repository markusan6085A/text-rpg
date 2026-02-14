// src/screens/Shop.tsx
import React, { useState } from "react";
import { NG_GRADE_SHOP_ITEMS } from "../data/shop/ngGradeShop";
import { D_GRADE_SHOP_ITEMS } from "../data/shop/dGradeShop";
import { C_GRADE_SHOP_ITEMS } from "../data/shop/cGradeShop";
import { B_GRADE_SHOP_ITEMS } from "../data/shop/bGradeShop";
import { A_GRADE_SHOP_ITEMS } from "../data/shop/aGradeShop";
import { S_GRADE_SHOP_ITEMS } from "../data/shop/sGradeShop";
import { CONSUMABLES_SHOP_ITEMS } from "../data/shop/consumablesShop";
import type { ShopItem } from "../data/shop/shopTypes";
import { useHeroStore } from "../state/heroStore";
import { itemsDB } from "../data/items/itemsDB";
import { findSetForItem, ARMOR_SETS } from "../data/sets/armorSets";
import { SHOP_ITEM_ID_MAPPING } from "../data/shop/itemMappings";
import { autoDetectArmorType, autoDetectGrade } from "../utils/items/autoDetectArmorType";

type Navigate = (path: string) => void;

interface ShopProps {
  navigate: Navigate;
}

const ITEMS_PER_PAGE = 10;

export default function Shop({ navigate }: ShopProps) {
  const hero = useHeroStore((s) => s.hero);
  const updateAdena = useHeroStore((s) => s.updateAdena);
  const updateHero = useHeroStore((s) => s.updateHero);

  const [selectedCategory, setSelectedCategory] = useState<string>("weapons");
  const [selectedGrade, setSelectedGrade] = useState<string>("D");
  const [selectedArmorSubcategory, setSelectedArmorSubcategory] = useState<string | null>(null);
  const [selectedJewelrySubcategory, setSelectedJewelrySubcategory] = useState<string | null>(null);
  const [selectedConsumablesSubcategory, setSelectedConsumablesSubcategory] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [buyQuantity, setBuyQuantity] = useState<number>(1);

  // Об'єднання всіх предметів
  const allShopItems = [...NG_GRADE_SHOP_ITEMS, ...D_GRADE_SHOP_ITEMS, ...C_GRADE_SHOP_ITEMS, ...B_GRADE_SHOP_ITEMS, ...A_GRADE_SHOP_ITEMS, ...S_GRADE_SHOP_ITEMS, ...CONSUMABLES_SHOP_ITEMS];

  // Фільтрація предметів
  const filteredItems = allShopItems.filter((item) => {
    // Фільтр по категорії
    if (selectedCategory === "weapons" && item.type !== "weapon") return false;
    if (selectedCategory === "armor" && item.type !== "armor") return false;
    if (selectedCategory === "jewelry" && item.type !== "jewelry") return false;
    if (selectedCategory === "materials" && item.type !== "material") return false;
    if (selectedCategory === "consumables" && item.type !== "consumable") return false;
    
    // Фільтр по підкатегорії броні
    if (selectedCategory === "armor" && selectedArmorSubcategory) {
      if (selectedArmorSubcategory === "helmet" && item.category !== "helmet") return false;
      if (selectedArmorSubcategory === "chest" && item.category !== "armor" && item.category !== "chest") return false;
      if (selectedArmorSubcategory === "legs" && item.category !== "legs") return false;
      if (selectedArmorSubcategory === "gloves" && item.category !== "gloves") return false;
      if (selectedArmorSubcategory === "boots" && item.category !== "boots") return false;
      if (selectedArmorSubcategory === "shield" && item.category !== "shield") return false;
    }
    
    // Фільтр по підкатегорії біжутерії
    if (selectedCategory === "jewelry" && selectedJewelrySubcategory) {
      if (selectedJewelrySubcategory === "necklace" && item.category !== "necklace") return false;
      if (selectedJewelrySubcategory === "earring" && item.category !== "earring") return false;
      if (selectedJewelrySubcategory === "ring" && item.category !== "ring") return false;
    }
    
    // Фільтр по підкатегорії расходників
    if (selectedCategory === "consumables") {
      if (selectedConsumablesSubcategory === "enchant_scroll" && item.category !== "enchant_scroll") return false;
      if (selectedConsumablesSubcategory === "charges" && item.category !== "soulshot" && item.category !== "spiritshot") return false;
      if (selectedConsumablesSubcategory === "arrows" && item.category !== "arrow") return false;
      if (selectedConsumablesSubcategory === "potions" && item.category !== "potion") return false;
      // Якщо підкатегорія не вибрана, показуємо всі расходники
    }
    
    // Фільтр по грейду (тільки для weapons, armor, jewelry) - без NG
    if ((selectedCategory === "weapons" || selectedCategory === "armor" || selectedCategory === "jewelry") && item.grade !== selectedGrade) {
      return false;
    }
    
    return true;
  });

  // Пагінація
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleBuy = (item: ShopItem, quantity: number = 1) => {
    if (!hero) return;

    const totalPrice = item.price * quantity;

    if (hero.adena < totalPrice) {
      alert("Недостатньо Adena!");
      return;
    }

    // 🔥 КРИТИЧНО: Спочатку item.id (унікальний для кожного предмета), інакше itemId→маппінг дає неправильні іконки
    let itemsDBId: string | undefined = item.id && itemsDB[item.id] ? item.id : SHOP_ITEM_ID_MAPPING[item.itemId];
    let itemDef = itemsDBId ? itemsDB[itemsDBId] : undefined;

    // Якщо не знайшли через id/маппінг, спробуємо знайти за назвою (fallback)
    if (!itemDef && item.name) {
      const itemNameLower = item.name.toLowerCase().replace(/\[.*?\]/g, '').trim();
      itemsDBId = Object.keys(itemsDB).find(key => {
        const dbItem = itemsDB[key];
        return dbItem?.name?.toLowerCase().replace(/\[.*?\]/g, '').trim() === itemNameLower;
      });
      if (itemsDBId) {
        itemDef = itemsDB[itemsDBId];
      }
    }

    if (!itemDef || !itemsDBId) {
      console.error(`[Shop] Item not found in itemsDB: itemId=${item.itemId}, name=${item.name}, grade=${item.grade}`);
      console.error(`[Shop] Available mapping keys:`, Object.keys(SHOP_ITEM_ID_MAPPING).slice(0, 10));
      alert(`Помилка: предмет "${item.name}" (ID: ${item.itemId}) не знайдено в itemsDB!\n\nПеревірте файл itemMappings.ts та itemsDB.ts`);
      return;
    }

    // Використовуємо стати з ShopItem, якщо вони є, інакше з itemsDB
    const finalStats = item.stats || itemDef.stats;
    
    // Попереджаємо про невідповідність статів
    if (item.stats && itemDef.stats && JSON.stringify(item.stats) !== JSON.stringify(itemDef.stats)) {
      console.warn(`[Shop] Stats mismatch for ${itemsDBId}: ShopItem has ${JSON.stringify(item.stats)}, itemsDB has ${JSON.stringify(itemDef.stats)}. Using ShopItem stats.`);
    }

    updateAdena(-totalPrice);
    
    // Додаємо предмет з правильними статами
    const stackableSlots = ["consumable", "resource", "quest"];
    const canStack = stackableSlots.includes(itemDef.slot);
    const newInventory = [...(hero.inventory || [])];
    const existingItemIndex = newInventory.findIndex((invItem) => invItem.id === itemsDBId);

    console.log(`[Shop] handleBuy:`, {
      itemName: item.name,
      itemId: item.itemId,
      itemsDBId,
      itemDef: itemDef ? { id: itemDef.id, name: itemDef.name, slot: itemDef.slot, kind: itemDef.kind } : null,
      existingItemIndex,
      canStack,
      quantity,
      inventoryLength: newInventory.length,
    });

    if (existingItemIndex >= 0 && canStack) {
      // Тільки стакаємо, якщо предмет може стакатися
      const existingItem = newInventory[existingItemIndex];
      existingItem.count = (existingItem.count || 1) + quantity;
      console.log(`[Shop] Stacked item:`, { id: existingItem.id, newCount: existingItem.count });
    } else {
      // Додаємо новий предмет зі статами з ShopItem
      const grade = itemDef.grade || autoDetectGrade(itemsDBId);
      const armorType = itemDef.armorType || (itemDef.kind === "armor" || itemDef.kind === "helmet" || itemDef.kind === "boots" || itemDef.kind === "gloves" ? autoDetectArmorType(itemsDBId) : undefined);
      
      const newItem = {
        id: itemDef.id,
        name: itemDef.name,
        slot: itemDef.slot,
        kind: itemDef.kind,
        icon: itemDef.icon,
        description: itemDef.description,
        stats: finalStats, // Використовуємо стати з ShopItem
        count: quantity,
        grade: grade,
        armorType: armorType,
      };
      
      console.log(`[Shop] Adding new item to inventory:`, newItem);
      newInventory.push(newItem);
    }
    
    console.log(`[Shop] Updating inventory, new length:`, newInventory.length);
    updateHero({ inventory: newInventory });
    
    setSelectedItem(null);
    setBuyQuantity(1);
  };

  // Отримання itemsDB ID з ShopItem
  const getItemsDBId = (item: ShopItem): string | null => {
    return SHOP_ITEM_ID_MAPPING[item.itemId] || null;
  };

  // Отримання інформації про сет для предмета
  const getSetInfo = (item: ShopItem): string | null => {
    const itemsDBId = getItemsDBId(item);
    if (!itemsDBId) return null;

    const set = findSetForItem(itemsDBId);
    if (!set) return null;

    // Формуємо список частин сету
    const piecesList = set.pieces.map((piece) => {
      const pieceItem = itemsDB[piece.itemId];
      return pieceItem ? pieceItem.name : piece.itemId;
    }).join(", ");

    // Формуємо список бонусів повного сету
    const bonusesList: string[] = [];
    if (set.bonuses.fullSet) {
      const bonuses = set.bonuses.fullSet;
      if (bonuses.pDef) bonusesList.push(`+${bonuses.pDef} Физ. защ`);
      if (bonuses.mDef) bonusesList.push(`+${bonuses.mDef} Маг. защ`);
      if (bonuses.maxHp) bonusesList.push(`+${bonuses.maxHp} Max HP`);
      if (bonuses.maxMp) bonusesList.push(`+${bonuses.maxMp} Max MP`);
      if (bonuses.maxCp) bonusesList.push(`+${bonuses.maxCp} Max CP`);
      if (bonuses.hpRegen) bonusesList.push(`+${bonuses.hpRegen} Реген HP`);
      if (bonuses.mpRegen) bonusesList.push(`+${bonuses.mpRegen} Реген MP`);
      if (bonuses.attackSpeed) bonusesList.push(`+${bonuses.attackSpeed} Скорость атаки`);
      if (bonuses.castSpeed) bonusesList.push(`+${bonuses.castSpeed} Скорость каста`);
      if (bonuses.pAtk) bonusesList.push(`+${bonuses.pAtk} Физ. атака`);
      if (bonuses.mAtk) bonusesList.push(`+${bonuses.mAtk} Маг. атака`);
      if (bonuses.crit) bonusesList.push(`+${bonuses.crit}% Крит`);
      if (bonuses.critRate) bonusesList.push(`+${bonuses.critRate}% Шанс крита`);
      if (bonuses.critDamage) bonusesList.push(`+${bonuses.critDamage} Сила крита`);
      if (bonuses.skillCritRate) bonusesList.push(`+${bonuses.skillCritRate}% Шанс маг крита`);
      if (bonuses.skillCritPower) bonusesList.push(`+${bonuses.skillCritPower} Сила маг крита`);
      if (bonuses.pDefPercent) bonusesList.push(`+${bonuses.pDefPercent}% Физ. защ`);
      if (bonuses.mDefPercent) bonusesList.push(`+${bonuses.mDefPercent}% Маг. защ`);
      if (bonuses.maxHpPercent) bonusesList.push(`+${bonuses.maxHpPercent}% Max HP`);
      if (bonuses.accuracy) bonusesList.push(`+${bonuses.accuracy} Точність`);
    }

    let result = `\n\n[Сет: ${set.name}]\n`;
    if (bonusesList.length > 0) {
      result += `Повний сет: ${bonusesList.join(", ")}\n`;
    }

    return result;
  };

  // Отримання іконки предмета
  const getItemIcon = (item: ShopItem): string => {
    // Якщо є іконка в ShopItem, використовуємо її
    if (item.icon) {
      return item.icon.startsWith("/") ? item.icon : `/items/${item.icon}`;
    }
    // Для зброї та броні спробуємо знайти в WEP_ARROW
    if (item.itemId && (item.type === "weapon" || item.type === "armor")) {
      return `/items/drops/WEP_ARROW/${item.itemId}.jpg`;
    }
    // Для расходників спробуємо знайти в resoures (за числовим ID)
    if (item.itemId && item.type === "consumable") {
      return `/items/drops/resoures/${item.itemId}.jpg`;
    }
    // Використовуємо itemId напряму для формування шляху до іконки
    // Всі іконки тепер мають формат /items/drops/items/{ID}.jpg
    if (item.itemId) {
      return `/items/drops/items/${item.itemId}.jpg`;
    }
    // Якщо немає itemId, шукаємо в itemsDB через маппінг (fallback)
    const itemsDBId = SHOP_ITEM_ID_MAPPING[item.itemId || 0];
    if (itemsDBId && itemsDB[itemsDBId]) {
      const icon = itemsDB[itemsDBId].icon;
      return icon.startsWith("/") ? icon : `/items/${icon}`;
    }
    return "/items/drops/Weapon_squires_sword_i00_0.jpg"; // дефолтна іконка
  };

  return (
    <>
      {/* Заголовок */}
      <div className="border-b border-black/70 px-4 py-2 text-center text-[11px] text-[#f4e2b8] tracking-[0.12em] uppercase">
        Магазин вещей
      </div>

      {/* Баланс */}
      <div className="px-4 py-2 border-b border-black/70 text-[12px] text-[#cfcfcc]">
        У вас с собой <span className="text-yellow-400 font-semibold">{hero?.adena.toLocaleString() || 0}</span> адены
      </div>

      {/* Категорії */}
      <div className="px-4 py-2 border-b border-black/70">
        <div className="text-[11px] text-gray-300 flex gap-1.5 mb-2 flex-nowrap items-center">
          <button
            onClick={() => {
              setSelectedCategory("weapons");
              setSelectedGrade("D");
              setSelectedArmorSubcategory(null);
              setSelectedJewelrySubcategory(null);
              setSelectedConsumablesSubcategory(null);
              setCurrentPage(1);
            }}
            className={`px-1.5 py-0.5 text-[11px] whitespace-nowrap ${selectedCategory === "weapons" ? "text-gray-200 font-semibold border-b border-white/60" : "hover:text-gray-200"}`}
          >
            Оружие
          </button>
          <span className="text-gray-500 text-[10px]">|</span>
          <button
            onClick={() => {
              setSelectedCategory("armor");
              setSelectedGrade("D");
              setSelectedArmorSubcategory(null);
              setSelectedJewelrySubcategory(null);
              setSelectedConsumablesSubcategory(null);
              setCurrentPage(1);
            }}
            className={`px-1.5 py-0.5 text-[11px] whitespace-nowrap ${selectedCategory === "armor" ? "text-gray-200 font-semibold border-b border-white/60" : "hover:text-gray-200"}`}
          >
            Броня
          </button>
          <span className="text-gray-500 text-[10px]">|</span>
          <button
            onClick={() => {
              setSelectedCategory("jewelry");
              setSelectedGrade("D");
              setSelectedArmorSubcategory(null);
              setSelectedJewelrySubcategory(null);
              setSelectedConsumablesSubcategory(null);
              setCurrentPage(1);
            }}
            className={`px-1.5 py-0.5 text-[11px] whitespace-nowrap ${selectedCategory === "jewelry" ? "text-gray-200 font-semibold border-b border-white/60" : "hover:text-gray-200"}`}
          >
            Биж
          </button>
          <span className="text-gray-500 text-[10px]">|</span>
          <button
            onClick={() => {
              setSelectedCategory("materials");
              setSelectedArmorSubcategory(null);
              setSelectedJewelrySubcategory(null);
              setSelectedConsumablesSubcategory(null);
              setCurrentPage(1);
            }}
            className={`px-1.5 py-0.5 text-[11px] whitespace-nowrap ${selectedCategory === "materials" ? "text-gray-200 font-semibold border-b border-white/60" : "hover:text-gray-200"}`}
          >
            Материалы
          </button>
          <span className="text-gray-500 text-[10px]">|</span>
          <button
            onClick={() => {
              setSelectedCategory("consumables");
              setSelectedArmorSubcategory(null);
              setSelectedJewelrySubcategory(null);
              setSelectedConsumablesSubcategory(null);
              setCurrentPage(1);
            }}
            className={`px-1.5 py-0.5 text-[11px] whitespace-nowrap ${selectedCategory === "consumables" ? "text-gray-200 font-semibold border-b border-white/60" : "hover:text-gray-200"}`}
          >
            Расходники
          </button>
        </div>

        {/* Підкатегорії для расходників */}
        {selectedCategory === "consumables" && (
          <div className="flex gap-1 mt-2 flex-nowrap overflow-x-auto">
            {[
              { id: "enchant_scroll", name: "Заточки" },
              { id: "charges", name: "Заряды" },
              { id: "arrows", name: "Стрелы" },
              { id: "potions", name: "Банки" },
            ].map((subcat) => (
              <button
                key={subcat.id}
                onClick={() => {
                  setSelectedConsumablesSubcategory(subcat.id);
                  setCurrentPage(1);
                }}
                className={`px-1.5 py-0.5 text-[11px] whitespace-nowrap flex-shrink-0 ${
                  selectedConsumablesSubcategory === subcat.id
                    ? "text-gray-400 font-bold"
                    : "text-gray-500 font-semibold hover:text-gray-400"
                }`}
              >
                {subcat.name}
              </button>
            ))}
          </div>
        )}

        {/* Підкатегорії для броні */}
        {selectedCategory === "armor" && (
          <div className="flex gap-1 mt-2 flex-nowrap overflow-x-auto">
            {[
              { id: "helmet", name: "Шлем" },
              { id: "chest", name: "Торс" },
              { id: "legs", name: "Штани" },
              { id: "gloves", name: "Перчатки" },
              { id: "boots", name: "Сапоги" },
              { id: "shield", name: "Щити" },
            ].map((subcat) => (
              <button
                key={subcat.id}
                onClick={() => {
                  setSelectedArmorSubcategory(subcat.id);
                  setCurrentPage(1);
                }}
                className={`px-1.5 py-0.5 text-[11px] whitespace-nowrap flex-shrink-0 ${
                  selectedArmorSubcategory === subcat.id
                    ? "text-gray-400 font-bold"
                    : "text-gray-500 font-semibold hover:text-gray-400"
                }`}
              >
                {subcat.name}
              </button>
            ))}
          </div>
        )}

        {/* Підкатегорії для біжутерії */}
        {selectedCategory === "jewelry" && (
          <div className="flex gap-1 mt-2 flex-nowrap overflow-x-auto">
            {[
              { id: "necklace", name: "Ожерелье" },
              { id: "earring", name: "Серга" },
              { id: "ring", name: "Кольцо" },
            ].map((subcat) => (
              <button
                key={subcat.id}
                onClick={() => {
                  setSelectedJewelrySubcategory(subcat.id);
                  setCurrentPage(1);
                }}
                className={`px-1.5 py-0.5 text-[11px] whitespace-nowrap flex-shrink-0 ${
                  selectedJewelrySubcategory === subcat.id
                    ? "text-gray-400 font-bold"
                    : "text-gray-500 font-semibold hover:text-gray-400"
                }`}
              >
                {subcat.name}
              </button>
            ))}
          </div>
        )}

        {/* Фільтри по грейдах (тільки для Оружие, Броня, Биж) - без NG */}
        {(selectedCategory === "weapons" || selectedCategory === "armor" || selectedCategory === "jewelry") && (
          <div className="flex gap-2 mt-2">
            {["D", "C", "B", "A", "S"].map((grade) => {
              // Кольори для кожного грейду
              const getGradeColor = (g: string, isSelected: boolean) => {
                if (!isSelected) {
                  switch (g) {
                    case "D": return "text-white";
                    case "C": return "text-green-400";
                    case "B": return "text-blue-400";
                    case "A": return "text-purple-400";
                    case "S": return "text-orange-400";
                    default: return "text-gray-400";
                  }
                } else {
                  switch (g) {
                    case "D": return "text-white font-semibold";
                    case "C": return "text-green-300 font-semibold";
                    case "B": return "text-blue-300 font-semibold";
                    case "A": return "text-purple-300 font-semibold";
                    case "S": return "text-orange-300 font-semibold";
                    default: return "text-gray-300 font-semibold";
                  }
                }
              };

              return (
                <button
                  key={grade}
                  onClick={() => {
                    setSelectedGrade(grade);
                    setCurrentPage(1);
                  }}
                  className={`px-2 py-0.5 text-[11px] transition-colors ${getGradeColor(grade, selectedGrade === grade)} ${
                    selectedGrade === grade ? "underline" : "hover:underline"
                  }`}
                >
                  {grade}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Список предметів */}
      <div className="px-4 py-2 border-b border-black/70">
        {paginatedItems.length === 0 ? (
          <div className="text-center text-[#9f8d73] text-[12px] py-4">
            Предметів не знайдено
          </div>
        ) : (
          <div className="space-y-1">
            {paginatedItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 py-1.5 border-b border-solid border-white/30 hover:bg-black/20"
              >
                {/* Іконка */}
                <img
                  src={getItemIcon(item)}
                  alt={item.name}
                  className="w-8 h-8 object-contain flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/items/drops/Weapon_squires_sword_i00_0.jpg";
                  }}
                />
                {/* Назва - клікабельна */}
                <div 
                  className="flex-1 text-[12px] text-[#e0c68a] cursor-pointer hover:text-[#f4e2b8]"
                  onClick={() => {
                    setSelectedItem(item);
                    setBuyQuantity(1);
                  }}
                >
                  {item.name}
                </div>
                {/* Ціна */}
                <div className="text-[12px] text-[#f4e2b8] font-semibold">
                  {item.price.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Пагінація */}
      {totalPages > 1 && (
        <div className="px-4 py-2 border-b border-black/70 text-center text-[12px] text-[#e0c68a]">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="px-2 py-1 disabled:opacity-30 disabled:cursor-not-allowed hover:text-[#f4e2b8]"
          >
            &lt;&lt;
          </button>
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-2 py-1 disabled:opacity-30 disabled:cursor-not-allowed hover:text-[#f4e2b8]"
          >
            &lt;
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-2 py-1 mx-0.5 ${
                currentPage === page
                  ? "text-[#f4e2b8] font-bold bg-black/30"
                  : "hover:text-[#f4e2b8]"
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-2 py-1 disabled:opacity-30 disabled:cursor-not-allowed hover:text-[#f4e2b8]"
          >
            &gt;
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="px-2 py-1 disabled:opacity-30 disabled:cursor-not-allowed hover:text-[#f4e2b8]"
          >
            &gt;&gt;
          </button>
        </div>
      )}

      {/* Кнопка продажу */}
      <div className="px-4 py-2">
        <button
          onClick={() => navigate("/inventory")}
          className="w-full text-left text-[12px] text-[#99e074] py-1.5 hover:text-[#bbff97]"
        >
          Продать вещи
        </button>
      </div>

      {/* Модальне вікно з детальною інформацією */}
      {selectedItem && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedItem(null)}
        >
          <div 
            className="bg-[#14110c] border border-white/40 rounded-lg p-4 max-w-[400px] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Заголовок */}
            <div className="text-center text-white text-lg font-bold mb-4 border-b border-white/50 pb-2">
              Информация о предмете
            </div>

            {/* Іконка та назва */}
            <div className="flex items-center gap-3 mb-4">
              <img
                src={getItemIcon(selectedItem)}
                alt={selectedItem.name}
                className="w-16 h-16 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/items/drops/Weapon_squires_sword_i00_0.jpg";
                }}
              />
              <div className="flex-1">
                <div className="text-white text-base font-semibold">
                  {selectedItem.name} [{selectedItem.grade}]
                </div>
              </div>
            </div>

            {/* Стати */}
            {selectedItem.stats && (
              <div className="space-y-1 mb-4 text-[12px]">
                {selectedItem.stats.pAtk !== undefined && (
                  <div className="text-orange-400">
                  Физ. атк: {selectedItem.stats.pAtk}
                </div>
                )}
                {selectedItem.stats.mAtk !== undefined && (
                  <div className="text-green-400">
                  Маг. атк: {selectedItem.stats.mAtk}
                </div>
                )}
                {selectedItem.stats.pDef !== undefined && (
                  <div className="text-yellow-400">
                  Физ. защ: {selectedItem.stats.pDef}
                </div>
                )}
                {selectedItem.stats.mDef !== undefined && (
                  <div className="text-purple-400">
                  Маг. защ: {selectedItem.stats.mDef}
                </div>
                )}
                {selectedItem.stats.rCrit !== undefined && (
                  <div className="text-purple-400">
                  Крит: {selectedItem.stats.rCrit}
                </div>
                )}
                {selectedItem.stats.pAtkSpd !== undefined && (
                  <div className="text-yellow-400">
                  Скорость боя: {selectedItem.stats.pAtkSpd}
                </div>
                )}
                {selectedItem.stats.castSpeed !== undefined && (
                  <div className="text-cyan-400">
                  Скорость каста: {selectedItem.stats.castSpeed}
                </div>
                )}
              </div>
            )}

            {/* Тип зброї */}
            {selectedItem.weaponType && (
              <div className="text-gray-300 text-[12px] mb-2">
                Тип оружия: {selectedItem.weaponType === "SWORD" ? "Меч" : 
                            selectedItem.weaponType === "BLUNT" ? "Булава" :
                            selectedItem.weaponType === "BIGBLUNT" ? "Посох" :
                            selectedItem.weaponType === "DAGGER" ? "Кинджал" :
                            selectedItem.weaponType === "BOW" ? "Лук" :
                            selectedItem.weaponType === "POLE" ? "Спис" :
                            selectedItem.weaponType}
              </div>
            )}

            {/* Soulshots/Spiritshots - тільки для зброї */}
            {selectedItem.type === "weapon" && (
              <>
                {selectedItem.soulshots !== undefined && (
                  <div className="text-gray-300 text-[12px] mb-1">
                    Soulshots: {selectedItem.soulshots}
                  </div>
                )}
                {selectedItem.spiritshots !== undefined && (
                  <div className="text-gray-300 text-[12px] mb-1">
                    Spiritshots: {selectedItem.spiritshots}
                  </div>
                )}
              </>
            )}

            {/* Відновлення HP/MP для зілль */}
            {selectedItem.type === "consumable" && selectedItem.category === "potion" && (
              <div className="text-green-400 text-[12px] mb-2">
                {selectedItem.restoreHp && (
                  <div>Відновлює HP: {selectedItem.restoreHp}</div>
                )}
                {selectedItem.restoreMp && (
                  <div>Відновлює MP: {selectedItem.restoreMp}</div>
                )}
              </div>
            )}

            {/* Опис предмета */}
            {selectedItem.description && (
              <div className="text-gray-300 text-[12px] mb-4 border-t border-white/50 pt-2">
                <div className="font-semibold text-[#e0c68a] mb-1">Описание:</div>
                <div className="italic">{selectedItem.description}</div>
              </div>
            )}

            {/* Інформація про сет */}
            {getSetInfo(selectedItem) && (
              <div className="text-yellow-400 text-[12px] mb-2 border-t border-white/50 pt-2">
                <div className="whitespace-pre-line">{getSetInfo(selectedItem)}</div>
              </div>
            )}

            {/* Складування */}
            <div className="text-white text-[12px] mb-2">
              Не складывается
            </div>

            {/* Ціни */}
            <div className="text-yellow-400 text-[12px] mb-1">
              Баз. цена: {selectedItem.price.toLocaleString()}
            </div>
            <div className="text-white text-[12px] mb-4">
              Баз. продажа NPC: {Math.floor(selectedItem.price / 2).toLocaleString()}
            </div>

            {/* ID предмета */}
            <div className="text-white text-[12px] mb-4 border-t border-white/50 pt-2">
              ID предмета: {selectedItem.itemId}
            </div>

            {/* Вибір кількості (особливо для расходників) */}
            {(selectedItem.type === "consumable" || selectedItem.type === "material") && (
              <div className="mb-4 border-t border-white/50 pt-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-white text-[12px]">Кількість:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setBuyQuantity(Math.max(1, buyQuantity - 1))}
                      className="w-6 h-6 flex items-center justify-center bg-[#2a2a2a] text-white text-[12px] rounded hover:bg-[#3a3a3a]"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="30000"
                      value={buyQuantity}
                      onChange={(e) => {
                        let val = e.target.value;
                        // Видаляємо початковий "0" якщо вводиться число
                        if (val.startsWith("0") && val.length > 1) {
                          val = val.replace(/^0+/, "") || "1";
                        }
                        const numVal = parseInt(val) || 1;
                        setBuyQuantity(Math.max(1, Math.min(30000, numVal)));
                      }}
                      onFocus={(e) => {
                        if (e.target.value === "0") {
                          e.target.select();
                        }
                      }}
                      className="w-16 h-6 px-2 bg-[#1a1a1a] text-white text-[12px] text-center border border-white/50 rounded"
                    />
                    <button
                      onClick={() => setBuyQuantity(Math.min(30000, buyQuantity + 1))}
                      className="w-6 h-6 flex items-center justify-center bg-[#2a2a2a] text-white text-[12px] rounded hover:bg-[#3a3a3a]"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="text-yellow-400 text-[12px]">
                  Загальна ціна: {(selectedItem.price * buyQuantity).toLocaleString()} Adena
                </div>
              </div>
            )}

            {/* Кнопки */}
            <div className="flex justify-between gap-2">
              <button
                onClick={() => {
                  handleBuy(selectedItem, buyQuantity);
                }}
                disabled={!hero || hero.adena < selectedItem.price * buyQuantity}
                className={`text-[12px] transition-colors ${
                  !hero || hero.adena < selectedItem.price * buyQuantity
                    ? "text-gray-500 cursor-not-allowed"
                    : "text-green-400 hover:text-green-300"
                }`}
              >
                Купить {buyQuantity > 1 ? `(${buyQuantity})` : ""}
              </button>
              <button
                onClick={() => {
                  setSelectedItem(null);
                  setBuyQuantity(1);
                }}
                className="text-[12px] text-gray-400 hover:text-gray-300 transition-colors"
              >
                Закрыть
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
