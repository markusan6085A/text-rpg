import { SkillDefinition } from "../../../types";

// Spoil - makes monster susceptible to Sweeper
// XML: mpConsume: 12 19 25 31 38 44 50 55 59 63 67, magicLvl: 10 20 28 36 43 49 55 60 64 68 72
export const skill_0254: SkillDefinition = {
  id: 254,
  code: "DF_0254",
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
    { level: 1, requiredLevel: 10, spCost: 1100, mpCost: 12, power: 0 },
  ],
};

