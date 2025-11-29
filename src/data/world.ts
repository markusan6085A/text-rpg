// src/data/world.ts
import type { City, Zone, WorldCity } from "./world/types";

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

// ===== МІСТА =====

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
