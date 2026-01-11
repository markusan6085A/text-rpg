// src/utils/materialResourcesByLevel.ts
// Material ресурси з XML, згруповані по рівнях мобів
// Генеровано автоматично з XML файлів

export const MATERIAL_RESOURCES_BY_LEVEL: Record<number, string[]> = {
  // Рівень 1: 0-500 (1-20 лвл мобів)
  1: [
    "twig_of_treant", "beast_blood", "beast_bone", "hot_oil", "bronze", "fur",
    "mithril", "durable_stem", "bark_of_treant", "refined_steel", "bowstring",
    "stone_of_anguish", "sprig_of_wisdom", "blue_diamond_fragment", "claw_of_leopard",
    "leather_shoes_material", "leather_tunic_material", "leather_stockings_material",
    "leather_helmet_material", "leather_gloves_texture", "boots_material",
    "leather_boots_material", "crafted_leather_gloves_texture", "soul_ore",
    "bloodsteel", "silver", "oriharukon", "adamantite", "blackmithril",
    "crystal", "varnish", "thick_leather", "hard_leather", "coarse_bone_powder",
    "animal_skin", "animal_bone", "coal", "charcoal", "crafted_leather",
    "bone_powder", "thread", "cord", "suede", "iron_ore", "steel"
  ],
  
  // Рівень 20: 500-1500 (20-30 лвл мобів)
  20: [
    "leather_shoes_material", "leather_tunic_material", "leather_stockings_material",
    "leather_helmet_material", "leather_gloves_texture", "boots_material",
    "leather_boots_material", "crafted_leather_gloves_texture", "soul_ore",
    "bloodsteel", "silver", "oriharukon", "adamantite", "blackmithril",
    "crystal", "varnish", "thick_leather", "hard_leather", "coarse_bone_powder",
    "metallic_thread", "durable_metal_plate", "leolins_mold", "warsmiths_mold",
    "arcsmiths_anvil", "warsmiths_holder", "high_grade_suede", "metallic_fiber"
  ],
  
  // Рівень 30: 1500-3000 (30-40 лвл мобів)
  30: [
    "soul_ore", "bloodsteel", "silver", "oriharukon", "adamantite", "blackmithril",
    "crystal", "varnish", "thick_leather", "hard_leather", "metallic_thread",
    "durable_metal_plate", "leolins_mold", "warsmiths_mold", "arcsmiths_anvil",
    "warsmiths_holder", "high_grade_suede", "metallic_fiber", "fine_steel",
    "compound_braid", "synthetic_cokes", "rind_leather_boot_lining"
  ],
  
  // Рівень 40: 3000-6000 (40-50 лвл мобів)
  40: [
    "oriharukon", "adamantite", "blackmithril", "crystal", "metallic_thread",
    "durable_metal_plate", "leolins_mold", "warsmiths_mold", "arcsmiths_anvil",
    "warsmiths_holder", "high_grade_suede", "metallic_fiber", "fine_steel",
    "compound_braid", "synthetic_cokes", "rind_leather_boot_lining", "artisans_frame",
    "blacksmiths_frame", "mithril_ore", "silver_mold"
  ],
  
  // Рівень 50: 6000-12000 (50-60 лвл мобів)
  50: [
    "adamantite", "blackmithril", "crystal", "durable_metal_plate", "leolins_mold",
    "warsmiths_mold", "arcsmiths_anvil", "warsmiths_holder", "metallic_fiber",
    "fine_steel", "compound_braid", "synthetic_cokes", "artisans_frame",
    "blacksmiths_frame", "mithril_ore", "silver_mold", "dragon_scale", "dragon_bone"
  ],
  
  // Рівень 60: 12000-25000 (60-70 лвл мобів)
  60: [
    "blackmithril", "crystal", "warsmiths_mold", "arcsmiths_anvil", "warsmiths_holder",
    "metallic_fiber", "fine_steel", "compound_braid", "synthetic_cokes",
    "artisans_frame", "blacksmiths_frame", "mithril_ore", "dragon_scale",
    "dragon_bone", "pure_silver", "true_gold", "sages_stone"
  ],
  
  // Рівень 70: 25000+ (70+ лвл мобів)
  70: [
    "crystal", "warsmiths_mold", "arcsmiths_anvil", "warsmiths_holder",
    "metallic_fiber", "fine_steel", "dragon_scale", "dragon_bone",
    "pure_silver", "true_gold", "sages_stone", "blood_fire", "mimirs_elixir"
  ]
};

/**
 * Отримує список material ресурсів для заданого рівня моба
 */
export function getMaterialResourcesForLevel(mobLevel: number): string[] {
  if (mobLevel < 20) return MATERIAL_RESOURCES_BY_LEVEL[1] || [];
  if (mobLevel < 30) return MATERIAL_RESOURCES_BY_LEVEL[20] || [];
  if (mobLevel < 40) return MATERIAL_RESOURCES_BY_LEVEL[30] || [];
  if (mobLevel < 50) return MATERIAL_RESOURCES_BY_LEVEL[40] || [];
  if (mobLevel < 60) return MATERIAL_RESOURCES_BY_LEVEL[50] || [];
  if (mobLevel < 70) return MATERIAL_RESOURCES_BY_LEVEL[60] || [];
  return MATERIAL_RESOURCES_BY_LEVEL[70] || [];
}


