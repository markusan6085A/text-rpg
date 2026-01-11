import { SkillDefinition } from "../../../types";

export const skill_1410: SkillDefinition = {
  id: 1410,
  code: "HM_1410",
  name: "Salvation",
  description: "Описание умения.",
  icon: "/skills/skill1410.gif",
  category: "buff",
  powerType: "none",
  target: "ally",
  scope: "single",
  castTime: 4,
  cooldown: 3600,
  duration: 1200,
  levels: [
    {
      level: 1,
      requiredLevel: 79,
      spCost: 60000000,
      mpCost: 86,
      power: 0,
    },
  ],
  effects: [
    {
      stat: "salvation",
      mode: "percent",
      value: 70,
    },
  ],
};

