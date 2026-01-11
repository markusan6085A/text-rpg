import { SkillDefinition } from "../../../types";

// Might - 3 levels from XML
// rate: 1.08, 1.12, 1.15 (multipliers for pAtk)
// mpConsume: 8, 16, 28
export const skill_1068: SkillDefinition = {
  id: 1068,
  code: "DM_1068",
  name: "Might",
  description: "Temporarily increases P. Atk.\n\nВременно увеличивает физ. атаку.",
  icon: "/skills/Skill1068_0.jpg",
  category: "buff",
  powerType: "none",
  target: "ally",
  scope: "single",
  duration: 1200,
  castTime: 4,
  cooldown: 6,
  effects: [{ stat: "pAtk", mode: "multiplier" }], // Value from level.power (rate)
  levels: [
    { level: 1, requiredLevel: 7, spCost: 470, mpCost: 8, power: 1.08 },
    { level: 2, requiredLevel: 20, spCost: 3000, mpCost: 16, power: 1.12 },
    { level: 3, requiredLevel: 40, spCost: 15000, mpCost: 28, power: 1.15 },
  ],
};



