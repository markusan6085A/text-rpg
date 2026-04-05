import { useHeroStore } from "../../heroStore";
import { useCharacterStore } from "../../characterStore";
import {
  applyBuffsToStats,
  cleanupBuffs,
  computeBuffedMaxResources,
} from "../helpers";
import { getMaxResources } from "../helpers/getMaxResources";
import { BASE_ATTACK, getSkillDef, getSkillDefForBattle, skillDefIsBuff, skillDefIsToggle } from "../loadout";
import type { SkillDefinition, SkillLevelDefinition } from "../../../data/skills/types";
import type { Hero } from "../../../types/Hero";
import type { BattleState } from "../types";
import { checkSkillConditions } from "../../../utils/stats/applyPassiveSkills";
import { canAttackWithBow, isBowEquipped } from "./useSkill/arrowHelpers";
import {
  handleSummonSkill,
  handleServitorHeal,
  handleCorpseDrain,
} from "./specialSkills";
import { handleConsumable } from "./useConsumable";
import {
  handleSummon,
  handleServitorHeal as handleServitorHealNew,
  handleServitorBuff as handleServitorBuffNew,
} from "./summons";
import { handleBaseAttack } from "./useSkill/baseAttack";
import { handleHealSkill } from "./useSkill/healSkill";
import { handleBuffSkill } from "./useSkill/buffSkill";
import { handleAttackSkill } from "./useSkill/attackSkill";
import {
  createSetAndPersist,
  createCooldownMs,
  clampChance,
  getCritMultiplier,
  getSkillCritMultiplier,
  SONIC_FOCUS_ID,
  SONIC_CONSUMERS,
  SONIC_COST,
  SUMMON_SKILLS,
  FOCUSED_FORCE_ID,
  FOCUSED_FORCE_CONSUMERS,
  FOCUSED_FORCE_COST,
  type Setter,
} from "./useSkill/helpers";
import { schedulePveSelfBuffOnline } from "./pveSelfBuffOnline";
import { schedulePveAttackSkillOnline } from "./pveAttackSkillOnline";
import { useAuthStore } from "../../authStore";
import { createIsSameBuff } from "./useSkill/buffHelpers";
import { recalculateAllStats } from "../../../utils/stats/recalculateAllStats";

function isEligiblePveServerAttack(
  skillId: number,
  def: SkillDefinition,
  state: BattleState,
  hero: Hero,
  levelDef: SkillLevelDefinition
): boolean {
  if (state.zoneId === "fishing") return false;
  if (def.category !== "physical_attack" && def.category !== "magic_attack") return false;
  if (def.itemConsume) return false;
  if (SONIC_CONSUMERS.has(skillId) || FOCUSED_FORCE_CONSUMERS.has(skillId)) return false;
  const rawMp = Math.max(0, Number(levelDef.mpCost ?? 0));
  if ((hero.mp ?? 0) < rawMp) return false;
  if (!useAuthStore.getState().accessToken) return false;
  const cid = String(useCharacterStore.getState().characterId ?? "").trim();
  const hid = String((hero as any)?.id ?? "").trim();
  if (!cid || hid !== cid) return false;
  return true;
}

function isEligiblePveServerSelfCast(def: SkillDefinition): boolean {
  if (SUMMON_SKILLS.has(def.id)) return false;
  if (def.itemConsume) return false;
  if (def.category === "debuff") return false;
  if (def.category === "heal") return false;
  if (def.category === "physical_attack" || def.category === "magic_attack") return false;
  if (def.category === "special") return false;
  if (skillDefIsBuff(def)) return true;
  if (skillDefIsToggle(def)) return true;
  return false;
}

export const createUseSkill =
  (set: Setter, get: () => BattleState): BattleState["useSkill"] =>
  (skillId) => {
    const state = get();
    // Cast skills only in battle (base attack also requires fighting state).
    if (state.status !== "fighting" || !state.mob) {
      return;
    }

    const heroStore = useHeroStore.getState();
    const hero = heroStore.hero;
    const updateHero = heroStore.updateHero;
    if (!hero) return;

    if (hero.hp !== undefined && hero.hp <= 0) {
      const setAndPersist = createSetAndPersist(set, get);
      setAndPersist({
        log: ["Вы мертвы и не можете использовать навыки.", ...state.log].slice(0, 30),
      });
      return;
    }

    const now = Date.now();

    // Перевірка на stun гравця (крім базової атаки)
    if (skillId !== BASE_ATTACK.id) {
      if (state.heroStunnedUntil && state.heroStunnedUntil > now) {
        const remainingStunTime = Math.ceil((state.heroStunnedUntil - now) / 1000);
        const setAndPersist = createSetAndPersist(set, get);
        setAndPersist({
          log: [`Вы оглушены и не можете использовать навыки (осталось ${remainingStunTime} сек).`, ...state.log].slice(0, 30),
        });
        return;
      }

      // Перевірка на блокування скілів
      if (state.heroSkillsBlockedUntil && state.heroSkillsBlockedUntil > now) {
        const remainingBlockTime = Math.ceil((state.heroSkillsBlockedUntil - now) / 1000);
        const setAndPersist = createSetAndPersist(set, get);
        setAndPersist({
          log: [`Ваши навыки заблокированы (осталось ${remainingBlockTime} сек).`, ...state.log].slice(0, 30),
        });
        return;
      }
    }

    const setAndPersist = createSetAndPersist(set, get);

    // ------------------------
    // Consumable (расходники)
    // ------------------------
    if (typeof skillId === "string" && skillId.startsWith("consumable:")) {
      if (!state.loadoutSlots.includes(skillId)) {
        return;
      }
      const handled = handleConsumable(skillId, state, hero, now, setAndPersist, updateHero);
      if (handled) return;
      return; // Якщо не оброблено, виходимо
    }

    // Перевірка для скілів (тільки number)
    if (typeof skillId === "number") {
      if (skillId !== BASE_ATTACK.id && !state.loadoutSlots.includes(skillId)) {
        if (import.meta.env.DEV && skillId === 92) {
          console.warn(`[useSkill] Shield Stun (${skillId}) not in loadoutSlots:`, state.loadoutSlots);
        }
        return;
      }
    } else {
      return; // Якщо не number і не consumable, виходимо
    }

    let activeBuffs = cleanupBuffs(state.heroBuffs, now);

    // Отримуємо max ресурси з урахуванням бафів (використовуємо getMaxResources для консистентності)
    const baseMax = getMaxResources(hero);
    const computeMaxNow = (buffs: any[]) => computeBuffedMaxResources(baseMax, buffs as any);

    // ------------------------
    // Base attack
    // ------------------------
    if (skillId === BASE_ATTACK.id) {
      const handled = handleBaseAttack(
        state,
        hero,
        now,
        activeBuffs,
        computeMaxNow,
        updateHero,
        setAndPersist
      );
      if (handled) return;
    }

    // ------------------------
    // Active skill
    // ------------------------
    const learned = (hero.skills || []).find((s: any) => Number(s.id) === skillId);
    if (!learned) return;

    const def = getSkillDefForBattle(hero.profession, hero.klass, hero.race, skillId) ?? getSkillDef(skillId);
    if (!def) return;
    // 🔍 ДІАГНОСТИКА: що реально приходить при касті (для "всі як toggle")
    if (import.meta.env.DEV && (def.category === "buff" || def.category === "toggle")) {
      console.log("[useSkill] cast", {
        id: skillId,
        name: def.name,
        category: def.category,
        toggle: def.toggle,
        toggleType: typeof def.toggle,
      });
    }

    // Перевірка стріл для лука (якщо навик вимагає лук)
    if (def.requiresWeapon === "bow" || (isBowEquipped(hero) && (def.category === "physical_attack" || def.category === "magic_attack"))) {
      const bowCheck = canAttackWithBow(hero);
      if (!bowCheck.canAttack) {
        setAndPersist({
          log: [bowCheck.message || "У вас нет стрел для лука!", ...state.log].slice(0, 30),
        });
        return;
      }
    }

    // Перевіряємо умови для скіла (броня/зброя)
    // Це працює для всіх скілів, включаючи атакуючі (physical_attack, magic_attack)
    if (!checkSkillConditions(def, hero.equipment)) {
      // Скіл не може бути використаний через невиконання умов (немає потрібної броні/зброї)
      const isAttackSkill = def.category === "physical_attack" || def.category === "magic_attack";
      
      // Формуємо повідомлення для користувача
      let message = "";
      if (def.requiresArmor && def.requiresWeapon) {
        const armorNames: Record<string, string> = { light: "легку броню", heavy: "важку броню", robe: "робу" };
        const weaponNames: Record<string, string> = { 
          sword: "меч", bow: "лук", staff: "посох", club: "дубину", 
          dagger: "кинжал", polearm: "спис", fist: "кастети", 
          dualsword: "два мечі", dualdagger: "два кинжали" 
        };
        message = `${def.name} вимагає ${armorNames[def.requiresArmor]} та ${weaponNames[def.requiresWeapon]}!`;
      } else if (def.requiresArmor) {
        const armorNames: Record<string, string> = { light: "легку броню", heavy: "важку броню", robe: "робу" };
        message = `${def.name} вимагає ${armorNames[def.requiresArmor]}!`;
      } else if (def.requiresWeapon) {
        const weaponNames: Record<string, string> = { 
          sword: "меч", bow: "лук", staff: "посох", club: "дубину", 
          dagger: "кинжал", polearm: "спис", fist: "кастети", 
          dualsword: "два мечі", dualdagger: "два кинжали" 
        };
        message = `${def.name} вимагає ${weaponNames[def.requiresWeapon]}!`;
      } else {
        message = `${def.name} не може бути використаний!`;
      }
      
      // Додаємо повідомлення в лог бою
      setAndPersist({
        log: [message, ...state.log].slice(0, 30),
      });
      
      if (import.meta.env.DEV) {
        console.warn(`[useSkill] ${isAttackSkill ? "Attack" : "Skill"} ${skillId} (${def.name}) cannot be used: conditions not met`, {
          category: def.category,
          requiresArmor: def.requiresArmor,
          requiresWeapon: def.requiresWeapon,
          equipment: hero.equipment,
          weaponSlot: hero.equipment?.weapon,
          armorSlot: hero.equipment?.armor,
          message,
        });
      }
      return;
    }

    const levelDef = def.levels.find((l) => l.level === learned.level) ?? def.levels[0];
    if (!levelDef) return;

    // 🔥 Захист: якщо battleStats порожні або без pAtk/mAtk/castSpeed — перераховуємо (фікс урону ~798, швидкості касту)
    let heroForStats = hero;
    const bs = hero.battleStats;
    const needsStatsRecalc = !bs || (bs.pAtk ?? 0) < 1 || (bs.mAtk ?? 0) < 1 || (bs.castSpeed ?? 0) < 1;
    if (needsStatsRecalc) {
      const recalculated = recalculateAllStats(hero, activeBuffs);
      updateHero({ battleStats: recalculated.baseFinalStats });
      heroForStats = { ...hero, battleStats: recalculated.baseFinalStats };
    }

    const heroStats = applyBuffsToStats(heroForStats.battleStats || {}, activeBuffs);
    const rawMpCost = levelDef.mpCost ?? 0;
    const lsGuidance = (heroStats as any)?.lsGuidance ?? 0;
    const mpSkillRed = Math.min(90, (heroStats as any)?.mpSkillCostReduction ?? 0);
    const mpCost = Math.max(
      0,
      Math.round(rawMpCost * (1 - lsGuidance / 100) * (1 - mpSkillRed / 100))
    );
    const isToggle = skillDefIsToggle(def);
    const togglingToggleOff = isToggle && activeBuffs.some(createIsSameBuff(def));
    if (!togglingToggleOff && (hero.mp ?? 0) < mpCost) {
      if (import.meta.env.DEV && skillId === 92) {
        console.warn(`[useSkill] Shield Stun (${skillId}) not enough MP. Required: ${mpCost}, Have: ${hero.mp ?? 0}`);
      }
      return;
    }
    const attackSpeed = heroStats?.attackSpeed ?? heroStats?.atkSpeed ?? 0;
    const castSpeed = heroStats?.castSpeed ?? 333;
    const skillCategory = def.category;
    
    // Визначаємо, чи це магічний скіл (magic_attack, heal, buff)
    const isMagicSkill = skillCategory === "magic_attack" || skillCategory === "heal" || skillCategory === "buff";
    
    // Отримуємо пасивку на cooldown reduction (якщо є)
    const passiveCdReduction = heroStats?.cooldownReduction ?? 0;
    
    const cooldownMs = createCooldownMs(
      skillCategory,
      isMagicSkill,
      attackSpeed,
      castSpeed,
      passiveCdReduction,
      heroStats
    );

    const cooldowns = get().cooldowns || {};
    
    if (skillId !== BASE_ATTACK.id) {
      const storedCdRaw = cooldowns[skillId];
      const storedCd = typeof storedCdRaw === "number" ? storedCdRaw : 0;
      
      // Toggle: після вмикання ставився cooldown — він не повинен блокувати друге натискання (вимкнення)
      if (isToggle && storedCd > now) {
        const toggleActive = activeBuffs.some(createIsSameBuff(def));
        if (!toggleActive) {
          const remainingMs = storedCd - now;
          if (import.meta.env.DEV) {
            console.log(`[TOGGLE] Cooldown check for ${def.name} (${def.id}):`, {
              storedCd,
              now,
              remainingMs,
              remainingSeconds: Math.round(remainingMs/1000),
              defCooldown: def.cooldown,
            });
          }
          setAndPersist({
            log: [`${def.name} на перезарядці (залишилось ${Math.round(remainingMs/1000)}с)`, ...get().log].slice(0, 30),
          });
          return;
        }
      }
      
      // Для звичайних скілів - складніша логіка з урахуванням castSpeed
      if (!isToggle && Number.isFinite(storedCd) && storedCd > 0) {
        const usedAt = cooldowns[`${skillId}_usedAt`] ?? (storedCd - (cooldowns[`${skillId}_originalCd`] ?? 5000));
        const baseCooldownSec = def.cooldown ?? 5;
        const currentCooldownMs = cooldownMs(baseCooldownSec, false);
        const timeSinceUse = now - usedAt;
        
        if (timeSinceUse < currentCooldownMs) {
          const remainingMs = currentCooldownMs - timeSinceUse;
          const newReadyAt = now + remainingMs;
          const updatedCooldowns = { 
            ...cooldowns, 
            [skillId]: newReadyAt, 
            [`${skillId}_usedAt`]: usedAt,
            [`${skillId}_originalCd`]: currentCooldownMs 
          };
          setAndPersist({ cooldowns: updatedCooldowns });
          return;
        } else {
          const updatedCooldowns = { ...cooldowns };
          delete updatedCooldowns[skillId];
          delete updatedCooldowns[`${skillId}_usedAt`];
          delete updatedCooldowns[`${skillId}_originalCd`];
          setAndPersist({ cooldowns: updatedCooldowns });
        }
      }
    }
    
    const isMagic = skillCategory === "magic_attack";
    const isPhysical = skillCategory === "physical_attack";
    const isHeal = def.category === "heal";
    const isAttack = isMagic || isPhysical;
    if (isAttack) {
      if (state.status !== "fighting" || !state.mob) return;
    }
    
    const critChance = isMagic
      ? clampChance(heroStats?.mCrit)
      : clampChance(heroStats?.crit);
    // Для скілів використовуємо окрему формулу з меншим множником та капом
    const baseCritMult = getSkillCritMultiplier(heroStats?.critPower ?? heroStats?.critDamage);
    const lsAnger = heroStats?.lsAnger ?? 0;
    const critMult = baseCritMult * (1 + lsAnger / 100);

    if (SONIC_CONSUMERS.has(skillId)) {
      const focusBuff = activeBuffs.find((b) => b.id === SONIC_FOCUS_ID);
      const stacks = focusBuff?.stacks ?? 0;
      if (stacks <= 0) {
        setAndPersist({
          heroBuffs: activeBuffs,
          log: [`Недостаточно зарядов Sonic Focus`, ...state.log].slice(0, 30),
        });
        return;
      }
      const need = SONIC_COST[skillId] ?? 1;
      if (stacks < need) {
        setAndPersist({
          heroBuffs: activeBuffs,
          log: [`Требуется зарядов: ${need} (Sonic Focus)`, ...state.log].slice(0, 30),
        });
        return;
      }
    }

    if (FOCUSED_FORCE_CONSUMERS.has(skillId)) {
      const focusBuff = activeBuffs.find((b) => b.id === FOCUSED_FORCE_ID);
      const stacks = focusBuff?.stacks ?? 0;
      if (stacks <= 0) {
        setAndPersist({
          heroBuffs: activeBuffs,
          log: [`Недостаточно зарядов Focused Force`, ...state.log].slice(0, 30),
        });
        return;
      }
      const need = FOCUSED_FORCE_COST[skillId] ?? 1;
      if (stacks < need) {
        setAndPersist({
          heroBuffs: activeBuffs,
          log: [`Требуется зарядов: ${need} (Focused Force)`, ...state.log].slice(0, 30),
        });
        return;
      }
    }

    // Special skill handlers (summon, servitor, corpse drain)
    // Try new summon system first, then fall back to legacy handlers
    if (
      handleSummon(
        skillId,
        def,
        levelDef,
        state,
        hero,
        heroStats,
        mpCost,
        now,
        set,
        get,
        computeMaxNow,
        activeBuffs,
        cooldownMs
      ) ||
      handleServitorHealNew(
        skillId,
        def,
        levelDef,
        state,
        heroStats,
        mpCost,
        now,
        set,
        get,
        computeMaxNow,
        activeBuffs,
        cooldownMs
      ) ||
      handleServitorBuffNew(
        skillId,
        def,
        levelDef,
        state,
        mpCost,
        now,
        set,
        get,
        computeMaxNow,
        activeBuffs,
        cooldownMs
      ) ||
      handleSummonSkill(
        skillId,
        def,
        levelDef,
        state,
        hero,
        heroStats,
        mpCost,
        now,
        set,
        get,
        computeMaxNow,
        activeBuffs,
        cooldownMs
      ) ||
      handleServitorHeal(
        skillId,
        def,
        levelDef,
        state,
        heroStats,
        mpCost,
        now,
        set,
        get,
        computeMaxNow,
        activeBuffs,
        cooldownMs
      ) ||
      handleCorpseDrain(
        skillId,
        def,
        levelDef,
        state,
        hero,
        mpCost,
        now,
        set,
        get,
        computeMaxNow,
        activeBuffs,
        cooldownMs
      )
    ) {
      return; // Special handler processed the skill
    }

    // Heal skills (self-targeted or summon-targeted)
    if (isHeal) {
      const handled = handleHealSkill(
        skillId,
        def,
        levelDef,
        state,
        hero,
        heroStats,
        mpCost,
        now,
        activeBuffs,
        computeMaxNow,
        cooldownMs,
        updateHero,
        setAndPersist,
        get
      );
      if (handled) return;
    }

    // Buff / Debuff / Toggle / Special / non-attack skills
    if (!isAttack) {
      if (isEligiblePveServerSelfCast(def)) {
        const characterId =
          String(useCharacterStore.getState().characterId ?? "").trim() ||
          String((hero as any)?.id ?? "").trim();
        if (characterId) {
          schedulePveSelfBuffOnline(skillId, def, () => {
            handleBuffSkill(
              skillId,
              def,
              levelDef,
              state,
              hero,
              heroStats,
              mpCost,
              now,
              activeBuffs,
              computeMaxNow,
              cooldownMs,
              updateHero,
              setAndPersist,
              set,
              get
            );
          });
          return;
        }
      }
      const handled = handleBuffSkill(
        skillId,
        def,
        levelDef,
        state,
        hero,
        heroStats,
        mpCost,
        now,
        activeBuffs,
        computeMaxNow,
        cooldownMs,
        updateHero,
        setAndPersist,
        set,
        get
      );
      if (handled) return;
    }

    // Attack skills
    if (isAttack) {
      const runLocalAttack = () => {
        if (import.meta.env.DEV && skillId === 92) {
          console.log(`[useSkill] Calling handleAttackSkill for Shield Stun:`, {
            skillId,
            skillName: def.name,
            isMagic,
            isPhysical,
            isAttack,
            mpCost,
            heroMP: hero.mp,
            power: levelDef.power,
          });
        }
        const handled = handleAttackSkill(
          skillId,
          def,
          levelDef,
          state,
          hero,
          heroStats,
          mpCost,
          now,
          activeBuffs,
          computeMaxNow,
          cooldownMs,
          isMagic,
          isPhysical,
          critChance,
          critMult,
          updateHero,
          setAndPersist,
          get
        );
        if (import.meta.env.DEV && skillId === 92) {
          console.log(`[useSkill] handleAttackSkill returned:`, handled);
        }
      };

      if (isEligiblePveServerAttack(skillId, def, state, hero, levelDef)) {
        const cid =
          String(useCharacterStore.getState().characterId ?? "").trim() ||
          String((hero as any)?.id ?? "").trim();
        if (cid) {
          const baseCooldownSec = def.cooldown ?? 5;
          const currentCooldownMs = cooldownMs(baseCooldownSec, false);
          schedulePveAttackSkillOnline({
            skillId,
            def,
            levelDef,
            hero,
            heroStats,
            state,
            cooldownDurationMs: currentCooldownMs,
            now,
            onFallback: runLocalAttack,
          });
          return;
        }
      }
      runLocalAttack();
    }
  };
