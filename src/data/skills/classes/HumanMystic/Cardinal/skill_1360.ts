import { SkillDefinition } from "../../../types";

export const skill_1360: SkillDefinition = {
  id: 1360,
  code: "HM_1360",
  name: "Mass Block Shield",
  description: "Decreases P. Def. of enemies in area.\n\nСнижает физ. защиту врагов в области.",
  icon: "/skills/skill1360.gif",
  category: "debuff",
  powerType: "percent",
  target: "enemy",
  scope: "area",
  castTime: 4,
  cooldown: 120,
  duration: 120,
  chance: 40,
  effects: [{ stat: "pDef", mode: "percent", value: -10 }],
  stackType: "mass_block_shield",
  stackOrder: 1,
  levels: [
    {
      level: 1,
      requiredLevel: 77,
      spCost: 13000000,
      mpCost: 105,
      power: 0,
    },
  ],
};

