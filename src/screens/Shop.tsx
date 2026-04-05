// src/screens/Shop.tsx
import React, { useState, useEffect } from "react";
import { NG_GRADE_SHOP_ITEMS } from "../data/shop/ngGradeShop";
import { D_GRADE_SHOP_ITEMS } from "../data/shop/dGradeShop";
import { C_GRADE_SHOP_ITEMS } from "../data/shop/cGradeShop";
import { B_GRADE_SHOP_ITEMS } from "../data/shop/bGradeShop";
import { A_GRADE_SHOP_ITEMS } from "../data/shop/aGradeShop";
import { S_GRADE_SHOP_ITEMS } from "../data/shop/sGradeShop";
import { CONSUMABLES_SHOP_ITEMS } from "../data/shop/consumablesShop";
import type { ShopItem } from "../data/shop/shopTypes";
import { useHeroStore } from "../state/heroStore";
import { itemsDB, itemsDBWithStarter } from "../data/items/itemsDB";
import { findSetForItem, ARMOR_SETS, formatSetStatsForDisplay } from "../data/sets/armorSets";
import { SHOP_ITEM_ID_MAPPING } from "../data/shop/itemMappings";
import { autoDetectArmorType, autoDetectGrade } from "../utils/items/autoDetectArmorType";
import { showToast } from "../state/toastStore";
import { isWarmCityUi, getCityUiVariant } from "../utils/cityUiVariant";
import { SetBonusDisplay } from "./character/SetBonusDisplay";
import { L2_WARM_OUTER_FRAME } from "../utils/l2WarmLayoutClassNames";
import { isMagicWeaponForEnchant } from "../utils/stats/weaponEnchantBonuses";
import { shopBuyAPI } from "../utils/api/shopAPI";

// У категорії «Стрелы» тільки стріли грейдів NG, D, C, B, A, S (один тип на грейд)
const ARROW_GRADE_IDS = ["wooden_arrow", "bone_arrow", "fine_steel_arrow", "silver_arrow", "mithril_arrow", "shining_arrow"];

type Navigate = (path: string) => void;

interface ShopProps {
  navigate: Navigate;
}

const ITEMS_PER_PAGE = 10;

export default function Shop({ navigate }: ShopProps) {
  const hero = useHeroStore((s) => s.hero);

  const [selectedCategory, setSelectedCategory] = useState<string>("weapons");
  const [selectedGrade, setSelectedGrade] = useState<string>("D");

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const cat = q.get("category");
    if (cat === "materials") {
      setSelectedCategory("materials");
    }
  }, []);
  const [selectedArmorSubcategory, setSelectedArmorSubcategory] = useState<string | null>(null);
  const [selectedJewelrySubcategory, setSelectedJewelrySubcategory] = useState<string | null>(null);
  const [selectedConsumablesSubcategory, setSelectedConsumablesSubcategory] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [buyQuantity, setBuyQuantity] = useState<number>(1);
  const [weaponKindFilter, setWeaponKindFilter] = useState<"all" | "phys" | "magic">("all");

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
      if (selectedConsumablesSubcategory === "arrows") {
        if (item.category !== "arrow") return false;
        const itemsDBId = SHOP_ITEM_ID_MAPPING[item.itemId as keyof typeof SHOP_ITEM_ID_MAPPING];
        if (!itemsDBId || !ARROW_GRADE_IDS.includes(itemsDBId)) return false;
      }
      if (selectedConsumablesSubcategory === "potions" && item.category !== "potion") return false;
      // Якщо підкатегорія не вибрана, показуємо всі расходники
    }
    
    // Фільтр по грейду (тільки для weapons, armor, jewelry) - без NG
    if ((selectedCategory === "weapons" || selectedCategory === "armor" || selectedCategory === "jewelry") && item.grade !== selectedGrade) {
      return false;
    }

    if (selectedCategory === "weapons" && weaponKindFilter !== "all") {
      let itemsDBId: string | undefined = item.id && itemsDB[item.id] ? item.id : SHOP_ITEM_ID_MAPPING[item.itemId as keyof typeof SHOP_ITEM_ID_MAPPING];
      let itemDef = itemsDBId ? itemsDB[itemsDBId] : undefined;
      if (!itemDef && item.name) {
        const itemNameLower = item.name.toLowerCase().replace(/\[.*?\]/g, "").trim();
        itemsDBId = Object.keys(itemsDB).find((key) => {
          const dbItem = itemsDB[key];
          return dbItem?.name?.toLowerCase().replace(/\[.*?\]/g, "").trim() === itemNameLower;
        });
        if (itemsDBId) itemDef = itemsDB[itemsDBId];
      }
      if (itemDef && itemsDBId) {
        const isMag = isMagicWeaponForEnchant(itemsDBId, itemDef);
        if (weaponKindFilter === "phys" && isMag) return false;
        if (weaponKindFilter === "magic" && !isMag) return false;
      }
    }
    
    return true;
  });

  // Пагінація
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const [buying, setBuying] = useState(false);
  const applyServerShopSnapshot = (result: { heroJson: any; adena: number; coinsSilver?: number }) => {
    const store = useHeroStore.getState();
    const currentHero = store.hero;
    if (!currentHero) return;
    const serverHeroJson = result.heroJson ?? {};
    const nextInventory = Array.isArray(serverHeroJson.inventory)
      ? serverHeroJson.inventory
      : (currentHero.inventory ?? []);
    const nextOverflow = Array.isArray(serverHeroJson.overflowChest)
      ? serverHeroJson.overflowChest
      : (currentHero.overflowChest ?? []);
    const heroRevision = Number(serverHeroJson.heroRevision ?? (currentHero as any)?.heroJson?.heroRevision ?? 0);
    const nextAdena = Number(result.adena ?? currentHero.adena ?? 0);
    const nextCoinsSilver = Number(result.coinsSilver ?? (currentHero as any)?.coins_silver ?? 0);
    store.applyServerSync(
      {
        inventory: nextInventory,
        overflowChest: nextOverflow,
        adena: nextAdena,
        coins_silver: nextCoinsSilver,
        heroJson: {
          ...((currentHero as any)?.heroJson ?? {}),
          ...serverHeroJson,
          inventory: nextInventory,
          overflowChest: nextOverflow,
          heroRevision,
        },
      } as any,
      {
        adena: nextAdena,
        heroRevision,
        updatedAt: Date.now(),
      }
    );
  };

  const handleBuy = async (item: ShopItem, quantity: number = 1) => {
    if (!hero) return;
    if (buying) return;

    const totalPrice = item.price * quantity;

    if (hero.adena < totalPrice) {
      showToast("Недостатньо Adena!", "error");
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
      showToast(`Помилка: предмет "${item.name}" не знайдено в itemsDB`, "error");
      return;
    }

    // Використовуємо стати з ShopItem, якщо вони є, інакше з itemsDB
    const finalStats = item.stats || itemDef.stats;
    
    // Попереджаємо про невідповідність статів
    if (item.stats && itemDef.stats && JSON.stringify(item.stats) !== JSON.stringify(itemDef.stats)) {
      console.warn(`[Shop] Stats mismatch for ${itemsDBId}: ShopItem has ${JSON.stringify(item.stats)}, itemsDB has ${JSON.stringify(itemDef.stats)}. Using ShopItem stats.`);
    }

    const grade = itemDef.grade || autoDetectGrade(itemsDBId);
    const armorType =
      itemDef.armorType ||
      (itemDef.kind === "armor" ||
      itemDef.kind === "helmet" ||
      itemDef.kind === "boots" ||
      itemDef.kind === "gloves"
        ? autoDetectArmorType(itemsDBId)
        : undefined);

    const itemMeta = {
      id: itemDef.id,
      name: itemDef.name,
      slot: itemDef.slot,
      kind: itemDef.kind,
      icon: itemDef.icon,
      description: itemDef.description,
      stats: finalStats,
      grade,
      armorType,
    };
    const liveHero = useHeroStore.getState().hero;
    const expectedRevisionRaw =
      typeof (liveHero as any)?.heroJson?.heroRevision === "number"
        ? Number((liveHero as any).heroJson.heroRevision)
        : Number(useHeroStore.getState().serverState?.heroRevision ?? 0);
    const expectedRevision =
      Number.isFinite(expectedRevisionRaw) && expectedRevisionRaw >= 0 ? expectedRevisionRaw : 0;
    setBuying(true);
    try {
      const result = await shopBuyAPI({
        itemId: itemMeta.id,
        quantity,
        shopType: "regular",
        itemMeta,
        expectedRevision,
      });
      if (!result?.ok || !result.heroJson) {
        showToast("Сервер відхилив покупку.", "error");
        return;
      }
      applyServerShopSnapshot(result);
      setSelectedItem(null);
      setBuyQuantity(1);
    } catch (e: any) {
      if (e?.status === 409) {
        showToast("Дані персонажа застаріли. Оновлюю стан...", "error");
      } else if (e?.status === 400) {
        showToast("Покупку відхилено сервером.", "error");
      } else {
        showToast(e?.message || "Не вдалося виконати покупку.", "error");
      }
    } finally {
      setBuying(false);
    }
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
    bonusesList.push(...formatSetStatsForDisplay(set.bonuses.setStats));
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

    // Нічого не показуємо, якщо немає бонусів
    if (bonusesList.length === 0) return null;

    let result = `\n\n[Сет: ${set.name}]\n`;
    result += `Повний сет: ${bonusesList.join(", ")}\n`;
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

  const isL2 = isWarmCityUi(getCityUiVariant());
  const l2Frame = L2_WARM_OUTER_FRAME;
  const rowL2 =
    "flex items-center gap-2 py-2 px-2 mb-1.5 rounded-md bg-gradient-to-b from-[#2e2619] to-[#14110c] border border-[#5c4a32]/75 shadow-[inset_0_1px_0_rgba(199,173,128,0.12)] hover:border-[#c7ad80]/50 transition-[border-color] duration-150";
  const borderB = isL2 ? "border-b border-[#5c4a32]/45" : "border-b border-black/70";
  const tabOn = isL2 ? "text-[#e8c56e] font-semibold border-b border-[#c9a44c]" : "text-gray-200 font-semibold border-b border-white/60";
  const tabOff = isL2 ? "text-[#a89878] hover:text-[#d4c4a8]" : "hover:text-gray-200";
  const subTabOn = isL2 ? "text-[#e8c56e] font-bold" : "text-gray-400 font-bold";
  const subTabOff = isL2 ? "text-[#8a7a60] font-semibold hover:text-[#c9a44c]" : "text-gray-500 font-semibold hover:text-gray-400";
  const modalPanel = isL2
    ? "bg-[#14110c] border border-[#5c4a32] rounded-lg p-4 w-full shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
    : "bg-[#14110c] border border-white/40 rounded-lg p-4 w-full";

  return (
    <div
      className={
        isL2
          ? `${l2Frame} w-full min-w-0 my-1 px-3 py-3 text-[#d4c4a8]`
          : "w-full"
      }
    >
      <div className={isL2 ? "max-w-[420px] mx-auto w-full" : ""}>
      {/* Заголовок */}
      <div
        className={`${borderB} px-4 py-2 text-center text-[11px] tracking-[0.12em] uppercase ${
          isL2 ? "text-[#e8c56e] [text-shadow:0_1px_2px_rgba(0,0,0,0.85)]" : "text-[#f4e2b8]"
        }`}
      >
        Магазин вещей
      </div>

      {/* Баланс */}
      <div className={`px-4 py-2 ${borderB} text-[12px] ${isL2 ? "text-[#d4c4a8]" : "text-[#cfcfcc]"}`}>
        У вас с собой <span className="text-yellow-400 font-semibold">{hero?.adena.toLocaleString() || 0}</span> адены
      </div>

      {/* Категорії */}
      <div className={`px-4 py-2 ${borderB}`}>
        <div className={`text-[11px] flex gap-1.5 mb-2 flex-nowrap items-center ${isL2 ? "text-[#c9b896]" : "text-gray-300"}`}>
          <button
            onClick={() => {
              setSelectedCategory("weapons");
              setSelectedGrade("D");
              setSelectedArmorSubcategory(null);
              setSelectedJewelrySubcategory(null);
              setSelectedConsumablesSubcategory(null);
              setWeaponKindFilter("all");
              setCurrentPage(1);
            }}
            className={`px-1.5 py-0.5 text-[11px] whitespace-nowrap ${selectedCategory === "weapons" ? tabOn : tabOff}`}
          >
            Оружие
          </button>
          <span className={isL2 ? "text-[#6b5c42] text-[10px]" : "text-gray-500 text-[10px]"}>|</span>
          <button
            onClick={() => {
              setSelectedCategory("armor");
              setSelectedGrade("D");
              setSelectedArmorSubcategory(null);
              setSelectedJewelrySubcategory(null);
              setSelectedConsumablesSubcategory(null);
              setCurrentPage(1);
            }}
            className={`px-1.5 py-0.5 text-[11px] whitespace-nowrap ${selectedCategory === "armor" ? tabOn : tabOff}`}
          >
            Броня
          </button>
          <span className={isL2 ? "text-[#6b5c42] text-[10px]" : "text-gray-500 text-[10px]"}>|</span>
          <button
            onClick={() => {
              setSelectedCategory("jewelry");
              setSelectedGrade("D");
              setSelectedArmorSubcategory(null);
              setSelectedJewelrySubcategory(null);
              setSelectedConsumablesSubcategory(null);
              setCurrentPage(1);
            }}
            className={`px-1.5 py-0.5 text-[11px] whitespace-nowrap ${selectedCategory === "jewelry" ? tabOn : tabOff}`}
          >
            Биж
          </button>
          <span className={isL2 ? "text-[#6b5c42] text-[10px]" : "text-gray-500 text-[10px]"}>|</span>
          <button
            onClick={() => {
              setSelectedCategory("materials");
              setSelectedArmorSubcategory(null);
              setSelectedJewelrySubcategory(null);
              setSelectedConsumablesSubcategory(null);
              setCurrentPage(1);
            }}
            className={`px-1.5 py-0.5 text-[11px] whitespace-nowrap ${selectedCategory === "materials" ? tabOn : tabOff}`}
          >
            Материалы
          </button>
          <span className={isL2 ? "text-[#6b5c42] text-[10px]" : "text-gray-500 text-[10px]"}>|</span>
          <button
            onClick={() => {
              setSelectedCategory("consumables");
              setSelectedArmorSubcategory(null);
              setSelectedJewelrySubcategory(null);
              setSelectedConsumablesSubcategory(null);
              setCurrentPage(1);
            }}
            className={`px-1.5 py-0.5 text-[11px] whitespace-nowrap ${selectedCategory === "consumables" ? tabOn : tabOff}`}
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
                  selectedConsumablesSubcategory === subcat.id ? subTabOn : subTabOff
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
                  selectedArmorSubcategory === subcat.id ? subTabOn : subTabOff
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
                  selectedJewelrySubcategory === subcat.id ? subTabOn : subTabOff
                }`}
              >
                {subcat.name}
              </button>
            ))}
          </div>
        )}

        {selectedCategory === "weapons" && (
          <div className="flex gap-1 mt-2 flex-nowrap overflow-x-auto">
            {[
              { id: "all" as const, name: "Все" },
              { id: "phys" as const, name: "Физ. оружие" },
              { id: "magic" as const, name: "Маг. оружие" },
            ].map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => {
                  setWeaponKindFilter(sub.id);
                  setCurrentPage(1);
                }}
                className={`px-1.5 py-0.5 text-[11px] whitespace-nowrap flex-shrink-0 ${
                  weaponKindFilter === sub.id ? subTabOn : subTabOff
                }`}
              >
                {sub.name}
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
      <div className={`px-4 py-2 ${borderB}`}>
        {paginatedItems.length === 0 ? (
          <div className="text-center text-[#9f8d73] text-[12px] py-4">
            Предметів не знайдено
          </div>
        ) : (
          <div className="space-y-1">
            {paginatedItems.map((item) => (
              <div
                key={item.id}
                className={
                  isL2
                    ? rowL2
                    : "flex items-center gap-2 py-1.5 border-b border-solid border-white/30 hover:bg-black/20"
                }
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
                {/* Назва - клікабельна; для стріл показуємо грейд [NG]/[D]/[C]/[B]/[A]/[S] */}
                <div 
                  className="flex-1 text-[12px] text-[#e0c68a] cursor-pointer hover:text-[#f4e2b8]"
                  onClick={() => {
                    setSelectedItem(item);
                    setBuyQuantity(1);
                  }}
                >
                  {selectedCategory === "consumables" && selectedConsumablesSubcategory === "arrows" && item.grade
                    ? `${item.name} [${item.grade}]`
                    : item.name}
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
        <div className={`px-4 py-2 ${borderB} text-center text-[12px] ${isL2 ? "text-[#c9a44c]" : "text-[#e0c68a]"}`}>
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
          onClick={() => navigate("/shop/sell")}
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
            className={`${modalPanel} max-w-[400px]`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Заголовок */}
            <div
              className={`text-center text-lg font-bold mb-4 pb-2 border-b ${
                isL2 ? "text-[#e8c56e] border-[#5c4a32]/55" : "text-white border-white/50"
              }`}
            >
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

            {/* Стати — з ShopItem або itemsDB */}
            {(() => {
              const itemsDBId = getItemsDBId(selectedItem);
              const itemDef = itemsDBId ? (itemsDB[itemsDBId] || itemsDBWithStarter[itemsDBId]) : null;
              const displayStats = selectedItem.stats ?? itemDef?.stats;
              if (!displayStats) return null;
              return (
                <div className="space-y-1 mb-4 text-[12px]">
                  {displayStats.pAtk !== undefined && (
                    <div className="text-orange-400">Физ. атк: {displayStats.pAtk}</div>
                  )}
                  {displayStats.mAtk !== undefined && (
                    <div className="text-green-400">Маг. атк: {displayStats.mAtk}</div>
                  )}
                  {displayStats.pDef !== undefined && (
                    <div className="text-yellow-400">Физ. защ: {displayStats.pDef}</div>
                  )}
                  {displayStats.mDef !== undefined && (
                    <div className="text-purple-400">Маг. защ: {displayStats.mDef}</div>
                  )}
                  {displayStats.rCrit !== undefined && (
                    <div className="text-purple-400">Крит: {displayStats.rCrit}</div>
                  )}
                  {displayStats.pAtkSpd !== undefined && (
                    <div className="text-yellow-400">Скорость боя: {displayStats.pAtkSpd}</div>
                  )}
                  {displayStats.castSpeed !== undefined && (
                    <div className="text-cyan-400">Скорость каста: {displayStats.castSpeed}</div>
                  )}
                  {displayStats.maxHp !== undefined && (
                    <div className="text-red-400">Max HP: +{displayStats.maxHp}</div>
                  )}
                  {displayStats.maxHpPercent !== undefined && (
                    <div className="text-red-400">Max HP: +{displayStats.maxHpPercent}%</div>
                  )}
                  {displayStats.pDefPercent !== undefined && (
                    <div className="text-yellow-400">Физ. защ: +{displayStats.pDefPercent}%</div>
                  )}
                  {displayStats.mDefPercent !== undefined && (
                    <div className="text-purple-400">Маг. защ: +{displayStats.mDefPercent}%</div>
                  )}
                  {displayStats.pAtkPercent !== undefined && (
                    <div className="text-orange-400">Физ. урон: +{displayStats.pAtkPercent}%</div>
                  )}
                  {displayStats.mAtkPercent !== undefined && (
                    <div className="text-blue-400">Маг. урон: +{displayStats.mAtkPercent}%</div>
                  )}
                </div>
              );
            })()}

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
                <SetBonusDisplay text={getSetInfo(selectedItem)!} />
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
                      onFocus={(e) => e.target.select()}
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
                  void handleBuy(selectedItem, buyQuantity);
                }}
                disabled={buying || !hero || hero.adena < selectedItem.price * buyQuantity}
                className={`text-[12px] transition-colors ${
                  buying || !hero || hero.adena < selectedItem.price * buyQuantity
                    ? "text-gray-500 cursor-not-allowed"
                    : "text-green-400 hover:text-green-300"
                }`}
              >
                {buying ? "..." : `Купить ${buyQuantity > 1 ? `(${buyQuantity})` : ""}`}
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
      </div>
    </div>
  );
}
