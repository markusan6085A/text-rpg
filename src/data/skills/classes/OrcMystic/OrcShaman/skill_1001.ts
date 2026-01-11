import { SkillDefinition } from "../../../types";

// Soul Cry - toggle skill (Levels 3-4 for OrcShaman)
export const skill_1001: SkillDefinition = {
  id: 1001,
  code: "OS_1001",
  name: "Soul Cry",
  description: "Increases one's own P. Atk. MP gets consumed continuously.\n\nУвеличивает физическую атаку. MP потребляется непрерывно (15 MP каждые 5 секунд на уровне 3, 20 MP каждые 5 секунд на уровне 4).",
  icon: "/skills/skill1001.gif",
  category: "toggle",
  powerType: "none",
  target: "self",
  scope: "single",
  toggle: true,
  stackType: "soul_cry", // Unique stackType - higher level Soul Cry replaces lower level
  mpPerTick: -15, // Consumes 15 MP per tick (level 3)
  tickInterval: 5, // Every 5 seconds
  effects: [
    { stat: "pAtk", mode: "flat", value: 33.5 },
  ],
  levels: [
    { level: 3, requiredLevel: 25, spCost: 5800, mpCost: 5, power: 33.5 },
    { level: 4, requiredLevel: 35, spCost: 18000, mpCost: 6, power: 66.5 },
  ],
};

