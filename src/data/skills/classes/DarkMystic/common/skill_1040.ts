import { SkillDefinition } from "../../../types";

// Shield - 3 levels from XML
// rate: 1.08, 1.12, 1.15 (multipliers for pDef)
// mpConsume: 8, 18, 31
export const skill_1040: SkillDefinition = {
  id: 1040,
  code: "DM_1040",
  name: "Shield",
  description: "Temporarily increases P. Def.\n\nВременно увеличивает физ. защиту.",
  icon: "/skills/Skill1040_0.jpg",
  category: "buff",
  powerType: "none",
  target: "ally",
  scope: "single",
  duration: 1200,
  castTime: 4,
  cooldown: 6,
  effects: [{ stat: "pDef", mode: "multiplier" }], // Value from level.power (rate)
  levels: [
    { level: 1, requiredLevel: 7, spCost: 470, mpCost: 8, power: 1.08 },
    { level: 2, requiredLevel: 20, spCost: 3000, mpCost: 18, power: 1.12 },
    { level: 3, requiredLevel: 40, spCost: 15000, mpCost: 31, power: 1.15 },
  ],
};



