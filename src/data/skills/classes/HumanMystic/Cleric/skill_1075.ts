import { SkillDefinition } from "../../../types";

export const skill_1075: SkillDefinition = {
  id: 1075,
  code: "HM_1075",
  name: "Peace",
  description: "Calms enemy.\n\nУспокаивает врага.",
  icon: "/skills/skill1075.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "single",
  castTime: 4,
  cooldown: 20,
  chance: 40,
  effects: [],
  levels: [{ level: 1, requiredLevel: 35, spCost: 21000, mpCost: 30, power: 30 }],
};

