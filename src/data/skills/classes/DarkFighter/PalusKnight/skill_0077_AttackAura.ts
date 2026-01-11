import { SkillDefinition } from "../../../types";

// Attack Aura lv.2 - temporarily increases P. Atk
export const skill_0077_AttackAura: SkillDefinition = {
  id: 77,
  code: "PK_0077",
  name: "Attack Aura",
  description: "Temporarily increases P. Atk. Effect 2.\n\nВременно увеличивает физическую атаку. Эффект 2.",
  icon: "/skills/skill0077.gif",
  category: "buff",
  powerType: "percent",
  target: "self",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  duration: 1200, // 20 minutes
  stackType: "pAtk",
  effects: [
    { stat: "pAtk", mode: "multiplier", multiplier: 1.12 },
  ],
  levels: [
    { level: 2, requiredLevel: 28, spCost: 13000, mpCost: 25, power: 0 },
  ],
};

