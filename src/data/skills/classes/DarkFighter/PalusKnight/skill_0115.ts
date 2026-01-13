import { SkillDefinition } from "../../../types";

// Power Break - instantly reduces enemy's P. Atk
export const skill_0115: SkillDefinition = {
  id: 115,
  code: "PK_0115",
  name: "Power Break",
  description: "Instantly reduces enemy's P. Atk. Effect 2.\n\nМгновенно снижает физическую атаку врага. Эффект 2.",
  icon: "/skills/skill0115.gif",
  category: "debuff",
  powerType: "percent",
  target: "enemy",
  scope: "single",
  castTime: 1.2,
  cooldown: 8,
  duration: 10,
  chance: 80, // Success rate depends on WIT stat
  effects: [
    { stat: "pAtk", mode: "multiplier", multiplier: 0.8 }, // Reduces by 20%
  ],
  levels: [
    { level: 1, requiredLevel: 32, spCost: 22000, mpCost: 8, power: 0 },
    { level: 2, requiredLevel: 36, spCost: 28000, mpCost: 9, power: 0 },
  ],
};

