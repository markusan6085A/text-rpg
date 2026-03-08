// src/data/items/itemsDB_crystals.ts
// Кристали LS (Lucky Strike) для зброї C–S грейду — дропаються з Збирача Мамона

import type { ItemDefinition } from "./itemsDB.types";

export const itemsDBCrystals: Record<string, ItemDefinition> = {
  // ===== C-GRADE LS КРИСТАЛИ =====
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
