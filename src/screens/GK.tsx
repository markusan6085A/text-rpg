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
        {/* BACKUP: Картинка gk - прибрано
        <div className="flex justify-center mb-2">
          <img src="/gk.jpg" alt="gk" className="h-auto w-[70%] max-h-20" />
        </div>
        */}
        
        {/* Статус */}
        <div className="text-gray-400 mb-3 text-xs border-b border-dotted border-gray-500 pb-2">
          Вы в городе <span className="text-[#ff8c00]">{selectedCity.name}</span>.
        </div>
        
        {/* Кнопка Квести та кв-шоп */}
        <div className="mb-3 flex items-center gap-2 border-b border-dotted border-gray-500 pb-1.5">
          <button
            className="flex-1 text-left text-[12px] py-1.5 hover:opacity-80 flex items-center gap-2"
            onClick={() => navigate("/quests")}
            style={{ color: "#ffd700", textShadow: "0 0 8px rgba(255, 215, 0, 0.5)" }}
          >
            <img src="/assets/quest.png" alt="Квести" className="w-3 h-3 object-contain" />
            <span className="font-semibold">Квести</span>
          </button>
          <button
            className="text-[13px] text-[#ff8c00] py-1.5 hover:text-[#ffa500] px-2 flex items-center gap-1"
            onClick={() => navigate("/quest-shop")}
          >
            <img src="/icons/col.png" alt="кв-шоп" className="w-3 h-3 object-contain" />
            <span>кв-шоп</span>
          </button>
        </div>
        
        
        <div className="text-gray-400 mb-3 text-xs border-b border-dotted border-gray-500 pb-2 flex items-center gap-2">
          У вас <span className="text-[#ffd700]">{adena.toLocaleString("ru-RU")}</span> адены
          <img src="/assets/adena.png" alt="Adena" className="w-3 h-3 object-contain" />
        </div>

        {/* Города */}
        <div className="mb-4">
          <div className="text-gray-400 mb-2 text-xs">Города:</div>
          <div className="space-y-1">
            {WORLD_CITIES.map((city) => {
              const iconPath = CITY_ICONS[city.id] || CITY_ICONS_BY_NAME[city.name] || "/assets/travel.png";
              return (
                <div
                  key={city.id}
                  className="flex items-center gap-2 text-[#b8860b] text-xs cursor-pointer hover:text-[#daa520] border-b border-dotted border-gray-500 py-1"
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
        <div className="border-t border-gray-500 my-3"></div>

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
                  className="flex items-center gap-2 text-[#b8860b] text-xs cursor-pointer hover:text-[#daa520] border-b border-dotted border-gray-500 py-1"
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
