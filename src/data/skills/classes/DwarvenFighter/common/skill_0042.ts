import { SkillDefinition } from "../../../types";

// Sweeper - used on spoiled corpses to get extra items
// XML: mpConsume: 3, magicLvl: 10, power: 80
export const skill_0042: SkillDefinition = {
  id: 42,
  code: "DF_0042",
  name: "Sweeper",
  description: "When used on corpses that have been affected by Spoil, extra items may be obtained.\n\nПри использовании на трупах, пораженных Spoil, можно получить дополнительные предметы.",
  icon: "/skills/skill0042.gif",
  category: "special",
  powerType: "none",
  target: "enemy", // Used on enemy corpses
  scope: "single",
  castTime: 0.5,
  cooldown: 0.5,
  levels: [
    { level: 1, requiredLevel: 10, spCost: 1100, mpCost: 3, power: 80 },
  ],
};

