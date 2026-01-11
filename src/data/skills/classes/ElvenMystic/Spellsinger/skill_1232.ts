import { SkillDefinition } from "../../../types";

// Freezing Skin - temporarily reflects damage back upon the enemy
export const skill_1232: SkillDefinition = {
  id: 1232,
  code: "ES_1232",
  name: "Freezing Skin",
  description: "Temporarily reflects damage back upon the enemy, excluding damage from skill or remote attack. Effect 1-3.\n\nВременно отражает 10-20% физических повреждений обратно на 20 сек.",
  icon: "/skills/skill1232.gif",
  category: "buff",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  duration: 20,
  effects: [
    { stat: "reflect", mode: "percent" }, // Value from level.power (10-20%)
  ],
  levels: [
    { level: 1, requiredLevel: 40, spCost: 28000, mpCost: 35, power: 10 },
    { level: 2, requiredLevel: 48, spCost: 60000, mpCost: 44, power: 15 },
    { level: 3, requiredLevel: 56, spCost: 95000, mpCost: 52, power: 20 },
  ],
};

