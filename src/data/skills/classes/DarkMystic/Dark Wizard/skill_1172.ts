import { SkillDefinition } from "../../../types";

// Aura Burn - 8 levels from XML
// power: 19.0, 21.0, 24.0, 25.0, 28.0, 30.0, 33.0, 36.0
// mpConsume: 14, 16, 17, 18, 20, 21, 23, 24
// mpConsume_Init: 4, 4, 5, 5, 5, 6, 6, 6
const auraBurnPower = [19.0, 21.0, 24.0, 25.0, 28.0, 30.0, 33.0, 36.0];
const auraBurnMp = [14, 16, 17, 18, 20, 21, 23, 24];
const auraBurnMpInit = [4, 4, 5, 5, 5, 6, 6, 6];
const auraBurnMagicLvl = [17, 20, 23, 25, 28, 30, 33, 35];

export const skill_1172: SkillDefinition = {
  id: 1172,
  code: "DW_1172",
  name: "Aura Burn",
  description: "A short range magical attack. Power 19-36.\n\nМагическая атака силой 19-36, кастуется на врагов, действует в пределах дальности 150.",
  icon: "/skills/skill1172.gif",
  category: "magic_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 1.5,
  cooldown: 2.5,
  levels: auraBurnPower.map((power, index) => ({
    level: index + 1,
    requiredLevel: auraBurnMagicLvl[index],
    spCost: index < 2 ? 1600 : index < 4 ? 2900 : index < 6 ? 5500 : index < 7 ? 9300 : 18000,
    mpCost: auraBurnMpInit[index] + auraBurnMp[index],
    power,
  })),
};

