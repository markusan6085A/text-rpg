import { useHeroStore } from "../../heroStore";
import {
  applyBuffsToStats,
  cleanupBuffs,
  computeBuffedMaxResources,
  persistSnapshot,
} from "../helpers";
import { getMaxResources } from "../helpers/getMaxResources";
import { persistBattle } from "../persist";
import type { BattleState } from "../types";
import { processSummonAttack } from "./summons";
import { processToggleTicks } from "./toggleTicks";
import { cleanupSummonBuffs, computeBuffedSummonStats } from "../helpers/summonBuffs";
import { recalculateAllStats } from "../../../utils/stats/recalculateAllStats";

type Setter = (
  partial: Partial<BattleState> | ((state: BattleState) => Partial<BattleState>),
  replace?: boolean
) => void;

export const createRegenTick =
  (set: Setter, get: () => BattleState): BattleState["regenTick"] =>
  () => {
    const state = get();
    const hero = useHeroStore.getState().hero;
    if (!hero) return;
    if ((hero.hp ?? 0) <= 0) return;

    const now = Date.now();
    const cleanedBuffs = cleanupBuffs(state.heroBuffs || [], now);
    const cleanedSummonBuffs = cleanupSummonBuffs(state.summonBuffs || [], now);

    // Обробляємо toggle tick ефекти (споживання MP/HP для активних toggle скілів)
    const updateHero = useHeroStore.getState().updateHero;
    const { updatedBuffs: buffsAfterTicks, logMessages: tickLogMessages } = processToggleTicks(
      { ...state, heroBuffs: cleanedBuffs },
      now,
      updateHero,
      () => {} // updateBuffs буде викликано через set
    );

    // Отримуємо поточного героя після toggle ticks (HP могло змінитися)
    const heroAfterTicks = useHeroStore.getState().hero;
    if (!heroAfterTicks) return;

    // Отримуємо базові max ресурси через централізовану функцію
    const baseMax = getMaxResources(heroAfterTicks);
    const { maxHp, maxMp, maxCp } = computeBuffedMaxResources(baseMax, buffsAfterTicks);

    const heroStats = applyBuffsToStats(heroAfterTicks.battleStats || {}, buffsAfterTicks);
    const hpRegen = Math.max(0, heroStats.hpRegen ?? 0);
    const mpRegen = Math.max(0, heroStats.mpRegen ?? 0);
    const cpRegen = Math.max(0, heroStats.cpRegen ?? 0);

    // Читаємо поточні ресурси з hero (єдине джерело правди)
    const curHP = Math.min(maxHp, heroAfterTicks.hp ?? maxHp);
    const curMP = Math.min(maxMp, heroAfterTicks.mp ?? maxMp);
    const curCP = Math.min(maxCp, heroAfterTicks.cp ?? maxCp);

    // Завжди використовуємо АКТУАЛЬНЕ maxHp з computeBuffedMaxResources (з урахуванням бафів)
    const nextHP = Math.min(maxHp, curHP + hpRegen);
    const nextMP = Math.min(maxMp, curMP + mpRegen);
    const nextCP = Math.min(maxCp, curCP + cpRegen);

    // Перераховуємо стати після зміни HP (через toggle ticks та регенерацію), щоб активувати/деактивувати пасивні скіли з hpThreshold
    const heroWithNewHp = { ...heroAfterTicks, hp: nextHP, maxHp: maxHp };
    const recalculated = recalculateAllStats(heroWithNewHp, buffsAfterTicks);
    
    // Оновлюємо battleStats якщо вони змінилися (через активацію/деактивацію Final Frenzy)
    if (recalculated.finalStats.pAtk !== heroAfterTicks.battleStats?.pAtk ||
        recalculated.finalStats.mAtk !== heroAfterTicks.battleStats?.mAtk ||
        recalculated.finalStats.pDef !== heroAfterTicks.battleStats?.pDef ||
        recalculated.finalStats.mDef !== heroAfterTicks.battleStats?.mDef) {
      updateHero({ 
        hp: nextHP, 
        mp: nextMP, 
        cp: nextCP,
        battleStats: recalculated.finalStats 
      });
    } else {
      updateHero({ hp: nextHP, mp: nextMP, cp: nextCP });
    }

    // Оновлюємо стати сумону з урахуванням бафів (якщо є)
    let updatedSummon = state.summon;
    if (state.summon && cleanedSummonBuffs.length !== (state.summonBuffs || []).length) {
      // Використовуємо базові стати, щоб уникнути множення ефектів
      const baseStats = state.baseSummonStats || {
        pAtk: state.summon.pAtk ?? 0,
        pDef: state.summon.pDef ?? 0,
        mAtk: state.summon.mAtk ?? 0,
        mDef: state.summon.mDef ?? 0,
        maxHp: state.summon.maxHp ?? 1,
        maxMp: state.summon.maxMp ?? 1,
      };
      const buffedStats = computeBuffedSummonStats(baseStats, cleanedSummonBuffs);
      updatedSummon = {
        ...state.summon,
        pAtk: buffedStats.pAtk,
        pDef: buffedStats.pDef,
        mAtk: buffedStats.mAtk,
        mDef: buffedStats.mDef,
        attackSpeed: buffedStats.attackSpeed,
        castSpeed: buffedStats.castSpeed,
        runSpeed: buffedStats.runSpeed,
        critRate: buffedStats.critRate,
        critDamage: buffedStats.critDamage,
        accuracy: buffedStats.accuracy,
        evasion: buffedStats.evasion,
        debuffResist: buffedStats.debuffResist,
        vampirism: buffedStats.vampirism,
      };
    }

    // Process summon attack if in battle
    if (state.status === "fighting" && state.summon) {
      processSummonAttack({ ...state, summon: updatedSummon, summonBuffs: cleanedSummonBuffs }, now, set, get);
    }

    // Додаємо повідомлення про toggle ticks в лог (якщо є)
    const newLog = tickLogMessages.length > 0
      ? [...tickLogMessages, ...state.log].slice(0, 30)
      : state.log;

    const updates: Partial<BattleState> = {
      heroBuffs: buffsAfterTicks,
      summonBuffs: cleanedSummonBuffs,
      ...(updatedSummon !== state.summon ? { summon: updatedSummon } : {}),
      cooldowns: state.cooldowns || {},
      ...(tickLogMessages.length > 0 ? { log: newLog } : {}),
    };

    set((prev) => ({ ...(prev as any), ...(updates as any) }));
    persistSnapshot(get, persistBattle, updates);
  };
