import { SkillDefinition } from "../../../types";

// Evade Shot - inflicts damage and increases evasion significantly
export const skill_0369: SkillDefinition = {
  id: 369,
  code: "MS_0369",
  name: "Evade Shot",
  description: "Inflicts damage to the enemy and instantly increases one's evasion significantly. Usable when one is equipped with a bow. Over-hit possible.\n\nНаносит урон врагу и мгновенно значительно увеличивает Evasion на 6 на 30 сек. Сила 2020. Возможен оверхит. Требуется экипированный лук.",
  icon: "/skills/skill0369.gif",
  category: "physical_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 4,
  cooldown: 300,
  duration: 30,
  effects: [
    {
      stat: "evasion",
      mode: "flat",
      value: 6,
      duration: 30,
    },
  ],
  levels: [
    { level: 1, requiredLevel: 78, spCost: 32000000, mpCost: 130, power: 2020 },
  ],
};

