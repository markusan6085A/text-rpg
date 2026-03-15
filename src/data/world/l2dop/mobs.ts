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

// Тетрарх Орк Турек — 20546, lvl 34, hp 1164, mp 430, gludio15_1721_22s
// droplist: adena 240–478, spoil mithril_ore, adamantite_nugget, steel, coarse_bone_powder, leather
export const L2DOP_MOB_20546: Mob = {
  id: "l2dop_20546",
  name: "Тетрарх Орк Турек",
  level: 34,
  hp: 1164,
  mp: 430,
  pAtk: 162,
  mAtk: 82,
  pDef: 179,
  mDef: 132,
  exp: 1714,
  sp: 100,
  adenaMin: 240,
  adenaMax: 478,
  dropChance: 0.7,
  drops: [
    drop("mithril_ore", "resource", 0.0075, 1, 1),
    drop("adamantite_nugget", "resource", 0.0015, 1, 1),
    drop("steel", "resource", 0.0038, 1, 1),
    drop("coarse_bone_powder", "resource", 0.005, 1, 1),
    drop("leather", "resource", 0.0084, 1, 1),
  ],
  spoil: [
    drop("mithril_ore", "resource", 0.0075, 1, 1),
    drop("adamantite_nugget", "resource", 0.0015, 1, 1),
    drop("steel", "resource", 0.0038, 1, 1),
    drop("coarse_bone_powder", "resource", 0.005, 1, 1),
    drop("leather", "resource", 0.0084, 1, 1),
  ],
};

// Кровавая Королева — 18001, lvl 60, hp 3054, mp 1150, giran03_2321_15
// droplist: adena 765–1528, spoil stem, suede, high_grade_suede
export const L2DOP_MOB_18001: Mob = {
  id: "l2dop_18001",
  name: "Кровавая Королева",
  level: 60,
  hp: 3054,
  mp: 1150,
  pAtk: 860,
  mAtk: 478,
  pDef: 368,
  mDef: 299,
  exp: 4536,
  sp: 394,
  adenaMin: 765,
  adenaMax: 1528,
  dropChance: 0.7,
  drops: [
    drop("stem", "resource", 0.178, 1, 1),
    drop("suede", "resource", 0.059, 1, 1),
    drop("high_grade_suede", "resource", 0.0074, 1, 1),
  ],
  spoil: [
    drop("stem", "resource", 0.178, 1, 1),
    drop("suede", "resource", 0.059, 1, 1),
    drop("high_grade_suede", "resource", 0.0074, 1, 1),
  ],
};

export const L2DOP_GLUDIO15_1721_MOBS: Mob[] = [L2DOP_MOB_20546];
export const L2DOP_GIRAN03_2321_MOBS: Mob[] = [L2DOP_MOB_18001];
