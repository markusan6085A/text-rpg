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

  // ===== LS (Lucky Strike) — mineral іконки =====
  crystal_lucky_strike_c: {
    id: "crystal_lucky_strike_c",
    name: "Кристал Удачі (C)",
    kind: "resource",
    slot: "resource",
    icon: "/items/drops/resources/Etc_mineral_general_i03_0.jpg",
    description: "Кристал душі C-грейду. Вставляється в зброю C-грейду. Збільшує шанс критичного удару на 2%.",
    grade: "C",
    stats: { luckyStrike: 2 },
  },

  // ===== B-GRADE LS КРИСТАЛИ =====
  crystal_lucky_strike_b: {
    id: "crystal_lucky_strike_b",
    name: "Кристал Удачі (B)",
    kind: "resource",
    slot: "resource",
    icon: "/items/drops/resources/Etc_mineral_rare_i03_0.jpg",
    description: "Кристал душі B-грейду. Вставляється в зброю B-грейду. Збільшує шанс критичного удару на 3%.",
    grade: "B",
    stats: { luckyStrike: 3 },
  },

  // ===== A-GRADE LS КРИСТАЛИ =====
  crystal_lucky_strike_a: {
    id: "crystal_lucky_strike_a",
    name: "Кристал Удачі (A)",
    kind: "resource",
    slot: "resource",
    icon: "/items/drops/resources/Etc_mineral_special_i03_0.jpg",
    description: "Кристал душі A-грейду. Вставляється в зброю A-грейду. Збільшує шанс критичного удару на 4%.",
    grade: "A",
    stats: { luckyStrike: 4 },
  },

  // ===== S-GRADE LS КРИСТАЛИ =====
  crystal_lucky_strike_s: {
    id: "crystal_lucky_strike_s",
    name: "Кристал Удачі (S)",
    kind: "resource",
    slot: "resource",
    icon: "/items/drops/resources/Etc_mineral_unique_i03_0.jpg",
    description: "Кристал душі S-грейду. Вставляється в зброю S-грейду. Збільшує шанс критичного удару на 5%.",
    grade: "S",
    stats: { luckyStrike: 5 },
  },
};
