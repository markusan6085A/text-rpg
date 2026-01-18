import React, { useEffect, useState } from "react";
import { getNews, type NewsItem } from "../utils/api";
import { getGameTimeTag } from "../utils/news";
import { itemsDB } from "../data/items/itemsDB";
import { getNickColorStyle } from "../utils/nickColor";
import { useHeroStore } from "../state/heroStore";

type Route =
  | "/"
  | "/register"
  | "/login"
  | "/city"
  | "/character"
  | "/gk"
  | "/location"
  | "/about"
  | "/forgot"
  | "/stats"
  | "/wip"
  | "/news";

interface NewsProps {
  navigate: (path: Route) => void;
  user: any;
  onLogout: () => void;
}

interface RaidBossDropModalProps {
  bossName: string;
  bossLevel?: number;
  drops?: any[];
  onClose: () => void;
}

function RaidBossDropModal({ bossName, bossLevel, drops, onClose }: RaidBossDropModalProps) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-[#1a0b0b] border border-[#5c1a1a]/70 rounded-lg p-4 max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-lg font-semibold text-[#b8860b] mb-3">{bossName}{bossLevel ? ` - ${bossLevel} ур.` : ""}</div>
        
        {drops && drops.length > 0 && (
          <div className="border-t border-gray-700 pt-2 mt-2">
            <div className="text-sm font-semibold text-[#b8860b] mb-2">Дроп:</div>
            <div className="space-y-1">
              {drops.map((drop, idx) => {
                const itemDef = itemsDB[drop.id];
                const iconPath = itemDef?.icon 
                  ? (itemDef.icon.startsWith("/") ? itemDef.icon : `/items/${itemDef.icon}`)
                  : "/items/default_item.png";
                const itemName = itemDef?.name || drop.id;
                
                return (
                  <div 
                    key={idx} 
                    className="flex items-center gap-2 p-1 rounded"
                  >
                    <img
                      src={iconPath}
                      alt={itemName}
                      className="w-5 h-5 object-contain border border-gray-600 bg-black/40"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <span className="text-gray-400 flex-1 hover:text-[#b8860b] transition-colors">
                      {itemName}:
                    </span>
                    <span className="text-green-400">
                      {drop.min}-{drop.max} ({Math.round((drop.chance || 0) * 100)}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex justify-center mt-4 pt-2 border-t border-gray-700">
          <button
            className="px-4 py-2 bg-[#5c1a1a] text-white rounded hover:bg-[#7a2222] transition-colors"
            onClick={onClose}
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}

const News: React.FC<NewsProps> = ({ navigate, user, onLogout: _onLogout }) => {
  const hero = useHeroStore((s) => s.hero);
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [gameTime, setGameTime] = useState<string>("00:00");
  const [selectedBossDrop, setSelectedBossDrop] = useState<{ bossName: string; bossLevel?: number; drops?: any[] } | null>(null);

  useEffect(() => {
    const loadNews = async () => {
      try {
        const data = await getNews();
        setItems(data.news || []);
      } catch (err) {
        console.error("Error loading news:", err);
      } finally {
        setLoading(false);
      }
    };

    loadNews();
    const interval = setInterval(loadNews, 30000); // Оновлюємо кожні 30 секунд

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const updateGameTime = () => {
      setGameTime(getGameTimeTag());
    };
    updateGameTime();
    const interval = setInterval(updateGameTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      return `${hours}:${minutes}`;
    } catch {
      return "00:00";
    }
  };

  const renderLine = (item: NewsItem, idx: number) => {
    let text: React.ReactNode = null;

    if (item.type === "new_player") {
      text = (
        <>
          На сервері з'явився новий гравець{" "}
          <span 
            className="text-blue-200 cursor-pointer hover:opacity-80 transition-colors"
            style={item.characterName ? getNickColorStyle(item.characterName, hero) : {}}
            onClick={(e) => {
              e.stopPropagation();
              if (item.characterId) {
                navigate(`/player/${item.characterId}` as any);
              } else if (item.characterName) {
                navigate(`/player/${item.characterName}` as any);
              }
            }}
          >
            {item.characterName || "Unknown"}
          </span>
        </>
      );
    } else if (item.type === "premium_purchase") {
      const hours = item.metadata?.hours || 0;
      text = (
        <>
          <span 
            className="text-blue-200 cursor-pointer hover:opacity-80 transition-colors"
            style={item.characterName ? getNickColorStyle(item.characterName, hero) : {}}
            onClick={(e) => {
              e.stopPropagation();
              if (item.characterId) {
                navigate(`/player/${item.characterId}` as any);
              } else if (item.characterName) {
                navigate(`/player/${item.characterName}` as any);
              }
            }}
          >
            {item.characterName || "Unknown"}
          </span>{" "}
          купив преміум на {hours} {hours === 1 ? "годину" : hours < 5 ? "години" : "годин"}
        </>
      );
    } else if (item.type === "raid_boss_kill") {
      const bossName = item.metadata?.bossName || "Unknown";
      const bossLevel = item.metadata?.bossLevel;
      const drops = item.metadata?.bossDrops;
      text = (
        <>
          <span 
            className="text-blue-200 cursor-pointer hover:opacity-80 transition-colors"
            style={item.characterName ? getNickColorStyle(item.characterName, hero) : {}}
            onClick={(e) => {
              e.stopPropagation();
              if (item.characterId) {
                navigate(`/player/${item.characterId}` as any);
              } else if (item.characterName) {
                navigate(`/player/${item.characterName}` as any);
              }
            }}
          >
            {item.characterName || "Unknown"}
          </span>{" "}
          убив{" "}
          <span 
            className="text-yellow-300 cursor-pointer hover:opacity-80 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedBossDrop({ bossName, bossLevel, drops });
            }}
          >
            {bossName}
          </span>
          {bossLevel ? ` ${bossLevel} ур.` : ""}
        </>
      );
    }

    return (
      <div
        key={idx}
        className="border-b border-yellow-900/40 py-1.5 text-[13px] leading-snug"
      >
        <span className="text-gray-300 mr-1">[{formatTime(item.createdAt)}]</span>
        {text}
      </div>
    );
  };

  return (
    <div className="flex justify-center text-gray-100">
      <div className="w-full max-w-[380px] bg-[#05040a] min-h-screen border-x border-yellow-900/40 flex flex-col">
        {/* Шапка */}
        <div className="flex items-center justify-between px-2 py-2 bg-[#111022] border-b border-yellow-900/60 text-[13px]">
          <button
            className="px-2 py-1 border border-yellow-700/70 rounded bg-black/40"
            onClick={() => navigate("/city")}
          >
            Город
          </button>
          <div className="font-semibold text-yellow-200 flex-1 text-center">
            Новини сервера
          </div>
        </div>

        {/* Тело */}
        <div className="flex-1 px-2 py-2">
          {loading ? (
            <div className="text-center text-sm text-gray-400 mt-4">
              Загрузка новин...
            </div>
          ) : items.length === 0 ? (
            <div className="text-center text-sm text-gray-400 mt-4">
              Новостей пока нет.
            </div>
          ) : (
            <div>{items.map(renderLine)}</div>
          )}
        </div>

        {/* Игровое время внизу */}
        <div className="px-2 py-1 border-t border-yellow-900/40 text-[11px] text-gray-400 text-center">
          Игровое время: <span className="text-yellow-200">{gameTime}</span>
        </div>
      </div>

      {/* Модалка дропу RB */}
      {selectedBossDrop && (
        <RaidBossDropModal
          bossName={selectedBossDrop.bossName}
          bossLevel={selectedBossDrop.bossLevel}
          drops={selectedBossDrop.drops}
          onClose={() => setSelectedBossDrop(null)}
        />
      )}
    </div>
  );
};

export default News;
