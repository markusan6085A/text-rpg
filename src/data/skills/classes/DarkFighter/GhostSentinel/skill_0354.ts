import { SkillDefinition } from "../../../types";

// Hamstring Shot - inflicts damage and slows enemy's speed
export const skill_0354: SkillDefinition = {
  id: 354,
  code: "GS_0354",
  name: "Hamstring Shot",
  description: "Inflicts damage to a targeted enemy and slows the enemy's speed at the same time. Critical attack is possible. Available when one is equipped with a bow. Power 1973. Effect 3.\n\nНаносит урон цели и одновременно замедляет скорость врага на 50%. Возможен критический удар. Требуется лук. Сила 1973. Длительность 2 сек, шанс 40%.",
  icon: "/skills/skill0354.gif",
  category: "physical_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 4,
  cooldown: 60,
  duration: 2, // Slow duration
  chance: 40, // Success rate depends on WIT stat
  effects: [
    { stat: "runSpeed", mode: "multiplier", multiplier: 0.5 }, // Reduces speed by 50%
  ],
  levels: [
    { level: 1, requiredLevel: 77, spCost: 20000000, mpCost: 129, power: 1973 },
  ],
};

