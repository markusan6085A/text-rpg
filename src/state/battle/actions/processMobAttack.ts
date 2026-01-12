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
import { getRaidBossAIProfile } from "../../../data/ai/raidBossAI";
import { recalculateAllStats } from "../../../utils/stats/recalculateAllStats";
import { isMobStunned } from "./useSkill/skillEffects";
import { getTotalShieldDefense, checkShieldBlock, hasShieldEquipped } from "../../../utils/shield/shieldDefense";
import { getReflectChances, checkReflectDamage } from "./useSkill/reflectDamage";
import { unequipItemLogic } from "../../heroStore/heroInventory";
import { locations as WORLD_LOCATIONS } from "../../../data/world";
import type { Zone } from "../../../data/world/types";

type Setter = (
  partial: Partial<BattleState> | ((state: BattleState) => Partial<BattleState>),
  replace?: boolean
) => void;

const scheduleNext = (now: number) => now + 1000 + Math.random() * 5000; // 1-6 seconds

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
        `${state.mob.name} оглушен и не может атаковать (осталось ${remainingStunTime} сек).`,
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

    const heroStats = applyBuffsToStats(hero.battleStats || {}, nextBuffs);
    const invulnerable = !!heroStats.invulnerable;

    const dodgeChance = Math.max(0, Math.min(80, Math.round(heroStats.evasion ?? 0)));
    const isMiss = Math.random() * 100 < dodgeChance;

    const updateHero = useHeroStore.getState().updateHero;

    if (isMiss) {
      const newLog = [`${state.mob.name} промахнулся.`, ...state.log].slice(0, 30);
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

    const pDef = heroStats.pDef ?? 0;
    const mDef = heroStats.mDef ?? 0;
    
    // Обчислюємо захист щитом (якщо надітий щит)
    const shieldDefense = getTotalShieldDefense(hero, heroStats);
    
    // Визначаємо тип атаки моба (фізична або магічна)
    const isPhysicalAttack = (state.mob as any)?.attackType !== "magic";
    
    // Застосовуємо debuff до статів моба (зменшення pAtk/mAtk тощо)
    // Тепер моби мають стати в собі, але якщо їх немає - використовуємо fallback
    const mobBaseStats = {
      pAtk: state.mob.pAtk ?? (state.mob.level ?? 1) * 20,
      pDef: state.mob.pDef ?? Math.round((state.mob.level ?? 1) * 8 + state.mob.hp * 0.15),
      mAtk: state.mob.mAtk ?? 0,
      mDef: state.mob.mDef ?? Math.round((state.mob.level ?? 1) * 8 + state.mob.hp * 0.12),
    };
    const mobStatsWithDebuffs = applyBuffsToStats(mobBaseStats, cleanedMobBuffs);
    const mobPAtk = Math.max(1, mobStatsWithDebuffs.pAtk ?? mobBaseStats.pAtk);
    const mobMAtk = Math.max(1, mobStatsWithDebuffs.mAtk ?? mobBaseStats.mAtk);
    
    // Базовий урон для звичайних мобів
    // Для фізичних атак використовуємо pAtk, для магічних - mAtk
    let base = isPhysicalAttack 
      ? Math.max(5, mobPAtk * 0.8) // 80% від pAtk моба
      : Math.max(5, mobMAtk * 0.8); // 80% від mAtk моба
    
    // Для рейд-босів використовуємо AI профіль з множником урону
    const isRaidBoss = (state.mob as any).isRaidBoss === true;
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
            // Застосовуємо множник урону з фази
            base = base * currentPhase.damageMultiplier;
          } else {
            // Якщо фаза не знайдена, використовуємо множник з першої фази
            base = base * (aiProfile.phases[0]?.damageMultiplier ?? 1.0);
          }
        }
      }
      // Для рейд-босів також збільшуємо базовий урон (450 замість 200)
      // Якщо зараз б'є по 200, а потрібно 450, то множник = 450/200 = 2.25
      // Але враховуючи, що вже є damageMultiplier, просто збільшимо базовий урон
      base = base * 2.25;
    }
    
    const variance = 0.25;
    const raw = base * (1 - variance + Math.random() * variance * 2);
    
    // Застосовуємо захист (правильна формула Lineage 2 стиль)
    // Для фізичних атак використовуємо pDef, для магічних - mDef
    // Формула: damage = raw * (100 / (100 + defense))
    // Це забезпечує правильне масштабування захисту
    const defense = isPhysicalAttack ? pDef : mDef;
    let mitigated = invulnerable ? 0 : Math.max(1, Math.round(raw * (100 / (100 + defense))));
    
    // Перевіряємо блок щита (якщо надітий щит)
    const shieldBlockRate = heroStats.shieldBlockRate ?? 0;
    let shieldBlocked = false;
    
    if (hasShieldEquipped(hero) && shieldBlockRate > 0) {
      shieldBlocked = checkShieldBlock(shieldBlockRate);
      
      if (shieldBlocked) {
        // Якщо блок спрацював, зменшуємо урон на pDef щита
        mitigated = Math.max(1, mitigated - shieldDefense);
        
        if (import.meta.env.DEV) {
          console.log(`[Shield Block] Blocked!`, {
            rawDamage: raw,
            afterPDef: Math.round(raw * (100 / (100 + pDef))),
            shieldBlockRate,
            shieldDefense,
            damageBeforeBlock: Math.round(raw * (100 / (100 + pDef))),
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

    // Перевіряємо логіку відбиття урону (Physical Mirror) - працює тільки з щитом
    // Для PvP атак може бути як фізична, так і магічна атака
    // isPhysicalAttack вже визначено вище
    const reflectChances = getReflectChances(nextBuffs, hero, now);
    const reflectResult = checkReflectDamage(mitigated, isPhysicalAttack, reflectChances);
    
    let finalHeroDamage = mitigated;
    let reflectedDamage = 0;
    let nextMobHP = state.mobHP;

    // Якщо відбиття спрацювало, урон відбивається назад на моба
    if (reflectResult.reflected) {
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
        const aggressiveIsPhysicalAttack = (aggressiveMob as any)?.attackType !== "magic";
        
        // Обчислюємо стати агресивного моба
        const aggressiveMobBaseStats = {
          pAtk: aggressiveMob.pAtk ?? (aggressiveMob.level ?? 1) * 20,
          mAtk: aggressiveMob.mAtk ?? 0,
        };
        const aggressiveMobPAtk = aggressiveMobBaseStats.pAtk;
        const aggressiveMobMAtk = aggressiveMobBaseStats.mAtk;
        
        // Базовий урон для агресивного моба (80% від pAtk/mAtk)
        let aggressiveBase = aggressiveIsPhysicalAttack
          ? Math.max(5, aggressiveMobPAtk * 0.8)
          : Math.max(5, aggressiveMobMAtk * 0.8);
        
        const aggressiveVariance = 0.25;
        const aggressiveRaw = aggressiveBase * (1 - aggressiveVariance + Math.random() * aggressiveVariance * 2);
        
        // Застосовуємо захист
        const aggressiveDefense = aggressiveIsPhysicalAttack ? pDef : mDef;
        let aggressiveMitigated = invulnerable ? 0 : Math.max(1, Math.round(aggressiveRaw * (100 / (100 + aggressiveDefense))));
        
        // Перевіряємо блок щита (з меншою ймовірністю для агресивних мобів)
        let aggressiveShieldBlocked = false;
        if (hasShieldEquipped(hero) && shieldBlockRate > 0) {
          // Агресивні моби мають менший шанс пробити блок (50% від звичайного)
          aggressiveShieldBlocked = Math.random() < (shieldBlockRate / 100) * 0.5;
          if (aggressiveShieldBlocked) {
            aggressiveMitigated = Math.max(1, aggressiveMitigated - shieldDefense);
          }
        }
        
        // Перевіряємо промах (з меншою ймовірністю для агресивних мобів)
        const aggressiveDodgeChance = dodgeChance * 0.7; // Агресивні моби точніші
        const aggressiveIsMiss = Math.random() * 100 < aggressiveDodgeChance;
        
        if (aggressiveIsMiss) {
          aggressiveDamageLines.push(`${aggressiveMob.name} промахнулся.`);
        } else {
          totalAggressiveDamage += aggressiveMitigated;
          if (aggressiveShieldBlocked) {
            aggressiveDamageLines.push(`${aggressiveMob.name} атакует, щит блокирует! (${Math.round(aggressiveMitigated)} урона)`);
          } else {
            aggressiveDamageLines.push(`${aggressiveMob.name} наносит ${Math.round(aggressiveMitigated)} урона.`);
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

    const lines: string[] = [];
    
    // Логіка блоку щита
    if (shieldBlocked) {
      lines.push(
        `Щит заблокував атаку! Урон зменшено на ${shieldDefense}.`
      );
    }
    
    // Логіка відбиття урону
    if (reflectResult.reflected) {
      lines.push(
        `Physical Mirror отразил ${Math.round(reflectedDamage)} урона обратно на ${state.mob.name}!`
      );
      if (nextMobHP <= 0) {
        lines.push(`${state.mob.name} побежден отраженным уроном!`);
      }
    } else {
      // Звичайний урон
      if (heroDamage === 0) {
        lines.push(`${state.mob.name} попал, но не нанес урона.`);
      } else {
        lines.push(`${state.mob.name} наносит вам ${Math.round(heroDamage)} урона.`);
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
    let heroStunnedUntil = state.heroStunnedUntil;
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
                specialEffectsLog.push(`${state.mob.name} оглушил вас на ${currentPhase.stunDuration} сек!`);
              }
            }

            // Перевірка на блокування бафів та скілів
            if (currentPhase.blockBuffsAndSkillsChance && currentPhase.blockDuration) {
              const isBlocked = (state.heroBuffsBlockedUntil && state.heroBuffsBlockedUntil > now) ||
                                (state.heroSkillsBlockedUntil && state.heroSkillsBlockedUntil > now);
              if (!isBlocked && Math.random() < currentPhase.blockBuffsAndSkillsChance) {
                heroBuffsBlockedUntil = now + currentPhase.blockDuration * 1000;
                heroSkillsBlockedUntil = now + currentPhase.blockDuration * 1000;
                specialEffectsLog.push(`${state.mob.name} заблокировал ваши бафы и навыки на ${currentPhase.blockDuration} сек!`);
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
        specialEffectsLog.push(`${state.mob.name} зняв всі ваші бафы! (${buffsBeforeDispel} бафов удалено)`);
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
          specialEffectsLog.push(`${state.mob.name} наложил на вас проклятие: Weakness! (-17% физ. атака на 5 сек)`);
        }
      }
    }

    // Перераховуємо стати після зміни HP та можливого зняття бафів
    // Це активує пасивні скіли з hpThreshold (наприклад, Final Frenzy)
    const heroWithNewHp = { ...hero, hp: nextHeroHP, maxHp: maxHp };
    const recalculated = recalculateAllStats(heroWithNewHp, nextBuffsAfterDispel);
    
    // Оновлюємо battleStats в heroStore, щоб вони відображалися правильно
    if (recalculated.finalStats.pAtk !== hero.battleStats?.pAtk) {
      updateHero({ 
        hp: nextHeroHP,
        battleStats: recalculated.finalStats 
      });
    } else {
      updateHero({ hp: nextHeroHP });
    }

    // Додаємо повідомлення про спеціальні ефекти до логу
    const finalLog = specialEffectsLog.length > 0 
      ? [...specialEffectsLog, ...newLog].slice(0, 30)
      : newLog;

    const salvationBuff = nextBuffsAfterDispel.find((b) => b.effects?.some?.((e: any) => e.stat === "salvation"));
    let updates: Partial<BattleState>;

    // Оновлюємо HP моба, якщо відбиття спрацювало (для всіх випадків)
    const finalMobHP = reflectResult.reflected ? nextMobHP : state.mobHP;
    const finalStatus = finalMobHP <= 0 ? "victory" : (nextHeroHP <= 0 ? "idle" : state.status);

    if (nextHeroHP <= 0 && salvationBuff) {
      const ratio =
        typeof salvationBuff.effects?.find?.((e: any) => e.stat === "salvation")?.value === "number"
          ? salvationBuff.effects.find((e: any) => e.stat === "salvation").value / 100
          : 0.7;
      const filteredBuffs = nextBuffsAfterDispel.filter((b) => b !== salvationBuff);
      const savedHP = Math.max(1, Math.round(maxHp * ratio));
      const savedMP = Math.max(1, Math.round(maxMp * ratio));
      
      // Перераховуємо стати після зміни HP
      const heroWithSavedHp = { ...hero, hp: savedHP, maxHp: maxHp };
      const recalculatedSaved = recalculateAllStats(heroWithSavedHp, filteredBuffs);
      updateHero({ 
        hp: savedHP, 
        mp: savedMP, 
        cp: Math.min(maxCp, curHeroCP),
        battleStats: recalculatedSaved.finalStats 
      });
      
      updates = {
        status: finalMobHP <= 0 ? "victory" : "fighting",
        mobHP: finalMobHP,
        mobNextAttackAt: scheduleNext(now),
        heroBuffs: filteredBuffs,
        mobBuffs: cleanedMobBuffs,
        log: ["Сработало Спасение.", ...finalLog].slice(0, 30),
        cooldowns: state.cooldowns || {},
        summon: nextSummon,
        heroStunnedUntil,
        heroBuffsBlockedUntil,
        heroSkillsBlockedUntil,
      };
    } else if (nextHeroHP <= 0) {
      // ❗ ВАЖЛИВО: При смерті видаляємо ВСІ бафи (і від статуї, і від скілів)
      const buffsAfterDeath: any[] = []; // Всі бафи видаляються при смерті
      
      // ❗ ЗНЯТТЯ ЗАРИЧА ПРИ СМЕРТІ
      let equipmentAfterDeath = hero.equipment;
      let equipmentEnchantLevelsAfterDeath = hero.equipmentEnchantLevels;
      let zaricheEquippedUntilAfterDeath = hero.zaricheEquippedUntil;
      
      if (hero.equipment?.weapon === "zariche") {
        // Знімаємо Зарича
        const heroWithoutZariche = unequipItemLogic(hero, "weapon");
        equipmentAfterDeath = heroWithoutZariche.equipment;
        equipmentEnchantLevelsAfterDeath = heroWithoutZariche.equipmentEnchantLevels;
        zaricheEquippedUntilAfterDeath = undefined;
      }
      
      // Перераховуємо стати навіть при смерті (на випадок, якщо є скіли, що активуються при 0 HP)
      const heroWithZeroHp = { ...hero, hp: 0, maxHp: maxHp, equipment: equipmentAfterDeath };
      const recalculatedDead = recalculateAllStats(heroWithZeroHp, buffsAfterDeath);
      updateHero({ 
        hp: 0,
        battleStats: recalculatedDead.finalStats,
        equipment: equipmentAfterDeath,
        equipmentEnchantLevels: equipmentEnchantLevelsAfterDeath,
        zaricheEquippedUntil: zaricheEquippedUntilAfterDeath,
      });
      
      updates = {
        status: finalMobHP <= 0 ? "victory" : "idle",
        mobHP: finalMobHP,
        mobNextAttackAt: null,
        heroBuffs: buffsAfterDeath, // Всі бафи видалені при смерті
        mobBuffs: cleanedMobBuffs,
        log: ["Вы мертвы.", ...finalLog].slice(0, 30),
        cooldowns: state.cooldowns || {},
        summon: nextSummon,
        heroStunnedUntil,
        heroBuffsBlockedUntil,
        heroSkillsBlockedUntil,
      };
    } else {
      // Стати вже перераховані вище після зняття бафів
      updates = {
        status: finalStatus,
        mobHP: finalMobHP,
        mobNextAttackAt: scheduleNext(now),
        heroBuffs: nextBuffsAfterDispel, // Використовуємо бафи після можливого зняття
        mobBuffs: cleanedMobBuffs,
        log: finalLog,
        cooldowns: state.cooldowns || {},
        summon: nextSummon,
        heroStunnedUntil,
        heroBuffsBlockedUntil,
        heroSkillsBlockedUntil,
      };
    }

    set((prev) => ({ ...(prev as any), ...(updates as any) }));
    persistSnapshot(get, persistBattle, updates);
  };
