import { SkillDefinition } from "../../../types";

// Servitor Physical Shield
export const skill_1140: SkillDefinition = {
  id: 1140,
  code: "DMP_1140",
  name: "Servitor Physical Shield",
  description: "Temporarily increases servitor's P. Def. Effect 3.\n\nТимчасово збільшує фізичну захист слуги.",
  icon: "/skills/skill1140.gif",
  category: "buff",
  powerType: "percent",
  target: "ally",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  duration: 1200, // 20 minutes
  levels: [
    {
      level: 1,
      requiredLevel: 40,
      power: 5, // +5% P.Def
      mpCost: 52, // 11 + 41
      spCost: 120000,
    },
    {
      level: 2,
      requiredLevel: 48,
      power: 10, // +10% P.Def
      mpCost: 52,
      spCost: 120000,
    },
    {
      level: 3,
      requiredLevel: 56,
      power: 15, // +15% P.Def
      mpCost: 52,
      spCost: 120000,
    },
    {
      level: 4,
      requiredLevel: 62,
      power: 20, // +20% P.Def
      mpCost: 52,
      spCost: 120000,
    },
    {
      level: 5,
      requiredLevel: 74,
      power: 25, // +25% P.Def and M.Def
      mpCost: 52,
      spCost: 120000,
    },
  ],
  effects: [
    { stat: "pDef", mode: "percent" }, // Value from level.power
    // Level 5 also adds M.Def - handled in spectralMasterServitorBuffs or summons.ts
  ],
};

