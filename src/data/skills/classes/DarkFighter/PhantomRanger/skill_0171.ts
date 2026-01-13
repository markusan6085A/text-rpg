import { SkillDefinition } from "../../../types";

// Esprit - increases recovery speed while running (continuation from Assassin lv.2-8)
export const skill_0171: SkillDefinition = {
  id: 171,
  code: "PR_0171",
  name: "Esprit",
  description: "Increases recovery speed while one is running.\n\nУвеличивает скорость восстановления HP и MP при беге.",
  icon: "/skills/skill0171.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "hpRegen", mode: "flat", value: 3 }, // HP regen increases by level
    { stat: "mpRegen", mode: "flat", value: 0.9 }, // MP regen increases by level
  ],
  levels: [
    { level: 2, requiredLevel: 43, spCost: 33000, mpCost: 0, power: 1 }, // HP: 3/sec, MP: 0.9/sec
    { level: 3, requiredLevel: 46, spCost: 47000, mpCost: 0, power: 1 }, // HP: 3.5/sec, MP: 1/sec
    { level: 4, requiredLevel: 49, spCost: 75000, mpCost: 0, power: 1 }, // HP: 4/sec, MP: 1.1/sec
    { level: 5, requiredLevel: 52, spCost: 120000, mpCost: 0, power: 1 }, // HP: 4.5/sec, MP: 1.2/sec
    { level: 6, requiredLevel: 62, spCost: 310000, mpCost: 0, power: 1 }, // HP: 5/sec, MP: 1.3/sec
    { level: 7, requiredLevel: 68, spCost: 600000, mpCost: 0, power: 1 }, // HP: 5.5/sec, MP: 1.4/sec
    { level: 8, requiredLevel: 74, spCost: 1600000, mpCost: 0, power: 1 }, // HP: 6/sec, MP: 1.5/sec
  ],
};

