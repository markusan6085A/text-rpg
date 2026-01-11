import { SkillDefinition } from "../../../types";

// Magician's Movement - 1 level from XML
// Reduces attack speed by 20% (multiplier 0.8) when NOT wearing Magic armor
export const skill_0118: SkillDefinition = {
  id: 118,
  code: "DM_0118",
  name: "Magician's Movement",
  description: "Reduces attack speed when not wearing magic armor.\n\nСнижает скорость атаки на 20% при отсутствии магической брони.",
  icon: "/skills/Skill0118_0.jpg",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "attackSpeed", mode: "multiplier", multiplier: 0.8 }, // 0.8 from XML when not using Magic armor
  ],
  levels: [
    { level: 1, requiredLevel: 1, spCost: 0, mpCost: 0, power: 0 },
  ],
};



