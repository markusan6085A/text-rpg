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

  // Ініціалізація бою
  React.useEffect(() => {
    if (zoneId && mobIndex >= 0 && found) {
      // Не викликаємо startBattle, якщо вже була спроба для цієї комбінації zoneId+mobIndex
      // і статус "idle" без моба (це означає помилку)
      const isSameBattle = battleZoneId === zoneId && battleMobIndex === mobIndex;
      const hasError = status === "idle" && !mob;
      
      if (isSameBattle && hasError) {
        // Вже була спроба і є помилка - не повторюємо
        return;
      }
      
      // Викликаємо startBattle тільки якщо це новий бій або бій ще не ініціалізовано
      if (!isSameBattle || status === undefined) {
        startBattle(zoneId, mobIndex);
      }
    }
  }, [zoneId, mobIndex, found, battleZoneId, battleMobIndex, startBattle, status, mob]);

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
      <div className="w-full text-white px-4 py-2">
        <div className="w-full max-w-[360px] mx-auto space-y-3">
          {/* Інформація про моба */}
          <div className="text-center">
            <div className="text-lg font-semibold text-red-500">
              {mob.name}, {mob.level} ур.
            </div>
          </div>

          {/* Риска */}
          <div className="w-full h-px bg-[#654321]"></div>

          {/* ПОБЕДА! */}
          <div className="text-center">
            <div className="text-base font-bold text-green-500">ПОБЕДА!</div>
          </div>

          {/* Риска */}
          <div className="w-full h-px bg-[#654321]"></div>

          {/* Дроп */}
          <div className="p-3">
            <div className="text-sm font-semibold mb-2">Выпало:</div>
            <div className="space-y-1 text-xs">
              {lastReward.exp > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-green-300">Опыт:</span>
                  <span className="text-green-300">+{lastReward.exp}</span>
                </div>
              )}
              {lastReward.sp !== undefined && lastReward.sp > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-yellow-600">SP:</span>
                  <span className="text-yellow-600">+{lastReward.sp}</span>
                </div>
              )}
              {lastReward.adena > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400">Adena</span>
                  <span className="text-yellow-400 text-[10px]">(x{lastReward.adena})</span>
                </div>
              )}
            </div>
          </div>

          {/* Риска */}
          <div className="w-full h-px bg-[#654321]"></div>

          {/* Кнопки в один ряд */}
          <div className="flex items-center gap-2 text-xs justify-center">
            <button
              onClick={handleTakeAndNext}
              className="text-gray-400 hover:underline cursor-pointer font-bold"
            >
              Забрать и бить следующего!
            </button>
            <span className="text-gray-500">|</span>
            <button
              onClick={handleNextOnly}
              className="text-gray-400 hover:underline cursor-pointer font-bold"
            >
              Бить следующего!
            </button>
          </div>

          {/* Риска */}
          <div className="w-full h-px bg-[#654321]"></div>

          {/* Лог бою */}
          <div className="p-2">
            <div className="text-sm font-semibold mb-2 text-[#87ceeb]">Лог бою:</div>
            <BattleLog />
          </div>

          {/* 🔥 Інформація про моба та урон - нижче модалки */}
          {lastMobDamage !== undefined && (
            <div className="text-center pb-2 px-3 border-t border-[#654321] pt-2">
              <div className="text-xs text-gray-300">
                <span className="text-red-400 font-semibold">{mob.name}</span>
                {" наносит "}
                <span className="text-red-500 font-bold">{Math.round(lastMobDamage)}</span>
                {" урона"}
              </div>
            </div>
          )}

          {/* Кнопка В окрестности */}
          <div className="flex justify-center">
            <button
              onClick={handleTakeAndLocation}
              className="text-white hover:underline cursor-pointer flex items-center gap-1 text-xs"
            >
              <span></span>
              <span>В окрестности</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full text-white px-4 pt-0 pb-2">
      <div className="w-full max-w-[360px] mx-auto space-y-2">
        {/* Картка цілі (моб) — піднята вище */}
        {mob && (
          <>
            <div className="flex justify-center -mt-1">
              <TargetCard zone={zone} city={city} mob={mob} />
            </div>
            <div className="w-full h-px bg-[#654321]" />
          </>
        )}

        {/* Бари бафів */}
        <BuffBar buffs={heroBuffs || []} now={now} />
        <div className="w-full h-px bg-[#654321]" />

        {/* Панель навичок */}
        <SkillBar />
        <div className="w-full h-px bg-[#654321]" />

        {/* Лог бою — 10 повідомлень у рамці */}
        <div className="p-2">
          <div className="text-sm font-semibold mb-2 text-[#f5d7a1]">Лог бою:</div>
          <BattleLog />
        </div>

        {/* Кнопки управління */}
        <div className="flex gap-2 justify-center">
          {status === "idle" && (
            <button
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
  );
}
