// src/screens/Location.tsx
import React from "react";
import {
  locations as WORLD_LOCATIONS,
  cities as WORLD_CITIES,
} from "../data/world";
import type { City, Zone, Mob } from "../data/world/types";

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

  // Підтримуємо і ?id=, і ?zone= на всяк випадок
  const zoneId = q.get("id") || q.get("zone") || "";

  const found = zoneId ? findZoneById(zoneId) : undefined;

  const [page, setPage] = React.useState(() => {
    const p = Number(q.get("page") || "1");
    return Number.isFinite(p) && p > 0 ? p : 1;
  });

  if (!found) {
    return (
      <div className="min-h-dvh w-full bg-black text-neutral-100 flex items-center justify-center p-4">
        <div className="max-w-[440px] text-center space-y-3">
          <div className="text-[14px] font-semibold">Зона не знайдена.</div>
          <button
            className="h-10 px-4 rounded-md bg-[#2a2a2a] ring-1 ring-white/10 text-[13px]"
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
    <div className="min-h-dvh w-full bg-black text-neutral-100 flex justify-center p-2">
      <div className="w-full max-w-[440px]">
        {/* Шапка як у miru.mobi new_okrestnosti */}
        <div className="rounded-t-[10px] bg-gradient-to-b from-[#2b2315] to-[#43331e] px-3 py-2 text-[13px]">
          <div className="font-semibold text-center">Wap LineAge</div>
          <div className="mt-1 text-[12px]">
            Локація: <span className="font-semibold">{zone.name}</span>{" "}
            <span className="text-neutral-400">
              ({zone.minLevel}–{zone.maxLevel} ур.)
            </span>
          </div>
          <div className="text-[11px] text-neutral-400">
            Місто: {city.name} • Телепорт: {zone.tpCost.toLocaleString("uk-UA")}{" "}
            аден
          </div>
        </div>

        <div className="rounded-b-[10px] bg-[#181818] ring-1 ring-[#5a4429]/80 overflow-hidden">
          {/* список мобів */}
          <div className="p-3 space-y-2">
            {visibleMobs.length === 0 && (
              <div className="text-center text-[12px] text-neutral-400">
                У цій локації поки немає мобів.
              </div>
            )}

            {visibleMobs.map((mob, i) => {
              const globalIndex = startIndex + i;
              const isChampion = mob.name.startsWith("[Champion]");
              const isRaid = (mob as any).isRaidBoss === true;

              return (
                <div
                  key={globalIndex}
                  className="flex items-center justify-between rounded-[8px] bg-[#101010] px-2 py-1.5 border border-white/5"
                >
                  <div className="flex-1 pr-2">
                    <div className="text-[12px]">
                      {/* назва моба і лвл як на другому скріні */}
                      <span
                        className={
                          isRaid
                            ? "text-[#ff6666] font-semibold"
                            : isChampion
                            ? "text-[#ffd966]"
                            : ""
                        }
                      >
                        {mob.name}
                      </span>{" "}
                      <span className="text-neutral-400">
                        [{mob.level}]
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-500">
                      HP: {mob.hp} • EXP: {(mob as any).exp ?? 0}
                    </div>
                  </div>
                  <button
                    onClick={() => openBattle(globalIndex)}
                    className="h-7 px-3 rounded-md bg-[#2a2a2a] text-[11px] ring-1 ring-white/10"
                  >
                    Бій
                  </button>
                </div>
              );
            })}
          </div>

          {/* пагінація */}
          {totalPages > 1 && (
            <div className="border-t border-white/10 bg-[#151515] px-3 py-2 flex items-center justify-between text-[11px] text-neutral-300">
              <button
                className="px-2 py-1 rounded bg-[#2a2a2a] ring-1 ring-white/10 disabled:opacity-40"
                disabled={currentPage <= 1}
                onClick={() => goPage(currentPage - 1)}
              >
                ← Назад
              </button>
              <div>
                Сторінка {currentPage} / {totalPages}
              </div>
              <button
                className="px-2 py-1 rounded bg-[#2a2a2a] ring-1 ring-white/10 disabled:opacity-40"
                disabled={currentPage >= totalPages}
                onClick={() => goPage(currentPage + 1)}
              >
                Далі →
              </button>
            </div>
          )}

          {/* нижні кнопки як у miru: Окрестности / Город */}
          <div className="border-t border-white/10 bg-[#151515] px-3 py-2 grid grid-cols-2 gap-2 text-[12px]">
            <button
              onClick={() => navigate("/gk")}
              className="h-9 rounded-md bg-[#2a2a2a] ring-1 ring-white/10"
            >
              Окрестности
            </button>
            <button
              onClick={handleBackToCity}
              className="h-9 rounded-md bg-[#2a2a2a] ring-1 ring-white/10"
            >
              Город
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
