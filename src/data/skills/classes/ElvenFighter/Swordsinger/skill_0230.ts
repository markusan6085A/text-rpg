import { SkillDefinition } from "../../../types";

// Sprint - temporarily increases Speed (continuation, lv.2)
export const skill_0230: SkillDefinition = {
  id: 230,
  code: "SS_0230",
  name: "Sprint",
  description: "Temporarily increases Speed. Effect 2.\n\nВременно увеличивает скорость передвижения на 33 на 20 мин.",
  icon: "/skills/skill0230.gif",
  category: "buff",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 4,
  cooldown: 10,
  duration: 1200, // 20 minutes
  effects: [
    { stat: "runSpeed", mode: "flat", value: 33 },
  ],
  levels: [
    { level: 2, requiredLevel: 52, spCost: 210000, mpCost: 48, power: 0 },
  ],
};

