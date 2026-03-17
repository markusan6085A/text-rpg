// src/data/world.ts
import type { City, Zone, WorldCity } from "./world/types";
import { FLORAN_CITY, FLORAN_ZONES } from "./world/floran";
import { GLUDIN_CITY, GLUDIN_ZONES } from "./world/gludin";
import { GLUDIO_CITY, GLUDIO_ZONES } from "./world/gludio";
import { USE_L2DOP_WORLD } from "./world/config";
import { L2DOP_CITIES, L2DOP_ZONES } from "./world/l2dop";

const baseCities: City[] = [FLORAN_CITY, GLUDIN_CITY, GLUDIO_CITY];
const baseLocations: Zone[] = [...FLORAN_ZONES, ...GLUDIN_ZONES, ...GLUDIO_ZONES];

export const cities: City[] = USE_L2DOP_WORLD ? [...baseCities, ...L2DOP_CITIES] : baseCities;
export const locations: Zone[] = USE_L2DOP_WORLD ? [...baseLocations, ...L2DOP_ZONES] : baseLocations;

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
