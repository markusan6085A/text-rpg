import type { SkillDefinition } from "../../../types";

export const skill_1044: SkillDefinition = {
  id: 1044,
  code: "HM_1044",
  name: "Regeneration",
  description:
    "Temporarily increases HP recovery for the caster and allies. Effect 2: HP regen +15%.\n\nВременно увеличивает восстановление HP для кастера и союзников. Эффект 2: восстановление HP +15%.",
  icon: "/skills/skill1044.gif",
  category: "buff",
  powerType: "percent",
  target: "ally",
  scope: "single",
  duration: 1200,
  castTime: 4,
  cooldown: 6,
  effects: [{ stat: "hpRegen", mode: "percent", value: 15 }],
  stackType: "regeneration",
  stackOrder: 1,
  levels: [
    { level: 1, requiredLevel: 20, spCost: 6900, mpCost: 0, power: 1.1 },
    { level: 2, requiredLevel: 25, spCost: 13700, mpCost: 0, power: 1.15 },
  ],
};

