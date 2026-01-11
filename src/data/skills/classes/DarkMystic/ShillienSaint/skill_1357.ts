import { SkillDefinition } from "../../../types";

// Prophecy of Wind - from XML
// absorbDam +5 (damage absorption)
// accCombat +4 (accuracy)
// rEvas +4 (evasion)
// pAtkSpd 1.20 (+20% attack speed)
// cAtk 1.2 (critical damage from behind) - handled by game logic
// rCrit 1.2 (critical rate from behind) - handled by game logic
// debuffVuln 0.9 (-10% debuff vulnerability)
export const skill_1357: SkillDefinition = {
  id: 1357,
  code: "DMS_1357",
  name: "Prophecy of Wind",
  description: "The spirit of an ancient assassin temporarily possesses the user. Consumes 5 spirit ores.\n\nДух древнего убийцы временно овладевает пользователем. Потребляет 5 Spirit Ore. Увеличивает Accuracy на 4, Evasion на 4, скорость атаки на 20%, поглощение урона на 5, критический урон и шанс ззаду на 20%, сопротивление к дебаффам на 10%.",
  icon: "/skills/skill1357.gif",
  category: "buff",
  powerType: "none",
  target: "ally",
  scope: "single",
  castTime: 4,
  cooldown: 120,
  duration: 300, // 5 minutes
  effects: [
    { stat: "accuracy", mode: "flat", value: 4 }, // accCombat +4
    { stat: "evasion", mode: "flat", value: 4 }, // rEvas +4
    { stat: "attackSpeed", mode: "multiplier", multiplier: 1.20 }, // pAtkSpd 1.20
    { stat: "vampirism", mode: "flat", value: 5 }, // absorbDam +5
    { stat: "debuffResist", mode: "multiplier", multiplier: 1.1 }, // +10% debuff resistance (0.9 vuln = 1.1 resist)
    // cAtk 1.2 and rCrit 1.2 from behind are handled by game logic
  ],
  stackType: "CoV",
  stackOrder: 1,
  levels: [
    {
      level: 1,
      requiredLevel: 78,
      spCost: 32000000,
      mpCost: 57,
      power: 0,
    },
  ],
};

