// src/state/heroFactory.ts
import { itemsDB, itemsDBWithStarter, starterKitDefault } from "../data/items/itemsDB";
import type { Hero } from "../types/Hero";
import { recalculateAllStats } from "../utils/stats/recalculateAllStats";
import { getDefaultProfessionForKlass } from "../data/skills";

export type GenderRu = "Мужчина" | "Женщина" | string;

export interface HeroBaseStats {
  STR: number;
  DEX: number;
  CON: number;
  INT: number;
  WIT: number;
  MEN: number;
}

// Базові стати для рас/класів (згідно з Lineage 2)
const baseStatsTable: Record<string, HeroBaseStats> = {
  // Воины (Fighters)
  "Человек:Воин": { STR: 40, DEX: 30, CON: 43, INT: 21, WIT: 11, MEN: 25 },
  "Эльф:Воин":    { STR: 36, DEX: 35, CON: 36, INT: 23, WIT: 14, MEN: 26 },
  "Темный Эльф:Воин": { STR: 41, DEX: 34, CON: 32, INT: 25, WIT: 12, MEN: 26 },
  "Орк:Воин":     { STR: 40, DEX: 26, CON: 47, INT: 18, WIT: 12, MEN: 27 },
  "Гном:Воин":    { STR: 39, DEX: 29, CON: 45, INT: 20, WIT: 10, MEN: 27 },

  // Мистики (Mystics)
  "Человек:Маг":  { STR: 22, DEX: 21, CON: 27, INT: 41, WIT: 20, MEN: 39 },
  "Эльф:Маг":     { STR: 21, DEX: 24, CON: 25, INT: 37, WIT: 23, MEN: 40 },
  "Темный Эльф:Маг":  { STR: 23, DEX: 23, CON: 24, INT: 44, WIT: 19, MEN: 37 },
  "Орк:Маг":      { STR: 27, DEX: 24, CON: 31, INT: 31, WIT: 15, MEN: 42 },
};

const defaultBaseStats: HeroBaseStats = {
  STR: 10,
  DEX: 10,
  CON: 10,
  INT: 10,
  WIT: 10,
  MEN: 10,
};

export function getBaseStatsFor(race: string, klass: string): HeroBaseStats {
  // Маппінг англійських назв на російські
  const raceMap: Record<string, string> = {
    "Human": "Человек",
    "Elf": "Эльф",
    "Dark Elf": "Темный Эльф",
    "Dwarf": "Гном",
    "Orc": "Орк",
  };
  
  const klassMap: Record<string, string> = {
    "Fighter": "Воин",
    "Mystic": "Маг",
  };
  
  const normalizedRace = raceMap[race] || race;
  let normalizedKlass = klassMap[klass] || klass;
  
  // Спеціальна обробка для Гнома
  if (normalizedRace === "Гном" && normalizedKlass === "Маг") {
    normalizedKlass = "Воин";
  }

  const key = `${normalizedRace}:${normalizedKlass}`;
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

// HeroCore залишається для сумісності, але createNewHero тепер повертає Hero
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

export function calcDerivedFromBase(
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



export function createNewHero(params: NewHeroParams): HeroCore & { sp: number; skills: any[]; battleStats: any } {
  const level = 1;
  const baseStats = getBaseStatsFor(params.race, params.klass);
  const derived = calcDerivedFromBase(baseStats, level);

  // Розділяємо предмети на ті, що екіпуються, і ті, що йдуть в інвентар
  const equipment: Record<string, string | null> = {};
  const inventory: HeroInventoryItem[] = [];

  // Маппінг класів (як в getBaseStatsFor)
  const klassMap: Record<string, string> = {
    "Fighter": "Воин",
    "Mystic": "Маг",
  };
  const normalizedKlass = klassMap[params.klass] || params.klass;
  const isMage = normalizedKlass === "Маг";

  // Вибираємо правильний набір предметів
  const starterItems = isMage ? starterKitDefault.itemsMage : starterKitDefault.itemsFighter;

  starterItems.forEach((itemId) => {

    const def = itemsDBWithStarter[itemId] || itemsDB[itemId];
    if (!def) {
      console.warn(`Item not found in itemsDB: ${itemId}`);
      return;
    }

    const count = starterKitDefault.quantities[itemId] ?? 1;
    const slot = def.slot || mapKindToSlot(def.kind);

    // Предмети, які можна екіпірувати, одразу екіпуються
    const equippableSlots = ["weapon", "shield", "head", "armor", "legs", "gloves", "boots", "belt", "cloak", "necklace", "earring", "ring", "tattoo"];
    if (equippableSlots.includes(slot) && !equipment[slot]) {
      equipment[slot] = itemId;
    } else {
      // Інші предмети йдуть в інвентар
      inventory.push({
        id: def.id,
        name: def.name,
        type: def.kind,
        slot: slot,
        icon: def.icon,
        description: def.description,
        stats: def.stats,
        count,
      } as HeroInventoryItem);
    }
  });

  const id = params.id ?? `hero_${Date.now()}`;

  // Встановлюємо базову професію на основі раси та класу
  const defaultProfession = getDefaultProfessionForKlass(params.klass, params.race) || "human_fighter";

  const heroCore: HeroCore = {
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

    equipment: equipment,
    buffs: [],

    adena: starterKitDefault.adena,
    coinOfLuck: 0,
    inventory,
  };
  
  // Додаємо поля для Hero, включаючи profession та baseStatsInitial
  return {
    ...heroCore,
    profession: defaultProfession,
    baseStatsInitial: { ...baseStats }, // Зберігаємо оригінальні базові стати
    sp: 0,
    skills: [],
    battleStats: {} as any,
  } as any;

  // Конвертуємо HeroCore в Hero з обчисленими статами
  const recalculated = recalculateAllStats(heroCore);
  
  return {
    ...heroCore,
    sp: 0,
    skills: [],
    battleStats: recalculated.finalStats,
  } as any; // Тимчасово any для сумісності
}
