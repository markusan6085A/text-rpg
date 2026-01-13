import { SkillDefinition } from "../../../types";

// Entangle - temporarily reduces target's Speed
export const skill_0102: SkillDefinition = {
  id: 102,
  code: "EK_0102",
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
  chance: 80,
  effects: [
    { stat: "runSpeed", mode: "percent", value: -30 },
  ],
  levels: [
    { level: 1, requiredLevel: 36, spCost: 39000, mpCost: 17, power: 0 },
  ],
};

