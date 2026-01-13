import { SkillDefinition } from "../../../types";

// Accuracy - increases Accuracy, consumes MP continuously
export const skill_0256: SkillDefinition = {
  id: 256,
  code: "ES_0256",
  name: "Accuracy",
  description: "Increases one's Accuracy. Continuously consumes MP.\n\nУвеличивает Accuracy для всех атак на 3. Непрерывно расходует MP (0.2 MP/сек, 5 MP/сек).",
  icon: "/skills/skill0256.gif",
  category: "toggle",
  powerType: "none",
  target: "self",
  scope: "single",
  toggle: true,
  mpPerTick: 0.2, // Continuous MP consumption (5 MP/sec)
  tickInterval: 1,
  effects: [
    { stat: "accuracy", mode: "flat", value: 3 },
  ],
  levels: [
    { level: 1, requiredLevel: 24, spCost: 5000, mpCost: 1, power: 3 },
  ],
};

