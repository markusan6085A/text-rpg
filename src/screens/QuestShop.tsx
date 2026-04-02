// src/screens/QuestShop.tsx
import React, { useState } from "react";
import { QUEST_SHOP_ITEMS } from "../data/shop/questShop";
import type { ShopItem } from "../data/shop/shopTypes";
import { useHeroStore } from "../state/heroStore";
import { addDailyProgress } from "../state/dailyQuestsProgress";
import { itemsDB, itemsDBWithStarter } from "../data/items/itemsDB";
import { findSetForItem, ARMOR_SETS, formatSetStatsForDisplay } from "../data/sets/armorSets";
import { autoDetectArmorType, autoDetectGrade } from "../utils/items/autoDetectArmorType";
import { QUEST_SHOP_ITEM_MAPPING as BASE_QUEST_MAPPING } from "../data/shop/itemMappings";
import type { Hero } from "../types/Hero";
import { showToast } from "../state/toastStore";
import { isWarmCityUi, getCityUiVariant } from "../utils/cityUiVariant";
import { SetBonusDisplay } from "./character/SetBonusDisplay";
import { L2_WARM_OUTER_FRAME } from "../utils/l2WarmLayoutClassNames";

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
  101201: "tattoo_magic_c",
  101202: "tattoo_magic_b",
  101203: "tattoo_magic_a",
  101204: "tattoo_magic_s",
  101205: "tattoo_physical_c",
  101206: "tattoo_physical_b",
  101207: "tattoo_physical_a",
  101208: "tattoo_physical_s",
  101209: "tattoo_defense_c",
  101210: "tattoo_defense_b",
  101211: "tattoo_defense_a",
  101212: "tattoo_defense_s",
  101213: "quest_belt_c",
  101214: "quest_belt_b",
  101215: "quest_belt_a",
  101216: "quest_belt_s",
  101217: "quest_cloak_c",
  101218: "quest_cloak_b",
  101219: "quest_cloak_a",
  101220: "quest_cloak_s",
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
      const isQuestItem =
        item.type === "tattoo" ||
        (item.type === "armor" && (item.category === "belt" || item.category === "cloak"));
      if (!isQuestItem) return false;
      return item.grade === selectedGrade;
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

    // Перевіряємо наявність Серебряных Монет (валюта hero.coins_silver)
    const coinCount = hero.coins_silver ?? 0;
    if (coinCount < totalPrice) {
      showToast("Недостаточно Серебряных Монет!", "error");
      return;
    }

    // Спочатку item.id (є в itemsDB) — джерело правди для квест-шопу; itemId + мапа — лише fallback (D/kv_shop тощо).
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
      showToast(`Помилка: предмет "${item.name}" не знайдено в itemsDB`, "error");
      return;
    }

    // Списання Серебряных Монет (валюта) та додаємо предмет до інвентаря
    const newInventory = [...(hero.inventory || [])];

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

    if (canStack) {
      if (existingItemIndex >= 0) {
        // Стакаємо з існуючим
        const existingItem = newInventory[existingItemIndex];
        newInventory[existingItemIndex] = {
          ...existingItem,
          count: (existingItem.count || 1) + quantity
        };
      } else {
        // Додаємо новий стакаємий предмет з повною кількістю
        const grade = itemDef.grade || autoDetectGrade(itemsDBId);
        const armorType = itemDef.armorType || (itemDef.kind === "armor" || itemDef.kind === "helmet" || itemDef.kind === "boots" || itemDef.kind === "gloves" ? autoDetectArmorType(itemsDBId) : undefined);
        newInventory.push({
          id: itemDef.id,
          name: itemDef.name,
          slot: itemDef.slot,
          kind: itemDef.kind,
          icon: itemDef.icon,
          description: itemDef.description,
          stats: finalStats,
          count: quantity,
          grade: grade,
          armorType: armorType,
        });
      }
    } else {
      // Екіп (зброя, броня, удочка тощо) — не стакаємо: кожна одиниця окремим слотом (count: 1)
      const grade = itemDef.grade || autoDetectGrade(itemsDBId);
      const armorType = itemDef.armorType || (itemDef.kind === "armor" || itemDef.kind === "helmet" || itemDef.kind === "boots" || itemDef.kind === "gloves" ? autoDetectArmorType(itemsDBId) : undefined);
      const baseItem = {
        id: itemDef.id,
        name: itemDef.name,
        slot: itemDef.slot,
        kind: itemDef.kind,
        icon: itemDef.icon,
        description: itemDef.description,
        stats: finalStats,
        count: 1,
        grade: grade,
        armorType: armorType,
      };
      for (let i = 0; i < quantity; i++) {
        newInventory.push({ ...baseItem });
      }
    }
    
    // Оновлюємо валюту coins_silver та інвентар
    updateHero({
      coins_silver: (hero.coins_silver ?? 0) - totalPrice,
      inventory: newInventory,
    });
    
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

    // Нічого не показуємо, якщо немає бонусів
    if (bonusesList.length === 0) return null;

    let result = `\n\n[Сет: ${set.name}]\n`;
    result += `Повний сет: ${bonusesList.join(", ")}\n`;
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

  const isL2 = isWarmCityUi(getCityUiVariant());
  const l2Frame = L2_WARM_OUTER_FRAME;
  const rowL2 =
    "flex items-center gap-2 py-2 px-2 mb-1.5 rounded-md bg-gradient-to-b from-[#2e2619] to-[#14110c] border border-[#5c4a32]/75 shadow-[inset_0_1px_0_rgba(199,173,128,0.12)] hover:border-[#c7ad80]/50 transition-[border-color] duration-150";
  const borderB = isL2 ? "border-b border-[#5c4a32]/45" : "border-b border-black/70";
  const tabOn = isL2 ? "text-[#e8c56e] font-semibold border-b border-[#c9a44c]" : "text-gray-200 font-semibold border-b border-white/60";
  const tabOff = isL2 ? "text-[#a89878] hover:text-[#d4c4a8]" : "hover:text-gray-200";
  const subTabOn = isL2 ? "text-[#e8c56e] font-bold" : "text-gray-400 font-bold";
  const subTabOff = isL2 ? "text-[#8a7a60] font-semibold hover:text-[#c9a44c]" : "text-gray-500 font-semibold hover:text-gray-400";
  const exchangeRow = isL2
    ? "w-full flex items-center justify-between py-2 px-3 rounded-md bg-gradient-to-b from-[#2e2619]/90 to-[#14110c] border border-[#5c4a32]/60 hover:border-[#c7ad80]/40 shadow-[inset_0_1px_0_rgba(199,173,128,0.08)]"
    : "w-full flex items-center justify-between py-2 px-3 hover:bg-black/20 shadow-[inset_0_0_10px_rgba(0,0,0,0.3)]";
  const modalPanel = isL2
    ? "bg-[#14110c] border border-[#5c4a32] rounded-lg p-4 w-full shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
    : "bg-[#14110c] border border-white/40 rounded-lg p-4 w-full";

  return (
    <div
      className={
        isL2
          ? `${l2Frame} w-full min-w-0 my-1 px-3 py-3 text-[#d4c4a8]`
          : "w-full max-w-[360px] mx-auto px-3 py-2"
      }
    >
      <div className={isL2 ? "max-w-[420px] mx-auto w-full" : ""}>
      {/* Заголовок */}
      <div
        className={`${borderB} px-4 py-2 text-center text-[11px] tracking-[0.12em] uppercase font-semibold ${
          isL2 ? "text-[#e8c56e] [text-shadow:0_1px_2px_rgba(0,0,0,0.85)]" : "text-[#ff8c00]"
        }`}
      >
        Квест-Шоп
      </div>

      {/* Баланс Серебряных Монет */}
      <div className={`px-4 py-2 ${borderB} text-[12px] flex items-center gap-1 ${isL2 ? "text-[#d4c4a8]" : "text-[#cfcfcc]"}`}>
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
          {(hero?.coins_silver ?? 0).toLocaleString()}
        </span>{" "}
        Серебряные Монеты
      </div>

      {/* Категорії */}
      <div className={`px-4 py-2 ${borderB}`}>
        <div className={`text-[11px] flex gap-1.5 mb-2 flex-nowrap items-center ${isL2 ? "text-[#c9b896]" : "text-gray-300"}`}>
          <button
            onClick={() => {
              setSelectedCategory("weapons");
              setSelectedGrade("D");
              setSelectedArmorSubcategory(null);
            }}
            className={`px-1.5 py-0.5 text-[11px] whitespace-nowrap ${selectedCategory === "weapons" ? tabOn : tabOff}`}
          >
            Оружие
          </button>
          <span className={isL2 ? "text-[#6b5c42] text-[10px]" : "text-gray-500 text-[10px]"}>|</span>
          <button
            onClick={() => {
              setSelectedCategory("sets");
              setSelectedGrade("D");
              setSelectedArmorSubcategory(null);
            }}
            className={`px-1.5 py-0.5 text-[11px] whitespace-nowrap ${selectedCategory === "sets" ? tabOn : tabOff}`}
          >
            Сеты
          </button>
          <span className={isL2 ? "text-[#6b5c42] text-[10px]" : "text-gray-500 text-[10px]"}>|</span>
          <button
            onClick={() => {
              setSelectedCategory("items");
              setSelectedArmorSubcategory(null);
            }}
            className={`px-1.5 py-0.5 text-[11px] whitespace-nowrap ${selectedCategory === "items" ? tabOn : tabOff}`}
          >
            Итемы
          </button>
          <span className={isL2 ? "text-[#6b5c42] text-[10px]" : "text-gray-500 text-[10px]"}>|</span>
          <button
            onClick={() => {
              setSelectedCategory("enchant_scrolls");
              setSelectedGrade("D");
              setSelectedArmorSubcategory(null);
            }}
            className={`px-1.5 py-0.5 text-[11px] whitespace-nowrap ${selectedCategory === "enchant_scrolls" ? tabOn : tabOff}`}
          >
            Заточки
          </button>
          <span className={isL2 ? "text-[#6b5c42] text-[10px]" : "text-gray-500 text-[10px]"}>|</span>
          <button
            onClick={() => {
              setSelectedCategory("exchange");
              setSelectedArmorSubcategory(null);
            }}
            className={`px-1.5 py-0.5 text-[11px] whitespace-nowrap ${selectedCategory === "exchange" ? tabOn : tabOff}`}
          >
            Обменник
          </button>
        </div>

        {/* Фільтри по грейдах (включно з тату/пояс/плащ у «Ітеми») */}
        {(selectedCategory === "weapons" || selectedCategory === "sets" || selectedCategory === "items" || selectedCategory === "enchant_scrolls") && (
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
                  selectedArmorSubcategory === subcat.id ? subTabOn : subTabOff
                }`}
              >
                {subcat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Список предметів */}
      <div className={`px-4 py-2 ${borderB}`}>
        {selectedCategory === "exchange" ? (
          <div className="space-y-0">
            {/* Обмін на Адену */}
            <button
              onClick={() => {
                if (!hero) return;
                const coinCount = hero.coins_silver ?? 0;
                if (coinCount < 10) {
                  return;
                }
                setConfirmExchange({ type: "adena", name: "Адена", value: "50,000" });
              }}
              className={exchangeRow}
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
            <div className={`text-center text-[12px] py-1 ${isL2 ? "text-[#6b5c42]" : "text-gray-500"}`}>─ ─ ─</div>

            {/* Обмін на EXP */}
            <button
              onClick={() => {
                if (!hero) return;
                const coinCount = hero.coins_silver ?? 0;
                if (coinCount < 10) {
                  return;
                }
                setConfirmExchange({ type: "exp", name: "Опыт", value: "100,000" });
              }}
              className={exchangeRow}
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
            <div className={`text-center text-[12px] py-1 ${isL2 ? "text-[#6b5c42]" : "text-gray-500"}`}>─ ─ ─</div>

            {/* Обмін на SP */}
            <button
              onClick={() => {
                if (!hero) return;
                const coinCount = hero.coins_silver ?? 0;
                if (coinCount < 10) {
                  return;
                }
                setConfirmExchange({ type: "sp", name: "SP", value: "50,000" });
              }}
              className={exchangeRow}
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
            <div className={`text-center text-[12px] py-1 ${isL2 ? "text-[#6b5c42]" : "text-gray-500"}`}>─ ─ ─</div>

            {/* Обмін на Coin of Luck */}
            <button
              onClick={() => {
                if (!hero) return;
                const coinCount = hero.coins_silver ?? 0;
                if (coinCount < 10) {
                  return;
                }
                setConfirmExchange({ type: "coinOfLuck", name: "Coin of Luck", value: "1" });
              }}
              className={exchangeRow}
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
                <SetBonusDisplay text={getSetInfo(selectedItem)!} />
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
                    onFocus={(e) => e.target.select()}
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
            className={`${modalPanel} max-w-[350px]`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center text-gray-400 text-[14px] mb-4">
              Обменять 10 Серебряных Монет на {confirmExchange.name} {confirmExchange.value}?
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  if (!hero) return;
                  const coinCount = hero.coins_silver ?? 0;
                  if (coinCount < 10) {
                    setConfirmExchange(null);
                    return;
                  }
                  
                  // Списання 10 Серебряных Монет (валюта) та додаємо нагороду
                  const updates: Partial<Hero> = {
                    coins_silver: (hero.coins_silver ?? 0) - 10,
                  };
                  if (confirmExchange.type === "adena") {
                    updates.adena = (hero.adena || 0) + 50000;
                  } else if (confirmExchange.type === "exp") {
                    updates.exp = (hero.exp || 0) + 100000;
                  } else if (confirmExchange.type === "sp") {
                    updates.sp = (hero.sp || 0) + 50000;
                  } else if (confirmExchange.type === "coinOfLuck") {
                    updates.coinOfLuck = (hero.coinOfLuck || 0) + 1;
                  }
                  
                  updateHero(updates);
                  addDailyProgress("daily_exchange", 1);
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
    </div>
  );
}

