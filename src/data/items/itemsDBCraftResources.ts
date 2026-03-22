/**
 * Ресурси крафту (рівень 2): назви українською + іконки l2dop-by-itemid.
 * Не змінює droplistMapping — окремі id для результатів крафту.
 */
import type { ItemDefinition } from "./itemsDB.types";

export const itemsDBCraftResources: Record<string, ItemDefinition> = {
  varnish_of_purity: {
    id: "varnish_of_purity",
    name: "Лак чистоти",
    kind: "resource",
    slot: "resource",
    icon: "/items/drops/resources/l2dop-by-itemid/4039.jpg",
    description: "Ресурс крафту.",
    stackable: true,
  },
  synthetic_cokes: {
    id: "synthetic_cokes",
    name: "Синтетичний кокс",
    kind: "resource",
    slot: "resource",
    icon: "/items/drops/resources/l2dop-by-itemid/1895.jpg",
    description: "Ресурс крафту.",
    stackable: true,
  },
  cord: {
    id: "cord",
    name: "Веревка",
    kind: "resource",
    slot: "resource",
    icon: "/items/drops/resources/l2dop-by-itemid/1884.jpg",
    description: "Ресурс крафту.",
    stackable: true,
  },
  silver_mold: {
    id: "silver_mold",
    name: "Срібна заготовка",
    kind: "resource",
    slot: "resource",
    icon: "/items/drops/resources/l2dop-by-itemid/1881.jpg",
    description: "Ресурс крафту.",
    stackable: true,
  },
  compound_braid: {
    id: "compound_braid",
    name: "Міцний шнурок",
    kind: "resource",
    slot: "resource",
    icon: "/items/drops/resources/l2dop-by-itemid/1889.jpg",
    description: "Ресурс крафту.",
    stackable: true,
  },
  high_grade_suede: {
    id: "high_grade_suede",
    name: "Якісна замша",
    kind: "resource",
    slot: "resource",
    icon: "/items/drops/resources/l2dop-by-itemid/1885.jpg",
    description: "Ресурс крафту.",
    stackable: true,
  },
  steel_mold: {
    id: "steel_mold",
    name: "Стальна заготовка",
    kind: "resource",
    slot: "resource",
    icon: "/items/drops/resources/l2dop-by-itemid/1880.jpg",
    description: "Ресурс крафту.",
    stackable: true,
  },
};
