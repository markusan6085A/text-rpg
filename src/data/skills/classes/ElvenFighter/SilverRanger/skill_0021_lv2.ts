import { SkillDefinition } from "../../../types";

// Poison Recovery lv.2-3 - self-cures poison
export const skill_0021_lv2: SkillDefinition = {
  id: 21,
  code: "SR_0021",
  name: "Poison Recovery",
  description: "Self-cures poison.\n\nЛечит для лечения яда эффекта менее 7-9 в секунду.",
  icon: "/skills/skill0021.gif",
  category: "heal",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  levels: [
    { level: 2, requiredLevel: 40, spCost: 35000, mpCost: 35, power: 0 },
    { level: 3, requiredLevel: 60, spCost: 290000, mpCost: 55, power: 0 },
  ],
};

