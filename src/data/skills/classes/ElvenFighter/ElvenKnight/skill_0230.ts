import { SkillDefinition } from "../../../types";

// Sprint - temporarily increases Speed
export const skill_0230: SkillDefinition = {
  id: 230,
  code: "EK_0230",
  name: "Sprint",
  description: "Temporarily increases Speed. Effect 1.\n\nВременно увеличивает скорость передвижения на 20 на 20 мин.",
  icon: "/skills/skill0230.gif",
  category: "buff",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 4,
  cooldown: 10,
  duration: 1200, // 20 minutes
  effects: [
    { stat: "runSpeed", mode: "flat", value: 20 },
  ],
  levels: [
    { level: 1, requiredLevel: 32, spCost: 25000, mpCost: 28, power: 0 },
  ],
};

