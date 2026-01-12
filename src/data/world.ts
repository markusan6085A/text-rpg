// src/data/world.ts
import type { City, Zone, WorldCity } from "./world/types";
import type { DropEntry } from "./combat/types";

import { FLORAN_CITY, FLORAN_ZONES } from "./world/floran";
import { DION_CITY, DION_ZONES } from "./world/dion";

import { GLUDIN_CITY, GLUDIN_ZONES } from "./world/gludin";
import { GLUDIO_CITY, GLUDIO_ZONES } from "./world/gludio";
import { GIRAN_CITY, GIRAN_ZONES } from "./world/giran";
import { HEINE_CITY, HEINE_ZONES } from "./world/heine";
import { HUNTERS_CITY, HUNTERS_ZONES } from "./world/hunters";
import { ADEN_CITY, ADEN_ZONES } from "./world/aden";
import { OREN_CITY, OREN_ZONES } from "./world/oren";
import { RUNE_CITY, RUNE_ZONES } from "./world/rune";
import { GODDARD_CITY, GODDARD_ZONES } from "./world/goddard";
import { SCHUTTGART_CITY, SCHUTTGART_ZONES } from "./world/schuttgart";
import type { Mob } from "./world/types";

// ===== МІСТА =====

// Місто для риболовлі
const FISHING_CITY: City = {
  id: "fishing",
  name: "Риболовля",
  tpCost: 0,
};

// Риби для риболовлі (4 види з дублікатами)
// Функція для створення дублікатів риб
function createFishCopies(baseMob: Omit<Mob, "id">, count: number, baseId: string): Mob[] {
  const copies: Mob[] = [];
  for (let i = 0; i < count; i++) {
    copies.push({
      ...baseMob,
      id: `${baseId}_${i}`,
    });
  }
  return copies;
}

// Базові шаблони риб
const FISHING_MOBS: Mob[] = [
  // Тунець - 20 шт, дроп 1-3
  ...createFishCopies(
    {
      name: "Тунець",
      level: 1,
      icon: "/items/drops/resources/Etc_tuna_i06_0.jpg",
      hp: 100,
      mp: 0,
      pAtk: 0,
      mAtk: 0,
      pDef: 0,
      mDef: 0,
      exp: 0,
      adenaMin: 0,
      adenaMax: 0,
      dropChance: 1.0,
      drops: [
        { id: "fish_tuna", kind: "resource", chance: 1.0, min: 1, max: 3 },
      ],
    },
    20,
    "fish_tuna"
  ),
  // Морська риба - 20 шт, дроп 1-5
  ...createFishCopies(
    {
      name: "Морська риба",
      level: 2,
      icon: "/items/drops/resources/Etc_fish_seawater_i01_0.jpg",
      hp: 150,
      mp: 0,
      pAtk: 0,
      mAtk: 0,
      pDef: 0,
      mDef: 0,
      exp: 0,
      adenaMin: 0,
      adenaMax: 0,
      dropChance: 1.0,
      drops: [
        { id: "fish_seawater", kind: "resource", chance: 1.0, min: 1, max: 5 },
      ],
    },
    20,
    "fish_seawater"
  ),
  // Лящ - 20 шт, дроп 1-7
  ...createFishCopies(
    {
      name: "Лящ",
      level: 3,
      icon: "/items/drops/resources/Etc_bream_i04_0.jpg",
      hp: 200,
      mp: 0,
      pAtk: 0,
      mAtk: 0,
      pDef: 0,
      mDef: 0,
      exp: 0,
      adenaMin: 0,
      adenaMax: 0,
      dropChance: 1.0,
      drops: [
        { id: "fish_bream", kind: "resource", chance: 1.0, min: 1, max: 7 },
      ],
    },
    20,
    "fish_bream"
  ),
  // Морський чорт - 30 шт, дроп 1-10
  ...createFishCopies(
    {
      name: "Морський чорт",
      level: 4,
      icon: "/items/drops/resources/Etc_angler_i03_0.jpg",
      hp: 250,
      mp: 0,
      pAtk: 0,
      mAtk: 0,
      pDef: 0,
      mDef: 0,
      exp: 0,
      adenaMin: 0,
      adenaMax: 0,
      dropChance: 1.0,
      drops: [
        { id: "fish_angler", kind: "resource", chance: 1.0, min: 1, max: 10 },
      ],
    },
    30,
    "fish_angler"
  ),
];

// Зона риболовлі
const FISHING_ZONE: Zone = {
  id: "fishing",
  name: "Риболовля",
  cityId: "fishing",
  minLevel: 1,
  maxLevel: 100,
  tpCost: 0,
  mobs: FISHING_MOBS,
};

export const cities: City[] = [
  FLORAN_CITY,
  GLUDIN_CITY,
  GLUDIO_CITY,
  DION_CITY,
  GIRAN_CITY,
  HEINE_CITY,
  HUNTERS_CITY,
  ADEN_CITY,
  OREN_CITY,
  RUNE_CITY,
  GODDARD_CITY,
  SCHUTTGART_CITY,
  FISHING_CITY,
];

// ===== ЛОКАЦІЇ (окрестности, без мобів у цьому файлі не зберігаємо) =====

export const locations: Zone[] = [
  ...FLORAN_ZONES,
  ...GLUDIN_ZONES,
  ...GLUDIO_ZONES,
  ...DION_ZONES,
  ...GIRAN_ZONES,
  ...HEINE_ZONES,
  ...HUNTERS_ZONES,
  ...ADEN_ZONES,
  ...OREN_ZONES,
  ...RUNE_ZONES,
  ...GODDARD_ZONES,
  ...SCHUTTGART_ZONES,
  FISHING_ZONE,
];

// ===== WORLD ДЛЯ ЗРУЧНОСТІ (місто + його зони) =====

export const WORLD: WorldCity[] = cities.map((city) => ({
  ...city, // розгортаємо id, name, tpCost
  zones: locations.filter((z) => z.cityId === city.id),
}));

export function getCityById(id: string): City | undefined {
  return cities.find((c) => c.id === id);
}

export function getLocationsByCityId(cityId: string): Zone[] {
  return locations.filter((loc) => loc.cityId === cityId);
}

export function getLocationById(id: string): Zone | undefined {
  return locations.find((loc) => loc.id === id);
}
