import { SkillDefinition } from "../../../types";

export const Skill_0256: SkillDefinition = {
  id: 256,
  code: "OR_0256",
  name: "Accuracy",
  description: "Increases one's Accuracy. Continuously consumes MP.\n\nУвеличивает точность. Постоянно потребляет MP.",
  icon: "/skills/skill0256.gif",
  category: "toggle",
  powerType: "flat",
  target: "self",
  scope: "single",
  toggle: true,
  mpPerTick: 0.2,
  effects: [
    { stat: "accuracy", mode: "flat" },
  ],
  levels: [
    { level: 1, requiredLevel: 24, spCost: 5300, mpCost: 1, power: 3 },
  ],
};

