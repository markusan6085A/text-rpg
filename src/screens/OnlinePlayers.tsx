import React, { useState, useEffect } from "react";
import { getOnlinePlayers, type OnlinePlayer } from "../utils/api";
import { useHeroStore } from "../state/heroStore";
import { PlayerNameWithEmblem } from "../components/PlayerNameWithEmblem";

interface OnlinePlayersProps {
  navigate: (path: string) => void;
}

export default function OnlinePlayers({ navigate }: OnlinePlayersProps) {
  const hero = useHeroStore((s) => s.hero);
  const [players, setPlayers] = useState<OnlinePlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOnlinePlayers();
    // Оновлюємо список кожні 30 секунд
    const interval = setInterval(loadOnlinePlayers, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadOnlinePlayers = async () => {
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
  };

  return (
    <div className="w-full flex items-start justify-center">
      <div className="w-full max-w-md mt-5 mb-10 px-3">
        <div className="border-b border-black/70 px-4 py-2 text-center text-[11px] text-[#87ceeb] tracking-[0.12em] uppercase">
          Онлайн игроки
        </div>

        <div className="px-4 py-3 border-b border-black/70 text-[12px] text-[#645b45]">
          <div className="text-yellow-400 text-center mb-2">
            Сортировать по: уровню | нику
          </div>
          <div className="text-yellow-400 text-center mb-3">
            Без клана
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
              {players.map((player) => (
                <div 
                  key={player.id} 
                  className="flex items-center justify-between text-[12px] py-1 border-b border-dotted border-black/60 cursor-pointer hover:bg-gray-800/30 transition-colors"
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
