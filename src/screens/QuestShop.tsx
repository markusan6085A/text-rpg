// src/screens/QuestShop.tsx
import React, { useState } from "react";
import { QUEST_SHOP_ITEMS } from "../data/shop/questShop";
import type { ShopItem } from "../data/shop/shopTypes";
import { useHeroStore } from "../state/heroStore";
import { itemsDB } from "../data/items/itemsDB";
import { findSetForItem, ARMOR_SETS } from "../data/sets/armorSets";
import { autoDetectArmorType, autoDetectGrade } from "../utils/items/autoDetectArmorType";
import { QUEST_SHOP_ITEM_MAPPING as BASE_QUEST_MAPPING } from "../data/shop/itemMappings";
import type { Hero } from "../types/Hero";
import { updateDailyQuestProgress } from "../utils/dailyQuests/updateDailyQuestProgress";

type Navigate = (path: string) => void;

interface QuestShopProps {
  navigate: Navigate;
}

const QUEST_SHOP_ITEM_MAPPING: Record<number, string> = {
  ...BASE_QUEST_MAPPING, // Використовуємо базовий маппінг з itemMappings.ts
  // Старі записи (якщо потрібно для сумісності)
  190: "d_atuba_mace",
  189: "d_staff_of_life",
  9995: "d_cyclone_bow",
  9996: "d_sages_staff",
  2517: "d_saber_bastard_sword",
  // Armor
  47: "d_helmet",
  58: "d_mithril_breastplate",
  59: "d_mithril_gaiters",
  61: "d_mithril_gloves",
  40: "d_leather_boots",
  // Clan Oath Set
  7850: "clan_oath_helm",
  7857: "clan_oath_aketon",
  7858: "clan_oath_padded_gloves_robe",
  7859: "clan_oath_sandals_robe",
  // Shadow Set
  10020: "shadow_helm",
  10021: "shadow_brigandine",
  10022: "shadow_gloves",
  10023: "shadow_boots",
  // Shadow Oath Set
  10024: "shadow_oath_helm",
  10025: "shadow_oath_armor",
  10026: "shadow_oath_gauntlets",
  10027: "shadow_oath_sabaton",
  // Monster Shield (D-grade)
  10028: "monster_shield",
  // Monster Shield (C-grade)
  10038: "monster_shield_c",
  // Divine Set (C-grade)
  10029: "divine_helmet",
  10030: "divine_tunic",
  10031: "divine_stockings",
  10032: "divine_gloves",
  10033: "divine_boots",
  // Drake Leather Set (C-grade)
  10034: "drake_leather_helmet",
  10035: "drake_leather_armor",
  10036: "drake_leather_gloves",
  10037: "drake_leather_boots",
  // Doom Set (B-grade)
  10039: "doom_helmet",
  10040: "doom_tunic",
  10041: "doom_stockings",
  10042: "doom_gloves",
  10043: "doom_boots",
  // Monster Shield (B-grade)
  10044: "monster_shield_b",
  // Bound Blue Wolf Set (B-grade)
  10045: "bound_blue_wolf_helmet",
  10046: "bound_blue_wolf_armor",
  10047: "bound_blue_wolf_gloves",
  10048: "bound_blue_wolf_boots",
  // Zubei's Set (B-grade)
  10049: "zubeis_helmet",
  10050: "zubeis_breastplate",
  10051: "zubeis_gaiters",
  10052: "zubeis_gauntlets",
  10053: "zubeis_boots",
  // Majestic Heavy Set (A-grade)
  10065: "majestic_heavy_circlet",
  10066: "majestic_heavy_plate_armor",
  10067: "majestic_heavy_gauntlets",
  10068: "majestic_heavy_boots",
  // Nightmare Light Set (A-grade)
  10070: "nightmare_light_helm",
  10071: "nightmare_light_leather_armor",
  10072: "nightmare_light_gauntlets",
  10073: "nightmare_light_boots",
  // Bound Dark Crystal Set (A-grade)
  10075: "bound_dark_crystal_helmet",
  10076: "bound_dark_crystal_robe",
  10077: "bound_dark_crystal_gloves",
  10078: "bound_dark_crystal_boots",
  // Monster Shield (A-grade)
  10080: "monster_shield_a",
  // Moirai Set (S-grade)
  10085: "moirai_circlet",
  10086: "moirai_tunic",
  10087: "moirai_stockings",
  10088: "moirai_gloves",
  10089: "moirai_shoes",
  // Vesper Set (S-grade Heavy)
  10090: "vesper_helmet",
  10091: "vesper_breastplate",
  10092: "vesper_gaiters",
  10093: "vesper_gauntlets",
  10094: "vesper_boots",
  // Vesper Leather Set (S-grade Light)
  10095: "vesper_leather_helmet_quest",
  10096: "vesper_leather_breastplate_quest",
  10097: "vesper_leather_leggings_quest",
  10098: "vesper_leather_gloves_quest",
  10099: "vesper_leather_boots_quest",
  // Vesper Shield (S-grade)
  10100: "vesper_shield",
  // Tattoos
  10001: "tattoo_magic",
  10002: "tattoo_physical",
  10003: "tattoo_defense",
  // Accessories
  10004: "quest_belt",
  10005: "quest_cloak",
  // Enchant Scrolls (blessed)
  10010: "blessed_scroll_enchant_weapon_grade_d",
  10011: "blessed_scroll_enchant_armor_grade_d",
  10012: "blessed_scroll_enchant_weapon_grade_c",
  10013: "blessed_scroll_enchant_armor_grade_c",
  10014: "blessed_scroll_enchant_weapon_grade_b",
  10015: "blessed_scroll_enchant_armor_grade_b",
  10016: "blessed_scroll_enchant_weapon_grade_a",
  10017: "blessed_scroll_enchant_armor_grade_a",
  10018: "blessed_scroll_enchant_weapon_grade_s",
  10019: "blessed_scroll_enchant_armor_grade_s",
  // B-grade зброя (з папки weapon_b)
  78: "quest_weapon_b_apprentices_spellbook",
  7834: "quest_weapon_b_art_of_battle_axe",
  7788: "quest_weapon_b_arthro_nail",
  7792: "quest_weapon_b_baguette_s_dualsword",
  7893: "quest_weapon_b_bellion_cestus",
  7891: "quest_weapon_b_bow_of_peril",
  7890: "quest_weapon_b_dark_elven_long_bow",
  7791: "quest_weapon_b_deadman_s_glory",
  7894: "quest_weapon_b_great_axe",
  7895: "quest_weapon_b_great_sword",
  7883: "quest_weapon_b_guardian_sword",
  7813: "quest_weapon_b_hell_knife",
  7900: "quest_weapon_b_ice_storm_hammer",
  7783: "quest_weapon_b_kris",
  7784: "quest_weapon_b_lance",
  7892: "quest_weapon_b_spell_breaker",
  7889: "quest_weapon_b_spirit_s_staff",
  7896: "quest_weapon_b_staff_of_evil_spirits",
  7901: "quest_weapon_b_star_buster",
  7897: "quest_weapon_b_sword_of_damascus",
  7722: "quest_weapon_b_sword_of_valhalla",
  // A-grade зброя (з папки weapon_a)
  2500: "quest_weapon_a_dark_legions_edge",
  2504: "quest_weapon_a_meteor_shower",
  210: "quest_weapon_a_dasparion_s_staff",
  231: "quest_weapon_a_dragon_grinder",
  290: "quest_weapon_a_elysian",
  304: "quest_weapon_a_halberd",
  88: "quest_weapon_a_sword_of_miracles",
  // Примітка: Багато A-grade зброї мають itemId 2500 (placeholder), можливо потрібно використати унікальні ID
  // S-grade зброя (з папки weapon_s)
  20167: "quest_weapon_s_angel_slayer",
  20170: "quest_weapon_s_arcana_mace",
  20168: "quest_weapon_s_basalt_battlehammer",
  20172: "quest_weapon_s_demon_splinter",
  20173: "quest_weapon_s_draconic_bow",
  20169: "quest_weapon_s_dragon_hunter_axe",
  82: "quest_weapon_s_god_s_blade",
  20166: "quest_weapon_s_heaven_s_divider",
  20171: "quest_weapon_s_imperial_staff",
  20174: "quest_weapon_s_saint_spear",
  // Примітка: Деякі S-grade зброї мають itemId 2500 (placeholder)
};

export default function QuestShop({ navigate }: QuestShopProps) {
  const hero = useHeroStore((s) => s.hero);
  const updateAdena = useHeroStore((s) => s.updateAdena);
  const addItemToInventory = useHeroStore((s) => s.addItemToInventory);
  const updateHero = useHeroStore((s) => s.updateHero);

  const [selectedCategory, setSelectedCategory] = useState<string>("weapons");
  const [selectedGrade, setSelectedGrade] = useState<string>("D");
  const [selectedArmorSubcategory, setSelectedArmorSubcategory] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [buyQuantity, setBuyQuantity] = useState<number>(1);
  const [confirmExchange, setConfirmExchange] = useState<{ type: string; name: string; value: string } | null>(null);

  // Фільтрація предметів
  const filteredItems = QUEST_SHOP_ITEMS.filter((item) => {
    if (selectedCategory === "weapons") {
      if (item.type !== "weapon") return false;
      if (item.grade !== selectedGrade) return false;
      return true;
    }
    if (selectedCategory === "sets") {
      if (item.type !== "armor") return false;
      if (item.grade !== selectedGrade) return false;
      if (selectedArmorSubcategory) {
        if (item.category !== selectedArmorSubcategory) return false;
      }
      return true;
    }
    if (selectedCategory === "items") {
      // Тату та аксесуари (belt, cloak) - всі S-grade, не фільтруємо по грейду
      return item.type === "tattoo" || (item.type === "armor" && (item.category === "belt" || item.category === "cloak"));
    }
    if (selectedCategory === "enchant_scrolls") {
      if (item.category !== "enchant_scroll") return false;
      if (item.grade !== selectedGrade) return false;
      return true;
    }
    if (selectedCategory === "exchange") {
      return false; // Обмінник показує свої елементи окремо
    }
    return false;
  });

  const handleBuy = (item: ShopItem, quantity: number = 1) => {
    if (!hero) return;

    const totalPrice = item.price * quantity;

    // Перевіряємо наявність Серебряных Монет
    const silverCoins = hero.inventory?.find(item => item.id === "coins_silver");
    const coinCount = silverCoins?.count || 0;

    if (coinCount < totalPrice) {
      alert("Недостаточно Серебряных Монет!");
      return;
    }

    // 🔥 КРИТИЧНО: Спочатку використовуємо item.id з ShopItem (унікальний для кожного предмета)
    // Багато A-grade зброї мають itemId 2500 (placeholder) — маппінг 2500→dark_legions_edge давав неправильну іконку
    let itemsDBId: string | undefined = item.id && itemsDB[item.id] ? item.id : QUEST_SHOP_ITEM_MAPPING[item.itemId];
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
      console.error(`[QuestShop] Item not found in itemsDB: itemId=${item.itemId}, name=${item.name}`);
      console.error(`[QuestShop] Available mapping keys:`, Object.keys(QUEST_SHOP_ITEM_MAPPING).slice(0, 10));
      alert(`Помилка: предмет "${item.name}" (ID: ${item.itemId}) не знайдено в itemsDB!`);
      return;
    }

    // Видаляємо Серебряные Монеты та додаємо предмет до інвентаря
    const newInventory = [...(hero.inventory || [])];
    
    // Видаляємо монети
    const coinIndex = newInventory.findIndex(item => item.id === "coins_silver");
    if (coinIndex >= 0) {
      const coin = newInventory[coinIndex];
      if (coin.count && coin.count > totalPrice) {
        newInventory[coinIndex] = { ...coin, count: coin.count - totalPrice };
      } else {
        newInventory.splice(coinIndex, 1);
      }
    }

    // Використовуємо стати з ShopItem, якщо вони є, інакше з itemsDB
    const finalStats = item.stats || itemDef.stats;
    
    // Попереджаємо про невідповідність статів
    if (item.stats && itemDef.stats && JSON.stringify(item.stats) !== JSON.stringify(itemDef.stats)) {
      console.warn(`[QuestShop] Stats mismatch for ${itemsDBId}: ShopItem has ${JSON.stringify(item.stats)}, itemsDB has ${JSON.stringify(itemDef.stats)}. Using ShopItem stats.`);
    }

    // Додаємо предмет до інвентаря (не стакаємо зброю та броню)
    const stackableSlots = ["consumable", "resource", "quest"];
    const canStack = stackableSlots.includes(itemDef.slot);
    const existingItemIndex = newInventory.findIndex((item) => item.id === itemsDBId);

    if (existingItemIndex >= 0 && canStack) {
      // Тільки стакаємо, якщо предмет може стакатися
      const existingItem = newInventory[existingItemIndex];
      existingItem.count = (existingItem.count || 1) + quantity;
    } else {
      // Додаємо новий предмет зі статами з ShopItem
      const grade = itemDef.grade || autoDetectGrade(itemsDBId);
      const armorType = itemDef.armorType || (itemDef.kind === "armor" || itemDef.kind === "helmet" || itemDef.kind === "boots" || itemDef.kind === "gloves" ? autoDetectArmorType(itemsDBId) : undefined);
      
      newInventory.push({
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
      });
    }
    
    // Оновлюємо інвентар з усіма змінами
    updateHero({ inventory: newInventory });
    
    setSelectedItem(null);
    setBuyQuantity(1);
  };

  // Отримання itemsDB ID з ShopItem — спочатку item.id (унікальний), потім маппінг
  const getItemsDBId = (item: ShopItem): string | null => {
    if (item.id && itemsDB[item.id]) return item.id;
    return QUEST_SHOP_ITEM_MAPPING[item.itemId] || null;
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
      if (bonuses.critRate) bonusesList.push(`+${bonuses.critRate}% Крит`);
      if (bonuses.critPower) bonusesList.push(`+${bonuses.critPower} Сила крита`);
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
    // Спочатку перевіряємо чи є іконка безпосередньо в ShopItem
    if (item.icon) {
      return item.icon.startsWith("/") ? item.icon : `/items/${item.icon}`;
    }
    // 🔥 КРИТИЧНО: Використовуємо getItemsDBId (item.id спочатку) — itemId 2500 давав однакові іконки
    const itemsDBId = getItemsDBId(item);
    if (itemsDBId && itemsDB[itemsDBId]?.icon) {
      const icon = itemsDB[itemsDBId].icon;
      return icon.startsWith("/") ? icon : `/items/${icon}`;
    }
    if (item.itemId) {
      return `/items/drops/items/${item.itemId}.jpg`;
    }
    return "/items/drops/Weapon_squires_sword_i00_0.jpg"; // дефолтна іконка
  };

  return (
    <div className="w-full max-w-[360px] mx-auto px-3 py-2">
      {/* Заголовок */}
      <div className="border-b border-black/70 px-4 py-2 text-center text-[11px] text-[#ff8c00] tracking-[0.12em] uppercase font-semibold">
        Квест-Шоп
      </div>

      {/* Баланс Срібних Монет */}
      <div className="px-4 py-2 border-b border-black/70 text-[12px] text-[#cfcfcc] flex items-center gap-1">
        У вас с собой{" "}
        <img 
          src="/items/drops/resources/etc_coins_silver_i00.png" 
          alt="Серебряные Монеты" 
          className="w-4 h-4 object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <span className="text-yellow-400 font-semibold">
          {(() => {
            const silverCoins = hero?.inventory?.find(item => item.id === "coins_silver");
            return (silverCoins?.count || 0).toLocaleString();
          })()}
        </span>{" "}
        Серебряные Монеты
      </div>

      {/* Категорії */}
      <div className="px-4 py-2 border-b border-black/70">
        <div className="text-[11px] text-gray-300 flex gap-1.5 mb-2 flex-nowrap items-center">
          <button
            onClick={() => {
              setSelectedCategory("weapons");
              setSelectedGrade("D");
              setSelectedArmorSubcategory(null);
            }}
            className={`px-1.5 py-0.5 text-[11px] whitespace-nowrap ${selectedCategory === "weapons" ? "text-gray-200 font-semibold border-b border-white/60" : "hover:text-gray-200"}`}
          >
            Оружие
          </button>
          <span className="text-gray-500 text-[10px]">|</span>
          <button
            onClick={() => {
              setSelectedCategory("sets");
              setSelectedGrade("D");
              setSelectedArmorSubcategory(null);
            }}
            className={`px-1.5 py-0.5 text-[11px] whitespace-nowrap ${selectedCategory === "sets" ? "text-gray-200 font-semibold border-b border-white/60" : "hover:text-gray-200"}`}
          >
            Сеты
          </button>
          <span className="text-gray-500 text-[10px]">|</span>
          <button
            onClick={() => {
              setSelectedCategory("items");
              setSelectedArmorSubcategory(null);
            }}
            className={`px-1.5 py-0.5 text-[11px] whitespace-nowrap ${selectedCategory === "items" ? "text-gray-200 font-semibold border-b border-white/60" : "hover:text-gray-200"}`}
          >
            Итемы
          </button>
          <span className="text-gray-500 text-[10px]">|</span>
          <button
            onClick={() => {
              setSelectedCategory("enchant_scrolls");
              setSelectedGrade("D");
              setSelectedArmorSubcategory(null);
            }}
            className={`px-1.5 py-0.5 text-[11px] whitespace-nowrap ${selectedCategory === "enchant_scrolls" ? "text-gray-200 font-semibold border-b border-white/60" : "hover:text-gray-200"}`}
          >
            Заточки
          </button>
          <span className="text-gray-500 text-[10px]">|</span>
          <button
            onClick={() => {
              setSelectedCategory("exchange");
              setSelectedArmorSubcategory(null);
            }}
            className={`px-1.5 py-0.5 text-[11px] whitespace-nowrap ${selectedCategory === "exchange" ? "text-gray-200 font-semibold border-b border-white/60" : "hover:text-gray-200"}`}
          >
            Обменник
          </button>
        </div>

        {/* Фільтри по грейдах (для всіх категорій) */}
        {(selectedCategory === "weapons" || selectedCategory === "sets" || selectedCategory === "enchant_scrolls") && (
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

        {/* Підкатегорії для броні */}
        {selectedCategory === "sets" && (
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
      </div>

      {/* Список предметів */}
      <div className="px-4 py-2 border-b border-black/70">
        {selectedCategory === "exchange" ? (
          <div className="space-y-0">
            {/* Обмін на Адену */}
            <button
              onClick={() => {
                if (!hero) return;
                const silverCoins = hero.inventory?.find(item => item.id === "coins_silver");
                const coinCount = silverCoins?.count || 0;
                if (coinCount < 10) {
                  return;
                }
                setConfirmExchange({ type: "adena", name: "Адена", value: "50,000" });
              }}
              className="w-full flex items-center justify-between py-2 px-3 hover:bg-black/20 shadow-[inset_0_0_10px_rgba(0,0,0,0.3)]"
            >
              <div className="flex items-center gap-2">
                <img src="/items/drops/resources/aden.png" alt="Адена" className="w-5 h-5 object-contain" />
                <span className="text-[12px] text-[#e0c68a]">Адена</span>
                <span className="text-[12px] text-yellow-400 font-semibold">50,000</span>
              </div>
              <div className="flex items-center gap-1">
                <img src="/items/drops/resources/etc_coins_silver_i00.png" alt="Серебряные Монеты" className="w-4 h-4 object-contain" />
                <span className="text-[12px] text-gray-400">10 Серебряных Монет</span>
              </div>
            </button>

            {/* Риска */}
            <div className="text-gray-500 text-center text-[12px] py-1">─ ─ ─</div>

            {/* Обмін на EXP */}
            <button
              onClick={() => {
                if (!hero) return;
                const silverCoins = hero.inventory?.find(item => item.id === "coins_silver");
                const coinCount = silverCoins?.count || 0;
                if (coinCount < 10) {
                  return;
                }
                setConfirmExchange({ type: "exp", name: "Опыт", value: "100,000" });
              }}
              className="w-full flex items-center justify-between py-2 px-3 hover:bg-black/20 shadow-[inset_0_0_10px_rgba(0,0,0,0.3)]"
            >
              <div className="flex items-center gap-2">
                <img src="/items/drops/resources/exp_.png" alt="Опыт" className="w-5 h-5 object-contain" />
                <span className="text-[12px] text-[#e0c68a]">Опыт</span>
                <span className="text-[12px] text-green-400 font-semibold">100,000</span>
              </div>
              <div className="flex items-center gap-1">
                <img src="/items/drops/resources/etc_coins_silver_i00.png" alt="Серебряные Монеты" className="w-4 h-4 object-contain" />
                <span className="text-[12px] text-gray-400">10 Серебряных Монет</span>
              </div>
            </button>

            {/* Риска */}
            <div className="text-gray-500 text-center text-[12px] py-1">─ ─ ─</div>

            {/* Обмін на SP */}
            <button
              onClick={() => {
                if (!hero) return;
                const silverCoins = hero.inventory?.find(item => item.id === "coins_silver");
                const coinCount = silverCoins?.count || 0;
                if (coinCount < 10) {
                  return;
                }
                setConfirmExchange({ type: "sp", name: "SP", value: "50,000" });
              }}
              className="w-full flex items-center justify-between py-2 px-3 hover:bg-black/20 shadow-[inset_0_0_10px_rgba(0,0,0,0.3)]"
            >
              <div className="flex items-center gap-2">
                <img src="/items/drops/resources/sp_SP.png" alt="SP" className="w-5 h-5 object-contain" />
                <span className="text-[12px] text-[#e0c68a]">SP</span>
                <span className="text-[12px] text-blue-400 font-semibold">50,000</span>
              </div>
              <div className="flex items-center gap-1">
                <img src="/items/drops/resources/etc_coins_silver_i00.png" alt="Серебряные Монеты" className="w-4 h-4 object-contain" />
                <span className="text-[12px] text-gray-400">10 Серебряных Монет</span>
              </div>
            </button>

            {/* Риска */}
            <div className="text-gray-500 text-center text-[12px] py-1">─ ─ ─</div>

            {/* Обмін на Coin of Luck */}
            <button
              onClick={() => {
                if (!hero) return;
                const silverCoins = hero.inventory?.find(item => item.id === "coins_silver");
                const coinCount = silverCoins?.count || 0;
                if (coinCount < 10) {
                  return;
                }
                setConfirmExchange({ type: "coinOfLuck", name: "Coin of Luck", value: "1" });
              }}
              className="w-full flex items-center justify-between py-2 px-3 hover:bg-black/20 shadow-[inset_0_0_10px_rgba(0,0,0,0.3)]"
            >
              <div className="flex items-center gap-2">
                <img src="/items/drops/resources/monets.png" alt="Coin of Luck" className="w-5 h-5 object-contain" />
                <span className="text-[12px] text-[#e0c68a]">Coin of Luck</span>
                <span className="text-[12px] text-[#ffd700] font-semibold">1</span>
              </div>
              <div className="flex items-center gap-1">
                <img src="/items/drops/resources/etc_coins_silver_i00.png" alt="Серебряные Монеты" className="w-4 h-4 object-contain" />
                <span className="text-[12px] text-gray-400">10 Серебряных Монет</span>
              </div>
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center text-[#9f8d73] text-[12px] py-4">
            Предметы не найдены
          </div>
        ) : (
          <div className="space-y-1">
            {filteredItems.map((item) => (
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
              </div>
            ))}
          </div>
        )}
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
                {selectedItem.stats.maxHp !== undefined && (
                  <div className="text-red-400">
                  Max HP: +{selectedItem.stats.maxHp}
                </div>
                )}
                {selectedItem.stats.maxHpPercent !== undefined && (
                  <div className="text-red-400">
                  Max HP: +{selectedItem.stats.maxHpPercent}%
                </div>
                )}
                {selectedItem.stats.pDefPercent !== undefined && (
                  <div className="text-yellow-400">
                  Физ. защ: +{selectedItem.stats.pDefPercent}%
                </div>
                )}
                {selectedItem.stats.mDefPercent !== undefined && (
                  <div className="text-purple-400">
                  Маг. защ: +{selectedItem.stats.mDefPercent}%
                </div>
                )}
                {selectedItem.stats.pAtkPercent !== undefined && (
                  <div className="text-orange-400">
                  Физ. урон: +{selectedItem.stats.pAtkPercent}%
                </div>
                )}
                {selectedItem.stats.mAtkPercent !== undefined && (
                  <div className="text-blue-400">
                  Маг. урон: +{selectedItem.stats.mAtkPercent}%
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
                            selectedItem.weaponType === "DUALSWORD" ? "Дуальні Мечі" :
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

            {/* Опис предмета */}
            {selectedItem.description && (
              <div className="text-gray-300 text-[12px] mb-2 italic">
                {selectedItem.description}
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
            <div className="text-yellow-400 text-[12px] mb-1 flex items-center gap-1">
              Цена: {selectedItem.price} 
              <img src="/items/drops/resources/etc_coins_silver_i00.png" alt="Серебряные Монеты" className="w-3 h-3 object-contain" />
            </div>

            {/* ID предмета */}
            <div className="text-white text-[12px] mb-4 border-t border-white/50 pt-2">
              ID предмета: {selectedItem.itemId}
            </div>

            {/* Вибір кількості */}
            <div className="mb-4 border-t border-white/50 pt-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-white text-[12px]">Кількість:</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setBuyQuantity(Math.max(1, buyQuantity - 1))}
                    className="px-2 py-1 bg-[#1a1208] text-white border border-white/50 rounded text-[12px] hover:bg-[#2a1a10]"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={buyQuantity}
                    onChange={(e) => {
                      let val = e.target.value;
                      // Видаляємо початковий "0" якщо вводиться число
                      if (val.startsWith("0") && val.length > 1) {
                        val = val.replace(/^0+/, "") || "1";
                      }
                      const numVal = parseInt(val) || 1;
                      setBuyQuantity(Math.max(1, numVal));
                    }}
                    onFocus={(e) => {
                      if (e.target.value === "0") {
                        e.target.select();
                      }
                    }}
                    className="w-16 px-2 py-1 bg-[#1a1208] text-white border border-white/50 rounded text-center text-[12px]"
                  />
                  <button
                    onClick={() => setBuyQuantity(buyQuantity + 1)}
                    className="px-2 py-1 bg-[#1a1208] text-white border border-white/50 rounded text-[12px] hover:bg-[#2a1a10]"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="text-yellow-400 text-[12px] mb-2 flex items-center gap-1">
                Итого: {selectedItem.price * buyQuantity} 
                <img src="/items/drops/resources/etc_coins_silver_i00.png" alt="Серебряные Монеты" className="w-3 h-3 object-contain" />
              </div>
            </div>

            {/* Кнопки */}
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => handleBuy(selectedItem, buyQuantity)}
                className="text-green-400 text-[12px] py-2 hover:text-green-300 cursor-pointer"
              >
                Купить
              </button>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-gray-400 text-[12px] py-2 hover:text-gray-300 cursor-pointer"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальне вікно підтвердження обміну */}
      {confirmExchange && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setConfirmExchange(null)}
        >
          <div 
            className="bg-[#14110c] border border-white/40 rounded-lg p-4 max-w-[350px] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center text-gray-400 text-[14px] mb-4">
              Обменять 10 Серебряных Монет на {confirmExchange.name} {confirmExchange.value}?
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  if (!hero) return;
                  const silverCoins = hero.inventory?.find(item => item.id === "coins_silver");
                  const coinCount = silverCoins?.count || 0;
                  if (coinCount < 10) {
                    setConfirmExchange(null);
                    return;
                  }
                  
                  // Видаляємо 10 Срібних Монет
                  const newInventory = [...(hero.inventory || [])];
                  const coinIndex = newInventory.findIndex(item => item.id === "coins_silver");
                  if (coinIndex >= 0) {
                    const coin = newInventory[coinIndex];
                    if (coin.count && coin.count > 10) {
                      newInventory[coinIndex] = { ...coin, count: coin.count - 10 };
                    } else {
                      newInventory.splice(coinIndex, 1);
                    }
                  }
                  
                  // Додаємо відповідну нагороду
                  const updates: Partial<Hero> = { inventory: newInventory };
                  if (confirmExchange.type === "adena") {
                    updates.adena = (hero.adena || 0) + 50000;
                  } else if (confirmExchange.type === "exp") {
                    updates.exp = (hero.exp || 0) + 100000;
                  } else if (confirmExchange.type === "sp") {
                    updates.sp = (hero.sp || 0) + 50000;
                  } else if (confirmExchange.type === "coinOfLuck") {
                    updates.coinOfLuck = (hero.coinOfLuck || 0) + 1;
                  }
                  
                  // Оновлюємо прогрес щоденних завдань: обмін Quest Items
                  const updatedProgress = updateDailyQuestProgress(hero, "daily_exchange", 1);
                  if (updatedProgress !== hero.dailyQuestsProgress) {
                    updates.dailyQuestsProgress = updatedProgress;
                  }
                  
                  updateHero(updates);
                  setConfirmExchange(null);
                }}
                className="text-[#ff8c00] text-[12px] hover:text-[#ffa500] cursor-pointer"
              >
                Подтвердить
              </button>
              <button
                onClick={() => setConfirmExchange(null)}
                className="text-gray-400 text-[12px] hover:text-gray-300 cursor-pointer"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

