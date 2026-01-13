import { SkillDefinition } from "../../../types";

// Spoil - levels 2-4 (level 1 is in common)
// XML: mpConsume: 19 25 31, magicLvl: 20 28 36
export const skill_0254: SkillDefinition = {
  id: 254,
  code: "SC_0254",
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
    { level: 2, requiredLevel: 20, spCost: 4100, mpCost: 19, power: 0 },
    { level: 3, requiredLevel: 28, spCost: 13000, mpCost: 25, power: 0 },
    { level: 4, requiredLevel: 36, spCost: 35000, mpCost: 31, power: 0 },
  ],
};

