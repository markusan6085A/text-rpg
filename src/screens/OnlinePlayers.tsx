import React, { useState, useEffect, useMemo } from "react";
import { getOnlinePlayers, type OnlinePlayer } from "../utils/api";
import { useHeroStore, getRateLimitRemainingMs } from "../state/heroStore";
import { PlayerNameWithEmblem } from "../components/PlayerNameWithEmblem";
import { getCityUiVariant } from "../utils/cityUiVariant";
import { displayStoredLocationName } from "../utils/worldDisplay";
import { useGameSettingsVersion } from "../hooks/useGameSettingsVersion";

interface OnlinePlayersProps {
  navigate: (path: string) => void;
}

type SortType = "level" | "name";

export default function OnlinePlayers({ navigate }: OnlinePlayersProps) {
  useGameSettingsVersion();
  const hero = useHeroStore((s) => s.hero);
  const [players, setPlayers] = useState<OnlinePlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortType>("level");

  // 🔥 КРИТИЧНО: Використовуємо useCallback для стабілізації функції
  const loadOnlinePlayers = React.useCallback(async () => {
    if (getRateLimitRemainingMs() > 0) return;
    setLoading(true);
    setError(null);
    
    try {
      const data = await getOnlinePlayers();
      setPlayers(data.players || []);
      setLoading(false);
    } catch (err: any) {
      setError(err?.message || "Помилка завантаження гравців");
      setLoading(false);
    }
  }, []); // Порожній масив - функція стабільна

  useEffect(() => {
    // 🔥 Правильний патерн React: cleanup тільки в return, не перед створенням
    loadOnlinePlayers();
    // Оновлюємо список кожні 60 с (було 30), менше запитів = менше 429
    const interval = setInterval(loadOnlinePlayers, 60000);
    return () => clearInterval(interval);
  }, [loadOnlinePlayers]); // 🔥 Мінімальні dependencies - тільки стабільна функція

  // Сортування гравців
  const sortedPlayers = useMemo(() => {
    const sorted = [...players];
    if (sortBy === "level") {
      // По уровню: від більшого до меншого
      sorted.sort((a, b) => (b.level || 0) - (a.level || 0));
    } else if (sortBy === "name") {
      // По нику: по алфавіту (від A до Z)
      sorted.sort((a, b) => {
        const nameA = (a.name || "").toLowerCase();
        const nameB = (b.name || "").toLowerCase();
        return nameA.localeCompare(nameB);
      });
    }
    return sorted;
  }, [players, sortBy]);

  const isL2 = getCityUiVariant() === "l2";
  const l2Frame =
    "rounded-xl overflow-hidden border border-[#c7ad80]/35 shadow-[0_0_0_1px_rgba(0,0,0,0.85),0_16px_48px_rgba(0,0,0,0.65)] bg-[radial-gradient(ellipse_100%_50%_at_50%_-8%,rgba(120,90,45,0.28)_0%,transparent_50%),linear-gradient(180deg,#1c1812_0%,#0c0a08_100%)]";
  const innerPanel = isL2
    ? "w-full max-w-[420px] mx-auto rounded-xl border border-[#5c4a32]/75 bg-black/25 shadow-[inset_0_1px_0_rgba(199,173,128,0.08)] overflow-hidden"
    : "";

  return (
    <div
      className={
        isL2
          ? `${l2Frame} w-full min-w-0 my-1 px-3 py-4 text-[#d4c4a8] flex items-start justify-center`
          : "w-full flex items-start justify-center"
      }
    >
      <div className={isL2 ? `${innerPanel} mt-0 mb-6` : "w-full max-w-md mt-5 mb-10 px-3"}>
        <div
          className={
            isL2
              ? "border-b border-[#5c4a32]/45 px-4 py-2 text-center text-[11px] text-[#e8c56e] tracking-[0.12em] uppercase"
              : "border-b border-black/70 px-4 py-2 text-center text-[11px] text-[#87ceeb] tracking-[0.12em] uppercase"
          }
        >
          Онлайн игроки
        </div>

        <div
          className={
            isL2
              ? "px-4 py-3 border-b border-[#5c4a32]/35 text-[12px] text-[#d4c4a8]"
              : "px-4 py-3 border-b border-black/70 text-[12px] text-[#645b45]"
          }
        >
          <div
            className={
              isL2 ? "text-[#c9a44c] text-center mb-3" : "text-yellow-400 text-center mb-3"
            }
          >
            Сортировать по:{" "}
            <button
              onClick={() => setSortBy("level")}
              className={`hover:underline transition-colors ${
                sortBy === "level"
                  ? isL2
                    ? "text-[#e8dcc8] font-bold"
                    : "text-white font-bold"
                  : ""
              }`}
            >
              уровню
            </button>
            {" | "}
            <button
              onClick={() => setSortBy("name")}
              className={`hover:underline transition-colors ${
                sortBy === "name"
                  ? isL2
                    ? "text-[#e8dcc8] font-bold"
                    : "text-white font-bold"
                  : ""
              }`}
            >
              нику
            </button>
          </div>

          {loading ? (
            <div
              className={
                isL2
                  ? "text-center text-[#8a7a60] text-sm py-4"
                  : "text-center text-gray-400 text-sm py-4"
              }
            >
              Загрузка...
            </div>
          ) : error ? (
            <div className="text-center text-red-400 text-sm py-4">{error}</div>
          ) : players.length === 0 ? (
            <div
              className={
                isL2
                  ? "text-center text-[#8a7a60] text-sm py-4"
                  : "text-center text-gray-400 text-sm py-4"
              }
            >
              Нет игроков в онлайне
            </div>
          ) : (
            <div className="space-y-1">
              <div
                className={
                  isL2
                    ? "flex items-center justify-between text-[11px] text-[#8a7a60] pb-1 border-b border-[#5c4a32]/40"
                    : "flex items-center justify-between text-[11px] text-gray-400 pb-1 border-b border-black/60"
                }
              >
                <span>Ник</span>
                <span>Мощь</span>
              </div>
              {sortedPlayers.map((player) => (
                <div
                  key={player.id}
                  className={
                    isL2
                      ? "flex items-center justify-between text-[12px] py-1 border-b border-[#5c4a32]/35 cursor-pointer hover:bg-black/25 transition-colors"
                      : "flex items-center justify-between text-[12px] py-1 border-b border-solid border-black/60 cursor-pointer hover:bg-gray-800/30 transition-colors"
                  }
                  onClick={() => navigate(`/player/${player.id}`)}
                >
                  <div className="flex items-center gap-2">
                    <PlayerNameWithEmblem
                      playerName={player.name}
                      hero={hero}
                      clan={player.emblem ? { emblem: player.emblem } as any : null}
                      nickColor={player.nickColor}
                      size={12}
                      className="font-semibold hover:opacity-80 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/player/${player.id}`);
                      }}
                    />
                    <span className={isL2 ? "text-[#8a7a60]" : "text-gray-500"}>{player.level} ур.</span>
                    <span className={isL2 ? "text-[#8a7a60]" : "text-gray-500"}>
                      в {displayStoredLocationName(player.location)}
                    </span>
                  </div>
                  {player.power && (
                    <span className="text-yellow-400">{player.power}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
