import { SkillDefinition } from "../../../types";

// Skill Mastery
export const skill_0330: SkillDefinition = {
  id: 330,
  code: "DMS_0330",
  name: "Skill Mastery",
  description: "Masters excellence in skills. Low possibility of being able to re-use skills without delay or doubles the duration. Influenced by INT.\n\nМастерство в скілах. Низкая вероятность повторного использования скілов без задержки или удвоения длительности. Зависит от INT.",
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
      spCost: 20000000,
      mpCost: 0,
      power: 0,
    },
  ],
};

