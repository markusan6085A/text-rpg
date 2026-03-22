/**
 * Крафт ресурсів — рівень 1 (відкриття з 20 lvl).
 * Рецепти за L2 item_id з droplistMapping.
 */

export const RESOURCE_CRAFT_LEVEL1_UNLOCK_LEVEL = 20;

export type ResourceCraftIngredient = { l2ItemId: number; count: number };

export type ResourceCraftRecipe = {
  /** Результат крафту (L2 item id) */
  outputL2ItemId: number;
  ingredients: ResourceCraftIngredient[];
};

/** Порядок як у ТЗ: 1882 → 1881 → 1879 → 1880 → 1878 */
export const RESOURCE_CRAFT_LEVEL1_RECIPES: readonly ResourceCraftRecipe[] = [
  { outputL2ItemId: 1882, ingredients: [{ l2ItemId: 1867, count: 6 }] },
  { outputL2ItemId: 1881, ingredients: [{ l2ItemId: 1872, count: 1 }] },
  {
    outputL2ItemId: 1879,
    ingredients: [
      { l2ItemId: 1871, count: 3 },
      { l2ItemId: 1870, count: 3 },
    ],
  },
  {
    outputL2ItemId: 1880,
    ingredients: [
      { l2ItemId: 1865, count: 5 },
      { l2ItemId: 1869, count: 5 },
    ],
  },
  { outputL2ItemId: 1878, ingredients: [{ l2ItemId: 1864, count: 5 }] },
];
