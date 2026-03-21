// src/screens/Location.tsx
import React from "react";
import {
  locations as WORLD_LOCATIONS,
  cities as WORLD_CITIES,
} from "../data/world";
import type { City, Zone, Mob } from "../data/world/types";
import { useHeroStore } from "../state/heroStore";
import { itemsDB } from "../data/items/itemsDB";
import { isMobOnRespawn, getRespawnTimeRemaining } from "../state/battle/mobRespawns";
import { autoDetectGrade } from "../utils/items/autoDetectArmorType";
import { findSetForItem, formatSetStatsForDisplay } from "../data/sets/armorSets";
import { savePreviousLocation, savePreviousCity } from "../utils/locationNavigation";
import { getFloranMobDropProfile } from "../data/drop/floranMobDrops";
import { getQuestMobNames } from "../utils/quests/getQuestMobNames";
import { QUESTS } from "../data/quests";
import { getOnlinePlayers, sendHeartbeat, type OnlinePlayer } from "../utils/api";
import { getGameSettings } from "../state/gameSettings";
import { showToast } from "../state/toastStore";
import { getCityUiVariant } from "../utils/cityUiVariant";
import { getMobListIconSrc } from "../utils/mobPublicIcon";

type Navigate = (path: string) => void;

function useQuery() {
  return React.useMemo(() => new URLSearchParams(location.search), []);
}

function findZoneById(zoneId: string): { zone: Zone; city: City } | undefined {
  const zone = WORLD_LOCATIONS.find((z) => z.id === zoneId);
  if (!zone) return undefined;
  const city = WORLD_CITIES.find((c) => c.id === zone.cityId);
  if (!city) return undefined;
  return { zone, city };
}

export default function LocationScreen({ navigate }: { navigate: Navigate }) {
  const q = useQuery();
  const hero = useHeroStore((s) => s.hero);
  const updateHero = useHeroStore((s) => s.updateHero);
  const isL2 = getCityUiVariant() === "l2";
  const l2Frame =
    "rounded-xl overflow-hidden border border-[#c7ad80]/35 shadow-[0_0_0_1px_rgba(0,0,0,0.85),0_16px_48px_rgba(0,0,0,0.65)] bg-[radial-gradient(ellipse_100%_50%_at_50%_-8%,rgba(120,90,45,0.28)_0%,transparent_50%),linear-gradient(180deg,#1c1812_0%,#0c0a08_100%)]";
  const l2MobCard =
    "w-full rounded-md mb-2 border border-[#5c4a32]/75 bg-gradient-to-b from-[#2e2619] to-[#14110c] shadow-[inset_0_1px_0_rgba(199,173,128,0.1),0_4px_12px_rgba(0,0,0,0.45)] hover:border-[#c7ad80]/45 hover:brightness-[1.04] active:scale-[0.995] transition-[border-color,transform,filter] duration-150 px-2.5 py-2 cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#c7ad80]/40";

  // Підтримуємо і ?id=, і ?zone= на всяк випадок
  const zoneId = q.get("id") || q.get("zone") || "";

  const found = zoneId ? findZoneById(zoneId) : undefined;

  const [page, setPage] = React.useState(() => {
    const p = Number(q.get("page") || "1");
    return Number.isFinite(p) && p > 0 ? p : 1;
  });

  const [selectedMob, setSelectedMob] = React.useState<Mob | null>(null);
  const [selectedDropItem, setSelectedDropItem] = React.useState<string | null>(null);
  const [now, setNow] = React.useState(Date.now());
  const [zonePlayers, setZonePlayers] = React.useState<OnlinePlayer[]>([]);

  // Оновлюємо час кожну секунду для відображення таймера респавну
  React.useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    if (!hero) return;
    const loc = found?.zone?.name || "";
    // Завжди оновлюємо location в hero. Якщо ми не у found (тобто вийшли з окрестності/перейшли в місто),
    // loc буде "". Це дозволить серверу знати, що ми вже не в зоні, і прибрати нас зі списку.
    const currentLocation = String((hero as any)?.location ?? (hero as any)?.currentLocation ?? (hero as any)?.zone ?? "").trim();
    if (currentLocation !== loc) {
      updateHero({ location: loc } as any);
    }
  }, [found?.zone?.name, hero?.id, updateHero]);

  React.useEffect(() => {
    if (!found?.zone?.name || !hero?.id) return;
    // Додаємо heartbeat з characterId + location, щоб серверний online список
    // відображав саме активного персонажа/твіна в правильній окрестності.
    sendHeartbeat(hero.id, found.zone.name).catch(() => {});
  }, [found?.zone?.name, hero?.id]);

  React.useEffect(() => {
    let mounted = true;
    const normalize = (v: string) => v.trim().toLowerCase();
    const load = async () => {
      try {
        if (hero?.id && found?.zone?.name) {
          await sendHeartbeat(hero.id, found.zone.name);
        }
        const data = await getOnlinePlayers();
        if (!mounted) return;
        const myId = String((hero as any)?.id ?? "").trim();
        const zoneName = normalize(found?.zone?.name || "");
        const players = (data.players || []).filter(
          (p) => normalize(String(p.location || "")) === zoneName && String(p.id || "").trim() !== myId
        );
        setZonePlayers(players);
      } catch {
        if (mounted) setZonePlayers([]);
      }
    };

    if (found?.zone?.name) load();
    // Оновлюємо список гравців кожні 3 секунди замість 30 секунд для швидшої реакції
    const interval = setInterval(load, 3000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [found?.zone?.name, (hero as any)?.id]);

  if (!found) {
    return (
      <div
        className={
          isL2
            ? `${l2Frame} w-full min-w-0 my-1 px-4 py-8 flex items-center justify-center text-[#d4c4a8]`
            : "w-full text-[#c7ad80] flex items-center justify-center px-1 py-4"
        }
      >
        <div className="w-full text-center space-y-3 max-w-sm">
          <div className="text-xs font-semibold">Зона не знайдена.</div>
          <button
            type="button"
            className={
              isL2
                ? "h-9 px-5 rounded-md border border-[#5c4a32]/80 bg-gradient-to-b from-[#2e2619] to-[#14110c] text-xs text-[#c9a44c] hover:border-[#c7ad80]/50"
                : "h-8 px-4 rounded-md bg-[#2a2a2a] ring-1 ring-white/10 text-xs text-[#c7ad80]"
            }
            onClick={() => navigate("/gk")}
          >
            Телепорт
          </button>
        </div>
      </div>
    );
  }

  const { zone, city } = found;

  // Моби з активних квестів — показуємо сірим текстом (беремо з hero та heroJson на випадок гідрації)
  const activeQuests = React.useMemo(() => {
    const fromHero = hero?.activeQuests;
    const fromJson = (hero as any)?.heroJson?.activeQuests;
    if (Array.isArray(fromHero) && fromHero.length > 0) return fromHero;
    if (Array.isArray(fromJson) && fromJson.length > 0) return fromJson;
    return [];
  }, [hero?.activeQuests, (hero as any)?.heroJson?.activeQuests]);
  const activeQuestIdsKey = activeQuests.map((aq) => aq.questId).join(",");
  const questMobNames = React.useMemo(
    () => getQuestMobNames(activeQuests, QUESTS),
    [activeQuestIdsKey, activeQuests]
  );

  // ===== пагінація по мобах (з налаштувань: 10 15 20 25 30) =====
  const pageSize = getGameSettings().mobsPerPage ?? 15;
  const totalMobs = zone.mobs.length;
  const totalPages = Math.max(1, Math.ceil(totalMobs / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const visibleMobs: Mob[] = zone.mobs.slice(
    startIndex,
    startIndex + pageSize,
  );

  const goPage = (p: number) => {
    const safe = Math.min(Math.max(1, p), totalPages);
    setPage(safe);
    const params = new URLSearchParams(location.search);
    params.set("id", zone.id);
    params.set("page", String(safe));
    history.replaceState(null, "", `/location?${params.toString()}`);
  };

  const handleBackToCity = () => {
    // 🔥 Зберігаємо місто поточної зони — щоб City та ТП показували правильне місто
    savePreviousCity(city.id);
    // 🔥 Зберігаємо попередню локацію при переході в місто через телепорт
    if (zoneId) {
      savePreviousLocation(zoneId);
    }
    navigate("/gk");
  };

  const openBattle = (mobIndexInZone: number) => {
    navigate(`/battle?zone=${zone.id}&idx=${mobIndexInZone}`);
  };

  const mobNameClass = (
    isQuestMob: boolean,
    isRaid: boolean,
    isChampion: boolean,
    isLevelDiffTooHigh: boolean,
    l2: boolean,
  ) => {
    if (isQuestMob) return l2 ? "text-[#8a7a60]" : "";
    if (isRaid) return "text-red-500";
    if (isChampion) return "text-[#c9a44c]";
    if (isLevelDiffTooHigh) return "text-red-500";
    return l2 ? "text-[#e8dcc8]" : "text-[#c7ad80]";
  };

  return (
    <div
      className={
        isL2
          ? `${l2Frame} w-full min-w-0 my-1 px-3 py-3 text-[#d4c4a8]`
          : "w-full text-[#c7ad80] px-1 py-2"
      }
    >
      <div className={isL2 ? "w-full max-w-[420px] mx-auto" : ""}>
        {isL2 ? (
          <div className="mb-3 rounded-lg border border-[#5c4a32]/45 bg-black/22 px-3 py-2.5 shadow-[inset_0_1px_0_rgba(199,173,128,0.06)]">
            <div className="text-[10px] uppercase tracking-wider text-[#8a7a60]">{city.name}</div>
            <div className="mt-1 flex items-center gap-2 text-[#e8c56e] text-[15px] font-semibold leading-tight [text-shadow:0_1px_2px_rgba(0,0,0,0.85)]">
              <img src="/assets/travel.png" alt="" className="w-4 h-4 object-contain shrink-0 opacity-90" />
              <span>{zone.name}</span>
              <span className="text-[10px] font-normal text-[#a89878] ml-auto">L2</span>
            </div>
          </div>
        ) : (
          <div className="text-[#c7ad80] mb-2 text-base font-semibold flex items-center gap-2">
            <img src="/assets/travel.png" alt={zone.name} className="w-3 h-3 object-contain" />
            <span>{zone.name}</span>
          </div>
        )}

        <div className={isL2 ? "space-y-0 mb-1" : "space-y-0"}>
          {visibleMobs.length === 0 && (
            <div
              className={
                isL2
                  ? "text-[#8a7a60] text-xs py-6 text-center rounded-lg border border-[#5c4a32]/35 bg-black/15"
                  : "text-[#c7ad80]/60 text-xs py-4"
              }
            >
              У цій локації поки немає мобів.
            </div>
          )}

          {visibleMobs
            .map((mob, i) => {
              const globalIndex = startIndex + i;
              const heroName = hero?.name;
              const onRespawn = isMobOnRespawn(zone.id, globalIndex, heroName);
              if (onRespawn) return null;

              const isChampion =
                mob.name.startsWith("[Champion]") || mob.name.startsWith("[Чемпион]");
              const isRaid = (mob as any).isRaidBoss === true;
              const heroLevel = hero?.level || 1;
              const levelDiff = Math.abs(heroLevel - mob.level);
              const isLevelDiffTooHigh = levelDiff > 10;
              const isQuestMob = questMobNames.has(mob.name);
              const nameCls = mobNameClass(
                isQuestMob,
                isRaid,
                isChampion,
                isLevelDiffTooHigh,
                isL2,
              );
              const listIconSrc = getMobListIconSrc(mob);

              if (isL2) {
                return (
                  <div
                    key={globalIndex}
                    role="button"
                    tabIndex={0}
                    className={l2MobCard}
                    onClick={() => openBattle(globalIndex)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openBattle(globalIndex);
                      }
                    }}
                  >
                    <div className="flex items-center gap-2.5 w-full">
                      <div className="relative w-9 h-9 shrink-0 rounded-md border border-[#5c4a32]/50 bg-black/35 flex items-center justify-center overflow-hidden p-0.5">
                        {listIconSrc ? (
                          <img
                            src={listIconSrc}
                            alt=""
                            className="max-w-[26px] max-h-[26px] w-full h-full object-contain object-center"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <span className="text-[10px] text-[#5c4a32]">—</span>
                        )}
                      </div>
                      <button
                        type="button"
                        className="text-[10px] text-[#7d9b7a] hover:text-[#c8e4c4] shrink-0 underline-offset-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMob(mob);
                        }}
                      >
                        (і)
                      </button>
                      <div className="flex-1 min-w-0 text-left">
                        <div className={`text-[12px] font-medium leading-snug truncate ${nameCls}`}>
                          {mob.name}
                        </div>
                        {isQuestMob && (
                          <div className="text-[9px] text-[#6b7280] mt-0.5">квест</div>
                        )}
                      </div>
                      <div className="shrink-0 text-right rounded-md bg-black/30 border border-[#5c4a32]/40 px-2 py-1 min-w-[3.25rem]">
                        <div className="text-[11px] font-semibold text-[#c45c5c] leading-none">
                          [{mob.level}]
                        </div>
                        <div className="text-[10px] text-[#a89878] mt-1 leading-none tabular-nums">
                          {mob.hp}/{mob.hp}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={globalIndex}
                  className={`flex items-center gap-2 py-1 border-b border-solid border-white/50 text-xs ${
                    !isQuestMob && isLevelDiffTooHigh ? "text-red-500" : "text-[#c7ad80]"
                  }`}
                >
                  {listIconSrc && (
                    <img
                      src={listIconSrc}
                      alt=""
                      className="w-4 h-4 object-contain flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                  <span
                    className="text-green-500 cursor-pointer hover:text-green-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMob(mob);
                    }}
                  >
                    (і)
                  </span>
                  <span
                    className={`flex-1 cursor-pointer hover:text-[#f4e2b8] ${nameCls}`}
                    style={isQuestMob ? { color: "#6b7280" } : undefined}
                    onClick={() => openBattle(globalIndex)}
                  >
                    {mob.name}
                  </span>
                  <span className="text-red-500">[{mob.level}]</span>
                  <span className="text-red-500">
                    ({mob.hp}/{mob.hp})
                  </span>
                </div>
              );
            })
            .filter(Boolean)}
        </div>

        {totalPages > 1 && (
          <div
            className={
              isL2
                ? "flex items-center justify-center gap-3 mt-3 rounded-md border border-[#5c4a32]/45 bg-black/20 px-2 py-2 text-[11px] text-[#d4c4a8]"
                : "flex items-center justify-center gap-2 mt-2 text-[#c7ad80] text-xs"
            }
          >
            <button
              type="button"
              className={
                isL2
                  ? "px-2 py-1 rounded disabled:opacity-40 hover:text-[#f4e2b8]"
                  : "disabled:opacity-40"
              }
              disabled={currentPage <= 1}
              onClick={() => goPage(currentPage - 1)}
            >
              &lt;&lt;&lt;
            </button>
            <span className={isL2 ? "text-[#5c4a32]" : ""}>|</span>
            <button
              type="button"
              className={
                isL2
                  ? "px-2 py-1 rounded disabled:opacity-40 hover:text-[#f4e2b8]"
                  : "disabled:opacity-40"
              }
              disabled={currentPage >= totalPages}
              onClick={() => goPage(currentPage + 1)}
            >
              &gt;&gt;&gt;
            </button>
          </div>
        )}

        {zonePlayers.length > 0 && (
          <div
            className={
              isL2
                ? "mt-3 rounded-lg border border-[#5c4a32]/40 bg-black/15 px-2 py-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px]"
                : "mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px]"
            }
          >
            {zonePlayers.map((p) => (
              <div
                key={p.id}
                className={
                  isL2
                    ? "inline-flex items-center gap-1 text-[#c7ad80]"
                    : "inline-flex items-center gap-1 text-[#c7ad80]"
                }
              >
                <button
                  type="button"
                  className="hover:text-[#f4e2b8]"
                  style={p.nickColor ? { color: p.nickColor } : undefined}
                  onClick={() => navigate(`/player/${encodeURIComponent(p.id)}?pk=1`)}
                >
                  {p.name}
                </button>
                <button
                  type="button"
                  className="text-red-500 hover:text-red-400"
                  onClick={() => {
                    const diff = Math.abs((hero?.level || 1) - p.level);
                    if (diff > 20) {
                      showToast(
                        "Нельзя атаковать игрока, если разница уровней больше 20!",
                        "error",
                      );
                      return;
                    }
                    navigate(`/player/${encodeURIComponent(p.id)}?pk=1`);
                  }}
                >
                  [pk]
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-center mt-3">
          <button
            type="button"
            className={
              isL2
                ? "px-5 py-2.5 rounded-md border border-[#5c4a32]/80 bg-gradient-to-b from-[#2e2619] to-[#14110c] text-xs text-[#d4c4a8] shadow-[inset_0_1px_0_rgba(199,173,128,0.1)] hover:border-[#c7ad80]/45 hover:text-[#f4e2b8] active:scale-[0.99] transition-[border-color,color,transform] duration-150"
                : "px-4 py-2 rounded-md bg-[#2a2a2a] ring-1 ring-white/10 text-xs text-[#c7ad80] hover:bg-[#3a3a3a]"
            }
            onClick={handleBackToCity}
          >
            Назад
          </button>
        </div>
      </div>

        {/* Модальне вікно з інформацією про моба */}
        {selectedMob && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
            onClick={() => setSelectedMob(null)}
          >
            <div
              className={
                isL2
                  ? "rounded-xl border border-[#c7ad80]/35 p-4 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-[0_16px_48px_rgba(0,0,0,0.65)] bg-[radial-gradient(ellipse_100%_80%_at_50%_0%,rgba(120,90,45,0.22)_0%,transparent_55%),linear-gradient(180deg,#1c1812_0%,#0c0a08_100%)]"
                  : "bg-[#14110c] border border-white/40 rounded-lg p-4 max-w-md w-full max-h-[90vh] overflow-y-auto"
              }
              onClick={(e) => e.stopPropagation()}
            >
              {/* Заголовок */}
              <div className="flex items-center justify-between mb-2">
                <h2
                  className={
                    isL2
                      ? "text-base font-semibold text-[#e8c56e] [text-shadow:0_1px_2px_rgba(0,0,0,0.9)]"
                      : "text-lg font-semibold text-[#b8860b]"
                  }
                >
                  {selectedMob.name}
                </h2>
                <button
                  type="button"
                  className={
                    isL2
                      ? "text-[#8a7a60] hover:text-[#d4c4a8] text-xl leading-none"
                      : "text-gray-400 hover:text-white text-xl"
                  }
                  onClick={() => setSelectedMob(null)}
                >
                  ×
                </button>
              </div>

              {/* Основна інформація */}
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Рівень:</span>
                  <span className="text-red-500">{selectedMob.level}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-gray-400">HP:</span>
                  <span className="text-red-500">{selectedMob.hp}</span>
                </div>

                {selectedMob.mp > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">MP:</span>
                    <span className="text-blue-500">{selectedMob.mp}</span>
                  </div>
                )}

                {/* Стати */}
                <div className="border-t border-white/40 pt-2 mt-2">
                  <div className="text-sm font-semibold text-[#b8860b] mb-2">Стати:</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">Физ. атака:</span>
                      <span className="text-red-400">{selectedMob.pAtk ?? 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">Маг. атака:</span>
                      <span className="text-purple-400">{selectedMob.mAtk ?? 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">Физ. захист:</span>
                      <span className="text-blue-400">{selectedMob.pDef ?? 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">Маг. захист:</span>
                      <span className="text-cyan-400">{selectedMob.mDef ?? 0}</span>
                    </div>
                  </div>
                </div>

                {/* Досвід та валюта */}
                <div className="border-t border-white/40 pt-2 mt-2">
                  <div className="text-sm font-semibold text-[#b8860b] mb-2">Нагороди:</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">Досвід:</span>
                      <span className="text-green-400">{selectedMob.exp}</span>
                    </div>
                    {selectedMob.sp !== undefined && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">SP:</span>
                        <span className="text-blue-400">{selectedMob.sp}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">Adena:</span>
                      <span className="text-yellow-400">
                        {selectedMob.adenaMin} - {selectedMob.adenaMax}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Дроп — для Floran зон використовуємо профіль дропу (опис = фактичний дроп) */}
                {(() => {
                  const isFloranZone = zone.id?.startsWith("floran");
                  const floranProfile = isFloranZone ? getFloranMobDropProfile(selectedMob) : undefined;
                  const displayDrops = floranProfile
                    ? floranProfile.items.map((item) => ({ id: item.itemId, min: item.min, max: item.max, chance: item.chance }))
                    : (selectedMob.drops ?? []);
                  return displayDrops.length > 0 && (
                  <div className="border-t border-white/40 pt-2 mt-2">
                    <div className="text-sm font-semibold text-[#b8860b] mb-2">Дроп:</div>
                    <div className="space-y-1">
                      {displayDrops.map((drop: { id: string; min: number; max: number; chance: number }, idx: number) => {
                        const itemDef = itemsDB[drop.id];
                        const iconPath = itemDef?.icon 
                          ? (itemDef.icon.startsWith("/") ? itemDef.icon : `/items/${itemDef.icon}`)
                          : "/items/default_item.png"; // Fallback іконка
                        const itemName = itemDef?.name || drop.id;
                        // Показуємо грейд тільки для зброї та броні, не для ресурсів
                        const isResource = itemDef?.kind === "resource" || itemDef?.kind === "other";
                        // Використовуємо grade з itemsDB, якщо є, інакше autoDetectGrade (яка також перевіряє itemsDB)
                        const itemGrade = !isResource ? (itemDef?.grade ?? autoDetectGrade(drop.id)) : null;
                        const gradeDisplay = itemGrade ? ` [${itemGrade}]` : "";
                        
                        return (
                          <div 
                            key={idx} 
                            className="flex items-center gap-2 cursor-pointer hover:bg-gray-800/50 p-1 rounded transition-colors"
                            onClick={() => itemDef && setSelectedDropItem(drop.id)}
                          >
                            <img
                              src={iconPath}
                              alt={itemName}
                              className="w-5 h-5 object-contain border border-white/40 bg-black/40"
                              onError={(e) => {
                                // Якщо іконка не завантажилась, приховуємо її
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                            <span className="text-gray-400 flex-1 hover:text-[#b8860b] transition-colors">
                              {itemName}{gradeDisplay}:
                            </span>
                            <span className="text-green-400">
                              {drop.min}-{drop.max} ({Math.round(drop.chance * 100)}%)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  );
                })()}

                {/* Спойл */}
                {selectedMob.spoil && selectedMob.spoil.length > 0 && (
                  <div className="border-t border-white/40 pt-2 mt-2">
                    <div className="text-sm font-semibold text-[#b8860b] mb-2">Спойл:</div>
                    <div className="space-y-1">
                      {selectedMob.spoil.map((spoil, idx) => {
                        const itemDef = itemsDB[spoil.id];
                        const iconPath = itemDef?.icon 
                          ? (itemDef.icon.startsWith("/") ? itemDef.icon : `/items/${itemDef.icon}`)
                          : "/items/default_item.png"; // Fallback іконка
                        const itemName = itemDef?.name || spoil.id;
                        // Показуємо грейд тільки для зброї та броні, не для ресурсів
                        const isResource = itemDef?.kind === "resource" || itemDef?.kind === "other";
                        // Використовуємо grade з itemsDB, якщо є, інакше autoDetectGrade (яка також перевіряє itemsDB)
                        const itemGrade = !isResource ? (itemDef?.grade ?? autoDetectGrade(spoil.id)) : null;
                        const gradeDisplay = itemGrade ? ` [${itemGrade}]` : "";
                        
                        return (
                          <div 
                            key={idx} 
                            className="flex items-center gap-2 cursor-pointer hover:bg-gray-800/50 p-1 rounded transition-colors"
                            onClick={() => itemDef && setSelectedDropItem(spoil.id)}
                          >
                            <img
                              src={iconPath}
                              alt={itemName}
                              className="w-5 h-5 object-contain border border-white/40 bg-black/40"
                              onError={(e) => {
                                // Якщо іконка не завантажилась, приховуємо її
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                            <span className="text-gray-400 flex-1 hover:text-[#b8860b] transition-colors">
                              {itemName}{gradeDisplay}:
                            </span>
                            <span className="text-yellow-400">
                              {spoil.min}-{spoil.max} ({Math.round(spoil.chance * 100)}%)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Кнопка закриття */}
                <div className="flex justify-center mt-2 pt-2 border-t border-white/40">
                  <button
                    type="button"
                    className={
                      isL2
                        ? "px-4 py-2 rounded-md border border-[#5c4a32]/70 bg-[#2a2620] text-xs text-[#c9a44c] hover:border-[#c7ad80]/40"
                        : "px-4 py-2 rounded-md bg-[#2a2a2a] ring-1 ring-white/10 text-xs text-[#b8860b] hover:bg-[#3a3a3a]"
                    }
                    onClick={() => setSelectedMob(null)}
                  >
                    Закрити
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Модалка для перегляду предмета з дропу */}
      {selectedDropItem && (() => {
        const itemDef = itemsDB[selectedDropItem];
        if (!itemDef) return null;

        const iconPath = itemDef.icon 
          ? (itemDef.icon.startsWith("/") ? itemDef.icon : `/items/${itemDef.icon}`)
          : "/items/default_item.png";
        const isResource = itemDef.kind === "resource" || itemDef.kind === "other";
        const itemGrade = !isResource ? (itemDef.grade ?? autoDetectGrade(selectedDropItem)) : null;

        return (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" 
            onClick={() => setSelectedDropItem(null)}
          >
            <div
              className={
                isL2
                  ? "rounded-xl border border-[#c7ad80]/35 p-4 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-[0_16px_48px_rgba(0,0,0,0.65)] bg-[radial-gradient(ellipse_100%_80%_at_50%_0%,rgba(120,90,45,0.22)_0%,transparent_55%),linear-gradient(180deg,#1c1812_0%,#0c0a08_100%)]"
                  : "bg-[#14110c] border border-white/40 rounded-lg p-4 max-w-md w-full max-h-[90vh] overflow-y-auto"
              }
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-2">
                <h2
                  className={
                    isL2
                      ? "text-base font-semibold text-[#e8c56e] [text-shadow:0_1px_2px_rgba(0,0,0,0.9)]"
                      : "text-lg font-semibold text-[#b8860b]"
                  }
                >
                  {itemDef.name} {itemGrade && `[${itemGrade}]`}
                </h2>
                <button
                  type="button"
                  className={
                    isL2
                      ? "text-[#8a7a60] hover:text-[#d4c4a8] text-xl leading-none"
                      : "text-gray-400 hover:text-white text-xl"
                  }
                  onClick={() => setSelectedDropItem(null)}
                >
                  ×
                </button>
              </div>

              {/* Іконка та основна інформація */}
              <div className="flex items-center gap-3 mb-2">
                <img
                  src={iconPath}
                  alt={itemDef.name}
                  className="w-16 h-16 object-contain border border-white/40 bg-black/40"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/items/drops/Weapon_squires_sword_i00_0.jpg";
                  }}
                />
                <div className="flex-1 space-y-1 text-xs">
                  {itemDef.kind && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">Тип:</span>
                      <span className="text-gray-300 capitalize">{itemDef.kind}</span>
                    </div>
                  )}
                  {itemGrade && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">Грейд:</span>
                      <span className="text-[#b8860b]">{itemGrade}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Стати */}
              {itemDef.stats && Object.keys(itemDef.stats).length > 0 && (
                <div className="border-t border-white/40 pt-2 mt-2 mb-2">
                  <div className="text-sm font-semibold text-[#b8860b] mb-2">Стати:</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {itemDef.stats.pAtk !== undefined && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Физ. атака:</span>
                        <span className="text-red-400">{itemDef.stats.pAtk}</span>
                      </div>
                    )}
                    {itemDef.stats.mAtk !== undefined && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Маг. атака:</span>
                        <span className="text-purple-400">{itemDef.stats.mAtk}</span>
                      </div>
                    )}
                    {itemDef.stats.pDef !== undefined && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Физ. захист:</span>
                        <span className="text-blue-400">{itemDef.stats.pDef}</span>
                      </div>
                    )}
                    {itemDef.stats.mDef !== undefined && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Маг. захист:</span>
                        <span className="text-cyan-400">{itemDef.stats.mDef}</span>
                      </div>
                    )}
                    {itemDef.stats.rCrit !== undefined && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Крит:</span>
                        <span className="text-purple-400">{itemDef.stats.rCrit}</span>
                      </div>
                    )}
                    {itemDef.stats.pAtkSpd !== undefined && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Скорость боя:</span>
                        <span className="text-yellow-400">{itemDef.stats.pAtkSpd}</span>
                      </div>
                    )}
                    {itemDef.stats.castSpeed !== undefined && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Скорость каста:</span>
                        <span className="text-yellow-400">+{itemDef.stats.castSpeed}</span>
                      </div>
                    )}
                    {itemDef.stats.maxHp !== undefined && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Max HP:</span>
                        <span className="text-red-400">+{itemDef.stats.maxHp}</span>
                      </div>
                    )}
                    {itemDef.stats.maxMp !== undefined && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Max MP:</span>
                        <span className="text-blue-400">+{itemDef.stats.maxMp}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Інформація про сет — не показуємо, якщо немає бонусів */}
              {(() => {
                const set = findSetForItem(selectedDropItem);
                if (!set) return null;
                if (!set.bonuses.fullSet && !set.bonuses.setStats && (!set.bonuses.partialSet || set.bonuses.partialSet.length === 0)) return null;

                const bonusesList: string[] = [];
                bonusesList.push(...formatSetStatsForDisplay(set.bonuses.setStats));
                if (set.bonuses.fullSet) {
                  const bonuses = set.bonuses.fullSet;
                  if (bonuses.maxHp) bonusesList.push(`+${bonuses.maxHp} Max HP`);
                  if (bonuses.maxMp) bonusesList.push(`+${bonuses.maxMp} Max MP`);
                  if (bonuses.maxCp) bonusesList.push(`+${bonuses.maxCp} Max CP`);
                  if (bonuses.pDef) bonusesList.push(`+${bonuses.pDef} Физ. захист`);
                  if (bonuses.mDef) bonusesList.push(`+${bonuses.mDef} Маг. захист`);
                  if (bonuses.hpRegen) bonusesList.push(`+${bonuses.hpRegen} Реген HP`);
                  if (bonuses.mpRegen) bonusesList.push(`+${bonuses.mpRegen} Реген MP`);
                  if (bonuses.attackSpeed) bonusesList.push(`+${bonuses.attackSpeed} Скорость атаки`);
                  if (bonuses.castSpeed) bonusesList.push(`+${bonuses.castSpeed} Скорость каста`);
                  if (bonuses.pAtk) bonusesList.push(`+${bonuses.pAtk} Физ. атака`);
                  if (bonuses.mAtk) bonusesList.push(`+${bonuses.mAtk} Маг. атака`);
                  if (bonuses.crit) {
                    const critPercent = Math.round(bonuses.crit / 10);
                    bonusesList.push(`+${critPercent}% Крит`);
                  }
                  if (bonuses.critRate) bonusesList.push(`+${bonuses.critRate}% Крит`);
                  if (bonuses.critPower) bonusesList.push(`+${bonuses.critPower} Сила крита`);
                  if (bonuses.skillCritRate) bonusesList.push(`+${bonuses.skillCritRate}% Шанс маг крита`);
                  if (bonuses.pDefPercent) bonusesList.push(`+${bonuses.pDefPercent}% Физ. защ`);
                  if (bonuses.mDefPercent) bonusesList.push(`+${bonuses.mDefPercent}% Маг. защ`);
                  if (bonuses.maxHpPercent) bonusesList.push(`+${bonuses.maxHpPercent}% Max HP`);
                  if (bonuses.accuracy) bonusesList.push(`+${bonuses.accuracy} Точність`);
                }

                return (
                  <div className="border-t border-white/40 pt-2 mt-2 mb-2">
                    <div className="text-sm font-semibold text-[#b8860b] mb-2">
                      Сет: {set.name} [{set.grade}]
                    </div>
                    <div className="text-xs text-gray-400 mb-2">
                      Частини сету ({set.pieces.length}): {set.pieces.map(p => {
                        const pieceDef = itemsDB[p.itemId];
                        return pieceDef?.name || p.itemId;
                      }).join(", ")}
                    </div>
                    {bonusesList.length > 0 && (
                      <div className="text-xs text-yellow-400">
                        <div className="font-semibold mb-1">Бонуси повного сету:</div>
                        <div><span className="text-purple-400">{bonusesList.join(", ")}</span></div>
                      </div>
                    )}
                    {set.bonuses.partialSet && set.bonuses.partialSet.length > 0 && (
                      <div className="text-xs text-yellow-300 mt-2">
                        {set.bonuses.partialSet.map((partial, idx) => {
                          const partialBonuses: string[] = [];
                          if (partial.bonuses.maxHp) partialBonuses.push(`+${partial.bonuses.maxHp} Max HP`);
                          if (partial.bonuses.pDef) partialBonuses.push(`+${partial.bonuses.pDef} Физ. защ`);
                          if (partial.bonuses.mDef) partialBonuses.push(`+${partial.bonuses.mDef} Маг. защ`);
                          if (partial.bonuses.pAtk) partialBonuses.push(`+${partial.bonuses.pAtk} Физ. атака`);
                          if (partial.bonuses.mAtk) partialBonuses.push(`+${partial.bonuses.mAtk} Маг. атака`);
                          return partialBonuses.length > 0 ? (
                            <div key={idx} className="mb-1">
                              <span className="font-semibold">Частковий сет ({partial.pieces} частин):</span> <span className="text-purple-400">{partialBonuses.join(", ")}</span>
                            </div>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Опис предмета */}
              {itemDef.description && (
                <div className="border-t border-white/40 pt-2 mt-2 mb-2">
                  <div className="text-sm font-semibold text-[#b8860b] mb-2">Опис:</div>
                  <div className="text-gray-300 text-xs">
                    {itemDef.description}
                  </div>
                </div>
              )}

              {/* Кнопка закриття */}
              <div className="flex justify-center pt-2 border-t border-white/40">
                <button
                  type="button"
                  onClick={() => setSelectedDropItem(null)}
                  className={
                    isL2
                      ? "px-4 py-2 rounded-md border border-[#5c4a32]/70 bg-[#2a2620] text-xs text-[#c9a44c] hover:border-[#c7ad80]/40"
                      : "px-4 py-2 rounded-md bg-[#2a2a2a] ring-1 ring-white/10 text-xs text-[#b8860b] hover:bg-[#3a3a3a]"
                  }
                >
                  Закрити
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
