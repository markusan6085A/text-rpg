import { SkillDefinition } from "../../../types";

// Enlightenment
export const skill_1532: SkillDefinition = {
  id: 1532,
  code: "HM_1532",
  name: "Enlightenment",
  description: "Описание умения.",
  icon: "/skills/Skill1532_0.jpg",
  category: "buff",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 1.5,
  cooldown: 600,
  duration: 20,
  effects: [
    { stat: "mAtk", mode: "percent", value: 40 },
    { stat: "castSpeed", mode: "percent", value: 50 },
    { stat: "skillCritRate", mode: "percent", value: 50 },
    { stat: "mpRegen", mode: "percent", value: 90 },
  ],
  levels: [
    {
      level: 1,
      requiredLevel: 79,
      spCost: 32000000,
      mpCost: 73,
      power: 0,
    },
  ],
};

