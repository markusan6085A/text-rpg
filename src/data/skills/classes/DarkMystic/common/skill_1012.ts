import { SkillDefinition } from "../../../types";

// Cure Poison - 3 levels from XML
// power: 3.0, 7.0, 9.0
// mpConsume: 8, 24, 44
export const skill_1012: SkillDefinition = {
  id: 1012,
  code: "DM_1012",
  name: "Cure Poison",
  description: "Cures poisoning.\n\nЛечит отравление.",
  icon: "/skills/Skill1012_0.jpg",
  category: "special",
  powerType: "flat",
  target: "ally",
  scope: "single",
  castTime: 4,
  cooldown: 15,
  levels: [
    { level: 1, requiredLevel: 7, spCost: 470, mpCost: 8, power: 3.0 },
    { level: 2, requiredLevel: 20, spCost: 3000, mpCost: 24, power: 7.0 },
    { level: 3, requiredLevel: 40, spCost: 15000, mpCost: 44, power: 9.0 },
  ],
};



