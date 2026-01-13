import { SkillDefinition } from "../../../types";

// Freezing Strike - instantly freezes target area, reduces enemy's Speed
export const skill_0105: SkillDefinition = {
  id: 105,
  code: "PK_0105",
  name: "Freezing Strike",
  description: "Instantly freezes target area. Temporarily reduces enemy's Speed. Effect 2. Power 26.\n\nМгновенно замораживает область цели. Временно снижает скорость врага. Эффект 2. Сила 26.",
  icon: "/skills/skill0105.gif",
  category: "magic_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 3,
  cooldown: 8,
  duration: 2, // Freeze duration
  chance: 60, // Success rate depends on WIT stat
  effects: [
    { stat: "runSpeed", mode: "multiplier", multiplier: 0.7 }, // Reduces speed by 30%
  ],
  levels: [
    { level: 1, requiredLevel: 36, spCost: 14000, mpCost: 15, power: 26 },
    { level: 2, requiredLevel: 36, spCost: 14000, mpCost: 17, power: 28 },
  ],
};

