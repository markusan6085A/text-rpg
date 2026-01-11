import { SkillDefinition } from "../../../types";

// Sleeping Cloud - instantly puts nearby enemies to sleep
export const skill_1072: SkillDefinition = {
  id: 1072,
  code: "ES_1072",
  name: "Sleeping Cloud",
  description: "Instantly puts nearby enemies to sleep. If cast on a sleeping target, the spell has no effect.\n\nМгновенно усыпляет ближайших врагов на 30 сек. с базовым шансом 40%.",
  icon: "/skills/skill1072.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "area",
  castTime: 4,
  cooldown: 20,
  duration: 30,
  chance: 40,
  effects: [
    { stat: "sleepResist", mode: "multiplier", multiplier: 0, resistStat: "wit" },
  ],
  levels: [
    { level: 1, requiredLevel: 44, spCost: 37000, mpCost: 59, power: 0 },
    { level: 2, requiredLevel: 56, spCost: 95000, mpCost: 77, power: 0 },
    { level: 3, requiredLevel: 62, spCost: 180000, mpCost: 87, power: 0 },
    { level: 4, requiredLevel: 66, spCost: 350000, mpCost: 93, power: 0 },
  ],
};

