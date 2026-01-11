import { applyTickEffect, SkillTickEffect } from "./applySkillEffect";
import type { SkillApplyResult } from "./applySkillEffect";

export type ActiveTick = {
  tick: SkillTickEffect;
  elapsed: number;
  duration?: number; // seconds; optional for infinite toggles
};

export function addTick(activeTicks: ActiveTick[], tick: SkillTickEffect, duration?: number) {
  activeTicks.push({ tick, elapsed: 0, duration });
}

export function advanceTicks(activeTicks: ActiveTick[], deltaSeconds: number) {
  for (let i = activeTicks.length - 1; i >= 0; i -= 1) {
    const entry = activeTicks[i];
    entry.elapsed += deltaSeconds;

    while (entry.elapsed >= entry.tick.interval) {
      applyTickEffect(entry.tick);
      entry.elapsed -= entry.tick.interval;
      if (entry.duration !== undefined) {
        entry.duration -= entry.tick.interval;
        if (entry.duration <= 0) {
          activeTicks.splice(i, 1);
          break;
        }
      }
    }
  }
}

export function registerSkillTicks(
  activeTicks: ActiveTick[],
  result: SkillApplyResult | void
) {
  if (!result || !result.tick) return;
  addTick(activeTicks, result.tick, result.tickDuration);
}
