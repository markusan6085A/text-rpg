import { SkillDefinition } from "../../../types";

// Spellcraft - 1 level from XML
// Reduces cast speed by 50% (multiplier 0.5) when NOT wearing Magic armor
export const skill_0163: SkillDefinition = {
  id: 163,
  code: "DM_0163",
  name: "Spellcraft",
  description: "Reduces spell casting speed when not wearing magic armor.\n\nСнижает скорость каста заклинаний при отсутствии магической брони.",
  icon: "/skills/Skill0163_0.jpg",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [{ stat: "castSpeed", mode: "multiplier", multiplier: 0.5 }], // 0.5 from XML when not using Magic armor
  levels: [
    { level: 1, requiredLevel: 1, spCost: 0, mpCost: 0, power: 0 },
  ],
};



