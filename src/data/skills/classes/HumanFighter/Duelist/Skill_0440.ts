import { SkillDefinition } from "../../../types";

export const Skill_0440: SkillDefinition = {
  id: 440,
  code: "DL_0440",
  name: "Braveheart",
  description: "Описание умения.\n\nХраброе сердце. Увеличивает восстановление CP.",
  category: "special",
  powerType: "flat",
  target: "self",
  scope: "single",
  icon: "/skills/0440.jpg",
  effects: [{ stat: "cpRegen", mode: "flat", value: 1000 }],
  levels: [
    { level: 1, requiredLevel: 78, spCost: 16000000, mpCost: 57, power: 1000 },
  ],
};

