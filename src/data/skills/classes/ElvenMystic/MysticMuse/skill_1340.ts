import { SkillDefinition } from "../../../types";

// Ice Vortex - creates a vortex that connects to the dimension of water
export const skill_1340: SkillDefinition = {
  id: 1340,
  code: "MM_1340",
  name: "Ice Vortex",
  description: "Creates a vortex that connects to the dimension of water. While launching a water attack, it instantly decreases the enemy's resistance to water attack, Speed, Atk. Spd., and Casting Spd at the same time. Decreases MP continuously. Over-hit is possible. Power 140.\n\nАтака водой на 30 сек. с базовым шансом 80% (прохождение зависит от WIT стата), кастуется на врагов, действует в пределах дальности 900:\n- Магическая атака силой 140. Возможен оверхит.\n- Уменьшает скорость передвижения на 30%.\n- Уменьшает скорость атаки на 10%.\n- Уменьшает скорость каста на 10%.\n- Отнимает у цели по 60 MP раз в 5 сек.\n- Уменьшает защиту от атак водой на 20%.",
  icon: "/skills/skill1340.gif",
  category: "magic_attack",
  powerType: "damage",
  element: "water",
  target: "enemy",
  scope: "single",
  castTime: 6,
  cooldown: 60,
  duration: 30,
  chance: 80,
  tickInterval: 5,
  mpPerTick: -60, // Decreases MP by 60 every 5 seconds
  effects: [
    { stat: "runSpeed", mode: "multiplier", multiplier: 0.7, resistStat: "wit" }, // 30% speed reduction
    { stat: "atkSpeed", mode: "multiplier", multiplier: 0.9, resistStat: "wit" }, // 10% attack speed reduction
    { stat: "castSpeed", mode: "multiplier", multiplier: 0.9, resistStat: "wit" }, // 10% cast speed reduction
    { stat: "waterResist", mode: "percent", value: -20, resistStat: "wit" },
  ],
  levels: [
    { level: 1, requiredLevel: 77, spCost: 20000000, mpCost: 105, power: 140 },
  ],
};

