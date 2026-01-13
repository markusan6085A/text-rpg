import { SkillDefinition } from "../../../types";

export const Skill_0256: SkillDefinition = {
  id: 256,
  code: "WR_0256",
  name: "Accuracy",
  description: "Increases one's Accuracy. Continuously consumes MP.\n\nУвеличивает точность. Непрерывно потребляет MP.",
  category: "toggle",
  powerType: "flat",
  target: "self",
  scope: "single",
  toggle: true,
  mpPerTick: -5, // Споживає 5 MP кожні 3 секунди
  tickInterval: 3,
  stackType: "accuracy_toggle",
  stackOrder: 1,
  effects: [{ stat: "accuracy", mode: "flat" }],
  icon: "/skills/0256.jpg",
  levels: [
    { level: 1, requiredLevel: 24, spCost: 6400, mpCost: 5, power: 3 },
  ],
};

