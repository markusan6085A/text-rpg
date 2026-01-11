import { SkillDefinition } from "../../../types";

// Skill Mastery - masters excellence in skills, influenced by INT
export const skill_0331: SkillDefinition = {
  id: 331,
  code: "ES_0331",
  name: "Skill Mastery",
  description: "Masters excellence in skills. Low possibility of being able to re-use skills without delay or doubles the duration. Influenced by INT.\n\nМастерство в навыках. Низкая вероятность повторного использования навыков без задержки или удвоения длительности. Чем больше INT, тем больше вероятность срабатывания.",
  icon: "/skills/skill0331.gif",
  category: "passive",
  type: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "skillMastery", mode: "flat", value: 2 }, // Skill Mastery is handled by game logic, this is a placeholder
  ],
  levels: [
    { level: 1, requiredLevel: 77, spCost: 13000000, mpCost: 0, power: 2 },
  ],
};

