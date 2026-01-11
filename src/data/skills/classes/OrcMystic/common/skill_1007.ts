import { SkillDefinition } from "../../../types";

// Chant of Battle - buff skill that temporarily increases party member's attack power
export const skill_1007: SkillDefinition = {
  id: 1007,
  code: "OM_1007",
  name: "Chant of Battle",
  description: "Temporarily increases party member's attack power. Effect 1.\n\nВременно увеличивает силу атаки членов группы на 8%.",
  icon: "/skills/skill1007.gif",
  category: "buff",
  powerType: "none",
  target: "party",
  scope: "party",
  castTime: 2.5,
  cooldown: 20,
  duration: 1200, // 20 minutes
  effects: [
    { stat: "pAtk", mode: "percent", value: 8 },
  ],
  levels: [
    { level: 1, requiredLevel: 14, spCost: 1800, mpCost: 60, power: 8 },
  ],
};

