import { SkillDefinition } from "../../../types";

export const skill_1062: SkillDefinition = {
  id: 1062,
  code: "HM_1062",
  name: "Berserker Spirit",
  description: "Temporarily reduces P. Def., M. Def. and increases P. Atk., M. Atk., Atk. Spd., Casting Spd., and Speed. Effect 1.\n\nВременно снижает физ. защиту, маг. защиту и увеличивает физ. атаку, маг. атаку, скорость атаки, скорость каста и скорость. Эффект 1. Длительность: 20 мин.",
  icon: "/skills/skill1062.gif",
  category: "buff",
  powerType: "none",
  target: "ally",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  duration: 1200, // 20 minutes
  effects: [
    { stat: "pAtk", mode: "multiplier", value: 1.05 },
    { stat: "attackSpeed", mode: "multiplier", value: 1.05 },
    { stat: "mAtk", mode: "multiplier", value: 1.1 },
    { stat: "castSpeed", mode: "multiplier", value: 1.05 },
    { stat: "runSpeed", mode: "flat", value: 5 },
    { stat: "pDef", mode: "multiplier", value: 0.95 },
    { stat: "mDef", mode: "multiplier", value: 0.9 },
  ],
  stackType: "berserker",
  stackOrder: 1,
  levels: [
    { level: 1, requiredLevel: 35, spCost: 21000, mpCost: 30, power: 1.05 },
  ],
};

