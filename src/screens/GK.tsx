// src/screens/GK.tsx
import React from "react";
import {
  cities as WORLD_CITIES,
  locations as WORLD_LOCATIONS,
} from "../data/world";
import type { Zone } from "../data/world/types";
import { useHeroStore } from "../state/heroStore";
import { savePreviousLocation, clearPreviousLocation } from "../utils/locationNavigation";

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
    // 🔥 Скрол вгору при навігації - завжди показуємо верх сторінки з барами
    window.scrollTo(0, 0);
    // 🔥 Очищаємо попередню локацію при виході з міста через телепорт
    clearPreviousLocation();
    navigate(`/location?id=${zoneId}`);
  };

  const adena = hero?.adena || 0;

  return (
    <div className="w-full text-[#f4e2b8] px-1 pt-0 pb-2">
        {/* Банер телепорту під самий банер (StatusBars) */}
        <div className="flex justify-center mb-2 -mt-1">
          <img src="/icons/teleport.jpg" alt="Телепорт" className="w-[85%] max-w-[280px] h-auto object-contain rounded" />
        </div>
        
        {/* Статус */}
        <div className="text-gray-400 mb-3 text-xs border-b border-solid border-[#654321] pb-2">
          Вы в городе <span className="text-[#ff8c00]">{selectedCity.name}</span>.
        </div>
        
        {/* Кнопка Квести та кв-шоп */}
        <div className="mb-3 flex items-center gap-2 border-b border-solid border-[#654321] pb-1.5">
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
        
        
        <div className="text-gray-400 mb-3 text-xs border-b border-solid border-[#654321] pb-2 flex items-center gap-2">
          У вас <span className="text-[#ffd700]">{adena.toLocaleString("ru-RU")}</span> адены
          <img src="/assets/adena.png" alt="Adena" className="w-3 h-3 object-contain" />
        </div>

        {/* Города */}
        <div className="mb-3">
          <div className="text-[#c7ad80] mb-1 text-xs">Города:</div>
          <div className="space-y-0.5">
            {WORLD_CITIES.map((city) => {
              const iconPath = CITY_ICONS[city.id] || CITY_ICONS_BY_NAME[city.name] || "/icons/castle.png";
              return (
                <div
                  key={city.id}
                  className="flex items-center gap-2 text-[#c7ad80] text-xs cursor-pointer hover:text-[#f4e2b8] py-0.5"
                  onClick={() => handleCityChange(city.id)}
                >
                  <img src={iconPath} alt={city.name} className="w-3 h-3 object-contain" />
                  <span>{city.name}</span>
                  <span className="ml-auto flex items-center gap-1 text-[#c7ad80]">
                    0
                    <img src="/assets/adena.png" alt="Adena" className="w-3 h-3 object-contain" />
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Локации */}
        <div className="mb-3">
          <div className="text-[#c7ad80] mb-1 text-xs">Локации:</div>
          <div className="space-y-0.5">
            {zones.length === 0 ? (
              <div className="text-[#c7ad80]/60 text-xs">
                Для цього міста поки що немає зон.
              </div>
            ) : (
              zones.map((zone) => (
                <div
                  key={zone.id}
                  className="flex items-center gap-2 text-[#c7ad80] text-xs cursor-pointer hover:text-[#f4e2b8] py-0.5"
                  onClick={() => goToZone(zone.id)}
                >
                  <img src="/assets/travel.png" alt={zone.name} className="w-3 h-3 object-contain" />
                  <span>{zone.name}:</span>
                  <span className="text-red-500">
                    {zone.minLevel}-{zone.maxLevel}
                  </span>
                  <span className="ml-auto flex items-center gap-1 text-[#c7ad80]">
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
