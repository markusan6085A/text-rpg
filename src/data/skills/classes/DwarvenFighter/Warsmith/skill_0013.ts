import { SkillDefinition } from "../../../types";

// Summon Siege Golem - summons siege golem
// XML: mpInitialConsume: 530, hitTime: 180000, reuseDelay: 20000
export const skill_0013: SkillDefinition = {
  id: 13,
  code: "WS_0013",
  name: "Summon Siege Golem",
  description: "Summons siege golem. Summoning requires 300 Crystals: C-Grade and each minute consumes an additional 70 Gemstones: C-Grade.\n\nПризывает осадного голема. При призыве требуется 300 Кристаллов: C-класса, и каждую минуту потребляется дополнительно 70 Самоцветов: C-класса.",
  icon: "/skills/skill0013.gif",
  category: "special",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 300,
  cooldown: 20,
  levels: [
    { level: 1, requiredLevel: 49, spCost: 700000, mpCost: 530, power: 0 },
  ],
};

