import { SkillDefinition } from "../../../types";

// Return - Teleports caster to the nearest village
// З XML: levels="2"
// Для Elven Elder: рівні 1-2 (requiredLevel: 44, 56)
export const skill_1050: SkillDefinition = {
  id: 1050,
  code: "EE_1050",
  name: "Return",
  description: "Teleports caster to the nearest village. This skill cannot be used in a specially designated place such as the GM Consultation Service.\n\nТелепортирует кастера в ближайшую деревню. Этот навык нельзя использовать в специально отведенных местах, таких как Служба консультаций GM.",
  icon: "/skills/skill1050.gif",
  category: "special",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 20,
  cooldown: 300,
  effects: [],
  levels: [
    { level: 1, requiredLevel: 44, spCost: 41000, mpCost: 105, power: 0 },
    { level: 2, requiredLevel: 56, spCost: 110000, mpCost: 153, power: 0 },
  ],
};













