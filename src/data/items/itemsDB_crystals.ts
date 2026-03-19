// src/data/items/itemsDB_crystals.ts
// Кристали для зброї C–S грейду (купуються в GM-шопі)

import type { ItemDefinition } from "./itemsDB.types";

export const itemsDBCrystals: Record<string, ItemDefinition> = {
  // ===== КРИСТАЛИ (bead іконки) =====
  crystal_c: {
    id: "crystal_c",
    name: "Кристал (C)",
    kind: "resource",
    slot: "resource",
    icon: "/items/drops/resources/Etc_bead_green_i00_0.jpg",
    description: "Кристал душі C-грейду. Вставляється в зброю C-грейду.",
    grade: "C",
    stats: {},
  },
  crystal_b: {
    id: "crystal_b",
    name: "Кристал (B)",
    kind: "resource",
    slot: "resource",
    icon: "/items/drops/resources/Etc_bead_red_i00_0.jpg",
    description: "Кристал душі B-грейду. Вставляється в зброю B-грейду.",
    grade: "B",
    stats: {},
  },
  crystal_a: {
    id: "crystal_a",
    name: "Кристал (A)",
    kind: "resource",
    slot: "resource",
    icon: "/items/drops/resources/Etc_bead_silver_i00_0.jpg",
    description: "Кристал душі A-грейду. Вставляється в зброю A-грейду.",
    grade: "A",
    stats: {},
  },
  crystal_s: {
    id: "crystal_s",
    name: "Кристал (S)",
    kind: "resource",
    slot: "resource",
    icon: "/items/drops/resources/Etc_bead_white_i00_0.jpg",
    description: "Кристал душі S-грейду. Вставляється в зброю S-грейду.",
    grade: "S",
    stats: {},
  },

  // ===== LS — 1 на грейд, при вставці в зброю дає випадковий бонус =====
  crystal_ls_c: {
    id: "crystal_ls_c",
    name: "ЛС (C)",
    kind: "resource",
    slot: "resource",
    icon: "/items/drops/resources/Etc_mineral_general_i03_0.jpg",
    description: "При вставці в зброю дає випадковий бонус (крит, маг. крит, HP, фокус тощо).",
    grade: "C",
    stats: {},
  },
  crystal_ls_b: {
    id: "crystal_ls_b",
    name: "ЛС (B)",
    kind: "resource",
    slot: "resource",
    icon: "/items/drops/resources/Etc_mineral_rare_i03_0.jpg",
    description: "При вставці в зброю дає випадковий бонус (крит, маг. крит, HP, фокус тощо).",
    grade: "B",
    stats: {},
  },
  crystal_ls_a: {
    id: "crystal_ls_a",
    name: "ЛС (A)",
    kind: "resource",
    slot: "resource",
    icon: "/items/drops/resources/Etc_mineral_special_i03_0.jpg",
    description: "При вставці в зброю дає випадковий бонус (крит, маг. крит, HP, фокус тощо).",
    grade: "A",
    stats: {},
  },
  crystal_ls_s: {
    id: "crystal_ls_s",
    name: "ЛС (S)",
    kind: "resource",
    slot: "resource",
    icon: "/items/drops/resources/Etc_mineral_unique_i03_0.jpg",
    description: "При вставці в зброю дає випадковий бонус (крит, маг. крит, HP, фокус тощо).",
    grade: "S",
    stats: {},
  },
};
