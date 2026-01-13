import { SkillDefinition } from "../../../types";

export const skill_1358: SkillDefinition = {
  id: 1358,
  code: "HM_1358",
  name: "Block Shield",
  description: "Removes buffs that increase P. Def from a targeted enemy. Temporarily decreases P. Def and prevents enemy from receiving the buff that will increase P. Def. again.\n\nУдаляет бафы, увеличивающие физ. защиту, с выбранного врага. Временно снижает физ. защиту и предотвращает получение врагом бафов, увеличивающих физ. защиту.",
  category: "debuff",
  powerType: "percent",
  icon: "/skills/skill1358.gif",
  target: "enemy",
  duration: 120,
  castTime: 4,
  cooldown: 30,
  effects: [
    { stat: "pDef", mode: "percent", value: -10, chance: 80 },
  ],
  levels: [
    { level: 1, requiredLevel: 77, spCost: 13000000, mpCost: 70, power: 80 },
  ],
};

