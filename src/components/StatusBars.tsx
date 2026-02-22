import React from "react";
import { useHeroStore } from "../state/heroStore";
import { getHeroRegenPerSecond } from "../state/heroStore/heroRegen";
import { getExpToNext } from "../data/expTable";
import { useBattleStore } from "../state/battle/store";
import { loadBattle, persistBattle } from "../state/battle/persist";
import { cleanupBuffs, computeBuffedMaxResources } from "../state/battle/helpers";
import { isHeroDead } from "../state/heroStore/isHeroDead";
import { getMaxResources } from "../state/battle/helpers/getMaxResources";
import { unequipItemLogic } from "../state/heroStore/heroInventory";
import { getNickColorStyle } from "../utils/nickColor";
import { PlayerNameWithEmblem } from "./PlayerNameWithEmblem";
import { getMyClan } from "../utils/api";
import { isPremiumActive } from "../utils/premium/isPremiumActive";

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
  const [myClan, setMyClan] = React.useState<any>(null);
  
  const inBattle = battleStatus !== "idle";

  // Бафи для конкретного героя (поза інтервалом використовувати currentHero, щоб не було stale closure).
  // У бою реген використовує buffed max (computeBuffedMaxResources); поза боєм реген/стоп/hpFull мають порівнювати з buffedMaxHp, інакше реген зупиняється на hero.maxHp і полоса не доходить до 100%.
  const getCombinedBuffsFor = React.useCallback((h: typeof hero, inBattleNow: boolean) => {
    if (!h?.name) return [];
    const now = Date.now();
    const savedBattle = loadBattle(h.name);
    const savedBuffs = cleanupBuffs(savedBattle?.heroBuffs || [], now);
    const battleBuffs = cleanupBuffs(useBattleStore.getState().heroBuffs || [], now);
    const heroJson = (h as any)?.heroJson || {};
    const heroJsonBuffs = Array.isArray(heroJson.heroBuffs) ? heroJson.heroBuffs : [];
    const activeHeroJsonBuffs = heroJsonBuffs.filter((b: any) => b?.expiresAt && b.expiresAt > now);

    const baseBuffs = inBattleNow ? battleBuffs : savedBuffs;
    const all = [...baseBuffs, ...activeHeroJsonBuffs];
    return all.filter((buff, index, self) =>
      index === self.findIndex((b) =>
        (b.id && buff.id && b.id === buff.id) ||
        (!b.id && !buff.id && b.name === buff.name)
      )
    );
  }, []);

  const getCombinedBuffs = React.useCallback(() => getCombinedBuffsFor(hero, inBattle), [hero, inBattle, getCombinedBuffsFor]);

  // Завантажуємо клан для відображення емблеми
  // 🔥 ОПТИМІЗАЦІЯ: Завантажуємо клан тільки один раз при зміні hero, не поллимо
  React.useEffect(() => {
    if (!hero) {
      setMyClan(null);
      return;
    }

    // Завантажуємо клан один раз при зміні hero
    getMyClan()
      .then((response) => {
        if (response.ok && response.clan) {
          setMyClan(response.clan);
        } else {
          setMyClan(null);
        }
      })
      .catch(() => {
        setMyClan(null);
      });
    
    // 🔥 НЕ додаємо setInterval - клан завантажується тільки при зміні hero
    // Якщо потрібно оновити клан - це має робитися через окремий endpoint або при навігації
  }, [hero?.name]); // Завантажуємо тільки при зміні імені героя

  // Регенерація HP/MP/CP (тільки поза боєм) та перевірка таймера Зарича
  // 🔥 КРИТИЧНО: Використовуємо useRef для зберігання interval ID, щоб уникнути дублювання
  const regenIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  // 🔥 THROTTLE: Накопичуємо зміни і викликаємо updateHero рідше (було 5 с — "лвл через 5 сек")
  const regenThrottleRef = React.useRef<{ lastUpdate: number; pendingUpdates: Partial<any> | null }>({
    lastUpdate: 0,
    pendingUpdates: null,
  });
  const REGEN_UPDATE_INTERVAL_MS = 1000; // 1 с: реген оновлює store щосекунди; level з hero — одразу при лвлапі

  // 🔥 Периодичне очищення прострочених бафів поза боєм — зберігаємо в persist і heroJson
  React.useEffect(() => {
    if (inBattle) return;
    const t = setInterval(() => {
      const heroStore = useHeroStore.getState();
      const h = heroStore.hero;
      if (!h?.name) return;
      const saved = loadBattle(h.name);
      const rawBuffs = saved?.heroBuffs || [];
      const cleaned = cleanupBuffs(rawBuffs, Date.now());
      if (cleaned.length >= rawBuffs.length) return;
      persistBattle({ ...saved, heroBuffs: cleaned }, h.name);
      useBattleStore.setState({ heroBuffs: cleaned });
      heroStore.updateHero({ heroJson: { ...(h as any).heroJson, heroBuffs: cleaned } } as any);
    }, 30000);
    return () => clearInterval(t);
  }, [inBattle]);
  
  React.useEffect(() => {
    // 🔥 Правильний патерн React: cleanup тільки в return, не перед створенням
    if (inBattle) {
      return; // Cleanup спрацює автоматично через return нижче
    }
    
    // 🔥 КРИТИЧНО: Використовуємо функції з store всередині interval, а не в dependencies
    const interval = setInterval(() => {
      const heroStore = useHeroStore.getState();
      const currentHero = heroStore.hero;
      if (!currentHero) return;
      if (import.meta.env.DEV) {
        console.log("[DEAD CHECK]", {
          hp: currentHero.hp,
          isDead: (currentHero as any).heroJson?.isDead,
          deadAt: (currentHero as any).heroJson?.deadAt,
          buffsHeroJson: ((currentHero as any).heroJson?.heroBuffs || []).length,
        });
      }
      if (isHeroDead(currentHero)) return; // мертвий — не регенимо, не персистимо

      const inBattleNow = useBattleStore.getState().status !== "idle";
      const baseMax = getMaxResources(currentHero);
      const combinedBuffs = getCombinedBuffsFor(currentHero, inBattleNow);
      const { maxHp: buffedMaxHp, maxMp: buffedMaxMp, maxCp: buffedMaxCp } =
        computeBuffedMaxResources(baseMax, combinedBuffs);

      // Реген повсюди з одного джерела правди (heroRegen)
      const { hpRegen, mpRegen, cpRegen } = getHeroRegenPerSecond(currentHero, combinedBuffs);
      const curHp = currentHero.hp ?? buffedMaxHp;

      const nextHp = Math.min(buffedMaxHp, curHp + hpRegen);
      const nextMp = Math.min(buffedMaxMp, (currentHero.mp ?? buffedMaxMp) + mpRegen);
      const nextCp = Math.min(buffedMaxCp, (currentHero.cp ?? buffedMaxCp) + cpRegen);

      if (import.meta.env.DEV) {
        console.log("[idleRegen] snapshot", {
          hp: currentHero.hp,
          heroMaxHp: currentHero.maxHp,
          baseMaxHp: baseMax.maxHp,
          buffedMaxHp,
          hpFull: (currentHero as any).heroJson?.hpFull,
          hpPercent: (currentHero as any).heroJson?.hpPercent,
          buffsCount: combinedBuffs?.length,
        });
      }
      if (import.meta.env.DEV && !inBattleNow) {
        console.log("[buffs] outside battle", {
          heroBuffs: (currentHero as any).heroJson?.heroBuffs?.length,
          battleBuffs: combinedBuffs?.length,
        });
      }

      // Стоп регену: порівнюємо з buffedMaxHp, не з hero.maxHp
      const isAtMax =
        (nextHp >= buffedMaxHp && nextMp >= buffedMaxMp && nextCp >= buffedMaxCp) &&
        (currentHero.hp ?? 0) >= buffedMaxHp &&
        (currentHero.mp ?? buffedMaxMp) >= buffedMaxMp &&
        (currentHero.cp ?? buffedMaxCp) >= buffedMaxCp;

      if (isAtMax) {
        if (import.meta.env.DEV) {
          console.log("[idleRegen] stop (at buffedMax)", { buffedMaxHp, hp: currentHero.hp });
        }
        return;
      }

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
      
      // ❗ ПЕРЕВІРКА ТАЙМЕРА ЗАРИЧА (критично - завжди обробляємо одразу)
      if (currentHero.equipment?.weapon === "zariche" && currentHero.zaricheEquippedUntil) {
        const now = Date.now();
        if (now >= currentHero.zaricheEquippedUntil) {
          // Час вийшов - знімаємо Зарича (критично - не throttle'имо)
          const heroWithoutZariche = unequipItemLogic(currentHero, "weapon");
          updates.equipment = heroWithoutZariche.equipment;
          updates.equipmentEnchantLevels = heroWithoutZariche.equipmentEnchantLevels;
          updates.zaricheEquippedUntil = undefined;
        }
      }
      
      // 🔥 THROTTLE: Накопичуємо зміни і викликаємо updateHero тільки кожні 5 секунд
      const now = Date.now();
      const timeSinceLastUpdate = now - regenThrottleRef.current.lastUpdate;
      
      if (Object.keys(updates).length > 0) {
        // Мержимо зміни з попередніми
        regenThrottleRef.current.pendingUpdates = {
          ...regenThrottleRef.current.pendingUpdates,
          ...updates,
        };
        
        // Якщо пройшло достатньо часу або є критичні зміни (Зарич) - оновлюємо одразу
        if (timeSinceLastUpdate >= REGEN_UPDATE_INTERVAL_MS || updates.equipment !== undefined) {
          heroStore.updateHero(regenThrottleRef.current.pendingUpdates || updates);
          regenThrottleRef.current.lastUpdate = now;
          regenThrottleRef.current.pendingUpdates = null;
        }
      }
    }, 1000); // Регенерація все ще працює кожну секунду для UI, але збереження throttle'имо
    
    regenIntervalRef.current = interval; // Зберігаємо для можливості ручного очищення

    return () => {
      clearInterval(interval);
      regenIntervalRef.current = null;
      // 🔥 КРИТИЧНО: Зберігаємо накопичені зміни перед cleanup
      if (regenThrottleRef.current.pendingUpdates) {
        const heroStore = useHeroStore.getState();
        heroStore.updateHero(regenThrottleRef.current.pendingUpdates);
        regenThrottleRef.current.pendingUpdates = null;
      }
    };
  }, [inBattle]); // 🔥 Мінімальні dependencies - тільки inBattle (примітив), updateHero викликається через store

  // ВАЖЛИВО: Перевірка hero має бути ПІСЛЯ всіх хуків (useEffect тощо)
  if (!hero) return null;

  // Бази з hero, buffed max = base + бафи статуї/скілів (як у City та бою)
  const baseMax = getMaxResources(hero);
  const battleBuffs = getCombinedBuffs();
  const { maxHp, maxMp, maxCp } = computeBuffedMaxResources(baseMax, battleBuffs);

  // Читаємо ресурси з hero (єдине джерело правди)
  const hp = hero.hp ?? maxHp;
  const mp = hero.mp ?? maxMp;
  const cp = hero.cp ?? maxCp;

  const level = Number(hero.level ?? 1) || 1;
  const expCurrent = Number(hero.exp ?? 0) || 0;
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
      <div className="mt-1 text-white text-[9px] font-semibold text-left flex items-center gap-1 flex-wrap">
        <PlayerNameWithEmblem
          playerName={hero.name}
          hero={hero}
          clan={myClan}
          sevenSealsWinnerRank={(hero as any)?.heroJson?.sevenSealsBonus?.rank}
          size={8}
        />
        {isPremiumActive(hero) && (
          <span className="text-[#22c55e] font-bold" style={{ fontSize: "10px" }}>x2</span>
        )}
        <span className="text-gray-400"> — {level} ур.</span>
      </div>
      {/* Крапкова лінія під барами */}
      <div className="mt-1 w-full border-t border-solid border-white/35"></div>
    </div>
  );
}

