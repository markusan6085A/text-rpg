import { SkillDefinition } from "../../../types";

export const Skill_0257: SkillDefinition = {
  id: 257,
  code: "WR_0257",
  name: "Sword/Blunt Weapon Mastery",
  description: "Описание умения.\n\nМастерство меча/тупого оружия. Увеличивает физ. атаку при использовании меча или тупого оружия.",
  category: "passive",
  powerType: "flat",
  target: "self",
  scope: "single",
  effects: [{ stat: "pAtk", mode: "percent" }],
  stackType: "sword_blunt_mastery",
  stackOrder: 1,
  icon: "/skills/0257.jpg",
  levels: [
    { level: 1, requiredLevel: 20, spCost: 3700, mpCost: 0, power: 4.5 },
    { level: 2, requiredLevel: 24, spCost: 6400, mpCost: 0, power: 7.3 },
    { level: 3, requiredLevel: 28, spCost: 6000, mpCost: 0, power: 8.9 },
    { level: 4, requiredLevel: 28, spCost: 6000, mpCost: 0, power: 10.7 },
    { level: 5, requiredLevel: 32, spCost: 9100, mpCost: 0, power: 12.8 },
    { level: 6, requiredLevel: 32, spCost: 9100, mpCost: 0, power: 15.1 },
  ],
};

