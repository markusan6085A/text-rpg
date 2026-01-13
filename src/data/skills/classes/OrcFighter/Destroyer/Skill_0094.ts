import { SkillDefinition } from "../../../types";

export const Skill_0094: SkillDefinition = {
  id: 94,
  code: "OR_0094",
  name: "Rage",
  description: "Temporarily reduces Evasion and P. Def. and increases P. Atk significantly. Effect 2.\n\nВременно снижает уклонение и физ. защиту на 20% и значительно увеличивает физ. атаку на 55%.",
  icon: "/skills/skill0094.gif",
  category: "buff",
  powerType: "percent",
  target: "self",
  scope: "single",
  castTime: 1.5,
  cooldown: 300,
  duration: 90,
  effects: [
    { stat: "evasion", mode: "flat", value: -3 },
    { stat: "pDef", mode: "percent", value: -20 },
    { stat: "pAtk", mode: "percent", value: 55 },
  ],
  levels: [
    { level: 2, requiredLevel: 55, spCost: 180000, mpCost: 25, power: 55 },
  ],
};

