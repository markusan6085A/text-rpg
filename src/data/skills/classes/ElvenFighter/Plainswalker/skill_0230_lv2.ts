import { SkillDefinition } from "../../../types";

// Sprint - continuation (lv.2)
export const skill_0230_lv2: SkillDefinition = {
  id: 230,
  code: "PW_0230",
  name: "Sprint",
  description: "Temporarily increases Speed. Effect 2.\n\nВременно увеличивает скорость передвижения на 33 на 20 сек.",
  icon: "/skills/skill0230.gif",
  category: "buff",
  powerType: "flat",
  target: "self",
  scope: "single",
  castTime: 4,
  cooldown: 10,
  duration: 20,
  effects: [
    { stat: "runSpeed", mode: "flat", value: 33 },
  ],
  levels: [
    { level: 2, requiredLevel: 52, spCost: 120000, mpCost: 48, power: 33 },
  ],
};

