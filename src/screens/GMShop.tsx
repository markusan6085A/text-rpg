// src/screens/GMShop.tsx
import React, { useState } from "react";
import { useHeroStore } from "../state/heroStore";
import { showToast } from "../state/toastStore";
import { itemsDB } from "../data/items/itemsDB";
import { itemsDBCrystals } from "../data/items/itemsDB_crystals";
import type { HeroInventoryItem } from "../types/Hero";
import { autoDetectGrade } from "../utils/items/autoDetectArmorType";
import { getWeaponTypeFromItemId, WEAPON_TYPE_LABELS } from "../state/heroStore/weaponUtils";

type Navigate = (path: string) => void;

interface GMShopProps {
  navigate: Navigate;
}

// Тип для краски (Greater Dye +4/-4)
export interface DyeItem {
  id: string;
  itemId: string;
  name: string;
  price: number; // Ціна в AA (Ancient Adena)
  icon: string;
  description: string;
  grade: "S"; // Уніфіковано
  statPlus: "STR" | "CON" | "DEX" | "INT" | "MEN" | "WIT";
  statMinus: "STR" | "CON" | "DEX" | "INT" | "MEN" | "WIT";
  effect: number; // +4 для всіх Greater Dye
}

// Розсодники — кристал, ЛС, камні з фіксованими ефектами. Купуються за Adena, з 20 рівня.
const GM_RASODNIKI_ITEM_IDS = [
  "crystal_d", "crystal_ls_d",
  "stone_crit", "stone_mcrit", "stone_maxhp", "stone_focus", "stone_lifesteal",
  "stone_guidance", "stone_empower", "stone_acumen", "stone_anger", "stone_atkspd",
] as const;
const CRYSTAL_PRICE_ADENA = 10;
const RASODNIKI_REQUIRED_LEVEL = 20;

// Інфо про камні (іконка + ефект) для блоку «Що дають камні»
const RASODNIKI_STONES_INFO: { id: string; icon: string; effect: string }[] = [
  { id: "stone_crit", icon: "/items/drops/item/Ench_wp_potion_violet_i00_0.jpg", effect: "Крит: +5%" },
  { id: "stone_mcrit", icon: "/items/drops/item/Ench_wp_stone_i02_0.jpg", effect: "Маг. крит: +5%" },
  { id: "stone_maxhp", icon: "/items/drops/item/Ench_am_stone_i03_0.jpg", effect: "Макс. HP: +10%" },
  { id: "stone_focus", icon: "/items/drops/item/Ench_am_stone_i02_0.jpg", effect: "Перезарядка скілів: -5%" },
  { id: "stone_lifesteal", icon: "/items/drops/item/Ench_wp_stone_i03_0.jpg", effect: "Відновлення HP від урону: 5%" },
  { id: "stone_guidance", icon: "/items/drops/item/Ench_wp_stone_i04_0.jpg", effect: "Витрата MP скілів: -5%" },
  { id: "stone_empower", icon: "/items/drops/item/Ench_wp_stone_i01_0.jpg", effect: "Урон скілів: +10%" },
  { id: "stone_acumen", icon: "/items/drops/item/Ench_wp_stone_i00_0.jpg", effect: "Швидкість касту: +5%" },
  { id: "stone_anger", icon: "/items/drops/item/Ench_am_potion_violet_i00_0.jpg", effect: "Сила крита: +5%" },
  { id: "stone_atkspd", icon: "/items/drops/item/Ench_am_stone_i04_0%20(1).jpg", effect: "Швидкість атаки: +5%" },
];

// Greater Dye — 10 комбінацій, +4/-4, ціна 1 AA, 1 краска для нанесення
export const GM_SHOP_ITEMS: DyeItem[] = [
  { id: "dye_str_con", itemId: "dye_str_con", name: "Greater Dye (STR +4 CON -4)", price: 1, icon: "/items/drops/resources/str.png", description: "Більше атаки, але менше HP/CP", grade: "S", statPlus: "STR", statMinus: "CON", effect: 4 },
  { id: "dye_str_dex", itemId: "dye_str_dex", name: "Greater Dye (STR +4 DEX -4)", price: 1, icon: "/items/drops/resources/str.png", description: "Більше атаки, але повільніші удари та біг", grade: "S", statPlus: "STR", statMinus: "DEX", effect: 4 },
  { id: "dye_dex_str", itemId: "dye_dex_str", name: "Greater Dye (DEX +4 STR -4)", price: 1, icon: "/items/drops/resources/dye-dex.png", description: "Швидші удари/крити, але менша сила атаки", grade: "S", statPlus: "DEX", statMinus: "STR", effect: 4 },
  { id: "dye_dex_con", itemId: "dye_dex_con", name: "Greater Dye (DEX +4 CON -4)", price: 1, icon: "/items/drops/resources/dye-dex.png", description: "Швидші удари/крити, але менше HP/CP", grade: "S", statPlus: "DEX", statMinus: "CON", effect: 4 },
  { id: "dye_con_str", itemId: "dye_con_str", name: "Greater Dye (CON +4 STR -4)", price: 1, icon: "/items/drops/resources/dye-con.png", description: "Більше витривалості/HP, але менше атаки", grade: "S", statPlus: "CON", statMinus: "STR", effect: 4 },
  { id: "dye_con_dex", itemId: "dye_con_dex", name: "Greater Dye (CON +4 DEX -4)", price: 1, icon: "/items/drops/resources/dye-con.png", description: "Більше витривалості/HP, але менша швидкість", grade: "S", statPlus: "CON", statMinus: "DEX", effect: 4 },
  { id: "dye_int_men", itemId: "dye_int_men", name: "Greater Dye (INT +4 MEN -4)", price: 1, icon: "/items/drops/resources/int.png", description: "Максимальна маг. атака, менше MP/M.Def", grade: "S", statPlus: "INT", statMinus: "MEN", effect: 4 },
  { id: "dye_int_wit", itemId: "dye_int_wit", name: "Greater Dye (INT +4 WIT -4)", price: 1, icon: "/items/drops/resources/int.png", description: "Сильніша магія, але дуже повільний каст", grade: "S", statPlus: "INT", statMinus: "WIT", effect: 4 },
  { id: "dye_wit_men", itemId: "dye_wit_men", name: "Greater Dye (WIT +4 MEN -4)", price: 1, icon: "/items/drops/resources/wit.png", description: "Швидкий каст, менше MP/M.Def", grade: "S", statPlus: "WIT", statMinus: "MEN", effect: 4 },
  { id: "dye_wit_int", itemId: "dye_wit_int", name: "Greater Dye (WIT +4 INT -4)", price: 1, icon: "/items/drops/resources/wit.png", description: "Швидкий каст, але слабша магія", grade: "S", statPlus: "WIT", statMinus: "INT", effect: 4 },
];

export default function GMShop({ navigate }: GMShopProps) {
  const hero = useHeroStore((s) => s.hero);
  const updateHero = useHeroStore((s) => s.updateHero);
  const updateAdena = useHeroStore((s) => s.updateAdena);
  const addItemToInventory = useHeroStore((s) => s.addItemToInventory);
  const [selectedCategory, setSelectedCategory] = useState<string>("shop");
  const [selectedShopSubcategory, setSelectedShopSubcategory] = useState<"dyes" | "rasodniki">("dyes");
  const [selectedGrade, setSelectedGrade] = useState<string>("D");
  const [selectedExchange, setSelectedExchange] = useState<string | null>(null);
  const [confirmExchange, setConfirmExchange] = useState<{ 
    type: string; 
    name: string; 
    stoneCount: number;
    aaReward: number;
  } | null>(null);
  const [exchangeQuantity, setExchangeQuantity] = useState<number>(1);
  const [selectedItem, setSelectedItem] = useState<DyeItem | null>(null);
  const [selectedCrystalItem, setSelectedCrystalItem] = useState<{ itemId: string } | null>(null);
  const [buyQuantity, setBuyQuantity] = useState<number>(1);

  if (!hero) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-gray-500">
        <div className="w-5 h-5 border-2 border-[#5c4a32] border-t-[#c7ad80] rounded-full animate-spin" />
      </div>
    );
  }

  // Перевірка наявності каменів печати
  const greenStone = hero.inventory?.find(item => item.id === "green_seal_stone");
  const blueStone = hero.inventory?.find(item => item.id === "blue_seal_stone");
  const redStone = hero.inventory?.find(item => item.id === "red_seal_stone");
  
  const greenStoneCount = greenStone?.count || 0;
  const blueStoneCount = blueStone?.count || 0;
  const redStoneCount = redStone?.count || 0;

  // Отримання AA з інвентаря
  const ancientAdenaItem = hero.inventory?.find(item => item.id === "ancient_adena");
  const aaCount = ancientAdenaItem?.count || 0;

  // Обробка покупки за AA
  const handleBuy = (item: DyeItem, quantity: number = 1) => {
    if (!hero) return;

    const totalPrice = item.price * quantity;

    // Перевіряємо наявність AA
    if (aaCount < totalPrice) {
      showToast("Недостатньо Ancient Adena (AA)!", "error");
      return;
    }

    const itemDef = itemsDB[item.itemId];
    if (!itemDef) {
      // Якщо предмета немає в itemsDB, створюємо тимчасовий
      // Пізніше додамо в itemsDB
      const tempItem = {
        id: item.itemId,
        name: item.name,
        kind: "consumable",
        slot: "consumable",
        icon: item.icon,
        description: item.description,
        grade: item.grade,
      };
      
      // Вираховуємо AA
      const newInventory = [...(hero.inventory || [])];
      const aaIndex = newInventory.findIndex(invItem => invItem.id === "ancient_adena");
      if (aaIndex >= 0) {
        const aaItem = newInventory[aaIndex];
        if (aaItem.count && aaItem.count >= totalPrice) {
          if (aaItem.count > totalPrice) {
            newInventory[aaIndex] = { ...aaItem, count: aaItem.count - totalPrice };
          } else {
            newInventory.splice(aaIndex, 1);
          }
          
          // Додаємо предмет до інвентаря
          const existingItemIndex = newInventory.findIndex(invItem => invItem.id === item.itemId);
          if (existingItemIndex >= 0) {
            const existingItem = newInventory[existingItemIndex];
            newInventory[existingItemIndex] = {
              ...existingItem,
              count: (existingItem.count || 0) + quantity,
            };
          } else {
            newInventory.push({
              id: item.itemId,
              name: item.name,
              slot: "consumable",
              kind: "consumable",
              icon: item.icon,
              description: item.description,
              count: quantity,
              grade: item.grade,
            });
          }
          
          updateHero({ inventory: newInventory });
          setSelectedItem(null);
          setBuyQuantity(1);
          return;
        }
      }
      showToast("Недостатньо Ancient Adena (AA)!", "error");
      return;
    }

    // Вираховуємо AA
    const newInventory = [...(hero.inventory || [])];
    const aaIndex = newInventory.findIndex(invItem => invItem.id === "ancient_adena");
    if (aaIndex >= 0) {
      const aaItem = newInventory[aaIndex];
      if (aaItem.count && aaItem.count >= totalPrice) {
        if (aaItem.count > totalPrice) {
          newInventory[aaIndex] = { ...aaItem, count: aaItem.count - totalPrice };
        } else {
          newInventory.splice(aaIndex, 1);
        }
        
        // Додаємо предмет до інвентаря
        const existingItemIndex = newInventory.findIndex(invItem => invItem.id === item.itemId);
        if (existingItemIndex >= 0) {
          const existingItem = newInventory[existingItemIndex];
          newInventory[existingItemIndex] = {
            ...existingItem,
            count: (existingItem.count || 0) + quantity,
          };
        } else {
          newInventory.push({
            id: itemDef.id,
            name: itemDef.name,
            slot: itemDef.slot,
            kind: itemDef.kind,
            icon: itemDef.icon,
            description: itemDef.description,
            stats: itemDef.stats,
            count: quantity,
            grade: itemDef.grade || item.grade,
          });
        }
        
        updateHero({ inventory: newInventory });
        setSelectedItem(null);
        setBuyQuantity(1);
        return;
      }
    }
    showToast("Недостатньо Ancient Adena (AA)!", "error");
  };

  // Обробка покупки за Adena (розсодники — кристал, ЛС)
  const handleBuyAdena = (itemId: string, quantity: number = 1) => {
    if (!hero) return;

    const heroLevel = hero.level ?? 1;
    if (heroLevel < RASODNIKI_REQUIRED_LEVEL) {
      showToast(`Розсодники доступні з ${RASODNIKI_REQUIRED_LEVEL} рівня!`, "error");
      return;
    }

    const totalPrice = CRYSTAL_PRICE_ADENA * quantity;
    const currentAdena = hero.adena ?? 0;

    if (currentAdena < totalPrice) {
      showToast("Недостатньо Adena!", "error");
      return;
    }

    const itemDef = itemsDB[itemId] ?? itemsDBCrystals[itemId];
    if (!itemDef) {
      showToast(`Предмет ${itemId} не знайдено`, "error");
      return;
    }

    updateAdena(-totalPrice);
    addItemToInventory(itemId, quantity);
    setSelectedCrystalItem(null);
    setBuyQuantity(1);
    showToast(`Придбано: ${itemDef.name} x${quantity}`, "success");
  };

  // Обробка обміну
  const handleExchange = (type: string, stoneId: string, aaPerStone: number, stoneName: string) => {
    if (!hero) return;

    const stoneItem = hero.inventory?.find(item => item.id === stoneId);
    const stoneCount = stoneItem?.count || 0;

    if (stoneCount < exchangeQuantity) {
      showToast(`У вас недостатньо ${stoneName}!`, "error");
      return;
    }

    const aaReward = aaPerStone * exchangeQuantity;

    setConfirmExchange({
      type,
      name: stoneName,
      stoneCount: exchangeQuantity,
      aaReward,
    });
  };

  // Підтвердження обміну
  const confirmExchangeAction = () => {
    if (!hero || !confirmExchange) return;

    const stoneIdMap: Record<string, string> = {
      green: "green_seal_stone",
      blue: "blue_seal_stone",
      red: "red_seal_stone",
    };

    const stoneId = stoneIdMap[confirmExchange.type];
    if (!stoneId) return;

    const newInventory = [...(hero.inventory || [])];
    
    // Видаляємо камені
    const stoneIndex = newInventory.findIndex(item => item.id === stoneId);
    if (stoneIndex >= 0) {
      const stone = newInventory[stoneIndex];
      if (stone.count && stone.count > confirmExchange.stoneCount) {
        newInventory[stoneIndex] = { ...stone, count: stone.count - confirmExchange.stoneCount };
      } else {
        newInventory.splice(stoneIndex, 1);
      }
    }

    // Додаємо AA
    const aaIndex = newInventory.findIndex(item => item.id === "ancient_adena");
    if (aaIndex >= 0) {
      const aaItem = newInventory[aaIndex];
      newInventory[aaIndex] = { 
        ...aaItem, 
        count: (aaItem.count || 0) + confirmExchange.aaReward 
      };
    } else {
      // Якщо AA немає в інвентарі, додаємо новий предмет
      newInventory.push({
        id: "ancient_adena",
        name: "Ancient Adena",
        slot: "resource",
        kind: "resource",
        icon: "/items/drops/resources/etc_ancient_adena_i00.png",
        description: "Стародавня Адена з катакомб Floran. Дорогоцінна валюта.",
        count: confirmExchange.aaReward,
      });
    }

    updateHero({ inventory: newInventory });
    setConfirmExchange(null);
    setExchangeQuantity(1);
  };

  return (
    <div className="w-full max-w-[360px] mx-auto px-3 py-2">
      {/* Заголовок — як у магазині вещей */}
      <div className="border-b border-black/70 px-4 py-2 text-center text-[11px] text-[#f4e2b8] tracking-[0.12em] uppercase">
        GM-Шоп
      </div>

      {/* Баланс Adena */}
      <div className="px-4 py-2 border-b border-black/70 text-[12px] text-[#cfcfcc] flex items-center gap-1">
        У вас{" "}
        <img 
          src="/items/drops/resources/aden.png" 
          alt="Adena" 
          className="w-4 h-4 object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <span className="text-yellow-400 font-semibold">
          {(hero?.adena || 0).toLocaleString()}
        </span>{" "}
        Adena
      </div>

      {/* Баланс AA */}
      <div className="px-4 py-2 border-b border-black/70 text-[12px] text-[#cfcfcc] flex items-center gap-1">
        У вас{" "}
        <img 
          src="/items/drops/resources/etc_ancient_adena_i00.png" 
          alt="Ancient Adena" 
          className="w-4 h-4 object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <span className="text-yellow-400 font-semibold">
          {aaCount.toLocaleString()}
        </span>{" "}
        Ancient Adena (AA)
      </div>

      {/* Категорії */}
      <div className="px-4 py-2 border-b border-black/70">
        <div className="text-[11px] text-gray-300 flex gap-1.5 mb-2 flex-nowrap items-center">
          <button
            onClick={() => {
              setSelectedCategory("shop");
              setSelectedExchange(null);
            }}
            className={`px-1.5 py-0.5 text-[11px] whitespace-nowrap ${
              selectedCategory === "shop" 
                ? "text-gray-200 font-semibold border-b border-white/60" 
                : "hover:text-gray-200"
            }`}
          >
            Магазин
          </button>
          <span className="text-gray-500 text-[10px]">|</span>
          <button
            onClick={() => {
              setSelectedCategory("aa");
              setSelectedExchange("aa");
            }}
            className={`px-1.5 py-0.5 text-[11px] whitespace-nowrap ${
              selectedCategory === "aa" 
                ? "text-gray-200 font-semibold border-b border-white/60" 
                : "hover:text-gray-200"
            }`}
          >
            Обмінник AA
          </button>
        </div>
      </div>

      {/* Магазин */}
      {selectedCategory === "shop" && (
        <div className="px-4 py-2 border-b border-black/70">
          {/* Підкатегорії магазину — як у магазині вещей */}
          <div className="text-[11px] text-gray-300 flex gap-1.5 mb-2 flex-nowrap items-center">
            <button
              onClick={() => setSelectedShopSubcategory("dyes")}
              className={`px-1.5 py-0.5 text-[11px] whitespace-nowrap ${
                selectedShopSubcategory === "dyes"
                  ? "text-gray-200 font-semibold border-b border-white/60"
                  : "hover:text-gray-200"
              }`}
            >
              Краски
            </button>
            <span className="text-gray-500 text-[10px]">|</span>
            <button
              onClick={() => setSelectedShopSubcategory("rasodniki")}
              className={`px-1.5 py-0.5 text-[11px] whitespace-nowrap ${
                selectedShopSubcategory === "rasodniki"
                  ? "text-gray-200 font-semibold border-b border-white/60"
                  : "hover:text-gray-200"
              }`}
            >
              Розсодники
            </button>
          </div>

          {/* Краски — формули статів + список */}
          {selectedShopSubcategory === "dyes" && (
          <div className="space-y-2">
            <details className="text-[11px]">
              <summary className="text-[#cfcfcc] cursor-pointer hover:text-[#e0c68a]">
                Що дають стати (+1)
              </summary>
              <div className="text-[10px] text-[#cfcfcc] mt-1.5 space-y-0.5 pl-1">
                <div>STR: ~+3% P.Atk</div>
                <div>DEX: ~+1% швидкість атаки, +0.8 шанс криту</div>
                <div>CON: ~+3% Max HP/CP</div>
                <div>INT: ~+4% M.Atk</div>
                <div>WIT: ~+5% Casting Spd., +шанс маг. криту</div>
                <div>MEN: ~+1% M.Def та Max MP</div>
              </div>
            </details>
            <div className="space-y-1">
            {GM_SHOP_ITEMS.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 py-1.5 border-b border-solid border-white/30 hover:bg-black/20 cursor-pointer"
                onClick={() => {
                  setSelectedItem(item);
                  setBuyQuantity(1);
                }}
              >
                {/* Іконка */}
                <img
                  src={item.icon}
                  alt={item.name}
                  className="w-8 h-8 object-contain flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/items/drops/resources/etc_ancient_adena_i00.png";
                  }}
                />
                {/* Назва */}
                <div className="flex-1 text-[12px] text-[#e0c68a]">
                  {item.name}
                </div>
                {/* Ціна — як у магазині вещей */}
                <div className="text-[12px] text-[#f4e2b8] font-semibold">
                  {item.price.toLocaleString()} AA
                </div>
              </div>
            ))}
            </div>
          </div>
          )}

          {/* Розсодники — кристал, ЛС, камні. Доступні з 20 рівня. */}
          {selectedShopSubcategory === "rasodniki" && (
          <div className="space-y-2">
            <details className="text-[11px]">
              <summary className="text-[#cfcfcc] cursor-pointer hover:text-[#e0c68a]">
                Що дають камні
              </summary>
              <div className="mt-1.5 space-y-1 pl-1">
                {RASODNIKI_STONES_INFO.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 text-[10px] text-[#cfcfcc]">
                    <img src={s.icon} alt="" className="w-5 h-5 object-contain flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).src = "/items/drops/resources/etc_ancient_adena_i00.png"; }} />
                    <span>{s.effect}</span>
                  </div>
                ))}
              </div>
            </details>
            {(hero?.level ?? 1) < RASODNIKI_REQUIRED_LEVEL ? (
              <div className="text-[12px] text-gray-400 py-4 text-center">
                Доступно з {RASODNIKI_REQUIRED_LEVEL} рівня
              </div>
            ) : (
            GM_RASODNIKI_ITEM_IDS.map((itemId) => {
              const def = itemsDBCrystals[itemId] ?? itemsDB[itemId];
              if (!def) return null;
              return (
                <div
                  key={itemId}
                  className="flex items-center gap-2 py-1.5 border-b border-solid border-white/30 hover:bg-black/20 cursor-pointer"
                  onClick={() => {
                    setSelectedCrystalItem({ itemId });
                    setBuyQuantity(1);
                  }}
                >
                  <img
                    src={def.icon}
                    alt={def.name}
                    className="w-8 h-8 object-contain flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/items/drops/resources/etc_ancient_adena_i00.png";
                    }}
                  />
                  <div className="flex-1 text-[12px] text-[#e0c68a]">{def.name}</div>
                  <div className="text-[12px] text-[#f4e2b8] font-semibold">
                    {CRYSTAL_PRICE_ADENA} Adena
                  </div>
                </div>
              );
            })
            )}
          </div>
          )}
        </div>
      )}

      {/* Обмінник AA */}
      {selectedCategory === "aa" && selectedExchange === "aa" && (
        <div className="px-4 py-2 border-b border-black/70">
          <div className="space-y-2">
            {/* Кнопка: Обміняти Зелений Камінь Печати */}
            <button
              onClick={() => handleExchange("green", "green_seal_stone", 5, "Зелений Камінь Печати")}
              disabled={greenStoneCount < exchangeQuantity}
              className={`w-full flex items-center justify-between py-2 px-3 hover:bg-black/20 shadow-[inset_0_0_10px_rgba(0,0,0,0.3)] ${
                greenStoneCount < exchangeQuantity ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <img 
                  src="/items/drops/resources/R99_soul_stone_i04_0.jpg" 
                  alt="Зелений Камінь Печати" 
                  className="w-5 h-5 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/items/drops/resources/etc_ancient_adena_i00.png";
                  }}
                />
                <span className="text-[12px] text-[#e0c68a]">Обміняти Зелений Камінь Печати</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[12px] text-green-400 font-semibold">1 камінь = 5 AA</span>
              </div>
            </button>
            {greenStoneCount > 0 && (
              <div className="text-[10px] text-gray-400 px-3">
                У вас: {greenStoneCount} шт.
              </div>
            )}

            {/* Риска */}
            <div className="text-gray-500 text-center text-[12px] py-1">─ ─ ─</div>

            {/* Кнопка: Обміняти Синій Камінь Печати */}
            <button
              onClick={() => handleExchange("blue", "blue_seal_stone", 10, "Синій Камінь Печати")}
              disabled={blueStoneCount < exchangeQuantity}
              className={`w-full flex items-center justify-between py-2 px-3 hover:bg-black/20 shadow-[inset_0_0_10px_rgba(0,0,0,0.3)] ${
                blueStoneCount < exchangeQuantity ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <img 
                  src="/items/drops/resources/R99_soul_stone_i02_0.jpg" 
                  alt="Синій Камінь Печати" 
                  className="w-5 h-5 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/items/drops/resources/etc_ancient_adena_i00.png";
                  }}
                />
                <span className="text-[12px] text-[#e0c68a]">Обміняти Синій Камінь Печати</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[12px] text-blue-400 font-semibold">1 камінь = 10 AA</span>
              </div>
            </button>
            {blueStoneCount > 0 && (
              <div className="text-[10px] text-gray-400 px-3">
                У вас: {blueStoneCount} шт.
              </div>
            )}

            {/* Риска */}
            <div className="text-gray-500 text-center text-[12px] py-1">─ ─ ─</div>

            {/* Кнопка: Обміняти Червоний Камінь Печати */}
            <button
              onClick={() => handleExchange("red", "red_seal_stone", 15, "Червоний Камінь Печати")}
              disabled={redStoneCount < exchangeQuantity}
              className={`w-full flex items-center justify-between py-2 px-3 hover:bg-black/20 shadow-[inset_0_0_10px_rgba(0,0,0,0.3)] ${
                redStoneCount < exchangeQuantity ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <img 
                  src="/items/drops/resources/R99_soul_stone_i00_0.jpg" 
                  alt="Червоний Камінь Печати" 
                  className="w-5 h-5 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/items/drops/resources/etc_ancient_adena_i00.png";
                  }}
                />
                <span className="text-[12px] text-[#e0c68a]">Обміняти Червоний Камінь Печати</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[12px] text-red-400 font-semibold">1 камінь = 15 AA</span>
              </div>
            </button>
            {redStoneCount > 0 && (
              <div className="text-[10px] text-gray-400 px-3">
                У вас: {redStoneCount} шт.
              </div>
            )}

            {/* Вибір кількості */}
            <div className="mt-4 pt-4 border-t border-white/50">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-white text-[12px]">Кількість каменів:</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setExchangeQuantity(Math.max(1, exchangeQuantity - 1))}
                    className="px-2 py-1 bg-[#1a1208] text-white border border-white/50 rounded text-[12px] hover:bg-[#2a1a10]"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={exchangeQuantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setExchangeQuantity(Math.max(1, val));
                    }}
                    onFocus={(e) => e.target.select()}
                    className="w-16 px-2 py-1 bg-[#1a1208] text-white border border-white/50 rounded text-center text-[12px]"
                  />
                  <button
                    onClick={() => setExchangeQuantity(exchangeQuantity + 1)}
                    className="px-2 py-1 bg-[#1a1208] text-white border border-white/50 rounded text-[12px] hover:bg-[#2a1a10]"
                  >
                    +
                  </button>
                </div>
              </div>
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
              Обміняти {confirmExchange.stoneCount} {confirmExchange.name} на{" "}
              <span className="text-yellow-400 font-semibold">
                {confirmExchange.aaReward.toLocaleString()} AA
              </span>?
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={confirmExchangeAction}
                className="text-[#ff8c00] text-[12px] hover:text-[#ffa500] cursor-pointer px-4 py-2 bg-[#1a1208] border border-white/50 rounded"
              >
                Підтвердити
              </button>
              <button
                onClick={() => setConfirmExchange(null)}
                className="text-gray-400 text-[12px] hover:text-gray-300 cursor-pointer px-4 py-2 bg-[#1a1208] border border-white/50 rounded"
              >
                Скасувати
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальне вікно покупки */}
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
              Інформація про предмет
            </div>

            {/* Іконка та назва */}
            <div className="flex items-center gap-3 mb-4">
              <img
                src={selectedItem.icon}
                alt={selectedItem.name}
                className="w-16 h-16 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/items/drops/resources/etc_ancient_adena_i00.png";
                }}
              />
              <div className="flex-1">
                <div className="text-white text-base font-semibold">
                  {selectedItem.name}
                </div>
              </div>
            </div>

            {/* Опис предмета */}
            {selectedItem.description && (
              <div className="text-gray-300 text-[12px] mb-4 italic">
                {selectedItem.description}
              </div>
            )}

            {/* Ціни */}
            <div className="text-yellow-400 text-[12px] mb-4 flex items-center gap-1">
              Ціна: {selectedItem.price} AA (Ancient Adena)
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
                Разом: {selectedItem.price * buyQuantity} AA (Ancient Adena)
              </div>
            </div>

            {/* Кнопки */}
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => handleBuy(selectedItem, buyQuantity)}
                className="text-green-400 text-[12px] py-2 hover:text-green-300 cursor-pointer px-4 bg-[#1a1208] border border-white/50 rounded"
              >
                Купити
              </button>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-gray-400 text-[12px] py-2 hover:text-gray-300 cursor-pointer px-4 bg-[#1a1208] border border-white/50 rounded"
              >
                Скасувати
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальне вікно покупки кристала/LS за Adena */}
      {selectedCrystalItem && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedCrystalItem(null)}
        >
          <div 
            className="bg-[#14110c] border border-white/40 rounded-lg p-4 max-w-[400px] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const def = itemsDB[selectedCrystalItem.itemId] ?? itemsDBCrystals[selectedCrystalItem.itemId];
              if (!def) return null;
              const totalPrice = CRYSTAL_PRICE_ADENA * buyQuantity;
              return (
                <>
                  <div className="text-center text-white text-lg font-bold mb-4 border-b border-white/50 pb-2">
                    Інформація про предмет
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <img
                      src={def.icon}
                      alt={def.name}
                      className="w-16 h-16 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/items/drops/resources/etc_ancient_adena_i00.png";
                      }}
                    />
                    <div className="flex-1">
                      <div className="text-white text-base font-semibold">{def.name}</div>
                    </div>
                  </div>
                  {def.description && (
                    <div className="text-gray-300 text-[12px] mb-4 italic">{def.description}</div>
                  )}
                  <div className="text-yellow-400 text-[12px] mb-4 flex items-center gap-1">
                    Ціна: {CRYSTAL_PRICE_ADENA} Adena
                  </div>
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
                            const val = parseInt(e.target.value) || 1;
                            setBuyQuantity(Math.max(1, val));
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
                    <div className="text-yellow-400 text-[12px] mb-2">
                      Разом: {totalPrice} Adena
                    </div>
                  </div>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => handleBuyAdena(selectedCrystalItem.itemId, buyQuantity)}
                      className="text-green-400 text-[12px] py-2 hover:text-green-300 cursor-pointer px-4 bg-[#1a1208] border border-white/50 rounded"
                    >
                      Купити
                    </button>
                    <button
                      onClick={() => setSelectedCrystalItem(null)}
                      className="text-gray-400 text-[12px] py-2 hover:text-gray-300 cursor-pointer px-4 bg-[#1a1208] border border-white/50 rounded"
                    >
                      Скасувати
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}