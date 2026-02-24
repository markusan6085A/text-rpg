import React from "react";
import type { City, Zone } from "../../data/world/types";
import { cities as WORLD_CITIES, locations as WORLD_LOCATIONS } from "../../data/world";

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
