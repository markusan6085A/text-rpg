import { SkillDefinition } from "../../../types";

// Quiver of Arrow: Grade A - summons Mithril arrows
export const skill_0323: SkillDefinition = {
  id: 323,
  code: "SR_0323",
  name: "Quiver of Arrow: Grade A",
  description: "Summons between 450 and 1800 Mithril arrows. Consumes 1 Crystal: A-Grade.\n\nПризывает 450-1800 мифриловых стрел. Потребляет 1 Кристалл: A-Grade.",
  icon: "/skills/skill0323.gif",
  category: "special",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 3,
  cooldown: 1800,
  levels: [
    { level: 1, requiredLevel: 66, spCost: 700000, mpCost: 130, power: 0 },
  ],
};

