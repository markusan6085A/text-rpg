// GM-шоп: свитки заточки з 100% шансом успіху (іконки Giant_scrl_of_ench_*)
import type { ItemDefinition } from "./itemsDB.types";

// Файли в репо: public/items/drops/resources/Giant_scrl_of_ench_*_0.jpg
const ICON_AM = (g: string) => `/items/drops/resources/Giant_scrl_of_ench_am_${g}_0.jpg`;
const ICON_WP = (g: string) => `/items/drops/resources/Giant_scrl_of_ench_wp_${g}_0.jpg`;
const DESC_100 = "Заточка з 100% шансом успіху (GM). Ті ж правила макс. рівня (+40 зброя, +30 броня).";

export const itemsDBGmGiantEnchants: Record<string, ItemDefinition> = {
  gm_giant_enchant_armor_d: {
    id: "gm_giant_enchant_armor_d",
    name: "Giant Scroll: Enchant Armor (D-grade)",
    kind: "consumable",
    slot: "consumable",
    icon: ICON_AM("d"),
    description: `${DESC_100} D-grade броня / біжутерія / пояс / плащ / щит.`,
    grade: "D",
  },
  gm_giant_enchant_armor_c: {
    id: "gm_giant_enchant_armor_c",
    name: "Giant Scroll: Enchant Armor (C-grade)",
    kind: "consumable",
    slot: "consumable",
    icon: ICON_AM("c"),
    description: `${DESC_100} C-grade.`,
    grade: "C",
  },
  gm_giant_enchant_armor_b: {
    id: "gm_giant_enchant_armor_b",
    name: "Giant Scroll: Enchant Armor (B-grade)",
    kind: "consumable",
    slot: "consumable",
    icon: ICON_AM("b"),
    description: `${DESC_100} B-grade.`,
    grade: "B",
  },
  gm_giant_enchant_armor_a: {
    id: "gm_giant_enchant_armor_a",
    name: "Giant Scroll: Enchant Armor (A-grade)",
    kind: "consumable",
    slot: "consumable",
    icon: ICON_AM("a"),
    description: `${DESC_100} A-grade.`,
    grade: "A",
  },
  gm_giant_enchant_armor_s: {
    id: "gm_giant_enchant_armor_s",
    name: "Giant Scroll: Enchant Armor (S-grade)",
    kind: "consumable",
    slot: "consumable",
    icon: ICON_AM("s"),
    description: `${DESC_100} S-grade.`,
    grade: "S",
  },
  gm_giant_enchant_weapon_d: {
    id: "gm_giant_enchant_weapon_d",
    name: "Giant Scroll: Enchant Weapon (D-grade)",
    kind: "consumable",
    slot: "consumable",
    icon: ICON_WP("d"),
    description: `${DESC_100} D-grade зброя.`,
    grade: "D",
  },
  gm_giant_enchant_weapon_c: {
    id: "gm_giant_enchant_weapon_c",
    name: "Giant Scroll: Enchant Weapon (C-grade)",
    kind: "consumable",
    slot: "consumable",
    icon: ICON_WP("c"),
    description: `${DESC_100} C-grade зброя.`,
    grade: "C",
  },
  gm_giant_enchant_weapon_b: {
    id: "gm_giant_enchant_weapon_b",
    name: "Giant Scroll: Enchant Weapon (B-grade)",
    kind: "consumable",
    slot: "consumable",
    icon: ICON_WP("b"),
    description: `${DESC_100} B-grade зброя.`,
    grade: "B",
  },
  gm_giant_enchant_weapon_a: {
    id: "gm_giant_enchant_weapon_a",
    name: "Giant Scroll: Enchant Weapon (A-grade)",
    kind: "consumable",
    slot: "consumable",
    icon: ICON_WP("a"),
    description: `${DESC_100} A-grade зброя.`,
    grade: "A",
  },
  gm_giant_enchant_weapon_s: {
    id: "gm_giant_enchant_weapon_s",
    name: "Giant Scroll: Enchant Weapon (S-grade)",
    kind: "consumable",
    slot: "consumable",
    icon: ICON_WP("s"),
    description: `${DESC_100} S-grade зброя.`,
    grade: "S",
  },
};
