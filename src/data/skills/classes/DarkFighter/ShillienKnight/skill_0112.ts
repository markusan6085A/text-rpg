import { SkillDefinition } from "../../../types";

// Deflect Arrow - increases defense against bow attacks (continuation from Palus Knight)
export const skill_0112: SkillDefinition = {
  id: 112,
  code: "SK_0112",
  name: "Deflect Arrow",
  description: "Increases defense against bow attacks.\n\nУвеличивает защиту от атак из лука.",
  icon: "/skills/skill0112.gif",
  category: "buff",
  powerType: "percent",
  target: "self",
  scope: "single",
  castTime: 1.5,
  cooldown: 10,
  duration: 20,
  effects: [
    { stat: "arrowDef", mode: "percent" }, // Value from level.power
  ],
  levels: [
    { level: 3, requiredLevel: 43, spCost: 32000, mpCost: 38, power: 22 },
    { level: 4, requiredLevel: 49, spCost: 58000, mpCost: 44, power: 25 },
  ],
};

