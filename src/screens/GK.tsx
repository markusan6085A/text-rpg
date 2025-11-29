// src/screens/GK.tsx
import React from "react";
import {
  cities as WORLD_CITIES,
  locations as WORLD_LOCATIONS,
} from "../data/world";
import type { Zone } from "../data/world/types";

type Navigate = (path: string) => void;

function useQuery() {
  return React.useMemo(() => new URLSearchParams(location.search), []);
}

function getZonesByCity(cityId: string): Zone[] {
  return WORLD_LOCATIONS.filter((z) => z.cityId === cityId);
}

export default function GKScreen({ navigate }: { navigate: Navigate }) {
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
    // ГОЛОВНЕ: завжди ведемо на /location?id=...
    navigate(`/location?id=${zoneId}`);
  };

  return (
    <div className="min-h-dvh w-full bg-black text-neutral-100 flex justify-center p-2">
      <div className="w-full max-w-[440px]">
        {/* Шапка */}
        <div className="rounded-t-[10px] bg-gradient-to-b from-[#2b2315] to-[#43331e] px-3 py-2 text-[13px]">
          <div className="font-semibold text-center">Телепорт</div>
          <div className="mt-1 text-[12px] text-neutral-300">
            Виберіть місто, потім окрестность.
          </div>
        </div>

        <div className="rounded-b-[10px] bg-[#181818] ring-1 ring-[#5a4429]/80 overflow-hidden">
          {/* Города */}
          <div className="p-3 border-b border-white/10">
            <div className="text-[11px] text-neutral-400 mb-1">Города</div>
            <div className="flex flex-wrap gap-1">
              {WORLD_CITIES.map((city) => (
                <button
                  key={city.id}
                  onClick={() => handleCityChange(city.id)}
                  className={`px-2 py-1 rounded-md text-[11px] border ${
                    city.id === selectedCity.id
                      ? "bg-[#4a3721] border-[#e0b15a]"
                      : "bg-[#2a2a2a] border-white/10"
                  }`}
                >
                  {city.name}
                </button>
              ))}
            </div>
          </div>

          {/* Окрестности вибраного міста */}
          <div className="p-3 space-y-2">
            <div className="text-[11px] text-neutral-400 mb-1">
              Окрестности міста {selectedCity.name}
            </div>

            {zones.length === 0 && (
              <div className="text-[12px] text-neutral-500">
                Для цього міста поки що немає зон.
              </div>
            )}

            {zones.map((zone) => (
              <div
                key={zone.id}
                className="flex items-center justify-between rounded-[8px] bg-[#101010] px-2 py-1.5 border border-white/5"
              >
                <div className="flex-1 pr-2">
                  <div className="text-[12px]">
                    {zone.name}{" "}
                    <span className="text-neutral-400">
                      ({zone.minLevel}–{zone.maxLevel} ур.)
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    Вартість телепорту:{" "}
                    {zone.tpCost.toLocaleString("uk-UA")} аден
                  </div>
                </div>

                <button
                  onClick={() => goToZone(zone.id)}
                  className="h-7 px-3 rounded-md bg-[#2a2a2a] text-[11px] ring-1 ring-white/10"
                >
                  Телепорт
                </button>
              </div>
            ))}
          </div>

          {/* Низ */}
          <div className="border-t border-white/10 bg-[#151515] px-3 py-2">
            <button
              onClick={() => navigate(`/city?id=${selectedCity.id}`)}
              className="w-full h-9 rounded-md bg-[#2a2a2a] ring-1 ring-white/10 text-[12px]"
            >
              Назад в город
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
