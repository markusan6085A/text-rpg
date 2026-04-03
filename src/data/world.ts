// src/data/world.ts
import type { City, Zone, WorldCity } from "./world/types";
import { L2DOP_CITIES, L2DOP_ZONES } from "./world/l2dop";
import { augmentAllZonesWithPatrolMobs } from "./world/augmentPatrolMobs";

export const cities: City[] = L2DOP_CITIES;
export const locations: Zone[] = augmentAllZonesWithPatrolMobs(L2DOP_ZONES);

/** Місто за замовчуванням для нового персонажа та fallback у City/GK, якщо немає currentCityId. */
export const DEFAULT_PLAYER_CITY_ID = "l2dop_gludio";

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

/** Мітка зони для логів адмінки (місто — локація) */
export function getZoneActivityLabel(zoneId: string | undefined): string | undefined {
  if (!zoneId || typeof zoneId !== "string") return undefined;
  const zone = getLocationById(zoneId);
  if (!zone) {
    if (zoneId === "fishing") return "Рибалка";
    return zoneId;
  }
  const city = getCityById(zone.cityId);
  if (city) return `${city.name} — ${zone.name}`;
  return zone.name;
}
