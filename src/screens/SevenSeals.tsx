import React, { useEffect, useState } from "react";
import { getSevenSealsRanking } from "../utils/api";
import { useHeroStore, getRateLimitRemainingMs } from "../state/heroStore";
import { getNickColorStyle } from "../utils/nickColor";

interface SevenSealsProps {
  navigate: (path: string) => void;
}

interface RankingPlayer {
  characterId: string;
  characterName: string;
  medalCount: number;
  rank: number;
}

export default function SevenSeals({ navigate }: SevenSealsProps) {
  const hero = useHeroStore((s) => s.hero);
  const [ranking, setRanking] = useState<RankingPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [myMedals, setMyMedals] = useState(0);
  const [showRewards, setShowRewards] = useState(false);

  useEffect(() => {
    const loadRanking = async () => {
      if (getRateLimitRemainingMs() > 0) return;
      setLoading(true);
      try {
        const data = await getSevenSealsRanking();
        setRanking(data.ranking || []);
        setMyRank(data.myRank || null);
        setMyMedals(data.myMedals || 0);
      } catch (err: any) {
        console.error("Error loading Seven Seals ranking:", err);
      } finally {
        setLoading(false);
      }
    };
    loadRanking();
    const interval = setInterval(loadRanking, 30000); // Оновлюємо кожні 30 секунд
    return () => clearInterval(interval);
  }, []);

  // Перевіряємо, чи зараз понеділок-субота (польський час)
  const isEventActive = () => {
    const now = new Date();
    const polandTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Warsaw" }));
    const dayOfWeek = polandTime.getDay(); // 0 = неділя, 1 = понеділок, ..., 6 = субота
    return dayOfWeek >= 1 && dayOfWeek <= 6; // Понеділок-субота
  };

  // Обмежуємо рейтинг до топ-10
  const topRanking = ranking.slice(0, 10);

  return (
    <div className="w-full text-gray-100 flex flex-col">
      {/* Заголовок з рисками */}
      <div className="text-center text-blue-400 text-lg font-semibold border-t border-b border-white/40 py-2 mb-2">
        Семь Печатей
      </div>

      {/* Опис ивента — зменшено в 1.5 рази */}
      <div className="px-2 mb-2">
        <div className="text-orange-400 text-xs leading-relaxed space-y-1">
          <p className="border-t border-white/40 pt-1.5">
            Семь Печатей — это еженедельное PvE-событие, которое длится с понедельника по субботу и проверяет силу, выносливость и упорство героев.
          </p>
          <p className="border-t border-white/40 pt-1.5">
            В течение ивента со всех монстров выпадают Медали Печатей.
          </p>
          <p className="border-t border-b border-white/40 pt-1.5 pb-1.5">
            Каждая собранная медаль засчитывается в личный рейтинг игрока.
          </p>
        </div>
      </div>

      {/* Статус ивента */}
      <div className="px-2 mb-2">
        <div className={`text-center text-sm py-2 border-t border-b border-white/40 ${isEventActive() ? 'text-green-400' : 'text-red-400'}`}>
          {isEventActive() ? '✓ Ивент активен (Понедельник - Суббота)' : '✗ Ивент неактивен (Воскресенье)'}
        </div>
      </div>

      {/* Мои медальки та Убил мобов */}
      {hero && (
        <div className="px-2 mb-2">
          <div className="text-center text-sm text-[#b8860b] py-2 border-t border-b border-white/40">
            <div>Мои медальки: <span className="text-yellow-400 font-semibold">{myMedals}</span></div>
            <div className="mt-1">Убил мобов: <span className="text-yellow-400 font-semibold">{(hero as any)?.mobsKilled ?? (hero as any)?.heroJson?.mobsKilled ?? 0}</span></div>
            {myRank !== null && (
              <div className="text-xs text-gray-400 mt-1">Мой рейтинг: #{myRank}</div>
            )}
          </div>
        </div>
      )}

      {/* Рейтинг игроков */}
      <div className="px-2 mb-2">
        <div className="text-center text-sm font-semibold text-[#b8860b] mb-2 border-t border-b border-white/40 py-2">
          Рейтинг игроков
        </div>
        {loading ? (
          <div className="text-center text-xs text-gray-400 py-4 border-t border-b border-white/40">Загрузка рейтинга...</div>
        ) : topRanking.length === 0 ? (
          <div className="text-center text-xs text-gray-400 py-4 border-t border-b border-white/40">Рейтинг пока пуст</div>
        ) : (
          <div className="space-y-0">
            {topRanking.map((player) => (
              <div
                key={player.characterId}
                className="flex items-center justify-between py-1.5 px-2 border-t border-white/40 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${
                    player.rank === 1 ? 'text-yellow-400' :
                    player.rank === 2 ? 'text-gray-300' :
                    player.rank === 3 ? 'text-orange-400' :
                    'text-gray-400'
                  }`}>
                    #{player.rank}
                  </span>
                  <span
                    className="cursor-pointer hover:opacity-80 transition-colors"
                    style={getNickColorStyle(player.characterName, hero)}
                    onClick={() => navigate(`/player/${player.characterId}`)}
                  >
                    {player.characterName}
                  </span>
                </div>
                <span className="text-yellow-400 font-semibold">{player.medalCount} медалей</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Кнопка Награды — зелена, зменшена в 1.5 рази */}
      <div className="px-2 mb-2">
        <div 
          className="text-center text-xs font-semibold text-green-500 mb-2 border border-green-600 py-1.5 px-3 rounded cursor-pointer hover:bg-green-900/40 hover:text-green-400 transition-colors"
          onClick={() => setShowRewards(!showRewards)}
        >
          Награды
        </div>
        {showRewards && (
          <div className="space-y-2 text-xs border-t border-white/40 pt-2">
            <div className="border-t border-b border-white/40 py-2">
              <div className="font-semibold text-yellow-400 mb-1">1 место:</div>
              <div className="text-gray-300">
                Физ/Маг атака: 125-750<br />
                Физ/Маг защита: 154-456<br />
                Кол: 5-20
              </div>
            </div>
            <div className="border-t border-b border-white/40 py-2">
              <div className="font-semibold text-gray-300 mb-1">2 место:</div>
              <div className="text-gray-300">
                Физ/Маг атака: 100-500<br />
                Физ/Маг защита: 100-400<br />
                Кол: 5-15
              </div>
            </div>
            <div className="border-t border-b border-white/40 py-2">
              <div className="font-semibold text-orange-400 mb-1">3 место:</div>
              <div className="text-gray-300">
                Физ/Маг атака: 80-300<br />
                Физ/Маг защита: 80-300<br />
                Кол: 5-10
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Кнопка назад */}
      <div className="px-2 mt-2 flex justify-center">
        <button
          className="text-xs text-red-500 hover:text-red-400 border-t border-b border-white/40 py-2 px-4"
          onClick={() => navigate("/city")}
        >
          Назад
        </button>
      </div>
    </div>
  );
}
