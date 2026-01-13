import { SkillDefinition } from "../../../types";

// Light Vortex - creates a vortex that connects to the dimension of light
export const skill_1342: SkillDefinition = {
  id: 1342,
  code: "MM_1342",
  name: "Light Vortex",
  description: "Creates a vortex that connects to the dimension of light. While launching a light magic attack, it instantly decreases the enemy's resistance to light attack and decreases MP continuously. Power 139.\n\nАтака светом на 30 сек. с базовым шансом 80% (прохождение зависит от WIT стата), кастуется на врагов, действует в пределах дальности 900:\n- Магическая атака силой 139.\n- Снижает Accuracy цели на 6.\n- Отнимает у цели по 60 MP раз в 5 сек.\n- Уменьшает защиту от атак светом на 30%.",
  icon: "/skills/skill1342.gif",
  category: "magic_attack",
  powerType: "damage",
  element: "holy",
  target: "enemy",
  scope: "single",
  castTime: 6,
  cooldown: 60,
  duration: 30,
  chance: 80,
  tickInterval: 5,
  mpPerTick: -60, // Decreases MP by 60 every 5 seconds
  effects: [
    { stat: "accuracy", mode: "flat", value: -6, resistStat: "wit" },
    { stat: "holyResist", mode: "percent", value: -30, resistStat: "wit" },
  ],
  levels: [
    { level: 1, requiredLevel: 76, spCost: 15000000, mpCost: 105, power: 139 },
  ],
};

