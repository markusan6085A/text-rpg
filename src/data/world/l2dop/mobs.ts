// Мобі з l2dop (lineage.sql npc + droplist)
// Джерело: gludio32_1725_01 — Молодой Шакал, Бородатый Шакал

import type { Mob } from "../types";
import type { DropEntry } from "../../combat/types";

function drop(
  id: string,
  kind: "adena" | "resource" | "equipment" | "other",
  chance: number,
  min: number,
  max: number
): DropEntry {
  return { id, kind, chance, min, max };
}

// Молодой Шакал — 20545, lvl 1, hp 62, mp 44
// droplist: adena 8–12 (70%), spoil thread/silver_nugget
export const L2DOP_MOB_20545: Mob = {
  id: "l2dop_20545",
  name: "Молодой Шакал",
  level: 1,
  hp: 62,
  mp: 44,
  pAtk: 9,
  mAtk: 3,
  pDef: 39,
  mDef: 32,
  exp: 35,
  sp: 2,
  adenaMin: 8,
  adenaMax: 12,
  dropChance: 0.7,
  drops: [
    drop("thread", "resource", 0.0066, 1, 1),
    drop("silver_nugget", "resource", 0.0013, 1, 1),
  ],
  spoil: [
    drop("thread", "resource", 0.0066, 1, 1),
    drop("silver_nugget", "resource", 0.0013, 1, 1),
  ],
};

// Бородатый Шакал — 20481
export const L2DOP_MOB_20481: Mob = {
  id: "l2dop_20481",
  name: "Бородатый Шакал",
  level: 1,
  hp: 62,
  mp: 44,
  pAtk: 9,
  mAtk: 3,
  pDef: 39,
  mDef: 32,
  exp: 35,
  sp: 2,
  adenaMin: 8,
  adenaMax: 12,
  dropChance: 0.7,
  drops: [
    drop("thread", "resource", 0.0082, 1, 1),
    drop("silver_nugget", "resource", 0.0016, 1, 1),
  ],
  spoil: [
    drop("thread", "resource", 0.0082, 1, 1),
    drop("silver_nugget", "resource", 0.0016, 1, 1),
  ],
};

export const L2DOP_GLUDIO32_1725_MOBS: Mob[] = [
  L2DOP_MOB_20545,
  L2DOP_MOB_20481,
];
