// src/screens/Location.tsx
import React from "react";
import { locations as WORLD_LOCATIONS, DEFAULT_PLAYER_CITY_ID } from "../data/world";
import type { Zone, Mob } from "../data/world/types";
import { useHeroStore } from "../state/heroStore";
import { ensureWorldZoneLoaded, subscribeWorldMobHpCache } from "../state/worldMobHpStore";
import { isMobOnRespawn, getRespawnTimeRemaining } from "../state/battle/mobRespawns";
import { savePreviousLocation, savePreviousCity } from "../utils/locationNavigation";
import { getQuestMobHighlightForMob } from "../utils/quests/questMobHighlight";
import { mergeActiveQuestsForUi } from "../utils/quests/mergeActiveQuestsForUi";
import {
  QUESTS,
  ELVEN_MYSTIC_FIRST_PROF_QUEST_ID,
  ELVEN_FIGHTER_FIRST_PROF_QUEST_ID,
  HUMAN_FIGHTER_FIRST_PROF_QUEST_ID,
  HUMAN_MYSTIC_FIRST_PROF_QUEST_ID,
  DARK_FIGHTER_FIRST_PROF_QUEST_ID,
  DARK_MYSTIC_FIRST_PROF_QUEST_ID,
  ORC_FIGHTER_FIRST_PROF_QUEST_ID,
  ORC_MYSTIC_FIRST_PROF_QUEST_ID,
  DWARVEN_FIGHTER_FIRST_PROF_QUEST_ID,
  GLUDIO_SHADOW_WEAPON_QUEST_ID,
  isHeroElvenMysticBaseForFirstProfQuest,
  isHeroElvenFighterBaseForFirstProfQuest,
  isHeroHumanFighterBaseForFirstProfQuest,
  isHeroHumanMysticBaseForFirstProfQuest,
  isHeroDarkFighterBaseForFirstProfQuest,
  isHeroDarkMysticBaseForFirstProfQuest,
  isHeroOrcFighterBaseForFirstProfQuest,
  isHeroOrcMysticBaseForFirstProfQuest,
  isHeroDwarvenFighterBaseForFirstProfQuest,
} from "../data/quests";
import { getOnlinePlayers, sendHeartbeat, type OnlinePlayer } from "../utils/api";
import { getGameSettings } from "../state/gameSettings";
import { showToast } from "../state/toastStore";
import { isWarmCityUi, getCityUiVariant } from "../utils/cityUiVariant";
import { displayCityName, displayMobName, displayZoneName, displayZoneLore } from "../utils/worldDisplay";
import { useGameSettingsVersion } from "../hooks/useGameSettingsVersion";
import { getMobListIconSrc } from "../utils/mobPublicIcon";
import { isChampionMob } from "../utils/mobs/isChampionMob";
import { isL2EpicRaidBossMob } from "../data/world/l2dop/epicRaidBosses";
import { useLocationSearchParams, getMobWorldHpDisplay, findZoneById } from "./location/locationZoneDropUtils";
import {
  findFirstAggroPatrolMob,
  runAggressivePatrolHit,
  type PatrolTickCtx,
  type PatrolAggroBanner,
} from "./location/locationPatrolAggro";
import { L2_LOCATION_FRAME, L2_LOCATION_MOB_CARD } from "../utils/l2WarmLayoutClassNames";
import { LocationMobDetailModal } from "./location/LocationMobDetailModal";
import { LocationDropInspectModal } from "./location/LocationDropInspectModal";
import { LocationQuestHelperBanners } from "./location/LocationQuestHelperBanners";

type Navigate = (path: string) => void;

export default function LocationScreen({ navigate }: { navigate: Navigate }) {
  useGameSettingsVersion();
  const q = useLocationSearchParams();
  const hero = useHeroStore((s) => s.hero);
  const updateHero = useHeroStore((s) => s.updateHero);
  const isL2 = isWarmCityUi(getCityUiVariant());
  const l2Frame = L2_LOCATION_FRAME;
  const l2MobCard = L2_LOCATION_MOB_CARD;

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
  const [patrolAggroBanner, setPatrolAggroBanner] = React.useState<PatrolAggroBanner | null>(null);
  const [gludioQuestHintDismissed, setGludioQuestHintDismissed] = React.useState(
    () => typeof localStorage !== "undefined" && localStorage.getItem("gludio_quest_tab_hint") === "1"
  );
  const [shadowWeaponQuestHintDismissed, setShadowWeaponQuestHintDismissed] = React.useState(
    () =>
      typeof localStorage !== "undefined" &&
      localStorage.getItem("gludio_shadow_weapon_quest_hint") === "1"
  );
  const [elvenFirstProfHelperDismissed, setElvenFirstProfHelperDismissed] = React.useState(
    () =>
      typeof localStorage !== "undefined" &&
      localStorage.getItem("elven_mystic_first_prof_helper_18") === "1"
  );
  const [elvenFighterFirstProfHelperDismissed, setElvenFighterFirstProfHelperDismissed] = React.useState(
    () =>
      typeof localStorage !== "undefined" &&
      localStorage.getItem("elven_fighter_first_prof_helper_18") === "1"
  );
  const [humanFighterFirstProfHelperDismissed, setHumanFighterFirstProfHelperDismissed] = React.useState(
    () =>
      typeof localStorage !== "undefined" &&
      localStorage.getItem("human_fighter_first_prof_helper_18_gludin") === "1"
  );
  const [humanMysticFirstProfHelperDismissed, setHumanMysticFirstProfHelperDismissed] = React.useState(
    () =>
      typeof localStorage !== "undefined" &&
      localStorage.getItem("human_mystic_first_prof_helper_18_gludin") === "1"
  );
  const [darkFighterFirstProfHelperDismissed, setDarkFighterFirstProfHelperDismissed] = React.useState(
    () =>
      typeof localStorage !== "undefined" &&
      localStorage.getItem("dark_fighter_first_prof_helper_18_floran") === "1"
  );
  const [darkMysticFirstProfHelperDismissed, setDarkMysticFirstProfHelperDismissed] = React.useState(
    () =>
      typeof localStorage !== "undefined" &&
      localStorage.getItem("dark_mystic_first_prof_helper_18_floran") === "1"
  );
  const [orcFighterFirstProfHelperDismissed, setOrcFighterFirstProfHelperDismissed] = React.useState(
    () =>
      typeof localStorage !== "undefined" &&
      localStorage.getItem("orc_fighter_first_prof_helper_18_gludin") === "1"
  );
  const [orcMysticFirstProfHelperDismissed, setOrcMysticFirstProfHelperDismissed] = React.useState(
    () =>
      typeof localStorage !== "undefined" &&
      localStorage.getItem("orc_mystic_first_prof_helper_18_gludin") === "1"
  );
  const [dwarvenFighterFirstProfHelperDismissed, setDwarvenFighterFirstProfHelperDismissed] = React.useState(
    () =>
      typeof localStorage !== "undefined" &&
      localStorage.getItem("dwarven_fighter_first_prof_helper_18_gludin") === "1"
  );

  const [, setWorldMobHpBump] = React.useState(0);
  React.useEffect(() => {
    return subscribeWorldMobHpCache(() => setWorldMobHpBump((n) => n + 1));
  }, []);

  React.useEffect(() => {
    if (!zoneId) return;
    void ensureWorldZoneLoaded(zoneId);
  }, [zoneId]);

  React.useEffect(() => {
    if (!zoneId) return;
    const onVis = () => {
      if (document.visibilityState === "visible") {
        void ensureWorldZoneLoaded(zoneId);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [zoneId]);

  const patrolCtx = React.useMemo((): PatrolTickCtx | null => {
    if (!zoneId) return null;
    const z = WORLD_LOCATIONS.find((l) => l.id === zoneId);
    if (!z) return null;
    const pageSize = getGameSettings().mobsPerPage ?? 15;
    const totalPages = Math.max(1, Math.ceil(z.mobs.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const start = (currentPage - 1) * pageSize;
    const visible = z.mobs.slice(start, start + pageSize);
    return { zone: z, start, visible, currentPage };
  }, [zoneId, page]);

  const patrolCtxRef = React.useRef(patrolCtx);
  patrolCtxRef.current = patrolCtx;

  /** Агро-патруль на поточній сторінці: раз на 3 с, 100% удар (перший моб у списку).
   *  Не залежимо від hero.hp у deps — інакше банер скидався після кожного удару. */
  React.useEffect(() => {
    setPatrolAggroBanner(null);
    if (!patrolCtx || !hero?.name) return;
    if ((hero.hp ?? 0) <= 0) return;
    if (!findFirstAggroPatrolMob(patrolCtx, hero.name)) return;
    const tick = () => {
      const c = patrolCtxRef.current;
      if (!c) return;
      const h = useHeroStore.getState().hero;
      if (!h?.name || (h.hp ?? 0) <= 0) {
        setPatrolAggroBanner(null);
        return;
      }
      if (!findFirstAggroPatrolMob(c, h.name)) {
        setPatrolAggroBanner(null);
        return;
      }
      const hit = runAggressivePatrolHit(c);
      if (!hit) return;
      if (hit.died) {
        setPatrolAggroBanner(null);
        return;
      }
      if (hit.banner) setPatrolAggroBanner(hit.banner);
    };
    const id = window.setInterval(tick, 3000);
    return () => clearInterval(id);
  }, [patrolCtx, hero?.name]);

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

  /** Елітні зони Годдарта: 5% засідка при відкритті — один випадковий моб (не РБ). Без aggressiveGroup бій лише з обраним мобом. */
  React.useEffect(() => {
    const z = found?.zone;
    const hn = hero?.name;
    if (!z || !hn || (hero?.hp ?? 0) <= 0) return;
    const chance = z.entryAmbushChance;
    if (typeof chance !== "number" || chance <= 0) return;
    const key = `loc_ambush_${z.id}_${hn}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    if (Math.random() >= chance) return;
    const indices: number[] = [];
    for (let i = 0; i < z.mobs.length; i++) {
      const m = z.mobs[i] as Mob & { isRaidBoss?: boolean };
      if (m.isRaidBoss) continue;
      if (isMobOnRespawn(z.id, i, hn)) continue;
      indices.push(i);
    }
    if (!indices.length) return;
    const idx = indices[Math.floor(Math.random() * indices.length)];
    navigate(`/battle?zone=${encodeURIComponent(z.id)}&idx=${idx}`);
  }, [found?.zone, hero?.name, navigate]);

  React.useEffect(() => {
    return () => {
      const z = found?.zone;
      const hn = hero?.name;
      if (z?.id && hn) sessionStorage.removeItem(`loc_ambush_${z.id}_${hn}`);
    };
  }, [found?.zone?.id, found?.zone, hero?.name]);

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
  const zoneLoreText = displayZoneLore(zone.id);

  // Моби з активних квестів — показуємо сірим текстом (беремо з hero та heroJson на випадок гідрації)
  const activeQuests = React.useMemo(() => {
    return mergeActiveQuestsForUi(hero?.activeQuests, (hero as any)?.heroJson?.activeQuests);
  }, [hero?.activeQuests, (hero as any)?.heroJson?.activeQuests]);

  const currentCityIdLoc =
    String((hero as any)?.heroJson?.currentCityId || "").trim() || DEFAULT_PLAYER_CITY_ID;
  const showShadowWeaponQuestHint =
    !!hero &&
    (hero.level ?? 1) >= 19 &&
    (currentCityIdLoc === "l2dop_gludio" || String(zone.id).startsWith("l2dop_gludio")) &&
    !(hero.completedQuests || []).includes(GLUDIO_SHADOW_WEAPON_QUEST_ID) &&
    !activeQuests.some((a) => a.questId === GLUDIO_SHADOW_WEAPON_QUEST_ID) &&
    !shadowWeaponQuestHintDismissed;

  const showElvenFirstProfLocationHelper =
    !!hero &&
    (hero.level ?? 1) >= 18 &&
    isHeroElvenMysticBaseForFirstProfQuest(hero) &&
    !(hero.completedQuests || []).includes(ELVEN_MYSTIC_FIRST_PROF_QUEST_ID) &&
    !elvenFirstProfHelperDismissed;

  const showElvenFighterFirstProfLocationHelper =
    !!hero &&
    (hero.level ?? 1) >= 18 &&
    isHeroElvenFighterBaseForFirstProfQuest(hero) &&
    !(hero.completedQuests || []).includes(ELVEN_FIGHTER_FIRST_PROF_QUEST_ID) &&
    !elvenFighterFirstProfHelperDismissed;

  const isGludinVillageZone = zone.id.startsWith("gludin_village");
  const showHumanFighterFirstProfLocationHelper =
    isGludinVillageZone &&
    !!hero &&
    (hero.level ?? 1) >= 18 &&
    isHeroHumanFighterBaseForFirstProfQuest(hero) &&
    !(hero.completedQuests || []).includes(HUMAN_FIGHTER_FIRST_PROF_QUEST_ID) &&
    !humanFighterFirstProfHelperDismissed;
  const showHumanMysticFirstProfLocationHelper =
    isGludinVillageZone &&
    !!hero &&
    (hero.level ?? 1) >= 18 &&
    isHeroHumanMysticBaseForFirstProfQuest(hero) &&
    !(hero.completedQuests || []).includes(HUMAN_MYSTIC_FIRST_PROF_QUEST_ID) &&
    !humanMysticFirstProfHelperDismissed;
  const showOrcFighterFirstProfLocationHelper =
    isGludinVillageZone &&
    !!hero &&
    (hero.level ?? 1) >= 18 &&
    isHeroOrcFighterBaseForFirstProfQuest(hero) &&
    !(hero.completedQuests || []).includes(ORC_FIGHTER_FIRST_PROF_QUEST_ID) &&
    !orcFighterFirstProfHelperDismissed;
  const showOrcMysticFirstProfLocationHelper =
    isGludinVillageZone &&
    !!hero &&
    (hero.level ?? 1) >= 18 &&
    isHeroOrcMysticBaseForFirstProfQuest(hero) &&
    !(hero.completedQuests || []).includes(ORC_MYSTIC_FIRST_PROF_QUEST_ID) &&
    !orcMysticFirstProfHelperDismissed;
  const showDwarvenFighterFirstProfLocationHelper =
    isGludinVillageZone &&
    !!hero &&
    (hero.level ?? 1) >= 18 &&
    isHeroDwarvenFighterBaseForFirstProfQuest(hero) &&
    !(hero.completedQuests || []).includes(DWARVEN_FIGHTER_FIRST_PROF_QUEST_ID) &&
    !dwarvenFighterFirstProfHelperDismissed;

  const isFloranVillageZone = zone.id.startsWith("floran_village");
  const showDarkFighterFirstProfLocationHelper =
    isFloranVillageZone &&
    !!hero &&
    (hero.level ?? 1) >= 18 &&
    isHeroDarkFighterBaseForFirstProfQuest(hero) &&
    !(hero.completedQuests || []).includes(DARK_FIGHTER_FIRST_PROF_QUEST_ID) &&
    !darkFighterFirstProfHelperDismissed;
  const showDarkMysticFirstProfLocationHelper =
    isFloranVillageZone &&
    !!hero &&
    (hero.level ?? 1) >= 18 &&
    isHeroDarkMysticBaseForFirstProfQuest(hero) &&
    !(hero.completedQuests || []).includes(DARK_MYSTIC_FIRST_PROF_QUEST_ID) &&
    !darkMysticFirstProfHelperDismissed;

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
    questHighlight: "kill" | "drop" | null,
    isEpicRaid: boolean,
    isRaid: boolean,
    isChampion: boolean,
    isPatrol: boolean,
    isLevelDiffTooHigh: boolean,
    l2: boolean,
  ) => {
    if (questHighlight === "kill" || questHighlight === "drop") return l2 ? "text-[#8a7a60]" : "";
    if (isEpicRaid) {
      return l2
        ? "text-[#e9d5ff] [text-shadow:0_0_12px_rgba(124,58,237,0.45)]"
        : "text-violet-300";
    }
    if (isRaid) return "text-red-500";
    if (isChampion) return "text-[#c9a44c]";
    if (isPatrol) return l2 ? "text-[#e8a0a0]" : "text-rose-400";
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
            <div className="text-[10px] uppercase tracking-wider text-[#8a7a60]">{displayCityName(city)}</div>
            <div className="mt-1 flex items-center gap-2 text-[#e8c56e] text-[15px] font-semibold leading-tight [text-shadow:0_1px_2px_rgba(0,0,0,0.85)]">
              <img src="/assets/travel.png" alt="" className="w-4 h-4 object-contain shrink-0 opacity-90" />
              <span>{displayZoneName(zone)}</span>
            </div>
            {zoneLoreText ? (
              <p className="mt-2 text-[11px] leading-relaxed text-[#a89878] border-t border-[#5c4a32]/30 pt-2">
                {zoneLoreText}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="text-[#c7ad80] mb-2 text-base font-semibold flex items-center gap-2">
            <img src="/assets/travel.png" alt={displayZoneName(zone)} className="w-3 h-3 object-contain" />
            <span>{displayZoneName(zone)}</span>
          </div>
        )}

        {!isL2 && zoneLoreText ? (
          <p className="mb-2 text-[11px] leading-snug text-[#c7ad80]/85 border-l-2 border-[#c7ad80]/40 pl-2">
            {zoneLoreText}
          </p>
        ) : null}

        <LocationQuestHelperBanners
          isL2={isL2}
          navigate={navigate}
          showGludioQuestHint={zone.id === "l2dop_gludio_01" && !gludioQuestHintDismissed}
          onDismissGludioQuestHint={() => setGludioQuestHintDismissed(true)}
          showShadowWeaponQuestHint={showShadowWeaponQuestHint}
          onDismissShadowWeaponQuestHint={() => setShadowWeaponQuestHintDismissed(true)}
          firstProf={{
            elvenMystic: {
              show: showElvenFirstProfLocationHelper,
              onDismiss: () => setElvenFirstProfHelperDismissed(true),
            },
            elvenFighter: {
              show: showElvenFighterFirstProfLocationHelper,
              onDismiss: () => setElvenFighterFirstProfHelperDismissed(true),
            },
            humanFighter: {
              show: showHumanFighterFirstProfLocationHelper,
              onDismiss: () => setHumanFighterFirstProfHelperDismissed(true),
            },
            humanMystic: {
              show: showHumanMysticFirstProfLocationHelper,
              onDismiss: () => setHumanMysticFirstProfHelperDismissed(true),
            },
            orcFighter: {
              show: showOrcFighterFirstProfLocationHelper,
              onDismiss: () => setOrcFighterFirstProfHelperDismissed(true),
            },
            orcMystic: {
              show: showOrcMysticFirstProfLocationHelper,
              onDismiss: () => setOrcMysticFirstProfHelperDismissed(true),
            },
            dwarvenFighter: {
              show: showDwarvenFighterFirstProfLocationHelper,
              onDismiss: () => setDwarvenFighterFirstProfHelperDismissed(true),
            },
            darkFighter: {
              show: showDarkFighterFirstProfLocationHelper,
              onDismiss: () => setDarkFighterFirstProfHelperDismissed(true),
            },
            darkMystic: {
              show: showDarkMysticFirstProfLocationHelper,
              onDismiss: () => setDarkMysticFirstProfHelperDismissed(true),
            },
          }}
        />

        {patrolAggroBanner ? (
          <button
            type="button"
            role="alert"
            onClick={() => openBattle(patrolAggroBanner.mobIndex)}
            className={
              isL2
                ? "mb-1.5 w-full text-left rounded-lg border border-rose-900/55 bg-gradient-to-b from-[#3d1515]/90 to-[#1a0a0a]/90 px-2.5 py-2 text-[11px] leading-snug text-[#f0c8c8] shadow-[0_0_12px_rgba(180,40,40,0.15)] hover:border-[#c7ad80]/45 hover:brightness-110 active:scale-[0.99] transition-[border-color,transform,filter] cursor-pointer"
                : "mb-1.5 w-full text-left rounded-md border border-rose-800/50 bg-rose-950/40 px-2.5 py-1.5 text-xs text-rose-100 hover:bg-rose-900/50 cursor-pointer"
            }
          >
            {getGameSettings().language === "uk"
              ? `Вас атакує ${displayMobName(patrolAggroBanner.mobName)} і завдає ${patrolAggroBanner.damage} урону. Натисніть, щоб увійти в бій.`
              : `Вас атакует ${displayMobName(patrolAggroBanner.mobName)} и наносит ${patrolAggroBanner.damage} урона. Нажмите, чтобы войти в бой.`}
          </button>
        ) : null}

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

              const isChampion = isChampionMob(mob);
              const isRaid = (mob as any).isRaidBoss === true;
              const isEpicRaid = isL2EpicRaidBossMob(mob);
              const isPatrol = mob.aggressivePatrol === true;
              const heroLevel = hero?.level || 1;
              const levelDiff = Math.abs(heroLevel - mob.level);
              const isLevelDiffTooHigh = levelDiff > 10;
              const questHighlight = getQuestMobHighlightForMob(
                mob,
                activeQuests,
                QUESTS,
                zone.id,
                hero?.inventory ?? [],
                heroLevel
              );
              const nameCls = mobNameClass(
                questHighlight,
                isEpicRaid,
                isRaid,
                isChampion,
                isPatrol,
                isLevelDiffTooHigh,
                isL2,
              );
              const listIconSrc = getMobListIconSrc(mob);
              const { current: mobCurHp, max: mobMaxHp } = getMobWorldHpDisplay(zone.id, globalIndex, mob);

              if (isL2) {
                return (
                  <div
                    key={globalIndex}
                    role="button"
                    tabIndex={0}
                    className={`${l2MobCard}${
                      isEpicRaid
                        ? " border-violet-500/45 shadow-[0_0_20px_rgba(109,40,217,0.22)]"
                        : ""
                    }${isPatrol ? " border-rose-900/45 shadow-[0_0_14px_rgba(180,60,60,0.12)]" : ""}`}
                    onClick={() => openBattle(globalIndex)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openBattle(globalIndex);
                      }
                    }}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <button
                        type="button"
                        className="relative w-8 h-8 shrink-0 rounded border border-[#5c4a32]/50 bg-black/35 flex items-center justify-center overflow-hidden p-0.5 hover:border-[#c7ad80]/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#c7ad80]/40 cursor-pointer"
                        title="Характеристики"
                        aria-label="Характеристики моба"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMob(mob);
                        }}
                      >
                        {listIconSrc ? (
                          <img
                            src={listIconSrc}
                            alt=""
                            className="max-w-[22px] max-h-[22px] w-full h-full object-contain object-center pointer-events-none"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <span className="text-[10px] text-[#5c4a32]">—</span>
                        )}
                      </button>
                      <div className="flex-1 min-w-0 text-left">
                        <div
                          className={`text-[11px] font-medium leading-tight min-w-0 flex flex-wrap items-baseline gap-x-0.5 ${nameCls}`}
                        >
                          <span className="truncate min-w-0">{displayMobName(mob.name)}</span>
                          {isPatrol ? (
                            <span className="text-[#5c0a0a] font-semibold shrink-0"> (агр)</span>
                          ) : null}
                        </div>
                        {questHighlight === "kill" && (
                          <div className="text-[8px] text-[#6b7280] mt-px leading-none">квест · цель</div>
                        )}
                        {questHighlight === "drop" && (
                          <div className="text-[8px] text-[#6b7280] mt-px leading-none">квест · добыча</div>
                        )}
                      </div>
                      <div
                        className={`shrink-0 text-right rounded bg-black/30 px-1.5 py-0.5 min-w-[2.85rem] ${
                          isEpicRaid ? "border border-violet-500/45" : "border border-[#5c4a32]/40"
                        }`}
                      >
                        <div
                          className={`text-[10px] font-semibold leading-none ${
                            isEpicRaid ? "text-violet-300" : "text-[#c45c5c]"
                          }`}
                        >
                          [{mob.level}]
                        </div>
                        <div
                          className={`text-[9px] mt-0.5 leading-none tabular-nums ${
                            isEpicRaid ? "text-violet-200/80" : "text-[#a89878]"
                          }`}
                        >
                          {mobCurHp}/{mobMaxHp}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={globalIndex}
                  className={`flex items-center gap-2 py-1 border-b border-solid text-xs ${
                    isEpicRaid ? "border-violet-500/35 border-white/30" : "border-white/50"
                  } ${isPatrol ? "border-rose-900/30" : ""} ${
                    !questHighlight && isLevelDiffTooHigh ? "text-red-500" : "text-[#c7ad80]"
                  }`}
                >
                  <button
                    type="button"
                    className="p-0 border-0 bg-transparent flex-shrink-0 cursor-pointer hover:opacity-90"
                    title="Характеристики"
                    aria-label="Характеристики моба"
                    onClick={() => setSelectedMob(mob)}
                  >
                    {listIconSrc ? (
                      <img
                        src={listIconSrc}
                        alt=""
                        className="w-4 h-4 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <span className="text-[10px] text-[#5c4a32] w-4 h-4 inline-block text-center">—</span>
                    )}
                  </button>
                  <span
                    className={`flex-1 flex flex-col cursor-pointer hover:text-[#f4e2b8] ${nameCls}`}
                    style={
                      questHighlight === "kill" || questHighlight === "drop"
                        ? { color: "#6b7280" }
                        : undefined
                    }
                    onClick={() => openBattle(globalIndex)}
                  >
                    <span>
                      {displayMobName(mob.name)}
                      {isPatrol ? <span className="text-[#5c0a0a] font-semibold"> (агр)</span> : null}
                    </span>
                    {questHighlight === "kill" ? (
                      <span className="text-[8px] text-gray-500 leading-none mt-0.5">квест · цель</span>
                    ) : null}
                    {questHighlight === "drop" ? (
                      <span className="text-[8px] text-gray-500 leading-none mt-0.5">квест · добыча</span>
                    ) : null}
                  </span>
                  <span className={isEpicRaid ? "text-violet-400" : "text-red-500"}>[{mob.level}]</span>
                  <span className={isEpicRaid ? "text-violet-400/90" : "text-red-500"}>
                    ({mobCurHp}/{mobMaxHp})
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

        {selectedMob && found && (
          <LocationMobDetailModal
            isL2={isL2}
            zone={found.zone}
            zoneId={zoneId}
            mob={selectedMob}
            mobIndexInZone={found.zone.mobs.indexOf(selectedMob)}
            onClose={() => setSelectedMob(null)}
            onInspectDrop={(id) => setSelectedDropItem(id)}
          />
        )}

        {selectedDropItem && selectedMob && (
          <LocationDropInspectModal
            isL2={isL2}
            itemId={selectedDropItem}
            mob={selectedMob}
            onClose={() => setSelectedDropItem(null)}
          />
        )}
    </div>
  );
}
