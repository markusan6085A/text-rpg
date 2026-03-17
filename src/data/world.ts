// src/data/world.ts
import type { City, Zone, WorldCity } from "./world/types";

// ===== СВІТ ОЧИЩЕНО: міста, околиці та моби видалені — з нуля будемо писати =====
export const cities: City[] = [];
export const locations: Zone[] = [];

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
