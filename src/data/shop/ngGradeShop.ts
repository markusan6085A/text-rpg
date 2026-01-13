// src/data/shop/ngGradeShop.ts
// NG Grade предмети для магазину

import type { ShopItem } from "./shopTypes";

export const NG_GRADE_SHOP_ITEMS: ShopItem[] = [
  // ===== SHOTS (СОСКИ) =====
  // Для воїнів
  {
    id: "shop_soulshot_ng",
    itemId: 2001, // Унікальний ID для NG-grade soulshot
    name: "Soulshot (NG-grade)",
    grade: "NG",
    type: "consumable",
    category: "soulshot",
    price: 3, // Ціна за 1 соулшот
    icon: "/items/drops/resources/etc_spirit_bullet_white_i00.png",
    description: "Соулшот NG-грейду для воїнів",
    soulshots: 1,
  },
  // Для магів
  {
    id: "shop_spiritshot_ng",
    itemId: 2002, // Унікальний ID для NG-grade spiritshot
    name: "Spiritshot (NG-grade)",
    grade: "NG",
    type: "consumable",
    category: "spiritshot",
    price: 3, // Ціна за 1 спірітшот
    icon: "/items/drops/resources/Etc_spell_shot_white_i01_0.jpg",
    description: "Спірітшот NG-грейду для магів",
    spiritshots: 1,
  },
  
  // ===== ARROWS (СТРІЛИ) =====
  {
    id: "shop_wooden_arrow",
    itemId: 17, // ID деревяної стріли
    name: "Wooden Arrow",
    grade: "NG",
    type: "consumable",
    category: "arrow",
    price: 2, // Ціна за 1 стрілу
    icon: "/items/drops/resources/etc_wooden_quiver_i00.png",
    description: "Дерев'яна стріла NG-грейду",
  },
  
  // ===== MATERIALS (МАТЕРІАЛИ) =====
  {
    id: "shop_gludio_fish_lure",
    itemId: 5001, // Унікальний ID для наживки
    name: "Наживка для риби (Gludio)",
    grade: "NG",
    type: "material",
    category: "resource",
    price: 5000, // Ціна за 1 наживку
    icon: "/items/drops/resources/Etc_gludio_fish_lure_i00_0.jpg",
    description: "Наживка для риболовлі з міста Gludio. Використовується для ловлі риби.",
  },
  {
    id: "shop_baby_duck_rod",
    itemId: 6529, // XML ID для Baby Duck Rod
    name: "Baby Duck Rod",
    grade: "NG",
    type: "material",
    category: "rod",
    price: 10000, // Ціна за удочку
    icon: "/items/drops/resources/Baby_Duck_Rod.jpg",
    stats: {
      pAtk: 1,
      mAtk: 1,
    },
    description: "Удочка Baby Duck для риболовлі. Можна одягати з будь-якого рівня.",
  },
];
