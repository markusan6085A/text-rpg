import { SkillDefinition } from "../../../types";

// Cure Bleeding lv.2-3 - heals bleeding wounds
export const skill_0061_lv2: SkillDefinition = {
  id: 61,
  code: "SR_0061",
  name: "Cure Bleeding",
  description: "Heals one's wounds.\n\nЛечит для лечения кровотечения эффекта менее 7-9 в секунду.",
  icon: "/skills/skill0061.gif",
  category: "heal",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  levels: [
    { level: 2, requiredLevel: 46, spCost: 50000, mpCost: 42, power: 0 },
    { level: 3, requiredLevel: 62, spCost: 360000, mpCost: 55, power: 0 },
  ],
};

