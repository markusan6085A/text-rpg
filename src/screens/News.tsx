import React, { useEffect, useState } from "react";
import { getNews, type NewsItem } from "../utils/api";
import { getGameTimeTag } from "../utils/news";
import { itemsDB } from "../data/items/itemsDB";
import { getNickColorStyle } from "../utils/nickColor";
import { useHeroStore, getRateLimitRemainingMs } from "../state/heroStore";
import { PlayerNameWithEmblem } from "../components/PlayerNameWithEmblem";
import { getCityUiVariant } from "../utils/cityUiVariant";

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
  actualDrops?: Array<{ id: string; name: string; count: number }>;
  killerName?: string;
  killerId?: string;
  onClose: () => void;
  navigate: (path: string) => void;
}

function RaidBossDropModal({ bossName, bossLevel, drops, actualDrops, killerName, killerId, onClose, navigate }: RaidBossDropModalProps) {
  const hero = useHeroStore((s) => s.hero);
  const isL2 = getCityUiVariant() === "l2";
  const modalPanel = isL2
    ? "bg-[#14110c] border border-[#5c4a32] rounded-lg p-4 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
    : "bg-[#14110c] border border-white/40 rounded-lg p-4 max-w-md w-full max-h-[90vh] overflow-y-auto";
  const borderSep = isL2 ? "border-[#5c4a32]/50" : "border-white/40";
  const killerLinkCls = isL2
    ? "text-[#c9a44c] cursor-pointer hover:opacity-80 transition-colors font-semibold"
    : "text-blue-200 cursor-pointer hover:opacity-80 transition-colors font-semibold";
  const hasActualDrops = actualDrops && actualDrops.length > 0;
  const displayDrops = hasActualDrops ? actualDrops! : (drops ?? []);
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className={modalPanel}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-lg font-semibold text-[#b8860b] mb-2">{bossName}{bossLevel ? ` - ${bossLevel} ур.` : ""}</div>
        {killerName && (
          <div className="text-sm text-gray-300 mb-2">
            Убив:{" "}
            <PlayerNameWithEmblem
              playerName={killerName}
              hero={hero}
              clan={null}
              size={12}
              className={killerLinkCls}
              onClick={(e) => {
                e.stopPropagation();
                if (killerId) navigate(`/player/${killerId}`);
                else navigate(`/player/${killerName}`);
              }}
            />
          </div>
        )}
        
        {displayDrops.length > 0 && (
          <div className={`border-t pt-2 mt-2 ${borderSep}`}>
            <div className="text-sm font-semibold text-[#b8860b] mb-2">{hasActualDrops ? "Отримано:" : "Дроп:"}</div>
            <div className="space-y-1">
              {displayDrops.map((drop: any, idx: number) => {
                const itemDef = itemsDB[drop.id];
                const iconPath = itemDef?.icon 
                  ? (itemDef.icon.startsWith("/") ? itemDef.icon : `/items/${itemDef.icon}`)
                  : "/items/default_item.png";
                const itemName = drop.name || itemDef?.name || drop.id;
                const isActual = typeof drop.count === "number";
                
                return (
                  <div 
                    key={idx} 
                    className="flex items-center gap-2 p-1 rounded"
                  >
                    <img
                      src={iconPath}
                      alt={itemName}
                      className={`w-5 h-5 object-contain border bg-black/40 ${isL2 ? "border-[#5c4a32]/60" : "border-white/40"}`}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <span className="text-gray-400 flex-1 hover:text-[#b8860b] transition-colors">
                      {itemName}:
                    </span>
                    <span className="text-green-400">
                      {isActual ? `x${drop.count}` : `${drop.min ?? 0}-${drop.max ?? 0} (${Math.round((drop.chance || 0) * 100)}%)`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className={`flex justify-center mt-2 pt-2 border-t ${borderSep}`}>
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
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [gameTime, setGameTime] = useState<string>("00:00");
  const [selectedBossDrop, setSelectedBossDrop] = useState<{ bossName: string; bossLevel?: number; drops?: any[]; actualDrops?: Array<{ id: string; name: string; count: number }>; killerName?: string; killerId?: string } | null>(null);

  useEffect(() => {
    setLoading(true);
    const loadNews = async () => {
      if (getRateLimitRemainingMs() > 0) return;
      try {
        const data = await getNews({ page, limit: 20 });
        setItems(data.news || []);
        setTotalPages(data.totalPages ?? 1);
      } catch (err) {
        console.error("Error loading news:", err);
      } finally {
        setLoading(false);
      }
    };

    loadNews();
    const interval = setInterval(loadNews, 30000); // Оновлюємо кожні 30 секунд

    return () => clearInterval(interval);
  }, [page]);

  useEffect(() => {
    // Оновлюємо польський час кожну секунду
    const updatePolandTime = () => {
      const now = new Date();
      const polandTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Warsaw" }));
      const hours = polandTime.getHours().toString().padStart(2, "0");
      const minutes = polandTime.getMinutes().toString().padStart(2, "0");
      setGameTime(`${hours}:${minutes}`);
    };
    updatePolandTime();
    const interval = setInterval(updatePolandTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const isL2 = getCityUiVariant() === "l2";
  const l2Frame =
    "rounded-xl overflow-hidden border border-[#c7ad80]/35 shadow-[0_0_0_1px_rgba(0,0,0,0.85),0_16px_48px_rgba(0,0,0,0.65)] bg-[radial-gradient(ellipse_100%_50%_at_50%_-8%,rgba(120,90,45,0.28)_0%,transparent_50%),linear-gradient(180deg,#1c1812_0%,#0c0a08_100%)]";
  const nameLinkCls = isL2
    ? "text-[#c9a44c] cursor-pointer hover:opacity-80 transition-colors"
    : "text-blue-200 cursor-pointer hover:opacity-80 transition-colors";
  const headerBar = isL2
    ? "flex items-center justify-between px-2 py-2 bg-black/35 border-b border-[#5c4a32]/55 text-[13px]"
    : "flex items-center justify-between px-2 py-2 bg-[#111022] border-b border-yellow-900/60 text-[13px]";
  const headerBtn = isL2
    ? "px-2 py-1 border border-[#5c4a32]/70 rounded bg-black/40 text-[#d4c4a8] hover:border-[#c7ad80]/40"
    : "px-2 py-1 border border-yellow-700/70 rounded bg-black/40";
  const rowBorder = isL2 ? "border-b border-[#5c4a32]/35" : "border-b border-yellow-900/40";
  const footerBar = isL2 ? "px-2 py-1 border-t border-[#5c4a32]/40 text-[11px] text-[#a89878] text-center" : "px-2 py-1 border-t border-yellow-900/40 text-[11px] text-gray-400 text-center";
  const pageBtn = isL2
    ? "px-2 py-1 rounded border border-[#5c4a32]/70 bg-black/40 disabled:opacity-40 text-[#d4c4a8]"
    : "px-2 py-1 rounded border border-yellow-700/70 bg-black/40 disabled:opacity-40";

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
          <PlayerNameWithEmblem
            playerName={item.characterName || "Unknown"}
            hero={hero}
            clan={item.emblem ? { emblem: item.emblem } as any : null}
            size={12}
            className={nameLinkCls}
            onClick={(e) => {
              e.stopPropagation();
              if (item.characterId) {
                navigate(`/player/${item.characterId}` as any);
              } else if (item.characterName) {
                navigate(`/player/${item.characterName}` as any);
              }
            }}
          />
        </>
      );
    } else if (item.type === "premium_purchase") {
      const hours = item.metadata?.hours || 0;
      text = (
        <>
          <PlayerNameWithEmblem
            playerName={item.characterName || "Unknown"}
            hero={hero}
            clan={item.emblem ? { emblem: item.emblem } as any : null}
            size={12}
            className={nameLinkCls}
            onClick={(e) => {
              e.stopPropagation();
              if (item.characterId) {
                navigate(`/player/${item.characterId}` as any);
              } else if (item.characterName) {
                navigate(`/player/${item.characterName}` as any);
              }
            }}
          />{" "}
          купив преміум на {hours} {hours === 1 ? "годину" : hours < 5 ? "години" : "годин"}
        </>
      );
    } else if (item.type === "raid_boss_kill") {
      const bossName = item.metadata?.bossName || "Unknown";
      const bossLevel = item.metadata?.bossLevel;
      const drops = item.metadata?.bossDrops;
      const actualDrops = item.metadata?.actualDroppedItems;
      text = (
        <>
          <PlayerNameWithEmblem
            playerName={item.characterName || "Unknown"}
            hero={hero}
            clan={item.emblem ? { emblem: item.emblem } as any : null}
            size={12}
            className={nameLinkCls}
            onClick={(e) => {
              e.stopPropagation();
              if (item.characterId) {
                navigate(`/player/${item.characterId}` as any);
              } else if (item.characterName) {
                navigate(`/player/${item.characterName}` as any);
              }
            }}
          />{" "}
          убив{" "}
          <span 
            className="text-yellow-300 cursor-pointer hover:opacity-80 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedBossDrop({ bossName, bossLevel, drops, actualDrops, killerName: item.characterName || undefined, killerId: item.characterId });
            }}
          >
            {bossName}
          </span>
          {bossLevel ? ` ${bossLevel} ур.` : ""}
        </>
      );
    } else if (item.type === "return_to_world") {
      text = (
        <>
          <PlayerNameWithEmblem
            playerName={item.characterName || "Unknown"}
            hero={hero}
            clan={item.emblem ? { emblem: item.emblem } as any : null}
            size={12}
            className={nameLinkCls}
            onClick={(e) => {
              e.stopPropagation();
              if (item.characterId) navigate(`/player/${item.characterId}` as any);
              else if (item.characterName) navigate(`/player/${item.characterName}` as any);
            }}
          />{" "}
          повернувся в світ
          {item.metadata?.hoursAbsent ? ` (був відсутній ${item.metadata.hoursAbsent} год.)` : ""}
        </>
      );
    } else if (item.type === "broadcast") {
      const preview = item.metadata?.messagePreview || "";
      const subject = item.metadata?.subject || "";
      text = (
        <>
          <span className="text-[#b8860b] font-semibold">{subject || "Existence"}</span>
          {preview ? `: ${preview}${preview.length >= 100 ? "…" : ""}` : " — розсилка"}
        </>
      );
    }

    return (
      <div
        key={idx}
        className={`${rowBorder} py-1.5 text-[13px] leading-snug`}
      >
        <span className={isL2 ? "text-[#a89878] mr-1" : "text-gray-300 mr-1"}>[{formatTime(item.createdAt)}]</span>
        {text}
      </div>
    );
  };

  return (
    <div
      className={
        isL2
          ? `${l2Frame} text-[#d4c4a8] w-full flex flex-col min-w-0 my-1`
          : "text-gray-100 w-full flex flex-col"
      }
    >
      {/* Шапка */}
      <div className={headerBar}>
        <button className={headerBtn} onClick={() => navigate("/city")}>
          Город
        </button>
        <div
          className={
            isL2
              ? "font-semibold text-[#e8c56e] flex-1 text-center [text-shadow:0_1px_2px_rgba(0,0,0,0.85)]"
              : "font-semibold text-yellow-200 flex-1 text-center"
          }
        >
          Новини сервера
        </div>
      </div>

      {/* Тело */}
      <div className="flex-1 px-2 py-2">
        {loading ? (
          <div className={isL2 ? "text-center text-sm text-[#8a7a60] mt-2" : "text-center text-sm text-gray-400 mt-2"}>
            Загрузка новин...
          </div>
        ) : items.length === 0 ? (
          <div className={isL2 ? "text-center text-sm text-[#8a7a60] mt-2" : "text-center text-sm text-gray-400 mt-2"}>
            Новостей пока нет.
          </div>
        ) : (
            <>
              <div>{items.map((item, idx) => renderLine(item, idx))}</div>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-3">
                <button
                  className={pageBtn}
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  ←
                </button>
                <span className={isL2 ? "text-[12px] text-[#a89878]" : "text-[12px] text-gray-400"}>
                  {page} / {totalPages}
                </span>
                <button
                  className={pageBtn}
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Игровое время внизу */}
      <div className={footerBar}>
        Игровое время:{" "}
        <span className={isL2 ? "text-[#e8c56e]" : "text-yellow-200"}>{gameTime}</span>
      </div>

      {/* Модалка дропу RB */}
      {selectedBossDrop && (
        <RaidBossDropModal
          bossName={selectedBossDrop.bossName}
          bossLevel={selectedBossDrop.bossLevel}
          drops={selectedBossDrop.drops}
          actualDrops={selectedBossDrop.actualDrops}
          killerName={selectedBossDrop.killerName}
          killerId={selectedBossDrop.killerId}
          onClose={() => setSelectedBossDrop(null)}
          navigate={navigate}
        />
      )}
    </div>
  );
};

export default News;
