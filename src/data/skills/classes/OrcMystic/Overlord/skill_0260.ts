import { SkillDefinition } from "../../../types";

// Hammer Crush - physical attack skill that stuns the target
export const skill_0260: SkillDefinition = {
  id: 260,
  code: "OL_0260",
  name: "Hammer Crush",
  description: "A stunning blow that inflicts great pain. Target is dazed. The target cannot be stunned, shocked or dazed again while this is in effect. Usable when a blunt weapon is equipped. Over-hit possible. Power 123-229.\n\nОглушающий удар, наносящий сильную боль. Цель оглушена. Цель не может быть оглушена, шокирована или ошеломлена снова, пока действует этот эффект. Используется при экипировке дробящего оружия. Возможен овер-хит.",
  icon: "/skills/skill0260.gif",
  category: "physical_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 1.08,
  cooldown: 13,
  duration: 9,
  chance: 50,
  effects: [
    { stat: "stunResist", mode: "multiplier", multiplier: 0 }, // Effectively stuns
  ],
  levels: [
    { level: 1, requiredLevel: 40, spCost: 7200, mpCost: 40, power: 123 },
    { level: 2, requiredLevel: 40, spCost: 7200, mpCost: 41, power: 131 },
    { level: 3, requiredLevel: 40, spCost: 7200, mpCost: 43, power: 139 },
    { level: 4, requiredLevel: 44, spCost: 9300, mpCost: 43, power: 148 },
    { level: 5, requiredLevel: 44, spCost: 9300, mpCost: 44, power: 157 },
    { level: 6, requiredLevel: 44, spCost: 9300, mpCost: 45, power: 166 },
    { level: 7, requiredLevel: 48, spCost: 13000, mpCost: 47, power: 175 },
    { level: 8, requiredLevel: 48, spCost: 13000, mpCost: 48, power: 185 },
    { level: 9, requiredLevel: 48, spCost: 13000, mpCost: 49, power: 196 },
    { level: 10, requiredLevel: 52, spCost: 21000, mpCost: 51, power: 206 },
    { level: 11, requiredLevel: 52, spCost: 21000, mpCost: 52, power: 217 },
    { level: 12, requiredLevel: 52, spCost: 21000, mpCost: 54, power: 229 },
  ],
};

