import { SkillDefinition } from "../../../types";

// Warrior Bane - Removes buffs that increase Atk. Spd. and Speed from an enemy
export const skill_1350: SkillDefinition = {
  id: 1350,
  code: "EM_1350",
  name: "Warrior Bane",
  description: "Removes buffs that increase Atk. Spd. and Speed from an enemy.\n\nУдаляет бафы, увеличивающие скорость атаки и скорость передвижения, с выбранного врага. Вероятность снятия: 80%.",
  category: "debuff",
  powerType: "none",
  icon: "/skills/skill1350.gif",
  target: "enemy",
  scope: "single",
  castTime: 4,
  cooldown: 10,
  chance: 80,
  levels: [
    { level: 1, requiredLevel: 76, spCost: 15000000, mpCost: 70, power: 0 },
  ],
};

