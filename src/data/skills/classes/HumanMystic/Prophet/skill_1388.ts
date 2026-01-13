import { SkillDefinition } from "../../../types";

export const skill_1388: SkillDefinition = {
  id: 1388,
  code: "HM_1388",
  name: "Greater Might",
  description: "Temporarily increases your target's P. Atk. Consumes 1 Spirit Ore. Effect 1.\n\nВременно увеличивает физ. атаку цели. Потребляет 1 Spirit Ore.",
  icon: "/skills/skill1388.gif",
  category: "buff",
  powerType: "percent",
  target: "ally",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  duration: 1200,
  stackType: "might",
  stackOrder: 2,
  levels: [
    {
      level: 1,
      requiredLevel: 66,
      spCost: 700000,
      mpCost: 69,
      power: 4,
    },
    {
      level: 2,
      requiredLevel: 70,
      spCost: 1000000,
      mpCost: 69,
      power: 7,
    },
    {
      level: 3,
      requiredLevel: 74,
      spCost: 1700000,
      mpCost: 69,
      power: 10,
    },
  ],
  effects: [
    {
      stat: "pAtk",
      mode: "percent",
    },
  ],
};

