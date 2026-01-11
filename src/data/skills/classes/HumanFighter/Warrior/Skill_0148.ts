import { SkillDefinition } from "../../../types";

export const Skill_0148: SkillDefinition = {
  id: 148,
  code: "WR_0148",
  name: "Vital Force",
  description: "Allows quick recovery while one is sitting. -\n\nПозволяет быстрое восстановление во время сидения. Увеличивает максимальное HP и MP.",
  category: "passive",
  powerType: "flat",
  target: "self",
  scope: "single",
  effects: [
    { stat: "maxHp", mode: "percent" },
    { stat: "maxMp", mode: "percent" },
  ],
  stackType: "vital_force",
  stackOrder: 1,
  icon: "/skills/0148.jpg",
  levels: [
    { level: 1, requiredLevel: 24, spCost: 6400, mpCost: 0, power: 1.9 },
    { level: 2, requiredLevel: 36, spCost: 18000, mpCost: 0, power: 2.7 },
  ],
};

