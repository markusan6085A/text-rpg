import { SkillDefinition } from "../../../types";

export const Skill_0256: SkillDefinition = {
  id: 256,
  code: "HF_0256",
  name: "Accuracy",
  description: "Increases one's Accuracy. Continuously consumes MP.\n\nУвеличивает точность. Постоянно потребляет MP.",
  icon: "/skills/skill0256.gif",
  category: "toggle",
  powerType: "flat",
  target: "self",
  scope: "single",
  toggle: true,
  effects: [
  {
    "stat": "accuracy",
    "mode": "flat"
  }
],
  levels: [
  {
    "level": 1,
    "requiredLevel": 20,
    "spCost": 5900,
    "mpCost": 0,
    "power": 3
  }
]
};
