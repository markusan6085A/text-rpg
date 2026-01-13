import { SkillDefinition } from "../../../types";

// Skill Mastery - masters excellence in skills, influenced by STR
// XML: skillMastery: 2
export const skill_0330: SkillDefinition = {
  id: 330,
  code: "MA_0330",
  name: "Skill Mastery",
  description: "Masters excellence in skills. Low possibility of being able to re-use skills without delay or doubles the duration. Influenced by STR.\n\nОсваивает мастерство в навыках. Низкая возможность повторного использования навыков без задержки или удваивает длительность. Зависит от STR.",
  icon: "/skills/skill0330.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "skillMastery", mode: "flat", value: 2 }, // From XML
  ],
  levels: [
    { level: 1, requiredLevel: 77, spCost: 13000000, mpCost: 0, power: 0 },
  ],
};

