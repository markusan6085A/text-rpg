// src/screens/GMShop.tsx
import React, { useState } from "react";
import { useHeroStore } from "../state/heroStore";
import { itemsDB } from "../data/items/itemsDB";

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
      alert("Недостатньо Ancient Adena (AA)!");
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
      alert("Недостатньо Ancient Adena (AA)!");
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
    alert("Недостатньо Ancient Adena (AA)!");
  };

  // Обробка обміну
  const handleExchange = (type: string, stoneId: string, aaPerStone: number, stoneName: string) => {
    if (!hero) return;

    const stoneItem = hero.inventory?.find(item => item.id === stoneId);
    const stoneCount = stoneItem?.count || 0;

    if (stoneCount < exchangeQuantity) {
      alert(`У вас недостатньо ${stoneName}!`);
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
                ? "text-gray-200 font-semibold border-b border-gray-300" 
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
                ? "text-gray-200 font-semibold border-b border-gray-300" 
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
          {/* Фільтр грейдів */}
          <div className="mb-2 flex gap-1 flex-wrap">
            {(["D", "C", "B", "A", "S"] as const).map((grade) => (
              <button
                key={grade}
                onClick={() => setSelectedGrade(grade)}
                className={`px-2 py-1 text-[11px] ${
                  selectedGrade === grade
                    ? "bg-[#3d2f1a] text-[#ff8c00] border border-[#5b4726]"
                    : "bg-[#1a1208] text-gray-400 border border-[#2a1a10] hover:text-gray-300"
                }`}
              >
                {grade}
              </button>
            ))}
          </div>
          
          <div className="space-y-1">
            {GM_SHOP_ITEMS.filter(item => item.grade === selectedGrade).map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 py-1.5 border-b border-dotted border-[#5b4b35]/30 hover:bg-black/20 cursor-pointer"
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
            <div className="mt-4 pt-4 border-t border-[#5b4726]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-white text-[12px]">Кількість каменів:</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setExchangeQuantity(Math.max(1, exchangeQuantity - 1))}
                    className="px-2 py-1 bg-[#1a1208] text-white border border-[#5b4726] rounded text-[12px] hover:bg-[#2a1a10]"
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
                    className="w-16 px-2 py-1 bg-[#1a1208] text-white border border-[#5b4726] rounded text-center text-[12px]"
                  />
                  <button
                    onClick={() => setExchangeQuantity(exchangeQuantity + 1)}
                    className="px-2 py-1 bg-[#1a1208] text-white border border-[#5b4726] rounded text-[12px] hover:bg-[#2a1a10]"
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
            className="bg-[#14110c] border border-[#3b2614] rounded-lg p-4 max-w-[350px] w-full"
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
                className="text-[#ff8c00] text-[12px] hover:text-[#ffa500] cursor-pointer px-4 py-2 bg-[#1a1208] border border-[#5b4726] rounded"
              >
                Підтвердити
              </button>
              <button
                onClick={() => setConfirmExchange(null)}
                className="text-gray-400 text-[12px] hover:text-gray-300 cursor-pointer px-4 py-2 bg-[#1a1208] border border-[#5b4726] rounded"
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
            className="bg-[#14110c] border border-[#3b2614] rounded-lg p-4 max-w-[400px] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Заголовок */}
            <div className="text-center text-white text-lg font-bold mb-4 border-b border-[#5b4726] pb-2">
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
            <div className="mb-4 border-t border-[#5b4726] pt-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-white text-[12px]">Кількість:</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setBuyQuantity(Math.max(1, buyQuantity - 1))}
                    className="px-2 py-1 bg-[#1a1208] text-white border border-[#5b4726] rounded text-[12px] hover:bg-[#2a1a10]"
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
                    className="w-16 px-2 py-1 bg-[#1a1208] text-white border border-[#5b4726] rounded text-center text-[12px]"
                  />
                  <button
                    onClick={() => setBuyQuantity(buyQuantity + 1)}
                    className="px-2 py-1 bg-[#1a1208] text-white border border-[#5b4726] rounded text-[12px] hover:bg-[#2a1a10]"
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
                className="text-green-400 text-[12px] py-2 hover:text-green-300 cursor-pointer px-4 bg-[#1a1208] border border-[#5b4726] rounded"
              >
                Купити
              </button>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-gray-400 text-[12px] py-2 hover:text-gray-300 cursor-pointer px-4 bg-[#1a1208] border border-[#5b4726] rounded"
              >
                Скасувати
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
