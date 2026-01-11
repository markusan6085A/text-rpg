import { SkillDefinition } from "../../../types";

export const skill_1069: SkillDefinition = {
  id: 1069,
  code: "HM_1069",
  name: "Sleep",
  description: "Instantly puts target to sleep. If cast on a sleeping target, the spell has no effect.\n\nМгновенно усыпляет цель. Если применено к спящей цели, заклинание не имеет эффекта.",
  icon: "/skills/skill1069.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "single",
  castTime: 2.5,
  cooldown: 6,
  duration: 30,
  chance: 80,
  stackType: "sleep",
  stackOrder: 1,
  effects: [{ stat: "sleep", mode: "flat", value: 1 }],
  levels: [
    { level: 1, requiredLevel: 25, spCost: 2300, mpCost: 22, power: 80 },
    { level: 2, requiredLevel: 25, spCost: 2300, mpCost: 22, power: 80 },
    { level: 3, requiredLevel: 25, spCost: 2300, mpCost: 23, power: 80 },
    { level: 4, requiredLevel: 30, spCost: 4400, mpCost: 25, power: 80 },
    { level: 5, requiredLevel: 30, spCost: 4400, mpCost: 27, power: 80 },
    { level: 6, requiredLevel: 30, spCost: 4400, mpCost: 27, power: 80 },
    { level: 7, requiredLevel: 35, spCost: 7300, mpCost: 29, power: 80 },
    { level: 8, requiredLevel: 35, spCost: 7300, mpCost: 30, power: 80 },
    { level: 9, requiredLevel: 35, spCost: 7300, mpCost: 30, power: 80 },
  ],
};

