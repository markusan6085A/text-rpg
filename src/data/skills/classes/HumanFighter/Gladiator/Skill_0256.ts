import { SkillDefinition } from "../../../types";

// Accuracy toggle (shared id 0256)  no cooldown, manual on/off.
export const Skill_0256: SkillDefinition = {
  id: 256,
  code: "GL_0256",
  name: "Accuracy",
  description: "Increases one's Accuracy. Continuously consumes MP.\n\nУвеличивает точность на 30. Непрерывно потребляет MP (24 MP каждые 3 сек). Переключаемый навык.",
  category: "toggle",
  powerType: "flat",
  target: "self",
  scope: "single",
  toggle: true,
  mpPerTick: -24, // Споживає 24 MP кожні 3 секунди
  tickInterval: 3,
  stackType: "accuracy_toggle",
  stackOrder: 1,
  icon: "/skills/0256.jpg",
  effects: [{ stat: "accuracy", mode: "flat" }],
  levels: [{ level: 1, requiredLevel: 52, spCost: 100000, mpCost: 24, power: 30 }],
};

