import { SkillDefinition } from "../../../types";

// Lethal Shot - shoots a potentially deadly arrow
export const skill_0343: SkillDefinition = {
  id: 343,
  code: "MS_0343",
  name: "Lethal Shot",
  description: "Shoots a potentially deadly arrow. Over-hit possible. Usable when one is equipped with a bow.\n\nВыстреливает потенциально смертельную стрелу. Сила 5132. Возможен оверхит. Требуется экипированный лук. В PvE оставляет 1 HP, в PvP - 1 CP и дополнительно 2%.",
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

