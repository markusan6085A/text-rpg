// src/screens/Location.tsx
import React from "react";
import {
  locations as WORLD_LOCATIONS,
  cities as WORLD_CITIES,
} from "../data/world";
import type { City, Zone, Mob } from "../data/world/types";
import { useHeroStore } from "../state/heroStore";

type Navigate = (path: string) => void;

function useQuery() {
  return React.useMemo(() => new URLSearchParams(location.search), []);
}

function findZoneById(zoneId: string): { zone: Zone; city: City } | undefined {
  const zone = WORLD_LOCATIONS.find((z) => z.id === zoneId);
  if (!zone) return undefined;
  const city = WORLD_CITIES.find((c) => c.id === zone.cityId);
  if (!city) return undefined;
  return { zone, city };
}

export default function LocationScreen({ navigate }: { navigate: Navigate }) {
  const q = useQuery();
  const hero = useHeroStore((s) => s.hero);

  // Підтримуємо і ?id=, і ?zone= на всяк випадок
  const zoneId = q.get("id") || q.get("zone") || "";

  const found = zoneId ? findZoneById(zoneId) : undefined;

  const [page, setPage] = React.useState(() => {
    const p = Number(q.get("page") || "1");
    return Number.isFinite(p) && p > 0 ? p : 1;
  });

  if (!found) {
    return (
      <div className="w-full text-[#b8860b] flex items-center justify-center px-1 py-4">
        <div className="w-full text-center space-y-3">
          <div className="text-xs font-semibold">Зона не знайдена.</div>
          <button
            className="h-8 px-4 rounded-md bg-[#2a2a2a] ring-1 ring-white/10 text-xs text-[#b8860b]"
            onClick={() => navigate("/gk")}
          >
            Телепорт
          </button>
        </div>
      </div>
    );
  }

  const { zone, city } = found;

  // ===== пагінація по мобах (15 на сторінку) =====
  const pageSize = 15;
  const totalMobs = zone.mobs.length;
  const totalPages = Math.max(1, Math.ceil(totalMobs / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const visibleMobs: Mob[] = zone.mobs.slice(
    startIndex,
    startIndex + pageSize,
  );

  const goPage = (p: number) => {
    const safe = Math.min(Math.max(1, p), totalPages);
    setPage(safe);
    const params = new URLSearchParams(location.search);
    params.set("id", zone.id);
    params.set("page", String(safe));
    history.replaceState(null, "", `/location?${params.toString()}`);
  };

  const handleBackToCity = () => {
    navigate(`/city?id=${city.id}`);
  };

  const openBattle = (mobIndexInZone: number) => {
    navigate(`/battle?zone=${zone.id}&idx=${mobIndexInZone}`);
  };

  return (
    <div className="w-full text-[#b8860b] px-1 py-2">
        {/* Заголовок */}
        <div className="text-[#b8860b] mb-2 text-xs">Забрать награду</div>
        <div className="text-[#b8860b] mb-4 text-base font-semibold flex items-center gap-2">
          <img src="/assets/travel.png" alt={zone.name} className="w-3 h-3 object-contain" />
          <span>{zone.name}</span>
        </div>

        {/* Список мобів */}
        <div className="space-y-0">
          {visibleMobs.length === 0 && (
            <div className="text-[#b8860b]/60 text-xs py-4">
              У цій локації поки немає мобів.
            </div>
          )}

          {visibleMobs.map((mob, i) => {
            const globalIndex = startIndex + i;
            const isChampion = mob.name.startsWith("[Champion]");
            const isRaid = (mob as any).isRaidBoss === true;
            const heroLevel = hero?.level || 1;
            const levelDiff = Math.abs(heroLevel - mob.level);
            const isLevelDiffTooHigh = levelDiff > 10;

            return (
              <div
                key={globalIndex}
                className={`flex items-center gap-2 py-1 border-b border-dotted border-[#5a4424] cursor-pointer hover:text-[#daa520] text-xs ${
                  isLevelDiffTooHigh ? "text-red-500" : "text-[#b8860b]"
                }`}
                onClick={() => openBattle(globalIndex)}
              >
                <span className="text-green-500">(і)</span>
                <span
                  className={
                    isRaid
                      ? "text-[#ff6666]"
                      : isChampion
                      ? "text-[#ffd966]"
                      : isLevelDiffTooHigh
                      ? "text-red-500"
                      : "text-[#b8860b]"
                  }
                >
                  {mob.name}
                </span>
                <span className="text-red-500">[{mob.level}]</span>
                <span className="text-red-500">({mob.hp}/{mob.hp})</span>
              </div>
            );
          })}
        </div>

        {/* Пагінація */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4 text-[#b8860b] text-xs">
            <button
              className="disabled:opacity-40"
              disabled={currentPage <= 1}
              onClick={() => goPage(currentPage - 1)}
            >
              &lt;&lt;&lt;
            </button>
            <span>|</span>
            <button
              className="disabled:opacity-40"
              disabled={currentPage >= totalPages}
              onClick={() => goPage(currentPage + 1)}
            >
              &gt;&gt;&gt;
            </button>
          </div>
        )}
    </div>
  );
}
