import { SkillDefinition } from "../../../types";

// Deflect Arrow - continuation from Elven Knight (lv.3-4)
export const skill_0112: SkillDefinition = {
  id: 112,
  code: "TK_0112",
  name: "Deflect Arrow",
  description: "Increases defense against bow attacks. Effect 3-4.\n\nУвеличивает защиту от атак из лука на 22-25% (зависит от уровня) на 20 мин.",
  icon: "/skills/skill0112.gif",
  category: "buff",
  powerType: "percent",
  target: "self",
  scope: "single",
  castTime: 1.5,
  cooldown: 10,
  duration: 1200, // 20 minutes
  effects: [
    { stat: "arrowDef", mode: "percent" }, // Value from level.power
  ],
  levels: [
    { level: 3, requiredLevel: 43, spCost: 35000, mpCost: 38, power: 22 },
    { level: 4, requiredLevel: 49, spCost: 82000, mpCost: 44, power: 25 },
  ],
};

