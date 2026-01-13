import { SkillDefinition } from "../../../types";

export const Skill_0354: SkillDefinition = {
  id: 354,
  code: "HF_0354",
  name: "Hamstring Shot",
  description: "Inflicts damage to a targeted enemy and slows the enemy's speed at the same time. Critical attack is possible. Available when one is equipped with a bow. Power 1973. Effect 3.\n\nНаносит урон цели и замедляет скорость врага. Возможен критический удар. Требуется экипированный лук.",
  icon: "/skills/skill0354.gif",
  category: "physical_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 4,
  cooldown: 60,
  effects: [
    {
      "stat": "runSpeed",
      "mode": "multiplier",
      "value": 0.5,
      "duration": 30,
      "chance": 40
    }
  ],
  levels: [
    { level: 1, requiredLevel: 77, spCost: 20000000, mpCost: 86, power: 1973 },
  ],
};

