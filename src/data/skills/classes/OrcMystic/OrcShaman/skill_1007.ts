import { SkillDefinition } from "../../../types";

// Chant of Battle - buff skill (Level 2 for OrcShaman)
export const skill_1007: SkillDefinition = {
  id: 1007,
  code: "OS_1007",
  name: "Chant of Battle",
  description: "Temporarily increases party member's attack power. Effect 2.\n\nВременно увеличивает силу атаки членов группы на 12%.",
  icon: "/skills/skill1007.gif",
  category: "buff",
  powerType: "none",
  target: "party",
  scope: "party",
  castTime: 2.5,
  cooldown: 20,
  duration: 1200, // 20 minutes
  effects: [
    { stat: "pAtk", mode: "percent", value: 12 },
  ],
  levels: [
    { level: 2, requiredLevel: 25, spCost: 5800, mpCost: 88, power: 12 },
  ],
};

