import { SkillDefinition } from "../../../types";

// Skill Mastery (INT version)
export const skill_0331: SkillDefinition = {
  id: 331,
  code: "DMSM_0331",
  name: "Skill Mastery",
  description: "Masters excellence in skills. Low possibility of being able to re-use skills without delay or doubles the duration. Influenced by INT.\n\nМастерство в скілах. Низька ймовірність повторного використання скілів без затримки або подвоєння тривалості. Залежить від INT.",
  icon: "/skills/skill0330.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [], // Skill Mastery is handled by game logic, not by stat modifiers
  levels: [
    {
      level: 1,
      requiredLevel: 77,
      spCost: 15000000,
      mpCost: 0,
      power: 0,
    },
  ],
};

