import { SkillDefinition } from "../../../types";

// Evade Shot - inflicts damage and increases evasion (self buff)
export const skill_0369: SkillDefinition = {
  id: 369,
  code: "GS_0369",
  name: "Evade Shot",
  description: "Inflicts damage to the enemy and instantly increases one's evasion significantly. Usable when one is equipped with a bow. Over-hit possible. Power 2020.\n\nНаносит урон врагу и мгновенно значительно увеличивает уклонение на 6. Требуется лук. Возможен оверхит. Сила 2020. Длительность 30 сек.",
  icon: "/skills/skill0369.gif",
  category: "physical_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 4,
  cooldown: 300,
  duration: 30, // Evasion buff duration (applied to self)
  effects: [
    { stat: "evasion", mode: "flat", value: 6 }, // Increases evasion by 6 (self buff)
  ],
  levels: [
    { level: 1, requiredLevel: 78, spCost: 32000000, mpCost: 130, power: 2020 },
  ],
};

