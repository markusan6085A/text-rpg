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
    drop("thread", "resource", 0.012, 1, 1),
    drop("silver_nugget", "resource", 0.0024, 1, 1),
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
    drop("thread", "resource", 0.015, 1, 1),
    drop("silver_nugget", "resource", 0.0029, 1, 1),
  ],
};

// Волк — 20120, lvl 4, gludio32_1725_03. XML: stem, oriharukon_ore (spoil)
export const L2DOP_MOB_20120: Mob = {
  id: "l2dop_20120",
  name: "Волк",
  level: 4,
  hp: 68,
  mp: 62,
  pAtk: 11,
  mAtk: 8,
  pDef: 50,
  mDef: 33,
  exp: 141,
  sp: 4,
  adenaMin: 19,
  adenaMax: 29,
  dropChance: 0.7,
  drops: [
    drop("stem", "resource", 0.077, 1, 1),
    drop("oriharukon_ore", "resource", 0.0026, 1, 1),
  ],
  spoil: [
    drop("stem", "resource", 0.14, 1, 1),
    drop("oriharukon_ore", "resource", 0.0047, 1, 1),
  ],
};

// Эльпи — 20432, lvl 1, gludio32_1725_02
export const L2DOP_MOB_20432: Mob = {
  id: "l2dop_20432",
  name: "Эльпи",
  level: 1,
  hp: 40,
  mp: 40,
  pAtk: 8,
  mAtk: 6,
  pDef: 44,
  mDef: 30,
  exp: 35,
  sp: 2,
  adenaMin: 8,
  adenaMax: 12,
  dropChance: 0.7,
  drops: [
    drop("stem", "resource", 0.047, 1, 1),
    drop("varnish", "resource", 0.024, 1, 1),
    drop("suede", "resource", 0.016, 1, 1),
    drop("thread", "resource", 0.047, 1, 1),
    drop("silver_nugget", "resource", 0.009, 1, 1),
  ],
  spoil: [
    drop("stem", "resource", 0.085, 1, 1),
    drop("varnish", "resource", 0.043, 1, 1),
    drop("suede", "resource", 0.029, 1, 1),
    drop("thread", "resource", 0.085, 1, 1),
    drop("silver_nugget", "resource", 0.016, 1, 1),
  ],
};

// Матерый Кельтир — 20544, lvl 3, gludio32_1725_02
export const L2DOP_MOB_20544: Mob = {
  id: "l2dop_20544",
  name: "Матерый Кельтир",
  level: 3,
  hp: 58,
  mp: 55,
  pAtk: 10,
  mAtk: 7,
  pDef: 48,
  mDef: 32,
  exp: 105,
  sp: 2,
  adenaMin: 13,
  adenaMax: 20,
  dropChance: 0.7,
  drops: [
    drop("stem", "resource", 0.019, 1, 1),
    drop("coal", "resource", 0.027, 1, 1),
    drop("animal_bone", "resource", 0.036, 1, 1),
  ],
  spoil: [
    drop("stem", "resource", 0.034, 1, 1),
    drop("coal", "resource", 0.049, 1, 1),
    drop("animal_bone", "resource", 0.065, 1, 1),
  ],
};

// Вождь Ящеров Мэль — 20924, lvl 30, gludio23_1921_01
export const L2DOP_MOB_20924: Mob = {
  id: "l2dop_20924",
  name: "Вождь Ящеров Мэль",
  level: 30,
  hp: 604,
  mp: 329,
  pAtk: 93,
  mAtk: 63,
  pDef: 118,
  mDef: 79,
  exp: 854,
  sp: 47,
  adenaMin: 122,
  adenaMax: 244,
  dropChance: 0.7,
  drops: [
    drop("mithril_ore", "resource", 0.004, 1, 1),
    drop("adamantite_nugget", "resource", 0.0008, 1, 1),
    drop("steel", "resource", 0.002, 1, 1),
    drop("coarse_bone_powder", "resource", 0.0026, 1, 1),
    drop("leather", "resource", 0.0044, 1, 1),
  ],
  spoil: [
    drop("mithril_ore", "resource", 0.0072, 1, 1),
    drop("adamantite_nugget", "resource", 0.0014, 1, 1),
    drop("steel", "resource", 0.0036, 1, 1),
    drop("coarse_bone_powder", "resource", 0.0047, 1, 1),
    drop("leather", "resource", 0.0079, 1, 1),
  ],
};

// Додаткові мобі для Gludio (XML 20001–20100)
export const L2DOP_MOB_20001: Mob = {
  id: "l2dop_20001", name: "Гремлин", level: 1, hp: 40, mp: 40, pAtk: 8, mAtk: 6, pDef: 44, mDef: 30, exp: 29, sp: 2,
  adenaMin: 6, adenaMax: 12, dropChance: 0.7, drops: [drop("thread", "resource", 0.02, 1, 1)], spoil: [drop("thread", "resource", 0.036, 1, 1)],
};
export const L2DOP_MOB_20002: Mob = {
  id: "l2dop_20002", name: "Кролик", level: 1, hp: 40, mp: 40, pAtk: 8, mAtk: 6, pDef: 44, mDef: 30, exp: 29, sp: 2,
  adenaMin: 6, adenaMax: 12, dropChance: 0.7, drops: [drop("animal_bone", "resource", 0.01, 1, 1)], spoil: [drop("animal_bone", "resource", 0.018, 1, 1)],
};
export const L2DOP_MOB_20003: Mob = {
  id: "l2dop_20003", name: "Гоблин", level: 5, hp: 80, mp: 70, pAtk: 12, mAtk: 8, pDef: 52, mDef: 34, exp: 178, sp: 5,
  adenaMin: 30, adenaMax: 42, dropChance: 0.7, drops: [drop("stem", "resource", 0.02, 1, 1), drop("varnish", "resource", 0.01, 1, 1)], spoil: [drop("stem", "resource", 0.036, 1, 1), drop("varnish", "resource", 0.018, 1, 1)],
};
export const L2DOP_MOB_20004: Mob = {
  id: "l2dop_20004", name: "Бес", level: 6, hp: 94, mp: 77, pAtk: 14, mAtk: 9, pDef: 54, mDef: 36, exp: 213, sp: 6,
  adenaMin: 41, adenaMax: 58, dropChance: 0.7, drops: [drop("suede", "resource", 0.05, 1, 1), drop("charcoal", "resource", 0.015, 1, 1)], spoil: [drop("suede", "resource", 0.09, 1, 1), drop("charcoal", "resource", 0.027, 1, 1)],
};
export const L2DOP_MOB_20005: Mob = {
  id: "l2dop_20005", name: "Старший Бес", level: 7, hp: 108, mp: 85, pAtk: 15, mAtk: 10, pDef: 56, mDef: 37, exp: 249, sp: 8,
  adenaMin: 51, adenaMax: 72, dropChance: 0.7, drops: [drop("varnish", "resource", 0.014, 1, 1), drop("coal", "resource", 0.014, 1, 1)], spoil: [drop("suede", "resource", 0.117, 1, 1)],
};
export const L2DOP_MOB_20006: Mob = {
  id: "l2dop_20006", name: "Орк Лучник", level: 8, hp: 125, mp: 93, pAtk: 16, mAtk: 11, pDef: 58, mDef: 38, exp: 293, sp: 10,
  adenaMin: 69, adenaMax: 94, dropChance: 0.7, drops: [drop("suede", "resource", 0.017, 1, 1), drop("charcoal", "resource", 0.025, 1, 1)], spoil: [drop("suede", "resource", 0.031, 1, 1), drop("charcoal", "resource", 0.045, 1, 1)],
};
export const L2DOP_MOB_20007: Mob = {
  id: "l2dop_20007", name: "Зелёный Гриб", level: 9, hp: 143, mp: 100, pAtk: 18, mAtk: 12, pDef: 60, mDef: 40, exp: 321, sp: 11,
  adenaMin: 80, adenaMax: 108, dropChance: 0.7, drops: [drop("stem", "resource", 0.06, 1, 1), drop("iron_ore", "resource", 0.03, 1, 1)], spoil: [drop("stem", "resource", 0.11, 1, 1), drop("iron_ore", "resource", 0.054, 1, 1)],
};
export const L2DOP_MOB_20091: Mob = {
  id: "l2dop_20091", name: "Лисёнок", level: 1, hp: 40, mp: 40, pAtk: 8, mAtk: 6, pDef: 44, mDef: 30, exp: 29, sp: 2,
  adenaMin: 6, adenaMax: 12, dropChance: 0.7, drops: [drop("animal_bone", "resource", 0.015, 1, 1)], spoil: [drop("animal_bone", "resource", 0.027, 1, 1)],
};
export const L2DOP_MOB_20092: Mob = {
  id: "l2dop_20092", name: "Глаз Монстра", level: 10, hp: 160, mp: 108, pAtk: 19, mAtk: 13, pDef: 62, mDef: 41, exp: 362, sp: 12,
  adenaMin: 95, adenaMax: 125, dropChance: 0.7, drops: [drop("stem", "resource", 0.05, 1, 1), drop("varnish", "resource", 0.03, 1, 1)], spoil: [drop("stem", "resource", 0.09, 1, 1), drop("varnish", "resource", 0.054, 1, 1)],
};
export const L2DOP_MOB_20093: Mob = {
  id: "l2dop_20093", name: "Орк Воин", level: 10, hp: 165, mp: 110, pAtk: 20, mAtk: 13, pDef: 63, mDef: 42, exp: 378, sp: 12,
  adenaMin: 100, adenaMax: 130, dropChance: 0.7, drops: [drop("iron_ore", "resource", 0.04, 1, 1), drop("animal_bone", "resource", 0.03, 1, 1)], spoil: [drop("iron_ore", "resource", 0.072, 1, 1), drop("animal_bone", "resource", 0.054, 1, 1)],
};
export const L2DOP_MOB_20094: Mob = {
  id: "l2dop_20094", name: "Орк Снайпер", level: 10, hp: 162, mp: 109, pAtk: 19, mAtk: 13, pDef: 62, mDef: 41, exp: 370, sp: 12,
  adenaMin: 98, adenaMax: 128, dropChance: 0.7, drops: [drop("stem", "resource", 0.04, 1, 1), drop("coal", "resource", 0.025, 1, 1)], spoil: [drop("stem", "resource", 0.072, 1, 1), drop("coal", "resource", 0.045, 1, 1)],
};
export const L2DOP_MOB_20095: Mob = {
  id: "l2dop_20095", name: "Вампирская Летучая Мышь", level: 10, hp: 158, mp: 106, pAtk: 19, mAtk: 13, pDef: 61, mDef: 40, exp: 355, sp: 12,
  adenaMin: 92, adenaMax: 122, dropChance: 0.7, drops: [drop("animal_bone", "resource", 0.045, 1, 1), drop("stem", "resource", 0.035, 1, 1)], spoil: [drop("animal_bone", "resource", 0.081, 1, 1), drop("stem", "resource", 0.063, 1, 1)],
};
export const L2DOP_MOB_20096: Mob = {
  id: "l2dop_20096", name: "Орк Лейтенант", level: 11, hp: 178, mp: 120, pAtk: 21, mAtk: 14, pDef: 65, mDef: 43, exp: 412, sp: 13,
  adenaMin: 110, adenaMax: 145, dropChance: 0.7, drops: [drop("iron_ore", "resource", 0.045, 1, 1), drop("coal", "resource", 0.03, 1, 1)], spoil: [drop("iron_ore", "resource", 0.081, 1, 1), drop("coal", "resource", 0.054, 1, 1)],
};
export const L2DOP_MOB_20099: Mob = {
  id: "l2dop_20099", name: "Скелет", level: 12, hp: 195, mp: 130, pAtk: 23, mAtk: 15, pDef: 68, mDef: 45, exp: 465, sp: 14,
  adenaMin: 125, adenaMax: 165, dropChance: 0.7, drops: [drop("animal_bone", "resource", 0.06, 1, 1), drop("coarse_bone_powder", "resource", 0.02, 1, 1)], spoil: [drop("animal_bone", "resource", 0.108, 1, 1), drop("coarse_bone_powder", "resource", 0.036, 1, 1)],
};
export const L2DOP_MOB_20100: Mob = {
  id: "l2dop_20100", name: "Скелет-лучник", level: 13, hp: 212, mp: 140, pAtk: 25, mAtk: 16, pDef: 71, mDef: 47, exp: 498, sp: 15,
  adenaMin: 140, adenaMax: 185, dropChance: 0.7, drops: [drop("animal_bone", "resource", 0.055, 1, 1), drop("iron_ore", "resource", 0.035, 1, 1)], spoil: [drop("animal_bone", "resource", 0.099, 1, 1), drop("iron_ore", "resource", 0.063, 1, 1)],
};
export const L2DOP_MOB_20021: Mob = {
  id: "l2dop_20021", name: "Красный Медведь", level: 14, hp: 245, mp: 155, pAtk: 27, mAtk: 18, pDef: 74, mDef: 49, exp: 565, sp: 17,
  adenaMin: 155, adenaMax: 205, dropChance: 0.7, drops: [drop("suede", "resource", 0.05, 1, 1), drop("animal_bone", "resource", 0.04, 1, 1)], spoil: [drop("suede", "resource", 0.09, 1, 1), drop("animal_bone", "resource", 0.072, 1, 1)],
};
export const L2DOP_MOB_20030: Mob = {
  id: "l2dop_20030", name: "Ящер Лангк", level: 15, hp: 268, mp: 168, pAtk: 29, mAtk: 19, pDef: 77, mDef: 51, exp: 615, sp: 18,
  adenaMin: 170, adenaMax: 225, dropChance: 0.7, drops: [drop("leather", "resource", 0.03, 1, 1), drop("animal_bone", "resource", 0.045, 1, 1)], spoil: [drop("leather", "resource", 0.054, 1, 1), drop("animal_bone", "resource", 0.081, 1, 1)],
};
export const L2DOP_MOB_20035: Mob = {
  id: "l2dop_20035", name: "Скелет-трекер", level: 17, hp: 315, mp: 195, pAtk: 34, mAtk: 22, pDef: 84, mDef: 56, exp: 742, sp: 21,
  adenaMin: 200, adenaMax: 265, dropChance: 0.7, drops: [drop("coarse_bone_powder", "resource", 0.04, 1, 1), drop("animal_bone", "resource", 0.06, 1, 1)], spoil: [drop("coarse_bone_powder", "resource", 0.072, 1, 1), drop("animal_bone", "resource", 0.108, 1, 1)],
};
export const L2DOP_MOB_20008: Mob = {
  id: "l2dop_20008", name: "Ящер Фелим", level: 14, hp: 230, mp: 141, pAtk: 27, mAtk: 19, pDef: 71, mDef: 47, exp: 498, sp: 19,
  adenaMin: 150, adenaMax: 200, dropChance: 0.7, drops: [drop("varnish", "resource", 0.044, 1, 1), drop("thread", "resource", 0.03, 1, 1)], spoil: [drop("varnish", "resource", 0.079, 1, 1), drop("thread", "resource", 0.054, 1, 1)],
};
export const L2DOP_MOB_20069: Mob = {
  id: "l2dop_20069", name: "Разведчик Ящеров Селу", level: 26, hp: 520, mp: 310, pAtk: 58, mAtk: 38, pDef: 105, mDef: 70, exp: 980, sp: 28,
  adenaMin: 320, adenaMax: 420, dropChance: 0.7, drops: [drop("mithril_ore", "resource", 0.02, 1, 1), drop("steel", "resource", 0.015, 1, 1)], spoil: [drop("mithril_ore", "resource", 0.036, 1, 1), drop("steel", "resource", 0.027, 1, 1)],
};
export const L2DOP_MOB_20083: Mob = {
  id: "l2dop_20083", name: "Гранитовый Голем", level: 33, hp: 980, mp: 580, pAtk: 95, mAtk: 62, pDef: 145, mDef: 96, exp: 1650, sp: 48,
  adenaMin: 380, adenaMax: 510, dropChance: 0.7, drops: [drop("mithril_ore", "resource", 0.025, 1, 1), drop("steel", "resource", 0.02, 1, 1)], spoil: [drop("mithril_ore", "resource", 0.045, 1, 1), drop("steel", "resource", 0.036, 1, 1)],
};

// Тетрарх Орк Турек — 20546, lvl 34 (має бути перед L2DOP_GLUDIO_POOL)
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
    drop("mithril_ore", "resource", 0.0135, 1, 1),
    drop("adamantite_nugget", "resource", 0.0027, 1, 1),
    drop("steel", "resource", 0.0068, 1, 1),
    drop("coarse_bone_powder", "resource", 0.009, 1, 1),
    drop("leather", "resource", 0.015, 1, 1),
  ],
};

/** Пул мобів для Gludio (лвл 1–35) */
export const L2DOP_GLUDIO_POOL: Mob[] = [
  L2DOP_MOB_20001, L2DOP_MOB_20002, L2DOP_MOB_20091, L2DOP_MOB_20545, L2DOP_MOB_20481, L2DOP_MOB_20432, L2DOP_MOB_20544, L2DOP_MOB_20120,
  L2DOP_MOB_20003, L2DOP_MOB_20004, L2DOP_MOB_20005, L2DOP_MOB_20006, L2DOP_MOB_20007,
  L2DOP_MOB_20092, L2DOP_MOB_20093, L2DOP_MOB_20094, L2DOP_MOB_20095, L2DOP_MOB_20096,
  L2DOP_MOB_20099, L2DOP_MOB_20100, L2DOP_MOB_20021, L2DOP_MOB_20008, L2DOP_MOB_20030, L2DOP_MOB_20035,
  L2DOP_MOB_20924, L2DOP_MOB_20546, L2DOP_MOB_20069, L2DOP_MOB_20083,
];

/** Заповнити зону мобами: 10–20 видів, 30–200 мобів (детерміновано по seed) */
export function fillZoneMobs(
  pool: Mob[],
  seed: string,
  minLevel: number,
  maxLevel: number,
  targetMin: number,
  targetMax: number,
  typesMin: number,
  typesMax: number
): Mob[] {
  const filtered = pool.filter((m) => m.level >= minLevel && m.level <= maxLevel);
  if (filtered.length === 0) return pool.slice(0, Math.min(5, pool.length));

  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const rand = () => { h = (h * 1664525 + 1013904223) | 0; return (h >>> 0) / 0xffffffff; };

  const typesCount = Math.min(filtered.length, typesMin + Math.floor(rand() * (typesMax - typesMin + 1)));
  const total = targetMin + Math.floor(rand() * (targetMax - targetMin + 1));

  const shuffled = [...filtered].sort(() => rand() - 0.5);
  const selected = shuffled.slice(0, typesCount);
  const result: Mob[] = [];
  let remaining = total;
  const counts: number[] = selected.map(() => 1);
  remaining -= typesCount;
  while (remaining > 0) {
    const i = Math.floor(rand() * selected.length);
    counts[i]++;
    remaining--;
  }
  for (let i = 0; i < selected.length; i++) {
    for (let j = 0; j < counts[i]; j++) result.push(selected[i]);
  }
  return result.sort(() => rand() - 0.5);
}

// Окраїна — 01+02+03: 5 мобів (legacy)
export const L2DOP_GLUDIO32_1725_MOBS: Mob[] = [
  L2DOP_MOB_20545,
  L2DOP_MOB_20481,
  L2DOP_MOB_20432,
  L2DOP_MOB_20544,
  L2DOP_MOB_20120,
];

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
    drop("stem", "resource", 0.32, 1, 1),
    drop("suede", "resource", 0.106, 1, 1),
    drop("high_grade_suede", "resource", 0.013, 1, 1),
  ],
};

export const L2DOP_GLUDIO15_1721_MOBS: Mob[] = [L2DOP_MOB_20546];
export const L2DOP_GLUDIO23_1921_MOBS: Mob[] = [L2DOP_MOB_20924];
export const L2DOP_GIRAN03_2321_MOBS: Mob[] = [L2DOP_MOB_18001];
