/**
 * Крафт ресурсів — рівень 3 (відкриття з 50 lvl).
 * Шанс 100%.
 */

import type { StringIdCraftRecipe } from "./resourceCraftTypes";

export const RESOURCE_CRAFT_LEVEL3_UNLOCK_LEVEL = 50;

export const RESOURCE_CRAFT_LEVEL3_RECIPES: readonly StringIdCraftRecipe[] = [
  {
    outputId: "mithril_alloy",
    ingredients: [
      { stringId: "varnish_of_purity", count: 1 },
      { stringId: "steel", count: 2 },
      { stringId: "mithril_ore", count: 1 },
    ],
  },
  {
    outputId: "crafted_leather",
    ingredients: [
      { stringId: "cord", count: 4 },
      { stringId: "leather", count: 4 },
      { stringId: "coal", count: 4 },
    ],
  },
  {
    outputId: "blacksmith_frame",
    ingredients: [
      { stringId: "silver_mold", count: 1 },
      { stringId: "varnish_of_purity", count: 5 },
      { stringId: "mithril_ore", count: 10 },
    ],
  },
  {
    outputId: "artisans_frame",
    ingredients: [
      { stringId: "steel_mold", count: 1 },
      { stringId: "varnish_of_purity", count: 5 },
      { stringId: "adamantite_nugget", count: 10 },
    ],
  },
  {
    outputId: "oriharukon",
    ingredients: [
      { stringId: "synthetic_cokes", count: 1 },
      { stringId: "silver_nugget", count: 12 },
      { stringId: "oriharukon_ore", count: 4 },
    ],
  },
  {
    outputId: "metal_hardener",
    ingredients: [
      { stringId: "stem", count: 10 },
      { stringId: "varnish", count: 10 },
      { stringId: "iron_ore", count: 10 },
    ],
  },
  {
    outputId: "metallic_fiber",
    ingredients: [
      { stringId: "cord", count: 20 },
      { stringId: "silver_nugget", count: 15 },
    ],
  },
  {
    outputId: "durable_metal_plate",
    ingredients: [
      { stringId: "metallic_thread", count: 5 },
      { stringId: "mithril_ore", count: 5 },
    ],
  },
  {
    outputId: "metallic_thread",
    ingredients: [
      { stringId: "thread", count: 10 },
      { stringId: "iron_ore", count: 5 },
    ],
  },
];
