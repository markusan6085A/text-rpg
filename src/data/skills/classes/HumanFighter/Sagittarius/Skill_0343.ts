import { SkillDefinition } from "../../../types";

export const Skill_0343: SkillDefinition = {
  id: 343,
  code: "HF_0343",
  name: "Lethal Shot",
  description: "Shoots a potentially deadly arrow. Over-hit possible. Usable when one is equipped with a bow. Power 5132.\n\nВыстреливает потенциально смертельную стрелу. Возможен оверхит. Требуется экипированный лук.",
  icon: "/skills/skill0343.gif",
  category: "physical_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 4,
  cooldown: 30,
  levels: [
    { level: 1, requiredLevel: 76, spCost: 15000000, mpCost: 170, power: 5132 },
  ],
};

