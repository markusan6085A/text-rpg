import { SkillDefinition } from "../../../types";

// Seal of Suspension - debuff skill that temporarily increases nearby enemies' re-use delay physical/magical skills
export const skill_1248: SkillDefinition = {
  id: 1248,
  code: "OL_1248",
  name: "Seal of Suspension",
  description: "Temporarily increases nearby enemies' re-use delay physical/magical skills.\n\nВременно увеличивает время перезарядки физических и магических навыков ближайших врагов на 200%.",
  icon: "/skills/skill1248.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "area",
  castTime: 4,
  cooldown: 20,
  duration: 120, // 2 minutes
  chance: 60,
  stackType: "seal_suspension", // Unique stackType - different Seal debuffs stack, but same Seal levels replace
  effects: [
    { stat: "cooldownReduction", mode: "percent", value: -200 }, // Increases cooldown by 200% (negative reduction)
  ],
  levels: [
    { level: 1, requiredLevel: 48, spCost: 40000, mpCost: 65, power: 200 },
    { level: 2, requiredLevel: 52, spCost: 65000, mpCost: 70, power: 200 },
  ],
};

