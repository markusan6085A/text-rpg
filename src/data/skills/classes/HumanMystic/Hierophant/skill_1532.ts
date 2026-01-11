import { SkillDefinition } from "../../../types";

export const skill_1532: SkillDefinition = {
  id: 1532,
  code: "HM_1532",
  name: "Enlightenment",
  description: "Temporarily increases magic attack, HP regeneration, casting speed, skill critical rate, and MP regeneration.\n\nВременно увеличивает магическую атаку, восстановление HP, скорость каста, шанс критического скіла и восстановление MP.",
  category: "buff",
  powerType: "percent",
  icon: "/skills/Skill1532_0.jpg",
  target: "self",
  duration: 20,
  castTime: 1.5,
  cooldown: 150,
  effects: [
    { stat: "mAtk", mode: "percent", value: 10 },
    { stat: "hpRegen", mode: "percent", value: 40 },
    { stat: "castSpeed", mode: "percent", value: 50 },
    { stat: "skillCritRate", mode: "percent", value: 50 },
    { stat: "mpRegen", mode: "percent", value: 90 },
  ],
  levels: [
    { level: 1, requiredLevel: 80, spCost: 32000000, mpCost: 73, power: 1.5 },
  ],
};

