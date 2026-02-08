import React, { useState, useEffect, useMemo } from "react";
import { getOnlinePlayers, type OnlinePlayer } from "../utils/api";
import { useHeroStore, getRateLimitRemainingMs } from "../state/heroStore";
import { PlayerNameWithEmblem } from "../components/PlayerNameWithEmblem";

interface OnlinePlayersProps {
  navigate: (path: string) => void;
}

type SortType = "level" | "name";

export default function OnlinePlayers({ navigate }: OnlinePlayersProps) {
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

  return (
    <div className="w-full flex items-start justify-center">
      <div className="w-full max-w-md mt-5 mb-10 px-3">
        <div className="border-b border-black/70 px-4 py-2 text-center text-[11px] text-[#87ceeb] tracking-[0.12em] uppercase">
          Онлайн игроки
        </div>

        <div className="px-4 py-3 border-b border-black/70 text-[12px] text-[#645b45]">
          <div className="text-yellow-400 text-center mb-3">
            Сортировать по:{" "}
            <button
              onClick={() => setSortBy("level")}
              className={`hover:underline transition-colors ${
                sortBy === "level" ? "text-white font-bold" : ""
              }`}
            >
              уровню
            </button>
            {" | "}
            <button
              onClick={() => setSortBy("name")}
              className={`hover:underline transition-colors ${
                sortBy === "name" ? "text-white font-bold" : ""
              }`}
            >
              нику
            </button>
          </div>

          {loading ? (
            <div className="text-center text-gray-400 text-sm py-4">Загрузка...</div>
          ) : error ? (
            <div className="text-center text-red-400 text-sm py-4">{error}</div>
          ) : players.length === 0 ? (
            <div className="text-center text-gray-400 text-sm py-4">
              Нет игроков в онлайне
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-gray-400 pb-1 border-b border-black/60">
                <span>Ник</span>
                <span>Мощь</span>
              </div>
              {sortedPlayers.map((player) => (
                <div 
                  key={player.id} 
                  className="flex items-center justify-between text-[12px] py-1 border-b border-solid border-black/60 cursor-pointer hover:bg-gray-800/30 transition-colors"
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
                    <span className="text-gray-500">{player.level} ур.</span>
                    <span className="text-gray-500">в {player.location}</span>
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
