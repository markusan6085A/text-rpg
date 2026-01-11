import { SkillDefinition } from "../../../types";

// Lethal Blow - potentially deadly attack
export const skill_0344: SkillDefinition = {
  id: 344,
  code: "WR_0344",
  name: "Lethal Blow",
  description: "A potentially deadly attack. Usable when one is equipped with a dagger. Power 5773.\n\nПотенциально смертельная атака. Сила 5773. Требуется кинжал. В PvE есть шанс снизить HP до 1, в PvP - CP до 1 и HP до 6%.",
  icon: "/skills/skill0344.gif",
  category: "physical_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 1.8,
  cooldown: 15,
  levels: [
    { level: 1, requiredLevel: 76, spCost: 15000000, mpCost: 85, power: 5773 },
  ],
};

