import { SkillDefinition } from "../../../types";

// Deflect Arrow - increases defense against bow attacks
export const skill_0112: SkillDefinition = {
  id: 112,
  code: "PK_0112",
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
    { level: 1, requiredLevel: 24, spCost: 8800, mpCost: 22, power: 16 },
    { level: 2, requiredLevel: 32, spCost: 22000, mpCost: 28, power: 19 },
  ],
};

