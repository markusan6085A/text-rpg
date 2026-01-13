import { SkillDefinition } from "../../../types";

// Cure Bleeding - continuation (lv.2-3)
export const skill_0061_lv2: SkillDefinition = {
  id: 61,
  code: "PW_0061",
  name: "Cure Bleeding",
  description: "Heals one's wounds. Effect less than 7-9.\n\nСнимает эффект кровотечения с силой менее 7-9 (зависит от уровня).",
  icon: "/skills/skill0061.gif",
  category: "heal",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  levels: [
    { level: 2, requiredLevel: 46, spCost: 43000, mpCost: 42, power: 7 },
    { level: 3, requiredLevel: 62, spCost: 370000, mpCost: 55, power: 9 },
  ],
};

