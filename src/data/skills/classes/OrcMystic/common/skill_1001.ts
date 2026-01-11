import { SkillDefinition } from "../../../types";

// Soul Cry - toggle skill that increases P. Atk. and consumes MP continuously
export const skill_1001: SkillDefinition = {
  id: 1001,
  code: "OM_1001",
  name: "Soul Cry",
  description: "Increases one's own P. Atk. MP gets consumed continuously.\n\nУвеличивает физическую атаку. MP потребляется непрерывно (3 MP каждые 3 секунды на уровне 1, 6 MP каждые 3 секунды на уровне 2).",
  icon: "/skills/skill1001.gif",
  category: "toggle",
  powerType: "none",
  target: "self",
  scope: "single",
  toggle: true,
  stackType: "soul_cry", // Unique stackType - higher level Soul Cry replaces lower level
  mpPerTick: -3, // Consumes 3 MP per tick (level 1)
  tickInterval: 3, // Every 3 seconds
  effects: [
    { stat: "pAtk", mode: "flat", value: 4.5 },
  ],
  levels: [
    { level: 1, requiredLevel: 1, spCost: 0, mpCost: 2, power: 4.5 },
    { level: 2, requiredLevel: 14, spCost: 1800, mpCost: 3, power: 14 },
  ],
};

