import { SkillDefinition } from "../../../types";

// Arcane Chaos - temporarily decreases enemy's resistance to buff canceling and debuff attacks
export const skill_1338: SkillDefinition = {
  id: 1338,
  code: "MM_1338",
  name: "Arcane Chaos",
  description: "Temporarily decreases an enemy's resistance to buff canceling attack and resistance to debuff attack. Increases MP consumption of physical and magic skills. MP gets decreased continuously.\n\nНакладывает Arcane Chaos на 30 сек. с базовым шансом 40% (прохождение зависит от WIT стата), кастуется только на врагов, действует в пределах дальности 600:\n- Снижает сопротивление Cancel на 30%.\n- Снижает сопротивление дебаффам на 30%.\n- Увеличивает стоимость MP для физических навыков на 10%.\n- Увеличивает стоимость MP для магии на 30%.\n- Отнимает у цели по 120 MP раз в 5 сек.",
  icon: "/skills/skill1338.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "single",
  castTime: 4,
  cooldown: 60,
  duration: 30,
  chance: 40,
  tickInterval: 5,
  mpPerTick: -120, // Decreases MP by 120 every 5 seconds
  effects: [
    { stat: "cancelResist", mode: "percent", value: -30, resistStat: "wit" },
    { stat: "debuffResist", mode: "percent", value: -30, resistStat: "wit" },
    // MP consumption increase for physical skills (10%) and magic skills (30%) is handled by game logic
  ],
  levels: [
    { level: 1, requiredLevel: 78, spCost: 32000000, mpCost: 72, power: 0 },
  ],
};

