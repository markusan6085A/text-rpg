/** Спільні типи крафту ресурсів */

export type ResourceCraftIngredientByString = { stringId: string; count: number };

/** Рецепт за внутрішніми string id (рівень 2 та ін.) */
export type StringIdCraftRecipe = {
  outputId: string;
  ingredients: ResourceCraftIngredientByString[];
};
