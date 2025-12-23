// src/screens/GK.tsx
import React from "react";
import {
  cities as WORLD_CITIES,
  locations as WORLD_LOCATIONS,
} from "../data/world";
import type { Zone } from "../data/world/types";
import { useHeroStore } from "../state/heroStore";

type Navigate = (path: string) => void;

// Маппінг міст до іконок (за ID міста)
const CITY_ICONS: Record<string, string> = {
  // Додайте тут міста та їх іконки
  // Приклад: "floran": "/assets/floran.png",
  // "gludin": "/assets/gludin.png",
};

// Маппінг міст до іконок (за назвою міста)
const CITY_ICONS_BY_NAME: Record<string, string> = {
  "Talking Island Village": "/assets/gk.jpg",
};

function useQuery() {
  return React.useMemo(() => new URLSearchParams(location.search), []);
}

function getZonesByCity(cityId: string): Zone[] {
  return WORLD_LOCATIONS.filter((z) => z.cityId === cityId);
}

export default function GKScreen({ navigate }: { navigate: Navigate }) {
  const hero = useHeroStore((s) => s.hero);
  const q = useQuery();

  const defaultCityId =
    q.get("city") ||
    WORLD_CITIES.find((c) => c.id === "floran")?.id ||
    WORLD_CITIES[0].id;

  const [selectedCityId, setSelectedCityId] = React.useState(defaultCityId);

  const selectedCity =
    WORLD_CITIES.find((c) => c.id === selectedCityId) || WORLD_CITIES[0];

  const zones = getZonesByCity(selectedCity.id);

  const handleCityChange = (cityId: string) => {
    setSelectedCityId(cityId);
    const params = new URLSearchParams(location.search);
    params.set("city", cityId);
    history.replaceState(null, "", `/gk?${params.toString()}`);
  };

  const goToZone = (zoneId: string) => {
    navigate(`/location?id=${zoneId}`);
  };

  const adena = hero?.adena || 0;

  return (
    <div className="w-full text-[#f4e2b8] px-1 py-2">
        {/* Статус */}
        <div className="text-[#b8860b] mb-3 text-xs border-b border-dotted border-[#5a4424] pb-2">
          Вы в городе {selectedCity.name}.
        </div>
        <div className="text-[#b8860b] mb-3 text-xs border-b border-dotted border-[#5a4424] pb-2 flex items-center gap-2">
          У вас {adena.toLocaleString("ru-RU")} адены
          <img src="/assets/adena.png" alt="Adena" className="w-3 h-3 object-contain" />
        </div>

        {/* Города */}
        <div className="mb-4">
          <div className="text-[#b8860b] mb-2 text-xs">Города:</div>
          <div className="space-y-1">
            {WORLD_CITIES.map((city) => {
              const iconPath = CITY_ICONS[city.id] || CITY_ICONS_BY_NAME[city.name] || "/assets/travel.png";
              return (
                <div
                  key={city.id}
                  className="flex items-center gap-2 text-[#b8860b] text-xs cursor-pointer hover:text-[#daa520] border-b border-dotted border-[#5a4424] py-1"
                  onClick={() => handleCityChange(city.id)}
                >
                  <img src={iconPath} alt={city.name} className="w-3 h-3 object-contain" />
                  <span>{city.name}</span>
                  <span className="ml-auto flex items-center gap-1 text-[#b8860b]">
                    0
                    <img src="/assets/adena.png" alt="Adena" className="w-3 h-3 object-contain" />
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Розділювач */}
        <div className="border-t border-[#5a4424] my-3"></div>

        {/* Локации */}
        <div className="mb-4">
          <div className="text-[#b8860b] mb-2 text-xs">Локации:</div>
          <div className="space-y-1">
            {zones.length === 0 ? (
              <div className="text-[#b8860b]/60 text-xs">
                Для цього міста поки що немає зон.
              </div>
            ) : (
              zones.map((zone) => (
                <div
                  key={zone.id}
                  className="flex items-center gap-2 text-[#b8860b] text-xs cursor-pointer hover:text-[#daa520] border-b border-dotted border-[#5a4424] py-1"
                  onClick={() => goToZone(zone.id)}
                >
                  <img src="/assets/travel.png" alt={zone.name} className="w-3 h-3 object-contain" />
                  <span>{zone.name}:</span>
                  <span className="text-red-500">
                    {zone.minLevel}-{zone.maxLevel}
                  </span>
                  <span className="ml-auto flex items-center gap-1 text-[#b8860b]">
                    {zone.tpCost.toLocaleString("ru-RU")}
                    <img src="/assets/adena.png" alt="Adena" className="w-3 h-3 object-contain" />
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
    </div>
  );
}
