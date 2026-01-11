import { SkillDefinition } from "../../../types";

export const Skill_0193: SkillDefinition = {
  id: 193,
  code: "HF_0193",
  name: "Critical Power",
  description: "Increases the power of a critical attack.\n\nУвеличивает силу критического удара.",
  icon: "/skills/skill0193.gif",
  category: "passive",
  powerType: "flat",
  target: "self",
  scope: "single",
  effects: [
    {
      stat: "critDamage",
      mode: "flat",
    },
  ],
  levels: [
    { level: 3, requiredLevel: 40, spCost: 0, mpCost: 0, power: 93 },
    { level: 4, requiredLevel: 52, spCost: 0, mpCost: 0, power: 177 },
    { level: 5, requiredLevel: 64, spCost: 0, mpCost: 0, power: 295 },
    { level: 6, requiredLevel: 72, spCost: 0, mpCost: 0, power: 384 },
  ],
};

