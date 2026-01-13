import { SkillDefinition } from "../../../types";

// Mass Warrior Bane
export const skill_1344: SkillDefinition = {
  id: 1344,
  code: "ST_1344",
  name: "Mass Warrior Bane",
  description: "Removes buffs that increase Atk. Spd. and Speed from nearby enemies. Эффект Mass Warrior Bane, кастуется на себя, действует на врагов в радиусе 200 вокруг себя: - Снимает все баффы увеличения скорости атаки с вероятностью 40%. - Снимает все баффы увеличения скорости бега с вероятностью 40%.",
  category: "debuff",
  powerType: "none",
  icon: "/skills/skill1344.gif",
  target: "enemy",
  scope: "area",
  castTime: 4,
  cooldown: 30,
  levels: [{ level: 1, requiredLevel: 77, spCost: 13000000, mpCost: 105, power: 0 }],
};
