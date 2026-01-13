import { SkillDefinition } from "../../../types";

// Vengeance - instantly increases P. Def, M.Def and provokes nearby enemies' desire to attack
export const skill_0368: SkillDefinition = {
  id: 368,
  code: "ST_0368",
  name: "Vengeance",
  description: "Instantly increases P. Def, M.Def and provokes nearby enemies' desire to attack. Transfers the target's status to oneself. Becomes immobile while skill is in effect. Available while one is being equipped with a shield. Power 3994. Effect 3.\n\nМгновенно увеличивает физическую и магическую защиту и провоцирует ближайших врагов на атаку. Переносит статус цели на себя. Становится неподвижным во время действия скіла. Доступно при экипировке щита. Сила 3994. Эффект 3.",
  icon: "/skills/skill0368.gif",
  category: "buff",
  powerType: "none",
  target: "self",
  scope: "area",
  castTime: 1,
  cooldown: 1800,
  duration: 30,
  effects: [
    { stat: "pDef", mode: "flat", value: 5400 },
    { stat: "mDef", mode: "flat", value: 4050 },
    { stat: "cancelResist", mode: "multiplier", multiplier: 0.2 }, // 80% resistance to buff removal
    { stat: "immobile", mode: "flat", value: 1 }, // Makes hero immobile
    { stat: "taunt", mode: "flat", value: 1 }, // Provokes enemies to attack
  ],
  levels: [
    { level: 1, requiredLevel: 77, spCost: 20000000, mpCost: 105, power: 3994 },
  ],
};

