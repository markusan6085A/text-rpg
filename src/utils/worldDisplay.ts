import { getCityById, getLocationById, locations } from "../data/world";
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
 * Рядок location з heroJson (id зони або канонічна назва) → підпис обраною мовою.
 * Якщо зона невідома в даних — повертаємо сирий рядок (не через displayMobName: там «king»→«король»
 * ламає, наприклад, «Talking Island»).
 */
export function displayStoredLocationName(stored: string | undefined | null): string {
  const s = String(stored ?? "").trim();
  if (!s) return "";
  const byId = getLocationById(s);
  if (byId) return displayZoneName(byId);
  const z = locations.find((l) => l.name === s);
  if (z) return displayZoneName(z);
  return s;
}

/**
 * Локація для публічного профілю: зона за id (якщо збережено), інакше рядок location з heroJson.
 */
export function formatPublicProfileLocation(
  heroJson: unknown,
  heroTopLocation?: string | null | undefined
): string {
  const hj =
    heroJson && typeof heroJson === "object" ? (heroJson as Record<string, unknown>) : {};
  const idRaw = hj.zoneId ?? hj.lastZoneId ?? hj.currentZoneId;
  const id = idRaw != null ? String(idRaw).trim() : "";
  if (id) {
    const zone = getLocationById(id);
    if (zone) {
      const city = getCityById(zone.cityId);
      const zLabel = displayZoneName(zone);
      if (city) return `${displayCityName(city)} — ${zLabel}`;
      return zLabel;
    }
  }
  const raw = String(hj.location ?? hj.currentLocation ?? hj.zone ?? heroTopLocation ?? "").trim();
  if (!raw) return "";
  return displayStoredLocationName(raw);
}
