import type { BattleState } from "../../types";
import type { SkillDefinition } from "../../../../data/skills/types";
import { createIsSameBuff } from "./buffHelpers";

/**
 * Обробляє бафи для сумонів (якщо скіл має target: "ally" і є активний сумон)
 */
export function handleSummonBuffs(
  def: SkillDefinition,
  state: BattleState,
  effList: any[],
  now: number,
  finalDurationSec: number
): { newSummonBuffs: any[] } {
  let newSummonBuffs = state.summonBuffs || [];
  
  if (def.category !== "buff" || def.target !== "ally" || !state.summon || state.summon.hp <= 0 || effList.length === 0) {
    return { newSummonBuffs };
  }
  
  // Перевіряємо, чи це скіл для сумонів (наприклад, Summon Feline Queen)
  const isSameSummonBuff = createIsSameBuff(def);
  
  const filteredSummonBuffs = newSummonBuffs.filter((b) => !isSameSummonBuff(b));
  const durationSec = def.duration ?? 10;
  const isToggle = def.toggle ?? false;
  
  newSummonBuffs = [
    ...filteredSummonBuffs,
    {
      id: def.id,
      name: def.name,
      icon: def.icon || "/skills/attack.jpg",
      stackType: def.stackType,
      effects: effList,
      expiresAt: isToggle ? Number.MAX_SAFE_INTEGER : now + finalDurationSec * 1000,
      startedAt: now,
      durationMs: isToggle ? undefined : durationSec * 1000,
      // Зберігаємо tick інформацію для toggle скілів
      ...(isToggle && (def.hpPerTick !== undefined || def.mpPerTick !== undefined)
        ? {
            hpPerTick: def.hpPerTick,
            mpPerTick: def.mpPerTick,
            tickInterval: def.tickInterval ?? 5,
            lastTickAt: now,
          }
        : {}),
    },
  ];
  
  if (import.meta.env.DEV) {
    console.log(`[SUMMON BUFF] Applied to summon:`, {
      skillName: def.name,
      skillId: def.id,
      summonName: state.summon.name,
      effects: effList,
      summonBuffsCount: newSummonBuffs.length,
    });
  }
  
  return { newSummonBuffs };
}

