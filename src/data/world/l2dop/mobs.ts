// Мобі з l2dop — дані з L2 XML (tools/htmlскіли/моби/)
// drop = category 2, spoil = category -1 (різні ресурси завжди)

import type { Mob } from "../types";
import type { RaidBoss } from "../../bosses/floran_overlord";
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

// Young Keltir — 20545, XML: drop thread/silver_nugget, no spoil
export const L2DOP_MOB_20545: Mob = {
  id: "l2dop_20545",
  name: "Молодой Шакал",
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
    drop("thread", "resource", 0.0066, 1, 1),
    drop("silver_nugget", "resource", 0.0013, 1, 1),
  ],
  spoil: [],
};

// Bearded Keltir — 20481, XML: drop thread/silver_nugget, spoil thread
export const L2DOP_MOB_20481: Mob = {
  id: "l2dop_20481",
  name: "Бородатый Шакал",
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
    drop("thread", "resource", 0.0082, 1, 1),
    drop("silver_nugget", "resource", 0.0016, 1, 1),
  ],
  spoil: [drop("thread", "resource", 0.032, 1, 1)],
};

// Wolf — 20120, XML: drop varnish+coal, spoil stem+oriharukon_ore
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
    drop("varnish", "resource", 0.01, 1, 1),
    drop("coal", "resource", 0.01, 1, 1),
  ],
  spoil: [
    drop("stem", "resource", 0.077, 1, 1),
    drop("oriharukon_ore", "resource", 0.0026, 1, 1),
  ],
};

// Elpy — 20432, XML: drop stem/varnish/suede/thread/silver_nugget, no spoil
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
    drop("stem", "resource", 0.0047, 1, 1),
    drop("varnish", "resource", 0.0024, 1, 1),
    drop("suede", "resource", 0.0016, 1, 1),
    drop("thread", "resource", 0.0047, 1, 1),
    drop("silver_nugget", "resource", 0.0009, 1, 1),
  ],
  spoil: [],
};

// Elder Keltir — 20544, XML: drop stem/iron_ore, spoil coal/animal_bone
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
    drop("iron_ore", "resource", 0.009, 1, 1),
  ],
  spoil: [
    drop("coal", "resource", 0.027, 1, 1),
    drop("animal_bone", "resource", 0.036, 1, 1),
  ],
};

// Вождь Ящеров Мэль — 20924, lvl 30, gludio23_1921_01 (Maille Lizardman Matriarch)
// L2: ящіри дропають leather, varnish, thread; spoil — інші предмети (рецепти). Тематичний дроп.
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
    drop("leather", "resource", 0.045, 1, 1),
    drop("varnish", "resource", 0.032, 1, 1),
    drop("animal_bone", "resource", 0.028, 1, 1),
    drop("mithril_ore", "resource", 0.008, 1, 1),
  ],
  spoil: [
    drop("thread", "resource", 0.12, 1, 1),
    drop("high_grade_suede", "resource", 0.025, 1, 1),
    drop("leather", "resource", 0.08, 1, 1),
  ],
};

// Додаткові мобі для Gludio (XML 20001–20100)
// Gremlin — 20001, XML: no drops
export const L2DOP_MOB_20001: Mob = {
  id: "l2dop_20001", name: "Гремлин", level: 1, hp: 40, mp: 40, pAtk: 8, mAtk: 6, pDef: 44, mDef: 30, exp: 29, sp: 2,
  adenaMin: 6, adenaMax: 12, dropChance: 0.7, drops: [], spoil: [],
};
// Rabbit — 20002, XML: no drops
export const L2DOP_MOB_20002: Mob = {
  id: "l2dop_20002", name: "Кролик", level: 1, hp: 40, mp: 40, pAtk: 8, mAtk: 6, pDef: 44, mDef: 30, exp: 29, sp: 2,
  adenaMin: 6, adenaMax: 12, dropChance: 0.7, drops: [], spoil: [],
};
// Goblin — 20003, XML: drop stem/varnish/suede/thread/silver_nugget, spoil charcoal only
export const L2DOP_MOB_20003: Mob = {
  id: "l2dop_20003", name: "Гоблин", level: 5, hp: 80, mp: 70, pAtk: 12, mAtk: 8, pDef: 52, mDef: 34, exp: 178, sp: 5,
  adenaMin: 30, adenaMax: 42, dropChance: 0.7,
  drops: [drop("stem", "resource", 0.02, 1, 1), drop("varnish", "resource", 0.01, 1, 1), drop("suede", "resource", 0.0065, 1, 1), drop("thread", "resource", 0.02, 1, 1), drop("silver_nugget", "resource", 0.004, 1, 1)],
  spoil: [drop("charcoal", "resource", 0.057, 1, 1)],
};
// Imp (Бес) — 20004, XML: drop suede+charcoal, spoil ТІЛЬКИ suede (2005/2006 — weapon mats, skip)
export const L2DOP_MOB_20004: Mob = {
  id: "l2dop_20004", name: "Бес", level: 6, hp: 94, mp: 77, pAtk: 14, mAtk: 9, pDef: 54, mDef: 36, exp: 213, sp: 6,
  adenaMin: 41, adenaMax: 58, dropChance: 0.7,
  drops: [drop("suede", "resource", 0.0102, 1, 1), drop("charcoal", "resource", 0.0153, 1, 1)],
  spoil: [drop("suede", "resource", 0.0518, 1, 1)],
};
export const L2DOP_MOB_20005: Mob = {
  id: "l2dop_20005", name: "Старший Бес", level: 7, hp: 108, mp: 85, pAtk: 15, mAtk: 10, pDef: 56, mDef: 37, exp: 249, sp: 8,
  adenaMin: 51, adenaMax: 72, dropChance: 0.7, drops: [drop("varnish", "resource", 0.014, 1, 1), drop("coal", "resource", 0.014, 1, 1)], spoil: [drop("suede", "resource", 0.117, 1, 1)],
};
// Orc Archer — 20006, XML: drop suede+charcoal, spoil 113/1060/2006 (не в map) → []
export const L2DOP_MOB_20006: Mob = {
  id: "l2dop_20006", name: "Орк Лучник", level: 8, hp: 125, mp: 93, pAtk: 16, mAtk: 11, pDef: 58, mDef: 38, exp: 293, sp: 10,
  adenaMin: 69, adenaMax: 94, dropChance: 0.7, drops: [drop("suede", "resource", 0.017, 1, 1), drop("charcoal", "resource", 0.025, 1, 1)], spoil: [],
};
// Green Fungus — 20007, XML: drop stem+iron_ore, spoil suede+stone_of_purity (1122 не в map)
export const L2DOP_MOB_20007: Mob = {
  id: "l2dop_20007", name: "Зелёный Гриб", level: 9, hp: 143, mp: 100, pAtk: 18, mAtk: 12, pDef: 60, mDef: 40, exp: 321, sp: 11,
  adenaMin: 80, adenaMax: 108, dropChance: 0.7, drops: [drop("stem", "resource", 0.037, 1, 1), drop("iron_ore", "resource", 0.029, 1, 1)], spoil: [drop("suede", "resource", 0.099, 1, 1), drop("stone_of_purity", "resource", 0.01, 1, 1)],
};
// Young Fox — 20091, XML: no drops
export const L2DOP_MOB_20091: Mob = {
  id: "l2dop_20091", name: "Лисёнок", level: 1, hp: 40, mp: 40, pAtk: 8, mAtk: 6, pDef: 44, mDef: 30, exp: 29, sp: 2,
  adenaMin: 6, adenaMax: 12, dropChance: 0.7, drops: [], spoil: [],
};
// Monster Eye — 20092, XML: drop animal_skin/iron_ore/coal/charcoal/animal_bone, spoil suede only
export const L2DOP_MOB_20092: Mob = {
  id: "l2dop_20092", name: "Глаз Монстра", level: 10, hp: 160, mp: 108, pAtk: 19, mAtk: 13, pDef: 62, mDef: 41, exp: 362, sp: 12,
  adenaMin: 95, adenaMax: 125, dropChance: 0.7,
  drops: [drop("animal_skin", "resource", 0.019, 1, 1), drop("iron_ore", "resource", 0.014, 1, 1), drop("coal", "resource", 0.014, 1, 1), drop("charcoal", "resource", 0.014, 1, 1), drop("animal_bone", "resource", 0.019, 1, 1)],
  spoil: [drop("suede", "resource", 0.098, 1, 1)],
};
// Orc Fighter — 20093, XML: drop animal_skin/animal_bone, spoil animal_skin (1666/2007 skip)
export const L2DOP_MOB_20093: Mob = {
  id: "l2dop_20093", name: "Орк Воин", level: 10, hp: 165, mp: 110, pAtk: 20, mAtk: 13, pDef: 63, mDef: 42, exp: 378, sp: 12,
  adenaMin: 100, adenaMax: 130, dropChance: 0.7,
  drops: [drop("animal_skin", "resource", 0.036, 1, 1), drop("animal_bone", "resource", 0.036, 1, 1)],
  spoil: [drop("animal_skin", "resource", 0.24, 1, 1)],
};
// Orc Marksman — 20094, XML: no drops
export const L2DOP_MOB_20094: Mob = {
  id: "l2dop_20094", name: "Орк Снайпер", level: 10, hp: 162, mp: 109, pAtk: 19, mAtk: 13, pDef: 62, mDef: 41, exp: 305, sp: 10,
  adenaMin: 98, adenaMax: 128, dropChance: 0.7, drops: [], spoil: [],
};
// Vampire Bat — 20095, XML: drop stem+iron_ore, spoil stem only (2006 skip)
export const L2DOP_MOB_20095: Mob = {
  id: "l2dop_20095", name: "Вампирская Летучая Мышь", level: 10, hp: 163, mp: 108, pAtk: 19, mAtk: 13, pDef: 62, mDef: 41, exp: 296, sp: 10,
  adenaMin: 80, adenaMax: 108, dropChance: 0.7, drops: [drop("stem", "resource", 0.059, 1, 1), drop("iron_ore", "resource", 0.029, 1, 1)], spoil: [drop("stem", "resource", 0.297, 1, 1)],
};
// Orc Lieutenant — 20096, XML: drop animal_skin/iron_ore/coal/charcoal/animal_bone, spoil 1792/1799/1921 (unmapped)
export const L2DOP_MOB_20096: Mob = {
  id: "l2dop_20096", name: "Орк Лейтенант", level: 11, hp: 185, mp: 116, pAtk: 21, mAtk: 14, pDef: 64, mDef: 43, exp: 391, sp: 15,
  adenaMin: 109, adenaMax: 147, dropChance: 0.7,
  drops: [drop("animal_skin", "resource", 0.026, 1, 1), drop("iron_ore", "resource", 0.02, 1, 1), drop("coal", "resource", 0.02, 1, 1), drop("charcoal", "resource", 0.02, 1, 1), drop("animal_bone", "resource", 0.026, 1, 1)],
  spoil: [],
};
// Skeleton — 20099, XML: drop stem/varnish/suede/thread/silver_nugget, spoil 1831/1896/2009 (unmapped)
export const L2DOP_MOB_20099: Mob = {
  id: "l2dop_20099", name: "Скелет", level: 12, hp: 200, mp: 124, pAtk: 23, mAtk: 16, pDef: 66, mDef: 44, exp: 363, sp: 13,
  adenaMin: 95, adenaMax: 131, dropChance: 0.7,
  drops: [drop("stem", "resource", 0.035, 1, 1), drop("varnish", "resource", 0.018, 1, 1), drop("suede", "resource", 0.012, 1, 1), drop("thread", "resource", 0.035, 1, 1), drop("silver_nugget", "resource", 0.007, 1, 1)],
  spoil: [],
};
// Skeleton Archer — 20100, XML: drop suede+charcoal, spoil suede only
export const L2DOP_MOB_20100: Mob = {
  id: "l2dop_20100", name: "Скелет-лучник", level: 13, hp: 215, mp: 133, pAtk: 25, mAtk: 17, pDef: 69, mDef: 46, exp: 405, sp: 16,
  adenaMin: 99, adenaMax: 140, dropChance: 0.7, drops: [drop("suede", "resource", 0.025, 1, 1), drop("charcoal", "resource", 0.037, 1, 1)], spoil: [drop("suede", "resource", 0.126, 1, 1)],
};
// Red Bear — 20021, XML: drop varnish+coal, spoil 1792/1793/1921 (unmapped)
export const L2DOP_MOB_20021: Mob = {
  id: "l2dop_20021", name: "Красный Медведь", level: 14, hp: 245, mp: 155, pAtk: 27, mAtk: 18, pDef: 74, mDef: 49, exp: 565, sp: 17,
  adenaMin: 155, adenaMax: 205, dropChance: 0.7, drops: [drop("varnish", "resource", 0.033, 1, 1), drop("coal", "resource", 0.033, 1, 1)], spoil: [],
};
// Langk Lizardman — 20030, XML: drop varnish+coal, spoil 1794/1798/1831 (unmapped)
export const L2DOP_MOB_20030: Mob = {
  id: "l2dop_20030", name: "Ящер Лангк", level: 15, hp: 268, mp: 168, pAtk: 29, mAtk: 19, pDef: 77, mDef: 51, exp: 615, sp: 18,
  adenaMin: 170, adenaMax: 225, dropChance: 0.7, drops: [drop("varnish", "resource", 0.046, 1, 1), drop("coal", "resource", 0.046, 1, 1)], spoil: [],
};
// Tracker Skeleton — 20035, XML: drop thread+silver_nugget, spoil thread only
export const L2DOP_MOB_20035: Mob = {
  id: "l2dop_20035", name: "Скелет-трекер", level: 17, hp: 283, mp: 166, pAtk: 35, mAtk: 24, pDef: 79, mDef: 52, exp: 605, sp: 25,
  adenaMin: 120, adenaMax: 193, dropChance: 0.7, drops: [drop("thread", "resource", 0.073, 1, 1), drop("silver_nugget", "resource", 0.015, 1, 1)], spoil: [drop("thread", "resource", 0.492, 1, 1)],
};
// Felim Lizardman — 20008, XML: drop varnish+coal, spoil coal+charcoal
export const L2DOP_MOB_20008: Mob = {
  id: "l2dop_20008", name: "Ящер Фелим", level: 14, hp: 230, mp: 141, pAtk: 27, mAtk: 19, pDef: 71, mDef: 47, exp: 498, sp: 19,
  adenaMin: 150, adenaMax: 200, dropChance: 0.7, drops: [drop("varnish", "resource", 0.044, 1, 1), drop("coal", "resource", 0.044, 1, 1)], spoil: [drop("coal", "resource", 0.22, 1, 1), drop("charcoal", "resource", 0.22, 1, 1)],
};
// Selu Lizardman Scout — 20069. Ящіри: leather, varnish, thread. Spoil — інакший набір.
export const L2DOP_MOB_20069: Mob = {
  id: "l2dop_20069", name: "Разведчик Ящеров Селу", level: 26, hp: 520, mp: 310, pAtk: 58, mAtk: 38, pDef: 105, mDef: 70, exp: 980, sp: 28,
  adenaMin: 320, adenaMax: 420, dropChance: 0.7,
  drops: [drop("leather", "resource", 0.06, 1, 1), drop("varnish", "resource", 0.045, 1, 1), drop("thread", "resource", 0.038, 1, 1)],
  spoil: [drop("animal_bone", "resource", 0.1, 1, 1), drop("stem", "resource", 0.055, 1, 1), drop("leather", "resource", 0.08, 1, 1)],
};
// Granite Golem — 20083. Големи: mithril, steel (мінерали). Spoil — oriharukon, stone_of_purity.
export const L2DOP_MOB_20083: Mob = {
  id: "l2dop_20083", name: "Гранитовый Голем", level: 33, hp: 980, mp: 580, pAtk: 95, mAtk: 62, pDef: 145, mDef: 96, exp: 1650, sp: 48,
  adenaMin: 380, adenaMax: 510, dropChance: 0.7,
  drops: [drop("mithril_ore", "resource", 0.055, 1, 1), drop("steel", "resource", 0.045, 1, 1), drop("iron_ore", "resource", 0.035, 1, 1)],
  spoil: [drop("oriharukon_ore", "resource", 0.06, 1, 1), drop("stone_of_purity", "resource", 0.02, 1, 1), drop("mithril_ore", "resource", 0.08, 1, 1)],
};

// Тетрарх Орк Турек — 20546, lvl 34 (Turek Orc Elder). L2: орки — iron_ore, coal, suede, steel.
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
    drop("iron_ore", "resource", 0.055, 1, 1),
    drop("steel", "resource", 0.035, 1, 1),
    drop("coal", "resource", 0.04, 1, 1),
    drop("suede", "resource", 0.03, 1, 1),
  ],
  spoil: [
    drop("animal_bone", "resource", 0.1, 1, 1),
    drop("coarse_bone_powder", "resource", 0.04, 1, 1),
    drop("iron_ore", "resource", 0.07, 1, 1),
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

/** Створити чемпіона з базового моба: ~3× стати, ~10× exp/sp/adena, кращі drop/spoil */
function makeChampion(base: Mob, championName: string, suffix: string): Mob {
  const champDrops = (base.drops ?? []).map((d) => ({
    ...d,
    chance: Math.min(0.9, (d.chance ?? 0.5) * 3),
    min: (d.min ?? 1) * 2,
    max: (d.max ?? 1) * 4,
  }));
  const champSpoil = (base.spoil ?? []).map((s) => ({
    ...s,
    chance: Math.min(0.95, (s.chance ?? 0.5) * 3),
    min: (s.min ?? 1) * 2,
    max: (s.max ?? 1) * 4,
  }));
  return {
    ...base,
    id: `${base.id}_champion_${suffix}`,
    name: `[Чемпион] ${championName}`,
    hp: base.hp * 3,
    mp: (base.mp ?? 0) * 3,
    pAtk: base.pAtk * 3,
    mAtk: (base.mAtk ?? 0) * 3,
    pDef: base.pDef * 3,
    mDef: base.mDef * 3,
    exp: base.exp * 10,
    sp: (base.sp ?? base.level * 2) * 10,
    adenaMin: base.adenaMin * 10,
    adenaMax: base.adenaMax * 10,
    dropChance: 0.85,
    drops: champDrops.length ? champDrops : [drop("thread", "resource", 0.5, 2, 5), drop("silver_nugget", "resource", 0.3, 1, 3)],
    spoil: champSpoil.length ? champSpoil : [drop("stem", "resource", 0.6, 2, 6)],
  };
}

/** 2 чемпіони на зону Gludio (детерміновано по zoneId) */
export function getGludioL2DopChampions(zoneId: string, minLvl: number, maxLvl: number): Mob[] {
  const filtered = L2DOP_GLUDIO_POOL.filter((m) => m.level >= minLvl && m.level <= maxLvl);
  if (filtered.length < 2) return [];
  let h = 0;
  for (let i = 0; i < zoneId.length; i++) h = (h * 31 + zoneId.charCodeAt(i)) | 0;
  const rand = () => { h = (h * 1664525 + 1013904223) | 0; return (h >>> 0) / 0xffffffff; };
  const shuffled = [...filtered].sort(() => rand() - 0.5);
  const c1 = shuffled[0];
  const c2 = shuffled[1];
  const names: Record<string, string> = {
    "01": "Окраїнський Громила",
    "02": "Луговий Вождь",
    "03": "Рощовий Лорд",
    "04": "Болотний Тінь",
    "05": "Руїнний Страх",
    "06": "Ящір-Тиран",
    "07": "Орк-Тетрарх",
    "08": "Печерний Лорд",
  };
  const zoneNum = zoneId.replace("l2dop_gludio_", "");
  const baseName = names[zoneNum] ?? "Глоріо Чемпіон";
  return [
    makeChampion(c1, `${baseName} I`, "a"),
    makeChampion(c2, `${baseName} II`, "b"),
  ];
}

/** NG/D ресурси для дропу Gludio РБ (лвл 1–40) */
const GLUDIO_RB_RESOURCES = ["stem", "suede", "iron_ore", "coal", "leather", "animal_bone", "thread", "varnish", "mithril_ore", "steel"];

function gludioRbDrops(rbIndex: number): DropEntry[] {
  const items: DropEntry[] = [
    ...GLUDIO_RB_RESOURCES.slice(0, 4).map((r, i) => drop(r, "resource", 0.5 + (rbIndex % 3) * 0.1, 3 + (rbIndex % 4), 8 + (rbIndex % 5))),
  ];
  if (rbIndex >= 4) items.push(drop("high_grade_suede", "resource", 0.2, 1, 3));
  if (rbIndex >= 6) items.push(drop("oriharukon_ore", "resource", 0.15, 1, 2));
  return items;
}

/** 8 рейд-босів для зон Gludio (l2dop_gludio_01 … 08) */
export const L2DOP_GLUDIO_RAID_BOSSES: RaidBoss[] = [
  { id: "rb_l2dop_gludio_01", name: "Raid Boss: Хранитель Окраїни", level: 5, hp: 8000, mp: 0, pAtk: 90, mAtk: 0, pDef: 70, mDef: 50, exp: 8000, sp: 500, adenaMin: 2500, adenaMax: 4500, dropChance: 1, drops: gludioRbDrops(0), isRaidBoss: true, respawnTime: 4 * 60 * 60, dropProfileId: "rb_l2dop_gludio_drop", aiProfileId: "rb_floran_ai", zoneId: "l2dop_gludio_01" },
  { id: "rb_l2dop_gludio_02", name: "Raid Boss: Лорд Лугів", level: 8, hp: 15000, mp: 0, pAtk: 120, mAtk: 0, pDef: 95, mDef: 65, exp: 15000, sp: 800, adenaMin: 4000, adenaMax: 7000, dropChance: 1, drops: gludioRbDrops(1), isRaidBoss: true, respawnTime: 4 * 60 * 60, dropProfileId: "rb_l2dop_gludio_drop", aiProfileId: "rb_floran_ai", zoneId: "l2dop_gludio_02" },
  { id: "rb_l2dop_gludio_03", name: "Raid Boss: Повелитель Рощі", level: 12, hp: 25000, mp: 0, pAtk: 160, mAtk: 0, pDef: 125, mDef: 85, exp: 28000, sp: 1200, adenaMin: 6000, adenaMax: 10000, dropChance: 1, drops: gludioRbDrops(2), isRaidBoss: true, respawnTime: 4 * 60 * 60, dropProfileId: "rb_l2dop_gludio_drop", aiProfileId: "rb_floran_ai", zoneId: "l2dop_gludio_03" },
  { id: "rb_l2dop_gludio_04", name: "Raid Boss: Болотний Дракон", level: 18, hp: 40000, mp: 0, pAtk: 220, mAtk: 0, pDef: 170, mDef: 110, exp: 55000, sp: 2000, adenaMin: 10000, adenaMax: 16000, dropChance: 1, drops: gludioRbDrops(3), isRaidBoss: true, respawnTime: 4 * 60 * 60, dropProfileId: "rb_l2dop_gludio_drop", aiProfileId: "rb_floran_ai", zoneId: "l2dop_gludio_04" },
  { id: "rb_l2dop_gludio_05", name: "Raid Boss: Король Руїн", level: 22, hp: 55000, mp: 0, pAtk: 280, mAtk: 0, pDef: 215, mDef: 140, exp: 75000, sp: 2800, adenaMin: 14000, adenaMax: 22000, dropChance: 1, drops: gludioRbDrops(4), isRaidBoss: true, respawnTime: 4 * 60 * 60, dropProfileId: "rb_l2dop_gludio_drop", aiProfileId: "rb_floran_ai", zoneId: "l2dop_gludio_05" },
  { id: "rb_l2dop_gludio_06", name: "Raid Boss: Ящір-Імператор", level: 28, hp: 75000, mp: 0, pAtk: 350, mAtk: 0, pDef: 275, mDef: 180, exp: 110000, sp: 4000, adenaMin: 22000, adenaMax: 32000, dropChance: 1, drops: gludioRbDrops(5), isRaidBoss: true, respawnTime: 4 * 60 * 60, dropProfileId: "rb_l2dop_gludio_drop", aiProfileId: "rb_floran_ai", zoneId: "l2dop_gludio_06" },
  { id: "rb_l2dop_gludio_07", name: "Raid Boss: Орк-Верховний", level: 35, hp: 100000, mp: 0, pAtk: 430, mAtk: 0, pDef: 340, mDef: 225, exp: 150000, sp: 5500, adenaMin: 30000, adenaMax: 45000, dropChance: 1, drops: gludioRbDrops(6), isRaidBoss: true, respawnTime: 4 * 60 * 60, dropProfileId: "rb_l2dop_gludio_drop", aiProfileId: "rb_floran_ai", zoneId: "l2dop_gludio_07" },
  { id: "rb_l2dop_gludio_08", name: "Raid Boss: Печерний Титан", level: 40, hp: 130000, mp: 0, pAtk: 520, mAtk: 0, pDef: 410, mDef: 270, exp: 200000, sp: 7000, adenaMin: 40000, adenaMax: 60000, dropChance: 1, drops: gludioRbDrops(7), isRaidBoss: true, respawnTime: 4 * 60 * 60, dropProfileId: "rb_l2dop_gludio_drop", aiProfileId: "rb_floran_ai", zoneId: "l2dop_gludio_08" },
];

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
