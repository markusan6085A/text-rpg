import { SkillDefinition } from "../../../types";

// Quiver of Arrow: Grade S - summons Shining arrows
export const skill_0324: SkillDefinition = {
  id: 324,
  code: "SR_0324",
  name: "Quiver of Arrow: Grade S",
  description: "Summons between 650 and 2600 shining arrows. Consumes 1 Crystal: S-Grade.\n\nПризывает 450-1800 A-стрел или 650-2600 S-стрел. Потребляет 1 Кристалл: S-Grade.",
  icon: "/skills/skill0324.gif",
  category: "special",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 3,
  cooldown: 1800,
  levels: [
    { level: 1, requiredLevel: 72, spCost: 1500000, mpCost: 200, power: 0 },
  ],
};

