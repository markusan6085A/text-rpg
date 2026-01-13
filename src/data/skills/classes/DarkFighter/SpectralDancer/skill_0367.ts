import { SkillDefinition } from "../../../types";

// Dance of Medusa - dances to summon the phantom of Medusa, instantly throws nearby enemies into a state of fossilization
export const skill_0367: SkillDefinition = {
  id: 367,
  code: "SD_0367",
  name: "Dance of Medusa",
  description: "Dances to summon the phantom of Medusa. Instantly throws the nearby enemies into a state of fossilization. Usable when one is equipped with a dual-sword type weapon.\n\nТанцует, чтобы призвать фантом Медузы. Мгновенно вводит ближайших врагов в состояние окаменения. Доступно при экипировке парного меча.",
  icon: "/skills/skill0367.gif",
  category: "debuff",
  powerType: "damage",
  target: "enemy",
  scope: "area",
  castTime: 2,
  cooldown: 120,
  duration: 30, // Petrification duration
  chance: 40, // Success rate depends on WIT stat
  element: "earth",
  effects: [
    { stat: "paralyzeResist", mode: "multiplier", multiplier: 0 }, // Effectively petrifies target (similar to paralysis)
    { stat: "pAtk", mode: "multiplier", multiplier: 0 }, // Disables physical attack
    { stat: "mAtk", mode: "multiplier", multiplier: 0 }, // Disables magic attack
    { stat: "mpRegen", mode: "multiplier", multiplier: 0 }, // Disables MP regeneration
    { stat: "hpRegen", mode: "multiplier", multiplier: 0 }, // Disables HP regeneration
    { stat: "runSpeed", mode: "multiplier", multiplier: 0 }, // Disables movement
  ],
  levels: [
    { level: 1, requiredLevel: 77, spCost: 20000000, mpCost: 105, power: 40 }, // File shows 105 (0 + 105)
  ],
};

