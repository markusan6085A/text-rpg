import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  getPublicCharacter,
  getCharacterByName,
  getSevenSealsRank,
  payToViewPlayerStats,
  startPkSession,
  getPkSession,
  actPkSession,
  syncPkStats,
  resurrectCharacter,
  type Character,
  type PkSessionState,
} from "../utils/api";
import {
  getActiveSevenSealsRank,
  getSevenSealsBonusFromHero,
  type SevenSealsBonusLike,
} from "../utils/sevenSealsBonus";
import { getProfessionDefinition, normalizeProfessionId } from "../data/skills";
import CharacterEquipmentFrame from "./character/CharacterEquipmentFrame";
import WriteLetterModal from "../components/WriteLetterModal";
import PlayerItemModal from "../components/PlayerItemModal";
import { useHeroStore } from "../state/heroStore";
import { getNickColorStyle } from "../utils/nickColor";
import { PlayerNameWithEmblem } from "../components/PlayerNameWithEmblem";
import { getMyClan, inviteToClan, inviteToParty, type Clan } from "../utils/api";
import SevenSealsBonusModal from "../components/SevenSealsBonusModal";
import PlayerStatsModal from "../components/PlayerStatsModal";
import { recalculateAllStats } from "../utils/stats/recalculateAllStats";
import { cleanupBuffs } from "../state/battle/helpers";
import PkProfileView from "./player/PkProfileView";
import InvitePlayerModal from "./clan/modals/InvitePlayerModal";
import PartyInviteToPartyModal from "./clan/modals/PartyInviteToPartyModal";
import { usePartyStore } from "../state/partyStore";
import { locations as WORLD_LOCATIONS } from "../data/world";
import { formatPublicProfileLocation } from "../utils/worldDisplay";
import { useGameSettingsVersion } from "../hooks/useGameSettingsVersion";
import { useAutoShot, shotLogLabel } from "../state/battle/actions/useSkill/shotHelpers";
import { calcAutoAttackInterval, calcPhysicalSkillCooldown } from "../utils/combatSpeed";

interface PlayerProfileProps {
  navigate: (path: string) => void;
  playerId?: string;
  playerName?: string;
}

import { getSkillDef, getSkillDefForBattle, skillDefIsBuff, skillDefIsToggle } from "../state/battle/loadout";
import { processSkillEffects } from "../state/battle/actions/useSkill/buffHelpers";
import { useBattleStore } from "../state/battle/store";
import {
  rollbackPkPredictiveCooldownIfActionFailed,
  rollbackPkPredictiveCooldownOnNetworkError,
} from "../state/battle/pkPredictiveCooldownRollback";
import { useAdminStore } from "../state/adminStore";
import { buffPlayer } from "../utils/api";
import { showToast } from "../state/toastStore";
import { isWarmCityUi, getCityUiVariant } from "../utils/cityUiVariant";
import { L2_WARM_OUTER_FRAME } from "../utils/l2WarmLayoutClassNames";
import { effectiveCharacterLevel } from "../utils/effectiveCharacterLevel";
import { useCharacterStore } from "../state/characterStore";
import { setResurrectInProgress } from "../state/heroStore";
import { clearDeathGate } from "../utils/deathGate";
import {
  characterToProfileHeroData,
  prepareBuffsForStatsView,
  filterProfileBuffsByLearnedSkills,
} from "./player/playerProfileUtils";
import { PlayerProfileActiveBuffsList } from "./player/PlayerProfileActiveBuffsList";
import { PlayerProfileBuffModal } from "./player/PlayerProfileBuffModal";
import { PlayerProfileMetaPanel } from "./player/PlayerProfileMetaPanel";

export default function PlayerProfile({ navigate, playerId, playerName }: PlayerProfileProps) {
  useGameSettingsVersion();
  const hero = useHeroStore((s) => s.hero);
  const updateHero = useHeroStore((s) => s.updateHero);
  const characterId = useCharacterStore((s) => s.characterId);
  const isAdmin = useAdminStore((s) => s.isAdmin);
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ slot: string; itemId: string | null; enchantLevel?: number } | null>(null);
  const [playerClan, setPlayerClan] = useState<any>(null);
  const [sevenSealsRank, setSevenSealsRank] = useState<number | null>(null);
  const [sevenSealsBonusFromRankApi, setSevenSealsBonusFromRankApi] = useState<SevenSealsBonusLike | undefined>(undefined);
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
  const [myClan, setMyClan] = useState<Clan | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showPartyInviteModal, setShowPartyInviteModal] = useState(false);
  const [showBuffModal, setShowBuffModal] = useState(false);
  const [buffPlayerLoading, setBuffPlayerLoading] = useState(false);
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

  // Перевірка адміна при відкритті профілю — щоб кнопка «Забафнуть» зʼявилась одразу (checkAdmin в App відкладений на 1.5 с)
  useEffect(() => {
    useAdminStore.getState().checkAdmin().catch(() => {});
  }, []);

  useEffect(() => {
    if (!hero?.id) return;
    getMyClan().then((r) => {
      if (r.ok && r.clan) setMyClan(r.clan);
      else setMyClan(null);
    });
  }, [hero?.id]);

  // Бафи для застосування до іншого гравця (тільки ally/party target)
  const myBuffSkills = useMemo(() => {
    if (!hero?.skills?.length) return [];
    try {
      return hero.skills
        .map((learned: any) => {
          const skillDef = getSkillDefForBattle((hero as any).profession ?? null, (hero as any).klass, (hero as any).race, learned.id)
            ?? getSkillDef(learned.id);
          if (!skillDef || skillDef.category !== "buff") return null;
          const target = skillDef.target ?? "self";
          if (target !== "ally" && target !== "party") return null;
          const levelDef = skillDef.levels?.find((l: any) => l.level === learned.level) ?? skillDef.levels?.[0];
          return {
            id: learned.id,
            name: skillDef.name,
            icon: skillDef.icon,
            level: learned.level,
            duration: skillDef.duration,
            skillDef,
            levelDef,
          };
        })
        .filter((s): s is NonNullable<typeof s> => s !== null)
        .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } catch {
      return [];
    }
  }, [hero]);

  const handleBuffPlayer = async (buffSkillId: number) => {
    if (!character || !hero) return;
    const buffSkill = myBuffSkills.find((b) => b.id === buffSkillId);
    if (!buffSkill) return;
    setBuffPlayerLoading(true);
    try {
      const effects = processSkillEffects(buffSkill.skillDef, buffSkill.levelDef);
      const durationMs = (buffSkill.duration || 0) * 1000;
      const buffData = {
        name: buffSkill.name,
        icon: buffSkill.icon || "",
        effects,
        duration: buffSkill.duration || 0,
        expiresAt: Date.now() + durationMs,
        buffGroup: buffSkill.skillDef.buffGroup,
        stackType: buffSkill.skillDef.stackType,
      };
      const result = await buffPlayer(character.id, buffSkillId, buffData);
      if (result.ok) {
        showToast(`Баф "${buffSkill.name}" застосовано до ${character.name}`, "success");
        loadPlayerProfile();
        setShowBuffModal(false);
      }
    } catch (err: any) {
      showToast(err?.message || "Помилка застосування бафа", "error");
    }
  };

  const sevenSealsBonus = character ? getSevenSealsBonusFromHero(character as any) : undefined;
  const sevenSealsFromChar = getActiveSevenSealsRank(sevenSealsBonus);
  const sevenSealsBonusForModal = sevenSealsBonus ?? sevenSealsBonusFromRankApi;
  useEffect(() => {
    if (sevenSealsFromChar != null) {
      setSevenSealsRank(sevenSealsFromChar);
      setSevenSealsBonusFromRankApi(undefined);
      return;
    }
    const load = async () => {
      if (!character?.id) return;
      try {
        const data = await getSevenSealsRank(character.id);
        setSevenSealsRank((data.rank >= 1 && data.rank <= 3) ? data.rank : null);
        if (data.bonus && typeof data.bonus === "object") {
          setSevenSealsBonusFromRankApi({
            rank: Number(data.bonus.rank) || 0,
            pAtk: Number(data.bonus.pAtk) || 0,
            mAtk: Number(data.bonus.mAtk) || 0,
            pDef: Number(data.bonus.pDef) || 0,
            mDef: Number(data.bonus.mDef) || 0,
            coinLuck: data.bonus.coinLuck != null ? Number(data.bonus.coinLuck) || 0 : undefined,
            expiresAt: Number(data.bonus.expiresAt) || 0,
            claimedWeekStart:
              typeof data.bonus.claimedWeekStart === "string"
                ? data.bonus.claimedWeekStart
                : undefined,
          });
        } else {
          setSevenSealsBonusFromRankApi(undefined);
        }
      } catch {
        setSevenSealsRank(null);
        setSevenSealsBonusFromRankApi(undefined);
      }
    };
    load();
  }, [character?.id, sevenSealsFromChar]);

  // ❗ Оновлюємо дані при поверненні на сторінку (коли сторінка стає видимою)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && (playerId || playerName)) {
        // Перезавантажуємо дані при поверненні на сторінку, якщо не в PK-режимі
        if (!isPkMode) {
          loadPlayerProfile();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Також оновлюємо при фокусі на вікно
    const handleFocus = () => {
      if (playerId || playerName) {
        if (!isPkMode) {
          loadPlayerProfile();
        }
      }
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [playerId, playerName]);

  const heroData = useMemo(() => (character ? characterToProfileHeroData(character) : null), [character]);

  const handlePkDefeatToCity = useCallback(async () => {
    const cidUse = (characterId || hero?.id || "").trim();
    if (!cidUse || !hero) return;
    setResurrectInProgress(true);
    try {
      const char = await resurrectCharacter(cidUse, 0.7);
      const hj = (char as any)?.heroJson;
      if (hero.name) clearDeathGate(cidUse, hero.name);
      if (hj) {
        updateHero({
          hp: Number(hj.hp) || 1,
          mp: Number(hj.mp) ?? 0,
          cp: Number(hj.cp) ?? 0,
          heroJson: {
            ...(hero as any)?.heroJson,
            ...hj,
            isDead: false,
            deadAt: 0,
            killedByMobName: undefined,
            killedByMobDamage: undefined,
            heroBuffs: [],
          } as any,
        });
      }
      useBattleStore.getState().reset();
      navigate("/city");
    } catch (e) {
      console.warn("[PlayerProfile] PK defeat resurrect to city failed", e);
    } finally {
      setResurrectInProgress(false);
    }
  }, [characterId, hero, navigate, updateHero]);

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
          const targetLevel = character ? effectiveCharacterLevel(character) : 1;
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
    
    // Якщо серверне значення МЕНШЕ локального (отримали урон / юзнули скіл) — оновлюємо локальний стейт.
    // Перевіряємо myFighter.hp/mp на null/undefined, щоб уникнути (undefined < 100) === false
    const serverHp = myFighter?.hp;
    const serverMp = myFighter?.mp;
    const localHp = hero.hp ?? Infinity;
    const localMp = hero.mp ?? Infinity;
    if (myFighter && (
      (serverHp != null && serverHp < localHp) ||
      (serverMp != null && serverMp < localMp)
    )) {
      useHeroStore.getState().updateHero({
        ...(serverHp != null && { hp: serverHp }),
        ...(serverMp != null && { mp: serverMp }),
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
      if (!(skillDef as any).isMagic && !skillDefIsBuff(skillDef) && !skillDefIsToggle(skillDef)) {
        const attackSpeed = (hero as any)?.attackSpeed ?? (hero as any)?.atkSpeed ?? 200;
        cooldownMs = calcPhysicalSkillCooldown(skillDef.cooldown, attackSpeed);
      }
      
      useBattleStore.setState((s) => ({
        cooldowns: { ...s.cooldowns, [skillId]: Date.now() + cooldownMs },
      }));
    }

    try {
      const isBuff = skillDefIsBuff(skillDef);
      const isToggle = skillDefIsToggle(skillDef);

      let shotMultiplier = 1.0;
      let shotName: string | undefined;

      if (hero && !isBuff && !isToggle) {
        const battleState = useBattleStore.getState();
        const cat = skillDef?.category;
        const isMagic = cat === "magic_attack";
        const isPhysical = cat === "physical_attack";
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
          shotName = shotLogLabel(shotResult.shotType);
        }
      }

      let buffEffects: any[] | undefined;
      let buffDurationSec: number | undefined;
      if (isBuff || isToggle) {
        if (!skillDef) {
          buffEffects = undefined;
        } else {
          const learned = hero?.skills?.find((s: any) => (s?.id ?? s) === skillId);
          const skillLevel = (learned as any)?.level ?? 1;
          const levelDef = skillDef.levels?.find((l: any) => l.level === skillLevel) ?? skillDef.levels?.[0];
          buffEffects = levelDef ? processSkillEffects(skillDef, levelDef) : undefined;
          buffDurationSec = skillDef?.duration ?? 120;
        }
      }

      const actOpts: NonNullable<Parameters<typeof actPkSession>[2]> = {
        isBuff,
        isToggle,
        name: skillDef?.name,
        target: skillDef?.target,
        shotMultiplier,
        shotName,
        buffEffects,
        buffCooldownMs: (isBuff || isToggle) && skillDef?.cooldown
          ? (skillDef.category === "toggle" ? 0 : skillDef.cooldown * 1000)
          : undefined,
        buffDurationSec,
      };
      if (!isBuff && !isToggle && skillDef && typeof skillDef.cooldown === "number" && skillDef.cooldown > 0) {
        actOpts.skillBaseCooldownSec = skillDef.cooldown;
        actOpts.isMagicAttack =
          skillDef.category === "magic_attack" || !!(skillDef as any).isMagic;
      }
      const res = await actPkSession(pkSession.id, skillId, actOpts);
      if (res.serverNow) setServerTimeDrift(Date.now() - res.serverNow);
      setPkSession(res.session);
      if (res.actorBuffs?.length) {
        useBattleStore.setState({
          pkActorBuffs: res.actorBuffs.map((b) => ({ ...b, effects: b.effects ?? [] })),
        });
      }
      rollbackPkPredictiveCooldownIfActionFailed(res.session?.log?.[0], {
        heroName: String(hero?.name ?? "").trim(),
        skillIdUsed: skillId,
      });
      if (res.session.ended) {
        setTimeout(() => {
          loadPlayerProfile();
        }, 300);
      }
    } catch (e: any) {
      rollbackPkPredictiveCooldownOnNetworkError(skillId);
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
    const intervalMs = Math.max(300, calcAutoAttackInterval(attackSpeed));
    const readyAt = Date.now() + intervalMs;
    useBattleStore.setState((s) => ({
      cooldowns: { ...s.cooldowns, [0]: readyAt },
      heroNextAttackAt: readyAt,
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
          shotName = shotLogLabel(shotResult.shotType);
        }
      }

      // Відправляємо на сервер
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
      rollbackPkPredictiveCooldownIfActionFailed(res.session?.log?.[0], {
        heroName: String(hero?.name ?? "").trim(),
        skillIdUsed: undefined,
      });
    } catch (e: any) {
      rollbackPkPredictiveCooldownOnNetworkError(undefined);
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

  const isL2 = isWarmCityUi(getCityUiVariant());
  const l2Frame = L2_WARM_OUTER_FRAME;
  const profileInner = isL2
    ? "w-full max-w-[420px] mx-auto rounded-xl border border-[#5c4a32]/75 bg-black/25 shadow-[inset_0_1px_0_rgba(199,173,128,0.08)] p-3"
    : "w-full max-w-[360px] mt-2";

  if (loading) {
    return (
      <div
        className={
          isL2
            ? `${l2Frame} w-full min-w-0 my-1 px-3 py-4 flex items-center justify-center text-[#8a7a60] text-sm`
            : "w-full flex items-center justify-center text-white text-sm py-10"
        }
      >
        Загрузка профілю...
      </div>
    );
  }

  if (error || !character || !heroData) {
    return (
      <div
        className={
          isL2
            ? `${l2Frame} w-full min-w-0 my-1 px-3 py-4 flex flex-col items-center text-[#d4c4a8] text-sm`
            : "w-full flex flex-col items-center text-white text-sm py-10"
        }
      >
        <div className={isL2 ? "text-[#d4786a] mb-4" : "text-red-400 mb-4"}>{error || "Профіль не знайдено"}</div>
        <button
          onClick={() => navigate("/online-players")}
          className={
            isL2
              ? "px-4 py-2 rounded bg-[#5a4424] hover:bg-[#6a5434] text-[#e8dcc8] border border-[#5c4a32]/55"
              : "px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
          }
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

    const iLostPk = Boolean(
      pkSession?.ended && pkSession.winnerId && hero.id && pkSession.winnerId !== hero.id
    );

    return (
      <div className={isL2 ? `${l2Frame} w-full min-w-0 my-1 p-2 sm:p-3` : "w-full"}>
        {character.id !== hero?.id && (
          <div
            className={
              isL2
                ? "w-full max-w-[min(100%,28rem)] sm:max-w-xl mx-auto mb-2 px-2 py-1.5 rounded-md border border-[#5c4a32]/45 bg-black/20"
                : "w-full max-w-[360px] mx-auto mb-2 px-3 py-1 border-b border-[#c7ad80]/50"
            }
          >
            <button
              type="button"
              onClick={() => setShowBuffModal(true)}
              className={
                isL2
                  ? "cursor-pointer text-[12px] text-[#7d9b7a] hover:text-[#a8c4a4] bg-transparent border-0 p-0"
                  : "cursor-pointer hover:text-green-300 transition-colors text-[12px] text-green-400 bg-transparent border-0 p-0"
              }
            >
              Забафать игрока
            </button>
          </div>
        )}
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
          onBack={iLostPk ? handlePkDefeatToCity : backToLocation}
          panelBackLabel={iLostPk ? "Телепортироваться в город" : "Назад в окрестность"}
        />
        {showBuffModal && (
          <PlayerProfileBuffModal
            isL2={isL2}
            variant="pk"
            skills={myBuffSkills}
            busy={buffPlayerLoading}
            onClose={() => setShowBuffModal(false)}
            onSelectBuff={(id) => void handleBuffPlayer(id)}
          />
        )}
      </div>
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
  const profileLocationLabel = formatPublicProfileLocation(character.heroJson, heroData?.location);

  if (import.meta.env.DEV) {
    console.log('[PlayerProfile] mobsKilled:', mobsKilled, 'from fields:', {
      mobsKilled: stats.mobsKilled,
      mobs_killed: stats.mobs_killed,
      killedMobs: stats.killedMobs,
      totalKills: stats.totalKills,
    });
    console.log('[PlayerProfile] location resolved:', profileLocationLabel, {
      'stats.location': stats.location,
      'stats.currentLocation': stats.currentLocation,
      'stats.zone': stats.zone,
      'heroData.location': heroData?.location,
      zoneId: stats.zoneId,
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
        let charForStats = character;
        try {
          const fresh =
            playerId != null && String(playerId).trim() !== ""
              ? await getPublicCharacter(String(playerId).trim())
              : playerName
                ? await getCharacterByName(playerName)
                : null;
          if (fresh?.id) {
            setCharacter(fresh);
            charForStats = fresh;
          }
        } catch {
          /* лишаємо character — стати все одно з heroJson */
        }
        const hj = charForStats.heroJson || {};
        const hjB = hj.heroBuffs;
        const useHj = Array.isArray(hjB);
        const fallbackB = Array.isArray((charForStats as any).heroBuffs)
          ? (charForStats as any).heroBuffs
          : [];
        const rawBuffs = filterProfileBuffsByLearnedSkills(useHj ? hjB : fallbackB, Array.isArray(hj.skills) ? hj.skills : []);
        const nowMs = Date.now();
        const activeBuffsForStats = cleanupBuffs(prepareBuffsForStatsView(rawBuffs), nowMs);
        const statsHero = characterToProfileHeroData(charForStats);
        const statsResult = recalculateAllStats(statsHero, activeBuffsForStats);
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

  const lineThin = isL2 ? "border-t border-[#5c4a32]/45" : "border-t border-[#c7ad80]/70";
  const lineThick = isL2 ? "border-t-2 border-[#5c4a32]/55" : "border-t-2 border-[#c7ad80]";
  const boxPad = "px-3";

  return (
    <div
      className={
        isL2
          ? `${l2Frame} w-full min-w-0 my-1 px-3 py-4 flex flex-col items-center text-[#d4c4a8]`
          : "w-full flex flex-col items-center text-white"
      }
    >
      <div className={profileInner}>
        {/* Заголовок */}
        <div className={`w-full ${lineThick} ${lineThin} py-2`}>
          <div
            className={`${boxPad} text-center text-[14px] font-bold ${
              isL2 ? "text-[#e8c56e]" : "text-[#87ceeb]"
            }`}
          >
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
                <div className={isL2 ? "text-[#c9a44c] text-[12px]" : "text-yellow-300 text-[12px]"}>
                  {professionLabel} - {effectiveCharacterLevel(character)} ур.
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
                <span className={isL2 ? "text-[#8a7a60]" : "text-gray-400"}>
                  Последний раз был(а): {formatLastSeen(character.lastActivityAt)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Статус */}
        <div className={`${lineThin} py-2`}>
          <div
            className={`${boxPad} text-center text-[11px] ${
              isL2 ? "text-[#8a7a60]" : "text-gray-400"
            }`}
          >
            {heroData.status || "Нет статуса"}
          </div>
        </div>

        {/* Победитель 7 печатей — клікабельна кнопка */}
        {sevenSealsRank !== null && (
          <div className="mb-3">
            <button
              onClick={() => setShowSevenSealsModal(true)}
              className={
                isL2
                  ? "w-full text-center text-xs py-2 border border-solid border-[#5c4a32]/55 rounded cursor-pointer hover:bg-black/25 transition-colors"
                  : "w-full text-center text-xs py-2 border border-solid border-white/50 rounded cursor-pointer hover:bg-[#2a2015] transition-colors"
              }
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
          {myClan &&
            !playerClan &&
            character.id !== hero?.id &&
            (myClan.creator?.id === hero?.id ||
              myClan.members?.some((m) => m.characterId === hero?.id && m.isDeputy)) && (
            <div className={`${lineThin} py-1`}>
              <div className={boxPad}>
                <span
                  onClick={() => setShowInviteModal(true)}
                  className="cursor-pointer hover:text-amber-300 transition-colors text-[12px] text-amber-400 text-center block"
                >
                  Запросити в клан
                </span>
              </div>
            </div>
          )}
          {character.id !== hero?.id && hero?.id && (
            <div className={`${lineThin} py-1`}>
              <div className={boxPad}>
                <span
                  onClick={() => setShowPartyInviteModal(true)}
                  className="cursor-pointer hover:text-cyan-300 transition-colors text-[12px] text-cyan-400 text-center block"
                >
                  Запросити в пати
                </span>
              </div>
            </div>
          )}
          {character.id !== hero?.id && (
            <div className={`${lineThin} py-1`}>
              <div className={boxPad}>
                <span
                  onClick={() => setShowBuffModal(true)}
                  className="cursor-pointer hover:text-green-300 transition-colors text-[12px] text-green-400 text-center block"
                >
                  Забафать игрока
                </span>
              </div>
            </div>
          )}
          <div
            className={
              isL2
                ? "border-t-2 border-b-2 border-[#5c4a32]/55 my-1"
                : "border-t-2 border-b-2 border-[#c7ad80] my-1"
            }
          />
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

        <PlayerProfileActiveBuffsList isL2={isL2} character={character} now={now} />

        {/* Модалка бонусу 7 печатей */}
        {showSevenSealsModal && sevenSealsRank !== null && (
          <SevenSealsBonusModal
            rank={sevenSealsRank as 1 | 2 | 3}
            playerName={character.name}
            bonus={sevenSealsBonusForModal as any}
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
              showToast(
                character?.name ? `Лист надіслано: ${character.name}` : "Лист надіслано",
                "success",
                { title: "Пошта" }
              );
            }}
          />
        )}

        {showInviteModal && myClan && character && (
          <InvitePlayerModal
            playerName={character.name}
            onInvite={async () => {
              await inviteToClan(myClan.id, character.id);
            }}
            onClose={() => setShowInviteModal(false)}
          />
        )}

        {showPartyInviteModal && character && (
          <PartyInviteToPartyModal
            playerName={character.name}
            onInvite={async () => {
              await inviteToParty(character.id);
              await usePartyStore.getState().refreshParty();
            }}
            onClose={() => setShowPartyInviteModal(false)}
          />
        )}

        {showBuffModal && character && hero && (
          <PlayerProfileBuffModal
            isL2={isL2}
            variant="profile"
            targetName={character.name}
            skills={myBuffSkills}
            busy={buffPlayerLoading}
            onClose={() => setShowBuffModal(false)}
            onSelectBuff={(id) => void handleBuffPlayer(id)}
          />
        )}

        <PlayerProfileMetaPanel
          isL2={isL2}
          professionLabel={professionLabel}
          character={character}
          premiumActive={premiumActive}
          premiumTime={premiumTime}
          karma={karma}
          pk={pk}
          mobsKilled={mobsKilled}
          pvpWins={pvpWins}
          pvpLosses={pvpLosses}
          giftsCount={giftsCount}
          profileLocationLabel={profileLocationLabel}
          formatLastSeen={formatLastSeen}
        />

        {/* Кнопка назад - просто текст */}
        <div className="mt-4">
          <div
            className={`w-full border-t border-b border-solid py-1 ${
              isL2 ? "border-[#5c4a32]/45" : "border-white/50"
            }`}
          >
            <span
              onClick={() => navigate("/online-players")}
              className={
                isL2
                  ? "cursor-pointer hover:text-[#e8c56e] transition-colors text-[12px] text-[#c9a44c] text-center block"
                  : "cursor-pointer hover:text-blue-300 transition-colors text-[12px] text-blue-400 text-center block"
              }
            >
              Назад до списку онлайн
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
