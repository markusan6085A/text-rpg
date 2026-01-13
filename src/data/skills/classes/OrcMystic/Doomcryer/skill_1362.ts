import { SkillDefinition } from "../../../types";

// Chant of Spirit - buff skill that temporarily increases party members' resistance to buff cancel and de-buff attack
export const skill_1362: SkillDefinition = {
  id: 1362,
  code: "DC_1362",
  name: "Chant of Spirit",
  description: "Temporarily increases party members' resistance to buff cancel and de-buff attack. Effect 3.\n\nВременно увеличивает сопротивление членов группы к снятию бафов на 30% и к дебафам на 20%. Длительность: 20 мин.",
  icon: "/skills/skill1362.gif",
  category: "buff",
  powerType: "none",
  target: "party",
  scope: "area",
  castTime: 2.5,
  cooldown: 20,
  duration: 1200, // 20 minutes
  stackType: "chant_spirit", // Unique stackType - different levels replace each other
  effects: [
    { stat: "cancelResist", mode: "percent", value: 30 }, // 30% resistance to buff cancel
    { stat: "debuffResist", mode: "percent", value: 20 }, // 20% resistance to debuffs
  ],
  levels: [
    { level: 1, requiredLevel: 77, spCost: 20000000, mpCost: 280, power: 30 },
  ],
};

