// src/data/world.ts
import type { City, Zone, WorldCity } from "./world/types";
import { L2DOP_CITIES, L2DOP_ZONES } from "./world/l2dop";
import { augmentAllZonesWithPatrolMobs } from "./world/augmentPatrolMobs";

export const cities: City[] = L2DOP_CITIES;
export const locations: Zone[] = augmentAllZonesWithPatrolMobs(L2DOP_ZONES);

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
