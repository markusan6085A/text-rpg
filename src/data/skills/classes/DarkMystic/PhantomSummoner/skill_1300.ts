import { SkillDefinition } from "../../../types";

export const skill_1300: SkillDefinition = {
  id: 1300,
  code: "DMP_1300",
  name: "Servitor Cure",
  description: "Cures a servitor's bleeding and poisoning.\n\nИзлечивает кровотечение и отравление у слуги.",
  icon: "/skills/skill1300.gif",
  category: "heal",
  powerType: "none",
  target: "ally",
  scope: "single",
  castTime: 4,
  cooldown: 15,
  levels: [
    { level: 1, requiredLevel: 40, power: 3, mpCost: 28, spCost: 32000 }, // negatePower: 3
    { level: 2, requiredLevel: 48, power: 7, mpCost: 35, spCost: 75000 }, // negatePower: 7
    { level: 3, requiredLevel: 60, power: 9, mpCost: 44, spCost: 210000 }, // negatePower: 9
  ],
};

