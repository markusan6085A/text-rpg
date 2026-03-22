/**
 * Крафт ресурсів — рівень 2 (відкриття з 40 lvl).
 * Усі рецепти за внутрішніми string id; шанс 100%.
 */

import type { StringIdCraftRecipe } from "./resourceCraftTypes";

export const RESOURCE_CRAFT_LEVEL2_UNLOCK_LEVEL = 40;

/** Порядок як у ТЗ */
export const RESOURCE_CRAFT_LEVEL2_RECIPES: readonly StringIdCraftRecipe[] = [
  {
    outputId: "varnish_of_purity",
    ingredients: [
      { stringId: "coarse_bone_powder", count: 3 },
      { stringId: "varnish", count: 3 },
      { stringId: "stone_of_purity", count: 1 },
    ],
  },
  {
    outputId: "synthetic_cokes",
    ingredients: [
      { stringId: "cokes", count: 3 },
      { stringId: "oriharukon_ore", count: 1 },
    ],
  },
  {
    outputId: "cord",
    ingredients: [
      { stringId: "steel", count: 2 },
      { stringId: "thread", count: 25 },
    ],
  },
  {
    outputId: "silver_mold",
    ingredients: [
      { stringId: "braided_hemp", count: 5 },
      { stringId: "cokes", count: 5 },
      { stringId: "silver_nugget", count: 10 },
    ],
  },
  {
    outputId: "compound_braid",
    ingredients: [
      { stringId: "braided_hemp", count: 5 },
      { stringId: "thread", count: 5 },
    ],
  },
  {
    outputId: "high_grade_suede",
    ingredients: [
      { stringId: "coarse_bone_powder", count: 1 },
      { stringId: "suede", count: 3 },
    ],
  },
  {
    outputId: "steel_mold",
    ingredients: [
      { stringId: "braided_hemp", count: 5 },
      { stringId: "iron_ore", count: 5 },
      { stringId: "coal", count: 5 },
    ],
  },
];
