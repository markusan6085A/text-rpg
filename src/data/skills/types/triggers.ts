import type { SkillEffectModifier } from "./modifiers";
import type { SkillScope, SkillTarget } from "./targets";

export type SkillTriggerEvent = "onDamageTaken" | "onHit" | "onCrit";

export type SkillTrigger = {
  event: SkillTriggerEvent;
  effects: SkillEffectModifier[];
  duration?: number; // seconds; optional timing for external systems
  target?: SkillTarget; // defaults to self
  scope?: SkillScope; // defaults to single
};
