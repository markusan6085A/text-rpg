import React, { useEffect, useState } from "react";
import { getSevenSealsRanking } from "../utils/api";
import { useHeroStore, getRateLimitRemainingMs } from "../state/heroStore";
import { getNickColorStyle } from "../utils/nickColor";
import { isWarmCityUi, getCityUiVariant } from "../utils/cityUiVariant";
import { isSevenSealsFarmWindowActive, isSevenSealsTechnicalPause } from "../utils/sevenSealsTime";
import { L2_WARM_OUTER_FRAME } from "../utils/l2WarmLayoutClassNames";

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
  const [weekPaused, setWeekPaused] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadRanking = async () => {
      if (getRateLimitRemainingMs() > 0) return;
      setLoading(true);
      try {
        const data = await getSevenSealsRanking();
        if (!mounted) return;
        setRanking(data.ranking || []);
        setMyRank(data.myRank || null);
        setMyMedals(data.myMedals || 0);
        setWeekPaused(!!data.weekPaused);
      } catch (err: any) {
        if (!mounted) return;
        console.error("Error loading Seven Seals ranking:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadRanking();
    const interval = setInterval(loadRanking, 30000); // Оновлюємо кожні 30 секунд
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const isL2 = isWarmCityUi(getCityUiVariant());
  const l2Frame = L2_WARM_OUTER_FRAME;
  const bc = isL2 ? "border-[#5c4a32]/50" : "border-white/40";

  const isEventActive = () => isSevenSealsFarmWindowActive();

  // Тільки 3 переможці отримують нагороди
  const topRanking = ranking.slice(0, 3);

  return (
    <div
      className={
        isL2
          ? `${l2Frame} w-full min-w-0 my-1 px-2 py-2 text-[#d4c4a8] flex flex-col`
          : "w-full text-gray-100 flex flex-col"
      }
    >
      {/* Заголовок з рисками */}
      <div
        className={`text-center text-lg font-semibold border-t border-b py-2 mb-2 ${bc} ${
          isL2 ? "text-[#e8c56e] [text-shadow:0_1px_2px_rgba(0,0,0,0.85)]" : "text-blue-400"
        }`}
      >
        Семь Печатей
      </div>

      {/* Опис ивента — зменшено в 1.5 рази */}
      <div className="px-2 mb-2">
        <div
          className={
            isL2 ? "text-[#c9a44c] text-xs leading-relaxed space-y-1" : "text-orange-400 text-xs leading-relaxed space-y-1"
          }
        >
          <p className={`border-t pt-1.5 ${bc}`}>
            Семь Печатей — это еженедельное PvE-событие, которое длится с понедельника по субботу и проверяет силу, выносливость и упорство героев.
          </p>
          <p className={`border-t pt-1.5 ${bc}`}>
            В течение ивента со всех монстров выпадают Медали Печатей.
          </p>
          <p className={`border-t border-b pt-1.5 pb-1.5 ${bc}`}>
            Каждая собранная медаль засчитывается в личный рейтинг игрока.
          </p>
        </div>
      </div>

      {/* Статус ивента */}
      <div className="px-2 mb-2">
        <div className={`text-center text-sm py-2 border-t border-b ${bc} ${isEventActive() ? 'text-green-400' : 'text-amber-400'}`}>
          {isEventActive()
            ? '✓ Сбор медалей: понедельник 00:00 — суббота 22:00 (Europe/Warsaw)'
            : isSevenSealsTechnicalPause()
              ? '⏸ Пауза: суббота 22:00 — воскресенье (медали не падают, рейтинг недели зафиксирован)'
              : '✗ Ивент неактивен'}
        </div>
        {weekPaused ? (
          <div className={`text-center text-[11px] mt-1 ${isL2 ? "text-[#8a7a60]" : "text-gray-500"}`}>
            На сервере сейчас пауза недели — таблица показывает зачёт текущего цикла; медали с мобов не падают.
          </div>
        ) : null}
      </div>

      {/* Мои медальки та Убил мобов */}
      {hero && (
        <div className="px-2 mb-2">
          <div className={`text-center text-sm py-2 border-t border-b ${bc} ${isL2 ? "text-[#e8c56e]" : "text-[#b8860b]"}`}>
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
        <div className={`text-center text-sm font-semibold mb-2 border-t border-b py-2 ${bc} ${isL2 ? "text-[#e8c56e]" : "text-[#b8860b]"}`}>
          Рейтинг игроков
        </div>
        {loading ? (
          <div className={`text-center text-xs py-4 border-t border-b ${bc} ${isL2 ? "text-[#8a7a60]" : "text-gray-400"}`}>Загрузка рейтинга...</div>
        ) : topRanking.length === 0 ? (
          <div className={`text-center text-xs py-4 border-t border-b ${bc} ${isL2 ? "text-[#8a7a60]" : "text-gray-400"}`}>Рейтинг пока пуст</div>
        ) : (
          <div className="space-y-0">
            {topRanking.map((player) => (
              <div
                key={player.characterId}
                className={`flex items-center justify-between py-1.5 px-2 border-t text-xs ${bc}`}
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
          <div className={`space-y-2 text-xs border-t pt-2 ${bc}`}>
            <div className={`border-t border-b py-2 ${bc}`}>
              <div className="font-semibold text-yellow-400 mb-1">1 место:</div>
              <div className="text-gray-300">
                Физ/Маг атака: 125-750<br />
                Физ/Маг защита: 154-456<br />
                Кол: 5-20
              </div>
            </div>
            <div className={`border-t border-b py-2 ${bc}`}>
              <div className="font-semibold text-gray-300 mb-1">2 место:</div>
              <div className="text-gray-300">
                Физ/Маг атака: 100-500<br />
                Физ/Маг защита: 100-400<br />
                Кол: 5-15
              </div>
            </div>
            <div className={`border-t border-b py-2 ${bc}`}>
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
          className={`text-xs py-2 px-4 border-t border-b ${bc} ${isL2 ? "text-[#b85c4c] hover:text-[#d4786a]" : "text-red-500 hover:text-red-400"}`}
          onClick={() => navigate("/city")}
        >
          Назад
        </button>
      </div>
    </div>
  );
}
