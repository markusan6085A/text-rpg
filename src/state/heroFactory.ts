// src/state/heroFactory.ts
import { itemsDB, starterKitDefault } from "../data/items/itemsDB";

export type GenderRu = "Мужчина" | "Женщина" | string;

export interface HeroBaseStats {
  STR: number;
  DEX: number;
  CON: number;
  INT: number;
  WIT: number;
  MEN: number;
}

// Базові стати для рас/класів
const baseStatsTable: Record<string, HeroBaseStats> = {
  "Человек:Воин": { STR: 12, DEX: 11, CON: 11, INT: 6,  WIT: 7,  MEN: 8 },
  "Человек:Маг":  { STR: 7,  DEX: 9,  CON: 9,  INT: 12, WIT: 11, MEN: 11 },

  "Эльф:Воин":    { STR: 11, DEX: 12, CON: 10, INT: 7,  WIT: 8,  MEN: 9 },
  "Эльф:Маг":     { STR: 6,  DEX: 10, CON: 10, INT: 13, WIT: 12, MEN: 12 },

  "Темный Эльф:Воин": { STR: 13, DEX: 12, CON: 9,  INT: 8,  WIT: 8,  MEN: 8 },
  "Темный Эльф:Маг":  { STR: 7,  DEX: 11, CON: 8,  INT: 14, WIT: 12, MEN: 11 },

  "Орк:Воин":     { STR: 14, DEX: 10, CON: 13, INT: 5,  WIT: 6,  MEN: 7 },
  "Орк:Маг":      { STR: 10, DEX: 9,  CON: 12, INT: 8,  WIT: 7,  MEN: 10 },

  "Гном:Воин":    { STR: 13, DEX: 10, CON: 12, INT: 6,  WIT: 7,  MEN: 8 },
};

const defaultBaseStats: HeroBaseStats = {
  STR: 10,
  DEX: 10,
  CON: 10,
  INT: 10,
  WIT: 10,
  MEN: 10,
};

function getBaseStatsFor(race: string, klass: string): HeroBaseStats {
  const normalizedKlass =
    race === "Гном" && klass === "Маг" ? "Воин" : klass;

  const key = `${race}:${normalizedKlass}`;
  return baseStatsTable[key] ?? defaultBaseStats;
}

export interface HeroInventoryItem {
  id: string;
  name: string;
  type: string;
  slot: string;   // ✅ ДОДАНО
  icon: string;
  description: string;
  stats?: any;
  count?: number;
}

export interface HeroCore {
  id: string;
  name: string;
  username?: string;

  race: string;
  klass: string;
  gender: GenderRu;

  level: number;
  exp: number;

  baseStats: HeroBaseStats;

  hp: number;
  mp: number;
  maxHp: number;
  maxMp: number;
  cp: number;
  maxCp: number;

  equipment: Record<string, string | null>;
  buffs: unknown[];

  adena: number;
  coinOfLuck: number;
  inventory: HeroInventoryItem[];
}

function calcDerivedFromBase(
  base: HeroBaseStats,
  level: number
) {
  const lvl = Math.max(1, level);

  const conBonus = 1 + (base.CON - 10) * 0.03;
  const menBonus = 1 + (base.MEN - 10) * 0.03;

  const baseHp = 220 + lvl * 28;
  const baseMp = 120 + lvl * 16;

  const maxHp = Math.round(baseHp * conBonus);
  const maxMp = Math.round(baseMp * menBonus);
  const maxCp = Math.round(maxHp * 0.6);

  return {
    hp: maxHp,
    maxHp,
    mp: maxMp,
    maxMp,
    cp: maxCp,
    maxCp,
  };
}

export interface NewHeroParams {
  id?: string;
  name: string;
  race: string;
  klass: string;
  gender: GenderRu;
  username?: string;
}

// ✅ ЄДИНА НОВА ФУНКЦІЯ
function mapKindToSlot(kind: string): string {
  switch (kind) {
    case "weapon": return "weapon";
    case "helmet": return "head";
    case "armor": return "armor";
    case "gloves": return "gloves";
    case "boots": return "boots";
    case "shield": return "shield";
    case "necklace": return "necklace";
    case "earring": return "earring";
    case "ring": return "ring";
    case "jewelry": return "jewelry";
    case "tattoo": return "tattoo";
    case "belt": return "belt";
    case "cloak": return "cloak";
    case "resource": return "resource";
    case "consumable": return "consumable";
    case "recipe": return "recipe";
    case "book": return "book";
    case "quest": return "quest";
    default: return "all";
  }
}



export function createNewHero(params: NewHeroParams): HeroCore {
  const level = 1;
  const baseStats = getBaseStatsFor(params.race, params.klass);
  const derived = calcDerivedFromBase(baseStats, level);

  const inventory: HeroInventoryItem[] = starterKitDefault.items
    .map((itemId) => {
      const def = itemsDB[itemId];
      if (!def) return null;

      const count = starterKitDefault.quantities[itemId] ?? 1;

      return {
        id: def.id,
        name: def.name,
        type: def.kind,
        slot: mapKindToSlot(def.kind), // ✅ ДОДАНО
        icon: def.icon,
        description: def.description,
        stats: def.stats,
        count,
      } as HeroInventoryItem;
    })
    .filter(Boolean) as HeroInventoryItem[];

  const id = params.id ?? `hero_${Date.now()}`;

  return {
    id,
    name: params.name,
    username: params.username ?? params.name,

    race: params.race,
    klass: params.klass,
    gender: params.gender,

    level,
    exp: 0,

    baseStats,
    ...derived,

    equipment: {},
    buffs: [],

    adena: starterKitDefault.adena,
    coinOfLuck: 0,
    inventory,
  };
}
