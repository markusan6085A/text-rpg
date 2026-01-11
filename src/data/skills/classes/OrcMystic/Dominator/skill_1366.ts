import { SkillDefinition } from "../../../types";

// Seal of Despair - debuff skill that temporarily decreases nearby enemies' Speed, M. Def., Accuracy, P. Atk., Atk. Spd, and also the success rate and power of critical attack
export const skill_1366: SkillDefinition = {
  id: 1366,
  code: "DOM_1366",
  name: "Seal of Despair",
  description: "Temporarily decreases nearby enemies' Speed, M. Def., Accuracy, P. Atk., Atk. Spd, and also the success rate and power of critical attack.\n\nВременно уменьшает скорость, магическую защиту, точность, физическую атаку, скорость атаки ближайших врагов, а также шанс и силу критической атаки.",
  icon: "/skills/skill1366.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "area",
  castTime: 4,
  cooldown: 300, // 5 minutes (120000 ms = 120 seconds, but XML shows 120000 which is 2 minutes, but description says 300 seconds)
  duration: 30,
  chance: 40,
  stackType: "seal_despair", // Unique stackType - different Seal debuffs stack, but same Seal levels replace
  effects: [
    { stat: "accuracy", mode: "flat", value: -6 },
    { stat: "mDef", mode: "multiplier", multiplier: 0.7 }, // 30% reduction = 0.7 multiplier
    { stat: "pAtk", mode: "multiplier", multiplier: 0.9 }, // 10% reduction = 0.9 multiplier
    { stat: "atkSpeed", mode: "multiplier", multiplier: 0.7 }, // 30% reduction = 0.7 multiplier
    { stat: "critRate", mode: "flat", value: -30 }, // 30% reduction in crit rate
    { stat: "critDamage", mode: "multiplier", multiplier: 0.7 }, // 30% reduction = 0.7 multiplier
    { stat: "runSpeed", mode: "multiplier", multiplier: 0.8 }, // 20% reduction = 0.8 multiplier
  ],
  levels: [
    { level: 1, requiredLevel: 78, spCost: 32000000, mpCost: 107, power: 40 },
  ],
};

