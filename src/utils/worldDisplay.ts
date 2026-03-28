import { locations } from "../data/world";
import { CITY_LABELS, ZONE_LABELS, ZONE_LORE } from "../data/world/locale/worldLabels";
import { localizeMobDisplayName } from "../data/world/locale/mobLocale";
import { getGameSettings, type Language } from "../state/gameSettings";

export function getUiLang(): Language {
  return getGameSettings().language ?? "ru";
}

export function displayCityName(city: { id: string; name: string }): string {
  const row = CITY_LABELS[city.id];
  if (!row) return city.name;
  return getUiLang() === "uk" ? row.uk : row.ru;
}

export function displayZoneName(zone: { id: string; name: string }): string {
  const row = ZONE_LABELS[zone.id];
  if (!row) return zone.name;
  return getUiLang() === "uk" ? row.uk : row.ru;
}

/** Текст «про місце» для екрана локації; якщо немає — порожній рядок. */
export function displayZoneLore(zoneId: string): string {
  const row = ZONE_LORE[zoneId];
  if (!row) return "";
  return getUiLang() === "uk" ? row.uk : row.ru;
}

/** Ім'я моба для списків, бою, логів (канонічне поле name в даних не змінювати). */
export function displayMobName(canonicalName: string): string {
  return localizeMobDisplayName(canonicalName, getUiLang());
}

/**
 * Рядок location з heroJson (канонічна назва зони) → підпис обраною мовою.
 * Якщо зона невідома — пробуємо як ім'я моба/довільний рядок.
 */
export function displayStoredLocationName(stored: string | undefined | null): string {
  const s = String(stored ?? "").trim();
  if (!s) return "";
  const z = locations.find((l) => l.name === s);
  if (z) return displayZoneName(z);
  return displayMobName(s);
}
