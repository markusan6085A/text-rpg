import type { BattleBuff } from "../types";
import type { SkillDefinition } from "../../../data/skills/types";

/** Маркер для «пустих» дебафів лише для UI (круговий таймер над мобом). Без ефектів у stats. */
export const MOB_STUN_VISUAL_STACK = "MOB_STUN_VISUAL";

export function createMobStunVisualBuff(
  def: SkillDefinition,
  now: number,
  expiresAt: number,
  durationMs: number
): BattleBuff {
  return {
    id: def.id,
    name: def.name,
    icon: def.icon || "/skills/attack.jpg",
    stackType: MOB_STUN_VISUAL_STACK,
    effects: [],
    expiresAt,
    startedAt: now,
    durationMs,
    source: "skill",
  };
}

/** Замінює попередній візуальний stun того ж скіла (оверлап по часу). `mobBuffs` вже має бути очищений від прострочених. */
export function mergeMobStunVisualIntoMobBuffs(
  mobBuffs: BattleBuff[],
  visual: BattleBuff
): BattleBuff[] {
  const without = mobBuffs.filter(
    (b) => !(b.stackType === MOB_STUN_VISUAL_STACK && b.id === visual.id)
  );
  return [visual, ...without];
}
