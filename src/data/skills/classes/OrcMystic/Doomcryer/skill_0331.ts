import { SkillDefinition } from "../../../types";

// Skill Mastery - passive skill that masters excellence in skills. Low possibility of being able to re-use skills without delay or doubles the duration. Influenced by INT.
export const skill_0331: SkillDefinition = {
  id: 331,
  code: "DC_0331",
  name: "Skill Mastery",
  description: "Masters excellence in skills. Low possibility of being able to re-use skills without delay or doubles the duration. Influenced by INT.\n\nМастерство в навыках. Низкая вероятность повторного использования навыков без задержки или удвоения длительности. Зависит от INT.",
  icon: "/skills/skill0331.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "skillMastery", mode: "flat", value: 2 },
  ],
  levels: [
    { level: 1, requiredLevel: 77, spCost: 20000000, mpCost: 0, power: 2 },
  ],
};

