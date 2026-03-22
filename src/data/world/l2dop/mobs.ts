// РњРѕР±С– Р· l2dop вЂ” РґР°РЅС– Р· L2 XML (tools/htmlСЃРєС–Р»Рё/РјРѕР±Рё/)
// drop = category 2, spoil = category -1 (СЂС–Р·РЅС– СЂРµСЃСѓСЂСЃРё Р·Р°РІР¶РґРё)

import type { Mob } from "../types";
import type { RaidBoss } from "../../bosses/floran_overlord";
import type { DropEntry } from "../../combat/types";
import { getMobPublicIconSrc, resolveMobIconFromName } from "../../../utils/mobPublicIcon";
import { L2DOP_GODDARD_POOL } from "./goddardMobs.generated";
import { L2DOP_SCHUTTGART_POOL } from "./schuttgartMobs.generated";

export { L2DOP_GODDARD_POOL, L2DOP_SCHUTTGART_POOL };

function drop(
  id: string,
  kind: "adena" | "resource" | "equipment" | "other",
  chance: number,
  min: number,
  max: number
): DropEntry {
  return { id, kind, chance, min, max };
}

// Young Keltir вЂ” 20545, XML: drop thread/silver_nugget, no spoil
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
  drops: [],
  spoil: [],
};

// Bearded Keltir вЂ” 20481, XML: drop thread/silver_nugget, spoil thread
export const L2DOP_MOB_20481: Mob = {
  id: "l2dop_20481",
  name: "Бородатий Шакал",
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
  drops: [],
  spoil: [],
};

// Wolf вЂ” 20120, XML: drop varnish+coal, spoil stem+oriharukon_ore
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
  drops: [],
  spoil: [],
};

// Elpy вЂ” 20432, XML: drop stem/varnish/suede/thread/silver_nugget, no spoil
export const L2DOP_MOB_20432: Mob = {
  id: "l2dop_20432",
  name: "Ельпі",
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
  drops: [],
  spoil: [],
};

// Elder Keltir вЂ” 20544, XML: drop stem/iron_ore, spoil coal/animal_bone
export const L2DOP_MOB_20544: Mob = {
  id: "l2dop_20544",
  name: "Материй Кельтир",
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
  drops: [],
  spoil: [],
};

// Вождь Ящеров Мель вЂ” 20924, lvl 30, gludio23_1921_01 (Maille Lizardman Matriarch)
// L2: СЏС‰С–СЂРё РґСЂРѕРїР°СЋС‚СЊ leather, varnish, thread; spoil вЂ” С–РЅС€С– РїСЂРµРґРјРµС‚Рё (СЂРµС†РµРїС‚Рё). РўРµРјР°С‚РёС‡РЅРёР№ РґСЂРѕРї.
export const L2DOP_MOB_20924: Mob = {
  id: "l2dop_20924",
  name: "Вождь Ящеров Мель",
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
  drops: [],
  spoil: [],
};

// Р”РѕРґР°С‚РєРѕРІС– РјРѕР±С– РґР»СЏ Gludio (XML 20001вЂ“20100)
// Gremlin вЂ” 20001, XML: no drops
export const L2DOP_MOB_20001: Mob = {
  id: "l2dop_20001", name: "Гремлин", level: 1, hp: 40, mp: 40, pAtk: 8, mAtk: 6, pDef: 44, mDef: 30, exp: 29, sp: 2,
  adenaMin: 6, adenaMax: 12, dropChance: 0.7, drops: [], spoil: [],
};
// Rabbit вЂ” 20002, XML: no drops
export const L2DOP_MOB_20002: Mob = {
  id: "l2dop_20002", name: "Кролик", level: 1, hp: 40, mp: 40, pAtk: 8, mAtk: 6, pDef: 44, mDef: 30, exp: 29, sp: 2,
  adenaMin: 6, adenaMax: 12, dropChance: 0.7, drops: [], spoil: [],
};
// Goblin вЂ” 20003, XML: drop stem/varnish/suede/thread/silver_nugget, spoil charcoal only
export const L2DOP_MOB_20003: Mob = {
  id: "l2dop_20003", name: "Гоблин", level: 5, hp: 80, mp: 70, pAtk: 12, mAtk: 8, pDef: 52, mDef: 34, exp: 178, sp: 5,
  adenaMin: 30, adenaMax: 42, dropChance: 0.7,
  drops: [],
  spoil: [],
};
// Imp (Бес) вЂ” 20004, XML: drop suede+charcoal, spoil РўР†Р›Р¬РљР suede (2005/2006 вЂ” weapon mats, skip)
export const L2DOP_MOB_20004: Mob = {
  id: "l2dop_20004", name: "Бес", level: 6, hp: 94, mp: 77, pAtk: 14, mAtk: 9, pDef: 54, mDef: 36, exp: 213, sp: 6,
  adenaMin: 41, adenaMax: 58, dropChance: 0.7,
  drops: [],
  spoil: [],
};
export const L2DOP_MOB_20005: Mob = {
  id: "l2dop_20005", name: "Старий Бес", level: 7, hp: 108, mp: 85, pAtk: 15, mAtk: 10, pDef: 56, mDef: 37, exp: 249, sp: 8,
  adenaMin: 51, adenaMax: 72, dropChance: 0.7,   drops: [],
  spoil: [],
};
// Orc Archer вЂ” 20006, XML: drop suede+charcoal, spoil 113/1060/2006 (РЅРµ РІ map) в†’ []
export const L2DOP_MOB_20006: Mob = {
  id: "l2dop_20006", name: "Орк Лучник", level: 8, hp: 125, mp: 93, pAtk: 16, mAtk: 11, pDef: 58, mDef: 38, exp: 293, sp: 10,
  adenaMin: 69, adenaMax: 94, dropChance: 0.7,   drops: [],
  spoil: [],
};
// Green Fungus вЂ” 20007, XML: drop stem+iron_ore, spoil suede+stone_of_purity (1122 РЅРµ РІ map)
export const L2DOP_MOB_20007: Mob = {
  id: "l2dop_20007", name: "Зелений Гриб", level: 9, hp: 143, mp: 100, pAtk: 18, mAtk: 12, pDef: 60, mDef: 40, exp: 321, sp: 11,
  adenaMin: 80, adenaMax: 108, dropChance: 0.7,   drops: [],
  spoil: [],
};
// Young Fox вЂ” 20091, XML: no drops
export const L2DOP_MOB_20091: Mob = {
  id: "l2dop_20091", name: "Лисичок", level: 1, hp: 40, mp: 40, pAtk: 8, mAtk: 6, pDef: 44, mDef: 30, exp: 29, sp: 2,
  adenaMin: 6, adenaMax: 12, dropChance: 0.7, drops: [], spoil: [],
};
// Monster Eye вЂ” 20092, XML: drop animal_skin/iron_ore/coal/charcoal/animal_bone, spoil suede only
export const L2DOP_MOB_20092: Mob = {
  id: "l2dop_20092", name: "Глаз Монстра", level: 10, hp: 160, mp: 108, pAtk: 19, mAtk: 13, pDef: 62, mDef: 41, exp: 362, sp: 12,
  adenaMin: 95, adenaMax: 125, dropChance: 0.7,
  drops: [],
  spoil: [],
};
// Orc Fighter вЂ” 20093, XML: drop animal_skin/animal_bone, spoil animal_skin (1666/2007 skip)
export const L2DOP_MOB_20093: Mob = {
  id: "l2dop_20093", name: "Орк Воїн", level: 10, hp: 165, mp: 110, pAtk: 20, mAtk: 13, pDef: 63, mDef: 42, exp: 378, sp: 12,
  adenaMin: 100, adenaMax: 130, dropChance: 0.7,
  drops: [],
  spoil: [],
};
// Orc Marksman вЂ” 20094, XML: no drops
export const L2DOP_MOB_20094: Mob = {
  id: "l2dop_20094", name: "Орк Снайпер", level: 10, hp: 162, mp: 109, pAtk: 19, mAtk: 13, pDef: 62, mDef: 41, exp: 305, sp: 10,
  adenaMin: 98, adenaMax: 128, dropChance: 0.7, drops: [], spoil: [],
};
// Vampire Bat вЂ” 20095, XML: drop stem+iron_ore, spoil stem only (2006 skip)
export const L2DOP_MOB_20095: Mob = {
  id: "l2dop_20095", name: "Вампірська Летуча Миш", level: 10, hp: 163, mp: 108, pAtk: 19, mAtk: 13, pDef: 62, mDef: 41, exp: 296, sp: 10,
  adenaMin: 80, adenaMax: 108, dropChance: 0.7,   drops: [],
  spoil: [],
};
// Orc Lieutenant вЂ” 20096, XML: drop animal_skin/iron_ore/coal/charcoal/animal_bone, spoil 1792/1799/1921 (unmapped)
export const L2DOP_MOB_20096: Mob = {
  id: "l2dop_20096", name: "Орк Лейтенант", level: 11, hp: 185, mp: 116, pAtk: 21, mAtk: 14, pDef: 64, mDef: 43, exp: 391, sp: 15,
  adenaMin: 109, adenaMax: 147, dropChance: 0.7,
  drops: [],
  spoil: [],
};
// Skeleton вЂ” 20099, XML: drop stem/varnish/suede/thread/silver_nugget, spoil 1831/1896/2009 (unmapped)
export const L2DOP_MOB_20099: Mob = {
  id: "l2dop_20099", name: "Скелет", level: 12, hp: 200, mp: 124, pAtk: 23, mAtk: 16, pDef: 66, mDef: 44, exp: 363, sp: 13,
  adenaMin: 95, adenaMax: 131, dropChance: 0.7,
  drops: [],
  spoil: [],
};
// Skeleton Archer вЂ” 20100, XML: drop suede+charcoal, spoil suede only
export const L2DOP_MOB_20100: Mob = {
  id: "l2dop_20100", name: "Скелет-лучник", level: 13, hp: 215, mp: 133, pAtk: 25, mAtk: 17, pDef: 69, mDef: 46, exp: 405, sp: 16,
  adenaMin: 99, adenaMax: 140, dropChance: 0.7, drops: [drop("suede", "resource", 0.025, 1, 1), drop("charcoal", "resource", 0.037, 1, 1)], spoil: [drop("suede", "resource", 0.126, 1, 1)],
};
// Red Bear вЂ” 20021, XML: drop varnish+coal, spoil 1792/1793/1921 (unmapped)
export const L2DOP_MOB_20021: Mob = {
  id: "l2dop_20021", name: "Красивий Ведмідь", level: 14, hp: 245, mp: 155, pAtk: 27, mAtk: 18, pDef: 74, mDef: 49, exp: 565, sp: 17,
  adenaMin: 155, adenaMax: 205, dropChance: 0.7,   drops: [],
  spoil: [],
};
// Langk Lizardman вЂ” 20030, XML: drop varnish+coal, spoil 1794/1798/1831 (unmapped)
export const L2DOP_MOB_20030: Mob = {
  id: "l2dop_20030", name: "Ящір Лангк", level: 15, hp: 268, mp: 168, pAtk: 29, mAtk: 19, pDef: 77, mDef: 51, exp: 615, sp: 18,
  adenaMin: 170, adenaMax: 225, dropChance: 0.7, drops: [drop("varnish", "resource", 0.046, 1, 1), drop("coal", "resource", 0.046, 1, 1)], spoil: [],
};
// Tracker Skeleton вЂ” 20035, XML: drop thread+silver_nugget, spoil thread only
export const L2DOP_MOB_20035: Mob = {
  id: "l2dop_20035", name: "Скелет-трекер", level: 17, hp: 283, mp: 166, pAtk: 35, mAtk: 24, pDef: 79, mDef: 52, exp: 605, sp: 25,
  adenaMin: 120, adenaMax: 193, dropChance: 0.7,   drops: [],
  spoil: [],
};
// Felim Lizardman вЂ” 20008, XML: drop varnish+coal, spoil coal+charcoal
export const L2DOP_MOB_20008: Mob = {
  id: "l2dop_20008", name: "Ящір Фелім", level: 14, hp: 230, mp: 141, pAtk: 27, mAtk: 19, pDef: 71, mDef: 47, exp: 498, sp: 19,
  adenaMin: 150, adenaMax: 200, dropChance: 0.7,   drops: [],
  spoil: [],
};
// Selu Lizardman Scout вЂ” 20069. РЇС‰С–СЂРё: leather, varnish, thread. Spoil вЂ” С–РЅР°РєС€РёР№ РЅР°Р±С–СЂ.
export const L2DOP_MOB_20069: Mob = {
  id: "l2dop_20069", name: "Розвідчик Ящерів Селу", level: 26, hp: 520, mp: 310, pAtk: 58, mAtk: 38, pDef: 105, mDef: 70, exp: 980, sp: 28,
  adenaMin: 320, adenaMax: 420, dropChance: 0.7,
  drops: [],
  spoil: [],
};
// Granite Golem вЂ” 20083. Р“РѕР»РµРјРё: mithril, steel (РјС–РЅРµСЂР°Р»Рё). Spoil вЂ” oriharukon, stone_of_purity.
export const L2DOP_MOB_20083: Mob = {
  id: "l2dop_20083", name: "Гранітовий Голем", level: 33, hp: 980, mp: 580, pAtk: 95, mAtk: 62, pDef: 145, mDef: 96, exp: 1650, sp: 48,
  adenaMin: 380, adenaMax: 510, dropChance: 0.7,
  drops: [],
  spoil: [],
};

// Тетрарх Орк Турек вЂ” 20546, lvl 34 (Turek Orc Elder). L2: РѕСЂРєРё вЂ” iron_ore, coal, suede, steel.
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
  drops: [],
  spoil: [],
};

/** РџСѓР» РјРѕР±С–РІ РґР»СЏ Gludio (Р»РІР» 1вЂ“35) */
export const L2DOP_GLUDIO_POOL: Mob[] = [
  L2DOP_MOB_20001, L2DOP_MOB_20002, L2DOP_MOB_20091, L2DOP_MOB_20545, L2DOP_MOB_20481, L2DOP_MOB_20432, L2DOP_MOB_20544, L2DOP_MOB_20120,
  L2DOP_MOB_20003, L2DOP_MOB_20004, L2DOP_MOB_20005, L2DOP_MOB_20006, L2DOP_MOB_20007,
  L2DOP_MOB_20092, L2DOP_MOB_20093, L2DOP_MOB_20094, L2DOP_MOB_20095, L2DOP_MOB_20096,
  L2DOP_MOB_20099, L2DOP_MOB_20100, L2DOP_MOB_20021, L2DOP_MOB_20008, L2DOP_MOB_20030, L2DOP_MOB_20035,
  L2DOP_MOB_20924, L2DOP_MOB_20546, L2DOP_MOB_20069, L2DOP_MOB_20083,
];

/** Р—Р°РїРѕРІРЅРёС‚Рё Р·РѕРЅСѓ РјРѕР±Р°РјРё: 10вЂ“20 РІРёРґС–РІ, 30вЂ“200 РјРѕР±С–РІ (РґРµС‚РµСЂРјС–РЅРѕРІР°РЅРѕ РїРѕ seed) */
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

/** Р—РјС–С€Р°С‚Рё РјРѕР±С–РІ, С‡РµРјРїС–РѕРЅС–РІ С– Р Р‘ РІРёРїР°РґРєРѕРІРѕ (РґРµС‚РµСЂРјС–РЅРѕРІР°РЅРѕ РїРѕ zoneId) вЂ” РЅРµ РІ РєС–РЅС†С– СЃРїРёСЃРєСѓ */
export function shuffleMobsRandomly(regular: Mob[], champions: Mob[], raidBosses: RaidBoss[], zoneId: string): (Mob | RaidBoss)[] {
  const all = [...regular, ...champions, ...raidBosses];
  let h = 0;
  for (let i = 0; i < zoneId.length; i++) h = (h * 31 + zoneId.charCodeAt(i)) | 0;
  const rand = () => { h = (h * 1664525 + 1013904223) | 0; return (h >>> 0) / 0xffffffff; };
  return [...all].sort(() => rand() - 0.5);
}

/** РЎС‚РІРѕСЂРёС‚Рё С‡РµРјРїС–РѕРЅР° Р· Р±Р°Р·РѕРІРѕРіРѕ РјРѕР±Р°: ~3Г— СЃС‚Р°С‚Рё, ~10Г— exp/sp/adena, РєСЂР°С‰С– drop/spoil */
function scaleChampionDrop<T extends DropEntry>(d: T): T {
  if (d.chancePerMillion != null) return { ...d };
  return {
    ...d,
    chance: Math.min(0.9, (d.chance ?? 0.5) * 3),
    min: (d.min ?? 1) * 2,
    max: (d.max ?? 1) * 4,
  } as T;
}

export function makeChampion(base: Mob, championName: string, suffix: string): Mob {
  const champDrops = (base.drops ?? []).map(scaleChampionDrop);
  const champSpoil = (base.spoil ?? []).map(scaleChampionDrop);
  const usesL2Rates = [...champDrops, ...champSpoil].some((x) => x.chancePerMillion != null);
  return {
    ...base,
    id: `${base.id}_champion_${suffix}`,
    name: `[Чемпіон] ${championName}`,
    icon:
      base.icon?.trim() ||
      resolveMobIconFromName(championName) ||
      getMobPublicIconSrc(base.name),
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
    dropChance: usesL2Rates ? 1 : 0.85,
    drops: champDrops.length ? champDrops : [],
    spoil: champSpoil.length ? champSpoil : [],
  };
}

/** 3вЂ“7 С‡РµРјРїС–РѕРЅС–РІ РЅР° Р·РѕРЅСѓ Gludio (РґРµС‚РµСЂРјС–РЅРѕРІР°РЅРѕ РїРѕ zoneId) */
export function getGludioL2DopChampions(zoneId: string, minLvl: number, maxLvl: number): Mob[] {
  const filtered = L2DOP_GLUDIO_POOL.filter((m) => m.level >= minLvl && m.level <= maxLvl);
  if (filtered.length < 2) return [];
  let h = 0;
  for (let i = 0; i < zoneId.length; i++) h = (h * 31 + zoneId.charCodeAt(i)) | 0;
  const rand = () => { h = (h * 1664525 + 1013904223) | 0; return (h >>> 0) / 0xffffffff; };
  const count = 3 + Math.floor(rand() * 5); // 3вЂ“7
  const shuffled = [...filtered].sort(() => rand() - 0.5);
  const names: Record<string, string> = {
    "01": "Окраїнський Громила", "02": "Луговий Вождь", "03": "Рощовий Лорд", "04": "Болотний Тінь",
    "05": "Руїнний Страх", "06": "Ящір-Тиран", "07": "Орк-Тетрарх", "08": "Печерний Лорд",
  };
  const suffixes = ["I", "II", "III", "IV", "V", "Громила", "Тиран"];
  const zoneNum = zoneId.replace("l2dop_gludio_", "");
  const baseName = names[zoneNum] ?? "Глоріо Чемпіон";
  const result: Mob[] = [];
  for (let i = 0; i < Math.min(count, shuffled.length); i++) {
    result.push(makeChampion(shuffled[i], `${baseName} ${suffixes[i % suffixes.length]}`, String.fromCharCode(97 + i)));
  }
  return result;
}

/** NG/D СЂРµСЃСѓСЂСЃРё РґР»СЏ РґСЂРѕРїСѓ Gludio Р Р‘ (Р»РІР» 1вЂ“40) */
function gludioRbDrops(_rbIndex: number): DropEntry[] {
  return [];
}

/** Р‘Р°Р·РѕРІС– Р Р‘ Gludio вЂ” РїРѕ РѕРґРЅРѕРјСѓ РЅР° Р·РѕРЅСѓ; getGludioRaidBossesForZone СЂРѕР·С€РёСЂСЋС” РґРѕ 6 С– РїРѕРІРµСЂС‚Р°С” 3вЂ“6 */
const GLUDIO_RB_BASE: RaidBoss[] = [
  { id: "rb_l2dop_gludio_01", name: "Чемпіон", level: 5, hp: 8000, mp: 0, pAtk: 90, mAtk: 0, pDef: 70, mDef: 50, exp: 8000, sp: 500, adenaMin: 2500, adenaMax: 4500, dropChance: 1, drops: gludioRbDrops(0), isRaidBoss: true, respawnTime: 4 * 60 * 60, dropProfileId: "rb_l2dop_gludio_drop", aiProfileId: "rb_floran_ai", zoneId: "l2dop_gludio_01" },
  { id: "rb_l2dop_gludio_02", name: "Окраїнський Громила", level: 8, hp: 15000, mp: 0, pAtk: 120, mAtk: 0, pDef: 95, mDef: 65, exp: 15000, sp: 800, adenaMin: 4000, adenaMax: 7000, dropChance: 1, drops: gludioRbDrops(1), isRaidBoss: true, respawnTime: 4 * 60 * 60, dropProfileId: "rb_l2dop_gludio_drop", aiProfileId: "rb_floran_ai", zoneId: "l2dop_gludio_02" },
  { id: "rb_l2dop_gludio_03", name: "Луговий Вождь", level: 12, hp: 25000, mp: 0, pAtk: 160, mAtk: 0, pDef: 125, mDef: 85, exp: 28000, sp: 1200, adenaMin: 6000, adenaMax: 10000, dropChance: 1, drops: gludioRbDrops(2), isRaidBoss: true, respawnTime: 4 * 60 * 60, dropProfileId: "rb_l2dop_gludio_drop", aiProfileId: "rb_floran_ai", zoneId: "l2dop_gludio_03" },
  { id: "rb_l2dop_gludio_04", name: "Старий Бес", level: 18, hp: 40000, mp: 0, pAtk: 220, mAtk: 0, pDef: 170, mDef: 110, exp: 55000, sp: 2000, adenaMin: 10000, adenaMax: 16000, dropChance: 1, drops: gludioRbDrops(3), isRaidBoss: true, respawnTime: 4 * 60 * 60, dropProfileId: "rb_l2dop_gludio_drop", aiProfileId: "rb_floran_ai", zoneId: "l2dop_gludio_04" },
  { id: "rb_l2dop_gludio_05", name: "Болотний Тінь", level: 22, hp: 55000, mp: 0, pAtk: 280, mAtk: 0, pDef: 215, mDef: 140, exp: 75000, sp: 2800, adenaMin: 14000, adenaMax: 22000, dropChance: 1, drops: gludioRbDrops(4), isRaidBoss: true, respawnTime: 4 * 60 * 60, dropProfileId: "rb_l2dop_gludio_drop", aiProfileId: "rb_floran_ai", zoneId: "l2dop_gludio_05" },
  { id: "rb_l2dop_gludio_06", name: "Зелений Гриб", level: 28, hp: 75000, mp: 0, pAtk: 350, mAtk: 0, pDef: 275, mDef: 180, exp: 110000, sp: 4000, adenaMin: 22000, adenaMax: 32000, dropChance: 1, drops: gludioRbDrops(5), isRaidBoss: true, respawnTime: 4 * 60 * 60, dropProfileId: "rb_l2dop_gludio_drop", aiProfileId: "rb_floran_ai", zoneId: "l2dop_gludio_06" },
  { id: "rb_l2dop_gludio_07", name: "Ящір-Тиран", level: 35, hp: 100000, mp: 0, pAtk: 430, mAtk: 0, pDef: 340, mDef: 225, exp: 150000, sp: 5500, adenaMin: 30000, adenaMax: 45000, dropChance: 1, drops: gludioRbDrops(6), isRaidBoss: true, respawnTime: 4 * 60 * 60, dropProfileId: "rb_l2dop_gludio_drop", aiProfileId: "rb_floran_ai", zoneId: "l2dop_gludio_07" },
  { id: "rb_l2dop_gludio_08", name: "Орк-Тетрарх", level: 40, hp: 130000, mp: 0, pAtk: 520, mAtk: 0, pDef: 410, mDef: 270, exp: 200000, sp: 7000, adenaMin: 40000, adenaMax: 60000, dropChance: 1, drops: gludioRbDrops(7), isRaidBoss: true, respawnTime: 4 * 60 * 60, dropProfileId: "rb_l2dop_gludio_drop", aiProfileId: "rb_floran_ai", zoneId: "l2dop_gludio_08" },
];

const GLUDIO_RB_EXTRA_NAMES: Record<string, string[]> = {
  "01": ["Страж Окраїни", "Вартовий Окраїни", "Повелитель Окраїни", "Тиран Окраїни", "Лорд Окраїни"],
  "02": ["Король Лугів", "Страж Лугів", "Дракон Лугів", "Тиран Лугів", "Вождь Лугів"],
  "03": ["Дракон Рощі", "Король Рощі", "Тиран Рощі", "Страж Рощі", "Лорд Рощі"],
  "04": ["Тиран Болота", "Король Болота", "Дракон Болота", "Страж Болота", "Повелитель Болота"],
  "05": ["Дракон Руїн", "Страж Руїн", "Тиран Руїн", "Король Руїн", "Вождь Руїн"],
  "06": ["Тиран Ящерів", "Король Ящерів", "Страж Ящерів", "Дракон Ящерів", "Повелитель Ящерів"],
  "07": ["Король Орків", "Тиран Орків", "Страж Орків", "Вождь Орків", "Дракон Орків"],
  "08": ["Король Печер", "Тиран Печер", "Страж Печер", "Дракон Печер", "Повелитель Печер"],
};

function cloneRaidBoss(base: RaidBoss, suffix: string, nameSuffix: string): RaidBoss {
  const mul = 0.9 + (suffix.charCodeAt(0) % 5) * 0.05;
  return {
    ...base,
    id: `${base.id}_${suffix}`,
    name: `Raid Boss: ${nameSuffix}`,
    hp: Math.round(base.hp * mul),
    pAtk: Math.round(base.pAtk * mul),
    pDef: Math.round(base.pDef * mul),
    mDef: Math.round(base.mDef * mul),
    exp: Math.round(base.exp * mul),
    sp: Math.round((base.sp ?? 0) * mul),
    adenaMin: Math.round(base.adenaMin * mul),
    adenaMax: Math.round(base.adenaMax * mul),
  };
}

/** 3вЂ“6 Р Р‘ РЅР° Р·РѕРЅСѓ Gludio (СЂР°РЅРґРѕРјРЅРѕ, РґРµС‚РµСЂРјС–РЅРѕРІР°РЅРѕ РїРѕ zoneId) */
export function getGludioRaidBossesForZone(zoneId: string): RaidBoss[] {
  const base = GLUDIO_RB_BASE.find((rb) => rb.zoneId === zoneId);
  if (!base) return [];
  let h = 0;
  for (let i = 0; i < zoneId.length; i++) h = (h * 31 + zoneId.charCodeAt(i)) | 0;
  const rand = () => { h = (h * 1664525 + 1013904223) | 0; return (h >>> 0) / 0xffffffff; };
  const zoneNum = zoneId.replace("l2dop_gludio_", "");
  const extraNames = GLUDIO_RB_EXTRA_NAMES[zoneNum] ?? [];
  const all: RaidBoss[] = [base, ...extraNames.map((n, i) => cloneRaidBoss(base, String.fromCharCode(98 + i), n))];
  const takeCount = 3 + Math.floor(rand() * 4); // 3вЂ“6
  return [...all].sort(() => rand() - 0.5).slice(0, Math.min(takeCount, all.length));
}

export const L2DOP_GLUDIO_RAID_BOSSES: RaidBoss[] = GLUDIO_RB_BASE;

// РћРєСЂР°С—РЅР° вЂ” 01+02+03: 5 РјРѕР±С–РІ (legacy)
export const L2DOP_GLUDIO32_1725_MOBS: Mob[] = [
  L2DOP_MOB_20545,
  L2DOP_MOB_20481,
  L2DOP_MOB_20432,
  L2DOP_MOB_20544,
  L2DOP_MOB_20120,
];

// Печерний Лорд вЂ” 18001, lvl 60, hp 3054, mp 1150, giran03_2321_15
// droplist: adena 765вЂ“1528, spoil stem, suede, high_grade_suede
export const L2DOP_MOB_18001: Mob = {
  id: "l2dop_18001",
  name: "Печерний Лорд",
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
  drops: [],
  spoil: [],
};

export const L2DOP_GLUDIO15_1721_MOBS: Mob[] = [L2DOP_MOB_20546];
export const L2DOP_GLUDIO23_1921_MOBS: Mob[] = [L2DOP_MOB_20924];
export const L2DOP_GIRAN03_2321_MOBS: Mob[] = [L2DOP_MOB_18001];

/* ==================== ADEN (L2) вЂ” Р»РІР» 40вЂ“65 ====================
   РўРµРјР°С‚РёРєР°: С„РѕСЂС‚РµС†СЏ, РІРёРіРЅР°РЅС†С–, РјР°РіС–С‡РЅС– РґРѕР»РёРЅРё. Р РµСЃСѓСЂСЃРё D/C-grade. */

// Громила вЂ” 40, С‚РµРјР° Execution Grounds
export const L2DOP_MOB_ADEN_40: Mob = {
  id: "l2dop_aden_40", name: "Громила", level: 40, hp: 1420, mp: 480, pAtk: 185, mAtk: 95, pDef: 175, mDef: 125,
  exp: 2100, sp: 120, adenaMin: 520, adenaMax: 820, dropChance: 0.7,
  drops: [],
  spoil: [],
};
// Тиран вЂ” 42
export const L2DOP_MOB_ADEN_42: Mob = {
  id: "l2dop_aden_42", name: "Тиран", level: 42, hp: 1280, mp: 720, pAtk: 95, mAtk: 210, pDef: 120, mDef: 185,
  exp: 2450, sp: 135, adenaMin: 580, adenaMax: 920, dropChance: 0.7,
  drops: [],
  spoil: [],
};
// Глоріо Чемпіон вЂ” 44, С‚РµРјР° Enchanted Valley
export const L2DOP_MOB_ADEN_44: Mob = {
  id: "l2dop_aden_44", name: "Глоріо Чемпіон", level: 44, hp: 1680, mp: 520, pAtk: 215, mAtk: 0, pDef: 205, mDef: 145,
  exp: 2900, sp: 155, adenaMin: 680, adenaMax: 1050, dropChance: 0.7,
  drops: [],
  spoil: [],
};
// Хранитель Окраїни вЂ” 46
export const L2DOP_MOB_ADEN_46: Mob = {
  id: "l2dop_aden_46", name: "Хранитель Окраїни", level: 46, hp: 1520, mp: 880, pAtk: 0, mAtk: 240, pDef: 140, mDef: 210,
  exp: 3400, sp: 175, adenaMin: 780, adenaMax: 1200, dropChance: 0.7,
  drops: [],
  spoil: [],
};
// Лорд Лугів вЂ” 48, Execution Grounds
export const L2DOP_MOB_ADEN_48: Mob = {
  id: "l2dop_aden_48", name: "Лорд Лугів", level: 48, hp: 1950, mp: 560, pAtk: 255, mAtk: 0, pDef: 240, mDef: 165,
  exp: 4000, sp: 200, adenaMin: 900, adenaMax: 1400, dropChance: 0.7,
  drops: [],
  spoil: [],
};
// Лисичок вЂ” 50
export const L2DOP_MOB_ADEN_50: Mob = {
  id: "l2dop_aden_50", name: "Лисичок", level: 50, hp: 2100, mp: 400, pAtk: 275, mAtk: 0, pDef: 265, mDef: 180,
  exp: 4700, sp: 230, adenaMin: 1050, adenaMax: 1600, dropChance: 0.7,
  drops: [],
  spoil: [],
};
// Болотний Дракон вЂ” 52, Blazing Swamp
export const L2DOP_MOB_ADEN_52: Mob = {
  id: "l2dop_aden_52", name: "Болотний Дракон", level: 52, hp: 2350, mp: 620, pAtk: 300, mAtk: 125, pDef: 290, mDef: 200,
  exp: 5500, sp: 260, adenaMin: 1200, adenaMax: 1850, dropChance: 0.7,
  drops: [],
  spoil: [],
};
// Глаз Монстра вЂ” 54
export const L2DOP_MOB_ADEN_54: Mob = {
  id: "l2dop_aden_54", name: "Глаз Монстра", level: 54, hp: 2580, mp: 680, pAtk: 330, mAtk: 0, pDef: 318, mDef: 218,
  exp: 6400, sp: 295, adenaMin: 1400, adenaMax: 2120, dropChance: 0.7,
  drops: [],
  spoil: [],
};
// Ящір-Імператор вЂ” 56
export const L2DOP_MOB_ADEN_56: Mob = {
  id: "l2dop_aden_56", name: "Ящір-Імператор", level: 56, hp: 2820, mp: 920, pAtk: 180, mAtk: 320, pDef: 200, mDef: 280,
  exp: 7400, sp: 335, adenaMin: 1650, adenaMax: 2450, dropChance: 0.7,
  drops: [],
  spoil: [],
};
// Орк-Верховний вЂ” 58
export const L2DOP_MOB_ADEN_58: Mob = {
  id: "l2dop_aden_58", name: "Орк-Верховний", level: 58, hp: 3100, mp: 600, pAtk: 380, mAtk: 0, pDef: 365, mDef: 250,
  exp: 8600, sp: 380, adenaMin: 1900, adenaMax: 2850, dropChance: 0.7,
  drops: [],
  spoil: [],
};
// Печерний Титан вЂ” 60
export const L2DOP_MOB_ADEN_60: Mob = {
  id: "l2dop_aden_60", name: "Печерний Титан", level: 60, hp: 3400, mp: 400, pAtk: 420, mAtk: 0, pDef: 410, mDef: 280,
  exp: 10000, sp: 430, adenaMin: 2200, adenaMax: 3300, dropChance: 0.7,
  drops: [],
  spoil: [],
};
// Страж Окраїни вЂ” 62
export const L2DOP_MOB_ADEN_62: Mob = {
  id: "l2dop_aden_62", name: "Страж Окраїни", level: 62, hp: 3720, mp: 880, pAtk: 460, mAtk: 200, pDef: 455, mDef: 310,
  exp: 11600, sp: 485, adenaMin: 2550, adenaMax: 3800, dropChance: 0.7,
  drops: [],
  spoil: [],
};
// Вартовий Окраїни вЂ” 65
export const L2DOP_MOB_ADEN_65: Mob = {
  id: "l2dop_aden_65", name: "Вартовий Окраїни", level: 65, hp: 4200, mp: 700, pAtk: 520, mAtk: 0, pDef: 510, mDef: 350,
  exp: 13500, sp: 550, adenaMin: 3000, adenaMax: 4500, dropChance: 0.7,
  drops: [],
  spoil: [],
};

/** РџСѓР» РјРѕР±С–РІ РґР»СЏ Aden (Р»РІР» 40вЂ“65) */
export const L2DOP_ADEN_POOL: Mob[] = [
  L2DOP_MOB_20083, L2DOP_MOB_20924, L2DOP_MOB_20546, // 33, 30, 34 вЂ” РїРµСЂРµС…С–Рґ
  L2DOP_MOB_ADEN_40, L2DOP_MOB_ADEN_42, L2DOP_MOB_ADEN_44, L2DOP_MOB_ADEN_46,
  L2DOP_MOB_ADEN_48, L2DOP_MOB_ADEN_50, L2DOP_MOB_ADEN_52, L2DOP_MOB_ADEN_54,
  L2DOP_MOB_ADEN_56, L2DOP_MOB_ADEN_58, L2DOP_MOB_18001, L2DOP_MOB_ADEN_60,
  L2DOP_MOB_ADEN_62, L2DOP_MOB_ADEN_65,
];

/** 3вЂ“7 С‡РµРјРїС–РѕРЅС–РІ РЅР° Р·РѕРЅСѓ Aden (РґРµС‚РµСЂРјС–РЅРѕРІР°РЅРѕ РїРѕ zoneId) */
export function getAdenL2DopChampions(zoneId: string, minLvl: number, maxLvl: number): Mob[] {
  const filtered = L2DOP_ADEN_POOL.filter((m) => m.level >= minLvl && m.level <= maxLvl);
  if (filtered.length < 2) return [];
  let h = 0;
  for (let i = 0; i < zoneId.length; i++) h = (h * 31 + zoneId.charCodeAt(i)) | 0;
  const rand = () => { h = (h * 1664525 + 1013904223) | 0; return (h >>> 0) / 0xffffffff; };
  const count = 3 + Math.floor(rand() * 5); // 3вЂ“7
  const shuffled = [...filtered].sort(() => rand() - 0.5);
  const names: Record<string, string> = {
    "01": "Окраїнський Страж", "02": "Долинний Вождь", "03": "Магічний Тиран", "04": "Лорд Лугів-Кат",
    "05": "Скелет-Лорд", "06": "Воїняний Повелитель", "07": "Темний Архонт", "08": "Фортечний Імператор",
  };
  const suffixes = ["I", "II", "III", "IV", "V", "Стража", "Тиран"];
  const zoneNum = zoneId.replace("l2dop_aden_", "");
  const baseName = names[zoneNum] ?? "Аден Чемпіон";
  const result: Mob[] = [];
  for (let i = 0; i < Math.min(count, shuffled.length); i++) {
    result.push(makeChampion(shuffled[i], `${baseName} ${suffixes[i % suffixes.length]}`, String.fromCharCode(97 + i)));
  }
  return result;
}

/** D/C-grade СЂРµСЃСѓСЂСЃРё РґР»СЏ РґСЂРѕРїСѓ Aden Р Р‘ (Р»РІР» 40вЂ“65) */
function adenRbDrops(_rbIndex: number): DropEntry[] {
  return [];
}

/** Р‘Р°Р·РѕРІС– Р Р‘ Aden вЂ” РїРѕ РѕРґРЅРѕРјСѓ РЅР° Р·РѕРЅСѓ; getAdenRaidBossesForZone СЂРѕР·С€РёСЂСЋС” РґРѕ 6 С– РїРѕРІРµСЂС‚Р°С” 3вЂ“6 */
const ADEN_RB_BASE: RaidBoss[] = [
  { id: "rb_l2dop_aden_01", name: "Повелитель Окраїни", level: 42, hp: 180000, mp: 0, pAtk: 380, mAtk: 0, pDef: 310, mDef: 210, exp: 85000, sp: 4500, adenaMin: 35000, adenaMax: 55000, dropChance: 1, drops: adenRbDrops(0), isRaidBoss: true, respawnTime: 5 * 60 * 60, dropProfileId: "rb_l2dop_aden_drop", aiProfileId: "rb_floran_ai", zoneId: "l2dop_aden_01" },
  { id: "rb_l2dop_aden_02", name: "Король Лугів", level: 45, hp: 220000, mp: 0, pAtk: 440, mAtk: 0, pDef: 360, mDef: 245, exp: 105000, sp: 5500, adenaMin: 45000, adenaMax: 70000, dropChance: 1, drops: adenRbDrops(1), isRaidBoss: true, respawnTime: 5 * 60 * 60, dropProfileId: "rb_l2dop_aden_drop", aiProfileId: "rb_floran_ai", zoneId: "l2dop_aden_02" },
  { id: "rb_l2dop_aden_03", name: "Страж Лугів", level: 48, hp: 270000, mp: 0, pAtk: 520, mAtk: 0, pDef: 425, mDef: 290, exp: 130000, sp: 6800, adenaMin: 55000, adenaMax: 85000, dropChance: 1, drops: adenRbDrops(2), isRaidBoss: true, respawnTime: 5 * 60 * 60, dropProfileId: "rb_l2dop_aden_drop", aiProfileId: "rb_floran_ai", zoneId: "l2dop_aden_03" },
  { id: "rb_l2dop_aden_04", name: "Орк Воїн", level: 51, hp: 320000, mp: 0, pAtk: 600, mAtk: 0, pDef: 495, mDef: 335, exp: 160000, sp: 8200, adenaMin: 70000, adenaMax: 105000, dropChance: 1, drops: adenRbDrops(3), isRaidBoss: true, respawnTime: 5 * 60 * 60, dropProfileId: "rb_l2dop_aden_drop", aiProfileId: "rb_floran_ai", zoneId: "l2dop_aden_04" },
  { id: "rb_l2dop_aden_05", name: "Орк Снайпер", level: 54, hp: 380000, mp: 0, pAtk: 690, mAtk: 0, pDef: 570, mDef: 385, exp: 195000, sp: 10000, adenaMin: 85000, adenaMax: 130000, dropChance: 1, drops: adenRbDrops(4), isRaidBoss: true, respawnTime: 5 * 60 * 60, dropProfileId: "rb_l2dop_aden_drop", aiProfileId: "rb_floran_ai", zoneId: "l2dop_aden_05" },
  { id: "rb_l2dop_aden_06", name: "Тиран Болота", level: 57, hp: 450000, mp: 0, pAtk: 790, mAtk: 0, pDef: 655, mDef: 440, exp: 235000, sp: 12000, adenaMin: 100000, adenaMax: 155000, dropChance: 1, drops: adenRbDrops(5), isRaidBoss: true, respawnTime: 6 * 60 * 60, dropProfileId: "rb_l2dop_aden_drop", aiProfileId: "rb_floran_ai", zoneId: "l2dop_aden_06" },
  { id: "rb_l2dop_aden_07", name: "Король Болота", level: 60, hp: 520000, mp: 0, pAtk: 890, mAtk: 0, pDef: 750, mDef: 505, exp: 280000, sp: 14200, adenaMin: 120000, adenaMax: 180000, dropChance: 1, drops: adenRbDrops(6), isRaidBoss: true, respawnTime: 6 * 60 * 60, dropProfileId: "rb_l2dop_aden_drop", aiProfileId: "rb_floran_ai", zoneId: "l2dop_aden_07" },
  { id: "rb_l2dop_aden_08", name: "Вампірська Летуча Миш", level: 65, hp: 620000, mp: 0, pAtk: 1050, mAtk: 0, pDef: 890, mDef: 600, exp: 350000, sp: 17500, adenaMin: 150000, adenaMax: 230000, dropChance: 1, drops: adenRbDrops(7), isRaidBoss: true, respawnTime: 6 * 60 * 60, dropProfileId: "rb_l2dop_aden_drop", aiProfileId: "rb_floran_ai", zoneId: "l2dop_aden_08" },
];

const ADEN_RB_EXTRA_NAMES: Record<string, string[]> = {
  "01": ["Вартовий Окраїни", "Повелитель Окраїни", "Тиран Окраїни", "Лорд Окраїни", "Дракон Окраїни"],
  "02": ["Король Долини", "Страж Долини", "Тиран Долини", "Повелитель Долини", "Архонт Долини"],
  "03": ["Дракон Долини", "Король Долини", "Тиран Магії", "Страж Магії", "Повелитель Магії"],
  "04": ["Тиран Страті", "Король Страті", "Дракон Страті", "Страж Страті", "Повелитель Страті"],
  "05": ["Дракон Скелетів", "Страж Скелетів", "Тиран Скелетів", "Король Кістей", "Повелитель Кістей"],
  "06": ["Тиран Воїни", "Король Воїни", "Страж Воїни", "Дракон Болота", "Повелитель Воїни"],
  "07": ["Король Темряви", "Тиран Темряви", "Страж Підземелля", "Архонт Темряви", "Повелитель Темряви"],
  "08": ["Король Фортеці", "Тиран Фортеці", "Вартовий Окраїни", "Дракон Фортеці", "Повелитель Фортеці"],
};

/** 3вЂ“6 Р Р‘ РЅР° Р·РѕРЅСѓ Aden (СЂР°РЅРґРѕРјРЅРѕ, РґРµС‚РµСЂРјС–РЅРѕРІР°РЅРѕ РїРѕ zoneId) */
export function getAdenRaidBossesForZone(zoneId: string): RaidBoss[] {
  const base = ADEN_RB_BASE.find((rb) => rb.zoneId === zoneId);
  if (!base) return [];
  let h = 0;
  for (let i = 0; i < zoneId.length; i++) h = (h * 31 + zoneId.charCodeAt(i)) | 0;
  const rand = () => { h = (h * 1664525 + 1013904223) | 0; return (h >>> 0) / 0xffffffff; };
  const zoneNum = zoneId.replace("l2dop_aden_", "");
  const extraNames = ADEN_RB_EXTRA_NAMES[zoneNum] ?? [];
  const all: RaidBoss[] = [base, ...extraNames.map((n, i) => cloneRaidBoss(base, String.fromCharCode(98 + i), n))];
  const takeCount = 3 + Math.floor(rand() * 4); // 3–6
  return [...all].sort(() => rand() - 0.5).slice(0, Math.min(takeCount, all.length));
}

export const L2DOP_ADEN_RAID_BOSSES: RaidBoss[] = ADEN_RB_BASE;

/* ==================== OREN (L2) — рівні ~42–60 ==================== */

export const L2DOP_MOB_OREN_42: Mob = {
  id: "l2dop_oren_guard",
  name: "Вартовий Околиць Орену",
  level: 42,
  hp: 1460,
  mp: 500,
  pAtk: 192,
  mAtk: 98,
  pDef: 182,
  mDef: 132,
  exp: 2280,
  sp: 126,
  adenaMin: 550,
  adenaMax: 860,
  dropChance: 0.7,
  drops: [],
  spoil: [],
};
export const L2DOP_MOB_OREN_44: Mob = {
  id: "l2dop_oren_forest",
  name: "Тінь Лісу Мореллін",
  level: 44,
  hp: 1620,
  mp: 540,
  pAtk: 208,
  mAtk: 0,
  pDef: 198,
  mDef: 138,
  exp: 2680,
  sp: 142,
  adenaMin: 630,
  adenaMax: 970,
  dropChance: 0.7,
  drops: [],
  spoil: [],
};
export const L2DOP_MOB_OREN_46: Mob = {
  id: "l2dop_oren_spore",
  name: "Споровий Шаман",
  level: 46,
  hp: 1540,
  mp: 820,
  pAtk: 0,
  mAtk: 248,
  pDef: 142,
  mDef: 208,
  exp: 3220,
  sp: 170,
  adenaMin: 730,
  adenaMax: 1130,
  dropChance: 0.7,
  drops: [],
  spoil: [],
};
export const L2DOP_MOB_OREN_48: Mob = {
  id: "l2dop_oren_cruma",
  name: "Крумський Розбійник",
  level: 48,
  hp: 1880,
  mp: 580,
  pAtk: 248,
  mAtk: 0,
  pDef: 232,
  mDef: 158,
  exp: 3680,
  sp: 184,
  adenaMin: 830,
  adenaMax: 1290,
  dropChance: 0.7,
  drops: [],
  spoil: [],
};
export const L2DOP_MOB_OREN_50: Mob = {
  id: "l2dop_oren_cross",
  name: "Злодій Хреста",
  level: 50,
  hp: 2050,
  mp: 420,
  pAtk: 268,
  mAtk: 0,
  pDef: 256,
  mDef: 172,
  exp: 4250,
  sp: 202,
  adenaMin: 950,
  adenaMax: 1430,
  dropChance: 0.7,
  drops: [],
  spoil: [],
};
export const L2DOP_MOB_OREN_52: Mob = {
  id: "l2dop_oren_hill",
  name: "Пагорбовий Ящір",
  level: 52,
  hp: 2280,
  mp: 640,
  pAtk: 292,
  mAtk: 118,
  pDef: 278,
  mDef: 192,
  exp: 4900,
  sp: 230,
  adenaMin: 1090,
  adenaMax: 1630,
  dropChance: 0.7,
  drops: [],
  spoil: [],
};
export const L2DOP_MOB_OREN_54: Mob = {
  id: "l2dop_oren_ruin",
  name: "Скелет Руїн Орену",
  level: 54,
  hp: 2480,
  mp: 700,
  pAtk: 318,
  mAtk: 0,
  pDef: 302,
  mDef: 208,
  exp: 5650,
  sp: 260,
  adenaMin: 1250,
  adenaMax: 1860,
  dropChance: 0.7,
  drops: [],
  spoil: [],
};
export const L2DOP_MOB_OREN_56: Mob = {
  id: "l2dop_oren_tower",
  name: "Маг Слонової Вежі",
  level: 56,
  hp: 2680,
  mp: 900,
  pAtk: 188,
  mAtk: 298,
  pDef: 208,
  mDef: 268,
  exp: 6550,
  sp: 292,
  adenaMin: 1430,
  adenaMax: 2120,
  dropChance: 0.7,
  drops: [],
  spoil: [],
};

/** Пул Орену: тематичні моби + ті самі типи, що й біля Адену (рівні 33–65) */
export const L2DOP_OREN_POOL: Mob[] = [
  L2DOP_MOB_OREN_42,
  L2DOP_MOB_OREN_44,
  L2DOP_MOB_OREN_46,
  L2DOP_MOB_OREN_48,
  L2DOP_MOB_OREN_50,
  L2DOP_MOB_OREN_52,
  L2DOP_MOB_OREN_54,
  L2DOP_MOB_OREN_56,
  ...L2DOP_ADEN_POOL,
];

/** Два чемпіони на зону (пара) */
export function getOrenL2DopChampions(zoneId: string, minLvl: number, maxLvl: number): Mob[] {
  const filtered = L2DOP_OREN_POOL.filter((m) => m.level >= minLvl && m.level <= maxLvl);
  if (filtered.length < 2) return [];
  let h = 0;
  for (let i = 0; i < zoneId.length; i++) h = (h * 31 + zoneId.charCodeAt(i)) | 0;
  const rand = () => { h = (h * 1664525 + 1013904223) | 0; return (h >>> 0) / 0xffffffff; };
  const count = 2;
  const shuffled = [...filtered].sort(() => rand() - 0.5);
  const names: Record<string, string> = {
    "01": "Вартовий Околиць",
    "02": "Тінь Темного Лісу",
    "03": "Король Спор",
    "04": "Скелет Круми",
    "05": "Лорд Хреста",
    "06": "Володар Пагорбів",
    "07": "Хранитель Руїн Орену",
    "08": "Тінь Слонової Вежі",
  };
  const suffixes = ["I", "II"];
  const zoneNum = zoneId.replace("l2dop_oren_", "");
  const baseName = names[zoneNum] ?? "Чемпіон Орену";
  const result: Mob[] = [];
  for (let i = 0; i < Math.min(count, shuffled.length); i++) {
    result.push(makeChampion(shuffled[i], `${baseName} ${suffixes[i % suffixes.length]}`, String.fromCharCode(97 + i)));
  }
  return result;
}

function orenRbDrops(_rbIndex: number): DropEntry[] {
  return [];
}

const OREN_RB_BASE: RaidBoss[] = [
  { id: "rb_l2dop_oren_01", name: "Капітан Оренських Вартових", level: 44, hp: 195000, mp: 0, pAtk: 410, mAtk: 0, pDef: 328, mDef: 222, exp: 92000, sp: 4800, adenaMin: 36000, adenaMax: 56000, dropChance: 1, drops: orenRbDrops(0), isRaidBoss: true, respawnTime: 5 * 60 * 60, dropProfileId: "rb_l2dop_aden_drop", aiProfileId: "rb_floran_ai", zoneId: "l2dop_oren_01" },
  { id: "rb_l2dop_oren_02", name: "Володар Темного Бору", level: 46, hp: 225000, mp: 0, pAtk: 445, mAtk: 0, pDef: 352, mDef: 238, exp: 104000, sp: 5400, adenaMin: 42000, adenaMax: 65000, dropChance: 1, drops: orenRbDrops(1), isRaidBoss: true, respawnTime: 5 * 60 * 60, dropProfileId: "rb_l2dop_aden_drop", aiProfileId: "rb_floran_ai", zoneId: "l2dop_oren_02" },
  { id: "rb_l2dop_oren_03", name: "Король Моря Спор", level: 48, hp: 258000, mp: 0, pAtk: 480, mAtk: 0, pDef: 378, mDef: 256, exp: 120000, sp: 6200, adenaMin: 48000, adenaMax: 74000, dropChance: 1, drops: orenRbDrops(2), isRaidBoss: true, respawnTime: 5 * 60 * 60, dropProfileId: "rb_l2dop_aden_drop", aiProfileId: "rb_floran_ai", zoneId: "l2dop_oren_03" },
  { id: "rb_l2dop_oren_04", name: "Титан Крумських Залів", level: 50, hp: 295000, mp: 0, pAtk: 520, mAtk: 0, pDef: 408, mDef: 276, exp: 138000, sp: 7100, adenaMin: 55000, adenaMax: 85000, dropChance: 1, drops: orenRbDrops(3), isRaidBoss: true, respawnTime: 5 * 60 * 60, dropProfileId: "rb_l2dop_aden_drop", aiProfileId: "rb_floran_ai", zoneId: "l2dop_oren_04" },
  { id: "rb_l2dop_oren_05", name: "Патріарх Хреста", level: 52, hp: 335000, mp: 0, pAtk: 560, mAtk: 0, pDef: 442, mDef: 298, exp: 158000, sp: 8100, adenaMin: 62000, adenaMax: 96000, dropChance: 1, drops: orenRbDrops(4), isRaidBoss: true, respawnTime: 6 * 60 * 60, dropProfileId: "rb_l2dop_aden_drop", aiProfileId: "rb_floran_ai", zoneId: "l2dop_oren_05" },
  { id: "rb_l2dop_oren_06", name: "Громила Заборонених Пагорбів", level: 54, hp: 380000, mp: 0, pAtk: 605, mAtk: 0, pDef: 478, mDef: 322, exp: 180000, sp: 9200, adenaMin: 70000, adenaMax: 108000, dropChance: 1, drops: orenRbDrops(5), isRaidBoss: true, respawnTime: 6 * 60 * 60, dropProfileId: "rb_l2dop_aden_drop", aiProfileId: "rb_floran_ai", zoneId: "l2dop_oren_06" },
  { id: "rb_l2dop_oren_07", name: "Некромант Старого Орену", level: 56, hp: 425000, mp: 0, pAtk: 650, mAtk: 420, pDef: 455, mDef: 380, exp: 204000, sp: 10400, adenaMin: 78000, adenaMax: 120000, dropChance: 1, drops: orenRbDrops(6), isRaidBoss: true, respawnTime: 6 * 60 * 60, dropProfileId: "rb_l2dop_aden_drop", aiProfileId: "rb_floran_ai", zoneId: "l2dop_oren_07" },
  { id: "rb_l2dop_oren_08", name: "Хранитель Слонової Вежі", level: 58, hp: 475000, mp: 0, pAtk: 700, mAtk: 0, pDef: 548, mDef: 370, exp: 230000, sp: 11800, adenaMin: 88000, adenaMax: 135000, dropChance: 1, drops: orenRbDrops(7), isRaidBoss: true, respawnTime: 6 * 60 * 60, dropProfileId: "rb_l2dop_aden_drop", aiProfileId: "rb_floran_ai", zoneId: "l2dop_oren_08" },
];

const OREN_RB_EXTRA_NAMES: Record<string, string[]> = {
  "01": ["Страж Брами Орену", "Тиран Околиць", "Дракон Оренських Полів", "Вартовий Мурів", "Повелитель Стежок"],
  "02": ["Тінь Бору", "Древній Лісник", "Король Ворон", "Страж Моху", "Тиран Гілок"],
  "03": ["Володар Спор", "Гриб-Титан", "Павутинний Лорд", "Тінь Гнилизни", "Король Плісняви"],
  "04": ["Крумський Вартовий", "Титан Залів", "Страж Підземелля", "Дракон Каменю", "Повелитель Круми"],
  "05": ["Суддя Хреста", "Тиран Розбійників", "Король Шибениці", "Страж Кайданів", "Вождь Зрадників"],
  "06": ["Титан Пагорбів", "Кам'яний Гігант", "Буревій Степу", "Страж Ущелин", "Повелитель Вітрів"],
  "07": ["Лорд Некрополю", "Кістяний Король", "Тінь Могил", "Страж Руїн", "Архонт Мертвих"],
  "08": ["Маг Вежі", "Титан Слонової Кістки", "Страж Арканів", "Повелитель Таємниць", "Дракон Забуття"],
};

export function getOrenRaidBossesForZone(zoneId: string): RaidBoss[] {
  const base = OREN_RB_BASE.find((rb) => rb.zoneId === zoneId);
  if (!base) return [];
  let h = 0;
  for (let i = 0; i < zoneId.length; i++) h = (h * 31 + zoneId.charCodeAt(i)) | 0;
  const rand = () => { h = (h * 1664525 + 1013904223) | 0; return (h >>> 0) / 0xffffffff; };
  const zoneNum = zoneId.replace("l2dop_oren_", "");
  const extraNames = OREN_RB_EXTRA_NAMES[zoneNum] ?? [];
  const all: RaidBoss[] = [base, ...extraNames.map((n, i) => cloneRaidBoss(base, String.fromCharCode(98 + i), n))];
  const takeCount = 3 + Math.floor(rand() * 4);
  return [...all].sort(() => rand() - 0.5).slice(0, Math.min(takeCount, all.length));
}

export const L2DOP_OREN_RAID_BOSSES: RaidBoss[] = OREN_RB_BASE;

/* ==================== GODDARD (L2) — рівні 73–80 (кілька L2-околиць у кожній зоні) ==================== */

export function getGoddardL2DopChampions(zoneId: string, minLvl: number, maxLvl: number): Mob[] {
  const filtered = L2DOP_GODDARD_POOL.filter((m) => m.level >= minLvl && m.level <= maxLvl);
  if (filtered.length < 2) return [];
  let h = 0;
  for (let i = 0; i < zoneId.length; i++) h = (h * 31 + zoneId.charCodeAt(i)) | 0;
  const rand = () => { h = (h * 1664525 + 1013904223) | 0; return (h >>> 0) / 0xffffffff; };
  const count = 3 + Math.floor(rand() * 5);
  const shuffled = [...filtered].sort(() => rand() - 0.5);
  const names: Record<string, string> = {
    "01": "Володар Гарячих Джерел",
    "02": "Пастух Кетра",
    "03": "Валькірія Кетра",
    "04": "Пограничник Варки",
    "05": "Вождь Варки",
    "06": "Хранитель Монастиря",
    "07": "Пророк Племен",
  };
  const suffixes = ["I", "II", "III", "IV", "V", "Страж", "Титан"];
  const zoneNum = zoneId.replace("l2dop_goddard_", "");
  const baseName = names[zoneNum] ?? "Годдарт Чемпіон";
  const result: Mob[] = [];
  for (let i = 0; i < Math.min(count, shuffled.length); i++) {
    result.push(makeChampion(shuffled[i], `${baseName} ${suffixes[i % suffixes.length]}`, String.fromCharCode(97 + i)));
  }
  return result;
}

function goddardRbDrops(_rbIndex: number): DropEntry[] {
  return [];
}

const GODDARD_RB_BASE: RaidBoss[] = [
  { id: "rb_l2dop_goddard_01", name: "Гейзерний Титан", level: 76, hp: 540000, mp: 0, pAtk: 2950, mAtk: 0, pDef: 940, mDef: 640, exp: 340000, sp: 19000, adenaMin: 190000, adenaMax: 295000, dropChance: 1, drops: goddardRbDrops(0), isRaidBoss: true, respawnTime: 6 * 60 * 60, dropProfileId: "rb_l2dop_aden_drop", aiProfileId: "rb_floran_ai", zoneId: "l2dop_goddard_01" },
  { id: "rb_l2dop_goddard_02", name: "Вождь Гарячих Стежок", level: 77, hp: 580000, mp: 0, pAtk: 3100, mAtk: 0, pDef: 980, mDef: 665, exp: 365000, sp: 20500, adenaMin: 205000, adenaMax: 315000, dropChance: 1, drops: goddardRbDrops(1), isRaidBoss: true, respawnTime: 6 * 60 * 60, dropProfileId: "rb_l2dop_aden_drop", aiProfileId: "rb_floran_ai", zoneId: "l2dop_goddard_02" },
  { id: "rb_l2dop_goddard_03", name: "Король Кетра", level: 78, hp: 620000, mp: 0, pAtk: 3250, mAtk: 0, pDef: 1020, mDef: 690, exp: 395000, sp: 22200, adenaMin: 220000, adenaMax: 340000, dropChance: 1, drops: goddardRbDrops(2), isRaidBoss: true, respawnTime: 6 * 60 * 60, dropProfileId: "rb_l2dop_aden_drop", aiProfileId: "rb_floran_ai", zoneId: "l2dop_goddard_03" },
  { id: "rb_l2dop_goddard_04", name: "Титан Племен", level: 79, hp: 670000, mp: 0, pAtk: 3420, mAtk: 0, pDef: 1065, mDef: 720, exp: 425000, sp: 24000, adenaMin: 238000, adenaMax: 368000, dropChance: 1, drops: goddardRbDrops(3), isRaidBoss: true, respawnTime: 6 * 60 * 60, dropProfileId: "rb_l2dop_aden_drop", aiProfileId: "rb_floran_ai", zoneId: "l2dop_goddard_04" },
  { id: "rb_l2dop_goddard_05", name: "Верховний Варка", level: 80, hp: 720000, mp: 0, pAtk: 3600, mAtk: 0, pDef: 1110, mDef: 755, exp: 460000, sp: 26000, adenaMin: 255000, adenaMax: 395000, dropChance: 1, drops: goddardRbDrops(4), isRaidBoss: true, respawnTime: 6 * 60 * 60, dropProfileId: "rb_l2dop_aden_drop", aiProfileId: "rb_floran_ai", zoneId: "l2dop_goddard_05" },
  { id: "rb_l2dop_goddard_06", name: "Архієрей Соліни", level: 80, hp: 760000, mp: 0, pAtk: 3550, mAtk: 1200, pDef: 1080, mDef: 820, exp: 480000, sp: 27500, adenaMin: 268000, adenaMax: 415000, dropChance: 1, drops: goddardRbDrops(5), isRaidBoss: true, respawnTime: 6 * 60 * 60, dropProfileId: "rb_l2dop_aden_drop", aiProfileId: "rb_floran_ai", zoneId: "l2dop_goddard_06" },
  { id: "rb_l2dop_goddard_07", name: "Спадкоємець Пророка", level: 81, hp: 800000, mp: 0, pAtk: 3750, mAtk: 0, pDef: 1140, mDef: 780, exp: 510000, sp: 29200, adenaMin: 285000, adenaMax: 440000, dropChance: 1, drops: goddardRbDrops(6), isRaidBoss: true, respawnTime: 7 * 60 * 60, dropProfileId: "rb_l2dop_aden_drop", aiProfileId: "rb_floran_ai", zoneId: "l2dop_goddard_07" },
];

const GODDARD_RB_EXTRA_NAMES: Record<string, string[]> = {
  "01": ["Страж Джерел", "Титан Пари", "Лорд Гейзерів", "Хранитель Води", "Повелитель Пари"],
  "02": ["Вартовий Стежок", "Пастух Буйволів", "Тиран Кетра", "Король Стежок", "Дракон Пари"],
  "03": ["Тиран Кетра", "Страж Племені", "Вождь Шаманів", "Повелитель Кетра", "Дракон Орків"],
  "04": ["Король Кетра і Варки", "Страж Кордону", "Титан Війни", "Архонт Поля", "Повелитель Битви"],
  "05": ["Король Варки", "Тиран Сілєносів", "Страж Варки", "Дракон Степу", "Пророк Варки"],
  "06": ["Брат Соліни", "Тінь Монастиря", "Крусадер Темряви", "Хранитель Реліквій", "Пастир Мертвих"],
  "07": ["Вершинний Титан", "Лорд Племен", "Страж Вершини", "Король Пророцтва", "Тиран Годдарта"],
};

export function getGoddardRaidBossesForZone(zoneId: string): RaidBoss[] {
  const base = GODDARD_RB_BASE.find((rb) => rb.zoneId === zoneId);
  if (!base) return [];
  let h = 0;
  for (let i = 0; i < zoneId.length; i++) h = (h * 31 + zoneId.charCodeAt(i)) | 0;
  const rand = () => { h = (h * 1664525 + 1013904223) | 0; return (h >>> 0) / 0xffffffff; };
  const zoneNum = zoneId.replace("l2dop_goddard_", "");
  const extraNames = GODDARD_RB_EXTRA_NAMES[zoneNum] ?? [];
  const all: RaidBoss[] = [base, ...extraNames.map((n, i) => cloneRaidBoss(base, String.fromCharCode(98 + i), n))];
  const takeCount = 3 + Math.floor(rand() * 4);
  return [...all].sort(() => rand() - 0.5).slice(0, Math.min(takeCount, all.length));
}

export const L2DOP_GODDARD_RAID_BOSSES: RaidBoss[] = GODDARD_RB_BASE;

/* ==================== SCHUTTGART (Gracia XML 22107–22227) — рівні 74–87 ==================== */

const SCHUTTGART_CHAMP_SUFFIXES = [
  "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV",
];

/** 14 чемпіонів на зону (циклічно з пулу рівнів зони); суфікси id унікальні */
export function getSchuttgartL2DopChampions(zoneId: string, minLvl: number, maxLvl: number): Mob[] {
  const filtered = L2DOP_SCHUTTGART_POOL.filter((m) => m.level >= minLvl && m.level <= maxLvl);
  if (filtered.length === 0) return [];
  let h = 0;
  for (let i = 0; i < zoneId.length; i++) h = (h * 31 + zoneId.charCodeAt(i)) | 0;
  const rand = () => { h = (h * 1664525 + 1013904223) | 0; return (h >>> 0) / 0xffffffff; };
  const shuffled = [...filtered].sort(() => rand() - 0.5);
  const names: Record<string, string> = {
    "01": "Stakato Vanguard",
    "02": "Frozen March Warden",
    "03": "Spike Hollow Lord",
    "04": "Cannibal Broodmaster",
    "05": "Monastery Exile",
    "06": "Solina Aspirant",
    "07": "Temple Confessor",
    "08": "Triol Intercessor",
    "09": "Grail Crypt Keeper",
    "10": "Primordial Hunt Leader",
    "11": "Tyrant Ridge Overlord",
  };
  const zoneNum = zoneId.replace("l2dop_schuttgart_", "");
  const baseName = names[zoneNum] ?? "Schuttgart Elite";
  const result: Mob[] = [];
  const CHAMP_COUNT = 14;
  for (let i = 0; i < CHAMP_COUNT; i++) {
    const base = shuffled[i % shuffled.length]!;
    const suf = SCHUTTGART_CHAMP_SUFFIXES[i] ?? `#${i + 1}`;
    result.push(makeChampion(base, `${baseName} ${suf}`, `sch${i}`));
  }
  return result;
}

function schuttgartRbDrops(_rbIndex: number): DropEntry[] {
  return [];
}

const SCHUTTGART_RB_BASE: RaidBoss[] = [
  { id: "rb_l2dop_schuttgart_01", name: "Lord of the Stakato Vanguard", level: 76, hp: 640000, mp: 0, pAtk: 3180, mAtk: 0, pDef: 980, mDef: 665, exp: 520000, sp: 30000, adenaMin: 300000, adenaMax: 460000, dropChance: 1, drops: schuttgartRbDrops(0), isRaidBoss: true, respawnTime: 6 * 60 * 60, dropProfileId: "rb_l2dop_aden_drop", aiProfileId: "rb_floran_ai", zoneId: "l2dop_schuttgart_01" },
  { id: "rb_l2dop_schuttgart_02", name: "Warden of the Ice March", level: 77, hp: 685000, mp: 0, pAtk: 3320, mAtk: 0, pDef: 1010, mDef: 685, exp: 555000, sp: 31800, adenaMin: 318000, adenaMax: 488000, dropChance: 1, drops: schuttgartRbDrops(1), isRaidBoss: true, respawnTime: 6 * 60 * 60, dropProfileId: "rb_l2dop_aden_drop", aiProfileId: "rb_floran_ai", zoneId: "l2dop_schuttgart_02" },
  { id: "rb_l2dop_schuttgart_03", name: "Spike Hollow Tyrant", level: 78, hp: 730000, mp: 0, pAtk: 3460, mAtk: 0, pDef: 1040, mDef: 705, exp: 590000, sp: 33600, adenaMin: 335000, adenaMax: 515000, dropChance: 1, drops: schuttgartRbDrops(2), isRaidBoss: true, respawnTime: 6 * 60 * 60, dropProfileId: "rb_l2dop_aden_drop", aiProfileId: "rb_floran_ai", zoneId: "l2dop_schuttgart_03" },
  { id: "rb_l2dop_schuttgart_04", name: "Broodmother of the Cannibals", level: 79, hp: 775000, mp: 0, pAtk: 3600, mAtk: 0, pDef: 1070, mDef: 725, exp: 625000, sp: 35400, adenaMin: 352000, adenaMax: 542000, dropChance: 1, drops: schuttgartRbDrops(3), isRaidBoss: true, respawnTime: 6 * 60 * 60, dropProfileId: "rb_l2dop_aden_drop", aiProfileId: "rb_floran_ai", zoneId: "l2dop_schuttgart_04" },
  { id: "rb_l2dop_schuttgart_05", name: "Fallen Pilgrim King", level: 80, hp: 820000, mp: 0, pAtk: 3740, mAtk: 1100, pDef: 1100, mDef: 780, exp: 660000, sp: 37200, adenaMin: 370000, adenaMax: 570000, dropChance: 1, drops: schuttgartRbDrops(4), isRaidBoss: true, respawnTime: 7 * 60 * 60, dropProfileId: "rb_l2dop_aden_drop", aiProfileId: "rb_floran_ai", zoneId: "l2dop_schuttgart_05" },
  { id: "rb_l2dop_schuttgart_06", name: "Archon of Solina's Gate", level: 81, hp: 865000, mp: 0, pAtk: 3880, mAtk: 0, pDef: 1130, mDef: 765, exp: 695000, sp: 39000, adenaMin: 388000, adenaMax: 598000, dropChance: 1, drops: schuttgartRbDrops(5), isRaidBoss: true, respawnTime: 7 * 60 * 60, dropProfileId: "rb_l2dop_aden_drop", aiProfileId: "rb_floran_ai", zoneId: "l2dop_schuttgart_06" },
  { id: "rb_l2dop_schuttgart_07", name: "High Confessor of Einhasad", level: 82, hp: 910000, mp: 0, pAtk: 4020, mAtk: 1250, pDef: 1160, mDef: 820, exp: 730000, sp: 40800, adenaMin: 405000, adenaMax: 625000, dropChance: 1, drops: schuttgartRbDrops(6), isRaidBoss: true, respawnTime: 7 * 60 * 60, dropProfileId: "rb_l2dop_aden_drop", aiProfileId: "rb_floran_ai", zoneId: "l2dop_schuttgart_07" },
  { id: "rb_l2dop_schuttgart_08", name: "Triol's Voice", level: 83, hp: 955000, mp: 0, pAtk: 4160, mAtk: 1300, pDef: 1190, mDef: 840, exp: 768000, sp: 42800, adenaMin: 425000, adenaMax: 655000, dropChance: 1, drops: schuttgartRbDrops(7), isRaidBoss: true, respawnTime: 7 * 60 * 60, dropProfileId: "rb_l2dop_aden_drop", aiProfileId: "rb_floran_ai", zoneId: "l2dop_schuttgart_08" },
  { id: "rb_l2dop_schuttgart_09", name: "Keeper of the False Grail", level: 84, hp: 1000000, mp: 0, pAtk: 4300, mAtk: 0, pDef: 1220, mDef: 825, exp: 805000, sp: 44800, adenaMin: 445000, adenaMax: 685000, dropChance: 1, drops: schuttgartRbDrops(8), isRaidBoss: true, respawnTime: 7 * 60 * 60, dropProfileId: "rb_l2dop_aden_drop", aiProfileId: "rb_floran_ai", zoneId: "l2dop_schuttgart_09" },
  { id: "rb_l2dop_schuttgart_10", name: "Alpha of the Ancient Herd", level: 85, hp: 1045000, mp: 0, pAtk: 4440, mAtk: 0, pDef: 1250, mDef: 845, exp: 845000, sp: 47000, adenaMin: 465000, adenaMax: 715000, dropChance: 1, drops: schuttgartRbDrops(9), isRaidBoss: true, respawnTime: 8 * 60 * 60, dropProfileId: "rb_l2dop_aden_drop", aiProfileId: "rb_floran_ai", zoneId: "l2dop_schuttgart_10" },
  { id: "rb_l2dop_schuttgart_11", name: "Tyrant of Schuttgart Ridge", level: 87, hp: 1120000, mp: 0, pAtk: 4720, mAtk: 0, pDef: 1310, mDef: 885, exp: 920000, sp: 51000, adenaMin: 500000, adenaMax: 770000, dropChance: 1, drops: schuttgartRbDrops(10), isRaidBoss: true, respawnTime: 8 * 60 * 60, dropProfileId: "rb_l2dop_aden_drop", aiProfileId: "rb_floran_ai", zoneId: "l2dop_schuttgart_11" },
];

const SCHUTTGART_RB_EXTRA_NAMES: Record<string, string[]> = {
  "01": ["Stakato Broodqueen", "Spike Warden", "Frozen Scout Alpha", "Vanguard Crusher", "Outer Perimeter Lord"],
  "02": ["Blizzard Howler", "Icefang Patriarch", "March Overseer", "Frostline Tyrant", "Wasteland Crown"],
  "03": ["Needleback Sovereign", "Hollow Stalker", "Spinefield Reaper", "Barbed Matriarch", "Rustfang King"],
  "04": ["Gorefeast Patriarch", "Broodcaller", "Fleshrend Titan", "Cannibal Oracle", "Bloodline Tyrant"],
  "05": ["Exiled Crusader", "Broken Oath Knight", "Penance Revenant", "Ashcloak Warden", "Fallen Bellkeeper"],
  "06": ["Solina's Wrath", "Lay Brother Horror", "Silent Choir Master", "Monastery Revenant", "Candlelit Terror"],
  "07": ["Temple Inquisitor", "Confessor Supreme", "Altar Warden", "Relic Devourer", "Sanctum Breaker"],
  "08": ["Triol's Hand", "Offering Collector", "Ritual Archon", "Bell of Ruin", "False Prophet"],
  "09": ["Grail Shade", "Crypt Sovereign", "Bone Reliquary", "Martyred King", "Seal Breaker"],
  "10": ["Strider Prime", "Pachycephalos Crown", "Elroki Matriarch", "Herdfather", "Plain Devourer"],
  "11": ["Pterosaur Alpha", "Rex of the Ridge", "Sky Tyrant", "Apex Predator", "Schuttgart Crown"],
};

/** 4–6 РБ на зону (рандомно за zoneId) */
export function getSchuttgartRaidBossesForZone(zoneId: string): RaidBoss[] {
  const base = SCHUTTGART_RB_BASE.find((rb) => rb.zoneId === zoneId);
  if (!base) return [];
  let h = 0;
  for (let i = 0; i < zoneId.length; i++) h = (h * 31 + zoneId.charCodeAt(i)) | 0;
  const rand = () => { h = (h * 1664525 + 1013904223) | 0; return (h >>> 0) / 0xffffffff; };
  const zoneNum = zoneId.replace("l2dop_schuttgart_", "");
  const extraNames = SCHUTTGART_RB_EXTRA_NAMES[zoneNum] ?? [];
  const all: RaidBoss[] = [base, ...extraNames.map((n, i) => cloneRaidBoss(base, String.fromCharCode(98 + i), n))];
  const takeCount = 4 + Math.floor(rand() * 3);
  return [...all].sort(() => rand() - 0.5).slice(0, Math.min(takeCount, all.length));
}

export const L2DOP_SCHUTTGART_RAID_BOSSES: RaidBoss[] = SCHUTTGART_RB_BASE;
