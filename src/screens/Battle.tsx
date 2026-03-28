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
import { getCityUiVariant } from "../utils/cityUiVariant";
import { displayMobName } from "../utils/worldDisplay";
import { useGameSettingsVersion } from "../hooks/useGameSettingsVersion";
import { clearDeathGate } from "../utils/deathGate";
import { formatLootIntEn } from "../state/battle/helpers/victoryLootLogLines";

type Navigate = (path: string) => void;

interface BattleProps {
  navigate: Navigate;
}

export default function Battle({ navigate }: BattleProps) {
  useGameSettingsVersion();
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
  const isL2 = getCityUiVariant() === "l2";
  const l2Frame =
    "rounded-xl overflow-hidden border border-[#c7ad80]/35 shadow-[0_0_0_1px_rgba(0,0,0,0.85),0_16px_48px_rgba(0,0,0,0.65)] bg-[radial-gradient(ellipse_100%_50%_at_50%_-8%,rgba(120,90,45,0.28)_0%,transparent_50%),linear-gradient(180deg,#1c1812_0%,#0c0a08_100%)]";

  const handleResurrectToCity = async () => {
    if (!characterId || !hero || resurrecting) return;
    setResurrecting(true);
    setResurrectInProgress(true);
    try {
      const char = await resurrectCharacter(characterId, 0.7);
      const hj = (char as any)?.heroJson;
      if (hero?.name) clearDeathGate(characterId, hero.name);
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
  const boxLog = isL2
    ? "rounded-lg border border-[#5c4a32]/70 bg-black/35 shadow-[inset_0_1px_0_rgba(199,173,128,0.12)] overflow-hidden"
    : boxBlue;
  const vLine = isL2 ? "border-t border-[#c7ad80]/25" : lineGold;
  const vDivider = isL2 ? (
    <div className="border-t border-[#c7ad80]/20 mt-2" />
  ) : (
    dividerGold
  );
  const btnGold =
    "w-full text-center text-[12px] py-2 rounded-lg " +
    "border border-[#c7ad80]/80 text-[#c7ad80] " +
    "bg-[#151311]/40 shadow-[inset_0_0_10px_rgba(199,173,128,0.10)] " +
    "hover:bg-[#2a2015] transition-colors";
  const btnGreen =
    "w-full text-center text-[12px] py-2 rounded-lg border border-[#3bd16f]/70 " +
    "text-[#3bd16f] hover:bg-[#102314] transition-colors";

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
      if (useBattleStore.getState().status === "fighting") processMobAttackRef.current();
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
          isL2
            ? `${l2Frame} w-full min-w-0 my-1 flex items-center justify-center px-4 py-10 text-[#d4c4a8]`
            : "text-white flex items-center justify-center px-4 py-8"
        }
      >
        <div className="space-y-3 max-w-[380px] text-center">
          <h1 className={isL2 ? "text-lg font-bold text-[#e8c56e]" : "text-xl font-bold"}>Помилка</h1>
          <p className={isL2 ? "text-sm text-[#a89878]" : "text-sm text-gray-300"}>
            Зона або моб не знайдені.
          </p>
          <button
            type="button"
            onClick={() => navigate("/location")}
            className={
              isL2
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
          isL2
            ? `${l2Frame} w-full min-w-0 my-1 flex items-center justify-center px-4 py-10 text-[#d4c4a8]`
            : "text-white flex items-center justify-center px-4 py-8"
        }
      >
        <div className="space-y-3 max-w-[380px] text-center">
          <div
            className={
              isL2
                ? "mx-auto w-6 h-6 border-2 border-[#5c4a32] border-t-[#c7ad80] rounded-full animate-spin"
                : "hidden"
            }
          />
          <h1 className={isL2 ? "text-lg font-semibold text-[#e8c56e]" : "text-xl font-bold"}>Завантаження...</h1>
          <p className={isL2 ? "text-sm text-[#8a7a60]" : "text-sm text-gray-300"}>Підготовка бою...</p>
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
            isL2
              ? `${l2Frame} w-full min-w-0 my-1 flex items-center justify-center px-4 py-10 text-[#d4c4a8]`
              : "text-white flex items-center justify-center px-4 py-8"
          }
        >
          <div className="space-y-3 max-w-[380px] text-center">
            <h1 className={isL2 ? "text-lg font-bold text-red-400" : "text-xl font-bold text-red-500"}>Помилка</h1>
            <p className={isL2 ? "text-sm text-[#a89878]" : "text-sm text-gray-300"}>{errorMessage}</p>
            <button
              type="button"
              onClick={() => navigate(returnPath)}
              className={
                isL2
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
          isL2
            ? `${l2Frame} w-full min-w-0 my-1 flex items-center justify-center px-4 py-10 text-[#d4c4a8]`
            : "text-white flex items-center justify-center px-4 py-8"
        }
      >
        <div className="space-y-3 max-w-[380px] text-center">
          <div
            className={
              isL2
                ? "mx-auto w-6 h-6 border-2 border-[#5c4a32] border-t-[#c7ad80] rounded-full animate-spin"
                : "hidden"
            }
          />
          <h1 className={isL2 ? "text-lg font-semibold text-[#e8c56e]" : "text-xl font-bold"}>Завантаження...</h1>
          <p className={isL2 ? "text-sm text-[#8a7a60]" : "text-sm text-gray-300"}>Завантаження бою...</p>
        </div>
      </div>
    );
  }

  // Екран перемоги
  if (status === "victory" && lastReward && mob) {
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

    const victoryContent = (
      <>
        {isL2 ? (
          <>
            <p className={`${pad} text-center text-[11px] text-[#8a7860] mb-2`}>
              <span className="text-[#e85c5c] font-medium">{displayMobName(mob.name)}</span>
              {mob.aggressivePatrol ? <span className="text-[#8b2020]"> (агр)</span> : null}
              <span> · ур. {mob.level}</span>
            </p>
            <div className={`${pad} mb-2`}>
              <div className={victoryNotifyL2}>
                <div className="flex items-center gap-2">
                  <span className="text-[#9d8265] text-lg leading-none select-none shrink-0" aria-hidden>
                    ⚔
                  </span>
                  <span className="text-[12px] font-bold text-[#3bd16f] tracking-wide leading-tight">
                    ВЫ ПОБЕДИЛИ МОНСТРА!
                  </span>
                </div>
                <div className={`mt-2.5 ${victoryInnerDividerL2} pt-2.5 text-[12px] text-[#d4c4a8] leading-relaxed text-left`}>
                  <span>Выпало:</span>{" "}
                  <span className="tabular-nums">{cardAdena}</span>
                  <span> аден, </span>
                  <span className="tabular-nums">{cardExp}</span>
                  <span> EXP и </span>
                  <span className="tabular-nums">{cardSp}</span>
                  <span> SP</span>
                </div>
                <div className={`mt-3 flex flex-col gap-1 items-stretch pt-2 ${victoryInnerDividerL2}`}>
                  <button type="button" onClick={handleContinueToLocation} className={btnContinueL2}>
                    Продолжить
                  </button>
                  <button type="button" onClick={handleHitNextMob} className={textHitNextL2}>
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
              isL2
                ? "text-[11px] uppercase tracking-[0.12em] text-[#d4b878] font-semibold mb-2 flex items-center gap-2"
                : "text-[12px] text-[#c7ad80] font-semibold mb-2"
            }
          >
            {isL2 && <span className="h-px flex-1 max-w-[48px] bg-gradient-to-r from-[#c7ad80]/50 to-transparent" />}
            Лог бою
            {isL2 && <span className="h-px flex-1 bg-gradient-to-l from-[#c7ad80]/50 to-transparent" />}
          </div>
          <div className={`${boxLog} w-full`}>
            <div className="px-3 py-2 text-[12px] leading-[1.35] text-[#d4c4a8]">
              <BattleLog noBorder maxLines={18} />
            </div>
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
        isL2={isL2}
      />
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

  return (
    <BattlePanel
      target={battleTarget}
      buffs={heroBuffs || []}
      now={now}
      backLabel={dead ? (resurrecting ? "..." : "Телепортироваться в город") : "Повернутися в локацію"}
      showBackButton={status === "idle"}
      onBack={
        dead
          ? handleResurrectToCity
          : () => {
              reset();
              navigate(locationPathForZoneMob(zone.id, mobIndex));
            }
      }
      isL2={isL2}
    >
      <SkillBar />
    </BattlePanel>
  );
}
