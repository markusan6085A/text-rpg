import { SkillDefinition } from "../../../types";

// Poison Recovery - continuation (lv.2-3)
export const skill_0021_lv2: SkillDefinition = {
  id: 21,
  code: "PW_0021",
  name: "Poison Recovery",
  description: "Self-cures poison. Effect less than 7-9.\n\nСнимает эффект отравления с силой менее 7-9 (зависит от уровня).",
  icon: "/skills/skill0021.gif",
  category: "heal",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  levels: [
    { level: 2, requiredLevel: 40, spCost: 28000, mpCost: 35, power: 7 },
    { level: 3, requiredLevel: 60, spCost: 260000, mpCost: 55, power: 9 },
  ],
};

