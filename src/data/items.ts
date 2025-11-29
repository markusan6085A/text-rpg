export type Item = {
  id: string;
  name: string;
  type: "resource" | "weapon" | "armor" | "jewelry" | "consumable";
  grade: "NG" | "D" | "C" | "B" | "A" | "S";
};

export const ITEMS: Item[] = [
  { id: "bone", name: "Кость", type: "resource", grade: "NG" },
  { id: "animal_skin", name: "Звериная шкура", type: "resource", grade: "NG" },
  { id: "animal_bone", name: "Крупная кость", type: "resource", grade: "NG" },
  { id: "coal", name: "Уголь", type: "resource", grade: "NG" },
  { id: "charcoal", name: "Древесный уголь", type: "resource", grade: "NG" },
  { id: "iron_ore", name: "Железная руда", type: "resource", grade: "NG" },
  { id: "steel", name: "Сталь", type: "resource", grade: "D" },
  { id: "suede", name: "Замша", type: "resource", grade: "NG" },
  { id: "coarse_bone_powder", name: "Костяная пыль", type: "resource", grade: "NG" },
  { id: "dark_soul_powder", name: "Порошок тьмы", type: "resource", grade: "D" },
  { id: "wooden_arrow", name: "Деревянная стрела", type: "consumable", grade: "NG" },
  { id: "soulshot_ng", name: "Соулшот (NG)", type: "consumable", grade: "NG" },
  { id: "spiritshot_ng", name: "Спиритшот (NG)", type: "consumable", grade: "NG" },

  { id: "ng_dagger", name: "Short Sword", type: "weapon", grade: "NG" },
  { id: "ng_sword", name: "Long Sword", type: "weapon", grade: "NG" },
  { id: "ng_bow", name: "Short Bow", type: "weapon", grade: "NG" },
  { id: "ng_staff", name: "Mystic Staff", type: "weapon", grade: "NG" },
  { id: "ng_two_handed_sword", name: "Two-handed Sword", type: "weapon", grade: "NG" },

  { id: "ng_light_boots", name: "Leather Boots", type: "armor", grade: "NG" },
  { id: "ng_light_gloves", name: "Leather Gloves", type: "armor", grade: "NG" },
  { id: "ng_light_chest", name: "Leather Armor", type: "armor", grade: "NG" },
  { id: "ng_heavy_boots", name: "Iron Boots", type: "armor", grade: "NG" },
  { id: "ng_heavy_gauntlets", name: "Iron Gauntlets", type: "armor", grade: "NG" },
  { id: "ng_heavy_chest", name: "Iron Armor", type: "armor", grade: "NG" },
  { id: "ng_heavy_helmet", name: "Iron Helmet", type: "armor", grade: "NG" },
  { id: "ng_robe_gloves", name: "Linen Gloves", type: "armor", grade: "NG" },
  { id: "ng_robe_chest", name: "Linen Robe", type: "armor", grade: "NG" },
  { id: "ng_robe_hat", name: "Cloth Cap", type: "armor", grade: "NG" },

  { id: "ng_ring", name: "Ring of Courage", type: "jewelry", grade: "NG" },
];
