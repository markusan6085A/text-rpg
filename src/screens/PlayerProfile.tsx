import React, { useState, useEffect, useMemo } from "react";
import { getPublicCharacter, getCharacterByName, getSevenSealsRank, payToViewPlayerStats, startPkSession, getPkSession, actPkSession, syncPkStats, type Character, type PkSessionState } from "../utils/api";
import { getActiveSevenSealsRank } from "../utils/sevenSealsBonus";
import { getProfessionDefinition, normalizeProfessionId } from "../data/skills";
import CharacterEquipmentFrame from "./character/CharacterEquipmentFrame";
import WriteLetterModal from "../components/WriteLetterModal";
import PlayerItemModal from "../components/PlayerItemModal";
import { useHeroStore } from "../state/heroStore";
import { getNickColorStyle } from "../utils/nickColor";
import { PlayerNameWithEmblem } from "../components/PlayerNameWithEmblem";
import { getMyClan } from "../utils/api";
import SevenSealsBonusModal from "../components/SevenSealsBonusModal";
import PlayerStatsModal from "../components/PlayerStatsModal";
import { recalculateAllStats } from "../utils/stats/recalculateAllStats";
import PkProfileView from "./player/PkProfileView";
import { locations as WORLD_LOCATIONS } from "../data/world";
import { useAutoShot } from "../state/battle/actions/useSkill/shotHelpers";

interface PlayerProfileProps {
  navigate: (path: string) => void;
  playerId?: string;
  playerName?: string;
}

import { getSkillDefForBattle } from "../state/battle/loadout";
import { useBattleStore } from "../state/battle/store";

export default function PlayerProfile({ navigate, playerId, playerName }: PlayerProfileProps) {
  const hero = useHeroStore((s) => s.hero);
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ slot: string; itemId: string | null; enchantLevel?: number } | null>(null);
  const [playerClan, setPlayerClan] = useState<any>(null);
  const [sevenSealsRank, setSevenSealsRank] = useState<number | null>(null);
  const [showSevenSealsModal, setShowSevenSealsModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [viewedStats, setViewedStats] = useState<ReturnType<typeof recalculateAllStats> | null>(null);
  const [statsLoadError, setStatsLoadError] = useState<string | null>(null);
  const isPkMode = useMemo(
    () => new URLSearchParams(typeof window !== "undefined" ? window.location.search : "").get("pk") === "1",
    []
  );
  const [serverTimeDrift, setServerTimeDrift] = useState<number>(0);
  const [pkSession, setPkSession] = useState<PkSessionState | null>(null);
  const [pkLoading, setPkLoading] = useState(false);
  const [pkActing, setPkActing] = useState(false);
  const [pkError, setPkError] = useState<string | null>(null);
  // 🔥 Таймер — перерендер щосекунди, щоб бафи інших гравців зникали при простроченні
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  const loadPlayerProfile = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let loadedCharacter: Character;
      if (playerId) {
        loadedCharacter = await getPublicCharacter(playerId);
      } else if (playerName) {
        loadedCharacter = await getCharacterByName(playerName);
      } else {
        throw new Error("playerId or playerName is required");
      }
      
      setCharacter(loadedCharacter);
      
      // Використовуємо клан з character, якщо він є
      if (loadedCharacter.clan) {
        setPlayerClan(loadedCharacter.clan);
      } else {
        setPlayerClan(null);
      }
    } catch (err: any) {
      setError(err?.message || "Помилка завантаження профілю гравця");
      console.error("[PlayerProfile] Error loading profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlayerProfile();
  }, [playerId, playerName]);

  const sevenSealsBonus = (character?.heroJson as any)?.sevenSealsBonus;
  const sevenSealsFromChar = getActiveSevenSealsRank(sevenSealsBonus);
  useEffect(() => {
    if (sevenSealsFromChar != null) {
      setSevenSealsRank(sevenSealsFromChar);
      return;
    }
    const load = async () => {
      if (!character?.id) return;
      try {
        const data = await getSevenSealsRank(character.id);
        setSevenSealsRank((data.rank >= 1 && data.rank <= 3) ? data.rank : null);
      } catch {
        setSevenSealsRank(null);
      }
    };
    load();
  }, [character?.id, sevenSealsFromChar]);

  // ❗ Оновлюємо дані при поверненні на сторінку (коли сторінка стає видимою)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && (playerId || playerName)) {
        // Перезавантажуємо дані при поверненні на сторінку
        loadPlayerProfile();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Також оновлюємо при фокусі на вікно
    const handleFocus = () => {
      if (playerId || playerName) {
        loadPlayerProfile();
      }
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [playerId, playerName]);

  // Конвертуємо Character в Hero формат для CharacterEquipmentFrame
  const heroData = useMemo(() => {
    if (!character) return null;

    const heroJson = character.heroJson || {};
    // 🔥 profession може бути в heroJson.profession або в character.classId
    // Приводимо до нижнього регістру для правильного визначення зображення
    const professionRaw = heroJson.profession || character.classId || "";
    const profession = professionRaw.toLowerCase();
    
    return {
      id: character.id,
      name: character.name,
      username: character.name,
      race: character.race,
      klass: character.classId,
      gender: character.sex,
      level: character.level,
      profession: professionRaw, // Зберігаємо оригінальний регістр для відображення
      status: heroJson.status || "",
      equipment: heroJson.equipment || {},
      equipmentEnchantLevels: heroJson.equipmentEnchantLevels || {},
      activeDyes: heroJson.activeDyes || [],
      skills: Array.isArray(heroJson.skills) ? heroJson.skills : [],
      heroJson,
      inventory: heroJson.inventory || [],
      adena: character.adena,
      coinOfLuck: character.coinLuck,
      exp: character.exp,
      sp: character.sp,
      hp: heroJson.hp !== undefined && heroJson.hp !== null ? Number(heroJson.hp) : (heroJson.maxHp ?? 100),
      maxHp: (heroJson.maxHp && Number(heroJson.maxHp) > 0) ? Number(heroJson.maxHp) : Math.max(100, 150 + (character.level || 1) * 12),
      mp: heroJson.mp || heroJson.maxMp || 100,
      maxMp: heroJson.maxMp || 100,
      cp: heroJson.cp || heroJson.maxCp || 0,
      maxCp: heroJson.maxCp || 0,
      // 🔥 Додаємо location та mobsKilled для правильного відображення
      location: heroJson.location || heroJson.currentLocation || heroJson.zone || undefined,
      mobsKilled: heroJson.mobsKilled ?? heroJson.mobs_killed ?? heroJson.killedMobs ?? heroJson.totalKills ?? undefined,
      nickColor: heroJson.nickColor || undefined,
    };
  }, [character]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!isPkMode || !character?.id) return;
      const sessionIdFromUrl = typeof window !== "undefined" ? new URLSearchParams(window.location.search || "").get("session") : null;
      setPkLoading(true);
      setPkError(null);
      try {
        if (sessionIdFromUrl) {
          const res = await getPkSession(sessionIdFromUrl);
          if (!cancelled) {
            if (res.serverNow) setServerTimeDrift(Date.now() - res.serverNow);
            setPkSession(res.session);
          }
        } else if (hero?.id) {
          const myLevel = hero?.level || 1;
          const targetLevel = character?.level || 1;
          const diff = Math.abs(myLevel - targetLevel);
          if (diff > 20) {
             setPkError(`Нельзя атаковать игрока, если разница уровней больше 20! (Ваш ур: ${myLevel}, Его ур: ${targetLevel})`);
             setPkLoading(false);
             return;
          }

          const attackerStats = {
            hp: hero.hp,
            maxHp: hero.maxHp,
            mp: hero.mp,
            maxMp: hero.maxMp,
          };
          const res = await startPkSession(hero.id, character.id, attackerStats);
          if (!cancelled) {
            if (res.serverNow) setServerTimeDrift(Date.now() - res.serverNow);
            setPkSession(res.session);
            const url = new URL(window.location.href);
            url.searchParams.set("session", res.session.id);
            window.history.replaceState(null, "", url.pathname + url.search);
          }
        }
      } catch (e: any) {
        if (!cancelled) {
          if (sessionIdFromUrl && hero?.id) {
            try {
              const res = await startPkSession(hero.id, character.id, {
                hp: hero.hp,
                maxHp: hero.maxHp,
                mp: hero.mp,
                maxMp: hero.maxMp,
              });
              if (!cancelled) {
                if (res.serverNow) setServerTimeDrift(Date.now() - res.serverNow);
                setPkSession(res.session);
                const url = new URL(window.location.href);
                url.searchParams.set("session", res.session.id);
                window.history.replaceState(null, "", url.pathname + url.search);
              }
            } catch (e2: any) {
              setPkError(e2?.message || "Не удалось начать PK бой");
            }
          } else {
            setPkError(e?.message || "Не удалось начать PK бой");
          }
        }
      } finally {
        if (!cancelled) setPkLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [isPkMode, hero?.id, character?.id]);

  useEffect(() => {
    if (!pkSession?.id || !isPkMode) return;
    const timer = setInterval(async () => {
      try {
        const res = await getPkSession(pkSession.id);
        if (res.serverNow) setServerTimeDrift(Date.now() - res.serverNow);
        setPkSession(res.session);
      } catch {
        // keep previous state on intermittent errors
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [pkSession?.id, isPkMode]);

  // Оновлюємо локальне HP/MP з pkSession, якщо воно змінилося (наприклад, ми отримали урон)
  useEffect(() => {
    if (!isPkMode || !pkSession || !hero) return;
    const isAttacker = hero.id === pkSession.attackerId;
    const myFighter = isAttacker ? pkSession.attacker : pkSession.defender;
    
    // Якщо серверне значення відрізняється більше ніж на 2 (щоб уникнути спаму від мікро-регену) і воно МЕНШЕ локального 
    // (отримали урон), або ми юзнули скіл і впало MP — оновлюємо локальний стейт.
    if (myFighter && (myFighter.hp < hero.hp || myFighter.mp < hero.mp)) {
      useHeroStore.getState().updateHero({
        hp: myFighter.hp,
        mp: myFighter.mp,
      });
    }
  }, [pkSession, isPkMode]);

  // Синхронізуємо поточні HP/MP (з бафами) у PK-сесію, щоб у бою було як у барах
  useEffect(() => {
    if (!isPkMode || !pkSession?.id || !hero) return;
    
    const isAttacker = hero.id === pkSession.attackerId;
    const myFighter = isAttacker ? pkSession.attacker : pkSession.defender;
    
    // Відправляємо на сервер ТІЛЬКИ якщо змінилися максимуми (бафи).
    // Ми більше не відправляємо hp/mp автоматично, щоб не затирати урон від противника!
    // (hp/mp відправляються лише при використанні зілля з useConsumable.ts)
    const needsSync = 
      hero.maxHp !== myFighter?.maxHp || 
      hero.maxMp !== myFighter?.maxMp;

    if (!needsSync) return;

    let cancelled = false;
    syncPkStats(pkSession.id, {
      hp: hero.hp,
      maxHp: hero.maxHp,
      mp: hero.mp,
      maxMp: hero.maxMp,
    })
      .then((res) => {
        if (!cancelled) {
          if (res.serverNow) setServerTimeDrift(Date.now() - res.serverNow);
          // Оновлюємо сесію тільки якщо немає помилок конфлікту версій
          if (res.ok && res.session) {
             setPkSession(res.session);
          } else if ((res as any).error === "revision_conflict") {
            // Ігноруємо на клієнті
          }
        }
      })
      .catch((e) => {
        // Ігноруємо помилки конфлікту версій (revision_conflict) при фоновій синхронізації
        if (e?.message?.includes("revision_conflict") || e?.error === "revision_conflict") {
          // Не виводимо в консоль щоб не спамити, ігноруємо
        } else {
          console.error("[PlayerProfile] syncPkStats error:", e);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isPkMode, pkSession?.id, hero?.id, hero?.maxHp, hero?.maxMp]);

  const handlePkUseSkill = async (skillId: number) => {
    if (!pkSession || pkSession.ended || pkActing) return;
    setPkActing(true);
    setPkError(null);

    // Predictive cooldown to block UI immediately
    const skillDef = getSkillDefForBattle(hero?.profession || null, hero?.klass, hero?.race, skillId);
    if (skillDef?.cooldown) {
      // Використовуємо calcPhysicalSkillCooldown якщо це фізичний скіл
      let cooldownMs = skillDef.cooldown * 1000;
      if (!(skillDef as any).isMagic && (skillDef.type as any) !== "buff" && (skillDef.type as any) !== "buff_statue" && (skillDef.type as any) !== "toggle") {
        const attackSpeed = (hero as any)?.attackSpeed ?? (hero as any)?.atkSpeed ?? 200;
        cooldownMs = Math.max(cooldownMs * 0.3, Math.round(cooldownMs / (1 + attackSpeed / 1000)));
      }
      
      useBattleStore.setState((s) => ({
        cooldowns: { ...s.cooldowns, [skillId]: Date.now() + cooldownMs },
      }));
    }

    try {
      const isBuff = (skillDef?.type as any) === "buff" || (skillDef?.type as any) === "buff_statue";
      const isToggle = (skillDef?.type as any) === "toggle";

      let shotMultiplier = 1.0;
      let shotName: string | undefined;

      if (hero && !isBuff && !isToggle) {
        const battleState = useBattleStore.getState();
        const isPhysical = !(skillDef as any)?.isMagic;
        const isMagic = !!(skillDef as any)?.isMagic;
        const consumeCount = skillId === 1 ? 1 : 2;
        
        const shotResult = useAutoShot(
          hero as any,
          isPhysical,
          isMagic,
          battleState.loadoutSlots,
          battleState.activeChargeSlots,
          consumeCount
        );

        if (shotResult.used) {
          shotMultiplier = shotResult.multiplier;
          shotName = shotResult.shotType === "soulshot" ? "Soulshot" : "Spiritshot";
        }
      }

      const res = await actPkSession(pkSession.id, skillId, {
        isBuff,
        isToggle,
        name: skillDef?.name,
        target: skillDef?.target,
        shotMultiplier,
        shotName
      });
      if (res.serverNow) setServerTimeDrift(Date.now() - res.serverNow);
      setPkSession(res.session);
      if (res.session.ended) {
        setTimeout(() => {
          loadPlayerProfile();
        }, 300);
      }
    } catch (e: any) {
      setPkError(e?.message || "Ошибка PK действия");
    } finally {
      setPkActing(false);
    }
  };

  const handlePkAttack = async () => {
    if (!pkSession || pkSession.ended || pkActing) return;
    setPkActing(true);
    setPkError(null);

    // Predictive cooldown (basic attack is skillId=0)
    // Розраховуємо інтервал на основі швидкості атаки (як у calcAutoAttackInterval)
    const attackSpeed = (hero as any)?.attackSpeed ?? (hero as any)?.atkSpeed ?? 200;
    const intervalMs = Math.max(300, Math.round(1500 / (1 + attackSpeed / 1000)));

    useBattleStore.setState((s) => ({
      cooldowns: { ...s.cooldowns, [0]: Date.now() + intervalMs },
    }));

    try {
      let shotMultiplier = 1.0;
      let shotName: string | undefined;

      if (hero) {
        const battleState = useBattleStore.getState();
        const isMagic = false; // Basic attack is physical
        
        const shotResult = useAutoShot(
          hero as any,
          true, // isPhysical
          isMagic,
          battleState.loadoutSlots,
          battleState.activeChargeSlots,
          1 // consume 1 shot
        );

        if (shotResult.used) {
          shotMultiplier = shotResult.multiplier;
          shotName = shotResult.shotType === "soulshot" ? "Soulshot" : "Spiritshot";
        }
      }

      const res = await actPkSession(pkSession.id, undefined, {
        shotMultiplier,
        shotName
      });
      if (res.serverNow) setServerTimeDrift(Date.now() - res.serverNow);
      setPkSession(res.session);
      if (res.session.ended) {
        setTimeout(() => {
          loadPlayerProfile();
        }, 300);
      }
    } catch (e: any) {
      setPkError(e?.message || "Ошибка PK действия");
    } finally {
      setPkActing(false);
    }
  };

  // Перевіряємо чи гравець онлайн (активний за останні 10 хвилин)
  const isOnline = useMemo(() => {
    if (!character?.lastActivityAt) return false;
    try {
      const lastActivity = new Date(character.lastActivityAt);
      const now = new Date();
      const diffMinutes = (now.getTime() - lastActivity.getTime()) / (1000 * 60);
      return diffMinutes < 10;
    } catch (e) {
      return false;
    }
  }, [character?.lastActivityAt]);

  // Форматуємо дату "Останній раз був"
  const formatLastSeen = (dateString?: string) => {
    if (!dateString) return "Невідомо";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return "Невідомо";
    }
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center text-white text-sm py-10">
        Загрузка профілю...
      </div>
    );
  }

  if (error || !character || !heroData) {
    return (
      <div className="w-full flex flex-col items-center text-white text-sm py-10">
        <div className="text-red-400 mb-4">{error || "Профіль не знайдено"}</div>
        <button
          onClick={() => navigate("/online-players")}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
        >
          Назад до списку онлайн
        </button>
      </div>
    );
  }

  const profession = heroData.profession || character.classId || "";
  const profId = normalizeProfessionId(profession as any);
  const profDef = profId ? getProfessionDefinition(profId) : null;
  const professionLabel = profDef?.label || profession || "Нет";

  if (isPkMode && hero && heroData) {
    const backToLocation = () => {
      const heroLoc = String((hero as any)?.location ?? (hero as any)?.currentLocation ?? (hero as any)?.zone ?? "").trim();
      const zone = WORLD_LOCATIONS.find((z) => z.name === heroLoc);
      if (zone) {
        navigate(`/location?zone=${zone.id}`);
      } else {
        navigate("/location");
      }
    };
    return (
      <PkProfileView
        character={character}
        heroData={heroData}
        professionLabel={professionLabel}
        pkSession={pkSession}
        pkLoading={pkLoading}
        pkActing={pkActing}
        pkError={pkError}
        now={now}
        serverTimeDrift={serverTimeDrift}
        onUseSkill={handlePkUseSkill}
        onAttack={handlePkAttack}
        onBack={backToLocation}
      />
    );
  }

  // Статистика з heroJson (якщо є) - перевіряємо всі можливі варіанти назв полів
  const stats = (character.heroJson || {}) as any;
  
  const karma = stats.karma || 0;
  const pk = stats.pk || 0;
  // 🔥 mobsKilled може зберігатися в різних полях - перевіряємо всі варіанти
  // Виправлено: прибрав дублювання stats.mobsKilled
  const mobsKilled = stats.mobsKilled ?? stats.mobs_killed ?? stats.killedMobs ?? stats.totalKills ?? 0;
  const pvpWins = stats.pvpWins || stats.pvp_wins || 0;
  const pvpLosses = stats.pvpLosses || stats.pvp_losses || 0;
  // 🔥 location може зберігатися в різних місцях - перевіряємо всі варіанти
  // Виправлено: спочатку перевіряємо stats, потім heroData
  const location = stats.location || stats.currentLocation || stats.zone || heroData?.location || "Talking Island Village";
  
  // 🔥 Діагностика: виводимо знайдені значення (тільки в dev режимі)
  if (import.meta.env.DEV) {
    console.log('[PlayerProfile] mobsKilled:', mobsKilled, 'from fields:', {
      mobsKilled: stats.mobsKilled,
      mobs_killed: stats.mobs_killed,
      killedMobs: stats.killedMobs,
      totalKills: stats.totalKills,
    });
    console.log('[PlayerProfile] location:', location, 'from fields:', {
      'stats.location': stats.location,
      'stats.currentLocation': stats.currentLocation,
      'stats.zone': stats.zone,
      'heroData.location': heroData?.location,
    });
  }
  const handleViewStats = async () => {
    if (!character || !heroData || !hero) return;
    const cost = 1_000_000;
    if ((hero.adena ?? 0) < cost) {
      setStatsLoadError(`Недостаточно адены. Нужно ${cost.toLocaleString()}`);
      return;
    }
    setStatsLoadError(null);
    try {
      const res = await payToViewPlayerStats(character.id);
      if (res.ok) {
        useHeroStore.getState().updateHero({ adena: res.newAdena });
        const hj = character.heroJson || {};
        const rawBuffs = Array.isArray(hj.heroBuffs) ? hj.heroBuffs : (Array.isArray((character as any).heroBuffs) ? (character as any).heroBuffs : []);
        const nowMs = Date.now();
        const getExp = (b: any) => { const v = b.expiresAt; if (v == null) return Number.MAX_SAFE_INTEGER; if (typeof v === "number") return v; const n = Number(v); return Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER; };
        const activeBuffsForStats = rawBuffs.filter((b: any) => { const exp = getExp(b); return exp >= Number.MAX_SAFE_INTEGER - 1 || exp > nowMs; });
        const statsResult = recalculateAllStats(heroData, activeBuffsForStats);
        setViewedStats(statsResult);
        setShowStatsModal(true);
      }
    } catch (e: any) {
      setStatsLoadError(e?.message || e?.error || "Ошибка");
    }
  };

  const premiumActive = stats.premiumActive || false;
  const premiumExpiresAt = stats.premiumExpiresAt || null;
  const giftsCount = stats.giftsCount || stats.gifts_count || 0;

  // Форматуємо час преміуму
  const formatPremiumTime = (dateString?: string | null) => {
    if (!dateString || !premiumActive) return null;
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diff = date.getTime() - now.getTime();
      if (diff <= 0) return null;
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (days > 0) return `${days}д ${hours}ч`;
      if (hours > 0) return `${hours}ч ${minutes}м`;
      return `${minutes}м`;
    } catch (e) {
      return null;
    }
  };

  const premiumTime = formatPremiumTime(premiumExpiresAt);

  const lineThin = "border-t border-[#c7ad80]/70";
  const lineThick = "border-t-2 border-[#c7ad80]";
  const boxPad = "px-3";

  return (
    <div className="w-full flex flex-col items-center text-white">
      <div className="w-full max-w-[360px] mt-2">
        {/* Заголовок */}
        <div className={`w-full ${lineThick} ${lineThin} py-2`}>
          <div className={`${boxPad} text-center text-[14px] font-bold text-[#87ceeb]`}>
            Информация о игроке
          </div>
        </div>

        {/* Нік, профа, лвл */}
        <div className="w-full">
          <div className={`${lineThin} pt-2`}>
            <div className={`${boxPad} text-center`}>
              <div className="font-bold text-[14px]">
                <PlayerNameWithEmblem
                  playerName={character.name}
                  hero={hero}
                  clan={playerClan}
                  nickColor={heroData?.nickColor || undefined}
                  sevenSealsWinnerRank={sevenSealsRank ?? undefined}
                  size={10}
                />
              </div>
              <div className={`${lineThin} mt-2 pt-2 pb-2`}>
                <div className="text-yellow-300 text-[12px]">
                  {professionLabel} - {character.level} ур.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Останній раз був / Онлайн */}
        {character.lastActivityAt && (
          <div className={`${lineThin} py-2`}>
            <div className={`${boxPad} text-center text-[11px]`}>
              {isOnline ? (
                <span className="text-green-400 font-semibold">Онлайн</span>
              ) : (
                <span className="text-gray-400">
                  Последний раз был(а): {formatLastSeen(character.lastActivityAt)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Статус */}
        <div className={`${lineThin} py-2`}>
          <div className={`${boxPad} text-center text-[11px] text-gray-400`}>
            {heroData.status || "Нет статуса"}
          </div>
        </div>

        {/* Победитель 7 печатей — клікабельна кнопка */}
        {sevenSealsRank !== null && (
          <div className="mb-3">
            <button
              onClick={() => setShowSevenSealsModal(true)}
              className="w-full text-center text-xs py-2 border border-solid border-white/50 rounded cursor-pointer hover:bg-[#2a2015] transition-colors"
            >
              <span className={sevenSealsRank === 1 ? "text-yellow-400" : sevenSealsRank === 2 ? "text-gray-300" : "text-orange-400"}>
                Победитель 7 печатей ({sevenSealsRank} место)
              </span>
            </button>
          </div>
        )}

        {/* Картинка персонажа з екіпіровкою */}
        <div className="mb-4">
          <CharacterEquipmentFrame 
            allowUnequip={false} 
            marginTop="0"
            heroOverride={heroData}
            onItemClick={(slot, itemId, enchantLevel) => {
              setSelectedItem({ slot, itemId, enchantLevel });
            }}
          />
        </div>

        {/* Модалка характеристик предмета */}
        {selectedItem && (
          <PlayerItemModal
            itemId={selectedItem.itemId}
            slot={selectedItem.slot}
            enchantLevel={selectedItem.enchantLevel}
            onClose={() => setSelectedItem(null)}
          />
        )}

        {/* Кнопки - edge-to-edge, текст з паддінгом */}
        <div className="w-full mb-4">
          <div className={`${lineThin} py-1`}>
            <div className={boxPad}>
              <span
                onClick={() => setShowWriteModal(true)}
                className="cursor-pointer hover:text-green-300 transition-colors text-[12px] text-green-400 text-center block"
              >
                Написать письмо
              </span>
            </div>
          </div>
          <div className={`${lineThin} py-1`}>
            <div className={boxPad}>
              <span
                onClick={() => navigate(`/player/${character.id}/admin`)}
                className="cursor-pointer hover:text-green-300 transition-colors text-[12px] text-green-400 text-center block"
              >
                Забафнуть игрока
              </span>
            </div>
          </div>
          <div className="border-t-2 border-b-2 border-[#c7ad80] my-1" />
          <div className={`${lineThin} py-1`}>
            <div className={boxPad}>
              <span
                onClick={handleViewStats}
                className="cursor-pointer hover:text-yellow-300 transition-colors text-[12px] text-yellow-400 text-center block"
              >
                Подсмотреть характеристики за 1 000 000
              </span>
            </div>
            {statsLoadError && (
              <div className="text-red-400 text-[10px] text-center mt-1">{statsLoadError}</div>
            )}
          </div>
        </div>

        {/* Активні бафи гравця — джерело: heroJson.heroBuffs або character.heroBuffs; реальний час по expiresAt */}
        {(() => {
          const heroJson = character.heroJson || {};
          const fromJson = Array.isArray(heroJson.heroBuffs) ? heroJson.heroBuffs : [];
          const fromChar = Array.isArray((character as any).heroBuffs) ? (character as any).heroBuffs : [];
          const allBuffs = fromJson.length ? fromJson : fromChar;

          const getExpiresAt = (b: any): number => {
            const v = b.expiresAt;
            if (v == null) return Number.MAX_SAFE_INTEGER; // без expiresAt = постійний (показуємо)
            if (typeof v === "number") return v;
            const n = Number(v);
            return Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER;
          };

          const activeBuffs = allBuffs.filter((b: any) => {
            const exp = getExpiresAt(b);
            if (exp >= Number.MAX_SAFE_INTEGER - 1) return true; // toggle або постійний
            return exp > now;
          });

          if (allBuffs.length === 0) return null;

          return (
            <div className="mb-4 border-t border-solid border-white/50 pt-3">
              <div className="text-[#dec28e] text-sm font-semibold mb-2 border-b border-solid border-white/50 pb-1">
                Активні бафи {activeBuffs.length > 0 && `(${activeBuffs.length})`}
              </div>
              {activeBuffs.length === 0 && allBuffs.length > 0 && (
                <div className="text-xs text-gray-500 py-2">
                  Всі бафи закінчились
                </div>
              )}
              {activeBuffs.length === 0 && allBuffs.length === 0 && (
                <div className="text-xs text-gray-500 py-2">
                  Немає активних бафів
                </div>
              )}
              {/* 🔥 Тільки іконки в ряд з переносом - зменшені в 1.5 рази */}
              <div className="flex flex-wrap gap-1.5">
                {activeBuffs.map((buff: any, idx: number) => {
                  let iconSrc = buff.icon?.startsWith("/") ? buff.icon : `/skills/${buff.icon || ""}`;
                  
                  return (
                    <img
                      key={idx}
                      src={iconSrc}
                      alt={buff.name || "Buff"}
                      className="w-5 h-5 object-contain"
                      title={buff.name || "Buff"} // Показуємо назву при hover
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/skills/skill0000.gif";
                      }}
                    />
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Модалка бонусу 7 печатей */}
        {showSevenSealsModal && sevenSealsRank !== null && (
          <SevenSealsBonusModal
            rank={sevenSealsRank as 1 | 2 | 3}
            playerName={character.name}
            bonus={(character?.heroJson as any)?.sevenSealsBonus}
            onClose={() => setShowSevenSealsModal(false)}
          />
        )}

        {/* Модалка характеристик іншого гравця */}
        {showStatsModal && viewedStats && heroData && (
          <PlayerStatsModal
            playerName={character.name}
            stats={viewedStats}
            hero={heroData}
            onClose={() => {
              setShowStatsModal(false);
              setViewedStats(null);
            }}
          />
        )}

        {/* Модалка написання листа */}
        {showWriteModal && (
          <WriteLetterModal
            toCharacterId={character?.id}
            toCharacterName={character?.name}
            onClose={() => setShowWriteModal(false)}
            onSent={() => {
              setShowWriteModal(false);
              // TODO: Можливо показати повідомлення про успішну відправку
            }}
          />
        )}

        {/* Інформація */}
        <div className="space-y-2 text-[11px] text-gray-300 border-t border-solid border-white/50 pt-3">
          {/* Профессия */}
          <div className="flex justify-between">
            <span>Профессия:</span>
            <span className="text-yellow-300">{professionLabel}</span>
          </div>

          {/* Преміум */}
          {premiumActive && premiumTime && (
            <div className="flex justify-between">
              <span>Будет активен ещ премиум:</span>
              <span className="text-green-300">{premiumTime}</span>
            </div>
          )}

          {/* Социальный статус */}
          <div className="border-t border-solid border-white/50 pt-2 mt-2">
            <div className="font-semibold mb-1">Социальный статус</div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="flex justify-between">
                <span>Карма</span>
                <span className={karma >= 0 ? "text-green-400" : "text-red-400"}>{karma}</span>
              </div>
              <div className="flex justify-between">
                <span>Рек.</span>
                <span>0</span>
              </div>
              <div className="flex justify-between">
                <span>PK</span>
                <span className={pk === 0 ? "text-green-400" : "text-red-400"}>{pk}</span>
              </div>
              <div className="flex justify-between">
                <span>Убил мобов</span>
                <span>{mobsKilled}</span>
              </div>
            </div>
          </div>

          {/* PvP */}
          <div className="border-t border-solid border-white/50 pt-2">
            <div className="flex justify-between text-[10px]">
              <span>PvP побед/поражений</span>
              <span className={pvpWins > pvpLosses ? "text-green-400" : "text-gray-400"}>
                {pvpWins}/{pvpLosses}
              </span>
            </div>
          </div>

          {/* Подарки */}
          <div className="border-t border-solid border-white/50 pt-2">
            <div className="flex justify-between text-[10px]">
              <span>Подарки</span>
              <span>({giftsCount})</span>
            </div>
            {giftsCount === 0 && (
              <div className="text-gray-500 text-[10px] mt-1">Подарков нет...</div>
            )}
          </div>

          {/* Локація */}
          <div className="border-t border-solid border-white/50 pt-2">
            <div className="text-[10px] text-gray-400">
              В {location}
            </div>
          </div>

          {/* Дата реєстрації */}
          {character.createdAt && (
            <div className="border-t border-solid border-white/50 pt-2">
              <div className="text-[10px] text-gray-400">
                Рег-я: {formatLastSeen(character.createdAt)}
              </div>
            </div>
          )}
        </div>

        {/* Кнопка назад - просто текст */}
        <div className="mt-4">
          <div className="w-full border-t border-b border-solid border-white/50 py-1">
            <span 
              onClick={() => navigate("/online-players")}
              className="cursor-pointer hover:text-blue-300 transition-colors text-[12px] text-blue-400 text-center block"
            >
              Назад до списку онлайн
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
