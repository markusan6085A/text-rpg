import { SkillDefinition } from "../../../types";

// Mass Mage Bane
export const skill_1345: SkillDefinition = {
  id: 1345,
  code: "ST_1345",
  name: "Mass Mage Bane",
  description: "Removes buffs that increase M. Atk and Casting Spd. from nearby enemies. Эффект Mass Mage Bane, кастуется на себя, действует на врагов в радиусе 200 вокруг себя: - Снимает все баффы увеличения магической атаки с вероятностью 40%. - Снимает все баффы увеличения скорости колдовства с вероятностью 40%.",
  category: "debuff",
  powerType: "none",
  icon: "/skills/skill1345.gif",
  target: "enemy",
  scope: "area",
  castTime: 4,
  cooldown: 30,
  levels: [{ level: 1, requiredLevel: 78, spCost: 21000000, mpCost: 107, power: 0 }],
};
