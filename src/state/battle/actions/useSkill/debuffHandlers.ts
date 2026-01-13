import type { BattleState } from "../../types";
import type { SkillDefinition, SkillLevelDefinition } from "../../../../data/skills/types";

/**
 * Обробляє Warrior Bane (skill 1350) - знімає бафи, що збільшують attackSpeed та speed/runSpeed
 */
export function handleWarriorBane(
  def: SkillDefinition,
  activeBuffs: any[]
): { newBuffs: any[]; log: string } {
  if (def.id !== 1350 || def.category !== "debuff") {
    return { newBuffs: activeBuffs, log: "" };
  }
  
  const chance = def.chance ?? 80;
  const landed = Math.random() * 100 < chance;
  
  if (!landed) {
    return { 
      newBuffs: activeBuffs, 
      log: `${def.name}: не спрацював (шанс ${chance}%)` 
    };
  }
  
  // Знімаємо бафи, що збільшують attackSpeed або speed/runSpeed
  const buffsToRemove: string[] = [];
  const filteredBuffs = activeBuffs.filter((b) => {
    if (!b.effects || !Array.isArray(b.effects)) return true;
    
    // Перевіряємо, чи баф збільшує attackSpeed або speed/runSpeed
    const hasAttackSpeedBuff = b.effects.some((eff: any) => 
      (eff.stat === "attackSpeed" || eff.stat === "atkSpeed") && 
      (eff.mode === "percent" || eff.mode === "flat" || eff.mode === "multiplier") &&
      (eff.value > 0 || (eff.mode === "multiplier" && eff.multiplier > 1))
    );
    const hasSpeedBuff = b.effects.some((eff: any) => 
      (eff.stat === "speed" || eff.stat === "runSpeed" || eff.stat === "moveSpeed") && 
      (eff.mode === "percent" || eff.mode === "flat" || eff.mode === "multiplier") &&
      (eff.value > 0 || (eff.mode === "multiplier" && eff.multiplier > 1))
    );
    
    if (hasAttackSpeedBuff || hasSpeedBuff) {
      buffsToRemove.push(b.name || `Buff ${b.id}`);
      return false; // Видаляємо баф
    }
    return true; // Залишаємо баф
  });
  
  let log = "";
  if (buffsToRemove.length > 0) {
    log = `${def.name}: знято ${buffsToRemove.length} бафів (${buffsToRemove.join(", ")})`;
  } else {
    log = `${def.name}: бафи не знайдено`;
  }
  
  if (import.meta.env.DEV) {
    console.log(`[WARRIOR BANE] Removed buffs:`, {
      skillName: def.name,
      skillId: def.id,
      removedBuffs: buffsToRemove,
      remainingBuffs: filteredBuffs.length,
    });
  }
  
  return { newBuffs: filteredBuffs, log };
}

/**
 * Обробляє Mage Bane (skill 1351) - знімає бафи, що збільшують mAtk та castSpeed
 */
export function handleMageBane(
  def: SkillDefinition,
  activeBuffs: any[]
): { newBuffs: any[]; log: string } {
  if (def.id !== 1351 || def.category !== "debuff") {
    return { newBuffs: activeBuffs, log: "" };
  }
  
  const chance = def.chance ?? 80;
  const landed = Math.random() * 100 < chance;
  
  if (!landed) {
    return { 
      newBuffs: activeBuffs, 
      log: `${def.name}: не спрацював (шанс ${chance}%)` 
    };
  }
  
  // Знімаємо бафи, що збільшують mAtk або castSpeed
  const buffsToRemove: string[] = [];
  const filteredBuffs = activeBuffs.filter((b) => {
    if (!b.effects || !Array.isArray(b.effects)) return true;
    
    // Перевіряємо, чи баф збільшує mAtk або castSpeed
    const hasMAtkBuff = b.effects.some((eff: any) => 
      eff.stat === "mAtk" && (eff.mode === "percent" || eff.mode === "flat" || eff.mode === "multiplier")
    );
    const hasCastSpeedBuff = b.effects.some((eff: any) => 
      (eff.stat === "castSpeed" || eff.stat === "castSpd") && (eff.mode === "percent" || eff.mode === "flat" || eff.mode === "multiplier")
    );
    
    if (hasMAtkBuff || hasCastSpeedBuff) {
      buffsToRemove.push(b.name || `Buff ${b.id}`);
      return false; // Видаляємо баф
    }
    return true; // Залишаємо баф
  });
  
  let log = "";
  if (buffsToRemove.length > 0) {
    log = `${def.name}: знято ${buffsToRemove.length} бафів (${buffsToRemove.join(", ")})`;
  } else {
    log = `${def.name}: бафи не знайдено`;
  }
  
  if (import.meta.env.DEV) {
    console.log(`[MAGE BANE] Removed buffs:`, {
      skillName: def.name,
      skillId: def.id,
      removedBuffs: buffsToRemove,
      remainingBuffs: filteredBuffs.length,
    });
  }
  
  return { newBuffs: filteredBuffs, log };
}

/**
 * Обробляє debuff скіли (застосування до мобів)
 */
export function handleDebuffSkill(
  def: SkillDefinition,
  levelDef: SkillLevelDefinition,
  state: BattleState,
  effList: any[],
  now: number
): { 
  newMobBuffs: any[]; 
  mobStunnedUntil: number | undefined; 
  log: string 
} {
  let newMobBuffs = state.mobBuffs || [];
  let mobStunnedUntil = state.mobStunnedUntil;
  let log = "";
  
  if (def.category !== "debuff" || !state.mob || def.id === 1350 || def.id === 1351) {
    return { newMobBuffs, mobStunnedUntil, log };
  }
  
  // Перевіряємо чи є stun ефект в debuff скілі
  const hasStunEffect = def.effects?.some((eff: any) => eff.stat === "stunResist" || eff.stat === "stun");
  
  // Якщо є stun ефект, обробляємо його окремо (не додаємо до mobBuffs)
  if (hasStunEffect) {
    const stunEffect = def.effects?.find((eff: any) => eff.stat === "stunResist" || eff.stat === "stun");
    if (stunEffect) {
      const baseChance = stunEffect.chance ?? def.chance ?? 100;
      const chance = Math.max(0, Math.min(100, baseChance));
      const applied = Math.random() * 100 < chance;
      
      if (applied) {
        const durationSeconds = stunEffect.duration ?? 1.5;
        const durationMs = durationSeconds * 1000;
        mobStunnedUntil = now + durationMs;
        log = `${def.name}: ${state.mob.name} оглушен на ${durationSeconds} сек`;
      } else {
        log = `${def.name}: не спрацював (шанс ${chance}%)`;
      }
    }
  } else {
    // Звичайні дебафи застосовуються до моба через applySkillEffect
    // Зберігаємо debuff в mobBuffs для подальшого використання
    const isSameDebuff = (b: any) =>
      b.id === def.id || b.name === def.name || (def.stackType && b.stackType === def.stackType);
    
    const filteredMobBuffs = newMobBuffs.filter((b) => !isSameDebuff(b));
    const durationSec = def.duration ?? 10;
    
    if (effList.length > 0 || def.hpPerTick !== undefined) {
      newMobBuffs = [
        ...filteredMobBuffs,
        {
          id: def.id,
          name: def.name,
          icon: def.icon || "/skills/attack.jpg",
          stackType: def.stackType,
          effects: effList,
          hpPerTick: def.hpPerTick, // For poison/bleed damage over time
          tickInterval: def.tickInterval ?? 5, // Default 5 seconds
          expiresAt: now + durationSec * 1000,
          startedAt: now,
          durationMs: durationSec * 1000,
          lastTickAt: now, // Initialize last tick time
        },
      ];
    }
    
    log = `${def.name} применено к ${state.mob.name}`;
  }
  
  if (import.meta.env.DEV) {
    console.log(`[DEBUFF] Applied to mob:`, {
      skillName: def.name,
      skillId: def.id,
      mobName: state.mob.name,
      effects: effList,
      hasStunEffect,
      mobStunnedUntil,
      mobBuffsCount: newMobBuffs.length,
    });
  }
  
  return { newMobBuffs, mobStunnedUntil, log };
}

