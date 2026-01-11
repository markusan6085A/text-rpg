import { SkillDefinition } from "../../../types";

// Ultimate Evasion - continuation (lv.2)
export const skill_0111_lv2: SkillDefinition = {
  id: 111,
  code: "PW_0111",
  name: "Ultimate Evasion",
  description: "Significantly increases Evasion. Effect 2.\n\nЗначительно увеличивает Evasion на 25 на 30 сек.",
  icon: "/skills/skill0111.gif",
  category: "buff",
  powerType: "flat",
  target: "self",
  scope: "single",
  castTime: 1,
  cooldown: 1800,
  duration: 30,
  effects: [
    { stat: "evasion", mode: "flat", value: 25 },
  ],
  levels: [
    { level: 2, requiredLevel: 55, spCost: 160000, mpCost: 50, power: 25 },
  ],
};

