// src/data/items/itemsDB_crystals.ts
// Кристал S + ЛС S — купуються в GM-шопі (Розсодники), доступні з 20 рівня

import type { ItemDefinition } from "./itemsDB.types";

export const itemsDBCrystals: Record<string, ItemDefinition> = {
  crystal_s: {
    id: "crystal_s",
    name: "Кристал (S)",
    kind: "resource",
    slot: "resource",
    icon: "/items/drops/resources/Etc_bead_white_i00_0.jpg",
    description: "Кристал S-грейду. Вставляється в зброю разом з ЛС (S).",
    grade: "S",
    stats: {},
  },
  crystal_ls_s: {
    id: "crystal_ls_s",
    name: "ЛС (S)",
    kind: "resource",
    slot: "resource",
    icon: "/items/drops/resources/Etc_mineral_unique_i03_0.jpg",
    description: "Підходить до всіх кристалів. При вставці в зброю дає випадковий бонус (крит, маг. крит, HP, фокус тощо).",
    grade: "S",
    stats: {},
  },
};
