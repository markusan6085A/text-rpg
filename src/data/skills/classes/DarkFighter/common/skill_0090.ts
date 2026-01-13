import { SkillDefinition } from "../../../types";

// Attack Aura - temporarily increases P. Atk
export const skill_0077: SkillDefinition = {
  id: 77,
  code: "DKF_0077",
  name: "Attack Aura",
  description: "Temporarily increases P. Atk.\n\nВременно увеличивает физическую атаку.",
  icon: "/skills/skill0090.gif",
  category: "buff",
  powerType: "percent",
  target: "self",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  duration: 1200, // 20 minutes
  stackType: "pAtk",
  effects: [
    { stat: "pAtk", mode: "multiplier", multiplier: 1.08 },
  ],
  levels: [
    { level: 1, requiredLevel: 10, spCost: 910, mpCost: 13, power: 0 },
  ],
};

