import React from "react";
import { useHeroStore } from "../state/heroStore";
import { getExpToNext } from "../data/expTable";
import { useBattleStore } from "../state/battle/store";
import { loadBattle } from "../state/battle/persist";
import { cleanupBuffs } from "../state/battle/helpers";
import { calculateMaxResourcesWithPassives } from "../utils/calculateHeroStats";
import { unequipItemLogic } from "../state/heroStore/heroInventory";
import { getNickColorStyle } from "../utils/nickColor";

type BarKey = "CP" | "HP" | "MP" | "EXP";

const COLORS: Record<BarKey, { fill: string; bg: string; text: string }> = {
  CP: { 
    fill: "linear-gradient(to right, #ffd700, #ffcc00 50%, #e6b800)",
    bg: "linear-gradient(to bottom, #4a3d0a, #2d2306)",
    text: "#ffffff" 
  },
  HP: { 
    fill: "linear-gradient(to right, #ff4444, #ff6b35 50%, #e22b3a)",
    bg: "linear-gradient(to bottom, #4a0b13, #2c070c)",
    text: "#ffffff" 
  },
  MP: { 
    fill: "linear-gradient(to right, #4488ff, #2e8bff 50%, #1160c5)",
    bg: "linear-gradient(to bottom, #0d2f4e, #081b2c)",
    text: "#ffffff" 
  },
  EXP: { 
    fill: "linear-gradient(to right, #00cc00, #00aa00 50%, #008800)",
    bg: "linear-gradient(to bottom, #0a2e0a, #051905)",
    text: "#ffffff" 
  },
};

function Bar({
  label,
  value,
  max,
  pulse,
}: {
  label: BarKey;
  value: number;
  max: number;
  pulse?: boolean;
}) {
  const safeValue = Math.max(0, Math.round(value));
  const safeMax = Math.max(1, Math.round(max));
  const percent = Math.min(100, Math.floor((safeValue / safeMax) * 100));
  const colors = COLORS[label];

  return (
    <div className="w-full h-[0.4rem] rounded-[2px] overflow-hidden relative" style={{ background: colors.bg }}>
      <div
        className={`h-full ${pulse ? "animate-pulse" : ""}`}
        style={{
          width: `${percent}%`,
          background: colors.fill,
        }}
      />
      <div className="absolute inset-0 flex items-center justify-between px-0.5 text-[7px] font-semibold" style={{ color: colors.text }}>
        <span>{label}</span>
        <span>{label === "EXP" ? `${percent}%` : `${safeValue}/${safeMax}`}</span>
      </div>
    </div>
  );
}

export default function StatusBars() {
  const hero = useHeroStore((s) => s.hero);
  const updateHero = useHeroStore((s) => s.updateHero);
  const battleStatus = useBattleStore((s) => s.status);
  
  const inBattle = battleStatus !== "idle";

  // Регенерація HP/MP/CP (тільки поза боєм) та перевірка таймера Зарича
  React.useEffect(() => {
    if (inBattle) return; // Не регенеруємо в бою
    
    const interval = setInterval(() => {
      const currentHero = useHeroStore.getState().hero;
      if (!currentHero) return;
      
      const baseMaxHp = currentHero.maxHp || 1;
      const baseMaxMp = currentHero.maxMp || 1;
      const baseMaxCp = currentHero.maxCp ?? Math.round(baseMaxHp * 0.6);

      const hpRegen = Math.max(1, Math.round(baseMaxHp * 0.02));
      const mpRegen = Math.max(1, Math.round(baseMaxMp * 0.03));
      const cpRegen = Math.max(1, Math.round(baseMaxCp * 0.05));

      const nextHp = Math.min(baseMaxHp, (currentHero.hp ?? baseMaxHp) + hpRegen);
      const nextMp = Math.min(baseMaxMp, (currentHero.mp ?? baseMaxMp) + mpRegen);
      const nextCp = Math.min(baseMaxCp, (currentHero.cp ?? baseMaxCp) + cpRegen);

      const updates: Partial<typeof currentHero> = {};
      
      if (
        nextHp !== currentHero.hp ||
        nextMp !== currentHero.mp ||
        nextCp !== currentHero.cp
      ) {
        updates.hp = nextHp;
        updates.mp = nextMp;
        updates.cp = nextCp;
      }
      
      // ❗ ПЕРЕВІРКА ТАЙМЕРА ЗАРИЧА
      if (currentHero.equipment?.weapon === "zariche" && currentHero.zaricheEquippedUntil) {
        const now = Date.now();
        if (now >= currentHero.zaricheEquippedUntil) {
          // Час вийшов - знімаємо Зарича
          const heroWithoutZariche = unequipItemLogic(currentHero, "weapon");
          updates.equipment = heroWithoutZariche.equipment;
          updates.equipmentEnchantLevels = heroWithoutZariche.equipmentEnchantLevels;
          updates.zaricheEquippedUntil = undefined;
        }
      }
      
      if (Object.keys(updates).length > 0) {
        updateHero(updates);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [inBattle, updateHero]);

  // ВАЖЛИВО: Перевірка hero має бути ПІСЛЯ всіх хуків (useEffect тощо)
  if (!hero) return null;

  // Завантажуємо бафи з battle state (включаючи бафи статуї) навіть поза боєм
  const now = Date.now();
  const savedBattle = loadBattle(hero.name);
  const savedBuffs = cleanupBuffs(savedBattle?.heroBuffs || [], now);
  const battleBuffs = inBattle ? (useBattleStore.getState().heroBuffs || []) : savedBuffs;
  
  // Використовуємо hero.maxHp/maxMp/maxCp як базові значення (єдине джерело правди)
  const baseMaxHp = hero.maxHp || 1;
  const baseMaxMp = hero.maxMp || 1;
  const baseMaxCp = hero.maxCp ?? Math.round(baseMaxHp * 0.6);
  
  const { maxHp, maxMp, maxCp } = calculateMaxResourcesWithPassives(
    { ...hero, maxHp: baseMaxHp, maxMp: baseMaxMp, maxCp: baseMaxCp },
    battleBuffs
  );

  // Читаємо ресурси з hero (єдине джерело правди)
  const hp = hero.hp ?? maxHp;
  const mp = hero.mp ?? maxMp;
  const cp = hero.cp ?? maxCp;

  const level = hero.level ?? 1;
  const expCurrent = hero.exp ?? 0;
  const expNeed = getExpToNext(level);
  const expPercent = expNeed > 0 ? Math.min(100, Math.floor((expCurrent / expNeed) * 100)) : 100;

  return (
    <div 
      className="fixed top-2 left-2 z-50"
      style={{
        pointerEvents: "none",
      }}
    >
      <div className="flex flex-col gap-0.5 w-[90px]">
        <Bar label="CP" value={cp} max={maxCp} />
        <Bar label="HP" value={hp} max={maxHp} pulse={hp / maxHp < 0.3} />
        <Bar label="MP" value={mp} max={maxMp} />
        <Bar label="EXP" value={expPercent} max={100} />
      </div>
      <div className="mt-1 text-white text-[9px] font-semibold text-left">
        <span style={getNickColorStyle(hero.name, hero)}>{hero.name}</span>
        <span className="text-gray-400"> — {level} ур.</span>
      </div>
    </div>
  );
}

