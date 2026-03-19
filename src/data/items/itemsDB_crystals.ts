// src/data/items/itemsDB_crystals.ts
// Кристал D + ЛС D — купуються в GM-шопі (Розсодники), доступні з 20 рівня

import type { ItemDefinition } from "./itemsDB.types";

export const itemsDBCrystals: Record<string, ItemDefinition> = {
  crystal_d: {
    id: "crystal_d",
    name: "Кристал (D)",
    kind: "resource",
    slot: "resource",
    icon: "/items/drops/resources/Etc_bead_white_i00_0.jpg",
    description: "Кристал D-грейду. Вставляється в зброю разом з ЛС (D).",
    grade: "D",
    stats: {},
  },
  crystal_ls_d: {
    id: "crystal_ls_d",
    name: "ЛС (D)",
    kind: "resource",
    slot: "resource",
    icon: "/items/drops/resources/Etc_mineral_unique_i03_0.jpg",
    description: "Підходить до всіх кристалів. При вставці в зброю дає випадковий бонус (крит, маг. крит, HP, фокус тощо).",
    grade: "D",
    stats: {},
  },
};
