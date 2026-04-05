import React from "react";
import type { City, Zone } from "../../data/world/types";
import { cities as WORLD_CITIES, locations as WORLD_LOCATIONS } from "../../data/world";
import { getGameSettings } from "../../state/gameSettings";

  export function useBattleQuery() {
  // Використовуємо стан для відстеження змін URL
  const [search, setSearch] = React.useState(() => location.search);
  
  React.useEffect(() => {
    // Оновлюємо при зміні URL через navigate()
    const checkUrl = () => {
      const currentSearch = location.search;
      // We don't read `search` directly to avoid infinite loops when we depend on it
      setSearch((prevSearch) => {
        if (currentSearch !== prevSearch) {
          return currentSearch;
        }
        return prevSearch;
      });
    };
    
    // Перевіряємо зміни URL кожні 50мс
    const interval = setInterval(checkUrl, 50);
    
    // Також слухаємо події навігації
    const handlePopState = () => {
      checkUrl();
    };
    window.addEventListener('popstate', handlePopState);
    
    // Слухаємо події pushState (якщо navigate() використовує pushState)
    const originalPushState = window.history.pushState;
    window.history.pushState = function(...args) {
      originalPushState.apply(window.history, args);
      setTimeout(checkUrl, 0);
    };
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('popstate', handlePopState);
      window.history.pushState = originalPushState;
    };
  }, []); // Remove `search` from deps
  
  return React.useMemo(() => new URLSearchParams(search), [search]);
}

export function findZoneWithCity(zoneId: string): { zone: Zone; city: City } | undefined {
  const zone = WORLD_LOCATIONS.find((z) => z.id === zoneId);
  if (!zone) return undefined;
  const city = WORLD_CITIES.find((c) => c.id === zone.cityId);
  if (!city) return undefined;
  return { zone, city };
}

/**
 * Шлях до екрана окрестности з тією ж сторінкою списку мобів, що й глобальний індекс моба в зоні
 * (щоб після «Продовжити» не кидало на початок списку).
 */
/**
 * Тексти з гілок помилки в startBattle. Усе інше в log[0] під idle+без моба — бойові рядки
 * (під час async pve-battle-start), не показувати модалку «Помилка».
 */
export function isBattleEntryErrorMessage(msg: string | null | undefined): boolean {
  const m = String(msg ?? "").trim();
  if (!m) return false;
  return (
    m.startsWith("Cannot start:") ||
    m.includes("Увійдіть в акаунт") ||
    m.includes("ще не респавнувся") ||
    m.includes("Hero not found") ||
    m.includes("потрібна удочка") ||
    m.includes("потрібна наживка") ||
    m.includes("Удочкою можна бити тільки рибу") ||
    m.includes("Сервер не дозволив почати бій")
  );
}

export function locationPathForZoneMob(zoneId: string, mobIndexInZone: number): string {
  const found = findZoneWithCity(zoneId);
  if (!found) return `/location?id=${encodeURIComponent(zoneId)}`;
  const pageSize = getGameSettings().mobsPerPage ?? 15;
  const totalPages = Math.max(1, Math.ceil(found.zone.mobs.length / pageSize));
  const safeIdx = Math.max(0, mobIndexInZone);
  const rawPage = Math.floor(safeIdx / pageSize) + 1;
  const page = Math.min(Math.max(1, rawPage), totalPages);
  return `/location?id=${encodeURIComponent(found.zone.id)}&page=${page}`;
}
