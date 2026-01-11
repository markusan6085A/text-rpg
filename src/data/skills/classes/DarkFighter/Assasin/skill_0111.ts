import { SkillDefinition } from "../../../types";

// Ultimate Evasion - significantly increases Evasion
export const skill_0111: SkillDefinition = {
  id: 111,
  code: "AS_0111",
  name: "Ultimate Evasion",
  description: "Significantly increases Evasion. Effect 1.\n\nЗначительно увеличивает уклонение на 20.",
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
    { level: 1, requiredLevel: 28, spCost: 8500, mpCost: 25, power: 20 }, // Increases Evasion by 20
  ],
};

