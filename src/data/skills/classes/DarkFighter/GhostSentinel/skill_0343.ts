import { SkillDefinition } from "../../../types";

// Lethal Shot - shoots a potentially deadly arrow
export const skill_0343: SkillDefinition = {
  id: 343,
  code: "GS_0343",
  name: "Lethal Shot",
  description: "Shoots a potentially deadly arrow. Over-hit possible. Usable when one is equipped with a bow. Power 5132.\n\nСтреляет потенциально смертельной стрелой. Возможен оверхит. Требуется лук. Сила 5132. В PvE оставляет 1 HP, в PvP - 1 CP и 2% HP.",
  icon: "/skills/skill0343.gif",
  category: "physical_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 4,
  cooldown: 30,
  effects: [],
  levels: [
    { level: 1, requiredLevel: 76, spCost: 15000000, mpCost: 170, power: 5132 },
  ],
};

