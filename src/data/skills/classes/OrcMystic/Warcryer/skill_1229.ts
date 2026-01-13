import { SkillDefinition } from "../../../types";

// Chant of Life - buff skill that enhances party members' HP regeneration significantly
// WC_DEF: замінює Endurance (lvl 25)
export const skill_1229: SkillDefinition = {
  id: 1229,
  code: "WC_1229",
  name: "Chant of Life",
  description: "Enhances party members' HP regeneration significantly. Effect 5-18.\n\nЗначительно увеличивает регенерацию HP членов группы (27-58 HP каждую секунду).",
  icon: "/skills/skill1229.gif",
  category: "buff",
  powerType: "none",
  target: "party",
  scope: "party",
  castTime: 7,
  cooldown: 50, // 50s згідно зі специфікацією
  duration: 40, // 40s згідно зі специфікацією
  buffGroup: "WC_DEF", // WC_DEF група - замінює інші WC_DEF бафи
  stackType: "chant_life", // Unique stackType - different levels replace each other
  effects: [
    { stat: "hpRegen", mode: "percent", value: 20 }, // 20% згідно зі специфікацією (але в XML є flat значення)
  ],
  levels: [
    { level: 5, requiredLevel: 25, spCost: 12000, mpCost: 50, power: 20 }, // lvl 25 згідно зі специфікацією
    { level: 6, requiredLevel: 44, spCost: 37000, mpCost: 134, power: 31 },
    { level: 7, requiredLevel: 48, spCost: 63000, mpCost: 152, power: 35 },
    { level: 8, requiredLevel: 52, spCost: 95000, mpCost: 164, power: 39 },
    { level: 9, requiredLevel: 56, spCost: 110000, mpCost: 180, power: 43 },
    { level: 10, requiredLevel: 58, spCost: 160000, mpCost: 189, power: 45 },
    { level: 11, requiredLevel: 60, spCost: 200000, mpCost: 195, power: 46 },
    { level: 12, requiredLevel: 62, spCost: 310000, mpCost: 199, power: 48 },
    { level: 13, requiredLevel: 64, spCost: 320000, mpCost: 207, power: 50 },
    { level: 14, requiredLevel: 66, spCost: 500000, mpCost: 214, power: 52 },
    { level: 15, requiredLevel: 68, spCost: 550000, mpCost: 222, power: 53 },
    { level: 16, requiredLevel: 70, spCost: 720000, mpCost: 228, power: 55 },
    { level: 17, requiredLevel: 72, spCost: 1100000, mpCost: 233, power: 56 },
    { level: 18, requiredLevel: 74, spCost: 1500000, mpCost: 239, power: 58 },
  ],
};

