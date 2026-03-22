// src/screens/Battle.tsx
import React from "react";
import { useBattleStore } from "../state/battle/store";
import { useCharacterStore } from "../state/characterStore";
import { useHeroStore, setResurrectInProgress } from "../state/heroStore";
import { isHeroDead } from "../state/heroStore/isHeroDead";
import { resurrectCharacter } from "../utils/api";
import { findZoneWithCity } from "./battle/battleUtils";
import { SkillBar } from "./battle/SkillBar";
import { BattleLog } from "./battle/BattleLog";
import { BattlePanel } from "./battle/BattlePanel";
import { isMobOnRespawn } from "../state/battle/mobRespawns";
import { getMobEffectiveMaxHp } from "../utils/mobs/mobEffectiveMaxHp";
import { getCityUiVariant } from "../utils/cityUiVariant";
import { clearDeathGate } from "../utils/deathGate";

type Navigate = (path: string) => void;

interface BattleProps {
  navigate: Navigate;
}

export default function Battle({ navigate }: BattleProps) {
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
      const returnPath = isFishingZone ? "/fishing" : `/location?id=${zoneId}`;
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
    const handleTakeAndNext = () => {
      if (zone && battleMobIndex !== undefined && zoneId) {
        const heroName = useHeroStore.getState().hero?.name;
        
        // Шукаємо наступного доступного моба (пропускаємо рейд-босів та мобів на респавні)
        let nextMobIndex = battleMobIndex + 1;
        let foundNext = false;
        const maxAttempts = zone.mobs.length; // Захист від зациклення
        let attempts = 0;
        
        while (nextMobIndex < zone.mobs.length && attempts < maxAttempts) {
          const nextMob = zone.mobs[nextMobIndex];
          const isRaidBoss = (nextMob as any).isRaidBoss === true;
          const onRespawn = isMobOnRespawn(zoneId, nextMobIndex, heroName);
          
          // Пропускаємо рейд-босів та мобів на респавні
          if (!isRaidBoss && !onRespawn) {
            foundNext = true;
            break;
          }
          
          nextMobIndex++;
          attempts++;
        }
        
        if (foundNext) {
          // Знайшли наступного доступного моба
          // Спочатку навігуємо, потім починаємо бій
          navigate(`/battle?zone=${zoneId}&idx=${nextMobIndex}`);
          // Викликаємо startBattle після невеликої затримки, щоб URL встиг оновитися
          setTimeout(() => {
            startBattle(zoneId, nextMobIndex);
          }, 100);
        } else {
          // Немає більше доступних мобів в зоні
          reset();
          navigate(`/location?id=${zone.id}`);
        }
      }
    };

    const handleNextOnly = () => {
      handleTakeAndNext();
    };

    const handleTakeAndLocation = () => {
      reset();
      navigate(`/location?id=${zone.id}`);
    };

    const handleTakeAll = () => {
      // Дроп вже застосований при вбивстві моба
      // Ця кнопка просто закриває екран перемоги
    };

    const victoryContent = (
      <>
          {/* Інформація про моба */}
          <div className={`${vLine} pt-2`}>
            <div className={`${pad} text-center text-lg font-semibold text-red-500`}>
              <span>{mob.name}</span>
              {mob.aggressivePatrol ? (
                <span className="text-[#5c0a0a]"> (агр)</span>
              ) : null}
              <span>, {mob.level} ур.</span>
            </div>
          </div>

          {/* ПОБЕДА! */}
          <div className={`${vLine} py-2`}>
            <div className={`${pad} text-center`}>
              <div className="text-base font-bold text-green-500">ПОБЕДА!</div>
            </div>
          </div>

          {/* Выпало + дроп (рамка тільки навколо списку) */}
          <div className="mt-3">
            <div className={pad}>
              <div className="text-[12px] text-[#3bd16f] font-semibold">Выпало:</div>
              <div className="mt-1 h-[2px] w-10 bg-[#3bd16f]/70 rounded-full" />
            </div>
            <div className="mt-2 px-3">
              <div
                className="
                  rounded-lg
                  border-2 border-[#3bd16f]/70
                  bg-[#07140b]/45
                  shadow-[inset_0_0_12px_rgba(59,209,111,0.18)]
                  overflow-hidden
                "
              >
                <div className="h-[2px] bg-[#3bd16f]/60" />
                <div className="px-3 py-2 text-[12px] text-[#cfead6] space-y-1">
                  {lastReward.exp > 0 && (
                    <div className="flex justify-between">
                      <span>Опыт:</span>
                      <span className="text-[#3bd16f]">+{lastReward.exp}</span>
                    </div>
                  )}
                  {lastReward.sp !== undefined && lastReward.sp > 0 && (
                    <div className="flex justify-between">
                      <span>SP:</span>
                      <span className="text-[#3bd16f]">+{lastReward.sp}</span>
                    </div>
                  )}
                  {lastReward.adena > 0 && (
                    <div className="flex justify-between">
                      <span>Adena</span>
                      <span className="text-[#3bd16f]">(x{lastReward.adena})</span>
                    </div>
                  )}
                </div>
                <div className="h-[2px] bg-[#3bd16f]/60" />
              </div>
            </div>
          </div>

          {/* лінія ВИЩЕ дій */}
          <div className="px-3">{vDivider}</div>

          {/* Дії без рамок */}
          <div className="mt-2 px-3 text-center text-[12px]">
            <span
              role="button"
              tabIndex={0}
              onClick={handleNextOnly}
              onKeyDown={(e) => e.key === "Enter" && handleNextOnly()}
              className="cursor-pointer text-[#c7ad80] hover:text-[#e7d7b3] transition-colors"
            >
              Бить следующего!
            </span>
            <span className="mx-2 text-[#c7ad80]/70">|</span>
            <span
              role="button"
              tabIndex={0}
              onClick={handleTakeAndNext}
              onKeyDown={(e) => e.key === "Enter" && handleTakeAndNext()}
              className="cursor-pointer text-[#3bd16f] hover:text-[#6dff9a] transition-colors"
            >
              Забрать и бить следующего!
            </span>
          </div>

          {/* Лог бою — без лінії під рамкою */}
          <div className="mt-3 px-3">
            <div
              className={
                isL2
                  ? "text-[12px] text-[#e8c56e] font-semibold mb-2"
                  : "text-[12px] text-[#c7ad80] font-semibold mb-2"
              }
            >
              Лог бою:
            </div>
            <div className={`${boxLog} w-full`}>
              <div className="px-3 py-2 text-[11px] leading-4 text-[#d4c4a8]">
                <BattleLog noBorder />
              </div>
            </div>
          </div>

          {/* В окрестности + лінія під ним */}
          <div className="mt-4">
            <button
              type="button"
              onClick={handleTakeAndLocation}
              className={
                isL2
                  ? "w-full px-3 text-center text-[12px] text-[#c9a44c] hover:text-[#f4e2b8] transition-colors cursor-pointer"
                  : "w-full px-3 text-center text-[12px] text-white/90 hover:text-white transition-colors cursor-pointer"
              }
            >
              В окрестности
            </button>
            <div className="px-3">{vDivider}</div>
          </div>
        </>
    );
    return (
      <BattlePanel
        target={{
          name: mob.name,
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
        name: mob.name,
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
      backLabel={dead ? (resurrecting ? "..." : "В город (70% HP)") : "Повернутися в локацію"}
      showBackButton={status === "idle"}
      onBack={dead ? handleResurrectToCity : () => { reset(); navigate(`/location?id=${zone.id}`); }}
      isL2={isL2}
    >
      <SkillBar />
    </BattlePanel>
  );
}
