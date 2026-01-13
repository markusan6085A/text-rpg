import { SkillDefinition } from "../../../types";

// Summon Big Boom - summons Big Boom that self-destructs
// XML: mpConsume: 74 82 88 94 100, hitTime: 6000, reuseDelay: 20000
export const skill_0301: SkillDefinition = {
  id: 301,
  code: "WS_0301",
  name: "Summon Big Boom",
  description: "Summons a Big Boom that self-destructs by explosion. Summoning it requires 3 Crystals: D-Grade. Afterwards 5 additional crystals will be consumed at a regular interval for 4 times. 30% of acquired Exp will be consumed.\n\nПризывает Большой Бум, который самоуничтожается взрывом. При призыве требуется 3 Кристалла: D-класса. После этого 5 дополнительных кристаллов будут потребляться через регулярные интервалы четыре раза. Потребляется 30% полученного опыта.",
  icon: "/skills/skill0301.gif",
  category: "special",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 6,
  cooldown: 20,
  levels: [
    { level: 1, requiredLevel: 58, spCost: 270000, mpCost: 74, power: 0 },
    { level: 2, requiredLevel: 62, spCost: 400000, mpCost: 82, power: 0 },
    { level: 3, requiredLevel: 66, spCost: 780000, mpCost: 88, power: 0 },
    { level: 4, requiredLevel: 70, spCost: 850000, mpCost: 94, power: 0 },
    { level: 5, requiredLevel: 74, spCost: 2300000, mpCost: 100, power: 0 },
  ],
};

