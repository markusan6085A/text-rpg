import React from "react";
import { useBattleStore } from "../../state/battle/store";
import { findZoneWithCity } from "./battleUtils";
import { isMobOnRespawn } from "../../state/battle/mobRespawns";
import { useHeroStore } from "../../state/heroStore";

interface VictoryModalProps {
  navigate: (path: string) => void;
  onClose: () => void;
}

export default function VictoryModal({ navigate, onClose }: VictoryModalProps) {
  const { lastReward, zoneId, mobIndex, startBattle, reset, lastMobDamage, mob } = useBattleStore();

  if (!lastReward || !zoneId) {
    return null;
  }

  const found = findZoneWithCity(zoneId);
  const zone = found?.zone;
  const currentMobIndex = mobIndex ?? -1;

  const handleTakeAndNext = () => {
    // Нагорода вже застосована при вбивстві моба
    // Просто починаємо бій з наступним мобом
    // НЕ викликаємо reset(), щоб зберегти сумон - startBattle() сам збереже живий сумон
    if (zone && currentMobIndex >= 0) {
      const heroName = useHeroStore.getState().hero?.name;
      
      // Шукаємо наступного доступного моба (пропускаємо рейд-босів та мобів на респавні)
      let nextMobIndex = currentMobIndex + 1;
      let foundNext = false;
      const maxAttempts = zone.mobs.length; // Захист від зациклення
      let attempts = 0;
      
      while (nextMobIndex < zone.mobs.length && attempts < maxAttempts) {
        const mob = zone.mobs[nextMobIndex];
        const isRaidBoss = (mob as any).isRaidBoss === true;
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
        // Спочатку закриваємо модалку, потім навігуємо, потім починаємо бій
        onClose();
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
    } else {
      // Якщо немає зони або індексу, повертаємося в локацію
      reset();
      if (zone) {
        navigate(`/location?id=${zone.id}`);
      } else {
        navigate("/location");
      }
    }
  };

  const handleNextOnly = () => {
    // Нагорода вже застосована, просто починаємо бій з наступним мобом
    handleTakeAndNext();
  };

  const handleTakeAndLocation = () => {
    // Нагорода вже застосована, повертаємося в локацію
    reset();
    if (zone) {
      navigate(`/location?id=${zone.id}`);
    } else {
      navigate("/location");
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-start justify-center z-50"
      style={{ paddingTop: "15vh" }}
      onClick={(e) => {
        // Закриваємо модалку при кліку на фон
        if (e.target === e.currentTarget) {
          handleTakeAndLocation();
        }
      }}
    >
      <div 
        className="relative max-w-xs w-full mx-4 rounded-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundImage: "url('/victory/bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          boxShadow: "inset 0 0 30px 10px rgba(0, 0, 0, 0.8)",
        }}
      >
        {/* Overlay для затемнення країв */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            boxShadow: "inset 0 0 40px 15px rgba(0, 0, 0, 0.9)",
          }}
        />
        
        <div className="relative z-10">
          {/* Заголовок */}
          <div className="text-center pt-3 pb-1.5">
            <img 
              src="/victory/title.png" 
              alt="Перемога!" 
              className="mx-auto mb-1.5"
              style={{ maxHeight: "32px" }}
            />
            <p className="text-xs">
              <span className="text-red-500 font-semibold">{lastReward.mob}</span>{" "}
              <span className="text-gray-400">повержений</span>
            </p>
          </div>

          {/* Нагорода в один ряд з текстом під іконками */}
          <div className="flex justify-center items-start gap-3 px-3 py-2">
            <div className="flex flex-col items-center gap-1">
              <img src="/victory/exp.png" alt="EXP" className="w-5 h-5" />
              <span className="text-gray-400 text-xs">Досвід:</span>
              <span className="text-[#d0d0d0] font-semibold text-xs">+{lastReward.exp}</span>
            </div>
            {lastReward.sp !== undefined && (
              <div className="flex flex-col items-center gap-1">
                <img src="/victory/sp.png" alt="SP" className="w-5 h-5" />
                <span className="text-yellow-500 text-xs">SP:</span>
                <span className="text-[#d0d0d0] font-semibold text-xs">+{lastReward.sp}</span>
              </div>
            )}
            <div className="flex flex-col items-center gap-1">
              <img src="/victory/adena.png" alt="Adena" className="w-5 h-5" />
              <span className="text-[#ffd700] text-xs">Адена:</span>
              <span className="text-[#d0d0d0] font-semibold text-xs">+{lastReward.adena}</span>
            </div>
          </div>

          {/* Дроп (заглушка) */}
          <div className="text-center pb-2 text-xs text-gray-400">
            Дроп: немає
          </div>

          {/* 🔥 Інформація про моба та урон - нижче модалки */}
          {mob && lastMobDamage !== undefined && (
            <div className="text-center pb-2 px-3">
              <div className="text-xs text-gray-300">
                <span className="text-red-400 font-semibold">{mob.name}</span>
                {" наносит "}
                <span className="text-red-500 font-bold">{Math.round(lastMobDamage)}</span>
                {" урона"}
              </div>
            </div>
          )}

          {/* Кнопки */}
          <div className="flex flex-col items-center gap-1 pb-3 px-3">
            <button
              onClick={handleTakeAndNext}
              className="hover:opacity-90 transition-opacity"
              style={{ width: "60%" }}
            >
              <img 
                src="/victory/btn-next.png" 
                alt="Забрать и бить следующего!" 
                className="w-full h-auto"
              />
            </button>
            <button
              onClick={handleNextOnly}
              className="hover:opacity-90 transition-opacity"
              style={{ width: "60%" }}
            >
              <img 
                src="/victory/btn-next.png" 
                alt="Бить следующего!" 
                className="w-full h-auto"
              />
            </button>
            <button
              onClick={handleTakeAndLocation}
              className="hover:opacity-90 transition-opacity"
              style={{ width: "60%" }}
            >
              <img 
                src="/victory/btn-town.png" 
                alt="Забрать и в окресность" 
                className="w-full h-auto"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

