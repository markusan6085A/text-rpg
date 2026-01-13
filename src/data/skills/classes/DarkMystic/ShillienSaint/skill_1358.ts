import { SkillDefinition } from "../../../types";

// Block Shield
export const skill_1358: SkillDefinition = {
  id: 1358,
  code: "DMS_1358",
  name: "Block Shield",
  description: "Removes buffs that increase P. Def from a targeted enemy. Temporarily decreases P. Def and prevents enemy from receiving the buff that will increase P. Def. again.\n\nУдаляет баффы, увеличивающие физ. защиту у выбранного врага. Временно снижает физ. защиту на 10% и предотвращает получение баффов, увеличивающих физ. защиту.",
  icon: "/skills/skill1358.gif",
  category: "debuff",
  powerType: "percent",
  target: "enemy",
  scope: "single",
  castTime: 4,
  cooldown: 30,
  duration: 120,
  chance: 80,
  effects: [
    { stat: "pDef", mode: "percent", multiplier: -0.1 }, // -10% P. Def
  ],
  levels: [
    {
      level: 1,
      requiredLevel: 77,
      spCost: 20000000,
      mpCost: 56,
      power: 0,
    },
  ],
};

