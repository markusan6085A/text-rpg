import { SkillDefinition } from "../../../types";

// Servitor Ultimate Defense
export const skill_1299: SkillDefinition = {
  id: 1299,
  code: "HM_1299",
  name: "Servitor Ultimate Defense",
  description: "Temporarily but significantly increases a servitor's P. Def., M. Def. and resistance to buff removing attacks. The servitor is immobilized for the duration of the spell.\n\nВременно значительно увеличивает физ. защиту, маг. защиту и сопротивление к снятию бафов у сервитора. Сервитор обездвижен на время действия заклинания.",
  icon: "/skills/skill1299.gif",
  category: "buff",
  powerType: "flat",
  target: "ally",
  scope: "single",
  castTime: 1,
  cooldown: 1800,
  duration: 30,
  effects: [
    { stat: "pDef", mode: "flat" }, // value буде взято з levelDef.power
    { stat: "mDef", mode: "flat", multiplier: 0.75 }, // mDef = power * 0.75 (1350/1800 = 0.75, 2700/3600 = 0.75)
  ],
  levels: [
    { level: 1, requiredLevel: 52, spCost: 110000, mpCost: 38, power: 1800 }, // pDef: 1800, mDef: 1350 (1800 * 0.75)
    { level: 2, requiredLevel: 70, spCost: 670000, mpCost: 52, power: 3600 }, // pDef: 3600, mDef: 2700 (3600 * 0.75)
  ],
};
