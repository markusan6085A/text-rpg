import { SkillDefinition } from "../../../types";

// Sleep
export const skill_1069: SkillDefinition = {
  id: 1069,
  code: "HM_1069",
  name: "Sleep",
  description: "Instantly puts target to sleep. If cast on a sleeping target, the spell has no effect.\n\nМгновенно усыпляет цель. Если применено на спящую цель, заклинание не действует.",
  icon: "/skills/skill1069.gif",
  category: "magic_attack",
  powerType: "flat",
  target: "enemy",
  scope: "single",
  castTime: 2.5,
  cooldown: 6,
  effects: [{ stat: "sleepResist", mode: "multiplier", multiplier: 0 }], // Effectively puts to sleep
  levels: [
    { level: 1, requiredLevel: 25, spCost: 1800, mpCost: 22, power: 80 },
    { level: 2, requiredLevel: 25, spCost: 1800, mpCost: 22, power: 80 },
    { level: 3, requiredLevel: 25, spCost: 1800, mpCost: 23, power: 80 },
    { level: 4, requiredLevel: 30, spCost: 3500, mpCost: 25, power: 80 },
    { level: 5, requiredLevel: 30, spCost: 3500, mpCost: 27, power: 80 },
    { level: 6, requiredLevel: 30, spCost: 3500, mpCost: 27, power: 80 },
    { level: 7, requiredLevel: 35, spCost: 5900, mpCost: 29, power: 80 },
    { level: 8, requiredLevel: 35, spCost: 5900, mpCost: 30, power: 80 },
    { level: 9, requiredLevel: 35, spCost: 5900, mpCost: 30, power: 80 },
  ],
};
