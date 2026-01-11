import { SkillDefinition } from "../../../types";

// Expertise D - familiarity with D-grade equipment
// Note: In XML it's "Expertise S" but for Dwarven Fighter it should be D-grade
export const skill_0239: SkillDefinition = {
  id: 239,
  code: "DF_0239",
  name: "Expertise D",
  description: "You become familiar with D-grade equipment.\n\nВы становитесь знакомы с экипировкой класса D.",
  icon: "/skills/skill0239.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  levels: [
    { level: 1, requiredLevel: 20, spCost: 0, mpCost: 0, power: 0 },
  ],
};

