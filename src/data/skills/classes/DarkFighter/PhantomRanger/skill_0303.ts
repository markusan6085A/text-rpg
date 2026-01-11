import { SkillDefinition } from "../../../types";

// Soul of Sagittarius - temporarily increases maximum MP
export const skill_0303: SkillDefinition = {
  id: 303,
  code: "PR_0303",
  name: "Soul of Sagittarius",
  description: "Temporarily increases maximum MP.\n\nВременно увеличивает максимальный MP.",
  icon: "/skills/skill0303.gif",
  category: "buff",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  duration: 1200, // 20 minutes
  effects: [
    { stat: "maxMp", mode: "multiplier" }, // multiplier will be calculated from power (10% = 1.1, 15% = 1.15, 20% = 1.2, 25% = 1.25)
  ],
  levels: [
    { level: 1, requiredLevel: 46, spCost: 47000, mpCost: 0, power: 10, hpCost: 185 }, // Increases max MP by 10%
    { level: 2, requiredLevel: 58, spCost: 180000, mpCost: 0, power: 15, hpCost: 271 }, // Increases max MP by 15%
    { level: 3, requiredLevel: 64, spCost: 370000, mpCost: 0, power: 20, hpCost: 316 }, // Increases max MP by 20%
    { level: 4, requiredLevel: 70, spCost: 720000, mpCost: 0, power: 25, hpCost: 364 }, // Increases max MP by 25%
  ],
};

