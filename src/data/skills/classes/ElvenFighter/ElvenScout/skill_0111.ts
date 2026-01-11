import { SkillDefinition } from "../../../types";

// Ultimate Evasion - significantly increases Evasion
export const skill_0111: SkillDefinition = {
  id: 111,
  code: "ES_0111",
  name: "Ultimate Evasion",
  description: "Significantly increases Evasion. Effect 1.\n\nЗначительно увеличивает Evasion на 20 на 30 сек.",
  icon: "/skills/skill0111.gif",
  category: "buff",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 1,
  cooldown: 1800,
  duration: 30,
  effects: [
    { stat: "evasion", mode: "flat", value: 20 },
  ],
  levels: [
    { level: 1, requiredLevel: 28, spCost: 9200, mpCost: 25, power: 20 },
  ],
};

