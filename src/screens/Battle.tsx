// src/screens/Battle.tsx
import React from "react";
import { useBattleStore } from "../state/battle/store";
import { useBattleQuery, findZoneWithCity } from "./battle/battleUtils";
import { TargetCard } from "./battle/TargetCard";
import { SkillBar } from "./battle/SkillBar";
import { BattleLog } from "./battle/BattleLog";
import { BuffBar } from "./battle/BuffBar";
import { useHeroStore } from "../state/heroStore";
import { isMobOnRespawn } from "../state/battle/mobRespawns";

type Navigate = (path: string) => void;

interface BattleProps {
  navigate: Navigate;
}

export default function Battle({ navigate }: BattleProps) {
  // Використовуємо стан для відстеження змін URL
  const [urlParams, setUrlParams] = React.useState(() => new URLSearchParams(location.search));
  
  React.useEffect(() => {
    // Оновлюємо параметри URL при зміні
    const checkUrl = () => {
      const currentParams = new URLSearchParams(location.search);
      const currentZone = currentParams.get("zone") || "";
      const currentIdx = currentParams.get("idx") || "";
      const prevZone = urlParams.get("zone") || "";
      const prevIdx = urlParams.get("idx") || "";
      
      if (currentZone !== prevZone || currentIdx !== prevIdx) {
        setUrlParams(currentParams);
      }
    };
    
    // Перевіряємо зміни URL кожні 50мс
    const interval = setInterval(checkUrl, 50);
    
    // Слухаємо події навігації
    const handlePopState = () => {
      setUrlParams(new URLSearchParams(location.search));
    };
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [urlParams]);
  
  const zoneId = urlParams.get("zone") || "";
  const mobIndexStr = urlParams.get("idx") || "";
  const mobIndex = Number.isFinite(Number(mobIndexStr)) ? Number(mobIndexStr) : -1;

  const {
    startBattle,
    processMobAttack,
    regenTick,
    status,
    mob,
    zoneId: battleZoneId,
    mobIndex: battleMobIndex,
    heroBuffs,
    reset,
    lastReward,
    log,
    lastMobDamage,
  } = useBattleStore();

  const hero = useHeroStore((s) => s.hero);
  const [now, setNow] = React.useState(Date.now());
  const found = zoneId ? findZoneWithCity(zoneId) : undefined;

  const lineGold = "border-t border-[#c7ad80]/80";
  const lineGoldThick = "border-t-2 border-[#c7ad80]";
  const pad = "px-3";
  const boxGreen = "border border-[#3bd16f]/70 bg-[#0b140d]/35";
  const boxBlue = "border-2 border-[#4aa3ff]/80 bg-black/25";
  const btnGold =
    "w-full text-center text-[12px] py-1.5 border border-[#c7ad80]/80 " +
    "text-[#c7ad80] hover:bg-[#2a2015] transition-colors rounded";
  const btnGreen =
    "w-full text-center text-[12px] py-1.5 border border-[#3bd16f]/70 " +
    "text-[#3bd16f] hover:bg-[#102314] transition-colors rounded";

  // Ініціалізація бою
  React.useEffect(() => {
    if (zoneId && mobIndex >= 0 && found) {
      // Чекаємо hero перед стартом (API може завантажувати після reload)
      if (!hero) return;

      const isSameBattle = battleZoneId === zoneId && battleMobIndex === mobIndex;
      const hasError = status === "idle" && !mob;

      // Якщо була помилка "Hero not found", а тепер hero завантажився — повторити startBattle
      if (isSameBattle && hasError && hero) {
        startBattle(zoneId, mobIndex);
        return;
      }
      if (isSameBattle && hasError) return; // Інша помилка — не повторюємо

      // Викликаємо startBattle для нового бою або коли бій ще не ініціалізовано
      if (!isSameBattle || status === undefined) {
        startBattle(zoneId, mobIndex);
      }
    }
  }, [zoneId, mobIndex, found, battleZoneId, battleMobIndex, startBattle, status, mob, hero]);

  // Таймер для регенерації та атак мобів
  React.useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);
      if (status === "fighting") {
        regenTick();
        processMobAttack();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [status, regenTick, processMobAttack]);

  // Якщо зона або моб не знайдені
  if (!found || mobIndex < 0) {
    return (
      <div className="text-white flex items-center justify-center px-4 py-8">
        <div className="space-y-3 max-w-[380px] text-center">
          <h1 className="text-xl font-bold">Помилка</h1>
          <p className="text-sm text-gray-300">
            Зона або моб не знайдені.
          </p>
          <button
            onClick={() => navigate("/location")}
            className="mt-3 px-4 py-2 bg-yellow-600 rounded text-black"
          >
            Повернутися в локацію
          </button>
        </div>
      </div>
    );
  }

  const { zone, city } = found;

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
        <div className="text-white flex items-center justify-center px-4 py-8">
          <div className="space-y-3 max-w-[380px] text-center">
            <h1 className="text-xl font-bold text-red-500">Помилка</h1>
            <p className="text-sm text-gray-300">{errorMessage}</p>
            <button
              onClick={() => navigate(returnPath)}
              className="mt-3 px-4 py-2 bg-yellow-600 rounded text-black hover:bg-yellow-700"
            >
              {returnButtonText}
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="text-white flex items-center justify-center px-4 py-8">
        <div className="space-y-3 max-w-[380px] text-center">
          <h1 className="text-xl font-bold">Завантаження...</h1>
          <p className="text-sm text-gray-300">
            Завантаження бою...
          </p>
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

    return (
      <div className="w-full text-white py-2">
        <div className="w-full max-w-[360px] mx-auto">
          {/* Інформація про моба */}
          <div className={`${lineGold} pt-2`}>
            <div className={`${pad} text-center text-lg font-semibold text-red-500`}>
              {mob.name}, {mob.level} ур.
            </div>
          </div>

          {/* ПОБЕДА! */}
          <div className={`${lineGold} py-2`}>
            <div className={`${pad} text-center`}>
              <div className="text-base font-bold text-green-500">ПОБЕДА!</div>
            </div>
          </div>

          {/* Дроп — зелена рамка */}
          <div className="mt-3">
            <div className={`${boxGreen} rounded-sm`}>
              <div className="border-b border-[#3bd16f]/60 py-2">
                <div className={`${pad} text-[12px] text-[#3bd16f] font-semibold`}>Выпало:</div>
              </div>
              <div className={`${pad} py-2 text-[12px] text-[#cfead6] space-y-1`}>
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
              <div className="border-t border-[#3bd16f]/60 py-1" />
            </div>
          </div>

          {/* Кнопки: ліворуч Бить следующего! (золото), праворуч Забрать и бить следующего! (зелений) */}
          <div className={`${lineGold} mt-3 pt-2`}>
            <div className={`${pad} grid grid-cols-2 gap-2`}>
              <button type="button" className={btnGold} onClick={handleNextOnly}>
                Бить следующего!
              </button>
              <button type="button" className={btnGreen} onClick={handleTakeAndNext}>
                Забрать и бить следующего!
              </button>
            </div>
          </div>

          {/* Лог бою — синя рамка, w-full */}
          <div className={`${lineGold} mt-3 pt-2`}>
            <div className={pad}>
              <div className="text-[12px] text-[#c7ad80] font-semibold mb-2">Лог бою:</div>
              <div className={`${boxBlue} w-full rounded-sm`}>
                <div className={`${pad} py-2 text-[11px] leading-4`}>
                  <BattleLog noBorder />
                </div>
              </div>
            </div>
          </div>

          {/* В окрестности */}
          <div className={`${lineGold} py-2`}>
            <div className={pad}>
              <button
                type="button"
                onClick={handleTakeAndLocation}
                className="text-white hover:underline cursor-pointer flex items-center gap-1 text-xs"
              >
                <span>В окрестности</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full text-white pt-0 pb-2">
      <div className="w-full max-w-[360px] mx-auto">
        {/* Картка цілі (моб) */}
        {mob && (
          <>
            <div className={`${lineGold} pt-2`}>
              <div className={pad}>
                <div className="flex justify-center -mt-1">
                  <TargetCard zone={zone} city={city} mob={mob} />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Бари бафів — відступ зверху від HP моба */}
        <div className={`${lineGold} pt-3`}>
          <div className={pad}>
            <BuffBar buffs={heroBuffs || []} now={now} />
          </div>
        </div>

        {/* Панель навичок */}
        <div className={lineGold}>
          <div className={pad}>
            <SkillBar />
          </div>
        </div>

        {/* Лог бою — синя рамка, w-full */}
        <div className={`${lineGold} pt-2`}>
          <div className={pad}>
            <div className="text-[12px] text-[#c7ad80] font-semibold mb-2">Лог бою:</div>
            <div className={`${boxBlue} w-full rounded-sm`}>
              <div className={`${pad} py-2 text-[11px] leading-4`}>
                <BattleLog noBorder />
              </div>
            </div>
          </div>
        </div>

        {/* Кнопки управління */}
        <div className={`${lineGold} pt-2`}>
          <div className={`${pad} flex gap-2 justify-center`}>
            {status === "idle" && (
              <button
                type="button"
                onClick={() => {
                  reset();
                  navigate(`/location?id=${zone.id}`);
                }}
                className="px-4 py-2 bg-yellow-600 rounded text-black text-sm"
              >
                Повернутися в локацію
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
