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

/** Merge two buff lists and dedup by id / stackType / name. Second list wins on same key (e.g. toggle updates). */
function mergeBuffsDedup(a: any[], b: any[]): any[] {
  const out: any[] = [];
  const seen = new Set<string>();
  for (const x of [...b, ...a]) {
    if (!x) continue;
    const key =
      (typeof x.id === "number" ? `id:${x.id}` : "") ||
      (x.stackType ? `stack:${x.stackType}` : "") ||
      (x.name ? `name:${x.name}` : "") ||
      JSON.stringify(x);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(x);
  }
  return out;
}

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
    const heroStore = useHeroStore.getState();
    const updateHero = heroStore.updateHero;
    const { updatedBuffs: buffsAfterTicks, logMessages: tickLogMessages } = processToggleTicks(
      { ...state, heroBuffs: cleanedBuffs },
      now,
      updateHero,
      () => {} // updateBuffs буде викликано через set
    );

    // Фікс №1: не перезаписувати heroBuffs тим, що повернув processToggleTicks (може бути тільки toggle-бафи).
    // Мерджимо cleanedBuffs + buffsAfterTicks з dedup — інакше бафи статуї (source=buffer) зникають.
    const mergedHeroBuffs = cleanupBuffs(mergeBuffsDedup(cleanedBuffs, buffsAfterTicks), now);
    if (import.meta.env.DEV) {
      console.log("REGEN cleaned:", cleanedBuffs.length, "afterTicks:", buffsAfterTicks.length, "merged:", mergedHeroBuffs.length);
    }

    // Отримуємо поточного героя після toggle ticks (HP могло змінитися)
    const heroAfterTicks = useHeroStore.getState().hero;
    if (!heroAfterTicks) return;

    // Отримуємо базові max ресурси через централізовану функцію
    const baseMax = getMaxResources(heroAfterTicks);
    const { maxHp, maxMp, maxCp } = computeBuffedMaxResources(baseMax, mergedHeroBuffs);

    const heroStats = applyBuffsToStats(heroAfterTicks.battleStats || {}, mergedHeroBuffs);
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
    const recalculated = recalculateAllStats(heroWithNewHp, mergedHeroBuffs);

    // Фікс №2: battleStats не тригерити API — тільки store; hp/mp/cp йдуть через onlyRegen (localStorage без PUT).
    const statsChanged =
      recalculated.baseFinalStats.pAtk !== heroAfterTicks.battleStats?.pAtk ||
      recalculated.baseFinalStats.mAtk !== heroAfterTicks.battleStats?.mAtk ||
      recalculated.baseFinalStats.pDef !== heroAfterTicks.battleStats?.pDef ||
      recalculated.baseFinalStats.mDef !== heroAfterTicks.battleStats?.mDef;
    if (statsChanged) {
      heroStore.updateHero({ battleStats: recalculated.baseFinalStats }, { persist: false });
    }
    heroStore.updateHero({ hp: nextHP, mp: nextMP, cp: nextCP });

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
      heroBuffs: mergedHeroBuffs,
      summonBuffs: cleanedSummonBuffs,
      ...(updatedSummon !== state.summon ? { summon: updatedSummon } : {}),
      cooldowns: state.cooldowns || {},
      ...(tickLogMessages.length > 0 ? { log: newLog } : {}),
    };

    set((prev) => ({ ...(prev as any), ...(updates as any) }));
    persistSnapshot(get, persistBattle, updates);
  };
