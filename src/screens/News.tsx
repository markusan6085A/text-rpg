import React, { useEffect, useState } from "react";
import { getNews, type NewsItem } from "../utils/api";
import { formatGameClockHHMM } from "../utils/gameClock";
import { getGameTimeTag } from "../utils/news";
import { itemsDB, itemsDBWithStarter } from "../data/items/itemsDB";
import { resolveLootIconPathFromItemId } from "../utils/lootIconPath";
import { getNickColorStyle } from "../utils/nickColor";
import { useHeroStore, getRateLimitRemainingMs } from "../state/heroStore";
import { PlayerNameWithEmblem } from "../components/PlayerNameWithEmblem";
import { isWarmCityUi, getCityUiVariant } from "../utils/cityUiVariant";
import { L2_WARM_OUTER_FRAME } from "../utils/l2WarmLayoutClassNames";

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
  /** Застаріле: таблиця можливого дропу — не показуємо в UI */
  drops?: any[];
  actualDrops?: Array<{ id: string; name: string; count: number }>;
  /** Фактично отримано з РБ (adena / exp / sp) */
  killRewards?: { adena: number; exp: number; sp: number };
  killerName?: string;
  killerId?: string;
  onClose: () => void;
  navigate: (path: string) => void;
}

/** Підписи характеристик для перегляду дропу РБ (усі поля з itemsDB.stats). */
const RB_ITEM_STAT_LABELS: Record<string, string> = {
  pAtk: "Фіз. атака",
  mAtk: "Маг. атака",
  pDef: "Фіз. захист",
  mDef: "Маг. захист",
  rCrit: "Крит",
  pAtkSpd: "Швидкість атаки",
  castSpeed: "Швидкість каста",
  maxHp: "Max HP",
  maxMp: "Max MP",
  maxCp: "Max CP",
  maxHpPercent: "Max HP %",
  maxMpPercent: "Max MP %",
  pDefPercent: "Фіз. захист %",
  mDefPercent: "Маг. захист %",
  pAtkPercent: "Фіз. урон %",
  mAtkPercent: "Маг. урон %",
  STR: "STR",
  DEX: "DEX",
  CON: "CON",
  INT: "INT",
  WIT: "WIT",
  MEN: "MEN",
  accuracy: "Точність",
  evasion: "Ухилення",
  critPower: "Сила криту",
  attackSpeed: "Швидкість бою",
  poisonResist: "Стійк. до отрути",
  holdResist: "Стійк. до утримання",
  bleedResist: "Стійк. до кровотечі",
  sleepResist: "Стійк. до сну",
  poisonResistPercent: "Стійк. до отрути %",
  holdResistPercent: "Стійк. до утрим. %",
  poisonChanceBonus: "Шанс отрути",
  holdChanceBonus: "Шанс утримання",
  bleedChanceBonus: "Шанс кровотечі",
  mpSkillCostReduction: "MP навичок −%",
  healReceivedBonus: "Отримане зцілення +%",
  vampirism: "Vampiric / крадіжка HP %",
  stunResist: "Стійк. до шоку/оглушення",
  stunChanceBonus: "Шанс шоку/оглушення",
  mentalResist: "Опір ментальним ефектам",
  damageTakenReduction: "Зменшення вхідного урону %",
};

const RB_STAT_KEY_ORDER: string[] = [
  "pAtk",
  "mAtk",
  "pDef",
  "mDef",
  "rCrit",
  "pAtkSpd",
  "castSpeed",
  "maxHp",
  "maxMp",
  "maxCp",
  "maxHpPercent",
  "maxMpPercent",
  "pDefPercent",
  "mDefPercent",
  "pAtkPercent",
  "mAtkPercent",
  "STR",
  "DEX",
  "CON",
  "INT",
  "WIT",
  "MEN",
  "accuracy",
  "evasion",
  "critPower",
  "attackSpeed",
  "poisonResist",
  "holdResist",
  "bleedResist",
  "sleepResist",
  "poisonResistPercent",
  "holdResistPercent",
  "poisonChanceBonus",
  "holdChanceBonus",
  "bleedChanceBonus",
  "mpSkillCostReduction",
  "healReceivedBonus",
  "vampirism",
  "stunResist",
  "stunChanceBonus",
  "mentalResist",
  "damageTakenReduction",
];

function formatRbStatKey(key: string): string {
  if (RB_ITEM_STAT_LABELS[key]) return RB_ITEM_STAT_LABELS[key];
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

function RaidBossItemDetailBody({
  itemId,
  displayName,
  dropCount,
  isL2,
}: {
  itemId: string;
  displayName: string;
  dropCount: number;
  isL2: boolean;
}) {
  const def = itemsDB[itemId] || itemsDBWithStarter[itemId];
  const iconPath = resolveLootIconPathFromItemId(itemId);
  const stats = def?.stats && typeof def.stats === "object" ? (def.stats as Record<string, unknown>) : null;
  const statKeys = stats
    ? Object.keys(stats).filter((k) => {
        const v = stats[k];
        return typeof v === "number" && Number.isFinite(v);
      })
    : [];
  const orderedKeys = [
    ...RB_STAT_KEY_ORDER.filter((k) => statKeys.includes(k)),
    ...statKeys.filter((k) => !RB_STAT_KEY_ORDER.includes(k)).sort(),
  ];
  const boxCls = isL2
    ? "rounded-lg border border-[#5c4a32]/50 bg-black/35 px-2 py-2 text-[12px]"
    : "rounded-lg border border-white/30 bg-black/35 px-2 py-2 text-[12px]";

  return (
    <>
      <div className="flex items-center gap-3 mb-3">
        <img
          src={iconPath}
          alt={displayName}
          className={`w-14 h-14 object-contain border bg-black/40 ${isL2 ? "border-[#5c4a32]/60" : "border-white/40"}`}
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/items/default_item.png";
          }}
        />
        <div className="min-w-0 flex-1">
          <div className={`font-semibold ${isL2 ? "text-[#e8c56e]" : "text-amber-100"}`}>
            {def?.name ?? displayName}
            {def?.grade ? ` [${def.grade}]` : ""}
          </div>
          <div className="text-gray-400 text-[11px] mt-0.5">
            У дропі: <span className="text-green-400 tabular-nums">×{dropCount}</span>
          </div>
          {def?.slot ? (
            <div className="text-[11px] text-[#8a7a60] mt-0.5">
              Слот: {def.slot} {def.kind ? `· ${def.kind}` : ""}
            </div>
          ) : null}
        </div>
      </div>

      {!def ? (
        <p className="text-gray-500 text-[12px] mb-2">
          Немає повної картки в базі предметів (id: <span className="font-mono">{itemId}</span>).
        </p>
      ) : null}

      {orderedKeys.length > 0 ? (
        <div className={boxCls}>
          <div className={`text-[11px] font-semibold mb-1.5 ${isL2 ? "text-[#c9a44c]" : "text-amber-200/90"}`}>
            Характеристики
          </div>
          <div className="space-y-1 max-h-[40vh] overflow-y-auto pr-1">
            {orderedKeys.map((k) => (
              <div key={k} className="flex justify-between gap-2 text-[#e8dcc8]">
                <span className="text-[#8a7a60] shrink-0">{formatRbStatKey(k)}</span>
                <span className="text-cyan-200/95 tabular-nums text-right">{String(stats![k])}</span>
              </div>
            ))}
          </div>
        </div>
      ) : def ? (
        <p className="text-gray-500 text-[12px]">У цієї речі немає числових характеристик у базі.</p>
      ) : null}

      {def?.description ? (
        <div className={`mt-3 pt-2 border-t ${isL2 ? "border-[#5c4a32]/45" : "border-white/30"}`}>
          <div className={`text-[11px] font-semibold mb-1 ${isL2 ? "text-[#e0c68a]" : "text-amber-100/90"}`}>Опис</div>
          <p className="text-[11px] text-gray-400 leading-snug italic">{def.description}</p>
        </div>
      ) : null}
    </>
  );
}

function RaidBossDropModal({
  bossName,
  bossLevel,
  drops: _drops,
  actualDrops,
  killRewards,
  killerName,
  killerId,
  onClose,
  navigate,
}: RaidBossDropModalProps) {
  const hero = useHeroStore((s) => s.hero);
  const isL2 = isWarmCityUi(getCityUiVariant());
  const [itemDetail, setItemDetail] = useState<{ id: string; name: string; count: number } | null>(null);
  const modalPanel = isL2
    ? "bg-[#14110c] border border-[#5c4a32] rounded-lg p-4 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
    : "bg-[#14110c] border border-white/40 rounded-lg p-4 max-w-md w-full max-h-[90vh] overflow-y-auto";
  const borderSep = isL2 ? "border-[#5c4a32]/50" : "border-white/40";
  const killerLinkCls = isL2
    ? "text-[#c9a44c] cursor-pointer hover:opacity-80 transition-colors font-semibold"
    : "text-blue-200 cursor-pointer hover:opacity-80 transition-colors font-semibold";
  const hasItems = Array.isArray(actualDrops) && actualDrops.length > 0;
  const hasKillRewards =
    killRewards != null &&
    typeof killRewards === "object" &&
    ["adena", "exp", "sp"].every((k) => typeof (killRewards as Record<string, unknown>)[k] === "number");
  const hasLegacyBossTable = Array.isArray(_drops) && _drops.length > 0;
  const hasAnyLoot = hasKillRewards || hasItems;
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className={modalPanel}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="text-lg font-semibold mb-2 [text-shadow:0_1px_2px_rgba(0,0,0,0.85)]"
          style={{ color: "#8B0000" }}
        >
          {bossName}
          {bossLevel ? ` - ${bossLevel} ур.` : ""}
        </div>
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
        
        {hasAnyLoot && (
          <div className={`border-t pt-2 mt-2 ${borderSep}`}>
            <div className="text-sm font-semibold text-[#b8860b] mb-2">Отримано:</div>
            <div className="space-y-1">
              {hasKillRewards && (
                <>
                  <div className="flex items-center justify-between gap-2 text-sm py-0.5">
                    <span className="text-gray-400">Адена</span>
                    <span className="text-amber-200 tabular-nums">{killRewards!.adena.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-sm py-0.5">
                    <span className="text-gray-400">Досвід (EXP)</span>
                    <span className="text-cyan-200/90 tabular-nums">{killRewards!.exp.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-sm py-0.5">
                    <span className="text-gray-400">SP</span>
                    <span className="text-violet-200/90 tabular-nums">{killRewards!.sp.toLocaleString()}</span>
                  </div>
                </>
              )}
              {hasItems &&
                actualDrops!.map((drop, idx) => {
                  const itemDef = itemsDB[drop.id] || itemsDBWithStarter[drop.id];
                  const iconPath = resolveLootIconPathFromItemId(drop.id);
                  const itemName = drop.name || itemDef?.name || drop.id;
                  const linkCls = isL2
                    ? "text-[#c9a44c] cursor-pointer hover:underline hover:text-[#e8d4a8] transition-colors text-left flex-1 font-medium"
                    : "text-sky-300 cursor-pointer hover:underline hover:text-sky-200 transition-colors text-left flex-1 font-medium";
                  return (
                    <div key={`${drop.id}-${idx}`} className="flex items-center gap-2 p-1 rounded">
                      <button
                        type="button"
                        className="p-0 border-0 bg-transparent cursor-pointer shrink-0 rounded"
                        title="Характеристики"
                        onClick={(e) => {
                          e.stopPropagation();
                          setItemDetail({ id: drop.id, name: itemName, count: drop.count });
                        }}
                      >
                        <img
                          src={iconPath}
                          alt={itemName}
                          className={`w-5 h-5 object-contain border bg-black/40 ${isL2 ? "border-[#5c4a32]/60" : "border-white/40"} hover:opacity-90`}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </button>
                      <button
                        type="button"
                        className={linkCls}
                        onClick={(e) => {
                          e.stopPropagation();
                          setItemDetail({ id: drop.id, name: itemName, count: drop.count });
                        }}
                      >
                        {itemName}
                      </button>
                      <span className="text-green-400 tabular-nums shrink-0">×{drop.count}</span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {!hasAnyLoot && hasLegacyBossTable && (
          <div className={`border-t pt-2 mt-2 ${borderSep} text-sm text-gray-500`}>
            Для цієї новини не збережено фактичний дроп (запис до оновлення). Можливий дроп з таблиці не показується.
          </div>
        )}

        {!hasAnyLoot && !hasLegacyBossTable && (
          <div className={`border-t pt-2 mt-2 ${borderSep} text-sm text-gray-500`}>
            Немає даних про отриманий дроп.
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

      {itemDetail ? (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-3"
          onClick={() => setItemDetail(null)}
          role="presentation"
        >
          <div
            className={
              isL2
                ? "bg-[#14110c] border border-[#5c4a32] rounded-lg p-4 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
                : "bg-[#14110c] border border-white/40 rounded-lg p-4 max-w-md w-full max-h-[90vh] overflow-y-auto"
            }
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`text-center text-sm font-semibold mb-3 ${isL2 ? "text-[#e8c56e]" : "text-amber-100"}`}>
              Предмет
            </div>
            <RaidBossItemDetailBody
              itemId={itemDetail.id}
              displayName={itemDetail.name}
              dropCount={itemDetail.count}
              isL2={isL2}
            />
            <div className={`flex justify-center mt-4 pt-3 border-t ${borderSep}`}>
              <button
                type="button"
                className="px-4 py-2 bg-[#3a3530] text-[#e8dcc8] rounded border border-[#5c4a32]/70 hover:bg-[#4a4338] transition-colors text-sm"
                onClick={() => setItemDetail(null)}
              >
                Назад
              </button>
            </div>
          </div>
        </div>
      ) : null}
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
  const [selectedBossDrop, setSelectedBossDrop] = useState<{
    bossName: string;
    bossLevel?: number;
    drops?: any[];
    actualDrops?: Array<{ id: string; name: string; count: number }>;
    killRewards?: { adena: number; exp: number; sp: number };
    killerName?: string;
    killerId?: string;
  } | null>(null);

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
    const tick = () => setGameTime(formatGameClockHHMM());
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const isL2 = isWarmCityUi(getCityUiVariant());
  const l2Frame = L2_WARM_OUTER_FRAME;
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
      const killRewards = item.metadata?.killRewards;
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
            className="cursor-pointer hover:opacity-90 transition-colors font-medium [text-shadow:0_1px_2px_rgba(0,0,0,0.85)]"
            style={{ color: "#8B0000" }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedBossDrop({
                bossName,
                bossLevel,
                drops,
                actualDrops,
                killRewards,
                killerName: item.characterName || undefined,
                killerId: item.characterId,
              });
            }}
          >
            {bossName}
            {bossLevel ? ` ${bossLevel} ур.` : ""}
          </span>
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
          killRewards={selectedBossDrop.killRewards}
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
