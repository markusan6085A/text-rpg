import { SkillDefinition } from "../../../types";

// Rest of Chameleon - allows one to sit and rest while being protected from monster's pre-emptive attack
export const skill_0296: SkillDefinition = {
  id: 296,
  code: "PW_0296",
  name: "Rest of Chameleon",
  description: "Allows one to sit and rest while being protected from a monster's pre-emptive attack. MP will continuously be consumed.\n\nПозволяет сидеть и отдыхать, будучи защищенным от упреждающей атаки монстра. Непрерывно расходует MP (2 MP каждые 5 сек, около 0.4 MP/сек). Уменьшает агрессию врага на 100%.",
  icon: "/skills/skill0296.gif",
  category: "toggle",
  powerType: "none",
  target: "self",
  scope: "single",
  toggle: true,
  mpPerTick: -0.4, // Consumes 0.4 MP per second
  tickInterval: 1,
  // Rest of Chameleon reduces enemy aggression - handled by game logic, not by stat modifiers
  effects: [],
  levels: [
    { level: 1, requiredLevel: 46, spCost: 43000, mpCost: 9, power: 0 },
  ],
};

