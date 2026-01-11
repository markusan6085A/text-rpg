import { SkillDefinition } from "../../../types";

// Chant of Storm Guard - buff skill that temporarily increases party members' water resistance
// WC_RESIST: заміна Wind (lvl 68)
export const skill_1307: SkillDefinition = {
  id: 1307,
  code: "WC_1307",
  name: "Chant of Storm Guard",
  description: "Temporarily increases party members' resistance to water attacks. Effect 1.\n\nВременно увеличивает сопротивление к воде членов группы на 20.",
  icon: "/skills/skill1307.gif",
  category: "buff",
  powerType: "none",
  target: "party",
  scope: "party",
  castTime: 2.5,
  cooldown: 70, // 70s згідно зі специфікацією
  duration: 60, // 60s згідно зі специфікацією
  buffGroup: "WC_RESIST", // WC_RESIST група - замінює інші WC_RESIST бафи
  stackType: "chant_storm_guard", // Unique stackType - different levels replace each other
  effects: [
    { stat: "waterResist", mode: "flat", value: 20 }, // 20 згідно зі специфікацією
  ],
  levels: [
    { level: 1, requiredLevel: 68, spCost: 550000, mpCost: 252, power: 20 },
  ],
};

