import { SkillDefinition } from "../../../types";

// Chant of Wind - buff skill that temporarily increases party members' wind resistance
// WC_RESIST: заміна Flame Guard (lvl 52)
export const skill_1268: SkillDefinition = {
  id: 1268,
  code: "WC_1268",
  name: "Chant of Wind",
  description: "Temporarily increases party members' resistance to wind attacks. Effect 1.\n\nВременно увеличивает сопротивление к ветру членов группы на 20.",
  icon: "/skills/skill1268.gif",
  category: "buff",
  powerType: "none",
  target: "party",
  scope: "party",
  castTime: 2.5,
  cooldown: 70, // 70s згідно зі специфікацією
  duration: 60, // 60s згідно зі специфікацією
  buffGroup: "WC_RESIST", // WC_RESIST група - замінює інші WC_RESIST бафи
  stackType: "chant_wind", // Unique stackType - different levels replace each other
  effects: [
    { stat: "windResist", mode: "flat", value: 20 }, // 20 згідно зі специфікацією
  ],
  levels: [
    { level: 1, requiredLevel: 52, spCost: 95000, mpCost: 188, power: 20 },
  ],
};

