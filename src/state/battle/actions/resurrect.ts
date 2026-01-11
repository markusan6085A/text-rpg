import { useHeroStore } from "../../heroStore";
import { applyBuffsToStats, cleanupBuffs, computeBuffedMaxResources, persistSnapshot } from "../helpers";
import { getMaxResources } from "../helpers/getMaxResources";
import { persistBattle } from "../persist";
import type { BattleState } from "../types";
import { recalculateAllStats } from "../../../utils/stats/recalculateAllStats";

type Setter = (
  partial: Partial<BattleState> | ((state: BattleState) => Partial<BattleState>),
  replace?: boolean
) => void;

export const createResurrect =
  (set: Setter, get: () => BattleState): BattleState["resurrect"] =>
  () => {
    const state = get();
    const hero = useHeroStore.getState().hero;
    if (!hero) return;
    const now = Date.now();
    const cleanedBuffs = cleanupBuffs(state.heroBuffs || [], now);
    const resurrection = state.resurrection;
    if (!resurrection) return;

    // Отримуємо базові max ресурси через централізовану функцію
    const baseMax = getMaxResources(hero);
    const { maxHp, maxMp, maxCp } = computeBuffedMaxResources(baseMax, cleanedBuffs);

    const ratio = Math.max(0, Math.min(1, resurrection.ratio || 0.7));
    const nextHP = Math.max(1, Math.round(maxHp * ratio));
    const nextMP = Math.max(1, Math.round(maxMp * ratio));
    const nextCP = Math.min(maxCp, hero.cp ?? maxCp);

    const updatedBuffs =
      resurrection.sourceBuffId !== undefined
        ? cleanedBuffs.filter((b) => b.id !== resurrection.sourceBuffId)
        : cleanedBuffs;

    const updateHero = useHeroStore.getState().updateHero;
    
    // Перераховуємо стати після воскресіння, щоб активувати/деактивувати пасивні скіли з hpThreshold
    const heroWithResurrectedHp = { ...hero, hp: nextHP, maxHp: maxHp };
    const recalculated = recalculateAllStats(heroWithResurrectedHp, updatedBuffs);
    
    updateHero({ 
      hp: nextHP, 
      mp: nextMP, 
      cp: nextCP,
      battleStats: recalculated.finalStats 
    });

    const updates: Partial<BattleState> = {
      status: "fighting",
      resurrection: null,
      heroBuffs: updatedBuffs,
      mobNextAttackAt: now + 1000 + Math.random() * 4000,
      log: ["Resurrection triggers (Salvation).", ...(state.log || [])].slice(0, 30),
      cooldowns: state.cooldowns || {},
    };

    set((prev) => ({ ...(prev as any), ...(updates as any) }));
    persistSnapshot(get, persistBattle, updates);
  };
