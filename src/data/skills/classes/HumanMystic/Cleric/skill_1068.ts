import { SkillDefinition } from "../../../types";

export const skill_1068: SkillDefinition = {
  id: 1068,
  code: "HM_1068",
  name: "Might",
  description: "Temporarily increases P. Atk. Effect 2.\n\nВременно увеличивает физ. атаку. Эффект 2. Длительность: 20 мин.",
  icon: "/skills/Skill1068_0.jpg",
  category: "buff",
  powerType: "none",
  target: "ally",
  scope: "single",
  duration: 1200,
  castTime: 4,
  cooldown: 6,
  effects: [{ stat: "pAtk", mode: "multiplier", value: 1.12 }],
  stackType: "pAtk",
  stackOrder: 1.12,
  levels: [
    { level: 2, requiredLevel: 20, spCost: 3300, mpCost: 20, power: 1.08 },
  ],
};

