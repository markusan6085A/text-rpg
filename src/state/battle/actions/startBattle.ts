import { locations as WORLD_LOCATIONS } from "../../../data/world";
import { getMobEffectiveMaxHp } from "../../../utils/mobs/mobEffectiveMaxHp";
import type { Mob, Zone } from "../../../data/world/types";
import { useHeroStore } from "../../heroStore";
import type { Hero } from "../../../types/Hero";
import {
  loadLoadout,
  clearLoadout,
  filterBuffsForHeroProfession,
  professionOrLoadoutMismatchForBattle,
  sanitizeBattleLoadoutSlots,
} from "../loadout";
import { loadBattle, persistBattle } from "../persist";
import { cleanupBuffs, persistSnapshot, applyBuffsToStats, computeBuffedMaxResources } from "../helpers";
import { calcAutoAttackInterval } from "../../../utils/combatSpeed";
import type { BattleState, CooldownMap } from "../types";
import { isMobOnRespawn, getRespawnTimeRemaining, clearMobRespawn } from "../mobRespawns";
import { itemsDB } from "../../../data/items/itemsDB";
import { loadBattleLogs, saveBattleLogs } from "../battleLogs";
import { savePreviousCity } from "../../../utils/locationNavigation";
import { displayMobName } from "../../../utils/worldDisplay";
import {
  ensureWorldZoneLoaded,
  getWorldMobHpForSlot,
} from "../../worldMobHpStore";

type Setter = (
  partial: Partial<BattleState> | ((state: BattleState) => Partial<BattleState>),
  replace?: boolean
) => void;

const findZone = (zoneId: string): Zone | undefined =>
  WORLD_LOCATIONS.find((z) => z.id === zoneId);

export const createStartBattle =
  (set: Setter, get: () => BattleState): BattleState["startBattle"] =>
  async (zoneId, mobIndex) => {
    const zone = findZone(zoneId);
    const mob = zone?.mobs?.[mobIndex];
    const hero = useHeroStore.getState().hero;
    const heroName = hero?.name;
    const saved = loadBattle(heroName);
    const classOrLoadoutMismatch = professionOrLoadoutMismatchForBattle(heroName, hero, saved);
    const now = Date.now();
    // 🔥 КРИТИЧНО: Об'єднуємо бафи з localStorage і heroJson.heroBuffs (бафи від інших гравців)
    const battleBuffs = classOrLoadoutMismatch ? [] : saved?.heroBuffs || [];
    const heroJsonBuffs = Array.isArray((hero as any)?.heroBuffs) ? (hero as any).heroBuffs
      : Array.isArray((hero as any)?.heroJson?.heroBuffs) ? (hero as any).heroJson.heroBuffs
      : [];
    // heroJson першим — узгоджено з saveHeroToLocalStorageOnly (вимкнений toggle не піднімається з stale battle).
    const mergedBuffsRaw = [...heroJsonBuffs, ...battleBuffs];
    const mergedBuffsUnique = mergedBuffsRaw.filter((buff, i, arr) =>
      arr.findIndex((b) => (b.id && buff.id && b.id === buff.id) || (!b.id && !buff.id && b.name === buff.name)) === i
    );
    const mergedBuffsForProfession = filterBuffsForHeroProfession(hero, mergedBuffsUnique);
    const savedBuffs = cleanupBuffs(mergedBuffsForProfession, now);
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

    if (zoneId !== "fishing") {
      const { useAuthStore } = await import("../../authStore");
      const { useCharacterStore } = await import("../../characterStore");
      const token = useAuthStore.getState().accessToken;
      const cid = String(useCharacterStore.getState().characterId ?? "").trim();
      const hid = String((hero as any)?.id ?? "").trim();
      if (!token || !cid || !hero?.name || hid !== cid) {
        set({
          zoneId,
          mobIndex,
          status: "idle",
          mob: undefined,
          log: ["Увійдіть в акаунт і оберіть персонажа, щоб почати бій."],
        });
        persistSnapshot(get, persistBattle);
        return;
      }
    }

    await ensureWorldZoneLoaded(zoneId, { force: true }).catch(() => {});

    // Перевіряємо, чи моб на респавні
    if (isMobOnRespawn(zoneId, mobIndex, heroName)) {
      const remainingSeconds = getRespawnTimeRemaining(zoneId, mobIndex, heroName);
      set({
        zoneId,
        mobIndex,
        status: "idle",
        mob: undefined,
        log: [`Моб ${displayMobName(mob.name)} ще не респавнувся. Залишилось ${remainingSeconds} секунд.`],
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
              mobHP: getMobEffectiveMaxHp(otherMob),
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

    let canResumeEffective = !!canResume;
    if (canResume && zoneId !== "fishing" && hero) {
      const hj = ((hero as any)?.heroJson || {}) as Record<string, any>;
      const sess = hj.battleSession;
      const serverSessOk =
        sess &&
        Number(sess.v) === 1 &&
        String(sess.zoneId || "") === zoneId &&
        Number(sess.mobIndex) === mobIndex &&
        String(sess.mobId || "") === String(mob.id);
      if (!serverSessOk) {
        canResumeEffective = false;
        void import("../../toastStore").then(({ showToast }) => {
          showToast("Немає серверної сесії бою (онлайн). Почніть бій заново.", "error");
        });
        if (heroName) {
          persistBattle({ ...(saved || {}), status: "idle", mob: undefined, mobHP: 0 } as any, heroName);
        }
      }
    }

    if (canResumeEffective) {
      const serverSlot = getWorldMobHpForSlot(zoneId, mobIndex);
      const resumeMobHp =
        serverSlot && serverSlot.currentHp > 0
          ? Math.max(1, Math.min(serverSlot.currentHp, serverSlot.maxHp))
          : saved.mobHP;

      const professionChanged = classOrLoadoutMismatch;
      const cooldowns: CooldownMap = {};
      Object.entries(saved.cooldowns || {}).forEach(([k, v]) => {
        const ts = typeof v === "number" ? v : 0;
        if (ts > now) cooldowns[Number(k)] = ts;
      });
      const heroBuffs = professionChanged
        ? []
        : cleanupBuffs(filterBuffsForHeroProfession(hero, saved.heroBuffs || []), now);
      const mobBuffs = cleanupBuffs(saved.mobBuffs || [], now); // Очищаємо застарілі debuff мобів
      const restoredSummon =
        professionChanged ? null : saved.summon && saved.summon.hp > 0 ? saved.summon : null;

      // Обчислюємо інтервал auto-attack для resume
      // Для риболовлі: фіксований інтервал 0.4 сек (400 мс)
      const isFishingZoneResume = zoneId === "fishing";
      const buffedStatsResume = applyBuffsToStats(hero?.battleStats || {}, heroBuffs);
      const attackSpeedResume = buffedStatsResume?.attackSpeed ?? buffedStatsResume?.atkSpeed ?? 0;
      const autoAttackIntervalResume = isFishingZoneResume ? 400 : calcAutoAttackInterval(attackSpeedResume);
      const heroNextAttackAtResume = saved.heroNextAttackAt && saved.heroNextAttackAt > now 
        ? saved.heroNextAttackAt 
        : now + autoAttackIntervalResume;

      let loadoutSlotsResume: (number | string | null)[];
      if (professionChanged) {
        clearLoadout(heroName);
        loadoutSlotsResume = sanitizeBattleLoadoutSlots(loadLoadout(heroName), hero as Hero);
      } else {
        const rawSlots = Array.isArray(saved.loadoutSlots)
          ? saved.loadoutSlots
          : heroName
          ? loadLoadout(heroName)
          : [];
        loadoutSlotsResume = sanitizeBattleLoadoutSlots(rawSlots, hero as Hero);
      }

      set({
        heroName: heroName,
        zoneId,
        mob: saved.mob as Mob,
        mobIndex,
        mobHP: resumeMobHp,
        mobStunnedUntil: saved.mobStunnedUntil,
        mobNextAttackAt: saved.mobNextAttackAt ?? now + 1000 + Math.random() * 5000,
        heroNextAttackAt: heroNextAttackAtResume,
        status: saved.status === "victory" ? "victory" : saved.status ?? "fighting",
        log: [
          `Бій відновлено: [${displayMobName(saved.mob?.name || mob.name)}] (ур. ${(saved.mob as Mob)?.level ?? mob.level ?? 1})`,
        ],
        cooldowns,
        loadoutSlots: loadoutSlotsResume,
        professionForLoadout: hero?.profession ?? undefined,
        activeChargeSlots: Array.isArray((saved as any).activeChargeSlots) ? (saved as any).activeChargeSlots : (get().activeChargeSlots ?? []),
        lastReward: saved.lastReward,
        heroBuffs,
        mobBuffs,
        summonBuffs: professionChanged ? [] : saved.summonBuffs || [],
        baseSummonStats: professionChanged ? undefined : saved.baseSummonStats,
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
    const isRod = (id: string | undefined) => id === "baby_duck_rod" || id === "shop_baby_duck_rod" || (id && id.toLowerCase().includes("rod"));
    const getRodId = (eq: Record<string, string | null | undefined> | undefined) => {
      const w = eq?.weapon ?? eq?.shield ?? eq?.lrhand;
      return isRod(w) ? w : null;
    };
    if (isFishingZone) {
      const rodId = getRodId(hero.equipment);
      const hasRod = rodId !== null;
      
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
        (item) => (item.id === "gludio_fish_lure" || item.id === "shop_gludio_fish_lure") && (item.count ?? 0) > 0
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
      const hasRod = getRodId(hero.equipment) !== null;
      
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
    let heroForBattle = hero;
    let serverSessionMobHp: number | null = null;
    if (!isFishingZone) {
      try {
        const { battleStartAPI } = await import("../../../utils/api/characters");
        const { useCharacterStore } = await import("../../characterStore");
        const cid = String(useCharacterStore.getState().characterId ?? "").trim();
        const hj0 = ((hero as any)?.heroJson || {}) as Record<string, any>;
        const revRaw =
          useHeroStore.getState().serverState?.heroRevision ?? hj0.heroRevision ?? 0;
        const rev = Number(revRaw);
        const isRb = (mob as any).isRaidBoss === true;
        const rawAi =
          isRb && typeof (mob as any).aiProfileId === "string"
            ? String((mob as any).aiProfileId).trim()
            : "";
        const ch = await battleStartAPI(cid, {
          expectedRevision: Number.isFinite(rev) && rev >= 0 ? rev : 0,
          zoneId,
          mobIndex,
          mobId: mob.id,
          clientMobMaxHp: getMobEffectiveMaxHp(mob),
          mobIsRaidBoss: isRb,
          raidAiProfileId: rawAi || undefined,
          mobIsEpicRaidBoss: isRb && (mob as any).isEpicRaidBoss === true,
        });
        const hj = (ch as any)?.heroJson && typeof (ch as any).heroJson === "object" ? (ch as any).heroJson : {};
        const store = useHeroStore.getState();
        const prevHj = ((store.hero as any)?.heroJson || {}) as Record<string, any>;
        store.applyServerSync(
          {
            hp: (hj as any).hp,
            mp: (hj as any).mp,
            cp: (hj as any).cp,
            heroJson: { ...prevHj, ...hj },
          } as any,
          {
            heroRevision: (hj as any).heroRevision,
            updatedAt: (ch as any).updatedAt ? new Date((ch as any).updatedAt).getTime() : Date.now(),
          }
        );
        heroForBattle = useHeroStore.getState().hero ?? hero;
        const sessHp = Number((ch as any)?.sessionMobHp);
        if (Number.isFinite(sessHp) && sessHp > 0) serverSessionMobHp = sessHp;
        else {
          const sess = (heroForBattle as any)?.heroJson?.battleSession;
          if (sess && typeof sess.mobHP === "number" && sess.mobHP > 0) serverSessionMobHp = sess.mobHP;
        }
      } catch (e: any) {
        if (e?.status !== 404) {
          set({
            zoneId,
            mobIndex,
            status: "idle",
            mob: undefined,
            log: ["Сервер не дозволив почати бій. Перезавантажте сторінку або спробуйте пізніше."],
          });
          persistSnapshot(get, persistBattle);
          return;
        }
      }
    }

    const buffedStats = applyBuffsToStats(heroForBattle.battleStats || {}, savedBuffs);
    const attackSpeed = buffedStats?.attackSpeed ?? buffedStats?.atkSpeed ?? 0;
    const autoAttackInterval = isFishingZone ? 400 : calcAutoAttackInterval(attackSpeed);
    
    // Зберігаємо сумон зі збереженого стану (localStorage) або з попереднього стану, якщо він живий
    const savedSummon = saved?.summon && saved.summon.hp > 0 ? saved.summon : null;
    const prevSummon = prevState.summon && prevState.summon.hp > 0 ? prevState.summon : null;
    let preservedSummon = savedSummon || prevSummon;
    if (classOrLoadoutMismatch) preservedSummon = null;
    
    // 🔥 Завантажуємо збережені логи бою (останні 10 протягом 5 хвилин)
    const savedLogs = loadBattleLogs(heroName);
    const battleStartLine = `Бій розпочато: [${displayMobName(mob.name)}] (ур. ${mob.level ?? 1})`;

    // Зберігаємо попередній лог, додаючи новий запис про початок бою
    // Спочатку перевіряємо savedLogs, потім prevState.log, потім новий запис
    const preservedLog = savedLogs.length > 0
      ? [battleStartLine, ...savedLogs].slice(0, 10)
      : prevState.log && prevState.log.length > 0
      ? [battleStartLine, ...prevState.log].slice(0, 10)
      : [battleStartLine];
    
    // 🔥 Оновлюємо location в heroJson при зміні локації (для відображення в профілі)
    if (heroForBattle && zone) {
      const currentLocation =
        (heroForBattle as any).location ??
        (heroForBattle as any).currentLocation ??
        (heroForBattle as any).zone;
      if (currentLocation !== zone.name) {
        // Оновлюємо location в hero через updateHero (автоматично збережеться в heroJson)
        useHeroStore.getState().updateHero(
          {
            location: zone.name, // 🔥 Додаємо location для збереження в heroJson
          } as any,
          { skipServer: true }
        );
      }
      // 🔥 Зберігаємо місто зони — щоб City та ТП показували правильне місто
      savePreviousCity(zone.cityId);
    }
    
    // Заряди (soulshot/spiritshot): пріоритет saved → prevState → get(), щоб при "Следующий моб" вони ніколи не скидалися
    const activeChargeSlotsForNewBattle = Array.isArray((saved as any)?.activeChargeSlots) && (saved as any).activeChargeSlots.length > 0
      ? (saved as any).activeChargeSlots
      : (prevState.activeChargeSlots?.length ? prevState.activeChargeSlots : (get().activeChargeSlots ?? []));

    let loadoutSlotsNew: (number | string | null)[];
    if (classOrLoadoutMismatch) {
      clearLoadout(heroName);
      loadoutSlotsNew = sanitizeBattleLoadoutSlots(loadLoadout(heroName), hero as Hero);
    } else {
      loadoutSlotsNew = sanitizeBattleLoadoutSlots(loadLoadout(heroName), hero as Hero);
    }

    const maxFromDef = getMobEffectiveMaxHp(mob);
    const serverSlotNew = getWorldMobHpForSlot(zoneId, mobIndex);
    const effectiveMobHp =
      serverSessionMobHp != null && serverSessionMobHp > 0
        ? serverSessionMobHp
        : serverSlotNew && serverSlotNew.currentHp > 0
          ? Math.max(1, Math.min(serverSlotNew.currentHp, serverSlotNew.maxHp))
          : maxFromDef;
    const initial: Partial<BattleState> = {
      heroName: heroName,
      zoneId,
      mob,
      mobIndex,
      mobHP: effectiveMobHp,
      aggressiveMobs: aggressiveMobs.length > 0 ? aggressiveMobs : undefined,
      mobStunnedUntil: undefined,
      heroStunnedUntil: undefined,
      heroBuffsBlockedUntil: undefined,
      heroSkillsBlockedUntil: undefined,
      mobNextAttackAt: now + 1000 + Math.random() * 5000,
      heroNextAttackAt: now + autoAttackInterval,
      status: "fighting",
      log: preservedLog,
      cooldowns: availableCooldowns,
      loadoutSlots: loadoutSlotsNew,
      professionForLoadout: heroForBattle?.profession ?? undefined,
      activeChargeSlots: activeChargeSlotsForNewBattle,
      lastReward: undefined,
      heroBuffs: classOrLoadoutMismatch ? [] : (preservedSummon ? savedBuffs : savedBuffs.filter((b) => b.id !== 1262 && b.id !== 1332)),
      mobBuffs: [],
      summonBuffs: preservedSummon ? (saved?.summonBuffs || prevState.summonBuffs || []) : [],
      baseSummonStats: preservedSummon ? (saved?.baseSummonStats || prevState.baseSummonStats) : undefined,
      resurrection: null,
      summon: preservedSummon,
      summonLastAttackAt: preservedSummon ? (saved?.summonLastAttackAt || prevState.summonLastAttackAt) : undefined,
    };

    set(initial as any);
    persistSnapshot(get, persistBattle, initial);
  };
