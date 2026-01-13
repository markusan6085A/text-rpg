import { SkillDefinition } from "../../../types";

export const Skill_0330: SkillDefinition = {
  id: 330,
  code: "GK_0330",
  name: "Skill Mastery",
  description: "Masters excellence in skills. Low possibility of being able to re-use skills without delay or doubles the duration. Influenced by STR.\n\nМастерство в навыках. Низкая вероятность повторного использования навыков без задержки или удвоения длительности. Зависит от STR.",
  icon: "/skills/skill0330.gif",
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

