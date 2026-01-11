import { SkillDefinition } from "../../../types";

export const skill_1062: SkillDefinition = {
  id: 1062,
  code: "HM_1062",
  name: "Berserker Spirit",
  description: "Temporarily reduces P. Def., M. Def. and increases P. Atk., M. Atk., Atk. Spd., Casting Spd., and Speed. Effect 2.\n\nВременно снижает физ. защиту и маг. защиту, увеличивает физ. атаку, маг. атаку, скорость атаки, скорость каста и скорость передвижения. Эффект 2.",
  icon: "/skills/skill1062.gif",
  category: "buff",
  powerType: "percent",
  target: "ally",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  duration: 1200,
  effects: [
    {
      stat: "pAtk",
      mode: "percent"
    },
    {
      stat: "attackSpeed",
      mode: "percent"
    },
    {
      stat: "mAtk",
      mode: "percent"
    },
    {
      stat: "castSpeed",
      mode: "percent"
    },
    {
      stat: "runSpeed",
      mode: "flat"
    },
    {
      stat: "pDef",
      mode: "percent",
      multiplier: -1
    },
    {
      stat: "mDef",
      mode: "percent",
      multiplier: -2
    }
  ],
  stackType: "berserker_spirit",
  stackOrder: 1,
  levels: [
    {
      level: 2,
      requiredLevel: 52,
      spCost: 100000,
      mpCost: 48,
      power: 20
    }
  ]
};

