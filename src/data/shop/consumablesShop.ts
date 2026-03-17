// src/data/shop/consumablesShop.ts
// Расходники для магазину (стріли, зілля, соулшоти, спірітшоти, заточки)

import type { ShopItem } from "./shopTypes";

export const CONSUMABLES_SHOP_ITEMS: ShopItem[] = [
  // ===== POTIONS (БУТИЛКИ) =====
  // HP Potions
  {
    id: "shop_lesser_healing_potion",
    itemId: 3001, // Унікальний ID
    name: "Lesser Healing Potion",
    grade: "NG",
    type: "consumable",
    category: "potion",
    price: 50, // Ціна за 1 бутилку
    icon: "/items/drops/resources/etc_lesser_potion_red_i00.png",
    description: "Мала банка HP. Відновлює +200 HP",
    restoreHp: 200,
  },
  {
    id: "shop_healing_potion",
    itemId: 3002, // Унікальний ID
    name: "Healing Potion",
    grade: "D",
    type: "consumable",
    category: "potion",
    price: 120, // Ціна за 1 бутилку
    icon: "/items/drops/resources/Etc_potion_scarlet_i00_0.jpg",
    description: "Велика банка HP. Відновлює +500 HP",
    restoreHp: 500,
  },
  // MP Potions
  {
    id: "shop_lesser_mana_potion",
    itemId: 3003, // Унікальний ID
    name: "Lesser Mana Potion",
    grade: "NG",
    type: "consumable",
    category: "potion",
    price: 50, // Ціна за 1 бутилку
    icon: "/items/drops/resources/etc_reagent_blue_i00.png",
    description: "Мала банка MP. Відновлює +200 MP",
    restoreMp: 200,
  },
  {
    id: "shop_mana_potion",
    itemId: 3004, // Унікальний ID
    name: "Mana Potion",
    grade: "D",
    type: "consumable",
    category: "potion",
    price: 120, // Ціна за 1 бутилку
    icon: "/items/drops/resources/Etc_potion_blue_i00_0.jpg",
    description: "Велика бутилка MP. Відновлює +500 MP",
    restoreMp: 500,
  },
  // CP Potion
  {
    id: "shop_cp_potion",
    itemId: 3005, // Унікальний ID
    name: "CP Potion",
    grade: "NG",
    type: "consumable",
    category: "potion",
    price: 150, // Ціна за 1 бутилку
    icon: "/items/drops/resources/Br_cash_cp_potion_i00_0.jpg",
    description: "CP бутилка. Відновлює +500 CP",
    restoreCp: 500,
  },
  
  // ===== ENCHANT SCROLLS - WEAPON (ЗАТОЧКИ НА ЗБРОЮ) =====
  {
    id: "shop_d_enchant_weapon_scroll",
    itemId: 4001, // Унікальний ID
    name: "Scroll: Enchant Weapon (D-grade)",
    grade: "D",
    type: "consumable",
    category: "enchant_scroll",
    price: 50000,
    icon: "/items/drops/resources/etc_blessed_scrl_of_ench_wp_d_i01.png",
    description: "Заточка для D-grade зброї. Шанси: до +5 100%, +5-+15 80%, +15-+30 70%, +30-+40 60%",
  },
  {
    id: "shop_c_enchant_weapon_scroll",
    itemId: 4002, // Унікальний ID
    name: "Scroll: Enchant Weapon (C-grade)",
    grade: "C",
    type: "consumable",
    category: "enchant_scroll",
    price: 110000,
    icon: "/items/drops/resources/etc_scroll_of_enchant_weapon_i02.png",
    description: "Заточка для C-grade зброї. Шанси: до +5 100%, +5-+15 80%, +15-+30 70%, +30-+40 60%",
  },
  {
    id: "shop_b_enchant_weapon_scroll",
    itemId: 4003, // Унікальний ID
    name: "Scroll: Enchant Weapon (B-grade)",
    grade: "B",
    type: "consumable",
    category: "enchant_scroll",
    price: 500000,
    icon: "/items/drops/resources/etc_scroll_of_enchant_weapon_i03.png",
    description: "Заточка для B-grade зброї. Шанси: до +5 100%, +5-+15 80%, +15-+30 70%, +30-+40 60%",
  },
  {
    id: "shop_a_enchant_weapon_scroll",
    itemId: 4004, // Унікальний ID
    name: "Scroll: Enchant Weapon (A-grade)",
    grade: "A",
    type: "consumable",
    category: "enchant_scroll",
    price: 1800000,
    icon: "/items/drops/resources/etc_scroll_of_enchant_weapon_i04.png",
    description: "Заточка для A-grade зброї. Шанси: до +5 100%, +5-+15 80%, +15-+30 70%, +30-+40 60%",
  },
  {
    id: "shop_s_enchant_weapon_scroll",
    itemId: 4005, // Унікальний ID
    name: "Scroll: Enchant Weapon (S-grade)",
    grade: "S",
    type: "consumable",
    category: "enchant_scroll",
    price: 5000000,
    icon: "/items/drops/resources/etc_scroll_of_enchant_weapon_i05.png",
    description: "Заточка для S-grade зброї. Шанси: до +5 100%, +5-+15 80%, +15-+30 70%, +30-+40 60%",
  },
  
  // ===== ENCHANT SCROLLS - ARMOR (ЗАТОЧКИ НА БРОНЮ/БІЖУТЕРІЮ/ПОЯС/ПЛАЩ) =====
  {
    id: "shop_d_enchant_armor_scroll",
    itemId: 4006, // Унікальний ID
    name: "Scroll: Enchant Armor (D-grade)",
    grade: "D",
    type: "consumable",
    category: "enchant_scroll",
    price: 50000,
    icon: "/items/drops/resources/etc_blessed_scrl_of_ench_am_d_i01.png",
    description: "Заточка для D-grade броні/біжутерії/пояса/плаща. Шанси: до +3 100%, до +10 90%, до +20 80%, до +30 70%",
  },
  {
    id: "shop_c_enchant_armor_scroll",
    itemId: 4007, // Унікальний ID
    name: "Scroll: Enchant Armor (C-grade)",
    grade: "C",
    type: "consumable",
    category: "enchant_scroll",
    price: 80000,
    icon: "/items/drops/resources/etc_scroll_of_enchant_weapon_i01.png",
    description: "Заточка для C-grade броні/біжутерії/пояса/плаща. Шанси: до +3 100%, до +10 90%, до +20 80%, до +30 70%",
  },
  {
    id: "shop_b_enchant_armor_scroll",
    itemId: 4008, // Унікальний ID
    name: "Scroll: Enchant Armor (B-grade)",
    grade: "B",
    type: "consumable",
    category: "enchant_scroll",
    price: 80000,
    icon: "/items/drops/resources/etc_scroll_of_enchant_armor_i03.png",
    description: "Заточка для B-grade броні/біжутерії/пояса/плаща. Шанси: до +3 100%, до +10 90%, до +20 80%, до +30 70%",
  },
  {
    id: "shop_a_enchant_armor_scroll",
    itemId: 4009, // Унікальний ID
    name: "Scroll: Enchant Armor (A-grade)",
    grade: "A",
    type: "consumable",
    category: "enchant_scroll",
    price: 240000,
    icon: "/items/drops/resources/etc_scroll_of_enchant_armor_i04.png",
    description: "Заточка для A-grade броні/біжутерії/пояса/плаща. Шанси: до +3 100%, до +10 90%, до +20 80%, до +30 70%",
  },
  {
    id: "shop_s_enchant_armor_scroll",
    itemId: 4010, // Унікальний ID
    name: "Scroll: Enchant Armor (S-grade)",
    grade: "S",
    type: "consumable",
    category: "enchant_scroll",
    price: 500000,
    icon: "/items/drops/resources/etc_scroll_of_enchant_armor_i05.png",
    description: "Заточка для S-grade броні/біжутерії/пояса/плаща. Шанси: до +3 100%, до +10 90%, до +20 80%, до +30 70%",
  },
];
