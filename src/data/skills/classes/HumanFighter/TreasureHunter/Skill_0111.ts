import { SkillDefinition } from "../../../types";

export const Skill_0111: SkillDefinition = {
  id: 111,
  code: "HF_0111",
  name: "Ultimate Evasion",
  description: "Significantly increases Evasion. Effect 2.\n\nЗначительно увеличивает уклонение. Эффект 2.",
  icon: "/skills/skill0111.gif",
  category: "buff",
  powerType: "flat",
  target: "self",
  scope: "single",
  castTime: 1,
  cooldown: 1800,
  duration: 30,
  effects: [
    {
      stat: "evasion",
      mode: "flat",
      value: 25,
    },
  ],
  levels: [
    { level: 2, requiredLevel: 55, spCost: 170000, mpCost: 50, power: 25 },
  ],
};

