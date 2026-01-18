import React, { useEffect, useState } from "react";
import { getSevenSealsRanking } from "../utils/api";
import { useHeroStore } from "../state/heroStore";
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

  useEffect(() => {
    const loadRanking = async () => {
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

  return (
    <div className="w-full text-gray-100 flex flex-col">
      {/* Заголовок з рисками */}
      <div className="text-center text-[#b8860b] text-lg font-semibold border-t border-b border-[#3b2614] py-2 mb-4">
        Сім Печатей
      </div>

      {/* Опис івенту */}
      <div className="px-2 mb-4">
        <div className="text-orange-400 text-sm leading-relaxed space-y-2">
          <p>
            Сім Печатей — це щотижневий PvE-івент, який триває з понеділка по суботу та перевіряє силу, витривалість і наполегливість героїв.
          </p>
          <p>
            Протягом івенту з усіх монстрів випадають Медалі Печатей.
          </p>
          <p>
            Кожна зібрана медаль зараховується в особистий рейтинг гравця.
          </p>
        </div>
      </div>

      {/* Статус івенту */}
      <div className="px-2 mb-4">
        <div className={`text-center text-sm py-2 rounded ${isEventActive() ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
          {isEventActive() ? '✓ Івент активний (Понеділок - Субота)' : '✗ Івент неактивний (Неділя)'}
        </div>
      </div>

      {/* Мої медальки */}
      {hero && (
        <div className="px-2 mb-4">
          <div className="text-center text-sm text-[#b8860b] py-2 border border-[#3b2614] rounded bg-[#14110c]/50">
            <div>Мої медальки: <span className="text-yellow-400 font-semibold">{myMedals}</span></div>
            {myRank !== null && (
              <div className="text-xs text-gray-400 mt-1">Мій рейтинг: #{myRank}</div>
            )}
          </div>
        </div>
      )}

      {/* Рейтинг гравців */}
      <div className="px-2 mb-4">
        <div className="text-center text-sm font-semibold text-[#b8860b] mb-2 border-b border-[#3b2614] pb-2">
          Рейтинг гравців
        </div>
        {loading ? (
          <div className="text-center text-xs text-gray-400 py-4">Завантаження рейтингу...</div>
        ) : ranking.length === 0 ? (
          <div className="text-center text-xs text-gray-400 py-4">Рейтинг поки порожній</div>
        ) : (
          <div className="space-y-1">
            {ranking.map((player) => (
              <div
                key={player.characterId}
                className="flex items-center justify-between py-1.5 px-2 border-b border-gray-700/40 text-xs"
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

      {/* Нагороди для топ-3 */}
      <div className="px-2 mb-4">
        <div className="text-center text-sm font-semibold text-[#b8860b] mb-2 border-b border-[#3b2614] pb-2">
          Нагороди
        </div>
        <div className="space-y-2 text-xs">
          <div className="bg-yellow-900/20 border border-yellow-700/40 rounded p-2">
            <div className="font-semibold text-yellow-400 mb-1">1 місце:</div>
            <div className="text-gray-300">
              Физ/Маг атака: 125-750<br />
              Физ/Маг захист: 154-456<br />
              Кол: 5-20
            </div>
          </div>
          <div className="bg-gray-800/20 border border-gray-700/40 rounded p-2">
            <div className="font-semibold text-gray-300 mb-1">2 місце:</div>
            <div className="text-gray-300">
              Физ/Маг атака: 100-500<br />
              Физ/Маг захист: 100-400<br />
              Кол: 5-15
            </div>
          </div>
          <div className="bg-orange-900/20 border border-orange-700/40 rounded p-2">
            <div className="font-semibold text-orange-400 mb-1">3 місце:</div>
            <div className="text-gray-300">
              Физ/Маг атака: 80-300<br />
              Физ/Маг захист: 80-300<br />
              Кол: 5-10
            </div>
          </div>
        </div>
      </div>

      {/* Кнопка назад */}
      <div className="px-2 mt-4 flex justify-center">
        <button
          className="text-xs text-red-500 hover:text-red-400 px-4 py-2 border border-red-700/40 rounded"
          onClick={() => navigate("/city")}
        >
          Назад
        </button>
      </div>
    </div>
  );
}
