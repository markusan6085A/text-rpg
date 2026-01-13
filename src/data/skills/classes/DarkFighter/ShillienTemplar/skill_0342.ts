import { SkillDefinition } from "../../../types";

// Touch of Death - casts a curse of dark magic to the enemy while sacrificing one's HP
export const skill_0342: SkillDefinition = {
  id: 342,
  code: "ST_0342",
  name: "Touch of Death",
  description: "Casts a curse of dark magic to the enemy while sacrificing one's HP. Cancels all the buff magic of the enemy. Significantly decreases maximum CP for a brief time period. Decreases resistance to debuff attack, and the effect of HP regeneration magic. Can be used while one's HP is 75% or below.\n\nНакладывает проклятие темной магии на врага, жертвуя своим HP. Отменяет все бафы врага. Значительно уменьшает максимальный CP на короткое время. Уменьшает сопротивление к дебафам и эффективность магии восстановления HP. Можно использовать при HP 75% или ниже.",
  icon: "/skills/skill0342.gif",
  category: "debuff",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 1.8,
  cooldown: 600,
  duration: 2, // Debuff duration
  chance: 40, // Success rate depends on CON stat
  hpCost: 1338, // HP cost (from description, XML shows 1004)
  hpThreshold: 0.75, // Can only be used when HP is 75% or below (0.75 = 75%)
  effects: [
    { stat: "maxCp", mode: "multiplier", multiplier: 0.1 }, // Reduces max CP to 10% (90% reduction)
    { stat: "debuffResist", mode: "multiplier", multiplier: 1.3 }, // Increases debuff vulnerability by 30%
    { stat: "hpRegen", mode: "multiplier", multiplier: 0.7 }, // Reduces HP regeneration by 30%
  ],
  levels: [
    { level: 1, requiredLevel: 78, spCost: 32000000, mpCost: 0, power: 90 },
  ],
};

