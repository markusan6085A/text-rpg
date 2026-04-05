// src/screens/Battle.tsx
import React from "react";
import { useBattleStore } from "../state/battle/store";
import { useCharacterStore } from "../state/characterStore";
import { useHeroStore, setResurrectInProgress } from "../state/heroStore";
import { isHeroDead } from "../state/heroStore/isHeroDead";
import { resurrectCharacter } from "../utils/api";
import { findZoneWithCity, locationPathForZoneMob } from "./battle/battleUtils";
import { SkillBar } from "./battle/SkillBar";
import { BattleLog } from "./battle/BattleLog";
import { BattlePanel } from "./battle/BattlePanel";
import { isMobOnRespawn } from "../state/battle/mobRespawns";
import { getMobEffectiveMaxHp } from "../utils/mobs/mobEffectiveMaxHp";
import { useCityUiVariant } from "../utils/cityUiVariant";
import { displayMobName } from "../utils/worldDisplay";
import { useGameSettingsVersion } from "../hooks/useGameSettingsVersion";
import { clearDeathGate } from "../utils/deathGate";
import { formatLootIntEn } from "../state/battle/helpers/victoryLootLogLines";
import { flushWorldMobHpSyncAsync } from "../state/worldMobHpStore";
import { L2_WARM_OUTER_FRAME } from "../utils/l2WarmLayoutClassNames";
import { filterBuffsForHeroProfession } from "../state/battle/loadout";
import { shouldUsePveServerMobTick } from "../state/battle/actions/pveMobTickOnline";

type Navigate = (path: string) => void;

interface BattleProps {
  navigate: Navigate;
}

export default function Battle({ navigate }: BattleProps) {
  useGameSettingsVersion();
  const cityUi = useCityUiVariant();
  const isClassic = cityUi === "classic";
  const isModernBattle = !isClassic;
  const isBattleTest = cityUi === "l2test";
  // navigate() робить full reload — URL не змінюється під час сесії, тому читаємо один раз (без полінгу)
  const urlParams = React.useMemo(() => new URLSearchParams(typeof window !== "undefined" ? location.search : ""), []);
  
  const zoneId = urlParams.get("zone") || "";
  const mobIndexStr = urlParams.get("idx") || "";
  const mobIndex = Number.isFinite(Number(mobIndexStr)) ? Number(mobIndexStr) : -1;

  const {
    startBattle,
    processMobAttack,
    regenTick,
    status,
    mob,
    mobHP,
    zoneId: battleZoneId,
    mobIndex: battleMobIndex,
    heroBuffs,
    mobBuffs,
    reset,
    lastReward,
    log,
    lastMobDamage,
  } = useBattleStore();

  const hero = useHeroStore((s) => s.hero);
  const updateHero = useHeroStore((s) => s.updateHero);
  const characterId = useCharacterStore((s) => s.characterId);
  const dead = hero ? isHeroDead(hero) : false;
  const [resurrecting, setResurrecting] = React.useState(false);
  const [now, setNow] = React.useState(Date.now());
  const heroBuffsForUi = React.useMemo(
    () => filterBuffsForHeroProfession(hero, heroBuffs ?? []),
    [hero, heroBuffs]
  );
  const l2Frame = L2_WARM_OUTER_FRAME;
  const testFrame =
    "rounded-2xl overflow-hidden border border-cyan-900/40 bg-[linear-gradient(180deg,#020617_0%,#0a1628_28%,#000510_72%,#000000_100%)] shadow-[inset_0_1px_0_rgba(94,234,212,0.11),inset_0_-10px_28px_rgba(0,0,0,0.55),0_14px_40px_rgba(0,0,0,0.9),0_0_0_1px_rgba(0,0,0,0.85),0_2px_0_rgba(8,145,178,0.08)]";
  const battleShell = isBattleTest ? testFrame : l2Frame;

  const handleResurrectToCity = async () => {
    if (!characterId || !hero || resurrecting) return;
    setResurrecting(true);
    setResurrectInProgress(true);
    try {
      const expectedRevision = Number((hero as any)?.heroJson?.heroRevision ?? 0);
      const char = await resurrectCharacter(characterId, 0.7, expectedRevision);
      const hj = (char as any)?.heroJson;
      if (hero?.name) clearDeathGate(characterId, hero.name);
      if (hj) {
        const store = useHeroStore.getState();
        const liveHero = store.hero;
        if (liveHero) {
          const nextLevel = Number((char as any)?.level ?? liveHero.level ?? 1);
          const nextExp = Number((char as any)?.exp ?? liveHero.exp ?? 0);
          const nextSp = Number((char as any)?.sp ?? liveHero.sp ?? 0);
          const nextAdena = Number((char as any)?.adena ?? liveHero.adena ?? 0);
          const nextCoinLuck = Number((char as any)?.coinLuck ?? liveHero.coinOfLuck ?? 0);
          const nextInventory = Array.isArray(hj.inventory) ? hj.inventory : liveHero.inventory ?? [];
          const nextOverflow = Array.isArray(hj.overflowChest) ? hj.overflowChest : liveHero.overflowChest ?? [];
          const nextActiveDyes = Array.isArray(hj.activeDyes) ? hj.activeDyes : liveHero.activeDyes ?? [];
          const revision = Number(hj.heroRevision ?? (liveHero as any)?.heroJson?.heroRevision ?? 0);
          store.applyServerSync(
            {
              level: nextLevel,
              exp: nextExp,
              sp: nextSp,
              adena: nextAdena,
              coinOfLuck: nextCoinLuck,
              hp: Number(hj.hp) || 1,
              mp: Number(hj.mp) ?? 0,
              cp: Number(hj.cp) ?? 0,
              inventory: nextInventory,
              overflowChest: nextOverflow,
              activeDyes: nextActiveDyes,
              heroJson: {
                ...hj,
                isDead: false,
                deadAt: 0,
                killedByMobName: undefined,
                killedByMobDamage: undefined,
                heroBuffs: [],
              } as any,
            } as any,
            {
              level: nextLevel,
              exp: nextExp,
              sp: nextSp,
              adena: nextAdena,
              coinLuck: nextCoinLuck,
              heroRevision: Number.isFinite(revision) ? revision : 0,
              updatedAt: Date.now(),
            }
          );
        }
      }
      reset();
      navigate("/city");
    } catch (e) {
      console.warn("[Battle] resurrect to city failed", e);
    } finally {
      setResurrectInProgress(false);
      setResurrecting(false);
    }
  };
  const found = React.useMemo(() => (zoneId ? findZoneWithCity(zoneId) : undefined), [zoneId]);

  // Рибалка тепер окрема сторінка — редірект зі старого посилання
  React.useEffect(() => {
    if (zoneId === "fishing") navigate("/fishing");
  }, [zoneId, navigate]);

  const lineGold = "border-t border-[#c7ad80]/80";
  const lineGoldThick = "border-t-2 border-[#c7ad80]";
  const pad = "px-3";
  const dividerGold = <div className="border-t-2 border-[#c7ad80]/80 mt-2" />;
  const boxBlue =
    "rounded-lg border-2 border-[#4aa3ff]/70 bg-black/25 shadow-[inset_0_0_12px_rgba(74,163,255,0.18)] overflow-hidden";
  const boxLog = isBattleTest
    ? "rounded-xl border border-cyan-950/50 bg-[linear-gradient(180deg,rgba(15,23,42,0.92)_0%,rgba(2,6,23,0.96)_100%)] shadow-[inset_0_3px_12px_rgba(0,0,0,0.72),inset_0_1px_0_rgba(94,234,212,0.08)] overflow-hidden"
    : isModernBattle
      ? "rounded-lg border border-[#5c4a32]/70 bg-black/35 shadow-[inset_0_1px_0_rgba(199,173,128,0.12)] overflow-hidden"
      : boxBlue;
  const vLine = isBattleTest ? "border-t border-cyan-500/18" : isModernBattle ? "border-t border-[#c7ad80]/25" : lineGold;
  const vDivider = isBattleTest ? (
    <div className="border-t border-cyan-500/15 mt-2" />
  ) : isModernBattle ? (
    <div className="border-t border-[#c7ad80]/20 mt-2" />
  ) : (
    dividerGold
  );
  // Ініціалізація бою (hero?.name — щоб не тригерити ефект на кожне оновлення hero)
  const heroName = hero?.name;
  React.useEffect(() => {
    if (zoneId && mobIndex >= 0 && found) {
      if (!heroName) return;

      const isSameBattle = battleZoneId === zoneId && battleMobIndex === mobIndex;
      const hasError = status === "idle" && !mob;

      if (isSameBattle && hasError && heroName) {
        startBattle(zoneId, mobIndex);
        return;
      }
      if (isSameBattle && hasError) return;

      if (!isSameBattle || status === undefined) {
        startBattle(zoneId, mobIndex);
      }
    }
  }, [zoneId, mobIndex, found, battleZoneId, battleMobIndex, startBattle, status, mob, heroName]);

  const processMobAttackRef = React.useRef(processMobAttack);
  const regenTickRef = React.useRef(regenTick);
  React.useEffect(() => {
    processMobAttackRef.current = processMobAttack;
    regenTickRef.current = regenTick;
  }, [processMobAttack, regenTick]);

  // Таймер: атаки/нагороди кожні 250мс, реген раз на 1000мс
  const BATTLE_TICK_MS = 250;
  const REGEN_TICK_MS = 1000;
  React.useEffect(() => {
    const battleInterval = setInterval(() => {
      setNow(Date.now());
      if (useBattleStore.getState().status !== "fighting") return;
      if (shouldUsePveServerMobTick()) {
        const st = useBattleStore.getState();
        const t = Date.now();
        if (st.mobStunnedUntil && st.mobStunnedUntil > t) {
          processMobAttackRef.current();
        }
        return;
      }
      processMobAttackRef.current();
    }, BATTLE_TICK_MS);
    const regenInterval = setInterval(() => {
      if (useBattleStore.getState().status === "fighting") regenTickRef.current();
    }, REGEN_TICK_MS);
    return () => {
      clearInterval(battleInterval);
      clearInterval(regenInterval);
    };
  }, []);

  // Якщо зона або моб не знайдені
  if (!found || mobIndex < 0) {
    return (
      <div
        className={
          isModernBattle
            ? `${battleShell} w-full min-w-0 my-1 flex items-center justify-center px-4 py-10 ${
                isBattleTest ? "text-slate-200" : "text-[#d4c4a8]"
              }`
            : "text-white flex items-center justify-center px-4 py-8"
        }
      >
        <div className="space-y-3 max-w-[380px] text-center">
          <h1
            className={
              isBattleTest
                ? "text-lg font-bold text-cyan-200"
                : isModernBattle
                  ? "text-lg font-bold text-[#e8c56e]"
                  : "text-xl font-bold"
            }
          >
            Помилка
          </h1>
          <p
            className={
              isBattleTest ? "text-sm text-slate-400" : isModernBattle ? "text-sm text-[#a89878]" : "text-sm text-gray-300"
            }
          >
            Зона або моб не знайдені.
          </p>
          <button
            type="button"
            onClick={() => navigate("/location")}
            className={
              isBattleTest
                ? "mt-3 px-5 py-2 rounded-xl border border-cyan-800/55 bg-[linear-gradient(180deg,#1e293b_0%,#0f172a_100%)] text-sm text-cyan-100 hover:border-cyan-500/45"
                : isModernBattle
                  ? "mt-3 px-5 py-2 rounded-md border border-[#5c4a32]/80 bg-gradient-to-b from-[#2e2619] to-[#14110c] text-sm text-[#c9a44c] hover:border-[#c7ad80]/50"
                  : "mt-3 px-4 py-2 bg-yellow-600 rounded text-black"
            }
          >
            Повернутися в локацію
          </button>
        </div>
      </div>
    );
  }

  const { zone, city } = found;

  // SkillBar потребує hero — якщо hero ще не завантажений, показуємо завантаження
  if (!hero && mob) {
    return (
      <div
        className={
          isModernBattle
            ? `${battleShell} w-full min-w-0 my-1 flex items-center justify-center px-4 py-10 ${
                isBattleTest ? "text-slate-200" : "text-[#d4c4a8]"
              }`
            : "text-white flex items-center justify-center px-4 py-8"
        }
      >
        <div className="space-y-3 max-w-[380px] text-center">
          <div
            className={
              isModernBattle
                ? isBattleTest
                  ? "mx-auto w-6 h-6 border-2 border-cyan-950 border-t-cyan-400 rounded-full animate-spin"
                  : "mx-auto w-6 h-6 border-2 border-[#5c4a32] border-t-[#c7ad80] rounded-full animate-spin"
                : "hidden"
            }
          />
          <h1
            className={
              isBattleTest
                ? "text-lg font-semibold text-cyan-200"
                : isModernBattle
                  ? "text-lg font-semibold text-[#e8c56e]"
                  : "text-xl font-bold"
            }
          >
            Завантаження...
          </h1>
          <p
            className={
              isBattleTest ? "text-sm text-slate-400" : isModernBattle ? "text-sm text-[#8a7a60]" : "text-sm text-gray-300"
            }
          >
            Підготовка бою...
          </p>
        </div>
      </div>
    );
  }

  // Якщо моб не завантажений (але не при перемозі - там модалка показує нагороду)
  if (!mob && status !== "victory") {
    // Якщо є помилка в лозі (наприклад, немає удочки/наживки або моб на респавні)
    const errorMessage = log && log.length > 0 ? log[0] : null;
    if (status === "idle" && errorMessage) {
      // Визначаємо, куди повертатися: якщо це fishing зона - на риболовлю, інакше - в окрестность
      const isRespawnError = errorMessage.includes("ще не респавнувся");
      const isFishingZone = zoneId === "fishing";
      const returnPath = isFishingZone ? "/fishing" : locationPathForZoneMob(zoneId, mobIndex);
      const returnButtonText = isFishingZone ? "Повернутися до риболовлі" : "Повернутися в окрестность";
      
      return (
        <div
          className={
            isModernBattle
              ? `${battleShell} w-full min-w-0 my-1 flex items-center justify-center px-4 py-10 ${
                  isBattleTest ? "text-slate-200" : "text-[#d4c4a8]"
                }`
              : "text-white flex items-center justify-center px-4 py-8"
          }
        >
          <div className="space-y-3 max-w-[380px] text-center">
            <h1
              className={
                isBattleTest ? "text-lg font-bold text-rose-400" : isModernBattle ? "text-lg font-bold text-red-400" : "text-xl font-bold text-red-500"
              }
            >
              Помилка
            </h1>
            <p
              className={
                isBattleTest ? "text-sm text-slate-400" : isModernBattle ? "text-sm text-[#a89878]" : "text-sm text-gray-300"
              }
            >
              {errorMessage}
            </p>
            <button
              type="button"
              onClick={() => navigate(returnPath)}
              className={
                isBattleTest
                  ? "mt-3 px-5 py-2 rounded-xl border border-cyan-800/55 bg-[linear-gradient(180deg,#1e293b_0%,#0f172a_100%)] text-sm text-cyan-100 hover:border-cyan-500/45"
                  : isModernBattle
                    ? "mt-3 px-5 py-2 rounded-md border border-[#5c4a32]/80 bg-gradient-to-b from-[#2e2619] to-[#14110c] text-sm text-[#c9a44c] hover:border-[#c7ad80]/50"
                    : "mt-3 px-4 py-2 bg-yellow-600 rounded text-black hover:bg-yellow-700"
              }
            >
              {returnButtonText}
            </button>
          </div>
        </div>
      );
    }
    return (
      <div
        className={
          isModernBattle
            ? `${battleShell} w-full min-w-0 my-1 flex items-center justify-center px-4 py-10 ${
                isBattleTest ? "text-slate-200" : "text-[#d4c4a8]"
              }`
            : "text-white flex items-center justify-center px-4 py-8"
        }
      >
        <div className="space-y-3 max-w-[380px] text-center">
          <div
            className={
              isModernBattle
                ? isBattleTest
                  ? "mx-auto w-6 h-6 border-2 border-cyan-950 border-t-cyan-400 rounded-full animate-spin"
                  : "mx-auto w-6 h-6 border-2 border-[#5c4a32] border-t-[#c7ad80] rounded-full animate-spin"
                : "hidden"
            }
          />
          <h1
            className={
              isBattleTest
                ? "text-lg font-semibold text-cyan-200"
                : isModernBattle
                  ? "text-lg font-semibold text-[#e8c56e]"
                  : "text-xl font-bold"
            }
          >
            Завантаження...
          </h1>
          <p
            className={
              isBattleTest ? "text-sm text-slate-400" : isModernBattle ? "text-sm text-[#8a7a60]" : "text-sm text-gray-300"
            }
          >
            Завантаження бою...
          </p>
        </div>
      </div>
    );
  }

  // Екран перемоги лише коли це той самий бій, що в URL (інакше під стартом нового моба лишається старий snapshot).
  const victoryContextOk =
    Boolean(zoneId) &&
    mobIndex >= 0 &&
    battleZoneId === zoneId &&
    battleMobIndex === mobIndex;

  if (status === "victory" && lastReward && mob && victoryContextOk) {
    const handleHitNextMob = () => {
      if (zone && battleMobIndex !== undefined && zoneId) {
        const heroName = useHeroStore.getState().hero?.name;

        let nextMobIndex = battleMobIndex + 1;
        let foundNext = false;
        const maxAttempts = zone.mobs.length;
        let attempts = 0;

        while (nextMobIndex < zone.mobs.length && attempts < maxAttempts) {
          const nextMob = zone.mobs[nextMobIndex];
          const isRaidBoss = (nextMob as any).isRaidBoss === true;
          const onRespawn = isMobOnRespawn(zoneId, nextMobIndex, heroName);

          if (!isRaidBoss && !onRespawn) {
            foundNext = true;
            break;
          }

          nextMobIndex++;
          attempts++;
        }

        if (foundNext) {
          navigate(`/battle?zone=${zoneId}&idx=${nextMobIndex}`);
          setTimeout(() => {
            startBattle(zoneId, nextMobIndex);
          }, 100);
        } else {
          reset();
          navigate(locationPathForZoneMob(zone.id, battleMobIndex ?? mobIndex));
        }
      }
    };

    const handleContinueToLocation = () => {
      reset();
      navigate(locationPathForZoneMob(zone.id, battleMobIndex ?? mobIndex));
    };

    const cardExp = formatLootIntEn(lastReward.exp);
    const cardSp = formatLootIntEn(lastReward.sp ?? 0);
    const cardAdena = formatLootIntEn(lastReward.adena);

    const victoryNotifyL2 =
      "rounded-lg border border-[#5c4a32]/70 bg-black/35 shadow-[inset_0_1px_0_rgba(199,173,128,0.12)] overflow-hidden px-3 py-3";
    const victoryInnerDividerL2 = "border-t border-[#c7ad80]/15";
    const btnContinueL2 =
      "text-left text-[12px] py-1 text-[#c9a44c] hover:text-[#e8d4a8] hover:underline bg-transparent border-0 cursor-pointer w-fit font-medium transition-colors";
    const textHitNextL2 =
      "text-left text-[12px] py-0.5 text-[#8a7a60] hover:text-[#c9a44c] bg-transparent border-0 cursor-pointer w-fit transition-colors";
    const btnBackUnderLogL2 =
      "px-5 py-2 rounded-md border border-[#5c4a32]/80 bg-gradient-to-b from-[#2e2619] to-[#14110c] text-xs text-[#d4c4a8] shadow-[inset_0_1px_0_rgba(199,173,128,0.1)] hover:border-[#c7ad80]/45 hover:text-[#f4e2b8] active:scale-[0.99] transition-[border-color,color,transform] duration-150";
    const btnBackUnderLogTest =
      "px-5 py-2 rounded-xl border border-cyan-800/55 bg-[linear-gradient(180deg,#1e293b_0%,#0f172a_100%)] text-xs text-cyan-100/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_6px_16px_rgba(0,0,0,0.5)] hover:border-cyan-500/45 hover:text-white active:scale-[0.99] transition-[border-color,color,transform] duration-150";

    const victoryNotify = isBattleTest
      ? "rounded-xl border border-cyan-950/50 bg-[linear-gradient(180deg,rgba(15,23,42,0.92)_0%,rgba(2,6,23,0.96)_100%)] shadow-[inset_0_3px_12px_rgba(0,0,0,0.72),inset_0_1px_0_rgba(94,234,212,0.08)] overflow-hidden px-3 py-3"
      : victoryNotifyL2;
    const victoryInnerDivider = isBattleTest ? "border-t border-cyan-500/20" : victoryInnerDividerL2;
    const btnContinueVictory = isBattleTest
      ? "text-left text-[12px] py-1 text-cyan-200 hover:text-white hover:underline bg-transparent border-0 cursor-pointer w-fit font-medium transition-colors"
      : btnContinueL2;
    const textHitNextVictory = isBattleTest
      ? "text-left text-[12px] py-0.5 text-slate-500 hover:text-cyan-300 bg-transparent border-0 cursor-pointer w-fit transition-colors"
      : textHitNextL2;

    const victoryContent = (
      <>
        {isModernBattle ? (
          <>
            <p
              className={`${pad} text-center text-[11px] mb-2 ${
                isBattleTest ? "text-slate-400" : "text-[#8a7860]"
              }`}
            >
              <span className={isBattleTest ? "text-rose-400 font-medium" : "text-[#e85c5c] font-medium"}>
                {displayMobName(mob.name)}
              </span>
              {mob.aggressivePatrol ? (
                <span className={isBattleTest ? "text-rose-500" : "text-[#8b2020]"}> (агр)</span>
              ) : null}
              <span> · ур. {mob.level}</span>
            </p>
            <div className={`${pad} mb-2`}>
              <div className={victoryNotify}>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-lg leading-none select-none shrink-0 ${
                      isBattleTest ? "text-cyan-400/90" : "text-[#9d8265]"
                    }`}
                    aria-hidden
                  >
                    ⚔
                  </span>
                  <span
                    className={`text-[12px] font-bold tracking-wide leading-tight ${
                      isBattleTest ? "text-emerald-400" : "text-[#3bd16f]"
                    }`}
                  >
                    ВЫ ПОБЕДИЛИ МОНСТРА!
                  </span>
                </div>
                <div
                  className={`mt-2.5 ${victoryInnerDivider} pt-2.5 text-[12px] leading-relaxed text-left ${
                    isBattleTest ? "text-slate-300" : "text-[#d4c4a8]"
                  }`}
                >
                  <span>Выпало:</span>{" "}
                  <span className="tabular-nums">{cardAdena}</span>
                  <span> аден, </span>
                  <span className="tabular-nums">{cardExp}</span>
                  <span> EXP и </span>
                  <span className="tabular-nums">{cardSp}</span>
                  <span> SP</span>
                </div>
                <div className={`mt-3 flex flex-col gap-1 items-stretch pt-2 ${victoryInnerDivider}`}>
                  <button type="button" onClick={handleContinueToLocation} className={btnContinueVictory}>
                    Продолжить
                  </button>
                  <button type="button" onClick={handleHitNextMob} className={textHitNextVictory}>
                    Бить следующего!
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className={`${vLine} pt-2`}>
              <div className={`${pad} text-center text-sm font-semibold text-red-500`}>
                <span>{displayMobName(mob.name)}</span>
                {mob.aggressivePatrol ? <span className="text-[#5c0a0a]"> (агр)</span> : null}
                <span>, {mob.level} ур.</span>
              </div>
            </div>
            <div className={`${pad} mb-2 mt-2`}>
              <div className={`${boxLog} px-3 py-3`}>
                <div className="flex items-center gap-2">
                  <span className="text-[#a67c2c] text-lg leading-none" aria-hidden>
                    ⚔
                  </span>
                  <span className="text-[12px] font-bold text-green-500 tracking-wide">ВЫ ПОБЕДИЛИ МОНСТРА!</span>
                </div>
                <div className="mt-2.5 border-t border-[#c7ad80]/25 pt-2.5 text-[12px] text-[#d4c4a8] leading-relaxed text-left">
                  <span>Выпало:</span>{" "}
                  <span className="tabular-nums">{cardAdena}</span>
                  <span> аден, </span>
                  <span className="tabular-nums">{cardExp}</span>
                  <span> EXP и </span>
                  <span className="tabular-nums">{cardSp}</span>
                  <span> SP</span>
                </div>
                <div className="mt-3 flex flex-col gap-1 border-t border-[#c7ad80]/25 pt-3">
                  <button
                    type="button"
                    onClick={handleContinueToLocation}
                    className="text-left text-[12px] text-[#c9a44c] hover:text-[#e8d4a8] hover:underline bg-transparent border-0 cursor-pointer p-0 w-fit font-medium"
                  >
                    Продолжить
                  </button>
                  <button
                    type="button"
                    onClick={handleHitNextMob}
                    className="text-left text-[12px] text-[#8a7a60] hover:text-[#c9a44c] bg-transparent border-0 cursor-pointer p-0 w-fit"
                  >
                    Бить следующего!
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="px-3 mt-2">{vDivider}</div>

        <div className="mt-4 px-3">
          <div
            className={
              isBattleTest
                ? "text-[11px] uppercase tracking-[0.12em] text-cyan-200/85 font-semibold mb-2 flex items-center gap-2"
                : isModernBattle
                  ? "text-[11px] uppercase tracking-[0.12em] text-[#d4b878] font-semibold mb-2 flex items-center gap-2"
                  : "text-[12px] text-[#c7ad80] font-semibold mb-2"
            }
          >
            {isBattleTest && (
              <span className="h-px flex-1 max-w-[48px] bg-gradient-to-r from-cyan-400/45 to-transparent" />
            )}
            {isModernBattle && !isBattleTest && (
              <span className="h-px flex-1 max-w-[48px] bg-gradient-to-r from-[#c7ad80]/50 to-transparent" />
            )}
            Лог бою
            {isBattleTest && <span className="h-px flex-1 bg-gradient-to-l from-cyan-400/45 to-transparent" />}
            {isModernBattle && !isBattleTest && (
              <span className="h-px flex-1 bg-gradient-to-l from-[#c7ad80]/50 to-transparent" />
            )}
          </div>
          <div className={`${boxLog} w-full`}>
            <div
              className={`px-3 py-2 text-[12px] leading-[1.35] ${
                isBattleTest ? "text-slate-300" : "text-[#d4c4a8]"
              }`}
            >
              <BattleLog noBorder maxLines={18} />
            </div>
          </div>
          <div className="mt-3 flex justify-center">
            <button
              type="button"
              onClick={handleContinueToLocation}
              className={
                isBattleTest
                  ? btnBackUnderLogTest
                  : isModernBattle
                    ? btnBackUnderLogL2
                    : "px-4 py-2 bg-yellow-600 rounded text-black text-sm hover:bg-yellow-700"
              }
            >
              Назад в околицю
            </button>
          </div>
        </div>
      </>
    );
    return (
      <BattlePanel
        target={{
          name: displayMobName(mob.name),
          level: mob.level,
          currentHp: 0,
          maxHp: getMobEffectiveMaxHp(mob),
          isAggressivePatrol: mob.aggressivePatrol === true,
        }}
        buffs={[]}
        now={now}
        victoryContent={victoryContent}
        isL2={isModernBattle}
        isBattleTest={isBattleTest}
      />
    );
  }

  if (status === "victory" && !victoryContextOk) {
    return (
      <div
        className={
          isModernBattle
            ? `${battleShell} w-full min-w-0 my-1 flex items-center justify-center px-4 py-10 ${
                isBattleTest ? "text-slate-200" : "text-[#d4c4a8]"
              }`
            : "text-white flex items-center justify-center px-4 py-8"
        }
      >
        <div className="space-y-3 max-w-[380px] text-center">
          <div
            className={
              isModernBattle
                ? isBattleTest
                  ? "mx-auto w-6 h-6 border-2 border-cyan-950 border-t-cyan-400 rounded-full animate-spin"
                  : "mx-auto w-6 h-6 border-2 border-[#5c4a32] border-t-[#c7ad80] rounded-full animate-spin"
                : "hidden"
            }
          />
          <h1
            className={
              isBattleTest
                ? "text-lg font-semibold text-cyan-200"
                : isModernBattle
                  ? "text-lg font-semibold text-[#e8c56e]"
                  : "text-xl font-bold"
            }
          >
            Завантаження...
          </h1>
          <p
            className={
              isBattleTest ? "text-sm text-slate-400" : isModernBattle ? "text-sm text-[#8a7a60]" : "text-sm text-gray-300"
            }
          >
            Підготовка бою...
          </p>
        </div>
      </div>
    );
  }

  const mobMaxHp = mob ? getMobEffectiveMaxHp(mob) : 1;
  const battleTarget = mob
    ? {
        name: displayMobName(mob.name),
        level: mob.level,
        currentHp: Number.isFinite(mobHP) ? mobHP : mobMaxHp,
        maxHp: mobMaxHp,
        isAggressivePatrol: mob.aggressivePatrol === true,
      }
    : { name: "", level: 1, currentHp: 0, maxHp: 1 };

  const leaveBattleToLocation = async () => {
    const st = useBattleStore.getState();
    if (
      st.status === "fighting" &&
      st.zoneId != null &&
      st.mobIndex != null &&
      st.mob &&
      typeof st.mobHP === "number" &&
      st.mobHP > 0
    ) {
      await flushWorldMobHpSyncAsync(
        st.zoneId,
        st.mobIndex,
        st.mobHP,
        getMobEffectiveMaxHp(st.mob)
      ).catch(() => {});
    }
    reset();
    navigate(locationPathForZoneMob(zone.id, battleMobIndex ?? mobIndex));
  };

  return (
    <BattlePanel
      target={battleTarget}
      targetDebuffs={mobBuffs ?? []}
      buffs={heroBuffsForUi}
      now={now}
      backLabel={
        dead ? (resurrecting ? "..." : "Телепортироваться в город") : isModernBattle ? "Назад в околицю" : "Повернутися в локацію"
      }
      showBackButton={dead || status === "fighting" || status === "idle"}
      onBack={dead ? handleResurrectToCity : leaveBattleToLocation}
      isL2={isModernBattle}
      isBattleTest={isBattleTest}
    >
      <SkillBar />
    </BattlePanel>
  );
}
