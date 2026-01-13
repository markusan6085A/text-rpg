import { SkillDefinition } from "../../../types";

// Chant of Flame Guard - buff skill that temporarily increases party members' fire resistance
// WC_RESIST: макс 1 WC_RESIST активний (lvl 30)
export const skill_1306: SkillDefinition = {
  id: 1306,
  code: "WC_1306",
  name: "Chant of Flame Guard",
  description: "Temporarily increases party members' resistance to fire attacks. Effect 1.\n\nВременно увеличивает сопротивление к огню членов группы на 20.",
  icon: "/skills/skill1306.gif",
  category: "buff",
  powerType: "none",
  target: "party",
  scope: "party",
  castTime: 2.5,
  cooldown: 60, // 60s згідно зі специфікацією
  duration: 45, // 45s згідно зі специфікацією
  buffGroup: "WC_RESIST", // WC_RESIST група - замінює інші WC_RESIST бафи
  stackType: "chant_flame_guard", // Unique stackType - different levels replace each other
  effects: [
    { stat: "fireResist", mode: "flat", value: 20 }, // 20 згідно зі специфікацією
  ],
  levels: [
    { level: 1, requiredLevel: 30, spCost: 15000, mpCost: 60, power: 20 },
  ],
};

