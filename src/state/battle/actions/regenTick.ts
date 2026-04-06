import { useHeroStore } from "../../heroStore";
import { isHeroDead } from "../../heroStore/isHeroDead";
import { getHeroRegenPerSecond } from "../../heroStore/heroRegen";
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
import { processMobBleedTicks } from "./aggressiveMobSkills";
import { processToggleTicks } from "./toggleTicks";
import { shouldUsePveServerMobTick } from "./pveMobTickOnline";
import { cleanupSummonBuffs, computeBuffedSummonStats } from "../helpers/summonBuffs";
import { recalculateAllStats } from "../../../utils/stats/recalculateAllStats";
import { applyPercentDamageTakenReduction } from "../../../utils/stats/incomingDamageReduction";

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
    if (isHeroDead(hero)) return; // мертвий — не оновлюємо hp/mp/cp і не персистимо snapshot

    const now = Date.now();
    const rawHeroBuffs = state.heroBuffs || [];
    const expiredAuraLines = rawHeroBuffs
      .filter((b) => {
        if (!b) return false;
        const exp = Number(b.expiresAt);
        return Number.isFinite(exp) && exp !== Number.MAX_SAFE_INTEGER && exp <= now;
      })
      .map((b) => `Ваша аура [${String(b.name ?? "Невідомо")}] закінчилася.`);
    const cleanedBuffs = cleanupBuffs(rawHeroBuffs, now);
    const cleanedSummonBuffs = cleanupSummonBuffs(state.summonBuffs || [], now);

    // Toggle drain для онлайн-PvE робить сервер (pve-battle-tick / pve-battle-attack); інакше подвійне списання MP.
    const heroStore = useHeroStore.getState();
    const updateHero = heroStore.updateHero;
    const pveServerTick = shouldUsePveServerMobTick();
    const { updatedBuffs: buffsAfterTicks, logMessages: tickLogMessages } = pveServerTick
      ? { updatedBuffs: cleanedBuffs, logMessages: [] as string[] }
      : processToggleTicks(
          { ...state, heroBuffs: cleanedBuffs },
          now,
          updateHero,
          () => {}
        );

    // Фікс №1: не перезаписувати heroBuffs тим, що повернув processToggleTicks (може бути тільки toggle-бафи).
    // Мерджимо cleanedBuffs + buffsAfterTicks з dedup — інакше бафи статуї (source=buffer) зникають.
    let mergedHeroBuffs = cleanupBuffs(mergeBuffsDedup(cleanedBuffs, buffsAfterTicks), now);
    if (import.meta.env.DEV) {
      console.log("REGEN cleaned:", cleanedBuffs.length, "afterTicks:", buffsAfterTicks.length, "merged:", mergedHeroBuffs.length);
    }

    // Отримуємо поточного героя після toggle ticks (HP могло змінитися)
    const heroAfterTicks = useHeroStore.getState().hero;
    if (!heroAfterTicks) return;

    // Отримуємо базові max ресурси через централізовану функцію
    const baseMax = getMaxResources(heroAfterTicks);
    const { maxHp, maxMp, maxCp } = computeBuffedMaxResources(baseMax, mergedHeroBuffs);

    const bleedResult = processMobBleedTicks(mergedHeroBuffs, now, maxHp);
    mergedHeroBuffs = cleanupBuffs(bleedResult.buffs, now);

    const { hpRegen, mpRegen, cpRegen } = getHeroRegenPerSecond(heroAfterTicks, mergedHeroBuffs);

    // Читаємо поточні ресурси з hero (єдине джерело правди)
    const curHP = Math.min(maxHp, heroAfterTicks.hp ?? maxHp);
    const curMP = Math.min(maxMp, heroAfterTicks.mp ?? maxMp);
    const curCP = Math.min(maxCp, heroAfterTicks.cp ?? maxCp);

    const buffedForDr = applyBuffsToStats(heroAfterTicks.battleStats || {}, mergedHeroBuffs);
    const bleedLossAfterDr = applyPercentDamageTakenReduction(
      bleedResult.hpLoss,
      buffedForDr.damageTakenReduction
    );

    const hpAfterBleed = Math.max(0, curHP - bleedLossAfterDr);

    // Завжди використовуємо АКТУАЛЬНЕ maxHp з computeBuffedMaxResources (з урахуванням бафів)
    const nextHP = Math.min(maxHp, hpAfterBleed + hpRegen);
    /** Онлайн PvE: MP/CP оновлює сервер (pve-battle-tick/attack + passive regen); локальний реген інакше роз’їжджається з перевіркою not_enough_mp. */
    const nextMP = pveServerTick ? curMP : Math.min(maxMp, curMP + mpRegen);
    const nextCP = pveServerTick ? curCP : Math.min(maxCp, curCP + cpRegen);

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

    // Додаємо повідомлення про toggle ticks і кровотечу в лог (якщо є)
    const tickAndBleedMessages = [
      ...expiredAuraLines,
      ...tickLogMessages,
      ...bleedResult.messages,
    ];
    const newLog =
      tickAndBleedMessages.length > 0
        ? [...tickAndBleedMessages, ...state.log].slice(0, 30)
        : state.log;

    const updates: Partial<BattleState> = {
      heroBuffs: mergedHeroBuffs,
      summonBuffs: cleanedSummonBuffs,
      ...(updatedSummon !== state.summon ? { summon: updatedSummon } : {}),
      cooldowns: state.cooldowns || {},
      ...(tickAndBleedMessages.length > 0 ? { log: newLog } : {}),
    };

    set((prev) => ({ ...(prev as any), ...(updates as any) }));
    persistSnapshot(get, persistBattle, updates);
  };
