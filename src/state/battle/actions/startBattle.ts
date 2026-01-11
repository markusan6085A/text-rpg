import { locations as WORLD_LOCATIONS } from "../../../data/world";
import type { Mob, Zone } from "../../../data/world/types";
import { useHeroStore } from "../../heroStore";
import { loadLoadout } from "../loadout";
import { loadBattle, persistBattle } from "../persist";
import { cleanupBuffs, persistSnapshot, applyBuffsToStats, computeBuffedMaxResources } from "../helpers";
import { calcAutoAttackInterval } from "../../../utils/combatSpeed";
import type { BattleState, CooldownMap } from "../types";
import { isMobOnRespawn, getRespawnTimeRemaining, clearMobRespawn } from "../mobRespawns";
import { itemsDB } from "../../../data/items/itemsDB";

type Setter = (
  partial: Partial<BattleState> | ((state: BattleState) => Partial<BattleState>),
  replace?: boolean
) => void;

const findZone = (zoneId: string): Zone | undefined =>
  WORLD_LOCATIONS.find((z) => z.id === zoneId);

export const createStartBattle =
  (set: Setter, get: () => BattleState): BattleState["startBattle"] =>
  (zoneId, mobIndex) => {
    const zone = findZone(zoneId);
    const mob = zone?.mobs?.[mobIndex];
    const hero = useHeroStore.getState().hero;
    const heroName = hero?.name;
    const saved = loadBattle(heroName);
    const now = Date.now();
    const savedBuffs = cleanupBuffs(saved?.heroBuffs || [], now);
    const prevState = get();
    
    // ❗ ВАЖЛИВО: Використовуємо cooldowns з saved (localStorage) або з prevState (поточний store)
    // saved має пріоритет, бо він завжди актуальний після persist
    const availableCooldowns = saved?.cooldowns && Object.keys(saved.cooldowns).length > 0
      ? saved.cooldowns
      : (prevState.cooldowns || {});

    if (!zone || !mob) {
      set({
        zoneId,
        mobIndex,
        status: "idle",
        mob: undefined,
        log: ["Cannot start: zone or mob not found."],
      });
      persistSnapshot(get, persistBattle);
      return;
    }

    // Перевіряємо, чи моб на респавні
    if (isMobOnRespawn(zoneId, mobIndex, heroName)) {
      const remainingSeconds = getRespawnTimeRemaining(zoneId, mobIndex, heroName);
      set({
        zoneId,
        mobIndex,
        status: "idle",
        mob: undefined,
        log: [`Моб ${mob.name} ще не респавнувся. Залишилось ${remainingSeconds} секунд.`],
      });
      persistSnapshot(get, persistBattle);
      return;
    }
    
    // Очищаємо респавн, якщо моб вже респавнувся (може бути застарілий запис)
    clearMobRespawn(zoneId, mobIndex, heroName);

    // Знаходимо агресивних мобів з тієї ж групи на поточній сторінці
    const aggressiveMobs: Array<{ mob: Mob; mobIndex: number; mobHP: number }> = [];
    if (mob.aggressiveGroup) {
      const pageSize = 15; // Розмір сторінки в Location.tsx
      const currentPage = Math.floor(mobIndex / pageSize);
      const pageStartIndex = currentPage * pageSize;
      const pageEndIndex = Math.min(pageStartIndex + pageSize, zone.mobs.length);
      
      if (import.meta.env.DEV) {
        console.log(`[Aggressive Mobs] Моб ${mob.name} має агресивну групу "${mob.aggressiveGroup}". Сторінка ${currentPage}, індекси ${pageStartIndex}-${pageEndIndex}`);
      }
      
      // Шукаємо всіх мобів з тією ж агресивною групою на поточній сторінці
      for (let i = pageStartIndex; i < pageEndIndex; i++) {
        if (i !== mobIndex) { // Не включаємо основного моба
          const otherMob = zone.mobs[i];
          if (otherMob && otherMob.aggressiveGroup === mob.aggressiveGroup) {
            aggressiveMobs.push({
              mob: otherMob,
              mobIndex: i,
              mobHP: otherMob.hp,
            });
            if (import.meta.env.DEV) {
              console.log(`[Aggressive Mobs] Додано агресивного моба: ${otherMob.name} (індекс ${i})`);
            }
          }
        }
      }
      
      if (import.meta.env.DEV) {
        console.log(`[Aggressive Mobs] Знайдено ${aggressiveMobs.length} агресивних мобів`);
      }
    }

    const canResume =
      saved &&
      (saved.status === "fighting" || saved.resurrection) &&
      saved.zoneId === zoneId &&
      saved.mobIndex === mobIndex &&
      saved.mob &&
      typeof saved.mobHP === "number" &&
      saved.mobHP > 0 &&
      hero &&
      (hero.hp ?? 0) > 0;

    if (canResume) {
      const cooldowns: CooldownMap = {};
      Object.entries(saved.cooldowns || {}).forEach(([k, v]) => {
        const ts = typeof v === "number" ? v : 0;
        if (ts > now) cooldowns[Number(k)] = ts;
      });
      const heroBuffs = cleanupBuffs(saved.heroBuffs || [], now);
      const mobBuffs = cleanupBuffs(saved.mobBuffs || [], now); // Очищаємо застарілі debuff мобів
      const restoredSummon =
        saved.summon && saved.summon.hp > 0 ? saved.summon : null;

      // Обчислюємо інтервал auto-attack для resume
      // Для риболовлі: фіксований інтервал 0.4 сек (400 мс)
      const isFishingZoneResume = zoneId === "fishing";
      const buffedStatsResume = applyBuffsToStats(hero?.battleStats || {}, heroBuffs);
      const attackSpeedResume = buffedStatsResume?.attackSpeed ?? buffedStatsResume?.atkSpeed ?? 0;
      const autoAttackIntervalResume = isFishingZoneResume ? 400 : calcAutoAttackInterval(attackSpeedResume);
      const heroNextAttackAtResume = saved.heroNextAttackAt && saved.heroNextAttackAt > now 
        ? saved.heroNextAttackAt 
        : now + autoAttackIntervalResume;

      set({
        heroName: heroName, // Зберігаємо для перевірки при завантаженні (не джерело істини)
        zoneId,
        mob: saved.mob as Mob,
        mobIndex,
        mobHP: saved.mobHP,
        mobStunnedUntil: saved.mobStunnedUntil, // Відновлюємо stun стан при resume
        mobNextAttackAt: saved.mobNextAttackAt ?? now + 1000 + Math.random() * 5000,
        heroNextAttackAt: heroNextAttackAtResume,
        status: saved.status === "victory" ? "victory" : saved.status ?? "fighting",
        // Ignore stored log; start clean.
        log: [`Fight resumed with ${saved.mob?.name || mob.name}`],
        cooldowns,
        loadoutSlots: Array.isArray(saved.loadoutSlots)
          ? saved.loadoutSlots
          : heroName
          ? loadLoadout(heroName)
          : [],
        lastReward: saved.lastReward,
        heroBuffs,
        mobBuffs, // Відновлюємо debuff мобів при resume
        summonBuffs: saved.summonBuffs || [],
        baseSummonStats: saved.baseSummonStats,
        summon: restoredSummon,
        resurrection: saved.resurrection ?? null,
      });
      persistSnapshot(get, persistBattle);
      return;
    }

    if (!hero) {
      set({
        zoneId,
        mobIndex,
        status: "idle",
        mob: undefined,
        log: ["Hero not found. Re-enter the game."],
      });
      persistSnapshot(get, persistBattle);
      return;
    }

    // Перевірка для риболовлі: потрібна удочка та наживка
    const isFishingZone = zoneId === "fishing";
    if (isFishingZone) {
      const weaponId = hero.equipment?.weapon;
      const rodItem = weaponId ? itemsDB[weaponId] : null;
      const hasRod = rodItem && (rodItem.id === "baby_duck_rod" || weaponId?.toLowerCase().includes("rod"));
      
      if (!hasRod) {
        set({
          zoneId,
          mobIndex,
          status: "idle",
          mob: undefined,
          log: ["Для риболовлі потрібна удочка!"],
        });
        persistSnapshot(get, persistBattle);
        return;
      }

      // Перевіряємо наявність наживки
      const hasLure = hero.inventory?.some(
        (item) => item.id === "gludio_fish_lure" && (item.count ?? 0) > 0
      );

      if (!hasLure) {
        set({
          zoneId,
          mobIndex,
          status: "idle",
          mob: undefined,
          log: ["Для риболовлі потрібна наживка!"],
        });
        persistSnapshot(get, persistBattle);
        return;
      }
    }

    // Перевірка: удочкою можна бити тільки рибу (тільки в зоні риболовлі)
    if (!isFishingZone) {
      const weaponId = hero.equipment?.weapon;
      const rodItem = weaponId ? itemsDB[weaponId] : null;
      const hasRod = rodItem && (rodItem.id === "baby_duck_rod" || weaponId?.toLowerCase().includes("rod"));
      
      if (hasRod) {
        set({
          zoneId,
          mobIndex,
          status: "idle",
          mob: undefined,
          log: ["Удочкою можна бити тільки рибу! Зніміть удочку для бою з мобами."],
        });
        persistSnapshot(get, persistBattle);
        return;
      }
    }

    // Пасивні скіли вже застосовані в heroStore через recalculateAllStats
    // У бою просто читаємо hero.maxHp/maxMp/maxCp та hero.hp/mp/cp
    // НЕ перераховуємо пасиви в бою!
    
    // Обчислюємо інтервал auto-attack на основі attackSpeed
    // Для риболовлі: фіксований інтервал 0.4 сек (400 мс)
    // isFishingZone вже визначено вище
    const buffedStats = applyBuffsToStats(hero.battleStats || {}, savedBuffs);
    const attackSpeed = buffedStats?.attackSpeed ?? buffedStats?.atkSpeed ?? 0;
    const autoAttackInterval = isFishingZone ? 400 : calcAutoAttackInterval(attackSpeed);
    
    // Зберігаємо сумон зі збереженого стану (localStorage) або з попереднього стану, якщо він живий
    const savedSummon = saved?.summon && saved.summon.hp > 0 ? saved.summon : null;
    const prevSummon = prevState.summon && prevState.summon.hp > 0 ? prevState.summon : null;
    const preservedSummon = savedSummon || prevSummon;
    
    // Зберігаємо попередній лог, додаючи новий запис про початок бою
    const preservedLog = prevState.log && prevState.log.length > 0
      ? [`Fight started with ${mob.name}`, ...prevState.log].slice(0, 30)
      : [`Fight started with ${mob.name}`];
    
    const initial: Partial<BattleState> = {
      heroName: heroName, // Зберігаємо для перевірки при завантаженні (не джерело істини)
      zoneId,
      mob,
      mobIndex,
      mobHP: mob.hp,
      aggressiveMobs: aggressiveMobs.length > 0 ? aggressiveMobs : undefined, // Додаємо агресивних мобів
      mobStunnedUntil: undefined, // Скидаємо stun при початку нового бою
      heroStunnedUntil: undefined, // Скидаємо stun гравця при початку нового бою
      heroBuffsBlockedUntil: undefined, // Скидаємо блокування бафів при початку нового бою
      heroSkillsBlockedUntil: undefined, // Скидаємо блокування скілів при початку нового бою
      mobNextAttackAt: now + 1000 + Math.random() * 5000,
      heroNextAttackAt: now + autoAttackInterval,
      status: "fighting",
      log: preservedLog,
      cooldowns: availableCooldowns, // Використовуємо збережені cooldowns
      loadoutSlots: loadLoadout(heroName),
      lastReward: undefined,
      heroBuffs: preservedSummon ? savedBuffs : savedBuffs.filter((b) => b.id !== 1262 && b.id !== 1332), // Remove Transfer Pain and Unicorn Seraphim buff if summon is dead
      mobBuffs: [], // Скидаємо debuff мобів при початку нового бою
      summonBuffs: preservedSummon ? (saved?.summonBuffs || prevState.summonBuffs || []) : [],
      baseSummonStats: preservedSummon ? (saved?.baseSummonStats || prevState.baseSummonStats) : undefined,
      resurrection: null,
      summon: preservedSummon,
      summonLastAttackAt: preservedSummon ? (saved?.summonLastAttackAt || prevState.summonLastAttackAt) : undefined,
    };

    set(initial as any);
    persistSnapshot(get, persistBattle, initial);
  };
