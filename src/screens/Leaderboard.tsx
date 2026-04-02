import React, { useState, useEffect, useCallback } from "react";
import { getLeaderboard, LeaderboardType, LeaderboardItemLevel, LeaderboardItemSp, LeaderboardItemClan } from "../utils/api";
import { useHeroStore } from "../state/heroStore";
import { useCharacterStore } from "../state/characterStore";
import { getNickColorStyle } from "../utils/nickColor";
import { isWarmCityUi, getCityUiVariant } from "../utils/cityUiVariant";
import { L2_WARM_OUTER_FRAME } from "../utils/l2WarmLayoutClassNames";

interface LeaderboardProps {
  navigate: (path: string) => void;
}

const TABS: { key: LeaderboardType; label: string }[] = [
  { key: "level", label: "Рівень" },
  { key: "sp", label: "SP" },
  { key: "clan", label: "Клани" },
];

export default function Leaderboard({ navigate }: LeaderboardProps) {
  const hero = useHeroStore((s) => s.hero);
  const characterId = useCharacterStore((s) => s.characterId);

  const [type, setType] = useState<LeaderboardType>("level");
  const [items, setItems] = useState<LeaderboardItemLevel[] | LeaderboardItemSp[] | LeaderboardItemClan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getLeaderboard(type, 50);
      setItems(res.items || []);
    } catch (e: any) {
      setError(e?.message || "Помилка завантаження");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    load();
  }, [load]);

  const isL2 = isWarmCityUi(getCityUiVariant());
  const l2Frame = L2_WARM_OUTER_FRAME;
  const innerPanel = isL2
    ? "max-w-[420px] mx-auto rounded-xl border border-[#5c4a32]/75 bg-black/25 shadow-[inset_0_1px_0_rgba(199,173,128,0.08)] p-4"
    : "max-w-[360px] mx-auto border border-white/50 rounded-lg p-4 bg-[#1a0b0b]/30";

  return (
    <div
      className={
        isL2 ? `${l2Frame} w-full min-w-0 my-1 px-3 py-4 text-[#d4c4a8]` : "w-full text-white px-3 py-4"
      }
    >
      <div className={innerPanel}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className={isL2 ? "text-lg font-bold text-[#e8c56e]" : "text-lg font-bold text-[#ffe9c0]"}>
              Рейтинг
            </div>
            <div className={isL2 ? "text-xs text-[#a89878]" : "text-xs text-orange-400/90"}>
              Топ гравців та кланів
            </div>
          </div>
          <button
            onClick={() => navigate("/about")}
            className={
              isL2
                ? "text-[#9d8265] hover:text-[#c9a44c] text-[10px]"
                : "text-gray-400 hover:text-white text-[10px]"
            }
          >
            ← Назад
          </button>
        </div>
        <div className={isL2 ? "w-full h-px bg-[#5c4a32]/45 mb-3" : "w-full h-px bg-gray-600 mb-3"} />

        <div className="flex gap-1 mb-3">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setType(t.key)}
              className={`flex-1 py-1 text-xs rounded ${
                type === t.key
                  ? isL2
                    ? "bg-black/35 text-[#e8c56e] border border-[#c7ad80]/45"
                    : "bg-[#c7ad80]/40 text-[#ffe9c0] border border-[#c7ad80]/60"
                  : isL2
                    ? "bg-black/25 text-[#8a7a60] border border-[#5c4a32]/45 hover:text-[#c9a44c]"
                    : "bg-black/30 text-gray-400 border border-white/20 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && <div className="text-red-400 text-xs mb-2">{error}</div>}
        {loading ? (
          <div className={isL2 ? "text-[#8a7a60] text-sm" : "text-gray-400 text-sm"}>Завантаження...</div>
        ) : type === "clan" ? (
          <div className="space-y-1 max-h-[55vh] overflow-y-auto">
            {(items as LeaderboardItemClan[]).map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-2 p-2 rounded border cursor-pointer ${
                  isL2
                    ? "border-[#5c4a32]/45 hover:bg-black/25"
                    : "border-white/20 hover:bg-white/5"
                }`}
                onClick={() => navigate(`/clan-info/${item.id}`)}
              >
                <span className={isL2 ? "text-[#6a6048] w-6 text-xs" : "text-gray-500 w-6 text-xs"}>
                  #{item.rank}
                </span>
                <div className="flex-1 min-w-0">
                  <div className={isL2 ? "font-semibold text-[#e8c56e] text-sm" : "font-semibold text-[#c7ad80] text-sm"}>
                    {item.name}
                  </div>
                  <div className={isL2 ? "text-[10px] text-[#8a7a60]" : "text-[10px] text-gray-400"}>
                    Рівень {item.level} · Репутація {item.reputation} · {item.memberCount} учасників
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1 max-h-[55vh] overflow-y-auto">
            {(items as (LeaderboardItemLevel | LeaderboardItemSp)[]).map((item) => {
              const isMe = item.characterId === characterId;
              return (
                <div
                  key={item.characterId}
                  className={`flex items-center gap-2 p-2 rounded border cursor-pointer ${
                    isMe
                      ? "border-amber-500/60 bg-amber-900/20"
                      : isL2
                        ? "border-[#5c4a32]/45 hover:bg-black/25"
                        : "border-white/20 hover:bg-white/5"
                  }`}
                  onClick={() => item.characterId && navigate(`/player/${item.characterId}`)}
                >
                  <span className={isL2 ? "text-[#6a6048] w-6 text-xs" : "text-gray-500 w-6 text-xs"}>
                    #{item.rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span
                      className="font-semibold text-sm"
                      style={getNickColorStyle(item.name, hero, item.nickColor)}
                    >
                      {item.name}
                    </span>
                    {item.clanName && (
                      <span className={isL2 ? "text-[10px] text-[#6a6048] ml-1" : "text-[10px] text-gray-500 ml-1"}>
                        [{item.clanName}]
                      </span>
                    )}
                    <div className={isL2 ? "text-[10px] text-[#8a7a60]" : "text-[10px] text-gray-400"}>
                      {type === "level"
                        ? `Рівень ${(item as LeaderboardItemLevel).level} · EXP ${Number((item as LeaderboardItemLevel).exp).toLocaleString()}`
                        : `SP ${(item as LeaderboardItemSp).sp} · Рівень ${item.level}`}
                    </div>
                  </div>
                  {isMe && <span className="text-amber-400 text-[10px]">(Ви)</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
