/**
 * Resource craft — level 4. Unlock level not specified in brief; set to 60 (adjust if needed).
 * 100% success.
 */

import type { StringIdCraftRecipe } from "./resourceCraftTypes";

export const RESOURCE_CRAFT_LEVEL4_UNLOCK_LEVEL = 60;

export const RESOURCE_CRAFT_LEVEL4_RECIPES: readonly StringIdCraftRecipe[] = [
  {
    outputId: "maestro_mold",
    ingredients: [
      { stringId: "blacksmith_frame", count: 1 },
      { stringId: "mold_glue", count: 10 },
      { stringId: "asofe", count: 5 },
    ],
  },
  {
    outputId: "craftsman_mold",
    ingredients: [
      { stringId: "artisans_frame", count: 2 },
      { stringId: "mold_hardener", count: 20 },
      { stringId: "enria", count: 5 },
    ],
  },
  {
    outputId: "maestro_holder",
    ingredients: [
      { stringId: "varnish_of_purity", count: 10 },
      { stringId: "mold_lubricant", count: 10 },
      { stringId: "mold_hardener", count: 10 },
    ],
  },
  {
    outputId: "maestro_anvil_lock",
    ingredients: [
      { stringId: "synthetic_cokes", count: 4 },
      { stringId: "mold_glue", count: 4 },
      { stringId: "mold_lubricant", count: 4 },
    ],
  },
];
