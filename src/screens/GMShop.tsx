// src/screens/GMShop.tsx
import React, { useState } from "react";
import { useHeroStore } from "../state/heroStore";
import { showToast } from "../state/toastStore";
import { itemsDB } from "../data/items/itemsDB";
import { itemsDBCrystals } from "../data/items/itemsDB_crystals";
import type { HeroInventoryItem } from "../types/Hero";
import { autoDetectGrade } from "../utils/items/autoDetectArmorType";

type Navigate = (path: string) => void;

interface GMShopProps {
  navigate: Navigate;
}

// Тип для краски з правильними парами статів
export interface DyeItem {
  id: string;
  itemId: string;
  name: string;
  price: number; // Ціна в AA (Ancient Adena)
  icon: string;
  description: string;
  grade: "D" | "C" | "B" | "A" | "S";
  statPlus: "STR" | "CON" | "DEX" | "INT" | "MEN" | "WIT";
  statMinus: "STR" | "CON" | "DEX" | "INT" | "MEN" | "WIT";
  effect: number; // +1, +2, +3, +4, +5 залежно від грейду
}

// Предмети кристалів/LS — купуються за Adena
const GM_CRYSTAL_ITEM_IDS = ["crystal_c", "crystal_b", "crystal_a", "crystal_s"] as const;
const GM_LS_ITEM_IDS = [
  "crystal_lucky_strike_c", "crystal_lucky_strike_b", "crystal_lucky_strike_a", "crystal_lucky_strike_s",
  "crystal_magic_crit_c", "crystal_magic_crit_b", "crystal_magic_crit_a", "crystal_magic_crit_s",
  "crystal_max_hp_c", "crystal_max_hp_b", "crystal_max_hp_a", "crystal_max_hp_s",
  "crystal_focus_c", "crystal_focus_b", "crystal_focus_a", "crystal_focus_s",
  "crystal_health_c", "crystal_health_b", "crystal_health_a", "crystal_health_s",
  "crystal_guidance_c", "crystal_guidance_b", "crystal_guidance_a", "crystal_guidance_s",
  "crystal_empower_c", "crystal_empower_b", "crystal_empower_a", "crystal_empower_s",
  "crystal_acumen_c", "crystal_acumen_b", "crystal_acumen_a", "crystal_acumen_s",
  "crystal_anger_c", "crystal_anger_b", "crystal_anger_a", "crystal_anger_s",
  "crystal_magic_parry_c", "crystal_magic_parry_b", "crystal_magic_parry_a", "crystal_magic_parry_s",
  "crystal_rsk_focus_c", "crystal_rsk_focus_b", "crystal_rsk_focus_a", "crystal_rsk_focus_s",
  "crystal_rsk_evasion_c", "crystal_rsk_evasion_b", "crystal_rsk_evasion_a", "crystal_rsk_evasion_s",
  "crystal_rsk_haste_c", "crystal_rsk_haste_b", "crystal_rsk_haste_a", "crystal_rsk_haste_s",
  "crystal_backbiting_c", "crystal_backbiting_b", "crystal_backbiting_a", "crystal_backbiting_s",
] as const;
const CRYSTAL_PRICE_ADENA = 10;

// Предмети для продажу в GM-шопі (краски з правильними парами статів)
export const GM_SHOP_ITEMS: DyeItem[] = [
  // ===== КРАСКИ D-GRADE (ефект +1/-1) =====
  // Для фізів
  {
    id: "dye_str_con_d",
    itemId: "dye_str_con_d",
    name: "Краска Силы (D)",
    price: 10000,
    icon: "/items/drops/resources/str.png",
    description: "+50 физ. атака / -30 физ. защита, -25 HP, -15 CP",
    grade: "D",
    statPlus: "STR",
    statMinus: "CON",
    effect: 1,
  },
  {
    id: "dye_con_str_d",
    itemId: "dye_con_str_d",
    name: "Краска Витривалості (D)",
    price: 10000,
    icon: "/items/drops/resources/dye-con.png",
    description: "+30 физ. защита, +100 HP, +60 CP / -50 физ. атака",
    grade: "D",
    statPlus: "CON",
    statMinus: "STR",
    effect: 1,
  },
  {
    id: "dye_dex_con_d",
    itemId: "dye_dex_con_d",
    name: "Краска Спритності (D)",
    price: 10000,
    icon: "/items/drops/resources/dex.png",
    description: "+10 точность, +10 уклон, +20 крит, +30 скорость атаки / -30 физ. защита, -25 HP, -15 CP",
    grade: "D",
    statPlus: "DEX",
    statMinus: "CON",
    effect: 1,
  },
  {
    id: "dye_con_dex_d",
    itemId: "dye_con_dex_d",
    name: "Краска Витривалості II (D)",
    price: 10000,
    icon: "/items/drops/resources/dye-con.png",
    description: "+30 физ. защита, +100 HP, +60 CP / -10 точность, -10 уклон, -20 крит, -30 скорость атаки",
    grade: "D",
    statPlus: "CON",
    statMinus: "DEX",
    effect: 1,
  },
  // Для магів
  {
    id: "dye_int_men_d",
    itemId: "dye_int_men_d",
    name: "Краска Інтелекту (D)",
    price: 10000,
    icon: "/items/drops/resources/int.png",
    description: "+50 маг. атака / -30 маг. защита, -50 MP",
    grade: "D",
    statPlus: "INT",
    statMinus: "MEN",
    effect: 1,
  },
  {
    id: "dye_men_int_d",
    itemId: "dye_men_int_d",
    name: "Краска Духу (D)",
    price: 10000,
    icon: "/items/drops/resources/men.png",
    description: "+30 маг. защита, +50 MP / -50 маг. атака",
    grade: "D",
    statPlus: "MEN",
    statMinus: "INT",
    effect: 1,
  },
  {
    id: "dye_wit_men_d",
    itemId: "dye_wit_men_d",
    name: "Краска Мудрості (D)",
    price: 10000,
    icon: "/items/drops/resources/wit.png",
    description: "+30 скорость каста, +20 маг. крит / -30 маг. защита, -50 MP",
    grade: "D",
    statPlus: "WIT",
    statMinus: "MEN",
    effect: 1,
  },
  {
    id: "dye_men_wit_d",
    itemId: "dye_men_wit_d",
    name: "Краска Духу II (D)",
    price: 10000,
    icon: "/items/drops/resources/men.png",
    description: "+30 маг. защита, +50 MP / -30 скорость каста, -20 маг. крит",
    grade: "D",
    statPlus: "MEN",
    statMinus: "WIT",
    effect: 1,
  },
  
  // ===== КРАСКИ C-GRADE (ефект +2/-2) =====
  {
    id: "dye_str_con_c",
    itemId: "dye_str_con_c",
    name: "Краска Силы (C)",
    price: 25000,
    icon: "/items/drops/resources/str.png",
    description: "+100 физ. атака / -60 физ. защита, -50 HP, -30 CP",
    grade: "C",
    statPlus: "STR",
    statMinus: "CON",
    effect: 2,
  },
  {
    id: "dye_con_str_c",
    itemId: "dye_con_str_c",
    name: "Краска Витривалості (C)",
    price: 25000,
    icon: "/items/drops/resources/dye-con.png",
    description: "+60 физ. защита, +200 HP, +120 CP / -100 физ. атака",
    grade: "C",
    statPlus: "CON",
    statMinus: "STR",
    effect: 2,
  },
  {
    id: "dye_dex_con_c",
    itemId: "dye_dex_con_c",
    name: "Краска Спритності (C)",
    price: 25000,
    icon: "/items/drops/resources/dex.png",
    description: "+20 точность, +20 уклон, +40 крит, +60 скорость атаки / -60 физ. защита, -50 HP, -30 CP",
    grade: "C",
    statPlus: "DEX",
    statMinus: "CON",
    effect: 2,
  },
  {
    id: "dye_con_dex_c",
    itemId: "dye_con_dex_c",
    name: "Краска Витривалості II (C)",
    price: 25000,
    icon: "/items/drops/resources/dye-con.png",
    description: "+60 физ. защита, +200 HP, +120 CP / -20 точность, -20 уклон, -40 крит, -60 скорость атаки",
    grade: "C",
    statPlus: "CON",
    statMinus: "DEX",
    effect: 2,
  },
  {
    id: "dye_int_men_c",
    itemId: "dye_int_men_c",
    name: "Краска Інтелекту (C)",
    price: 25000,
    icon: "/items/drops/resources/int.png",
    description: "+100 маг. атака / -60 маг. защита, -100 MP",
    grade: "C",
    statPlus: "INT",
    statMinus: "MEN",
    effect: 2,
  },
  {
    id: "dye_men_int_c",
    itemId: "dye_men_int_c",
    name: "Краска Духу (C)",
    price: 25000,
    icon: "/items/drops/resources/men.png",
    description: "+60 маг. защита, +100 MP / -100 маг. атака",
    grade: "C",
    statPlus: "MEN",
    statMinus: "INT",
    effect: 2,
  },
  {
    id: "dye_wit_men_c",
    itemId: "dye_wit_men_c",
    name: "Краска Мудрості (C)",
    price: 25000,
    icon: "/items/drops/resources/wit.png",
    description: "+60 скорость каста, +40 маг. крит / -60 маг. защита, -100 MP",
    grade: "C",
    statPlus: "WIT",
    statMinus: "MEN",
    effect: 2,
  },
  {
    id: "dye_men_wit_c",
    itemId: "dye_men_wit_c",
    name: "Краска Духу II (C)",
    price: 25000,
    icon: "/items/drops/resources/men.png",
    description: "+60 маг. защита, +100 MP / -60 скорость каста, -40 маг. крит",
    grade: "C",
    statPlus: "MEN",
    statMinus: "WIT",
    effect: 2,
  },
  
  // ===== КРАСКИ B-GRADE (ефект +3/-3) =====
  {
    id: "dye_str_con_b",
    itemId: "dye_str_con_b",
    name: "Краска Силы (B)",
    price: 50000,
    icon: "/items/drops/resources/str.png",
    description: "+150 физ. атака / -90 физ. защита, -75 HP, -45 CP",
    grade: "B",
    statPlus: "STR",
    statMinus: "CON",
    effect: 3,
  },
  {
    id: "dye_con_str_b",
    itemId: "dye_con_str_b",
    name: "Краска Витривалості (B)",
    price: 50000,
    icon: "/items/drops/resources/dye-con.png",
    description: "+90 физ. защита, +300 HP, +180 CP / -150 физ. атака",
    grade: "B",
    statPlus: "CON",
    statMinus: "STR",
    effect: 3,
  },
  {
    id: "dye_dex_con_b",
    itemId: "dye_dex_con_b",
    name: "Краска Спритності (B)",
    price: 50000,
    icon: "/items/drops/resources/dex.png",
    description: "+30 точность, +30 уклон, +60 крит, +90 скорость атаки / -90 физ. защита, -75 HP, -45 CP",
    grade: "B",
    statPlus: "DEX",
    statMinus: "CON",
    effect: 3,
  },
  {
    id: "dye_con_dex_b",
    itemId: "dye_con_dex_b",
    name: "Краска Витривалості II (B)",
    price: 50000,
    icon: "/items/drops/resources/dye-con.png",
    description: "+90 физ. защита, +300 HP, +180 CP / -30 точность, -30 уклон, -60 крит, -90 скорость атаки",
    grade: "B",
    statPlus: "CON",
    statMinus: "DEX",
    effect: 3,
  },
  {
    id: "dye_int_men_b",
    itemId: "dye_int_men_b",
    name: "Краска Інтелекту (B)",
    price: 50000,
    icon: "/items/drops/resources/int.png",
    description: "+150 маг. атака / -90 маг. защита, -150 MP",
    grade: "B",
    statPlus: "INT",
    statMinus: "MEN",
    effect: 3,
  },
  {
    id: "dye_men_int_b",
    itemId: "dye_men_int_b",
    name: "Краска Духу (B)",
    price: 50000,
    icon: "/items/drops/resources/men.png",
    description: "+90 маг. защита, +150 MP / -150 маг. атака",
    grade: "B",
    statPlus: "MEN",
    statMinus: "INT",
    effect: 3,
  },
  {
    id: "dye_wit_men_b",
    itemId: "dye_wit_men_b",
    name: "Краска Мудрості (B)",
    price: 50000,
    icon: "/items/drops/resources/wit.png",
    description: "+90 скорость каста, +60 маг. крит / -90 маг. защита, -150 MP",
    grade: "B",
    statPlus: "WIT",
    statMinus: "MEN",
    effect: 3,
  },
  {
    id: "dye_men_wit_b",
    itemId: "dye_men_wit_b",
    name: "Краска Духу II (B)",
    price: 50000,
    icon: "/items/drops/resources/men.png",
    description: "+90 маг. защита, +150 MP / -90 скорость каста, -60 маг. крит",
    grade: "B",
    statPlus: "MEN",
    statMinus: "WIT",
    effect: 3,
  },
  
  // ===== КРАСКИ A-GRADE (ефект +4/-4) =====
  {
    id: "dye_str_con_a",
    itemId: "dye_str_con_a",
    name: "Краска Силы (A)",
    price: 100000,
    icon: "/items/drops/resources/str.png",
    description: "+200 физ. атака / -120 физ. защита, -100 HP, -60 CP",
    grade: "A",
    statPlus: "STR",
    statMinus: "CON",
    effect: 4,
  },
  {
    id: "dye_con_str_a",
    itemId: "dye_con_str_a",
    name: "Краска Витривалості (A)",
    price: 100000,
    icon: "/items/drops/resources/dye-con.png",
    description: "+120 физ. защита, +400 HP, +240 CP / -200 физ. атака",
    grade: "A",
    statPlus: "CON",
    statMinus: "STR",
    effect: 4,
  },
  {
    id: "dye_dex_con_a",
    itemId: "dye_dex_con_a",
    name: "Краска Спритності (A)",
    price: 100000,
    icon: "/items/drops/resources/dex.png",
    description: "+40 точность, +40 уклон, +80 крит, +120 скорость атаки / -120 физ. защита, -100 HP, -60 CP",
    grade: "A",
    statPlus: "DEX",
    statMinus: "CON",
    effect: 4,
  },
  {
    id: "dye_con_dex_a",
    itemId: "dye_con_dex_a",
    name: "Краска Витривалості II (A)",
    price: 100000,
    icon: "/items/drops/resources/dye-con.png",
    description: "+120 физ. защита, +400 HP, +240 CP / -40 точность, -40 уклон, -80 крит, -120 скорость атаки",
    grade: "A",
    statPlus: "CON",
    statMinus: "DEX",
    effect: 4,
  },
  {
    id: "dye_int_men_a",
    itemId: "dye_int_men_a",
    name: "Краска Інтелекту (A)",
    price: 100000,
    icon: "/items/drops/resources/int.png",
    description: "+200 маг. атака / -120 маг. защита, -200 MP",
    grade: "A",
    statPlus: "INT",
    statMinus: "MEN",
    effect: 4,
  },
  {
    id: "dye_men_int_a",
    itemId: "dye_men_int_a",
    name: "Краска Духу (A)",
    price: 100000,
    icon: "/items/drops/resources/men.png",
    description: "+120 маг. защита, +200 MP / -200 маг. атака",
    grade: "A",
    statPlus: "MEN",
    statMinus: "INT",
    effect: 4,
  },
  {
    id: "dye_wit_men_a",
    itemId: "dye_wit_men_a",
    name: "Краска Мудрості (A)",
    price: 100000,
    icon: "/items/drops/resources/wit.png",
    description: "+120 скорость каста, +80 маг. крит / -120 маг. защита, -200 MP",
    grade: "A",
    statPlus: "WIT",
    statMinus: "MEN",
    effect: 4,
  },
  {
    id: "dye_men_wit_a",
    itemId: "dye_men_wit_a",
    name: "Краска Духу II (A)",
    price: 100000,
    icon: "/items/drops/resources/men.png",
    description: "+120 маг. защита, +200 MP / -120 скорость каста, -80 маг. крит",
    grade: "A",
    statPlus: "MEN",
    statMinus: "WIT",
    effect: 4,
  },
  
  // ===== КРАСКИ S-GRADE (ефект +5/-5) =====
  {
    id: "dye_str_con_s",
    itemId: "dye_str_con_s",
    name: "Краска Силы (S)",
    price: 170000,
    icon: "/items/drops/resources/str.png",
    description: "+250 физ. атака / -150 физ. защита, -125 HP, -75 CP",
    grade: "S",
    statPlus: "STR",
    statMinus: "CON",
    effect: 5,
  },
  {
    id: "dye_con_str_s",
    itemId: "dye_con_str_s",
    name: "Краска Витривалості (S)",
    price: 170000,
    icon: "/items/drops/resources/dye-con.png",
    description: "+150 физ. защита, +500 HP, +300 CP / -250 физ. атака",
    grade: "S",
    statPlus: "CON",
    statMinus: "STR",
    effect: 5,
  },
  {
    id: "dye_dex_con_s",
    itemId: "dye_dex_con_s",
    name: "Краска Спритності (S)",
    price: 170000,
    icon: "/items/drops/resources/dex.png",
    description: "+50 точность, +50 уклон, +100 крит, +150 скорость атаки / -150 физ. защита, -125 HP, -75 CP",
    grade: "S",
    statPlus: "DEX",
    statMinus: "CON",
    effect: 5,
  },
  {
    id: "dye_con_dex_s",
    itemId: "dye_con_dex_s",
    name: "Краска Витривалості II (S)",
    price: 170000,
    icon: "/items/drops/resources/dye-con.png",
    description: "+150 физ. защита, +500 HP, +300 CP / -50 точность, -50 уклон, -100 крит, -150 скорость атаки",
    grade: "S",
    statPlus: "CON",
    statMinus: "DEX",
    effect: 5,
  },
  {
    id: "dye_int_men_s",
    itemId: "dye_int_men_s",
    name: "Краска Інтелекту (S)",
    price: 170000,
    icon: "/items/drops/resources/int.png",
    description: "+250 маг. атака / -150 маг. защита, -250 MP",
    grade: "S",
    statPlus: "INT",
    statMinus: "MEN",
    effect: 5,
  },
  {
    id: "dye_men_int_s",
    itemId: "dye_men_int_s",
    name: "Краска Духу (S)",
    price: 170000,
    icon: "/items/drops/resources/men.png",
    description: "+150 маг. защита, +250 MP / -250 маг. атака",
    grade: "S",
    statPlus: "MEN",
    statMinus: "INT",
    effect: 5,
  },
  {
    id: "dye_wit_men_s",
    itemId: "dye_wit_men_s",
    name: "Краска Мудрості (S)",
    price: 170000,
    icon: "/items/drops/resources/wit.png",
    description: "+150 скорость каста, +100 маг. крит / -150 маг. защита, -250 MP",
    grade: "S",
    statPlus: "WIT",
    statMinus: "MEN",
    effect: 5,
  },
  {
    id: "dye_men_wit_s",
    itemId: "dye_men_wit_s",
    name: "Краска Духу II (S)",
    price: 170000,
    icon: "/items/drops/resources/men.png",
    description: "+150 маг. защита, +250 MP / -150 скорость каста, -100 маг. крит",
    grade: "S",
    statPlus: "MEN",
    statMinus: "WIT",
    effect: 5,
  },
];

export default function GMShop({ navigate }: GMShopProps) {
  const hero = useHeroStore((s) => s.hero);
  const updateHero = useHeroStore((s) => s.updateHero);
  const updateAdena = useHeroStore((s) => s.updateAdena);
  const addItemToInventory = useHeroStore((s) => s.addItemToInventory);
  const [selectedCategory, setSelectedCategory] = useState<string>("shop");
  const [selectedShopSubcategory, setSelectedShopSubcategory] = useState<"dyes" | "crystals" | "ls">("dyes");
  const [selectedGrade, setSelectedGrade] = useState<string>("D");
  const [selectedLSGrade, setSelectedLSGrade] = useState<string>("C");
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
  const [insertLSModalOpen, setInsertLSModalOpen] = useState(false);
  const [insertLSPicker, setInsertLSPicker] = useState<"crystal" | "ls" | "weapon" | null>(null);
  const [insertLSSelected, setInsertLSSelected] = useState<{
    crystal: HeroInventoryItem | null;
    ls: HeroInventoryItem | null;
    weapon: HeroInventoryItem | null;
  }>({ crystal: null, ls: null, weapon: null });
  const [buyQuantity, setBuyQuantity] = useState<number>(1);

  if (!hero) {
    return <div className="text-white text-center mt-10">Загрузка...</div>;
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

  // Обробка покупки за Adena (кристали, LS)
  const handleBuyAdena = (itemId: string, quantity: number = 1) => {
    if (!hero) return;

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

  // Обробка об'єднання кристала + LS + зброя (5% успіх, 90% нічого)
  const INSERT_SUCCESS_CHANCE = 0.05;
  const handleMergeLS = () => {
    if (!hero || !insertLSSelected.crystal || !insertLSSelected.ls || !insertLSSelected.weapon) return;

    const crystalGrade = insertLSSelected.crystal.grade ?? (itemsDBCrystals[insertLSSelected.crystal.id] ?? itemsDB[insertLSSelected.crystal.id])?.grade;
    const lsGrade = insertLSSelected.ls.grade ?? (itemsDBCrystals[insertLSSelected.ls.id] ?? itemsDB[insertLSSelected.ls.id])?.grade;
    const lsDef = itemsDBCrystals[insertLSSelected.ls.id] ?? itemsDB[insertLSSelected.ls.id];
    const lsStats = (lsDef?.stats as Record<string, number>) || {};

    const weaponDef = itemsDB[insertLSSelected.weapon.id];
    const weaponGrade = insertLSSelected.weapon.grade ?? weaponDef?.grade ?? autoDetectGrade(insertLSSelected.weapon.id);

    if (crystalGrade !== lsGrade || crystalGrade !== weaponGrade) {
      showToast("Грейди кристала, LS та зброї мають збігатися!", "error");
      return;
    }

    const newInventory = [...(hero.inventory || [])];
    const crystalIdx = newInventory.findIndex((i) => i.id === insertLSSelected.crystal!.id);
    const lsIdx = newInventory.findIndex((i) => i.id === insertLSSelected.ls!.id);
    if (crystalIdx < 0 || lsIdx < 0) {
      showToast("Кристал або LS не знайдено в інвентарі!", "error");
      return;
    }
    const crystalItem = newInventory[crystalIdx];
    const lsItem = newInventory[lsIdx];
    if ((crystalItem.count ?? 1) < 1 || (lsItem.count ?? 1) < 1) {
      showToast("Недостатньо кристалів!", "error");
      return;
    }

    const success = Math.random() < INSERT_SUCCESS_CHANCE;

    const removeOneFromInv = (itemId: string) => {
      const idx = newInventory.findIndex((i) => i.id === itemId);
      if (idx < 0) return;
      const it = newInventory[idx];
      if ((it.count ?? 1) > 1) {
        newInventory[idx] = { ...it, count: (it.count ?? 1) - 1 };
      } else {
        newInventory.splice(idx, 1);
      }
    };
    removeOneFromInv(insertLSSelected.crystal.id);
    removeOneFromInv(insertLSSelected.ls.id);

    if (success) {
      const isEquipped = hero.equipment?.weapon === insertLSSelected.weapon.id;
      const weaponInInvIdx = newInventory.findIndex((i) => i.id === insertLSSelected.weapon!.id);
      const insert = {
        crystalId: insertLSSelected.crystal.id,
        lsId: insertLSSelected.ls.id,
        ...lsStats,
      };
      if (isEquipped) {
        updateHero({
          inventory: newInventory,
          equipmentInserts: {
            ...(hero.equipmentInserts || {}),
            weapon: insert,
          },
        });
      } else if (weaponInInvIdx >= 0) {
        const w = newInventory[weaponInInvIdx];
        newInventory[weaponInInvIdx] = { ...w, insertedCrystal: insert.crystalId, insertedLS: insert.lsId, ...lsStats };
        updateHero({ inventory: newInventory });
      } else {
        updateHero({ inventory: newInventory });
      }
      const effDesc = Object.entries(lsStats).map(([k, v]) => `${k}: +${v}`).join(", ") || insertLSSelected.ls.name;
      showToast(`Успіх! LS вставлено. (${effDesc})`, "success");
    } else {
      updateHero({ inventory: newInventory });
      showToast("Не вдалося — кристал і LS втрачено.", "error");
    }
    setInsertLSSelected((s) => ({ ...s, crystal: null, ls: null }));
    // Модалку не закриваємо, зброю залишаємо вибраною
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
      {/* Заголовок */}
      <div className="border-b border-black/70 px-4 py-2 text-center text-[11px] text-[#ff8c00] tracking-[0.12em] uppercase font-semibold">
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
        <button
          onClick={() => setInsertLSModalOpen(true)}
          className="w-full mt-2 py-2 px-3 text-[12px] bg-[#2a1f14] hover:bg-[#3d2f1a] border border-[#5c4a32] text-[#e0c68a] rounded"
        >
          Вставити LS
        </button>
      </div>

      {/* Магазин */}
      {selectedCategory === "shop" && (
        <div className="px-4 py-2 border-b border-black/70">
          {/* Підкатегорії магазину */}
          <div className="mb-2 flex gap-1 flex-wrap">
            <button
              onClick={() => setSelectedShopSubcategory("dyes")}
              className={`px-2 py-1 text-[11px] ${
                selectedShopSubcategory === "dyes"
                  ? "bg-[#3d2f1a] text-[#ff8c00] border border-white/50"
                  : "bg-[#1a1208] text-gray-400 border border-white/40 hover:text-gray-300"
              }`}
            >
              Краски
            </button>
            <button
              onClick={() => setSelectedShopSubcategory("crystals")}
              className={`px-2 py-1 text-[11px] ${
                selectedShopSubcategory === "crystals"
                  ? "bg-[#3d2f1a] text-[#ff8c00] border border-white/50"
                  : "bg-[#1a1208] text-gray-400 border border-white/40 hover:text-gray-300"
              }`}
            >
              Кристали
            </button>
            <button
              onClick={() => setSelectedShopSubcategory("ls")}
              className={`px-2 py-1 text-[11px] ${
                selectedShopSubcategory === "ls"
                  ? "bg-[#3d2f1a] text-[#ff8c00] border border-white/50"
                  : "bg-[#1a1208] text-gray-400 border border-white/40 hover:text-gray-300"
              }`}
            >
              LS
            </button>
          </div>

          {/* Краски — фільтр грейдів */}
          {selectedShopSubcategory === "dyes" && (
            <div className="mb-2 flex gap-1 flex-wrap">
              {(["D", "C", "B", "A", "S"] as const).map((grade) => (
                <button
                  key={grade}
                  onClick={() => setSelectedGrade(grade)}
                  className={`px-2 py-1 text-[11px] ${
                    selectedGrade === grade
                      ? "bg-[#3d2f1a] text-[#ff8c00] border border-white/50"
                      : "bg-[#1a1208] text-gray-400 border border-white/40 hover:text-gray-300"
                  }`}
                >
                  {grade}
                </button>
              ))}
            </div>
          )}
          
          {/* Список предметів */}
          {selectedShopSubcategory === "dyes" && (
          <div className="space-y-1">
            {GM_SHOP_ITEMS.filter(item => item.grade === selectedGrade).map((item) => (
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
                {/* Ціна */}
                <div className="text-yellow-400 text-[12px] font-semibold">
                  {item.price.toLocaleString()} AA
                </div>
              </div>
            ))}
          </div>
          )}

          {/* Кристали */}
          {selectedShopSubcategory === "crystals" && (
          <div className="space-y-1 max-h-[40vh] overflow-y-auto">
            {GM_CRYSTAL_ITEM_IDS.map((itemId) => {
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
                  <div className="text-yellow-400 text-[12px] font-semibold">
                    {CRYSTAL_PRICE_ADENA} Adena
                  </div>
                </div>
              );
            })}
          </div>
          )}

          {/* LS — фільтр грейдів */}
          {selectedShopSubcategory === "ls" && (
            <div className="mb-2 flex gap-1 flex-wrap">
              {(["C", "B", "A", "S"] as const).map((grade) => (
                <button
                  key={grade}
                  onClick={() => setSelectedLSGrade(grade)}
                  className={`px-2 py-1 text-[11px] ${
                    selectedLSGrade === grade
                      ? "bg-[#3d2f1a] text-[#ff8c00] border border-white/50"
                      : "bg-[#1a1208] text-gray-400 border border-white/40 hover:text-gray-300"
                  }`}
                >
                  {grade}
                </button>
              ))}
            </div>
          )}

          {/* LS */}
          {selectedShopSubcategory === "ls" && (
          <div className="space-y-1 max-h-[50vh] overflow-y-auto">
            {GM_LS_ITEM_IDS.filter((itemId) => itemId.endsWith(`_${selectedLSGrade.toLowerCase()}`)).map((itemId) => {
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
                  <div className="text-yellow-400 text-[12px] font-semibold">
                    {CRYSTAL_PRICE_ADENA} Adena
                  </div>
                </div>
              );
            })}
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

      {/* Модалка «Вставити LS» — L2 стиль, більша, 2 зверху + 1 знизу */}
      {insertLSModalOpen && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setInsertLSModalOpen(false);
            setInsertLSPicker(null);
          }}
        >
          <div
            className="bg-[#1a1410] border-2 border-[#5c4a32] rounded-lg p-6 max-w-[480px] w-full shadow-[0_0_20px_rgba(255,140,0,0.15)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center text-[#ff8c00] text-[16px] font-bold mb-3 border-b border-[#5c4a32] pb-2">
              Вставити кристал та LS у зброю
            </div>
            <p className="text-[#c4a574] text-[12px] mb-5 text-center">
              Оберіть кристал, LS і зброю. Грейди мають збігатися. Шанс успіху 5%, при невдачі кристал і LS втрачаються.
            </p>

            {/* 2 слоти зверху */}
            <div className="flex gap-4 justify-center mb-4">
              <div
                className="w-12 h-12 flex flex-col items-center justify-center bg-[#0f0d0a] border-2 border-[#5c4a32] rounded cursor-pointer hover:border-[#ff8c00] transition-colors"
                onClick={() => setInsertLSPicker("crystal")}
              >
                {insertLSSelected.crystal ? (
                  <>
                    <img
                      src={insertLSSelected.crystal.icon}
                      alt={insertLSSelected.crystal.name}
                      className="w-7 h-7 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/items/drops/resources/etc_ancient_adena_i00.png";
                      }}
                    />
                    <span className="text-[8px] text-[#e0c68a] truncate max-w-full px-0.5">{insertLSSelected.crystal.name}</span>
                    {(insertLSSelected.crystal.grade ?? (itemsDBCrystals[insertLSSelected.crystal.id] ?? itemsDB[insertLSSelected.crystal.id])?.grade) && (
                      <span className="text-[8px] text-[#ff8c00]">({insertLSSelected.crystal.grade ?? (itemsDBCrystals[insertLSSelected.crystal.id] ?? itemsDB[insertLSSelected.crystal.id])?.grade})</span>
                    )}
                  </>
                ) : (
                  <span className="text-[9px] text-gray-500">Кристал</span>
                )}
              </div>
              <div
                className="w-12 h-12 flex flex-col items-center justify-center bg-[#0f0d0a] border-2 border-[#5c4a32] rounded cursor-pointer hover:border-[#ff8c00] transition-colors"
                onClick={() => setInsertLSPicker("ls")}
              >
                {insertLSSelected.ls ? (
                  <>
                    <img
                      src={insertLSSelected.ls.icon}
                      alt={insertLSSelected.ls.name}
                      className="w-7 h-7 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/items/drops/resources/etc_ancient_adena_i00.png";
                      }}
                    />
                    <span className="text-[8px] text-[#e0c68a] truncate max-w-full px-0.5">{insertLSSelected.ls.name}</span>
                    {(insertLSSelected.ls.grade ?? (itemsDBCrystals[insertLSSelected.ls.id] ?? itemsDB[insertLSSelected.ls.id])?.grade) && (
                      <span className="text-[8px] text-[#ff8c00]">({insertLSSelected.ls.grade ?? (itemsDBCrystals[insertLSSelected.ls.id] ?? itemsDB[insertLSSelected.ls.id])?.grade})</span>
                    )}
                  </>
                ) : (
                  <span className="text-[9px] text-gray-500">LS</span>
                )}
              </div>
            </div>

            {/* 1 слот знизу по центру */}
            <div className="flex justify-center mb-5">
              <div
                className="w-12 h-12 flex flex-col items-center justify-center bg-[#0f0d0a] border-2 border-[#5c4a32] rounded cursor-pointer hover:border-[#ff8c00] transition-colors"
                onClick={() => setInsertLSPicker("weapon")}
              >
                {insertLSSelected.weapon ? (
                  <>
                    <img
                      src={insertLSSelected.weapon.icon}
                      alt={insertLSSelected.weapon.name}
                      className="w-7 h-7 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/items/drops/resources/etc_ancient_adena_i00.png";
                      }}
                    />
                    <span className="text-[8px] text-[#e0c68a] truncate max-w-full px-0.5">{insertLSSelected.weapon.name}</span>
                    {(insertLSSelected.weapon.grade ?? (itemsDB[insertLSSelected.weapon.id] ?? itemsDBCrystals[insertLSSelected.weapon.id])?.grade ?? autoDetectGrade(insertLSSelected.weapon.id)) && (
                      <span className="text-[8px] text-[#ff8c00]">({insertLSSelected.weapon.grade ?? (itemsDB[insertLSSelected.weapon.id] ?? itemsDBCrystals[insertLSSelected.weapon.id])?.grade ?? autoDetectGrade(insertLSSelected.weapon.id)})</span>
                    )}
                  </>
                ) : (
                  <span className="text-[9px] text-gray-500">Зброя</span>
                )}
              </div>
            </div>

            <div className="flex justify-center gap-3">
              <button
                onClick={handleMergeLS}
                disabled={!insertLSSelected.crystal || !insertLSSelected.ls || !insertLSSelected.weapon}
                className="px-5 py-2 text-[13px] bg-[#4a3520] border border-[#ff8c00] text-[#ff8c00] rounded hover:bg-[#5c4528] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Об'єднати
              </button>
              <button
                onClick={() => {
                  setInsertLSModalOpen(false);
                  setInsertLSPicker(null);
                }}
                className="px-4 py-2 text-[12px] bg-[#2a1f14] border border-[#5c4a32] text-[#e0c68a] rounded hover:bg-[#3d2f1a]"
              >
                Закрити
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Пікер предметів для Вставити LS */}
      {insertLSModalOpen && insertLSPicker && (
        <div
          className="fixed inset-0 flex items-center justify-center z-[60] p-4 bg-black/80"
          onClick={() => setInsertLSPicker(null)}
        >
          <div
            className="bg-[#1a1410] border-2 border-[#5c4a32] rounded-lg p-4 max-w-[320px] w-full max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[#ff8c00] text-[12px] font-bold mb-3">
              {insertLSPicker === "crystal" && "Оберіть кристал"}
              {insertLSPicker === "ls" && "Оберіть LS"}
              {insertLSPicker === "weapon" && "Оберіть зброю"}
            </div>
            <div className="space-y-1">
              {insertLSPicker === "crystal" && (() => {
                const crystals = hero?.inventory?.filter((inv) => GM_CRYSTAL_ITEM_IDS.includes(inv.id as any)) ?? [];
                return crystals.length === 0 ? (
                  <p className="text-gray-500 text-[11px]">У вас немає кристалів</p>
                ) : (
                  crystals.map((inv) => {
                    const def = itemsDBCrystals[inv.id] ?? itemsDB[inv.id];
                    return (
                      <div
                        key={inv.id}
                        className="flex items-center gap-2 py-2 px-2 border-b border-white/20 hover:bg-black/30 cursor-pointer"
                        onClick={() => {
                          setInsertLSSelected((s) => ({ ...s, crystal: inv }));
                          setInsertLSPicker(null);
                        }}
                      >
                        <img src={inv.icon || def?.icon} alt={inv.name} className="w-10 h-10 object-contain" />
                        <div className="flex-1">
                          <span className="text-[12px] text-[#e0c68a]">{inv.name}</span>
                          {inv.grade && (
                            <span className="ml-1 text-[11px] text-[#ff8c00]">({inv.grade})</span>
                          )}
                        </div>
                        {inv.count && inv.count > 1 && (
                          <span className="text-gray-400 text-[11px]">x{inv.count}</span>
                        )}
                      </div>
                    );
                  })
                );
              })()}
              {insertLSPicker === "ls" && (() => {
                const lsItems = hero?.inventory?.filter((inv) => GM_LS_ITEM_IDS.includes(inv.id as any)) ?? [];
                return lsItems.length === 0 ? (
                  <p className="text-gray-500 text-[11px]">У вас немає LS</p>
                ) : (
                  lsItems.map((inv) => {
                    const def = itemsDBCrystals[inv.id] ?? itemsDB[inv.id];
                    return (
                      <div
                        key={inv.id}
                        className="flex items-center gap-2 py-2 px-2 border-b border-white/20 hover:bg-black/30 cursor-pointer"
                        onClick={() => {
                          setInsertLSSelected((s) => ({ ...s, ls: inv }));
                          setInsertLSPicker(null);
                        }}
                      >
                        <img src={inv.icon || def?.icon} alt={inv.name} className="w-10 h-10 object-contain" />
                        <div className="flex-1">
                          <span className="text-[12px] text-[#e0c68a]">{inv.name}</span>
                          {inv.grade && (
                            <span className="ml-1 text-[11px] text-[#ff8c00]">({inv.grade})</span>
                          )}
                        </div>
                        {inv.count && inv.count > 1 && (
                          <span className="text-gray-400 text-[11px]">x{inv.count}</span>
                        )}
                      </div>
                    );
                  })
                );
              })()}
              {insertLSPicker === "weapon" && (() => {
                const invWeapons = hero?.inventory?.filter((inv) => {
                  const def = itemsDB[inv.id] ?? itemsDBCrystals[inv.id];
                  return def && (def.slot === "weapon" || def.kind === "weapon");
                }) ?? [];
                const equipWeaponId = hero?.equipment?.weapon;
                const equipWeapon = equipWeaponId && !invWeapons.some((w) => w.id === equipWeaponId)
                  ? (() => {
                      const def = itemsDB[equipWeaponId];
                      if (!def) return null;
                      return {
                        id: equipWeaponId,
                        name: def.name,
                        icon: def.icon,
                        slot: "weapon",
                        grade: def.grade,
                        count: 1,
                      } as HeroInventoryItem;
                    })()
                  : null;
                const weapons = equipWeapon ? [equipWeapon, ...invWeapons] : invWeapons;
                return weapons.length === 0 ? (
                  <p className="text-gray-500 text-[11px]">У вас немає зброї</p>
                ) : (
                  weapons.map((inv) => {
                    const def = itemsDB[inv.id];
                    const grade = inv.grade ?? def?.grade ?? autoDetectGrade(inv.id);
                    const hasLS = (inv as any).insertedLS ?? (inv as any).luckyStrike ?? (hero?.equipmentInserts?.weapon?.lsId && hero?.equipment?.weapon === inv.id);
                    return (
                      <div
                        key={inv.id}
                        className="flex items-center gap-2 py-2 px-2 border-b border-white/20 hover:bg-black/30 cursor-pointer"
                        onClick={() => {
                          setInsertLSSelected((s) => ({ ...s, weapon: { ...inv, grade } }));
                          setInsertLSPicker(null);
                        }}
                      >
                        <img src={inv.icon || def?.icon} alt={inv.name} className="w-10 h-10 object-contain" />
                        <div className="flex-1">
                          <span className="text-[12px] text-[#e0c68a]">{inv.name}</span>
                          {grade && (
                            <span className="ml-1 text-[11px] text-[#ff8c00]">({grade})</span>
                          )}
                          {hasLS && (
                            <span className="ml-1 text-[10px] text-green-400" title="LS вставлено">[LS]</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                );
              })()}
            </div>
            <button
              onClick={() => setInsertLSPicker(null)}
              className="mt-3 w-full py-2 text-[12px] bg-[#2a1f14] border border-[#5c4a32] text-[#e0c68a] rounded hover:bg-[#3d2f1a]"
            >
              Назад
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
