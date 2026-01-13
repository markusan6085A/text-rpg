import { SkillDefinition } from "../../../types";

// Esprit - increases recovery speed while running
export const skill_0171: SkillDefinition = {
  id: 171,
  code: "AS_0171",
  name: "Esprit",
  description: "Increases recovery speed while one is running.\n\nУвеличивает скорость восстановления HP при беге на 2.5 HP/сек. Увеличивает скорость восстановления MP при беге на 0.8 MP/сек.",
  icon: "/skills/skill0171.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "hpRegen", mode: "flat", value: 2.5 },
    { stat: "mpRegen", mode: "flat", value: 0.8 },
  ],
  levels: [
    { level: 1, requiredLevel: 36, spCost: 22000, mpCost: 0, power: 1 }, // Increases HP regen by 2.5/sec, MP regen by 0.8/sec
  ],
};

