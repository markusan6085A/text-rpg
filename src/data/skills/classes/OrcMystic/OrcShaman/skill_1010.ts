import { SkillDefinition } from "../../../types";

// Soul Shield - buff skill (Levels 2-3 for OrcShaman)
export const skill_1010: SkillDefinition = {
  id: 1010,
  code: "OS_1010",
  name: "Soul Shield",
  description: "Temporarily increases defense. Effect 2-3.\n\nВременно увеличивает защиту на 12-15%.",
  icon: "/skills/skill1010.gif",
  category: "buff",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 2.5,
  cooldown: 5,
  duration: 1200, // 20 minutes
  effects: [
    { stat: "pDef", mode: "percent", value: 12 },
  ],
  levels: [
    { level: 2, requiredLevel: 25, spCost: 5800, mpCost: 23, power: 12 },
    { level: 3, requiredLevel: 35, spCost: 18000, mpCost: 30, power: 15 },
  ],
};

