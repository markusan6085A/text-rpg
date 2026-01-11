import { SkillDefinition } from "../../../types";

// Chant of Fire - buff skill that temporarily increases party member's magic resistance
export const skill_1006: SkillDefinition = {
  id: 1006,
  code: "OS_1006",
  name: "Chant of Fire",
  description: "Temporarily increases party member's magic resistance. Effect 1.\n\nВременно увеличивает магическое сопротивление членов группы на 15%.",
  icon: "/skills/skill1006.gif",
  category: "buff",
  powerType: "none",
  target: "party",
  scope: "party",
  castTime: 2.5,
  cooldown: 20,
  duration: 1200, // 20 minutes
  effects: [
    { stat: "mDef", mode: "percent", value: 15 },
  ],
  levels: [
    { level: 1, requiredLevel: 20, spCost: 2900, mpCost: 77, power: 15 },
  ],
};

