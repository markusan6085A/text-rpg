import React, { useState, useEffect, useCallback } from "react";
import { getLeaderboard, LeaderboardType, LeaderboardItemLevel, LeaderboardItemSp, LeaderboardItemClan } from "../utils/api";
import { useHeroStore } from "../state/heroStore";
import { useCharacterStore } from "../state/characterStore";
import { getNickColorStyle } from "../utils/nickColor";

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

  return (
    <div className="w-full text-white px-3 py-4">
      <div className="max-w-[360px] mx-auto border border-white/50 rounded-lg p-4 bg-[#1a0b0b]/30">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-lg font-bold text-[#ffe9c0]">Рейтинг</div>
            <div className="text-xs text-orange-400/90">Топ гравців та кланів</div>
          </div>
          <button
            onClick={() => navigate("/about")}
            className="text-gray-400 hover:text-white text-[10px]"
          >
            ← Назад
          </button>
        </div>
        <div className="w-full h-px bg-gray-600 mb-3" />

        <div className="flex gap-1 mb-3">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setType(t.key)}
              className={`flex-1 py-1 text-xs rounded ${
                type === t.key
                  ? "bg-[#c7ad80]/40 text-[#ffe9c0] border border-[#c7ad80]/60"
                  : "bg-black/30 text-gray-400 border border-white/20 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && <div className="text-red-400 text-xs mb-2">{error}</div>}
        {loading ? (
          <div className="text-gray-400 text-sm">Завантаження...</div>
        ) : type === "clan" ? (
          <div className="space-y-1 max-h-[55vh] overflow-y-auto">
            {(items as LeaderboardItemClan[]).map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 p-2 rounded border border-white/20 hover:bg-white/5 cursor-pointer"
                onClick={() => navigate(`/clan-info/${item.id}`)}
              >
                <span className="text-gray-500 w-6 text-xs">#{item.rank}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[#c7ad80] text-sm">{item.name}</div>
                  <div className="text-[10px] text-gray-400">
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
                  className={`flex items-center gap-2 p-2 rounded border ${
                    isMe ? "border-amber-500/60 bg-amber-900/20" : "border-white/20 hover:bg-white/5"
                  } cursor-pointer`}
                  onClick={() => item.characterId && navigate(`/player/${item.characterId}`)}
                >
                  <span className="text-gray-500 w-6 text-xs">#{item.rank}</span>
                  <div className="flex-1 min-w-0">
                    <span
                      className="font-semibold text-sm"
                      style={getNickColorStyle(item.name, hero, item.nickColor)}
                    >
                      {item.name}
                    </span>
                    {item.clanName && (
                      <span className="text-[10px] text-gray-500 ml-1">[{item.clanName}]</span>
                    )}
                    <div className="text-[10px] text-gray-400">
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
