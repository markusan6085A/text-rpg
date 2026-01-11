import { SkillDefinition } from "../../../types";

// Accuracy - increases Accuracy, consumes MP continuously
export const skill_0256: SkillDefinition = {
  id: 256,
  code: "AS_0256",
  name: "Accuracy",
  description: "Increases one's Accuracy. Continuously consumes MP.\n\nУвеличивает точность. Непрерывно расходует MP.",
  icon: "/skills/skill0256.gif",
  category: "toggle",
  powerType: "none",
  target: "self",
  scope: "single",
  toggle: true,
  mpPerTick: 0.2, // Continuous MP consumption (5 MP/sec)
  effects: [
    { stat: "accuracy", mode: "flat", value: 3 },
  ],
  levels: [
    { level: 1, requiredLevel: 24, spCost: 5000, mpCost: 1, power: 3 }, // Increases Accuracy by 3
  ],
};

