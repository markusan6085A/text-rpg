import { SkillDefinition } from "../../../types";

// Spoil - levels 5-11 (levels 1-4 are in common/Scavenger)
// XML: mpConsume: 38 44 50 55 59 63 67, magicLvl: 43 49 55 60 64 68 72
export const skill_0254: SkillDefinition = {
  id: 254,
  code: "BH_0254",
  name: "Spoil",
  description: "Imbues a monster with a magic that allows them to be susceptible to Sweeper.\n\nНаделяет монстра магией, делающей его уязвимым для Sweeper.",
  icon: "/skills/skill0254.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "single",
  castTime: 1.8,
  cooldown: 10,
  levels: [
    { level: 5, requiredLevel: 43, spCost: 46000, mpCost: 38, power: 0 },
    { level: 6, requiredLevel: 49, spCost: 110000, mpCost: 44, power: 0 },
    { level: 7, requiredLevel: 55, spCost: 250000, mpCost: 50, power: 0 },
    { level: 8, requiredLevel: 60, spCost: 410000, mpCost: 55, power: 0 },
    { level: 9, requiredLevel: 64, spCost: 600000, mpCost: 59, power: 0 },
    { level: 10, requiredLevel: 68, spCost: 870000, mpCost: 63, power: 0 },
    { level: 11, requiredLevel: 72, spCost: 1700000, mpCost: 67, power: 0 },
  ],
};

