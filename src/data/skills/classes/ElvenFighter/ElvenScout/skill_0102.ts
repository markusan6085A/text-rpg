import { SkillDefinition } from "../../../types";

// Entangle - temporarily reduces target's Speed
export const skill_0102: SkillDefinition = {
  id: 102,
  code: "ES_0102",
  name: "Entangle",
  description: "Temporarily reduces target's Speed. Effect 2.\n\nВременно уменьшает скорость передвижения цели на 30% на 2 сек. Шанс 80% (зависит от WIT цели).",
  icon: "/skills/skill0102.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "single",
  castTime: 3,
  cooldown: 7,
  duration: 2,
  chance: 80, // Success rate depends on WIT stat
  effects: [
    { stat: "runSpeed", mode: "multiplier", multiplier: 0.7 }, // Reduces speed by 30% (0.7 = 70% of original)
  ],
  levels: [
    { level: 1, requiredLevel: 36, spCost: 26000, mpCost: 17, power: 0 },
  ],
};

