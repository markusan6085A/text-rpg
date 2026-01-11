import { SkillDefinition } from "../../../types";

// Seed of Wind
export const skill_1287: SkillDefinition = {
  id: 1287,
  code: "SS_1287",
  name: "Seed of Wind",
  description: "Places a Wind Seed on the target. The seed will explode when hit by a Wind-based skill.\n\nНакладывает Семя Ветра на цель. Семя взорвется при попадании ветряным заклинанием.",
  icon: "/skills/skill1287.gif",
  category: "special",
  powerType: "none",
  target: "enemy",
  scope: "single",
  castTime: 4,
  cooldown: 3600, // 1 hour reuse
  duration: 5,
  levels: [
    { level: 1, requiredLevel: 76, spCost: 10000000, mpCost: 250, power: 0 },
  ],
};

