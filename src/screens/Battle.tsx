// src/screens/Battle.tsx
import React from "react";
import { useBattleStore } from "../state/battle/store";
import { useBattleQuery, findZoneWithCity } from "./battle/battleUtils";
import { TargetCard } from "./battle/TargetCard";
import { SkillBar } from "./battle/SkillBar";
import { BattleLog } from "./battle/BattleLog";
import { BuffBar } from "./battle/BuffBar";

type Navigate = (path: string) => void;

interface BattleProps {
  navigate: Navigate;
}

export default function Battle({ navigate }: BattleProps) {
  const q = useBattleQuery();
  const zoneId = q.get("zone") || "";
  const mobIndexStr = q.get("idx") || "";
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
  } = useBattleStore();

  const [now, setNow] = React.useState(Date.now());
  const found = zoneId ? findZoneWithCity(zoneId) : undefined;

  // Ініціалізація бою
  React.useEffect(() => {
    if (zoneId && mobIndex >= 0 && found) {
      if (battleZoneId !== zoneId || battleMobIndex !== mobIndex) {
        startBattle(zoneId, mobIndex);
      }
    }
  }, [zoneId, mobIndex, found, battleZoneId, battleMobIndex, startBattle]);

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

  // Якщо моб не завантажений
  if (!mob) {
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

  return (
    <div className="w-full text-white px-4 py-2">
      <div className="w-full max-w-[360px] mx-auto space-y-3">
        {/* Заголовок */}
        <div className="text-center">
          <div className="text-lg font-semibold mb-1">Бой</div>
          <div className="text-sm text-gray-400">
            {zone.name} • {city.name}
          </div>
        </div>

        {/* Картка цілі (моб) */}
        <div className="flex justify-center">
          <TargetCard zone={zone} city={city} mob={mob} />
        </div>

        {/* Бари бафів */}
        <BuffBar buffs={heroBuffs || []} now={now} />

        {/* Панель навичок */}
        <SkillBar />

        {/* Лог бою */}
        <div className="p-3">
          <div className="text-sm font-semibold mb-2 text-[#f5d7a1]">Лог бою:</div>
          <BattleLog />
        </div>

        {/* Кнопки управління */}
        <div className="flex gap-2 justify-center">
          {status === "victory" && (
            <button
              onClick={() => {
                reset();
                navigate(`/location?id=${zone.id}`);
              }}
              className="px-4 py-2 bg-green-600 rounded text-white text-sm"
            >
              Продовжити
            </button>
          )}
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
