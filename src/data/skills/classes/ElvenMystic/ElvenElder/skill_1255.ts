import { SkillDefinition } from "../../../types";

// Party Recall - Teleports party members to a village
// З XML: levels="2"
// Для Elven Elder: рівні 1-2 (requiredLevel: 48, 56)
export const skill_1255: SkillDefinition = {
  id: 1255,
  code: "EE_1255",
  name: "Party Recall",
  description: "Teleports party members to a village. This skill cannot be used in a specially designated place such as the GM Consultation Service.\n\nТелепортирует членов группы в деревню. Этот навык нельзя использовать в специально отведенных местах, таких как Служба консультаций GM.",
  icon: "/skills/skill1255.gif",
  category: "special",
  powerType: "none",
  target: "party",
  scope: "party",
  castTime: 20,
  cooldown: 600,
  effects: [],
  levels: [
    { level: 1, requiredLevel: 48, spCost: 67000, mpCost: 257, power: 0 },
    { level: 2, requiredLevel: 56, spCost: 110000, mpCost: 305, power: 0 },
  ],
};













