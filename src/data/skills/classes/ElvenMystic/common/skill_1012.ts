import { SkillDefinition } from "../../../types";

// Cure Poison - cures poisoning up to Effect 3
export const skill_1012: SkillDefinition = {
  id: 1012,
  code: "EM_1012",
  name: "Cure Poison",
  description: "Cures poisoning up to Effect 3.\n\nЛечит отравление до эффекта 3. Каст: 4 сек. Перезарядка: 15 сек.",
  icon: "/skills/Skill1012_0.jpg",
  category: "special",
  powerType: "none",
  target: "ally",
  scope: "single",
  castTime: 4,
  cooldown: 15,
  levels: [
    { level: 1, requiredLevel: 7, spCost: 520, mpCost: 10, power: 3 },
  ],
};

