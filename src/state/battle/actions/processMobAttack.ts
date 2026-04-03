import { useHeroStore } from "../../heroStore";
import { isHeroDead } from "../../heroStore/isHeroDead";
import {
  applyBuffsToStats,
  cleanupBuffs,
  computeBuffedMaxResources,
  persistSnapshot,
} from "../helpers";
import { getMaxResources } from "../helpers/getMaxResources";
import { persistBattle } from "../persist";
import type { BattleState } from "../types";
import { getRaidBossAIProfile } from "../../../data/ai/raidBossAI";
import { recalculateAllStats } from "../../../utils/stats/recalculateAllStats";
import { isMobStunned } from "./useSkill/skillEffects";
import { getShieldMitigationTotal, checkShieldBlock, hasShieldEquipped } from "../../../utils/shield/shieldDefense";
import { getReflectChances, checkReflectDamage } from "./useSkill/reflectDamage";
import { unequipItemLogic } from "../../heroStore/heroInventory";
import { locations as WORLD_LOCATIONS } from "../../../data/world";
import type { Zone } from "../../../data/world/types";
import { commitMobVictoryToHeroStore } from "../commitMobVictory";
import { buildVictoryResourceLogLines } from "../helpers/victoryLootLogLines";
import { writeDeathGate } from "../../../utils/deathGate";
import { displayMobName } from "../../../utils/worldDisplay";
import { isChampionMob } from "../../../utils/mobs/isChampionMob";
import { applyPercentDamageTakenReduction } from "../../../utils/stats/incomingDamageReduction";
import { rollAggressiveMobSkills } from "./aggressiveMobSkills";

type Setter = (
  partial: Partial<BattleState> | ((state: BattleState) => Partial<BattleState>),
  replace?: boolean
) => void;

const scheduleNext = (now: number) => now + 1000 + Math.random() * 5000; // 1-6 seconds

/** Захист цілі: raw * mobAtk / (mobAtk + def) — ближче до очікуваного «~atk при def < atk», ніж 100/(100+def) */
function applyMobToHeroMitigation(raw: number, mobAtkStat: number, heroDefense: number): number {
  const atk = Math.max(1, mobAtkStat);
  const def = Math.max(0, heroDefense);
  return Math.max(1, Math.round((raw * atk) / (atk + def)));
}

export const createProcessMobAttack =
  (set: Setter, get: () => BattleState): BattleState["processMobAttack"] =>
  () => {
    const state = get();
    if (state.status !== "fighting" || !state.mob) return;

    const now = Date.now();
    if (state.mobNextAttackAt && now < state.mobNextAttackAt) return;

    // Перевіряємо чи моб оглушений - якщо так, він не може атакувати
    if (isMobStunned(state.mobStunnedUntil, now)) {
      // Моб все ще оглушений - пропускаємо атаку
      const remainingStunTime = Math.ceil((state.mobStunnedUntil! - now) / 1000);
      const newLog = [
        `${displayMobName(state.mob.name)} оглушен и не может атаковать (осталось ${remainingStunTime} сек).`,
        ...state.log,
      ].slice(0, 30);
      
      // Переносимо наступну атаку на час після закінчення stun
      const cleanedMobBuffsStun = cleanupBuffs(state.mobBuffs || [], now);
      const updates: Partial<BattleState> = {
        mobNextAttackAt: state.mobStunnedUntil! + 1000, // +1 сек після закінчення stun
        log: newLog,
        heroBuffs: state.heroBuffs || [],
        mobBuffs: cleanedMobBuffsStun,
        status: state.status,
        cooldowns: state.cooldowns || {},
        summon: state.summon,
      };
      set((prev) => ({ ...(prev as any), ...(updates as any) }));
      persistSnapshot(get, persistBattle, updates);
      return;
    }

    const hero = useHeroStore.getState().hero;
    if (!hero) return;
    if (isHeroDead(hero)) return; // вже мертвий — моб не оновлює hp/snapshot

    const cleanedBuffs = cleanupBuffs(state.heroBuffs || [], now);
    const cleanedMobBuffs = cleanupBuffs(state.mobBuffs || [], now); // Очищаємо застарілі debuff мобів
    const summonAlive = state.summon && state.summon.hp > 0;
    // Remove Transfer Pain (1262) and Unicorn Seraphim master buff (1332) if summon is dead
    let nextBuffs = summonAlive ? cleanedBuffs : cleanedBuffs.filter((b) => b.id !== 1262 && b.id !== 1332);

    // Отримуємо базові max ресурси через централізовану функцію
    const baseMax = getMaxResources(hero);
    const { maxHp, maxMp, maxCp } = computeBuffedMaxResources(baseMax, nextBuffs);

    // Читаємо поточні ресурси з hero (єдине джерело правди)
    const curHeroHP = Math.min(maxHp, hero.hp ?? maxHp);
    const curHeroMP = Math.min(maxMp, hero.mp ?? maxMp);
    const curHeroCP = Math.min(maxCp, hero.cp ?? maxCp);

    let heroStats = applyBuffsToStats(hero.battleStats || {}, nextBuffs);
    const invulnerable = !!heroStats.invulnerable;

    const dodgeChance = Math.max(0, Math.min(80, Math.round(heroStats.evasion ?? 0)));
    const lsRskEvasion = heroStats?.lsRskEvasion ?? 0;
    const combinedEvadeChance = Math.min(95, dodgeChance + lsRskEvasion);
    const isMiss = Math.random() * 100 < combinedEvadeChance;

    const updateHero = useHeroStore.getState().updateHero;

    if (isMiss) {
      const newLog = [`${displayMobName(state.mob.name)} промахнулся.`, ...state.log].slice(0, 30);
      const updates: Partial<BattleState> = {
        mobNextAttackAt: scheduleNext(now),
        log: newLog,
        heroBuffs: nextBuffs,
        mobBuffs: cleanedMobBuffs, // Оновлюємо debuff мобів
        status: state.status,
        cooldowns: state.cooldowns || {},
        summon: state.summon,
      };
      set((prev) => ({ ...(prev as any), ...(updates as any) }));
      persistSnapshot(get, persistBattle, updates);
      return;
    }

    const isRaidBossForSkills = (state.mob as any).isRaidBoss === true;
    const skillRoll = rollAggressiveMobSkills(state.mob, now, nextBuffs, isRaidBossForSkills);
    if (skillRoll.logLines.length > 0) {
      nextBuffs = skillRoll.buffs;
    }
    let heroStunnedFromAggroSkill: number | undefined;
    if (skillRoll.heroStunnedUntil) {
      heroStunnedFromAggroSkill = Math.max(
        state.heroStunnedUntil ?? 0,
        skillRoll.heroStunnedUntil
      );
    }

    heroStats = applyBuffsToStats(hero.battleStats || {}, nextBuffs);
    const pDef = heroStats.pDef ?? 0;
    const mDef = heroStats.mDef ?? 0;
    
    // Обчислюємо захист щитом (якщо надітий щит)
    const shieldDefense = getShieldMitigationTotal(hero, heroStats);
    
    // Кожен удар: 50% фіз / 50% маг (якщо задано attackType — лишається явний вибір)
    const mobExplicitKind = (state.mob as { attackType?: string }).attackType;
    const isPhysicalAttack =
      mobExplicitKind === "physical"
        ? true
        : mobExplicitKind === "magic"
          ? false
          : Math.random() < 0.5;

    // Застосовуємо debuff до статів моба (зменшення pAtk/mAtk тощо)
    const mobLevel = state.mob.level ?? 1;
    const mobBaseStats = {
      pAtk: state.mob.pAtk ?? mobLevel * 20,
      pDef: state.mob.pDef ?? Math.round(mobLevel * 12),
      mAtk: state.mob.mAtk ?? 0,
      mDef: state.mob.mDef ?? Math.round(mobLevel * 10),
    };
    const mobStatsWithDebuffs = applyBuffsToStats(mobBaseStats, cleanedMobBuffs);
    let mobPAtk = Math.max(1, mobStatsWithDebuffs.pAtk ?? mobBaseStats.pAtk);
    let mobMAtk = Math.max(1, mobStatsWithDebuffs.mAtk ?? mobBaseStats.mAtk);
    if (mobPAtk <= 1) mobPAtk = Math.round(mobLevel * 20);
    if (mobMAtk <= 1) mobMAtk = Math.round(mobLevel * 15);

    // База — відображуваний pAtk/mAtk цього удару (без 0.8), далі variance та мітигація atk/(atk+def)
    let base = isPhysicalAttack ? Math.max(5, mobPAtk) : Math.max(5, mobMAtk);

    // Для рейд-босів використовуємо AI профіль з множником урону
    const isRaidBoss = (state.mob as any).isRaidBoss === true;
    if (isRaidBoss) {
      const raidBoss = state.mob as any;
      const aiProfileId = raidBoss.aiProfileId;
      if (aiProfileId) {
        const aiProfile = getRaidBossAIProfile(aiProfileId);
        if (aiProfile) {
          const currentHpPercent = (state.mobHP / state.mob.hp) * 100;
          const currentPhase = aiProfile.phases.find(
            (phase) => currentHpPercent <= phase.fromHpPercent && currentHpPercent > phase.toHpPercent
          );

          if (currentPhase) {
            base = base * currentPhase.damageMultiplier;
          } else {
            base = base * (aiProfile.phases[0]?.damageMultiplier ?? 1.0);
          }
        }
      }
      base = base * 2.25;
    } else if (isChampionMob(state.mob)) {
      base = base * 4;
    }

    const variance = 0.25;
    const raw = base * (1 - variance + Math.random() * variance * 2);

    const defense = isPhysicalAttack ? pDef : mDef;
    const atkForMitigation = isPhysicalAttack ? mobPAtk : mobMAtk;
    let mitigated = invulnerable
      ? 0
      : applyMobToHeroMitigation(raw, atkForMitigation, defense);
    
    // Перевіряємо блок щита (якщо надітий щит)
    const shieldBlockRate = heroStats.shieldBlockRate ?? 0;
    let shieldBlocked = false;
    
    if (hasShieldEquipped(hero) && shieldBlockRate > 0) {
      shieldBlocked = checkShieldBlock(shieldBlockRate);
      
      if (shieldBlocked) {
        // Якщо блок спрацював, зменшуємо урон на pDef щита
        mitigated = Math.max(1, mitigated - shieldDefense);
        
        if (import.meta.env.DEV) {
          const preBlock = applyMobToHeroMitigation(raw, atkForMitigation, defense);
          console.log(`[Shield Block] Blocked!`, {
            rawDamage: raw,
            afterMitigation: preBlock,
            shieldBlockRate,
            shieldDefense,
            finalDamage: mitigated,
          });
        }
      } else if (import.meta.env.DEV) {
        console.log(`[Shield Block] Failed`, {
          shieldBlockRate,
          roll: Math.random() * 100,
        });
      }
    }

    let mobCritFromMob = false;
    if (!invulnerable && mitigated > 0) {
      const critChance = isRaidBoss ? 0.2 : 0.4;
      if (Math.random() < critChance) {
        mitigated = Math.max(1, Math.round(mitigated * 2));
        mobCritFromMob = true;
      }
    }

    mitigated = applyPercentDamageTakenReduction(mitigated, heroStats.damageTakenReduction, {
      invulnerable,
    });

    const reflectChances = getReflectChances(nextBuffs, hero, now);
    const reflectResult = checkReflectDamage(mitigated, isPhysicalAttack, reflectChances);
    const lsMagicParry = heroStats?.lsMagicParry ?? 0;
    const magicParryProc = !isPhysicalAttack && lsMagicParry > 0 && Math.random() * 100 < lsMagicParry;
    
    let finalHeroDamage = mitigated;
    let reflectedDamage = 0;
    let nextMobHP = state.mobHP;

    if (magicParryProc) {
      reflectedDamage = mitigated;
      finalHeroDamage = 0;
      nextMobHP = Math.max(0, state.mobHP - reflectedDamage);
    }
    // Якщо відбиття спрацювало (Physical Mirror або інше), урон відбивається назад на моба
    else if (reflectResult.reflected) {
      reflectedDamage = reflectResult.reflectedDamage;
      finalHeroDamage = 0; // Герой не отримує урон
      nextMobHP = Math.max(0, state.mobHP - reflectedDamage);
      
      if (import.meta.env.DEV) {
        console.log(`[Physical Mirror] Reflected damage:`, {
          originalDamage: mitigated,
          reflectedDamage,
          mobHP: state.mobHP,
          nextMobHP,
        });
      }
    }

    // Обчислюємо урон від агресивних мобів (якщо є)
    let totalAggressiveDamage = 0;
    const aggressiveDamageLines: string[] = [];
    if (state.aggressiveMobs && state.aggressiveMobs.length > 0) {
      if (import.meta.env.DEV) {
        console.log(`[Aggressive Mobs Attack] Обробка ${state.aggressiveMobs.length} агресивних мобів`);
      }
      for (const aggressiveMobData of state.aggressiveMobs) {
        // Перевіряємо, чи агресивний моб живий
        if (aggressiveMobData.mobHP <= 0) continue;
        
        const aggressiveMob = aggressiveMobData.mob;
        const aggLevel = aggressiveMob.level ?? 1;
        const aggExplicit = (aggressiveMob as { attackType?: string }).attackType;
        const aggressiveIsPhysicalAttack =
          aggExplicit === "physical"
            ? true
            : aggExplicit === "magic"
              ? false
              : Math.random() < 0.5;

        const aggressiveMobBaseStats = {
          pAtk: aggressiveMob.pAtk ?? aggLevel * 20,
          mAtk: aggressiveMob.mAtk ?? 0,
        };
        let aggressiveMobPAtk = Math.max(1, aggressiveMobBaseStats.pAtk);
        let aggressiveMobMAtk = Math.max(1, aggressiveMobBaseStats.mAtk);
        if (aggressiveMobPAtk <= 1) aggressiveMobPAtk = Math.round(aggLevel * 20);
        if (aggressiveMobMAtk <= 1) aggressiveMobMAtk = Math.round(aggLevel * 15);

        let aggressiveBase = aggressiveIsPhysicalAttack
          ? Math.max(5, aggressiveMobPAtk)
          : Math.max(5, aggressiveMobMAtk);
        if (isChampionMob(aggressiveMob)) {
          aggressiveBase *= 4;
        }
        const aggIsRb = (aggressiveMob as any).isRaidBoss === true;
        if (aggIsRb) {
          aggressiveBase *= 2.25;
        }

        const aggressiveVariance = 0.25;
        const aggressiveRaw = aggressiveBase * (1 - aggressiveVariance + Math.random() * aggressiveVariance * 2);

        const aggressiveDefense = aggressiveIsPhysicalAttack ? pDef : mDef;
        const aggAtkForRatio = aggressiveIsPhysicalAttack ? aggressiveMobPAtk : aggressiveMobMAtk;
        let aggressiveMitigated = invulnerable
          ? 0
          : applyMobToHeroMitigation(aggressiveRaw, aggAtkForRatio, aggressiveDefense);
        
        // Перевіряємо блок щита (з меншою ймовірністю для агресивних мобів)
        let aggressiveShieldBlocked = false;
        if (hasShieldEquipped(hero) && shieldBlockRate > 0) {
          // Агресивні моби мають менший шанс пробити блок (50% від звичайного)
          aggressiveShieldBlocked = Math.random() < (shieldBlockRate / 100) * 0.5;
          if (aggressiveShieldBlocked) {
            aggressiveMitigated = Math.max(1, aggressiveMitigated - shieldDefense);
          }
        }

        let aggressiveCrit = false;
        if (!invulnerable && aggressiveMitigated > 0) {
          const aggCrit = aggIsRb ? 0.2 : 0.4;
          if (Math.random() < aggCrit) {
            aggressiveMitigated = Math.max(1, Math.round(aggressiveMitigated * 2));
            aggressiveCrit = true;
          }
        }

        aggressiveMitigated = applyPercentDamageTakenReduction(
          aggressiveMitigated,
          heroStats.damageTakenReduction,
          { invulnerable }
        );
        
        // Перевіряємо промах (з меншою ймовірністю для агресивних мобів)
        const aggressiveDodgeChance = dodgeChance * 0.7; // Агресивні моби точніші
        const aggressiveIsMiss = Math.random() * 100 < aggressiveDodgeChance;
        
        if (aggressiveIsMiss) {
          aggressiveDamageLines.push(`${aggressiveMob.name} промахнулся.`);
        } else {
          totalAggressiveDamage += aggressiveMitigated;
          const critTag = aggressiveCrit ? " (крит!)" : "";
          if (aggressiveShieldBlocked) {
            aggressiveDamageLines.push(`${aggressiveMob.name} атакует, щит блокирует! (${Math.round(aggressiveMitigated)} урона${critTag})`);
          } else {
            aggressiveDamageLines.push(`${aggressiveMob.name} наносит ${Math.round(aggressiveMitigated)} урона${critTag}.`);
          }
        }
      }
    }
    
    // Застосовуємо Transfer Pain до загального урону (включно з агресивними мобами)
    const totalDamage = finalHeroDamage + totalAggressiveDamage;
    const transferPainActive = nextBuffs.some((b) => b.id === 1262) && summonAlive;
    let heroDamage = totalDamage;
    let summonDamage = 0;
    let nextSummon = state.summon;

    if (transferPainActive && state.summon) {
      summonDamage = Math.floor(totalDamage * 0.5);
      heroDamage = totalDamage - summonDamage;
      const updatedHp = Math.max(0, state.summon.hp - summonDamage);
      if (updatedHp <= 0) {
        nextSummon = null;
        nextBuffs = nextBuffs.filter((b) => b.id !== 1262);
      } else {
        nextSummon = { ...state.summon, hp: updatedHp };
      }
    }

    const nextHeroHP = Math.max(0, curHeroHP - heroDamage);

    const lines: string[] = [...skillRoll.logLines];
    
    // Логіка блоку щита
    if (shieldBlocked) {
      lines.push(
        `Щит заблокував атаку! Урон зменшено на ${shieldDefense}.`
      );
    }
    
    // Логіка відбиття урону
    if (reflectResult.reflected) {
      lines.push(
        `Physical Mirror отразил ${Math.round(reflectedDamage)} урона обратно на ${displayMobName(state.mob.name)}!`
      );
      if (nextMobHP <= 0) {
        lines.push(`${displayMobName(state.mob.name)} побежден отраженным уроном!`);
      }
    } else {
      // Звичайний урон
      if (heroDamage === 0) {
        lines.push(`${displayMobName(state.mob.name)} попал, но не нанес урона.`);
      } else {
        const critTag = mobCritFromMob ? " (крит!)" : "";
        lines.push(`${displayMobName(state.mob.name)} наносит вам ${Math.round(heroDamage)} урона${critTag}.`);
      }
    }
    
    if (summonDamage > 0 && nextSummon) {
      lines.push(
        `${Math.round(summonDamage)} урона перенесено на призванное существо (HP ${nextSummon.hp}/${nextSummon.maxHp}).`
      );
    }
    
    // Додаємо повідомлення про атаки агресивних мобів
    if (aggressiveDamageLines.length > 0) {
      lines.push(...aggressiveDamageLines);
    }

    const newLog = [...lines, ...state.log].slice(0, 30);

    // Застосування спеціальних дій рейд-босів (stun, block buffs/skills)
    let heroStunnedUntil =
      heroStunnedFromAggroSkill && heroStunnedFromAggroSkill > (state.heroStunnedUntil ?? 0)
        ? heroStunnedFromAggroSkill
        : state.heroStunnedUntil;
    let heroBuffsBlockedUntil = state.heroBuffsBlockedUntil;
    let heroSkillsBlockedUntil = state.heroSkillsBlockedUntil;
    let nextBuffsAfterDispel = nextBuffs; // Для зняття бафів
    const specialEffectsLog: string[] = [];

    if (isRaidBoss) {
      const raidBoss = state.mob as any;
      const aiProfileId = raidBoss.aiProfileId;
      if (aiProfileId) {
        const aiProfile = getRaidBossAIProfile(aiProfileId);
        if (aiProfile) {
          // Визначаємо поточну фазу на основі HP%
          const currentHpPercent = (state.mobHP / state.mob.hp) * 100;
          const currentPhase = aiProfile.phases.find(
            (phase) => currentHpPercent <= phase.fromHpPercent && currentHpPercent > phase.toHpPercent
          );

          if (currentPhase) {
            // Перевірка на stun
            if (currentPhase.stunChance && currentPhase.stunDuration) {
              const isStunned = state.heroStunnedUntil && state.heroStunnedUntil > now;
              if (!isStunned && Math.random() < currentPhase.stunChance) {
                heroStunnedUntil = now + currentPhase.stunDuration * 1000;
                specialEffectsLog.push(`${displayMobName(state.mob.name)} оглушил вас на ${currentPhase.stunDuration} сек!`);
              }
            }

            // Перевірка на блокування бафів та скілів
            if (currentPhase.blockBuffsAndSkillsChance && currentPhase.blockDuration) {
              const isBlocked = (state.heroBuffsBlockedUntil && state.heroBuffsBlockedUntil > now) ||
                                (state.heroSkillsBlockedUntil && state.heroSkillsBlockedUntil > now);
              if (!isBlocked && Math.random() < currentPhase.blockBuffsAndSkillsChance) {
                heroBuffsBlockedUntil = now + currentPhase.blockDuration * 1000;
                heroSkillsBlockedUntil = now + currentPhase.blockDuration * 1000;
                specialEffectsLog.push(`${displayMobName(state.mob.name)} заблокировал ваши бафы и навыки на ${currentPhase.blockDuration} сек!`);
              }
            }
          }
        }
      }
    }

    // Логіка зняття бафів для катакомбних мобів (шанс 10%)
    if (state.mob.canDispelBuffs && Math.random() < 0.10) {
      // Знімаємо всі бафи (крім бафів від статуї buffer, якщо потрібно зберегти)
      // Але за замовчуванням знімаємо ВСІ бафи, як просив користувач
      const buffsBeforeDispel = nextBuffsAfterDispel.length;
      nextBuffsAfterDispel = []; // Знімаємо всі бафи
      if (buffsBeforeDispel > 0) {
        specialEffectsLog.push(`${displayMobName(state.mob.name)} зняв всі ваші бафы! (${buffsBeforeDispel} бафов удалено)`);
      }
    }

    // Логіка прокляття для Floran Catacombs (10% шанс на Curse: Weakness)
    if (state.zoneId) {
      const zone: Zone | undefined = WORLD_LOCATIONS.find((z) => z.id === state.zoneId);
      if (zone?.curseChanceOnAttack && Math.random() < zone.curseChanceOnAttack) {
        // Перевіряємо, чи вже є прокляття (щоб не дублювати)
        const hasCurse = nextBuffsAfterDispel.some((b) => b.id === 1164);
        if (!hasCurse) {
          // Додаємо Curse: Weakness (-17% pAtk на 5 секунд)
          const curseDebuff: any = {
            id: 1164,
            name: "Curse: Weakness",
            icon: "/skills/Skill1164_0.jpg",
            effects: [
              { stat: "pAtk", mode: "percent", value: -17, resistStat: "wit" },
            ],
            expiresAt: now + 5000, // 5 секунд
            startedAt: now,
            durationMs: 5000,
            source: "skill",
          };
          nextBuffsAfterDispel = [...nextBuffsAfterDispel, curseDebuff];
          specialEffectsLog.push(`${displayMobName(state.mob.name)} наложил на вас проклятие: Weakness! (-17% физ. атака на 5 сек)`);
        }
      }
    }

    // Додаємо повідомлення про спеціальні ефекти до логу
    const finalLog = specialEffectsLog.length > 0 
      ? [...specialEffectsLog, ...newLog].slice(0, 30)
      : newLog;

    const salvationBuff = nextBuffsAfterDispel.find((b) => b.effects?.some?.((e: any) => e.stat === "salvation"));
    let updates: Partial<BattleState>;
    const finalMobHP = reflectResult.reflected ? nextMobHP : state.mobHP;
    const mobHPChanged = reflectResult.reflected;
    const finalStatus = finalMobHP <= 0 ? "victory" : (nextHeroHP <= 0 ? "idle" : state.status);

    // Спасіння: якщо майже вмерли і є баф — відновлюємо до ratio (наприклад 70%) і продовжуємо бій
    if (nextHeroHP <= 0 && salvationBuff) {
      const ratio =
        typeof salvationBuff.effects?.find?.((e: any) => e.stat === "salvation")?.value === "number"
          ? salvationBuff.effects.find((e: any) => e.stat === "salvation").value / 100
          : 0.7;
      const filteredBuffs = nextBuffsAfterDispel.filter((b) => b !== salvationBuff);
      const savedHP = Math.max(1, Math.round(maxHp * ratio));
      const savedMP = Math.max(1, Math.round(maxMp * ratio));
      
      const heroWithSavedHp = { ...hero, hp: savedHP, maxHp: maxHp };
      const recalculatedSaved = recalculateAllStats(heroWithSavedHp, filteredBuffs);
      updateHero({ 
        hp: savedHP, 
        mp: savedMP, 
        cp: Math.min(maxCp, curHeroCP),
        battleStats: recalculatedSaved.baseFinalStats 
      });
      
      updates = {
        status: finalMobHP <= 0 ? "victory" : "fighting",
        ...(mobHPChanged ? { mobHP: finalMobHP } : {}),
        mobNextAttackAt: scheduleNext(now),
        heroBuffs: filteredBuffs,
        mobBuffs: cleanedMobBuffs,
        log: ["Сработало Спасение.", ...finalLog].slice(0, 30),
        cooldowns: state.cooldowns || {},
        summon: nextSummon,
        heroStunnedUntil,
        heroBuffsBlockedUntil,
        heroSkillsBlockedUntil,
        lastMobDamage: Math.round(heroDamage),
      };
      set((prev) => ({ ...(prev as any), ...(updates as any) }));
      persistSnapshot(get, persistBattle, updates);
      return;
    }

    if (nextHeroHP <= 0) {
      // Смерть: isDead, hp/mp/cp = 0, зняття бафів і Зарича
      const buffsAfterDeath: any[] = [];
      const deadAt = Date.now();
      const killerLabel = state.mob?.name ?? "?";
      const lastDmg = Math.round(heroDamage);
      writeDeathGate(String((hero as any).id ?? "").trim() || null, hero.name, {
        killerName: killerLabel,
        damage: lastDmg,
        at: deadAt,
      });
      let equipmentAfterDeath = hero.equipment;
      let equipmentEnchantLevelsAfterDeath = hero.equipmentEnchantLevels;
      let zaricheEquippedUntilAfterDeath = hero.zaricheEquippedUntil;
      if (hero.equipment?.weapon === "zariche") {
        const heroWithoutZariche = unequipItemLogic(hero, "weapon");
        equipmentAfterDeath = heroWithoutZariche.equipment;
        equipmentEnchantLevelsAfterDeath = heroWithoutZariche.equipmentEnchantLevels;
        zaricheEquippedUntilAfterDeath = undefined;
      }
      const heroWithZeroHp = { ...hero, hp: 0, maxHp: maxHp, equipment: equipmentAfterDeath };
      const recalculatedDead = recalculateAllStats(heroWithZeroHp, buffsAfterDeath);
      const existingJson = (hero as any).heroJson || {};
      updateHero(
        {
          hp: 0,
          mp: 0,
          cp: 0,
          battleStats: recalculatedDead.finalStats,
          equipment: equipmentAfterDeath,
          equipmentEnchantLevels: equipmentEnchantLevelsAfterDeath,
          zaricheEquippedUntil: zaricheEquippedUntilAfterDeath,
          heroJson: {
            ...existingJson,
            heroBuffs: [],
            isDead: true,
            deadAt,
            killedByMobName: killerLabel,
            killedByMobDamage: lastDmg,
          } as any,
        },
        { persist: true }
      );
      updates = {
        status: finalMobHP <= 0 ? "victory" : "idle",
        ...(mobHPChanged ? { mobHP: finalMobHP } : {}),
        mobNextAttackAt: null,
        heroBuffs: buffsAfterDeath,
        mobBuffs: cleanedMobBuffs,
        log: ["Вы мертвы.", ...finalLog].slice(0, 30),
        cooldowns: state.cooldowns || {},
        summon: nextSummon,
        heroStunnedUntil,
        heroBuffsBlockedUntil,
        heroSkillsBlockedUntil,
        lastMobDamage: Math.round(heroDamage),
        activeChargeSlots: [], // Скидаємо заряди тільки при смерті героя
      };
      set((prev) => ({ ...(prev as any), ...(updates as any) }));
      persistSnapshot(get, persistBattle, updates);
      return;
    }

    // Моб мертвий, герой живий — EXP/SP/адена/дроп (у т.ч. смерть від рефлекту)
    if (finalMobHP <= 0 && nextHeroHP > 0 && state.mob) {
      const v = commitMobVictoryToHeroStore({
        mob: state.mob,
        heroBuffs: nextBuffsAfterDispel,
        postVictoryHp: nextHeroHP,
        postVictoryMp: curHeroMP,
        postVictoryCp: curHeroCP,
        zoneId: state.zoneId,
        mobIndex: state.mobIndex,
      });
      const lootLines = [
        `${displayMobName(state.mob.name)} повержен.`,
        v.mobSpoiled ? `Auto Spoil: моб автоматически спойлен.` : null,
        ...buildVictoryResourceLogLines(
          hero.name ?? "Герой",
          v.displayExp,
          v.displaySp,
          v.displayAdena
        ),
        ...(v.dropMessages.length > 0 ? v.dropMessages : []),
        ...(v.partyMemberLootLines.length > 0 ? v.partyMemberLootLines : []),
      ].filter((msg) => msg !== null) as string[];
      const combinedLog = [
        ...(v.levelUpMessage ? [v.levelUpMessage] : []),
        ...lootLines,
        ...finalLog,
      ].slice(0, 30);
      updates = {
        status: "victory",
        mobHP: 0,
        mobNextAttackAt: scheduleNext(now),
        heroBuffs: nextBuffsAfterDispel,
        mobBuffs: cleanedMobBuffs,
        log: combinedLog,
        cooldowns: state.cooldowns || {},
        summon: nextSummon,
        heroStunnedUntil,
        heroBuffsBlockedUntil,
        heroSkillsBlockedUntil,
        lastMobDamage: Math.round(heroDamage),
        activeChargeSlots: state.activeChargeSlots ?? [],
        lastReward: {
          exp: v.displayExp,
          sp: v.displaySp,
          adena: v.displayAdena,
          mob: state.mob.name ?? "",
          spoiled: v.mobSpoiled,
          mobAggressivePatrol: (state.mob as { aggressivePatrol?: boolean }).aggressivePatrol === true,
        },
      };
      set((prev) => ({ ...(prev as any), ...(updates as any) }));
      persistSnapshot(get, persistBattle, updates);
      return;
    }

    // Живий: оновлюємо HP та стати
    const heroWithNewHp = { ...hero, hp: nextHeroHP, maxHp: maxHp };
    const recalculated = recalculateAllStats(heroWithNewHp, nextBuffsAfterDispel);
    if (recalculated.baseFinalStats.pAtk !== hero.battleStats?.pAtk) {
      updateHero({ hp: nextHeroHP, battleStats: recalculated.baseFinalStats });
    } else {
      updateHero({ hp: nextHeroHP });
    }
    updates = {
      status: finalStatus,
      ...(mobHPChanged ? { mobHP: finalMobHP } : {}),
      mobNextAttackAt: scheduleNext(now),
      heroBuffs: nextBuffsAfterDispel,
      mobBuffs: cleanedMobBuffs,
      log: finalLog,
      cooldowns: state.cooldowns || {},
      summon: nextSummon,
      heroStunnedUntil,
      heroBuffsBlockedUntil,
      heroSkillsBlockedUntil,
      lastMobDamage: Math.round(heroDamage),
      activeChargeSlots: state.activeChargeSlots ?? [], // Заряди лишаються увімкненими після вбивства моба
    };
    set((prev) => ({ ...(prev as any), ...(updates as any) }));
    persistSnapshot(get, persistBattle, updates);
  };
